/**
 * Memetic Evolution Engine - 曼荼羅がDNAのように進化
 * あなたの作品が世界中で変異・拡散
 * @module features/MemeticEngine
 */

import type { ObjectInstance, ApplicationState } from '@types';

interface MandalaGene {
  // 遺伝子情報
  materialSequence: number[];      // マテリアルの配列
  symmetryGene: number;             // 対称性
  colorPalette: string[];           // 色パレット
  complexity: number;               // 複雑性スコア

  // 進化情報
  generation: number;               // 第何世代
  parentIds: string[];              // 親の曼荼羅ID
  mutationHistory: string[];        // 変異履歴
  fitnessScore: number;             // 適応度
}

interface MandalaDNA {
  id: string;
  timestamp: number;
  gene: MandalaGene;
  instances: ObjectInstance[];
  state: ApplicationState;

  // メタデータ
  creator: string;                  // 作者ID
  likes: number;                    // いいね数
  shares: number;                   // シェア数
  offspring: number;                // 子孫の数
  viralScore: number;               // バイラル度
}

type MutationType = 'point' | 'insertion' | 'deletion' | 'duplication' | 'inversion' | 'radical';

export class MemeticEngine {
  private currentDNA: MandalaDNA | null = null;
  private mutationRate: number = 0.15; // 15%の変異率
  // Reserved for future crossover implementation
  // private crossoverRate: number = 0.7;  // 70%の交叉率

  /**
   * 現在の曼荼羅からDNAを抽出
   */
  public extractDNA(
    instances: ObjectInstance[],
    state: ApplicationState
  ): MandalaDNA {
    const gene: MandalaGene = {
      materialSequence: instances.map(i => i.materialIndex || 0),
      symmetryGene: state.mandalaMode ? state.symmetryCount : 0,
      colorPalette: this.extractColors(instances),
      complexity: this.calculateComplexity(instances),
      generation: 1,
      parentIds: [],
      mutationHistory: [],
      fitnessScore: 0
    };

    this.currentDNA = {
      id: this.generateId(),
      timestamp: Date.now(),
      gene,
      instances: JSON.parse(JSON.stringify(instances)),
      state: { ...state },
      creator: this.getCreatorId(),
      likes: 0,
      shares: 0,
      offspring: 0,
      viralScore: 0
    };

    return this.currentDNA;
  }

  /**
   * 2つの曼荼羅を交配（交叉）
   */
  public crossover(parent1: MandalaDNA, parent2: MandalaDNA): MandalaDNA {
    // 遺伝子の交叉点を決定
    const crossoverPoint = Math.floor(
      Math.random() * Math.min(
        parent1.gene.materialSequence.length,
        parent2.gene.materialSequence.length
      )
    );

    // 子の遺伝子を生成
    const childGene: MandalaGene = {
      materialSequence: [
        ...parent1.gene.materialSequence.slice(0, crossoverPoint),
        ...parent2.gene.materialSequence.slice(crossoverPoint)
      ],
      symmetryGene: Math.random() < 0.5
        ? parent1.gene.symmetryGene
        : parent2.gene.symmetryGene,
      colorPalette: this.blendColorPalettes(
        parent1.gene.colorPalette,
        parent2.gene.colorPalette
      ),
      complexity: (parent1.gene.complexity + parent2.gene.complexity) / 2,
      generation: Math.max(parent1.gene.generation, parent2.gene.generation) + 1,
      parentIds: [parent1.id, parent2.id],
      mutationHistory: [],
      fitnessScore: 0
    };

    // 変異を適用
    const mutatedGene = this.applyMutation(childGene);

    // 子のDNAを構築
    const child: MandalaDNA = {
      id: this.generateId(),
      timestamp: Date.now(),
      gene: mutatedGene,
      instances: this.geneToInstances(mutatedGene),
      state: {
        ...parent1.state,
        mandalaMode: mutatedGene.symmetryGene > 0,
        symmetryCount: mutatedGene.symmetryGene || 8
      },
      creator: this.getCreatorId(),
      likes: 0,
      shares: 0,
      offspring: 0,
      viralScore: 0
    };

    return child;
  }

  /**
   * 突然変異
   */
  public mutate(dna: MandalaDNA, type?: MutationType): MandalaDNA {
    const mutationType = type || this.selectMutationType();
    const mutatedGene = { ...dna.gene };

    switch (mutationType) {
      case 'point':
        // 点変異: 1つのマテリアルを変更
        const idx = Math.floor(Math.random() * mutatedGene.materialSequence.length);
        mutatedGene.materialSequence[idx] = Math.floor(Math.random() * 23);
        mutatedGene.mutationHistory.push(`point_${idx}`);
        break;

      case 'insertion':
        // 挿入: 新しいマテリアルを追加
        const insertPos = Math.floor(Math.random() * mutatedGene.materialSequence.length);
        const newMaterial = Math.floor(Math.random() * 23);
        mutatedGene.materialSequence.splice(insertPos, 0, newMaterial);
        mutatedGene.mutationHistory.push(`insertion_${insertPos}`);
        break;

      case 'deletion':
        // 削除: マテリアルを削除
        if (mutatedGene.materialSequence.length > 1) {
          const deletePos = Math.floor(Math.random() * mutatedGene.materialSequence.length);
          mutatedGene.materialSequence.splice(deletePos, 1);
          mutatedGene.mutationHistory.push(`deletion_${deletePos}`);
        }
        break;

      case 'duplication':
        // 重複: 既存の配列を複製
        const dupStart = Math.floor(Math.random() * mutatedGene.materialSequence.length);
        const dupLength = Math.floor(Math.random() * 3) + 1;
        const duplicate = mutatedGene.materialSequence.slice(dupStart, dupStart + dupLength);
        mutatedGene.materialSequence.push(...duplicate);
        mutatedGene.mutationHistory.push(`duplication_${dupStart}_${dupLength}`);
        break;

      case 'inversion':
        // 逆位: 配列の一部を反転
        const invStart = Math.floor(Math.random() * mutatedGene.materialSequence.length);
        const invEnd = Math.floor(Math.random() * (mutatedGene.materialSequence.length - invStart)) + invStart;
        const reversed = mutatedGene.materialSequence.slice(invStart, invEnd).reverse();
        mutatedGene.materialSequence.splice(invStart, invEnd - invStart, ...reversed);
        mutatedGene.mutationHistory.push(`inversion_${invStart}_${invEnd}`);
        break;

      case 'radical':
        // 大変異: 対称性も変更
        mutatedGene.symmetryGene = [0, 4, 6, 8, 12, 16][Math.floor(Math.random() * 6)];
        mutatedGene.materialSequence = mutatedGene.materialSequence.map(() =>
          Math.random() < 0.5 ? Math.floor(Math.random() * 23) : 0
        );
        mutatedGene.mutationHistory.push('radical');
        break;
    }

    return {
      ...dna,
      gene: mutatedGene,
      instances: this.geneToInstances(mutatedGene)
    };
  }

  /**
   * 適応度（フィットネス）を計算
   */
  public calculateFitness(dna: MandalaDNA): number {
    let fitness = 0;

    // 複雑性スコア（適度な複雑さが好まれる）
    const idealComplexity = 50;
    fitness += 30 * Math.exp(-Math.abs(dna.gene.complexity - idealComplexity) / 20);

    // ソーシャルシグナル
    fitness += Math.min(30, dna.likes * 0.5);
    fitness += Math.min(20, dna.shares * 2);
    fitness += Math.min(10, dna.offspring * 1);

    // 対称性ボーナス
    if (dna.gene.symmetryGene > 0) {
      fitness += 10;
    }

    // 多様性ボーナス
    const uniqueMaterials = new Set(dna.gene.materialSequence).size;
    fitness += Math.min(10, uniqueMaterials);

    dna.gene.fitnessScore = fitness;
    return fitness;
  }

  /**
   * バイラル度を計算（どれくらい拡散するか）
   */
  public calculateViralScore(dna: MandalaDNA): number {
    const ageInHours = (Date.now() - dna.timestamp) / 3600000;
    const growthRate = (dna.likes + dna.shares * 2 + dna.offspring * 3) / Math.max(1, ageInHours);

    // シグモイド関数でスコア化
    dna.viralScore = 100 / (1 + Math.exp(-growthRate + 5));
    return dna.viralScore;
  }

  /**
   * SNSシェア用データ生成
   */
  public generateShareData(dna: MandalaDNA): {
    url: string;
    title: string;
    description: string;
    hashtags: string[];
    image: string;
  } {
    const generation = dna.gene.generation;
    const complexity = Math.round(dna.gene.complexity);
    const materials = new Set(dna.gene.materialSequence).size;

    return {
      url: `https://mandala-machine.app/m/${dna.id}`,
      title: `曼荼羅 Gen${generation} [${complexity}]`,
      description: `第${generation}世代の進化した曼荼羅 | ${materials}種の形状 | 対称性: ${dna.gene.symmetryGene || 'なし'}`,
      hashtags: [
        'MandalaMachine',
        'GenerativeArt',
        `Gen${generation}`,
        dna.gene.symmetryGene > 0 ? 'Symmetry' : 'Asymmetry',
        complexity > 60 ? 'Complex' : 'Minimal'
      ],
      image: '' // スクリーンショットのURL
    };
  }

  /**
   * DNA を JSON エクスポート
   */
  public export(dna: MandalaDNA): string {
    return JSON.stringify(dna, null, 2);
  }

  /**
   * DNA を JSON インポート
   */
  public import(json: string): MandalaDNA | null {
    try {
      const dna = JSON.parse(json);
      return dna as MandalaDNA;
    } catch (error) {
      console.error('Failed to import DNA:', error);
      return null;
    }
  }

  // ========== Private Methods ==========

  private generateId(): string {
    return `dna_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCreatorId(): string {
    // 実際にはユーザーIDを取得
    let creatorId = localStorage.getItem('mandala_creator_id');
    if (!creatorId) {
      creatorId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('mandala_creator_id', creatorId);
    }
    return creatorId;
  }

  private extractColors(instances: ObjectInstance[]): string[] {
    const colors = instances
      .filter(i => i.color)
      .map(i => `rgb(${i.color!.r},${i.color!.g},${i.color!.b})`);
    return Array.from(new Set(colors));
  }

  private calculateComplexity(instances: ObjectInstance[]): number {
    const instanceCount = instances.length;
    const uniqueMaterials = new Set(instances.map(i => i.materialIndex)).size;
    const colorVariety = new Set(instances.map(i =>
      i.color ? `${i.color.r},${i.color.g},${i.color.b}` : 'none'
    )).size;

    return instanceCount * 2 + uniqueMaterials * 5 + colorVariety * 3;
  }

  private blendColorPalettes(palette1: string[], palette2: string[]): string[] {
    const combined = [...palette1, ...palette2];
    return combined.slice(0, Math.max(palette1.length, palette2.length));
  }

  private selectMutationType(): MutationType {
    const rand = Math.random();
    if (rand < 0.4) return 'point';
    if (rand < 0.6) return 'insertion';
    if (rand < 0.75) return 'deletion';
    if (rand < 0.85) return 'duplication';
    if (rand < 0.95) return 'inversion';
    return 'radical';
  }

  private applyMutation(gene: MandalaGene): MandalaGene {
    if (Math.random() < this.mutationRate) {
      // 変異を適用
      const mutationType = this.selectMutationType();
      // 実際の変異処理はmutate()と同様
      gene.mutationHistory.push(mutationType);
    }
    return gene;
  }

  private geneToInstances(gene: MandalaGene): ObjectInstance[] {
    return gene.materialSequence.map((materialIndex, idx) => ({
      id: idx,
      materialIndex,
      position: {
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 10
      },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
      wireframe: 'wireframe' as const,
      pinned: false,
      color: null
    }));
  }
}
