/**
 * Application configuration constants
 * @module constants/config
 */

/**
 * Scene rendering configuration
 */
export const SCENE_CONFIG = {
  BACKGROUND_COLOR: 0xffffff,
  CAMERA_FOV: 75,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 1000,
  CAMERA_POSITION_Z: 15,
  ASPECT_RATIO: 16 / 9,
  PIXEL_RATIO_MULTIPLIER: 1,
} as const;

/**
 * Lighting configuration
 */
export const LIGHTING_CONFIG = {
  AMBIENT_INTENSITY: 0.5,
  DIRECTIONAL_MAIN_INTENSITY: 1.2,
  DIRECTIONAL_FILL_INTENSITY: 0.4,
  DIRECTIONAL_RIM_INTENSITY: 0.6,
  DIRECTIONAL_MAIN_POSITION: { x: 10, y: 10, z: 5 },
  DIRECTIONAL_FILL_POSITION: { x: -5, y: -10, z: -5 },
  DIRECTIONAL_RIM_POSITION: { x: 0, y: 0, z: -10 },
} as const;

/**
 * Audio configuration
 */
export const AUDIO_CONFIG = {
  FFT_SIZE: 256,
  INDICATOR_BAR_COUNT: 24,
  DEFAULT_BPM: 120,
  MIN_BPM: 50,
  MAX_BPM: 200,
  BPM_SMOOTHING_FACTOR: 0.2, // increased smoothing
  BEAT_MIN_INTERVAL_MS: 300, // min ms between beats (200 BPM)
  BEAT_VALID_RANGE_MS: { min: 300, max: 1500 }, // window for valid beat intervals (40-200 BPM)
  BEAT_HISTORY_SIZE: 8,
  PEAK_HISTORY_SIZE: 120, // 2 seconds of history
  BASS_THRESHOLD_MULTIPLIER: 1.05, // 1.05 = Sensitive (DJ/Line-in), 1.2 = Strict
  MIN_BASS_AVERAGE: 20, // Minimum energy to consider a beat (very low for quiet inputs)
} as const;

/**
 * Frequency bands for audio analysis
 */
export const FREQUENCY_BANDS = {
  LOW_END: 0.15,
  MID_END: 0.5,
  THRESHOLD: 200,
  SPAWN_COOLDOWN_MS: 150,
  MATERIAL_RANGES: {
    LOW: { start: 0, count: 8 },
    MID: { start: 8, count: 8 },
    HIGH: { start: 16, count: 7 },
  },
} as const;

/**
 * Object instance configuration
 */
export const INSTANCE_CONFIG = {
  DEFAULT_SCALE: 1,
  DEFAULT_WIREFRAME: 'solid' as const,
  DEFAULT_PINNED: false,
  MIN_DISTANCE: 12, // Increased for more spacious layout (was 5)
  MAX_SPAWN_ATTEMPTS: 100, // Increased attempts to find good positions (was 50)
  DUPLICATE_OFFSET: 3, // Increased offset for duplicates (was 2)
} as const;

/**
 * Scene multipliers default values
 */
export const MULTIPLIER_DEFAULTS = {
  SIZE: 1,
  SPEED: 1,
  SPREAD: 1,
  SPACING: 15, // Increased for more spacious layout (was 10)
  SYMMETRY_COUNT: 8,
  MAX_OBJECTS: 20, // Default limit for auto-spawn modes (can be manually increased to 100)
  AUTO_GENERATE_SPEED: 4,
} as const;

/**
 * Multiplier ranges
 */
export const MULTIPLIER_RANGES = {
  SIZE: { min: 0.5, max: 2, step: 0.1 },
  SPEED: { min: 0, max: 3, step: 0.1 },
  SPREAD: { min: 0.5, max: 3, step: 0.1 },
  MAX_OBJECTS: { min: 1, max: 100, step: 1 }, // Limit to 100 as requested
  AUTO_SPEED: { min: -4, max: 8, step: 1 },
  SYMMETRY_COUNT: { min: 2, max: 64, step: 1 }, // Increased to 64
} as const;

/**
 * Transition configuration
 */
export const TRANSITION_CONFIG = {
  PROGRESS_INCREMENT: 0.02,
  SLIDE_IN_OFFSET: 10,
  ROTATE_IN_ANGLE: Math.PI * 2,
} as const;

/**
 * Material configuration
 */
export const MATERIAL_CONFIG = {
  WIREFRAME_COLOR: 0x000000,
  SOLID_COLOR: 0x1a1a1a,
  SOLID_ROUGHNESS: 0.4,
  SOLID_METALNESS: 0.1,
  EDGE_THRESHOLD: 10,
  EDGE_THRESHOLD_HIGH: 15,
} as const;

/**
 * UI configuration
 */
export const UI_CONFIG = {
  DOUBLE_CLICK_DELAY_MS: 300,
  CONTEXT_MENU_MIN_WIDTH: 150,
  THUMBNAIL_SIZE: 256,
  COLOR_PALETTE_GRID_COLUMNS: 4,
  PRESET_GRID_COLUMNS: 4,
  DEBOUNCE_DELAY_MS: 100,
} as const;

/**
 * Media configuration
 */
export const MEDIA_CONFIG = {
  CANVAS_SIZE_MULTIPLIER: 0.9,
  MEDIA_Z_OFFSET: -5,
  TEXT_CANVAS_WIDTH: 1024,
  TEXT_CANVAS_HEIGHT: 256,
  TEXT_FONT_SIZE: 80,
  TEXT_FONT_FAMILY: 'bold 80px Arial, sans-serif',
  TEXT_SCALE: { width: 10, height: 2.5 },
  TEXT_POSITION_Y: -8,
  PIN_SPRITE_SIZE: 0.5,
  PIN_SPRITE_OFFSET_Y: 2,
} as const;

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  CUSTOM_MATERIALS: 'customMaterials',
  COLOR_PALETTE: 'colorPalette',
} as const;

/**
 * File configuration
 */
export const FILE_CONFIG = {
  MAX_METADATA_READ_SIZE: 1024 * 1024, // 1MB
  // Support for DTM/Professional audio formats
  AUDIO_ACCEPT: [
    'audio/*',
    '.mp3', '.wav', '.aiff', '.aif', '.flac', '.ogg',
    '.m4a', '.aac', '.wma', '.alac', '.opus',
    '.mid', '.midi' // MIDI files (for future MIDI support)
  ].join(','),
  MEDIA_ACCEPT: 'image/*,video/*',
  SCREENSHOT_FORMAT: 'image/png',
  SCREENSHOT_PREFIX: 'mandala-machine-',
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  AUDIO_INIT_FAILED: 'Failed to initialize audio context',
  MICROPHONE_ACCESS_DENIED: 'Microphone access was denied. Please check your browser settings.',
  FILE_LOAD_FAILED: 'Failed to load file',
  RENDERING_ERROR: 'An error occurred during rendering',
  INVALID_CONFIGURATION: 'Invalid configuration provided',
  RESOURCE_NOT_FOUND: 'Requested resource was not found',
  METADATA_PARSE_FAILED: 'Failed to parse audio metadata',
  NO_AUDIO_SOURCE: 'Please upload an audio file or start microphone input',
} as const;

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  PLAY_PAUSE: ['Space', ' ', 'Spacebar'],
  NEXT_IMAGE: ['ArrowRight'],
  PREV_IMAGE: ['ArrowLeft'],
  DELETE: ['Delete', 'Backspace'],
  LAYER_BACK: '[',
  LAYER_FORWARD: ']',
} as const;

/**
 * Render order values
 */
export const RENDER_ORDER = {
  BACKGROUND: -1,
  NORMAL: 1,
} as const;
