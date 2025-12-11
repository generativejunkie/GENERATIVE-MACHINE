/**
 * Instance management class
 * Handles object instance lifecycle, positioning, and state
 * @module managers/InstanceManager
 */

import { EventEmitter } from '@utils/EventEmitter';
import { generateRandomPosition, generateGoldenRatioPosition, deepClone } from '@utils/helpers';
import { INSTANCE_CONFIG, MULTIPLIER_DEFAULTS } from '@constants/config';
import type { ObjectInstance } from '@types';

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
    options?: Partial<ObjectInstance> & { useGoldenRatio?: boolean }
  ): ObjectInstance {
    const existingPositions = this.instances.map(inst => inst.position);
    // Use custom spacing from options, or default to 2x spacing multiplier
    const customSpacing = options?.customSpacing;
    const spawnRange = customSpacing !== undefined ? customSpacing * 2 : this.spacingMultiplier * 2;

    // Use golden ratio positioning if enabled
    const position = options?.useGoldenRatio
      ? generateGoldenRatioPosition(
        this.instances.length,
        spawnRange
      )
      : generateRandomPosition(
        spawnRange,
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

  public removeOldestInstance(): boolean {
    const oldest = this.instances.find(inst => !inst.mediaData && !inst.pinned);

    if (oldest) {
      this.removeInstance(oldest.id);
      return true;
    }
    return false;
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
    // Allow up to 1000 objects for extreme VJ use cases
    this.maxObjects = Math.max(1, Math.min(1000, max));

    // Performance warning for large numbers
    if (max > 200) {
      console.warn(`⚠️ High object count (${max}). Monitor FPS for performance.`);
    }
  }

  public getMaxObjects(): number {
    return this.maxObjects;
  }

  public setSpacingMultiplier(spacing: number): void {
    this.spacingMultiplier = spacing;
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
