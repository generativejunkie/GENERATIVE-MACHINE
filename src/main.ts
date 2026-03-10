/**
 * Mandala Machine - Main Entry Point
 * SSS-Level Architecture Implementation
 * @module main
 */

import { Application } from '@core/Application';
import { UIController } from '@ui/UIController';
import { MATERIALS } from '@materials/geometries';
import './style.css';

console.log('🚀 Mandala Machine SSS Architecture Loading...');

// Initialize application
let app: Application | null = null;
let _uiController: UIController | null = null;

/**
 * Initialize the application
 */
function init() {
  try {
    // Create application instance
    app = new Application('canvasContainer');

    // Setup event listeners
    setupEventListeners();

    // Initialize UI Controller
    _uiController = new UIController(app);
    void _uiController; // Keep reference to prevent garbage collection
    console.log('🎮 UI Controller connected');

    // Start the application
    app.start();

    // Expose API to window for UI integration
    exposeAPI();

    console.log('✅ Mandala Machine initialized successfully!');
    console.log(`📦 ${MATERIALS.length} materials loaded`);

  } catch (error) {
    console.error('❌ Initialization failed:', error);
  }
}

/**
 * Setup application event listeners
 */
function setupEventListeners() {
  if (!app) return;

  // BPM updates
  app.on('audio:bpm', (bpm: number) => {
    console.log(`🎵 BPM: ${bpm}`);
    const bpmDisplay = document.getElementById('bpmDisplay');
    if (bpmDisplay) {
      bpmDisplay.textContent = bpm.toString();
    }
  });

  // Audio state changes
  app.on('audio:playing', (isPlaying: boolean) => {
    console.log(`${isPlaying ? '▶️' : '⏸️'} Audio ${isPlaying ? 'playing' : 'stopped'}`);
  });

  // Instance events
  app.on('instance:added', (instance) => {
    console.log(`➕ Instance #${instance.id} added`);
  });

  app.on('instance:removed', (id) => {
    console.log(`➖ Instance #${id} removed`);
  });

  // State changes
  app.on('state:changed', (state) => {
    console.log('🔄 State updated:', state);
  });

  // Create indicator bars
  createIndicatorBars();

  // Update indicator bars continuously
  setInterval(() => {
    if (app) {
      updateIndicatorBars(app);
    }
  }, 50); // Update every 50ms
}

/**
 * Create indicator bars for frequency visualization
 */
function createIndicatorBars() {
  const container = document.getElementById('indicatorBars');
  if (!container) return;

  // Clear existing bars
  container.innerHTML = '';

  // Create 3 bars (Low, Mid, High)
  for (let i = 0; i < 3; i++) {
    const bar = document.createElement('div');
    bar.className = 'indicator-bar';
    bar.style.cssText = `
      width: 30%;
      height: 0%;
      background: linear-gradient(to top, #4CAF50, #8BC34A);
      border-radius: 2px;
      transition: height 0.1s ease-out;
    `;
    container.appendChild(bar);
  }
}

/**
 * Update indicator bars with frequency data
 */
function updateIndicatorBars(app: Application) {
  const container = document.getElementById('indicatorBars');
  if (!container) return;

  const bars = container.querySelectorAll('.indicator-bar');
  if (bars.length !== 3) return;

  // Get frequency bands from audio manager through app
  const audioManager = (app as any).audioManager;
  if (!audioManager) return;

  const bands = audioManager.getFrequencyBands();

  // Update each bar height
  (bars[0] as HTMLElement).style.height = `${(bands.low / 255) * 100}%`;
  (bars[1] as HTMLElement).style.height = `${(bands.mid / 255) * 100}%`;
  (bars[2] as HTMLElement).style.height = `${(bands.high / 255) * 100}%`;
}

/**
 * Expose API to window object for UI integration
 */
function exposeAPI() {
  if (!app) return;

  // Expose Application instance
  (window as any).mandalaMachine = app;

  // Expose materials
  (window as any).MATERIALS = MATERIALS;

  // Quick access functions
  (window as any).addRandomObject = () => {
    const materialIndex = Math.floor(Math.random() * MATERIALS.length);
    return app?.addInstance(materialIndex);
  };

  (window as any).clearAll = () => {
    app?.clearAll();
  };

  (window as any).toggleMandala = () => {
    app?.toggleMandalaMode();
  };

  (window as any).startMicrophone = async () => {
    return await app?.startMicrophone();
  };

  (window as any).stopAudio = () => {
    app?.stopAudio();
  };

  // AI Features
  (window as any).getAISuggestion = () => {
    return app?.getAISuggestedMaterial();
  };

  (window as any).getAIStats = () => {
    return app?.getAIStatistics();
  };



  console.log(`
📖 API Ready! Available commands:
  - mandalaMachine: Application instance
  - addRandomObject(): Add a random 3D object
  - clearAll(): Clear all objects
  - toggleMandala(): Toggle mandala symmetry mode
  - startMicrophone(): Start audio input
  - stopAudio(): Stop audio playback

🤖 AI Features:
  - getAISuggestion(): Get AI-suggested next material
  - getAIStats(): View AI learning statistics
  - timeTravelBack(steps): Travel back in creation history
  - timeTravelForward(steps): Travel forward in history
  - mutate(): Randomly mutate current mandala
  - evolve(): Evolve mandala using genetic algorithm
  - exportDNA(): Export current mandala as DNA JSON
  - importDNA(json): Import and apply DNA

Try: getAISuggestion()
  `);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for module usage
export { app };
