/**
 * General utility functions
 * @module utils/helpers
 */

import * as THREE from 'three';
import type { Position3D, RGBColor } from '@types';
import { INSTANCE_CONFIG } from '@constants/config';

/**
 * Generate a random position within a given range
 */
export function generateRandomPosition(
  range: number,
  existingPositions: Position3D[] = [],
  minDistance: number = INSTANCE_CONFIG.MIN_DISTANCE,
  maxAttempts: number = INSTANCE_CONFIG.MAX_SPAWN_ATTEMPTS
): Position3D {
  let position: Position3D;
  let attempts = 0;

  do {
    position = {
      x: (Math.random() - 0.5) * range,
      y: (Math.random() - 0.5) * range,
      z: (Math.random() - 0.5) * (range / 2),
    };
    attempts++;

    const isTooClose = existingPositions.some(existing => {
      const distance = calculateDistance(existing, position);
      return distance < minDistance;
    });

    if (!isTooClose || attempts >= maxAttempts) {
      break;
    }
  } while (true);

  return position;
}

/**
 * Calculate distance between two 3D positions
 */
export function calculateDistance(pos1: Position3D, pos2: Position3D): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Convert RGB object to CSS color string
 */
export function rgbToCss(color: RGBColor): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

/**
 * Convert RGB values (0-255) to Three.js color (0-1)
 */
export function rgbToThreeColor(color: RGBColor): THREE.Color {
  return new THREE.Color(color.r / 255, color.g / 255, color.b / 255);
}

/**
 * Check if two colors are equal
 */
export function colorsEqual(color1: RGBColor, color2: RGBColor): boolean {
  return color1.r === color2.r && color1.g === color2.g && color1.b === color2.b;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Format time in MM:SS format
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) {
    return '0:00';
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    const clonedArr: any[] = [];
    obj.forEach((item, index) => {
      clonedArr[index] = deepClone(item);
    });
    return clonedArr as any;
  }

  if (obj instanceof Object) {
    const clonedObj: any = {};
    Object.keys(obj).forEach(key => {
      clonedObj[key] = deepClone((obj as any)[key]);
    });
    return clonedObj;
  }

  return obj;
}

/**
 * Calculate median of an array
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

/**
 * Calculate average of an array
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const avg = average(values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Check if a value is within a range
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}

/**
 * Safe localStorage getItem
 */
export function getLocalStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    return safeJsonParse(item, fallback);
  } catch (error) {
    console.error('LocalStorage read error:', error);
    return fallback;
  }
}

/**
 * Safe localStorage setItem
 */
export function setLocalStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('LocalStorage write error:', error);
    return false;
  }
}

/**
 * Golden ratio constant
 */
export const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2; // φ ≈ 1.618

/**
 * Golden angle in radians (≈ 2.399 radians ≈ 137.5 degrees)
 */
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 137.5° in radians

/**
 * Generate position using golden ratio spiral pattern
 * Based on Fermat's spiral with golden angle
 */
export function generateGoldenRatioPosition(
  index: number,
  range: number,
  // existingPositions: Position3D[] = []
): Position3D {
  // Use golden angle for rotation
  const angle = index * GOLDEN_ANGLE;

  // Use square root for spiral density (Vogel's method)
  // Adjusted for better spacing: larger multiplier and minimum radius
  const minRadius = range * 0.3; // Minimum distance from center
  const radius = minRadius + Math.sqrt(index + 1) * (range / 8);

  // Calculate x, y based on polar coordinates
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);

  // Add slight z variation based on golden ratio
  const z = (Math.sin(index / GOLDEN_RATIO) * range) / 6;

  return { x, y, z };
}
