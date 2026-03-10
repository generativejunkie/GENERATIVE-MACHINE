/**
 * Neural Pattern Learner - ユーザーの好みを学習
 * あなたの美意識をAIが理解する
 * @module features/NeuralPatternLearner
 */

import type { ObjectInstance } from '@types';

export interface PatternPreference {
  materialIndex: number;
  frequency: number;
  lastUsed: number;
  averageLifetime: number; // どれくらい残されたか
  deletionRate: number;    // 削除される確率
}

export interface UserProfile {
  preferredMaterials: number[];
  preferredSymmetry: number;
  preferredComplexity: 'minimal' | 'moderate' | 'complex';
  timeOfDayPreference: Map<number, string>; // 時間帯別の好み
  emotionalPattern: 'stable' | 'dynamic' | 'chaotic';
}

export class NeuralPatternLearner {
  private patterns: Map<number, PatternPreference> = new Map();
  private userProfile: UserProfile;
  // Reserved for future learning algorithm implementation
  // private learningRate: number = 0.1;
  private totalInteractions: number = 0;

  constructor() {
    this.userProfile = {
      preferredMaterials: [],
      preferredSymmetry: 8,
      preferredComplexity: 'moderate',
      timeOfDayPreference: new Map(),
      emotionalPattern: 'stable'
    };
    this.loadFromStorage();
  }

  /**
   * ユーザー操作から学習
   */
  public learn(action: {
    type: 'add' | 'remove' | 'duplicate' | 'pin';
    instance: ObjectInstance;
    timestamp: number;
  }): void {
    this.totalInteractions++;

    const materialIndex = action.instance.materialIndex || 0;
    const pattern = this.patterns.get(materialIndex) || {
      materialIndex,
      frequency: 0,
      lastUsed: 0,
      averageLifetime: 0,
      deletionRate: 0
    };

    switch (action.type) {
      case 'add':
        pattern.frequency++;
        pattern.lastUsed = action.timestamp;
        break;

      case 'remove':
        pattern.deletionRate =
          (pattern.deletionRate * pattern.frequency + 1) / (pattern.frequency + 1);
        break;

      case 'pin':
        // ピン留めされた = 強い好み
        pattern.frequency += 5;
        break;

      case 'duplicate':
        // 複製された = 好み
        pattern.frequency += 3;
        break;
    }

    this.patterns.set(materialIndex, pattern);
    this.updateUserProfile();
    this.saveToStorage();
  }

  /**
   * 次に追加すべきオブジェクトを予測
   */
  public predictNext(currentInstances: ObjectInstance[]): number {
    // コンテキストを考慮した予測
    const currentMaterials = currentInstances.map(i => i.materialIndex || 0);
    // Reserved for future pattern-based prediction
    void this.getRecentPatterns();

    // 時間帯の考慮（将来の実装用）
    const hour = new Date().getHours();
    void this.userProfile.timeOfDayPreference.get(hour);

    // 複雑性の計算
    const currentComplexity = new Set(currentMaterials).size;
    const targetComplexity = this.getTargetComplexity();

    // スコアリング
    const scores = Array.from(this.patterns.entries()).map(([idx, pattern]) => {
      let score = pattern.frequency;

      // すでに多く使われているものは避ける
      const usageCount = currentMaterials.filter(m => m === idx).length;
      score *= Math.exp(-usageCount * 0.5);

      // 最近使われたものを優先
      const recency = Date.now() - pattern.lastUsed;
      score *= Math.exp(-recency / 3600000); // 1時間でスコア半減

      // 削除率が高いものは避ける
      score *= (1 - pattern.deletionRate);

      // 複雑性の調整
      if (currentComplexity < targetComplexity) {
        // 新しい種類を推奨
        score *= currentMaterials.includes(idx) ? 0.5 : 1.5;
      }

      return { materialIndex: idx, score };
    });

    // 最高スコアを選択（10%の確率でランダム）
    if (Math.random() < 0.1) {
      return Math.floor(Math.random() * 23);
    }

    scores.sort((a, b) => b.score - a.score);
    return scores[0]?.materialIndex || 0;
  }

  /**
   * おすすめの対称数を予測
   */
  public predictSymmetry(): number {
    return this.userProfile.preferredSymmetry;
  }

  /**
   * おすすめのBPMレンジを予測
   */
  public predictOptimalBPM(): { min: number; max: number } {
    const pattern = this.userProfile.emotionalPattern;

    switch (pattern) {
      case 'stable':
        return { min: 90, max: 110 };
      case 'dynamic':
        return { min: 110, max: 140 };
      case 'chaotic':
        return { min: 140, max: 180 };
      default:
        return { min: 80, max: 120 };
    }
  }

  /**
   * ユーザープロファイルを取得
   */
  public getUserProfile(): UserProfile {
    return { ...this.userProfile };
  }

  /**
   * 学習データをリセット
   */
  public reset(): void {
    this.patterns.clear();
    this.totalInteractions = 0;
    this.userProfile = {
      preferredMaterials: [],
      preferredSymmetry: 8,
      preferredComplexity: 'moderate',
      timeOfDayPreference: new Map(),
      emotionalPattern: 'stable'
    };
    localStorage.removeItem('mandala_neural_patterns');
  }

  /**
   * 統計情報を取得
   */
  public getStatistics() {
    const topMaterials = Array.from(this.patterns.entries())
      .sort((a, b) => b[1].frequency - a[1].frequency)
      .slice(0, 5)
      .map(([idx, pattern]) => ({
        materialIndex: idx,
        frequency: pattern.frequency,
        deletionRate: pattern.deletionRate
      }));

    return {
      totalInteractions: this.totalInteractions,
      uniqueMaterialsUsed: this.patterns.size,
      topMaterials,
      profile: this.userProfile,
      learningProgress: Math.min(100, (this.totalInteractions / 100) * 100)
    };
  }

  // ========== Private Methods ==========

  private updateUserProfile(): void {
    // 好まれるマテリアルTOP3
    const sorted = Array.from(this.patterns.entries())
      .sort((a, b) => b[1].frequency - a[1].frequency);

    this.userProfile.preferredMaterials = sorted
      .slice(0, 3)
      .map(([idx]) => idx);

    // 複雑性の判定
    const avgMaterialVariety = sorted.length / Math.max(1, this.totalInteractions / 10);
    if (avgMaterialVariety < 3) {
      this.userProfile.preferredComplexity = 'minimal';
    } else if (avgMaterialVariety < 6) {
      this.userProfile.preferredComplexity = 'moderate';
    } else {
      this.userProfile.preferredComplexity = 'complex';
    }

    // 時間帯の記録
    const hour = new Date().getHours();
    const currentCount = parseInt(this.userProfile.timeOfDayPreference.get(hour) || '0');
    this.userProfile.timeOfDayPreference.set(hour, (currentCount + 1).toString());
  }

  private getRecentPatterns(): PatternPreference[] {
    const recent = Date.now() - 3600000; // 1時間以内
    return Array.from(this.patterns.values())
      .filter(p => p.lastUsed > recent);
  }

  private getTargetComplexity(): number {
    switch (this.userProfile.preferredComplexity) {
      case 'minimal': return 3;
      case 'moderate': return 6;
      case 'complex': return 12;
      default: return 6;
    }
  }

  private saveToStorage(): void {
    const data = {
      patterns: Array.from(this.patterns.entries()),
      profile: {
        ...this.userProfile,
        timeOfDayPreference: Array.from(this.userProfile.timeOfDayPreference.entries())
      },
      totalInteractions: this.totalInteractions
    };
    localStorage.setItem('mandala_neural_patterns', JSON.stringify(data));
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('mandala_neural_patterns');
      if (stored) {
        const data = JSON.parse(stored);
        this.patterns = new Map(data.patterns);

        // Handle timeOfDayPreference compatibility
        let timeOfDayMap = new Map();
        if (data.profile.timeOfDayPreference) {
          if (Array.isArray(data.profile.timeOfDayPreference)) {
            // New format: array of [key, value] pairs
            timeOfDayMap = new Map(data.profile.timeOfDayPreference);
          } else if (typeof data.profile.timeOfDayPreference === 'object') {
            // Old format: plain object
            timeOfDayMap = new Map(Object.entries(data.profile.timeOfDayPreference));
          }
        }

        this.userProfile = {
          ...data.profile,
          timeOfDayPreference: timeOfDayMap
        };
        this.totalInteractions = data.totalInteractions || 0;
      }
    } catch (error) {
      console.error('Failed to load learning data:', error);
      // Reset to default on error
      this.userProfile.timeOfDayPreference = new Map();
    }
  }
}
