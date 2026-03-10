# 🔄 Complete Refactoring Guide

## Overview

This guide provides a complete step-by-step refactoring plan to transform the Mandala Machine from a **B+ (73/100)** monolithic codebase to an **S+ (95+/100)** professional-grade application.

## Current Status vs Target

### Current (B+)
- ❌ Single 3015-line file
- ❌ 30+ global variables
- ❌ No type safety
- ❌ Minimal error handling
- ❌ No tests
- ❌ Poor performance optimization
- ✅ Good functionality

### Target (S+)
- ✅ Modular architecture (10-20 files, 100-300 lines each)
- ✅ Zero global variables (class-based state)
- ✅ Full TypeScript with strict mode
- ✅ Comprehensive error handling
- ✅ 80%+ test coverage
- ✅ Optimized rendering pipeline
- ✅ Professional documentation

## Phase 1: Foundation (Week 1)

### ✅ Completed
- [x] TypeScript configuration
- [x] Type definitions
- [x] Constants extraction
- [x] Error handling system
- [x] Event emitter
- [x] Helper utilities
- [x] Project structure
- [x] README documentation

### 🔄 In Progress
- [ ] SceneManager (partially complete)
- [ ] Updated package.json with all tools

## Phase 2: Core Managers (Week 2)

### AudioManager Implementation

**File**: `src/managers/AudioManager.ts`

```typescript
import { EventEmitter } from '@utils/EventEmitter';
import { errorHandler } from '@utils/ErrorHandler';
import { AUDIO_CONFIG, FREQUENCY_BANDS } from '@constants/config';
import type { AudioSourceType, FrequencyBands, AudioMetadata } from '@types/index';

export class AudioManager extends EventEmitter {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private currentSource: AudioSourceType = null;

  // Microphone
  private microphoneStream: MediaStream | null = null;
  private microphoneSource: MediaStreamAudioSourceNode | null = null;

  // File upload
  private audioElement: HTMLAudioElement | null = null;
  private audioSource: MediaElementAudioSourceNode | null = null;

  // BPM detection
  private estimatedBPM: number = AUDIO_CONFIG.DEFAULT_BPM;
  private beatHistory: number[] = [];
  private peakHistory: number[] = [];
  private lastBeatTime: number = 0;

  constructor() {
    super();
    this.initialize();
  }

  private initialize(): void {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = AUDIO_CONFIG.FFT_SIZE;
      this.analyser.connect(this.context.destination);
    } catch (error) {
      errorHandler.audioInitFailed(error as Error);
    }
  }

  public async startMicrophone(): Promise<boolean> {
    try {
      if (!this.context || !this.analyser) {
        throw new Error('Audio context not initialized');
      }

      // Stop existing sources
      this.stopAll();

      // Request microphone access
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Get device label
      let deviceLabel = 'Live Audio';
      try {
        const audioTrack = this.microphoneStream.getAudioTracks()[0];
        if (audioTrack && audioTrack.label) {
          deviceLabel = audioTrack.label;
        }
      } catch (e) {
        console.log('Could not get device label:', e);
      }

      // Connect to analyser
      this.microphoneSource = this.context.createMediaStreamSource(this.microphoneStream);
      this.microphoneSource.connect(this.analyser);

      this.currentSource = 'microphone';
      this.emit('audio:playing', true);

      return true;
    } catch (error) {
      errorHandler.microphoneAccessDenied(error as Error);
      return false;
    }
  }

  public stopMicrophone(): void {
    if (this.microphoneSource) {
      this.microphoneSource.disconnect();
      this.microphoneSource = null;
    }

    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }

    if (this.currentSource === 'microphone') {
      this.currentSource = null;
      this.emit('audio:playing', false);
    }
  }

  public async loadAudioFile(file: File): Promise<void> {
    try {
      if (!this.context || !this.analyser) {
        throw new Error('Audio context not initialized');
      }

      // Stop existing sources
      this.stopAll();

      const url = URL.createObjectURL(file);
      this.audioElement = new Audio(url);

      // Create audio source
      if (!this.audioSource) {
        this.audioSource = this.context.createMediaElementSource(this.audioElement);
        this.audioSource.connect(this.analyser);
      }

      this.currentSource = 'file';

      // Extract metadata
      const metadata = await this.extractMetadata(file);
      this.emit('audio:metadata', metadata);

      // Auto-play
      await this.audioElement.play();
      this.emit('audio:playing', true);

    } catch (error) {
      errorHandler.fileLoadFailed(file.name, error as Error);
    }
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(0);
    }

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public getFrequencyBands(): FrequencyBands {
    const dataArray = this.getFrequencyData();
    const bufferLength = dataArray.length;

    const lowEnd = Math.floor(bufferLength * FREQUENCY_BANDS.LOW_END);
    const midEnd = Math.floor(bufferLength * FREQUENCY_BANDS.MID_END);

    let low = 0, mid = 0, high = 0;

    for (let i = 0; i < lowEnd; i++) low += dataArray[i];
    low /= lowEnd;

    for (let i = lowEnd; i < midEnd; i++) mid += dataArray[i];
    mid /= (midEnd - lowEnd);

    for (let i = midEnd; i < bufferLength; i++) high += dataArray[i];
    high /= (bufferLength - midEnd);

    return { low, mid, high };
  }

  public detectBPM(): void {
    if (!this.analyser) return;

    const dataArray = this.getFrequencyData();
    const bufferLength = dataArray.length;

    // Calculate bass average
    const bassRange = Math.floor(bufferLength * FREQUENCY_BANDS.LOW_END);
    let bassSum = 0;
    for (let i = 0; i < bassRange; i++) {
      bassSum += dataArray[i];
    }
    const bassAverage = bassSum / bassRange;

    // Update peak history
    this.peakHistory.push(bassAverage);
    if (this.peakHistory.length > AUDIO_CONFIG.PEAK_HISTORY_SIZE) {
      this.peakHistory.shift();
    }

    // Calculate dynamic threshold
    const avg = this.peakHistory.reduce((a, b) => a + b, 0) / this.peakHistory.length;
    const variance = this.peakHistory.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / this.peakHistory.length;
    const stdDev = Math.sqrt(variance);
    const threshold = avg + stdDev * AUDIO_CONFIG.BASS_THRESHOLD_MULTIPLIER;

    const currentTime = Date.now();

    // Detect beat
    if (
      bassAverage > threshold &&
      bassAverage > AUDIO_CONFIG.MIN_BASS_AVERAGE &&
      currentTime - this.lastBeatTime > AUDIO_CONFIG.BEAT_MIN_INTERVAL_MS
    ) {
      const timeSinceLastBeat = currentTime - this.lastBeatTime;

      if (
        this.lastBeatTime > 0 &&
        timeSinceLastBeat >= AUDIO_CONFIG.BEAT_VALID_RANGE_MS.min &&
        timeSinceLastBeat <= AUDIO_CONFIG.BEAT_VALID_RANGE_MS.max
      ) {
        // Add to beat history
        this.beatHistory.push(timeSinceLastBeat);
        if (this.beatHistory.length > AUDIO_CONFIG.BEAT_HISTORY_SIZE) {
          this.beatHistory.shift();
        }

        // Calculate BPM using median
        if (this.beatHistory.length >= 4) {
          const sorted = [...this.beatHistory].sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)];
          const detectedBPM = 60000 / median;

          // Validate BPM range
          if (detectedBPM >= AUDIO_CONFIG.MIN_BPM && detectedBPM <= AUDIO_CONFIG.MAX_BPM) {
            // Apply smoothing
            this.estimatedBPM =
              this.estimatedBPM * (1 - AUDIO_CONFIG.BPM_SMOOTHING_FACTOR) +
              detectedBPM * AUDIO_CONFIG.BPM_SMOOTHING_FACTOR;

            this.emit('audio:bpm-detected', Math.round(this.estimatedBPM));
          }
        }
      }
      this.lastBeatTime = currentTime;
    }
  }

  public getEstimatedBPM(): number {
    return Math.round(this.estimatedBPM);
  }

  public getCurrentSource(): AudioSourceType {
    return this.currentSource;
  }

  public stopAll(): void {
    this.stopMicrophone();

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }

    this.currentSource = null;
    this.emit('audio:playing', false);
  }

  private async extractMetadata(file: File): Promise<AudioMetadata> {
    // Implementation of ID3 tag parsing
    // (Use existing logic from visualizer.js)
    return { title: null, artist: null };
  }

  public dispose(): void {
    this.stopAll();

    if (this.context) {
      this.context.close();
      this.context = null;
    }

    this.removeAllListeners();
  }
}
```

### InstanceManager Implementation

**File**: `src/managers/InstanceManager.ts`

```typescript
import { EventEmitter } from '@utils/EventEmitter';
import { generateRandomPosition, deepClone } from '@utils/helpers';
import { INSTANCE_CONFIG, MULTIPLIER_DEFAULTS } from '@constants/config';
import type { ObjectInstance, Position3D, Rotation3D, RGBColor, PresetData } from '@types/index';

export class InstanceManager extends EventEmitter {
  private instances: ObjectInstance[] = [];
  private nextId: number = 0;
  private maxObjects: number = MULTIPLIER_DEFAULTS.MAX_OBJECTS;
  private spacingMultiplier: number = MULTIPLIER_DEFAULTS.SPACING;

  constructor() {
    super();
  }

  public addInstance(
    materialIndex: number,
    options?: Partial<ObjectInstance>
  ): ObjectInstance {
    // Generate non-overlapping position
    const existingPositions = this.instances.map(inst => inst.position);
    const position = generateRandomPosition(
      this.spacingMultiplier,
      existingPositions
    );

    const instance: ObjectInstance = {
      id: this.nextId++,
      materialIndex,
      position,
      rotation: { x: 0, y: 0, z: 0 },
      scale: INSTANCE_CONFIG.DEFAULT_SCALE,
      wireframe: INSTANCE_CONFIG.DEFAULT_WIREFRAME,
      pinned: INSTANCE_CONFIG.DEFAULT_PINNED,
      color: null,
      ...options,
    };

    // Enforce max objects limit
    const nonMediaCount = this.instances.filter(inst => !inst.mediaData).length;
    if (nonMediaCount >= this.maxObjects && !instance.mediaData) {
      const oldest = this.instances.find(inst => !inst.mediaData);
      if (oldest) {
        this.removeInstance(oldest.id);
      }
    }

    this.instances.push(instance);
    this.emit('instance:added', instance);

    return instance;
  }

  public removeInstance(instanceId: number): boolean {
    const index = this.instances.findIndex(inst => inst.id === instanceId);

    if (index === -1) {
      console.error(`Instance ${instanceId} not found`);
      return false;
    }

    this.instances.splice(index, 1);
    this.emit('instance:removed', instanceId);

    return true;
  }

  public duplicateInstance(instanceId: number): ObjectInstance | null {
    const original = this.instances.find(inst => inst.id === instanceId);
    if (!original) return null;

    const duplicate: ObjectInstance = {
      ...deepClone(original),
      id: this.nextId++,
      position: {
        x: original.position.x + INSTANCE_CONFIG.DUPLICATE_OFFSET,
        y: original.position.y + INSTANCE_CONFIG.DUPLICATE_OFFSET,
        z: original.position.z,
      },
      pinned: false,
    };

    this.instances.push(duplicate);
    this.emit('instance:added', duplicate);

    return duplicate;
  }

  public updateInstance(instanceId: number, updates: Partial<ObjectInstance>): boolean {
    const instance = this.instances.find(inst => inst.id === instanceId);

    if (!instance) {
      console.error(`Instance ${instanceId} not found`);
      return false;
    }

    Object.assign(instance, updates);
    return true;
  }

  public getInstance(instanceId: number): ObjectInstance | null {
    return this.instances.find(inst => inst.id === instanceId) || null;
  }

  public getAllInstances(): ObjectInstance[] {
    return this.instances;
  }

  public clearAll(): void {
    this.instances = [];
    this.nextId = 0;
  }

  public setMaxObjects(max: number): void {
    this.maxObjects = Math.max(1, Math.min(10, max));
  }

  public getMaxObjects(): number {
    return this.maxObjects;
  }

  public togglePin(instanceId: number): boolean {
    const instance = this.getInstance(instanceId);
    if (!instance) return false;

    instance.pinned = !instance.pinned;
    return instance.pinned;
  }

  public moveToFront(instanceId: number): void {
    const index = this.instances.findIndex(inst => inst.id === instanceId);
    if (index !== -1) {
      const instance = this.instances.splice(index, 1)[0];
      this.instances.push(instance);
    }
  }

  public moveToBack(instanceId: number): void {
    const index = this.instances.findIndex(inst => inst.id === instanceId);
    if (index !== -1) {
      const instance = this.instances.splice(index, 1)[0];
      this.instances.unshift(instance);
    }
  }

  public moveForward(instanceId: number): void {
    const index = this.instances.findIndex(inst => inst.id === instanceId);
    if (index < this.instances.length - 1) {
      [this.instances[index], this.instances[index + 1]] =
        [this.instances[index + 1], this.instances[index]];
    }
  }

  public moveBackward(instanceId: number): void {
    const index = this.instances.findIndex(inst => inst.id === instanceId);
    if (index > 0) {
      [this.instances[index], this.instances[index - 1]] =
        [this.instances[index - 1], this.instances[index]];
    }
  }

  public dispose(): void {
    this.clearAll();
    this.removeAllListeners();
  }
}
```

## Phase 3: UI Components (Week 3)

Create modular UI components:

1. **ControlPanel.ts**: Bottom control bar
2. **SideMenu.ts**: Settings menu
3. **ContextMenu.ts**: Right-click menu
4. **PresetGrid.ts**: Object selection grid
5. **ColorPicker.ts**: Color selection modal

## Phase 4: Integration & Testing (Week 4)

1. Wire all managers together in `Application.ts`
2. Write unit tests for each manager
3. Write integration tests
4. Performance profiling and optimization
5. Documentation completion

## Implementation Checklist

### High Priority
- [ ] Complete AudioManager
- [ ] Complete InstanceManager
- [ ] Create MaterialsRegistry
- [ ] Create Application class
- [ ] Update index.html to use new structure

### Medium Priority
- [ ] Create UI components
- [ ] Implement PresetManager
- [ ] Add unit tests
- [ ] ESLint configuration
- [ ] Prettier configuration

### Low Priority
- [ ] Integration tests
- [ ] API documentation
- [ ] Architecture diagrams
- [ ] Contributing guidelines
- [ ] CI/CD setup

## Migration Strategy

### Option 1: Gradual Migration (Recommended)
1. Keep existing `visualizer.js` working
2. Implement new modules alongside
3. Gradually swap out functionality
4. Test each component individually
5. Final switchover when complete

### Option 2: Complete Rewrite
1. Build entire new structure
2. Test comprehensively
3. Single switchover
4. Higher risk but cleaner result

## Performance Targets

- **Initial Load**: < 2 seconds
- **Frame Rate**: Solid 60 FPS with 100+ objects
- **Audio Latency**: < 50ms
- **Memory Usage**: < 100MB
- **Bundle Size**: < 500KB (gzipped)

## Success Metrics

### Code Quality
- TypeScript strict mode: ✅ 100%
- Test coverage: ✅ 80%+
- ESLint warnings: ✅ 0
- Documentation: ✅ 100% of public APIs

### Architecture
- Max file size: ✅ < 300 lines
- Cyclomatic complexity: ✅ < 10 per function
- Coupling: ✅ Low (dependency injection)
- Cohesion: ✅ High (single responsibility)

### Performance
- Lighthouse score: ✅ 90+
- Core Web Vitals: ✅ All green
- FPS: ✅ 60 steady
- Memory leaks: ✅ None

## Next Steps

1. **Install dependencies**: `npm install`
2. **Type check**: `npm run type-check`
3. **Start implementing managers** following the patterns above
4. **Test each module** as you build
5. **Integrate gradually** with existing code

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Three.js Documentation](https://threejs.org/docs/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Clean Code Principles](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)

---

**This refactoring will transform the codebase from B+ to S+ level!** 🚀
