/**
 * Type definitions for Mandala Machine
 * @module types
 */

import type * as THREE from 'three';

/**
 * RGB color representation
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * 3D position in space
 */
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

/**
 * 3D rotation in Euler angles
 */
export interface Rotation3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Transition effect types
 */
export type TransitionType = 'fadeIn' | 'scaleIn' | 'slideIn' | 'rotateIn' | 'random';

/**
 * Wireframe mode types
 */
export type WireframeMode = 'solid' | 'wireframe' | 'mixed';
export type DispersionPattern = 'outward' | 'inward' | 'spiral' | 'vortex' | 'random' | 'expandX' | 'expandY';
export type DJNameEffect = 'none' | 'plasma' | 'neon' | 'matrix' | 'glitch' | 'mosaic' | 'data';
export type OrbitAxis = 'horizontal' | 'vertical' | 'complex';

/**
 * Media types supported
 */
export type MediaType = 'image' | 'video';

/**
 * Audio source types
 */
export type AudioSourceType = 'file' | 'microphone' | null;

/**
 * Media data structure
 */
export interface MediaData {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  aspectRatio: number;
}

/**
 * Material definition
 */
export interface Material {
  id: string;
  name: string;
  create3D: (isSolid?: boolean) => THREE.Object3D;
}

/**
 * Object instance in the scene
 */
export interface ObjectInstance {
  id: number;
  materialIndex?: number;
  mediaData?: MediaData;
  position: Position3D;
  rotation: Rotation3D;
  scale: number;
  wireframe: WireframeMode;
  pinned: boolean;
  color: RGBColor | null;
  customSpacing?: number;
  transition?: TransitionType;
  transitionProgress?: number;
  videoElement?: HTMLVideoElement;
  cachedTexture?: THREE.Texture;
}

/**
 * Preset data structure
 */
export interface PresetData {
  name: string;
  instances: Array<Omit<ObjectInstance, 'id' | 'videoElement' | 'cachedTexture'>>;
  timestamp: number;
}

/**
 * Custom material (can be preset or media)
 */
export type CustomMaterial = PresetData | MediaData;

/**
 * Audio metadata
 */
export interface AudioMetadata {
  title: string;
  artist: string;
  duration?: number;
  bpm?: number; // Detected BPM
}

/**
 * Scene configuration
 */
export interface SceneConfig {
  mandalaMode: boolean;
  symmetryCount: number;
  sizeMultiplier: number;
  speedMultiplier: number;
  spreadMultiplier: number;
  maxObjects: number;
}

/**
 * Audio configuration
 */
export interface AudioConfig {
  autoGenerateMode: boolean;
  autoGenerateSpeedMultiplier: number;
  frequencySpawnMode: boolean;
  estimatedBPM: number;
}

/**
 * Application state
 */
export interface AppState {
  isPlaying: boolean;
  currentAudioSource: AudioSourceType;
  selectedTransition: TransitionType;
  objectColor: RGBColor;
  savedColors: RGBColor[];
  sceneConfig: SceneConfig;
  audioConfig: AudioConfig;
}

/**
 * Error types
 */
export enum ErrorType {
  AUDIO_INIT_FAILED = 'AUDIO_INIT_FAILED',
  MICROPHONE_ACCESS_DENIED = 'MICROPHONE_ACCESS_DENIED',
  FILE_LOAD_FAILED = 'FILE_LOAD_FAILED',
  RENDERING_ERROR = 'RENDERING_ERROR',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
}

/**
 * Custom error class
 */
export class MandalaError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'MandalaError';
    Object.setPrototypeOf(this, MandalaError.prototype);
  }
}

/**
 * Frequency bands for audio analysis
 */
export interface FrequencyBands {
  low: number;
  mid: number;
  high: number;
}

/**
 * Event callback types
 */
export type EventCallback<T = void> = (data: T) => void;

/**
 * Event map for type-safe event handling
 */
export interface EventMap {
  'scene:updated': void;
  'audio:playing': boolean;
  'audio:bpm-detected': number;
  'audio:beat': { time: number; bpm: number };
  'instance:added': ObjectInstance;
  'instance:removed': number;
  'instance:selected': ObjectInstance | null;
  'object:dragged': any;
  'object:dragend': any;
  'track:loaded:a': any;
  'track:loaded:b': any;
  'mixer:playing': any;
  'mixer:crossfader': number;
  'bpm:synced': { trackA: number; trackB: number; playbackRate: number };
  'automix:complete': { position: number };
  'midi:message': { type: number; channel: number; data1: number; data2: number };
  'midi:noteOn': { channel: number; note: number; velocity: number };
  'midi:noteOff': { channel: number; note: number };
  'midi:cc': { channel: number; cc: number; value: number; normalized: number };
  'error': MandalaError;
}

/**
 * Application state
 */
export interface ApplicationState {
  mandalaMode: boolean;
  symmetryEnabled: boolean; // New Flag: Decoupled visual symmetry
  symmetryCount: number;
  sizeMultiplier: number;
  speedMultiplier: number;
  spreadMultiplier: number;
  spacingMultiplier: number;
  baseRotation: number;
  spaceMode: boolean; // Renamed from aiMode
  aiSpeedMultiplier: number;
  autoMode: boolean; // New AUTO mode
  autoGenerateMode: boolean;
  autoGenerateSpeedMultiplier: number;
  autoGenerateDistance: number;
  frequencySpawnMode: boolean;
  goldenRatioMode: boolean;
  antigravityMode: boolean;
  reflectMode: boolean; // Mirror reflection mode
  brainHackMode: boolean;
  brainHackModeIndex: number;
  isPlaying: boolean;
  quantumMode: boolean;
  quantumCoherence: number;
  quantumEntangled: boolean;
  wireframeMode: WireframeMode;
  dispersionPattern: DispersionPattern;
  autoCyclePatterns: boolean;
  autoColorStrobe: boolean;
  autoColorA: string;
  autoColorB: string;
  autoColorC: string;
  blinkingMode: boolean;
  blinkingSpeed: number;
  glitchMode: boolean;
  hassanMode: boolean;
  coreMandalaMode: boolean;
  videoReactivityMode: boolean;
  neuralLinkMode: boolean;
  cameraOrbitMode: boolean;
  cameraOrbitAxis: OrbitAxis;
  cameraOrbitReverse: boolean;
  djName: string;
  showDJName: boolean;
  djNameEffect: DJNameEffect;
  globalEffects: {
    noise: boolean;
    mosaic: boolean;
    dataStream: boolean;
    glitch: boolean;
    hassan: boolean;
  };
}

/**
 * Application event map
 */
export interface ApplicationEventMap {
  'state:changed': ApplicationState;
  'audio:bpm': number;
  'audio:beat': { time: number; bpm: number };
  'audio:playing': boolean;
  'instance:added': ObjectInstance;
  'instance:removed': number;
  'scene:cleared': void;
  'error': MandalaError;
}
