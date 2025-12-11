/**
 * Haptic Feedback Engine - 音を触感で感じる
 * 共感覚的体験を提供
 * @module features/HapticEngine
 */

import type { FrequencyBands } from '@types';

type HapticPattern = 'pulse' | 'heartbeat' | 'wave' | 'impact' | 'gentle' | 'intense';

interface HapticConfig {
  enabled: boolean;
  intensity: number; // 0.0 - 1.0
  frequencyMapping: {
    low: HapticPattern;
    mid: HapticPattern;
    high: HapticPattern;
  };
}

export class HapticEngine {
  private config: HapticConfig;
  private isSupported: boolean = false;
  private lastTrigger: number = 0;
  private minInterval: number = 50; // 最小50ms間隔

  constructor() {
    this.config = {
      enabled: true,
      intensity: 0.7,
      frequencyMapping: {
        low: 'heartbeat',
        mid: 'pulse',
        high: 'gentle'
      }
    };

    this.checkSupport();
  }

  /**
   * デバイスが触覚フィードバックをサポートしているか確認
   */
  private checkSupport(): void {
    // Vibration API のサポート確認
    this.isSupported = 'vibrate' in navigator;

    // iOS の Haptic Feedback API も確認
    if (!this.isSupported && 'Taptic' in window) {
      this.isSupported = true;
    }

    console.log(`Haptic Engine: ${this.isSupported ? 'Supported' : 'Not supported'}`);
  }

  /**
   * 音声周波数に基づいて触覚フィードバック
   */
  public feedbackFromAudio(frequencyBands: FrequencyBands): void {
    if (!this.config.enabled || !this.isSupported) return;

    const now = Date.now();
    if (now - this.lastTrigger < this.minInterval) return;

    // 最も強い周波数帯域を検出
    const dominant = this.getDominantBand(frequencyBands);

    if (dominant.strength > 150) { // 閾値
      const pattern = this.config.frequencyMapping[dominant.band];
      this.triggerPattern(pattern, dominant.strength);
      this.lastTrigger = now;
    }
  }

  /**
   * BPMに同期した触覚フィードバック
   */
  public syncWithBPM(bpm: number): void {
    if (!this.config.enabled || !this.isSupported) return;

    // Calculate interval for future rhythm-based patterns
    void ((60000 / bpm) * this.config.intensity);

    // ハートビートパターン
    this.vibrate([
      100 * this.config.intensity,
      100,
      50 * this.config.intensity
    ]);
  }

  /**
   * イベントベースの触覚フィードバック
   */
  public feedback(event: {
    type: 'add' | 'remove' | 'select' | 'success' | 'error' | 'impact';
    intensity?: number;
  }): void {
    if (!this.config.enabled || !this.isSupported) return;

    const intensity = event.intensity || this.config.intensity;

    switch (event.type) {
      case 'add':
        this.vibrate([30 * intensity]);
        break;

      case 'remove':
        this.vibrate([20 * intensity, 20, 20 * intensity]);
        break;

      case 'select':
        this.vibrate([10 * intensity]);
        break;

      case 'success':
        this.vibrate([50 * intensity, 50, 30 * intensity]);
        break;

      case 'error':
        this.vibrate([100 * intensity, 50, 100 * intensity]);
        break;

      case 'impact':
        this.vibrate([150 * intensity]);
        break;
    }
  }

  /**
   * カスタムパターンをトリガー
   */
  public triggerPattern(pattern: HapticPattern, strength: number = 200): void {
    if (!this.isSupported) return;

    const normalizedStrength = Math.min(255, strength) / 255;
    const intensity = normalizedStrength * this.config.intensity;

    switch (pattern) {
      case 'pulse':
        this.vibrate([50 * intensity, 50, 50 * intensity]);
        break;

      case 'heartbeat':
        this.vibrate([
          70 * intensity, 80,
          30 * intensity, 200
        ]);
        break;

      case 'wave':
        this.vibrate([
          20 * intensity, 30,
          40 * intensity, 30,
          60 * intensity, 30,
          40 * intensity, 30,
          20 * intensity
        ]);
        break;

      case 'impact':
        this.vibrate([150 * intensity]);
        break;

      case 'gentle':
        this.vibrate([30 * intensity]);
        break;

      case 'intense':
        this.vibrate([
          100 * intensity, 50,
          100 * intensity, 50,
          100 * intensity
        ]);
        break;
    }
  }

  /**
   * Mandalaモードの対称性を触覚で表現
   */
  public expressSymmetry(symmetryCount: number): void {
    if (!this.config.enabled || !this.isSupported) return;

    // 対称数に応じたパターン
    const pattern: number[] = [];
    const baseIntensity = 30 * this.config.intensity;

    for (let i = 0; i < symmetryCount; i++) {
      pattern.push(baseIntensity);
      pattern.push(50); // 間隔
    }

    this.vibrate(pattern);
  }

  /**
   * 設定を更新
   */
  public updateConfig(config: Partial<HapticConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 有効/無効を切り替え
   */
  public toggle(): boolean {
    this.config.enabled = !this.config.enabled;
    return this.config.enabled;
  }

  /**
   * サポート状況を取得
   */
  public isAvailable(): boolean {
    return this.isSupported;
  }

  // ========== Private Methods ==========

  private vibrate(pattern: number | number[]): void {
    if (!this.isSupported) return;

    try {
      // Vibration API
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }

      // iOS Taptic Engine (WebKit)
      if ('Taptic' in window) {
        // @ts-ignore
        window.Taptic.impact(pattern);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  private getDominantBand(bands: FrequencyBands): {
    band: 'low' | 'mid' | 'high';
    strength: number;
  } {
    const { low, mid, high } = bands;

    if (low >= mid && low >= high) {
      return { band: 'low', strength: low };
    } else if (mid >= low && mid >= high) {
      return { band: 'mid', strength: mid };
    } else {
      return { band: 'high', strength: high };
    }
  }
}

// Export singleton instance
export const hapticEngine = new HapticEngine();
