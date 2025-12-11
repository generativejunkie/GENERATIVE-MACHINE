/**
 * Time Travel Engine - 過去の曼荼羅を再生・編集
 * あなたの創造の歴史を可視化
 * @module features/TimeTravelEngine
 */

import type { ObjectInstance, ApplicationState } from '@types';

export interface HistorySnapshot {
  timestamp: number;
  instances: ObjectInstance[];
  state: ApplicationState;
  metadata: {
    bpm: number;
    duration: number;
    userEmotion?: 'calm' | 'energetic' | 'focused' | 'chaotic';
  };
}

export class TimeTravelEngine {
  private history: HistorySnapshot[] = [];
  private maxHistory: number = 100; // 最大100スナップショット
  private currentIndex: number = -1;
  private isRecording: boolean = true;

  /**
   * 現在の状態をスナップショット
   */
  public snapshot(
    instances: ObjectInstance[],
    state: ApplicationState,
    bpm: number
  ): void {
    if (!this.isRecording) return;

    const snapshot: HistorySnapshot = {
      timestamp: Date.now(),
      instances: this.deepClone(instances),
      state: { ...state },
      metadata: {
        bpm,
        duration: this.history.length > 0
          ? Date.now() - this.history[this.history.length - 1].timestamp
          : 0,
        userEmotion: this.detectEmotion(bpm)
      }
    };

    this.history.push(snapshot);

    // 古いスナップショットを削除
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.currentIndex = this.history.length - 1;
  }

  /**
   * 過去に戻る
   */
  public travelBack(steps: number = 1): HistorySnapshot | null {
    const targetIndex = Math.max(0, this.currentIndex - steps);
    this.currentIndex = targetIndex;
    return this.history[targetIndex] || null;
  }

  /**
   * 未来に進む
   */
  public travelForward(steps: number = 1): HistorySnapshot | null {
    const targetIndex = Math.min(this.history.length - 1, this.currentIndex + steps);
    this.currentIndex = targetIndex;
    return this.history[targetIndex] || null;
  }

  /**
   * 特定の時刻にジャンプ
   */
  public travelTo(timestamp: number): HistorySnapshot | null {
    const snapshot = this.history.find(s =>
      Math.abs(s.timestamp - timestamp) < 1000
    );
    if (snapshot) {
      this.currentIndex = this.history.indexOf(snapshot);
    }
    return snapshot || null;
  }

  /**
   * タイムライン全体を取得
   */
  public getTimeline(): HistorySnapshot[] {
    return this.history;
  }

  /**
   * 感情的瞬間を抽出（BPMベース）
   */
  public getEmotionalHighlights(): HistorySnapshot[] {
    return this.history.filter(s => {
      const bpm = s.metadata.bpm;
      // 極端なBPM = 感情的瞬間
      return bpm < 80 || bpm > 140;
    });
  }

  /**
   * 最も美しい瞬間を抽出（複雑性ベース）
   */
  public getMostComplexMoments(count: number = 5): HistorySnapshot[] {
    return this.history
      .map(s => ({
        snapshot: s,
        complexity: this.calculateComplexity(s)
      }))
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, count)
      .map(item => item.snapshot);
  }

  /**
   * アニメーション再生用のフレーム生成
   */
  public *playback(speed: number = 1): Generator<HistorySnapshot> {
    // Calculate frame interval for future timing implementation
    void ((1000 / 60) / speed); // 60fps

    for (const snapshot of this.history) {
      yield snapshot;
      // 実際のアプリではawaitが必要
    }
  }

  /**
   * 録画開始/停止
   */
  public toggleRecording(): boolean {
    this.isRecording = !this.isRecording;
    return this.isRecording;
  }

  /**
   * エクスポート（JSON）
   */
  public export(): string {
    return JSON.stringify({
      version: '1.0',
      totalDuration: this.getTotalDuration(),
      snapshots: this.history
    });
  }

  /**
   * インポート
   */
  public import(json: string): void {
    try {
      const data = JSON.parse(json);
      this.history = data.snapshots;
      this.currentIndex = this.history.length - 1;
    } catch (error) {
      console.error('Failed to import timeline:', error);
    }
  }

  // ========== Private Methods ==========

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  private detectEmotion(bpm: number): 'calm' | 'energetic' | 'focused' | 'chaotic' {
    if (bpm < 70) return 'calm';
    if (bpm < 100) return 'focused';
    if (bpm < 140) return 'energetic';
    return 'chaotic';
  }

  private calculateComplexity(snapshot: HistorySnapshot): number {
    const instanceCount = snapshot.instances.length;
    const symmetry = snapshot.state.mandalaMode ? snapshot.state.symmetryCount : 1;
    const variability = new Set(snapshot.instances.map(i => i.materialIndex)).size;

    return instanceCount * symmetry * variability;
  }

  private getTotalDuration(): number {
    if (this.history.length === 0) return 0;
    return this.history[this.history.length - 1].timestamp - this.history[0].timestamp;
  }
}
