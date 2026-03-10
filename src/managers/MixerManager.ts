/**
 * Mixer management class
 * Handles dual-track DJ-style mixing with crossfader, EQs, and Filters
 * @module managers/MixerManager
 */

import { EventEmitter } from '@utils/EventEmitter';
import { errorHandler } from '@utils/ErrorHandler';
import { decodeAudioFile } from '@utils/AudioDecoder';
import type { AudioMetadata } from '@types';

interface InternalTrackNodes {
  eqHigh: BiquadFilterNode | null;
  eqMid: BiquadFilterNode | null;
  eqLow: BiquadFilterNode | null;
  filter: BiquadFilterNode | null; // Color FX (Lowpass/Highpass)
  volume: GainNode | null; // Channel specific volume
}

interface TrackState {
  audioBuffer: AudioBuffer | null;
  bufferSource: AudioBufferSourceNode | null;
  // Connection Graph: Source -> EQ -> Filter -> ChannelVol -> GainNode(Crossfader) -> Master
  nodes: InternalTrackNodes;
  gainNode: GainNode | null; // This acts as the crossfade-controlled gain
  isPlaying: boolean;
  isPaused: boolean;
  startTime: number;
  pauseTime: number;
  metadata: AudioMetadata | null;
  waveformGenerated: boolean;
  playbackRate: number; // Playback rate for BPM/Tempo matching
}

export class MixerManager extends EventEmitter {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;

  // Master output
  private masterGain: GainNode | null = null;

  // Track A and Track B
  private trackA: TrackState = this.createEmptyTrack();
  private trackB: TrackState = this.createEmptyTrack();

  // Crossfader position (-1 = full A, 0 = center, 1 = full B)
  private crossfaderPosition: number = -1;



  constructor() {
    super();
    this.initialize();
  }

  /**
   * Get the audio analyzer node
   */
  public getAnalyzer(): AnalyserNode | null {
    // Currently we only have a master analyzer
    return this.analyser;
  }

  private initialize(): void {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 256;

      // Create master gain
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.context.destination);

      console.log('🎛️ MixerManager initialized with Enhanced Audio Graph');
    } catch (error) {
      errorHandler.audioInitFailed(error as Error);
    }
  }

  private createEmptyTrack(): TrackState {
    return {
      audioBuffer: null,
      bufferSource: null,
      nodes: {
        eqHigh: null,
        eqMid: null,
        eqLow: null,
        filter: null,
        volume: null
      },
      gainNode: null,
      isPlaying: false,
      isPaused: false,
      startTime: 0,
      pauseTime: 0,
      metadata: null,
      waveformGenerated: false,
      playbackRate: 1.0
    };
  }

  /**
   * Initialize nodes for a track if they don't exist
   */
  private setupTrackNodes(trackState: TrackState): void {
    if (!this.context || !this.masterGain) return;

    // Create Nodes if missing
    if (!trackState.nodes.eqHigh) {
      trackState.nodes.eqHigh = this.context.createBiquadFilter();
      trackState.nodes.eqHigh.type = 'highshelf';
      trackState.nodes.eqHigh.frequency.value = 2500; // Standard High Shelf
      trackState.nodes.eqHigh.gain.value = 0;
    }
    if (!trackState.nodes.eqMid) {
      trackState.nodes.eqMid = this.context.createBiquadFilter();
      trackState.nodes.eqMid.type = 'peaking';
      trackState.nodes.eqMid.frequency.value = 1000; // Standard Mid Peak
      trackState.nodes.eqMid.Q.value = 1;
      trackState.nodes.eqMid.gain.value = 0;
    }
    if (!trackState.nodes.eqLow) {
      trackState.nodes.eqLow = this.context.createBiquadFilter();
      trackState.nodes.eqLow.type = 'lowshelf';
      trackState.nodes.eqLow.frequency.value = 320; // Standard Low Shelf
      trackState.nodes.eqLow.gain.value = 0;
    }
    if (!trackState.nodes.filter) {
      trackState.nodes.filter = this.context.createBiquadFilter();
      // Start neutral (All pass effect effectively)
      trackState.nodes.filter.type = 'lowpass';
      trackState.nodes.filter.frequency.value = 20000; // Fully open
      trackState.nodes.filter.Q.value = 1;
    }
    if (!trackState.nodes.volume) {
      trackState.nodes.volume = this.context.createGain();
      trackState.nodes.volume.gain.value = 1.0; // Max volume
    }
    if (!trackState.gainNode) {
      trackState.gainNode = this.context.createGain();
      trackState.gainNode.connect(this.masterGain);
    }

    // Connect Chain: EQ High -> EQ Mid -> EQ Low -> Filter -> ChVolume -> CrossfaderGain
    trackState.nodes.eqHigh.connect(trackState.nodes.eqMid);
    trackState.nodes.eqMid.connect(trackState.nodes.eqLow);
    trackState.nodes.eqLow.connect(trackState.nodes.filter);
    trackState.nodes.filter.connect(trackState.nodes.volume);
    trackState.nodes.volume.connect(trackState.gainNode);
  }

  /**
   * Load audio file to Track A
   */
  public async loadTrackA(file: File): Promise<void> {
    await this.loadTrack(file, 'A');
  }

  /**
   * Load audio file to Track B
   */
  public async loadTrackB(file: File): Promise<void> {
    await this.loadTrack(file, 'B');
  }

  /**
   * Load audio file to specified track
   */
  private async loadTrack(file: File, track: 'A' | 'B'): Promise<void> {
    try {
      if (!this.context || !this.masterGain) {
        throw new Error('Audio context not initialized');
      }

      const trackState = track === 'A' ? this.trackA : this.trackB;

      // Resume audio context if suspended
      await this.resumeContext();

      // Stop current playback for this track
      this.stopTrack(track);

      // Setup processing chain
      this.setupTrackNodes(trackState);

      console.log(`🎵 Loading ${file.name} to Track ${track}...`);

      // Read and decode audio file with universal decoder
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await decodeAudioFile(this.context, arrayBuffer, file.name);

      trackState.audioBuffer = audioBuffer;
      trackState.metadata = {
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: '',
        duration: audioBuffer.duration
      };
      trackState.waveformGenerated = false;

      console.log(`✅ Track ${track} loaded: ${audioBuffer.duration.toFixed(2)}s`);

      // Emit event with audio buffer for waveform generation
      const eventName = track === 'A' ? 'track:loaded:a' : 'track:loaded:b';
      this.emit(eventName, {
        metadata: trackState.metadata,
        audioBuffer: audioBuffer
      });

    } catch (error) {
      console.error(`❌ Error loading Track ${track}:`, error);
      throw error;
    }
  }

  /**
   * Play Track A
   */
  public playTrackA(): void {
    this.playTrack('A');
  }

  /**
   * Play Track B
   */
  public playTrackB(): void {
    this.playTrack('B');
  }

  /**
   * Play specified track
   */
  private playTrack(track: 'A' | 'B'): void {
    if (!this.context || !this.masterGain) return;

    const trackState = track === 'A' ? this.trackA : this.trackB;

    if (!trackState.audioBuffer) {
      console.warn(`Track ${track} has no audio loaded`);
      return;
    }

    // Ensure nodes are setup
    this.setupTrackNodes(trackState);

    // Stop current source if playing
    if (trackState.bufferSource) {
      trackState.bufferSource.stop();
      trackState.bufferSource.disconnect();
    }

    // Create new buffer source
    trackState.bufferSource = this.context.createBufferSource();
    trackState.bufferSource.buffer = trackState.audioBuffer;
    trackState.bufferSource.loop = true;

    // Apply playback rate for BPM matching
    trackState.bufferSource.playbackRate.value = trackState.playbackRate;

    // Connect Source -> Graph Start (EQ High)
    if (trackState.nodes.eqHigh) {
      trackState.bufferSource.connect(trackState.nodes.eqHigh);
    }

    // Set initial gain based on crossfader
    this.updateGains();

    // Start playback
    const offset = trackState.isPaused ? trackState.pauseTime : 0;
    trackState.bufferSource.start(0, offset);
    trackState.startTime = this.context.currentTime - offset;
    trackState.isPlaying = true;
    trackState.isPaused = false;

    console.log(`▶️ Track ${track} playing (rate: ${trackState.playbackRate.toFixed(2)}x)`);
    this.emit('mixer:playing', { trackA: this.trackA.isPlaying, trackB: this.trackB.isPlaying });
  }

  /**
   * Pause specified track
   */
  private pauseTrack(track: 'A' | 'B'): void {
    if (!this.context) return;
    const trackState = track === 'A' ? this.trackA : this.trackB;

    if (!trackState.isPlaying) return;

    if (trackState.bufferSource) {
      trackState.pauseTime = this.context.currentTime - trackState.startTime;
      trackState.bufferSource.stop();
      trackState.bufferSource.disconnect();
      trackState.bufferSource = null;
    }

    trackState.isPlaying = false;
    trackState.isPaused = true;
    console.log(`⏸️ Track ${track} paused`);
    this.emit('mixer:playing', { trackA: this.trackA.isPlaying, trackB: this.trackB.isPlaying });
  }

  public pauseTrackA(): void { this.pauseTrack('A'); }
  public pauseTrackB(): void { this.pauseTrack('B'); }

  /**
   * Stop specified track
   */
  private stopTrack(track: 'A' | 'B'): void {
    const trackState = track === 'A' ? this.trackA : this.trackB;

    if (trackState.bufferSource) {
      try {
        trackState.bufferSource.stop();
      } catch (e) { }
      trackState.bufferSource.disconnect();
      trackState.bufferSource = null;
    }

    trackState.isPlaying = false;
    trackState.isPaused = false;
    trackState.pauseTime = 0;
    trackState.startTime = 0;

    this.emit('mixer:playing', { trackA: this.trackA.isPlaying, trackB: this.trackB.isPlaying });
  }

  public stopTrackA(): void { this.stopTrack('A'); }
  public stopTrackB(): void { this.stopTrack('B'); }

  public toggleTrackA(): void { this.trackA.isPlaying ? this.pauseTrackA() : this.playTrackA(); }
  public toggleTrackB(): void { this.trackB.isPlaying ? this.pauseTrackB() : this.playTrackB(); }

  // ========== CONTROLS ==========

  /**
   * Set Channel Volume
   * @param track 'A' or 'B'
   * @param value 0.0 to 1.0
   */
  public setChannelVolume(track: 'A' | 'B', value: number): void {
    const trackState = track === 'A' ? this.trackA : this.trackB;
    if (trackState.nodes.volume) {
      trackState.nodes.volume.gain.value = Math.max(0, Math.min(2, value)); // Allow slight boost up to 2x? Standard is 1.0
    }
  }

  /**
   * Set EQ Value
   * @param track 'A' or 'B'
   * @param band 'low' | 'mid' | 'high'
   * @param value Gain value in dB (-26 to +6 is standard DJ range)
   */
  public setEQ(track: 'A' | 'B', band: 'low' | 'mid' | 'high', value: number): void {
    const trackState = track === 'A' ? this.trackA : this.trackB;
    const node = band === 'high' ? trackState.nodes.eqHigh :
      band === 'mid' ? trackState.nodes.eqMid : trackState.nodes.eqLow;

    if (node) {
      // Clamp safe values, typically DJs use -Infinity to +6dB.
      // WebAudio simple implementation: -40dB to +12dB
      node.gain.value = value;
    }
  }

  /**
   * Set Filter (Sound Color FX)
   * @param track 'A' or 'B'
   * @param value -1 (Lowpass) to 1 (Highpass), 0 is Neutral
   */
  public setFilter(track: 'A' | 'B', value: number): void {
    const trackState = track === 'A' ? this.trackA : this.trackB;
    const node = trackState.nodes.filter;
    if (!node || !this.context) return;

    const clamped = Math.max(-1, Math.min(1, value));

    // Filter Logic:
    // Center (0) -> All pass (Effectively)
    // Left (-1 to 0) -> Low Pass (Cut Highs)
    // Right (0 to 1) -> High Pass (Cut Lows)

    if (Math.abs(clamped) < 0.05) {
      // Neutral
      node.frequency.value = clamped > 0 ? 0 : 22050; // Depending on type, but easier to just reset
      // Actually, switching types causes artifacts. Better to slide frequency.
      // Setup for Lowpass at max freq is open.
      if (node.type !== 'lowpass') node.type = 'lowpass';
      node.frequency.value = 22050;
      node.Q.value = 1;
    } else if (clamped < 0) {
      // LOW PASS (Sweep down from 20k to ~100Hz)
      if (node.type !== 'lowpass') node.type = 'lowpass';
      // value is -0.05 to -1. 
      // Map -0.05 -> 20000, -1 -> 200
      // Logarithmic sweep preferred
      const minFreq = 100;
      const maxFreq = 20000;
      const factor = Math.abs(clamped); // 0 to 1
      // Simple exp curve
      const freq = maxFreq * Math.pow(minFreq / maxFreq, factor);
      node.frequency.value = freq;
      node.Q.value = 1 + (factor * 2); // Add resonance
    } else {
      // HIGH PASS (Sweep up from 20Hz to ~10k)
      if (node.type !== 'highpass') node.type = 'highpass';
      // value is 0.05 to 1
      const minFreq = 20;
      const maxFreq = 10000;
      const factor = clamped; // 0 to 1
      const freq = minFreq * Math.pow(maxFreq / minFreq, factor);
      node.frequency.value = freq;
      node.Q.value = 1 + (factor * 2);
    }
  }

  /**
   * Set Playback Rate (Tempo/Pitch)
   * @param track 'A' or 'B'
   * @param rate 1.0 is normal, 0.5 is half, 2.0 is double
   */
  public setPlaybackRate(track: 'A' | 'B', rate: number): void {
    const trackState = track === 'A' ? this.trackA : this.trackB;
    trackState.playbackRate = rate;
    if (trackState.bufferSource) {
      trackState.bufferSource.playbackRate.value = rate;
    }
  }


  /**
   * Set crossfader position (-1 to 1)
   */
  public setCrossfader(position: number): void {
    this.crossfaderPosition = Math.max(-1, Math.min(1, position));
    this.updateGains();
    this.emit('mixer:crossfader', this.crossfaderPosition);
  }

  /**
   * Update gain levels based on crossfader position
   */
  private updateGains(): void {
    if (!this.trackA.gainNode || !this.trackB.gainNode) return;

    // Constant power crossfade curve
    const position = this.crossfaderPosition; // -1 to 1
    const normalized = (position + 1) / 2; // 0 to 1

    // Equal power crossfade
    const gainA = Math.cos(normalized * Math.PI / 2);
    const gainB = Math.sin(normalized * Math.PI / 2);

    this.trackA.gainNode.gain.value = gainA;
    this.trackB.gainNode.gain.value = gainB;
  }

  /**
   * Set master volume (0 to 1)
   */
  public setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get frequency data for visualization
   */
  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Get frequency bands (low, mid, high)
   */
  public getFrequencyBands(): { low: number; mid: number; high: number } {
    const data = this.getFrequencyData();
    if (data.length === 0) {
      return { low: 0, mid: 0, high: 0 };
    }

    const lowEnd = Math.floor(data.length * 0.15);
    const midEnd = Math.floor(data.length * 0.5);

    const low = data.slice(0, lowEnd).reduce((a, b) => a + b, 0) / lowEnd;
    const mid = data.slice(lowEnd, midEnd).reduce((a, b) => a + b, 0) / (midEnd - lowEnd);
    const high = data.slice(midEnd).reduce((a, b) => a + b, 0) / (data.length - midEnd);

    return { low, mid, high };
  }

  private async resumeContext(): Promise<void> {
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  public isPlaying(): boolean {
    return this.trackA.isPlaying || this.trackB.isPlaying;
  }

  public getTrackMetadata(track: 'A' | 'B'): AudioMetadata | null {
    return track === 'A' ? this.trackA.metadata : this.trackB.metadata;
  }

  public getTrackAPosition(): number {
    if (!this.context || !this.trackA.audioBuffer || !this.trackA.isPlaying) return 0;
    const elapsed = this.context.currentTime - this.trackA.startTime;
    const duration = this.trackA.audioBuffer.duration;
    return (elapsed % duration) / duration;
  }

  public getTrackBPosition(): number {
    if (!this.context || !this.trackB.audioBuffer || !this.trackB.isPlaying) return 0;
    const elapsed = this.context.currentTime - this.trackB.startTime;
    const duration = this.trackB.audioBuffer.duration;
    return (elapsed % duration) / duration;
  }

  // Clean up
  public dispose(): void {
    this.stopTrack('A');
    this.stopTrack('B');
    if (this.context) this.context.close();
    this.removeAllListeners();
  }
}
