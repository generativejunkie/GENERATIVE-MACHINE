/**
 * Audio management class
 * Handles audio input, frequency analysis, and BPM detection
 * @module managers/AudioManager
 */

import { EventEmitter } from '@utils/EventEmitter';
import { errorHandler } from '@utils/ErrorHandler';
import { decodeAudioFile } from '@utils/AudioDecoder';
import { median, average, standardDeviation } from '@utils/helpers';
import { AUDIO_CONFIG, FREQUENCY_BANDS } from '@constants/config';
import type { AudioSourceType, FrequencyBands, AudioMetadata } from '@types';

export class AudioManager extends EventEmitter {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private currentSource: AudioSourceType = null;

  // Microphone
  private microphoneStream: MediaStream | null = null;
  private microphoneSource: MediaStreamAudioSourceNode | null = null;
  private microphoneGain: GainNode | null = null;

  // File upload (HTML Audio Element approach - legacy, not currently used)
  private audioElement: HTMLAudioElement | null = null;

  // File upload (AudioBuffer approach - more reliable)
  private audioBuffer: AudioBuffer | null = null;
  private bufferSource: AudioBufferSourceNode | null = null;

  // BPM detection
  private estimatedBPM: number = AUDIO_CONFIG.DEFAULT_BPM;
  private beatHistory: number[] = [];
  private peakHistory: number[] = [];
  private lastBassAverage: number = 0;
  private lastBeatTime: number = 0;
  private inputGainValue: number = 2.5; // Default boosted gain for Line-In

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

  public async getAvailableInputDevices(): Promise<MediaDeviceInfo[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      console.error('Error listing devices:', error);
      return [];
    }
  }

  public async startMicrophone(deviceId?: string): Promise<string | null> {
    try {
      // If switching device, stop current stream first
      if (this.microphoneStream && deviceId) {
        this.stopMicrophone();
      } else if (this.microphoneStream) {
        return 'Already Active';
      }

      await this.resumeContext();

      console.log(`🎤 Requesting microphone access... ${deviceId ? '(Device ID: ' + deviceId + ')' : '(Default)'}`);

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          deviceId: deviceId ? { exact: deviceId } : undefined
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      this.microphoneStream = stream;

      // Log the selected device
      const audioTrack = stream.getAudioTracks()[0];
      const deviceLabel = audioTrack?.label || 'Unknown Device';
      console.log('Using audio device:', deviceLabel);

      if (!this.context) return null;

      this.microphoneSource = this.context.createMediaStreamSource(stream);

      // Create Gain Node for volume control
      this.microphoneGain = this.context.createGain();
      this.microphoneGain.gain.value = this.inputGainValue; // Use stored gain value

      this.microphoneSource.connect(this.microphoneGain);

      if (this.analyser) {
        this.microphoneGain.connect(this.analyser);
      }

      this.currentSource = 'microphone';
      this.emit('audio:playing', true);

      return deviceLabel;
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      return null;
    }
  }

  /**
   * Set input gain (volume)
   */
  public setInputGain(value: number): void {
    console.log(`🎚️ AudioManager: Setting Gain to ${value}`);
    this.inputGainValue = value;
    if (this.microphoneGain) {
      this.microphoneGain.gain.value = value;
    } else {
      // Gain will be applied when startMicrophone() is called
      // console.warn('AudioManager: microphoneGain is null (mic not started?)');
    }
  }

  /**
   * Get current input gain
   */
  public getInputGain(): number {
    return this.inputGainValue;
  }

  public stopMicrophone(): void {
    if (this.microphoneGain) {
      this.microphoneGain.disconnect();
      this.microphoneGain = null;
    }

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

      console.log('🎵 AudioManager: Starting file load...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      await this.resumeContext();
      this.stopAll();

      // Read and decode audio file with universal decoder
      console.log('📖 Reading file as ArrayBuffer...');
      const arrayBuffer = await file.arrayBuffer();

      this.audioBuffer = await decodeAudioFile(this.context, arrayBuffer, file.name);

      this.currentSource = 'file';

      // Extract metadata
      await this.extractMetadata(file);

      // Play the audio buffer
      console.log('▶️ Starting playback...');
      this.playAudioBuffer();
      this.emit('audio:playing', true);
      console.log('✅ Audio playing successfully');

      return Promise.resolve();
    } catch (error) {
      console.error('❌ AudioManager loadAudioFile error:', error);
      errorHandler.fileLoadFailed(file.name, error as Error);
      throw error; // Re-throw so UIController can handle it
    }
  }

  private playAudioBuffer(): void {
    if (!this.context || !this.audioBuffer || !this.analyser) {
      console.error('Cannot play: missing context, buffer, or analyser');
      return;
    }

    // Stop any existing buffer source
    if (this.bufferSource) {
      try {
        this.bufferSource.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      this.bufferSource.disconnect();
    }

    // Create new buffer source
    this.bufferSource = this.context.createBufferSource();
    this.bufferSource.buffer = this.audioBuffer;
    this.bufferSource.loop = true; // Loop the audio
    this.bufferSource.connect(this.analyser);

    // Handle playback end
    this.bufferSource.onended = () => {
      console.log('🔚 Audio playback ended');
      this.emit('audio:playing', false);
    };

    // Start playback
    this.bufferSource.start(0);
    console.log('🎶 AudioBuffer playback started');
  }

  private async resumeContext(): Promise<void> {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
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

    if (bufferLength === 0) {
      return { low: 0, mid: 0, high: 0 };
    }

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

  public getEnergy(): number {
    if (!this.analyser) return 0;
    const dataArray = this.getFrequencyData();
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return (sum / dataArray.length) / 255;
  }

  public detectBPM(): void {
    if (!this.analyser) return;

    const dataArray = this.getFrequencyData();
    const bufferLength = dataArray.length;

    const bassRange = Math.floor(bufferLength * FREQUENCY_BANDS.LOW_END);
    let bassSum = 0;
    for (let i = 0; i < bassRange; i++) {
      bassSum += dataArray[i];
    }
    const bassAverage = bassSum / bassRange;

    // FLUX CALCULATION (Onset Detection)
    // Calculate the rise in energy compared to previous frame (Attack)
    let flux = bassAverage - this.lastBassAverage;
    if (flux < 0) flux = 0; // Ignore decay

    // Update history for next frame
    this.lastBassAverage = bassAverage;

    this.peakHistory.push(flux);
    if (this.peakHistory.length > AUDIO_CONFIG.PEAK_HISTORY_SIZE) {
      this.peakHistory.shift();
    }

    const avg = average(this.peakHistory);
    const stdDev = standardDeviation(this.peakHistory);

    // Dynamic Threshold based on Flux volatility
    const threshold = avg + stdDev * AUDIO_CONFIG.BASS_THRESHOLD_MULTIPLIER;

    const currentTime = Date.now();

    // Beat Condition: Flux spike > Dynamic Threshold
    // Explicitly checking flux > 5 to avoid noise in silence
    if (
      flux > threshold &&
      flux > 5 &&
      currentTime - this.lastBeatTime > AUDIO_CONFIG.BEAT_MIN_INTERVAL_MS * 0.8
    ) {
      const timeSinceLastBeat = currentTime - this.lastBeatTime;

      if (
        this.lastBeatTime > 0 &&
        timeSinceLastBeat >= AUDIO_CONFIG.BEAT_VALID_RANGE_MS.min &&
        timeSinceLastBeat <= AUDIO_CONFIG.BEAT_VALID_RANGE_MS.max
      ) {
        this.beatHistory.push(timeSinceLastBeat);
        if (this.beatHistory.length > AUDIO_CONFIG.BEAT_HISTORY_SIZE) {
          this.beatHistory.shift();
        }

        if (this.beatHistory.length >= 4) {
          const medianInterval = median(this.beatHistory);
          const detectedBPM = 60000 / medianInterval;

          if (detectedBPM >= AUDIO_CONFIG.MIN_BPM && detectedBPM <= AUDIO_CONFIG.MAX_BPM) {
            this.estimatedBPM =
              this.estimatedBPM * (1 - AUDIO_CONFIG.BPM_SMOOTHING_FACTOR) +
              detectedBPM * AUDIO_CONFIG.BPM_SMOOTHING_FACTOR;

            this.emit('audio:bpm-detected', Math.round(this.estimatedBPM));
          }
        }
      }
      this.lastBeatTime = currentTime;
      // High confidence beat
      this.emit('audio:beat', { time: currentTime, bpm: this.estimatedBPM });
    }
  }

  public getBassEnergy(): number {
    if (!this.analyser) return 0;
    const dataArray = this.getFrequencyData();
    const bufferLength = dataArray.length;
    const bassRange = Math.floor(bufferLength * FREQUENCY_BANDS.LOW_END);
    let bassSum = 0;
    for (let i = 0; i < bassRange; i++) {
      bassSum += dataArray[i];
    }
    return bassSum / bassRange;
  }

  public getEstimatedBPM(): number {
    return Math.round(this.estimatedBPM);
  }

  public getBeatInterval(): number {
    return 60000 / this.estimatedBPM;
  }

  public getCurrentSource(): AudioSourceType {
    return this.currentSource;
  }

  public isPlaying(): boolean {
    return this.currentSource !== null;
  }

  public async pauseAudio(): Promise<void> {
    if (!this.context) return;

    if (this.context.state === 'running') {
      await this.context.suspend();
      this.emit('audio:playing', false);
      console.log('⏸️  Audio paused');
    }
  }

  public async resumeAudio(): Promise<void> {
    if (!this.context) return;

    if (this.context.state === 'suspended') {
      await this.context.resume();
      this.emit('audio:playing', true);
      console.log('▶️  Audio resumed');
    }
  }

  public async togglePlayPause(): Promise<void> {
    if (!this.context) return;

    if (this.context.state === 'running') {
      await this.pauseAudio();
    } else if (this.context.state === 'suspended') {
      await this.resumeAudio();
    }
  }

  public stopAll(): void {
    this.stopMicrophone();

    // Stop HTML Audio Element
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }

    // Stop AudioBuffer playback
    if (this.bufferSource) {
      try {
        this.bufferSource.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      this.bufferSource.disconnect();
      this.bufferSource = null;
    }

    this.currentSource = null;
    this.emit('audio:playing', false);
  }

  private async extractMetadata(file: File): Promise<AudioMetadata> {
    return { title: file.name, artist: '' };
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
