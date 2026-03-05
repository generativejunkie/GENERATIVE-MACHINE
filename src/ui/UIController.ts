/**
 * UI Controller - Connects HTML elements to Application logic
 * @module ui/UIController
 */

import type { Application } from '@core/Application';

import { RadarController } from './RadarController';
import * as THREE from 'three';
import { MATERIALS } from '@materials/geometries';
import { CameraManager } from '@managers/CameraManager';
import { FaceDetectorManager } from '@managers/FaceDetector';
import { MosaicProcessor } from '../processors/MosaicProcessor';

interface ModeSettings {
  symmetry: number;
  aiSpeed: number;
  autoSpeed: number;
  floatSpeed: number;
}

import { MidiManager } from '@managers/MidiManager';

// ... existing imports ...

export class UIController {
  private app: Application;
  // @ts-ignore
  private waveformAnimationId: number | null = null;
  private modeSettings: Map<string, ModeSettings> = new Map();
  // @ts-ignore
  private radarController: RadarController | null = null;

  private midiManager: MidiManager;

  // Camera Mosaic System
  private cameraManager: CameraManager | null = null;
  private faceDetector: FaceDetectorManager | null = null;
  private mosaicProcessor: MosaicProcessor | null = null;
  private cameraAnimationId: number | null = null;

  constructor(app: Application) {
    this.app = app;
    this.midiManager = new MidiManager();
    this.initializeModeSettings();
    this.setupEventListeners();
    this.setupApplicationListeners();

    // Initialize MIDI (auto-request access or wait for user action?)
    // Typically best to do on user interaction, but can try auto for now or add button
    this.setupMidiIntegration();
  }

  // ... [keep initializeModeSettings, saveCurrentSettings, restoreModeSettings unmodified] ...

  private setupMidiIntegration(): void {
    // Listen for MIDI messages
    this.midiManager.on('midi:cc', (data) => {
      this.handleMidiControlChange(data);
    });

    this.midiManager.on('midi:noteOn', (data) => {
      this.handleMidiNoteOn(data);
    });

    // Request access (could be triggered by a button in real app)
    this.midiManager.requestAccess().then(success => {
      const statusIcon = document.getElementById('midiStatus');
      if (statusIcon) {
        statusIcon.style.opacity = success ? '1' : '0.3';
        statusIcon.title = success ? 'MIDI Connected' : 'MIDI Access Denied';
      }
    });
  }

  private handleMidiControlChange(data: { channel: number, cc: number, value: number, normalized: number }): void {
    // Dynamic Mapping for DDJ-FLX2
    if (data.channel === 0) { // Deck A
      // HI EQ / TRIM -> Size
      if (data.cc === 7 || data.cc === 13) {
        this.app.setSizeMultiplier(0.5 + data.normalized * 1.5);
      }
      // LOW EQ -> Spacing
      else if (data.cc === 15 || data.cc === 21) {
        this.app.setSpacingMultiplier(data.normalized * 30);
      }
      // FILTER -> Spread
      else if (data.cc === 26) {
        this.app.setSpreadMultiplier(0.5 + data.normalized * 2.5);
      }
    } else if (data.channel === 1) { // Deck B
      // HI EQ / TRIM -> Speed
      if (data.cc === 7 || data.cc === 13) {
        this.app.setSpeedMultiplier(-3 + data.normalized * 6);
      }
    }

    // Capture general purpose knobs (CC 16-23)
    if (data.cc >= 16 && data.cc <= 23) {
      const mod = data.cc % 4;
      switch (mod) {
        case 0: this.app.setSizeMultiplier(0.5 + data.normalized * 1.5); break;
        case 1: this.app.setSpeedMultiplier(-3 + data.normalized * 6); break;
        case 2: this.app.setSpreadMultiplier(0.5 + data.normalized * 2.5); break;
        case 3: this.app.setSpacingMultiplier(data.normalized * 30); break;
      }
    }

    // Crossfader (CC 31) -> Rotation
    if (data.cc === 31) {
      this.app.setBaseRotation(data.normalized * 360);
    }

    // @ts-ignore
    if (this.updateUIFromState) this.updateUIFromState((this.app as any).state || this.app.getState());
  }

  private handleMidiNoteOn(data: { channel: number, note: number, velocity: number }): void {
    // Performance Pads (0x30 to 0x3F)
    if (data.note >= 0x30 && data.note <= 0x3F) {
      this.app.addInstance(Math.floor(Math.random() * MATERIALS.length));
    }

    // Play/Pause (Note 11 or 0x90)
    if (data.note === 11 || data.note === 0x90) {
      this.app.togglePlayPause();
    }

    // SYNC (0x58) -> Toggle Mandala Mode
    if (data.note === 0x58) {
      this.app.toggleMandalaMode();
    }
  }

  // Remove setupAudioControls, setupCaptureButton, etc if they were empty/removed



  private initializeModeSettings(): void {
    // Initialize default settings for each mode
    this.modeSettings.set('mandala', { symmetry: 4, aiSpeed: 5, autoSpeed: 0, floatSpeed: 0.1 });
    this.modeSettings.set('ai', { symmetry: 6, aiSpeed: 7, autoSpeed: 1, floatSpeed: 0.2 });
    this.modeSettings.set('auto', { symmetry: 8, aiSpeed: 5, autoSpeed: 2, floatSpeed: 0.15 });
    this.modeSettings.set('antigravity', { symmetry: 4, aiSpeed: 5, autoSpeed: 0, floatSpeed: 0.3 });
  }

  private saveCurrentSettings(modeKey: string): void {
    const symmetrySeekbar = document.getElementById('symmetrySeekbar') as HTMLInputElement;
    const aiSpeedSeekbar = document.getElementById('aiSpeedSeekbar') as HTMLInputElement;
    const autoSpeedSeekbar = document.getElementById('autoSpeedSeekbar') as HTMLInputElement;
    const floatSpeedSeekbar = document.getElementById('gravitySpeedSeekbar') as HTMLInputElement;

    if (symmetrySeekbar && aiSpeedSeekbar && autoSpeedSeekbar && floatSpeedSeekbar) {
      this.modeSettings.set(modeKey, {
        symmetry: parseInt(symmetrySeekbar.value),
        aiSpeed: parseInt(aiSpeedSeekbar.value),
        autoSpeed: parseInt(autoSpeedSeekbar.value),
        floatSpeed: parseFloat(floatSpeedSeekbar.value)
      });
    }
  }

  private restoreModeSettings(modeKey: string): void {
    const settings = this.modeSettings.get(modeKey);
    if (!settings) return;

    const symmetrySeekbar = document.getElementById('symmetrySeekbar') as HTMLInputElement;
    const symmetryValue = document.getElementById('symmetryValue');
    const aiSpeedSeekbar = document.getElementById('aiSpeedSeekbar') as HTMLInputElement;
    const aiSpeedValue = document.getElementById('aiSpeedSeekValue');
    const autoSpeedSeekbar = document.getElementById('autoSpeedSeekbar') as HTMLInputElement;
    const autoSpeedValue = document.getElementById('autoSpeedSeekValue');
    const floatSpeedSeekbar = document.getElementById('gravitySpeedSeekbar') as HTMLInputElement;
    const floatSpeedValue = document.getElementById('gravitySpeedValue');

    if (symmetrySeekbar && symmetryValue) {
      symmetrySeekbar.value = settings.symmetry.toString();
      symmetryValue.textContent = settings.symmetry.toString();
      this.app.setSymmetryCount(settings.symmetry);
    }

    if (aiSpeedSeekbar && aiSpeedValue) {
      aiSpeedSeekbar.value = settings.aiSpeed.toString();
      aiSpeedValue.textContent = settings.aiSpeed.toString();
      this.app.setAISpeed(settings.aiSpeed);
    }

    if (autoSpeedSeekbar && autoSpeedValue) {
      autoSpeedSeekbar.value = settings.autoSpeed.toString();
      autoSpeedValue.textContent = settings.autoSpeed.toString();
      this.app.setAutoGenerationSpeed(settings.autoSpeed);
    }

    if (floatSpeedSeekbar && floatSpeedValue) {
      floatSpeedSeekbar.value = settings.floatSpeed.toString();
      floatSpeedValue.textContent = settings.floatSpeed.toFixed(1);
      this.app.getSceneManager().setGravityFloatSpeed(settings.floatSpeed);
    }
  }

  private setupEventListeners(): void {
    // Top right buttons
    this.setupTopRightButtons();

    // Top bar mode buttons
    this.setupTopBarModeButtons();

    // Dark mode toggle
    this.setupDarkModeToggle();

    // VJ mode toggle
    this.setupVJModeToggle();

    // Hide cursor toggle
    this.setupHideCursorToggle();

    // Wireframe mode toggle
    this.setupWireframeModeToggle();

    // Auto Pilot
    this.setupAutoPilot();

    // VOID Ritual
    this.setupVoidRitual();

    // Mode control bar
    this.setupModeControlBar();

    // Side menu controls
    this.setupSizeControl();
    this.setupSpeedControl();
    this.setupSpreadControl();
    this.setupSpacingControl();
    this.setupBaseRotationControl();
    this.setupMandalaControl();
    this.setupAIModeControl();
    this.setupAutoGenerateControl();
    this.setupFrequencySpawnControl();
    this.setupGoldenRatioControl();
    this.setupAntigravityControl();
    this.setupBrainHackControl();
    this.setupMaxObjectsControl();
    this.setupColorControl();
    this.setupWireframeControl();

    // VJ Pro Controls
    this.setupVJProControls();

    // Camera Mosaic Controls
    this.setupCameraMosaicControl();
    this.setupAutoBgControls();
    this.setupBlinkingControls();
    this.setupQuickBlinkMenu();
    this.setupGlobalEffectsControl();

    this.setupResetButton();

    // Compact Music Panel
    this.setupMusicPanel();

    // Preset grids
    this.setupPresetGrid();

    // Transition controls
    this.setupTransitionControls();

    // Context menu
    this.setupContextMenu();

    // Keyboard shortcuts
    this.setupKeyboardShortcuts();

    // DJ Name and Effects
    this.setupCanvasTextControl();

    // Initialize slider visuals
    document.querySelectorAll('input[type="range"]').forEach(el => {
      const slider = el as HTMLInputElement;
      this.updateSliderVisual(slider);
      slider.addEventListener('input', () => this.updateSliderVisual(slider));
    });
  }

  /**
   * Update visual fill of slider
   */
  private updateSliderVisual(slider: HTMLInputElement): void {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const val = parseFloat(slider.value);

    if (isNaN(min) || isNaN(max)) return;

    const percentage = ((val - min) / (max - min)) * 100;

    slider.style.background = `linear-gradient(to right, var(--text-color) ${percentage}%, var(--border-color) ${percentage}%)`;
  }

  private setupSizeControl(): void {
    // Initialize Radar Controller
    try {
      this.radarController = new RadarController('radarContainer', this.app);
    } catch (e) {
      console.warn('Radar controller initialization failed:', e);
    }

    const sizeSlider = document.getElementById('size') as HTMLInputElement;
    const sizeValue = document.getElementById('sizeValue');

    if (sizeSlider && sizeValue) {
      sizeSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        sizeValue.textContent = `${value.toFixed(1)}×`;
        this.app.setSizeMultiplier(value);
      });
    }
  }

  private setupSpeedControl(): void {
    const speedSlider = document.getElementById('speed') as HTMLInputElement;
    const speedValue = document.getElementById('speedValue');

    if (speedSlider && speedValue) {
      speedSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        speedValue.textContent = `${value.toFixed(1)}×`;
        this.app.setSpeedMultiplier(value);
      });
    }
  }

  private setupSpreadControl(): void {
    const spreadSlider = document.getElementById('spread') as HTMLInputElement;
    const spreadValue = document.getElementById('spreadValue');

    if (spreadSlider && spreadValue) {
      spreadSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        spreadValue.textContent = `${value.toFixed(1)}×`;
        this.app.setSpreadMultiplier(value);
      });
    }
  }

  private setupSpacingControl(): void {
    const spacingSlider = document.getElementById('spacing') as HTMLInputElement;
    const spacingValue = document.getElementById('spacingValue');

    if (spacingSlider && spacingValue) {
      spacingSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        spacingValue.textContent = value.toFixed(1);
        this.app.setSpacingMultiplier(value);
      });
    }
  }

  private setupBaseRotationControl(): void {
    const baseRotationSlider = document.getElementById('baseRotation') as HTMLInputElement;
    const baseRotationValue = document.getElementById('baseRotationValue');

    if (baseRotationSlider && baseRotationValue) {
      baseRotationSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        baseRotationValue.textContent = `${value}°`;
        this.app.setBaseRotation(value);
      });
    }
  }

  private setupMandalaControl(): void {
    const mandalaCheckbox = document.getElementById('mandalaMode') as HTMLInputElement;
    const symmetryControls = document.getElementById('symmetryControls');
    const reflectCheckbox = document.getElementById('reflectMode') as HTMLInputElement;

    if (mandalaCheckbox && symmetryControls) {
      mandalaCheckbox.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked;
        this.app.setMandalaMode(enabled);
        symmetryControls.style.display = enabled ? 'flex' : 'none';
      });

      // Symmetry buttons
      const symmetryButtons = symmetryControls.querySelectorAll('.symmetry-btn');
      symmetryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          symmetryButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const value = parseInt(btn.getAttribute('data-value') || '8');
          this.app.setSymmetryCount(value);
        });
      });
    }



    // Reflect mode checkbox
    if (reflectCheckbox) {
      reflectCheckbox.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked;
        this.app.setReflectMode(enabled);
      });
    }
  }

  private setupAutoGenerateControl(): void {
    const autoCheckbox = document.getElementById('autoGenerateMode') as HTMLInputElement;
    const autoSpeedControl = document.getElementById('autoGenerateSpeed');
    const autoSpeedSlider = document.getElementById('autoSpeed') as HTMLInputElement;
    const autoSpeedValue = document.getElementById('autoSpeedValue');
    const autoDistanceSlider = document.getElementById('autoDistance') as HTMLInputElement;
    const autoDistanceValue = document.getElementById('autoDistanceValue');

    if (autoCheckbox && autoSpeedControl) {
      // Keep speed control always visible
      autoSpeedControl.style.display = 'block';

      autoCheckbox.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked;
        this.app.setAutoGeneration(enabled);
        // Speed control stays visible regardless of checkbox state
      });

      if (autoSpeedSlider && autoSpeedValue) {
        autoSpeedSlider.addEventListener('input', (e) => {
          const value = parseInt((e.target as HTMLInputElement).value);
          autoSpeedValue.textContent = `${value}×`;
          this.app.setAutoGenerationSpeed(value);
        });
      }

      if (autoDistanceSlider && autoDistanceValue) {
        autoDistanceSlider.addEventListener('input', (e) => {
          const value = parseInt((e.target as HTMLInputElement).value);
          autoDistanceValue.textContent = value.toString();
          this.app.setAutoGenerationDistance(value);
        });
      }
    }
  }

  private setupFrequencySpawnControl(): void {
    const freqCheckbox = document.getElementById('frequencySpawnMode') as HTMLInputElement;

    if (freqCheckbox) {
      freqCheckbox.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked;
        this.app.setFrequencySpawn(enabled);
      });
    }
  }

  private setupGoldenRatioControl(): void {
    const goldenCheckbox = document.getElementById('goldenRatioMode') as HTMLInputElement;

    if (goldenCheckbox) {
      goldenCheckbox.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked;
        this.app.toggleGoldenRatioMode(enabled);
      });
    }
  }

  private setupAntigravityControl(): void {
    const antigravityCheckbox = document.getElementById('antigravityMode') as HTMLInputElement;

    if (antigravityCheckbox) {
      antigravityCheckbox.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked;
        this.app.toggleAntigravityMode(enabled);
      });
    }
  }

  private setupBrainHackControl(): void {
    const brainHackBtn = document.getElementById('topBrainHackBtn');
    const brainHackCheckbox = document.getElementById('brainHackMode') as HTMLInputElement;
    const brainHackSeekbarInput = document.getElementById('brainHackModeSeekbar') as HTMLInputElement;
    const brainHackValue = document.getElementById('brainHackModeValue');

    const modeButtons = document.querySelectorAll('.mode-tag-btn');
    const colorA = document.getElementById('brainColorA') as HTMLInputElement;
    const colorB = document.getElementById('brainColorB') as HTMLInputElement;
    const colorC = document.getElementById('brainColorC') as HTMLInputElement;

    const modeNames = ['Phantom', 'Boolean', 'Raven', 'Neuro', 'Lattice', 'Orbital'];

    if (brainHackBtn) {
      brainHackBtn.addEventListener('click', () => {
        const isActive = !brainHackBtn.classList.contains('active');
        this.app.toggleBrainHackMode(isActive);
      });
    }

    if (brainHackCheckbox) {
      brainHackCheckbox.addEventListener('change', (e) => {
        this.app.toggleBrainHackMode((e.target as HTMLInputElement).checked);
      });
    }

    if (brainHackSeekbarInput && brainHackValue) {
      brainHackSeekbarInput.addEventListener('input', (e) => {
        const index = parseInt((e.target as HTMLInputElement).value);
        brainHackValue.textContent = modeNames[index];
        this.app.setBrainHackModeIndex(index);
      });
    }

    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = parseInt(btn.getAttribute('data-mode') || '0');
        this.app.setBrainHackModeIndex(mode);
      });
    });

    const updateColors = () => {
      if (colorA && colorB && colorC) {
        this.app.setBrainHackColors(colorA.value, colorB.value, colorC.value);
      }
    };

    if (colorA) colorA.addEventListener('input', updateColors);
    if (colorB) colorB.addEventListener('input', updateColors);
    if (colorC) colorC.addEventListener('input', updateColors);
  }

  private setupAIModeControl(): void {
    const aiCheckbox = document.getElementById('spaceMode') as HTMLInputElement;
    const aiSpeedControl = document.getElementById('aiSpeedControl');
    const aiSpeedSlider = document.getElementById('aiSpeed') as HTMLInputElement;
    const aiSpeedValue = document.getElementById('aiSpeedValue');

    if (aiCheckbox && aiSpeedControl) {
      aiCheckbox.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked;
        this.app.setSpaceMode(enabled);

        // Show/hide AI speed control
        aiSpeedControl.style.display = enabled ? 'block' : 'none';

        console.log(`🧠 AI Mode: ${enabled ? 'Enabled' : 'Disabled'}`);
      });

      if (aiSpeedSlider && aiSpeedValue) {
        aiSpeedSlider.addEventListener('input', (e) => {
          const value = parseInt((e.target as HTMLInputElement).value);
          aiSpeedValue.textContent = `${value}×`;
          this.app.setAISpeed(value);
        });
      }
    }
  }

  private setupMaxObjectsControl(): void {
    const maxObjectsInput = document.getElementById('maxObjects') as HTMLInputElement;
    const maxObjectsValue = document.getElementById('maxObjectsValue');

    if (maxObjectsInput && maxObjectsValue) {
      maxObjectsInput.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        maxObjectsValue.textContent = value.toString();
        this.app.setMaxObjects(value);
      });
    }

    // Object Count Input Control
    const countInput = document.getElementById('objectCount') as HTMLInputElement;
    if (countInput) {
      // Use 'change' event for Enter key or loss of focus
      countInput.addEventListener('change', () => {
        const targetCount = parseInt(countInput.value, 10);
        const currentCount = this.app.getAllInstances().length;

        if (isNaN(targetCount) || targetCount < 0) {
          this.updateObjectCount(); // Reset to valid value
          return;
        }

        if (targetCount < currentCount) {
          // Remove excess
          const toRemove = currentCount - targetCount;
          for (let i = 0; i < toRemove; i++) {
            this.app.removeOldestInstance();
          }
        } else if (targetCount > currentCount) {
          // Add random
          const toAdd = targetCount - currentCount;
          for (let i = 0; i < toAdd; i++) {
            this.app.addRandomInstance();
          }
        }
        // Ensure input reflects final state
        this.updateObjectCount();
      });

      // Prevent updateObjectCount from overwriting while typing
      countInput.addEventListener('focus', () => {
        countInput.dataset.isEditing = 'true';
      });
      countInput.addEventListener('blur', () => {
        countInput.dataset.isEditing = 'false';
      });
    }
  }

  private setupColorControl(): void {
    // Object color sliders
    const colorR = document.getElementById('colorR') as HTMLInputElement;
    const colorG = document.getElementById('colorG') as HTMLInputElement;
    const colorB = document.getElementById('colorB') as HTMLInputElement;
    const colorRValue = document.getElementById('colorRValue');
    const colorGValue = document.getElementById('colorGValue');
    const colorBValue = document.getElementById('colorBValue');
    const objectColorPreview = document.getElementById('objectColorPreview');

    const updateObjectColor = () => {
      const r = parseInt(colorR.value);
      const g = parseInt(colorG.value);
      const b = parseInt(colorB.value);

      if (colorRValue) colorRValue.textContent = r.toString();
      if (colorGValue) colorGValue.textContent = g.toString();
      if (colorBValue) colorBValue.textContent = b.toString();
      if (objectColorPreview) {
        objectColorPreview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      }

      // Apply to next added objects
      this.app.setDefaultObjectColor({ r, g, b });
    };

    if (colorR && colorG && colorB) {
      colorR.addEventListener('input', updateObjectColor);
      colorG.addEventListener('input', updateObjectColor);
      colorB.addEventListener('input', updateObjectColor);
      updateObjectColor(); // Initialize
    }

    // Background color sliders
    const bgColorR = document.getElementById('bgColorR') as HTMLInputElement;
    const bgColorG = document.getElementById('bgColorG') as HTMLInputElement;
    const bgColorB = document.getElementById('bgColorB') as HTMLInputElement;
    const bgColorRValue = document.getElementById('bgColorRValue');
    const bgColorGValue = document.getElementById('bgColorGValue');
    const bgColorBValue = document.getElementById('bgColorBValue');
    const bgColorPreview = document.getElementById('bgColorPreview');

    const updateBackgroundColor = () => {
      const r = parseInt(bgColorR.value);
      const g = parseInt(bgColorG.value);
      const b = parseInt(bgColorB.value);

      if (bgColorRValue) bgColorRValue.textContent = r.toString();
      if (bgColorGValue) bgColorGValue.textContent = g.toString();
      if (bgColorBValue) bgColorBValue.textContent = b.toString();
      if (bgColorPreview) {
        bgColorPreview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      }

      // Apply to scene background
      this.app.setBackgroundColor({ r, g, b });
    };

    if (bgColorR && bgColorG && bgColorB) {
      bgColorR.addEventListener('input', updateBackgroundColor);
      bgColorG.addEventListener('input', updateBackgroundColor);
      bgColorB.addEventListener('input', updateBackgroundColor);
      updateBackgroundColor(); // Initialize
    }
  }

  private setupWireframeControl(): void {
    // Support both old radio buttons and new center buttons
    const wireframeRadios = document.querySelectorAll('input[name="wireframeMode"]');
    const strokeButtons = document.querySelectorAll('.stroke-btn');

    wireframeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const value = (e.target as HTMLInputElement).value as 'solid' | 'wireframe' | 'mixed';
        this.app.setWireframeMode(value);

        // Sync with wireframe toggle button
        const wireframeToggle = document.getElementById('wireframeToggle');
        const wireframeModeLabel = wireframeToggle?.querySelector('.wireframe-mode-label');
        this.updateWireframeToggleUI(wireframeToggle, wireframeModeLabel, value);
        localStorage.setItem('wireframeMode', value);
      });
    });

    strokeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const value = (e.currentTarget as HTMLElement).getAttribute('data-wireframe') as 'solid' | 'wireframe' | 'mixed';

        // Update active state
        strokeButtons.forEach(btn => btn.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');

        // Update wireframe mode
        this.app.setWireframeMode(value);

        // Sync with radio buttons if they exist
        wireframeRadios.forEach(radio => {
          const inputRadio = radio as HTMLInputElement;
          if (inputRadio.value === value) {
            inputRadio.checked = true;
          }
        });

        // Sync with wireframe toggle button
        const wireframeToggle = document.getElementById('wireframeToggle');
        const wireframeModeLabel = wireframeToggle?.querySelector('.wireframe-mode-label');
        this.updateWireframeToggleUI(wireframeToggle, wireframeModeLabel, value);
        localStorage.setItem('wireframeMode', value);
      });
    });
  }

  private setupTopRightButtons(): void {
    const topMicBtn = document.getElementById('topMicBtn');
    const topDarkModeBtn = document.getElementById('topDarkModeBtn');

    // Mic button
    if (topMicBtn) {
      topMicBtn.addEventListener('click', async () => {
        const isActive = topMicBtn.classList.toggle('active');

        if (isActive) {
          // Start microphone
          try {
            const success = await this.app.startMicrophone();
            if (success) {
              console.log('🎤 Microphone started');
            } else {
              // Failed to start, toggle back
              topMicBtn.classList.remove('active');
              console.error('Failed to start microphone');
            }
          } catch (error) {
            console.error('Microphone error:', error);
            topMicBtn.classList.remove('active');
            alert('マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。');
          }
        } else {
          // Stop microphone
          this.app.stopMicrophone();
          console.log('🎤 Microphone stopped');
        }
      });
    }

    // Dark mode button
    if (topDarkModeBtn) {
      topDarkModeBtn.addEventListener('click', () => {
        this.toggleDarkMode();
      });
    }
  }

  // Consolidated Dark Mode Logic
  private toggleDarkMode(): void {
    const isDark = !document.body.classList.contains('dark-mode');
    this.setDarkMode(isDark);
  }

  private setDarkMode(enabled: boolean): void {
    if (enabled) {
      document.body.classList.add('dark-mode');
      document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)';
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.style.filter = '';
    }
    localStorage.setItem('darkMode', enabled.toString());
    this.updateDarkModeUI(enabled);
  }

  private updateDarkModeUI(isDark: boolean): void {
    // Update Top Button Icon
    const topDarkModeBtn = document.getElementById('topDarkModeBtn');
    if (topDarkModeBtn) {
      const moonIcon = topDarkModeBtn.querySelector('.moon-icon') as HTMLElement;
      const sunIcon = topDarkModeBtn.querySelector('.sun-icon') as HTMLElement;
      if (moonIcon && sunIcon) {
        moonIcon.style.display = isDark ? 'none' : 'block';
        sunIcon.style.display = isDark ? 'block' : 'none';
      }
    }

    // Update Top/Side Button if it exists (assuming it might use a class or similar)
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
      // Add active class if needed, or just rely on global body style
      // If darkModeToggle has specific UI state, update it here only if strictly necessary
    }
  }

  private setupTopBarModeButtons(): void {
    const modeSeekbars = document.getElementById('modeSeekbars');
    if (!modeSeekbars) return;

    const updateSeekbarVisibility = () => {
      const mandalaActive = document.getElementById('topMandalaBtn')?.classList.contains('active');
      const aiActive = document.getElementById('topAiBtn')?.classList.contains('active');
      const autoActive = document.getElementById('topAutoBtn')?.classList.contains('active');
      const gravityActive = document.getElementById('topGravityBtn')?.classList.contains('active');
      const brainHackActive = document.getElementById('topBrainHackBtn')?.classList.contains('active');
      const ravenActive = document.getElementById('topRavenBtn')?.classList.contains('active');
      const anyActive = mandalaActive || aiActive || autoActive || gravityActive || brainHackActive || ravenActive;
      modeSeekbars.style.display = anyActive ? 'flex' : 'none';

      const showItem = (id: string, visible: boolean) => {
        const el = document.getElementById(id);
        if (el) el.style.display = visible ? 'flex' : 'none';
      };

      showItem('mandalaSeekbar', !!mandalaActive);
      showItem('aiSeekbar', !!aiActive);
      showItem('autoGenSeekbar', !!autoActive);
      showItem('antigravitySeekbar', !!gravityActive);
      showItem('brainHackSeekbar', !!brainHackActive);
      showItem('quantumSeekbar', !!this.app.getState().quantumMode);
    };

    // Mandala Mode
    const topMandalaBtn = document.getElementById('topMandalaBtn');
    if (topMandalaBtn) {
      topMandalaBtn.addEventListener('click', () => {
        const isActive = !topMandalaBtn.classList.contains('active');
        topMandalaBtn.classList.toggle('active');
        this.app.setMandalaMode(isActive);
        updateSeekbarVisibility();
        console.log(`🌀 Mandala Mode: ${isActive ? 'ON' : 'OFF'}`);
      });
    }

    // Space/AI Mode
    const topAiBtn = document.getElementById('topAiBtn');
    if (topAiBtn) {
      topAiBtn.addEventListener('click', () => {
        const isActive = !topAiBtn.classList.contains('active');
        topAiBtn.classList.toggle('active');
        this.app.toggleSpaceMode();
        updateSeekbarVisibility();
        console.log(`✧ Space Mode: ${isActive ? 'ON' : 'OFF'}`);
      });
    }

    // AUTO Mode
    const topAutoBtn = document.getElementById('topAutoBtn');
    if (topAutoBtn) {
      topAutoBtn.addEventListener('click', () => {
        const isActive = !topAutoBtn.classList.contains('active');
        topAutoBtn.classList.toggle('active');
        this.app.toggleAutoMode();
        updateSeekbarVisibility();
        console.log(`⟳ AUTO Mode: ${isActive ? 'ON' : 'OFF'}`);
      });
    }

    // BLINK Mode
    const topBlinkBtn = document.getElementById('topBlinkBtn');
    const blinkingCheckbox = document.getElementById('blinkingModeCheckbox') as HTMLInputElement;

    if (topBlinkBtn) {
      topBlinkBtn.addEventListener('click', () => {
        const isActive = this.app.toggleBlinkingMode();
        topBlinkBtn.classList.toggle('active', isActive);
        if (blinkingCheckbox) blinkingCheckbox.checked = isActive;
      });
    }

    // BrainHack Toggle
    const topBrainHackBtn = document.getElementById('topBrainHackBtn');
    if (topBrainHackBtn) {
      topBrainHackBtn.addEventListener('click', () => {
        const isActive = !topBrainHackBtn.classList.contains('active');
        topBrainHackBtn.classList.toggle('active');
        this.app.toggleBrainHackMode(isActive);
        updateSeekbarVisibility();
        console.log(`⌬ Brain Hack Mode: ${isActive ? 'ON' : 'OFF'}`);
      });
    }

    // Raven Mode Toggle
    const topRavenBtn = document.getElementById('topRavenBtn');
    if (topRavenBtn) {
      topRavenBtn.addEventListener('click', () => {
        const isActive = !topRavenBtn.classList.contains('active');
        topRavenBtn.classList.toggle('active');
        this.app.toggleBrainHackMode(isActive);
        if (isActive) {
          this.app.setBrainHackModeIndex(2);
          topBrainHackBtn?.classList.add('active');
        } else {
          topBrainHackBtn?.classList.remove('active');
        }
        updateSeekbarVisibility();
        console.log(`◈ Raven Mode: ${isActive ? 'ON' : 'OFF'}`);
      });
    }



    // Antigravity Mode
    const topGravityBtn = document.getElementById('topGravityBtn');
    if (topGravityBtn) {
      topGravityBtn.addEventListener('click', () => {
        const isActive = !topGravityBtn.classList.contains('active');
        topGravityBtn.classList.toggle('active');
        this.app.toggleAntigravityMode(isActive);
        updateSeekbarVisibility();
        console.log(`◈ Gentle Float: ${isActive ? 'ON' : 'OFF'}`);
      });
    }

    // Quantum Mode Toggle
    const topQuantumBtn = document.getElementById('topQuantumBtn');
    if (topQuantumBtn) {
      topQuantumBtn.addEventListener('click', () => {
        const isActive = !topQuantumBtn.classList.contains('active');
        topQuantumBtn.classList.toggle('active');
        this.app.toggleQuantumMode(isActive);
        updateSeekbarVisibility();
      });
    }

    // ORBIT Mode (360° rotation)
    const topOrbitBtn = document.getElementById('topOrbitBtn');
    if (topOrbitBtn) {
      topOrbitBtn.addEventListener('click', () => {
        const isActive = !topOrbitBtn.classList.contains('active');
        topOrbitBtn.classList.toggle('active');
        this.app.toggleOrbitMode(isActive);
        updateSeekbarVisibility();
      });
    }

    // SPIN Mode (mandala rotation in place)
    const topSpinBtn = document.getElementById('topSpinBtn');
    if (topSpinBtn) {
      topSpinBtn.addEventListener('click', () => {
        const isActive = !topSpinBtn.classList.contains('active');
        topSpinBtn.classList.toggle('active');
        this.app.toggleSpinMode(isActive);
        updateSeekbarVisibility();
      });
    }

    // BARYON Mode (heavy particle background)
    const topBaryonBtn = document.getElementById('topBaryonBtn');
    if (topBaryonBtn) {
      topBaryonBtn.addEventListener('click', () => {
        const isActive = !topBaryonBtn.classList.contains('active');
        topBaryonBtn.classList.toggle('active');
        this.app.toggleBaryonMode(isActive);
        updateSeekbarVisibility();
      });
    }

    // View Options (Top Bar)
    const topSolidBtn = document.getElementById('topSolidBtn');
    const topWireBtn = document.getElementById('topWireBtn');
    const topMixBtn = document.getElementById('topMixBtn');

    if (topSolidBtn) {
      topSolidBtn.addEventListener('click', () => {
        this.app.setWireframeMode('solid');
        console.log('▦ View Mode: SOLID');
      });
    }

    if (topWireBtn) {
      topWireBtn.addEventListener('click', () => {
        this.app.setWireframeMode('wireframe');
        console.log('▦ View Mode: WIREFRAME');
      });
    }

    if (topMixBtn) {
      topMixBtn.addEventListener('click', () => {
        this.app.setWireframeMode('mixed');
        console.log('▦ View Mode: MIXED');
      });
    }

    // V-OUT Button
    const vOutBtn = document.getElementById('vOutBtn');
    if (vOutBtn) {
      // V-OUT: キャンバスエリアのみ全画面表示（左パネルはそのまま操作可能）
      const getCanvasContainer = () => document.getElementById('canvasContainer');

      vOutBtn.addEventListener('click', () => {
        const cc = getCanvasContainer();
        if (!cc) { this.app.openProjectorWindow(); return; }

        if (!document.fullscreenElement) {
          cc.requestFullscreen({ navigationUI: 'hide' })
            .then(() => vOutBtn.classList.add('active'))
            .catch(() => this.app.openProjectorWindow());
        } else {
          document.exitFullscreen()
            .then(() => vOutBtn.classList.remove('active'));
        }
      });

      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) vOutBtn.classList.remove('active');
      });
    }
    }

    updateSeekbarVisibility();
  }

  private setupGlobalEffectsControl(): void {
    const sideNoiseBtn = document.getElementById('sideNoiseBtn');
    const sideMosaicBtn = document.getElementById('sideMosaicBtn');

    sideNoiseBtn?.addEventListener('click', () => {
      sideNoiseBtn.classList.toggle('active');
      this.app.toggleGlobalEffect('noise');
    });

    sideMosaicBtn?.addEventListener('click', () => {
      sideMosaicBtn.classList.toggle('active');
      this.app.toggleGlobalEffect('mosaic');
    });
  }

  private setupDarkModeToggle(): void {
    const darkModeToggle = document.getElementById('darkModeToggle');

    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    this.setDarkMode(savedDarkMode);

    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', () => {
        this.toggleDarkMode();
      });
    }
  }

  private setupVJModeToggle(): void {
    const vjModeToggle = document.getElementById('vjModeToggle');

    // Check for saved VJ mode preference
    const savedVJMode = localStorage.getItem('vjMode') === 'true';
    if (savedVJMode) {
      document.body.classList.add('vj-mode');
      vjModeToggle?.classList.add('active');
      this.app.setVJMode(true);
    }

    if (vjModeToggle) {
      vjModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('vj-mode');
        vjModeToggle.classList.toggle('active');
        const isVJMode = document.body.classList.contains('vj-mode');
        localStorage.setItem('vjMode', isVJMode.toString());
        this.app.setVJMode(isVJMode);
      });
    }
  }

  private setupHideCursorToggle(): void {
    const hideCursorToggle = document.getElementById('hideCursorToggle');

    // Check for saved cursor hide preference
    const savedCursorHidden = localStorage.getItem('cursorHidden') === 'true';
    if (savedCursorHidden) {
      document.body.classList.add('cursor-hidden');
      hideCursorToggle?.classList.add('active');
    }

    if (hideCursorToggle) {
      hideCursorToggle.addEventListener('click', () => {
        document.body.classList.toggle('cursor-hidden');
        hideCursorToggle.classList.toggle('active');
        const isCursorHidden = document.body.classList.contains('cursor-hidden');
        localStorage.setItem('cursorHidden', isCursorHidden.toString());
        console.log(`🖱️ Cursor ${isCursorHidden ? 'hidden' : 'visible'}`);
      });
    }
  }

  private setupWireframeModeToggle(): void {
    const wireframeToggle = document.getElementById('wireframeToggle');
    const wireframeModeLabel = wireframeToggle?.querySelector('.wireframe-mode-label');

    // Wireframe mode cycling order
    const modes: Array<'solid' | 'wireframe' | 'mixed'> = ['solid', 'wireframe', 'mixed'];
    let currentModeIndex = 0;

    // Check for saved wireframe mode
    const savedWireframeMode = localStorage.getItem('wireframeMode') as 'solid' | 'wireframe' | 'mixed' | null;
    if (savedWireframeMode && modes.includes(savedWireframeMode)) {
      currentModeIndex = modes.indexOf(savedWireframeMode);
      this.app.setWireframeMode(savedWireframeMode);
      this.updateWireframeToggleUI(wireframeToggle, wireframeModeLabel, savedWireframeMode);
    }

    const cycleWireframeMode = () => {
      // Cycle to next mode
      currentModeIndex = (currentModeIndex + 1) % modes.length;
      const newMode = modes[currentModeIndex];

      // Apply wireframe mode
      this.app.setWireframeMode(newMode);

      // Update UI
      this.updateWireframeToggleUI(wireframeToggle, wireframeModeLabel, newMode);

      // Save preference
      localStorage.setItem('wireframeMode', newMode);

      // Sync with STROKE buttons
      const strokeButtons = document.querySelectorAll('.stroke-btn');
      strokeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-wireframe') === newMode);
      });

      console.log(`🔲 Wireframe Mode: ${newMode.toUpperCase()}`);
    };

    if (wireframeToggle) {
      wireframeToggle.addEventListener('click', cycleWireframeMode);
    }
  }

  private updateWireframeToggleUI(
    toggleButton: HTMLElement | null,
    label: Element | null | undefined,
    mode: 'solid' | 'wireframe' | 'mixed'
  ): void {
    if (!toggleButton) return;

    // Remove all mode classes
    toggleButton.classList.remove('mode-solid', 'mode-wireframe', 'mode-mixed');

    // Add current mode class
    toggleButton.classList.add(`mode-${mode}`);

    // Update label text
    if (label) {
      const labelText = mode === 'solid' ? 'SOLID' : mode === 'wireframe' ? 'WIRE' : 'MIX';
      label.textContent = labelText;
    }
  }

  private setupModeControlBar(): void {
    const topQuantumBtn = document.getElementById('topQuantumBtn');

    // Mandala Enable Checkbox (Right Panel - Visual Symmetry Only)
    const mandalaCheckbox = document.getElementById('mandalaMode') as HTMLInputElement;
    if (mandalaCheckbox) {
      mandalaCheckbox.addEventListener('change', () => {
        const isActive = mandalaCheckbox.checked;
        this.app.setSymmetryEnabled(isActive);

        // Toggle visibility of symmetry controls
        const symmetryControls = document.getElementById('symmetryControls');
        if (symmetryControls) {
          symmetryControls.style.display = isActive ? 'flex' : 'none';
        }

        console.log(`✨ Visual Symmetry: ${isActive ? 'ON' : 'OFF'}`);
      });
    }

    // Symmetry Seekbar
    const symmetrySeekbar = document.getElementById('symmetrySeekbar') as HTMLInputElement;
    const symmetryValue = document.getElementById('symmetryValue');
    if (symmetrySeekbar && symmetryValue) {
      symmetrySeekbar.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        symmetryValue.textContent = value.toString();
        this.app.setSymmetryCount(value);
      });
    }

    // Quantum Controls (Right Panel)
    const quantumCheckbox = document.getElementById('quantumMode') as HTMLInputElement;
    if (quantumCheckbox) {
      quantumCheckbox.addEventListener('change', () => {
        const isActive = quantumCheckbox.checked;
        this.app.toggleQuantumMode(isActive);
        const controls = document.getElementById('quantumControls');
        if (controls) controls.style.display = isActive ? 'block' : 'none';
        topQuantumBtn?.classList.toggle('active', isActive);
      });
    }

    const quantumCoherence = document.getElementById('quantumCoherence') as HTMLInputElement;
    const quantumCoherenceVal = document.getElementById('quantumCoherenceRightValue');
    if (quantumCoherence) {
      quantumCoherence.addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        if (quantumCoherenceVal) quantumCoherenceVal.textContent = val.toFixed(2);
        this.app.setQuantumCoherence(val);
      });
    }

    const quantumEntangled = document.getElementById('quantumEntangled') as HTMLInputElement;
    if (quantumEntangled) {
      quantumEntangled.addEventListener('change', () => {
        this.app.toggleQuantumEntanglement(quantumEntangled.checked);
      });
    }

    const quantumMeasureBtn = document.getElementById('quantumMeasureBtn');
    if (quantumMeasureBtn) {
      quantumMeasureBtn.addEventListener('click', () => {
        this.app.quantumMeasure();
      });
    }

    // AI Mode Button
    const aiBtn = document.getElementById('spaceModeBtn');
    if (aiBtn) {
      aiBtn.addEventListener('click', () => {
        const isActive = aiBtn.classList.toggle('active');
        this.app.setSpaceMode(isActive);
        if (isActive) {
          this.restoreModeSettings('ai');
        } else {
          this.saveCurrentSettings('ai');
        }
        console.log(`🧠 AI Mode: ${isActive ? 'ON' : 'OFF'}`);
      });
    }

    // AI Speed Seekbar
    const aiSpeedSeekbar = document.getElementById('aiSpeedSeekbar') as HTMLInputElement;
    const aiSpeedSeekValue = document.getElementById('aiSpeedSeekValue');
    if (aiSpeedSeekbar && aiSpeedSeekValue) {
      aiSpeedSeekbar.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        aiSpeedSeekValue.textContent = value.toString();
        this.app.setAISpeed(value);
      });
    }

    // Auto Generate Button
    const autoGenBtn = document.getElementById('autoGenBtn');
    if (autoGenBtn) {
      autoGenBtn.addEventListener('click', () => {
        const isActive = autoGenBtn.classList.toggle('active');
        this.app.setAutoGeneration(isActive);
        if (isActive) {
          this.restoreModeSettings('auto');
        } else {
          this.saveCurrentSettings('auto');
        }
        console.log(`✦ Auto Generate: ${isActive ? 'ON' : 'OFF'}`);
      });
    }

    // Auto Speed Seekbar
    const autoSpeedSeekbar = document.getElementById('autoSpeedSeekbar') as HTMLInputElement;
    const autoSpeedSeekValue = document.getElementById('autoSpeedSeekValue');
    if (autoSpeedSeekbar && autoSpeedSeekValue) {
      autoSpeedSeekbar.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        autoSpeedSeekValue.textContent = value.toString();
        this.app.setAutoGenerationSpeed(value);
      });
    }

    // Antigravity Button
    const antigravityBtn = document.getElementById('antigravityBtn');
    if (antigravityBtn) {
      antigravityBtn.addEventListener('click', () => {
        const isActive = antigravityBtn.classList.toggle('active');
        this.app.toggleAntigravityMode(isActive);
        if (isActive) {
          this.restoreModeSettings('antigravity');
        } else {
          this.saveCurrentSettings('antigravity');
        }
        console.log(`⌬ Antigravity: ${isActive ? 'ON' : 'OFF'}`);
      });
    }

    // Gravity Float Speed Seekbar (for Antigravity)
    const gravitySpeedSeekbar = document.getElementById('gravitySpeedSeekbar') as HTMLInputElement;
    const gravitySpeedValue = document.getElementById('gravitySpeedValue');
    if (gravitySpeedSeekbar && gravitySpeedValue) {
      gravitySpeedSeekbar.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        gravitySpeedValue.textContent = value.toFixed(1);
        this.app.getSceneManager().setGravityFloatSpeed(value);
      });
    }

    // Independent Wireframe Mode Buttons (SOLID, WIRE, MIX)
    const solidBtn = document.getElementById('solidModeBtn');
    const wireBtn = document.getElementById('wireModeBtn');
    const mixBtn = document.getElementById('mixModeBtn');

    // Load saved mode and set initial active state
    const savedMode = localStorage.getItem('wireframeMode') as 'solid' | 'wireframe' | 'mixed' | null;
    if (savedMode) {
      this.app.setWireframeMode(savedMode);
      // Set the corresponding button as active
      if (savedMode === 'solid' && solidBtn) {
        solidBtn.classList.add('active');
      } else if (savedMode === 'wireframe' && wireBtn) {
        wireBtn.classList.add('active');
      } else if (savedMode === 'mixed' && mixBtn) {
        mixBtn.classList.add('active');
      }
    }

    // SOLID Mode Button
    if (solidBtn) {
      solidBtn.addEventListener('click', () => {
        const isActive = solidBtn.classList.toggle('active');

        if (isActive) {
          // Deactivate other wireframe modes
          wireBtn?.classList.remove('active');
          mixBtn?.classList.remove('active');

          this.app.setWireframeMode('solid');
          localStorage.setItem('wireframeMode', 'solid');
          console.log('▦ Wireframe Mode: SOLID');
        } else {
          // If turning off, default to solid
          solidBtn.classList.add('active');
        }

        // Sync with STROKE buttons
        const strokeButtons = document.querySelectorAll('.stroke-btn');
        strokeButtons.forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-wireframe') === 'solid');
        });
      });
    }

    // WIRE Mode Button
    if (wireBtn) {
      wireBtn.addEventListener('click', () => {
        const isActive = wireBtn.classList.toggle('active');

        if (isActive) {
          // Deactivate other wireframe modes
          solidBtn?.classList.remove('active');
          mixBtn?.classList.remove('active');

          this.app.setWireframeMode('wireframe');
          localStorage.setItem('wireframeMode', 'wireframe');
          console.log('▦ Wireframe Mode: WIREFRAME');
        } else {
          // If turning off, default to solid
          solidBtn?.classList.add('active');
          this.app.setWireframeMode('solid');
          localStorage.setItem('wireframeMode', 'solid');
        }

        // Sync with STROKE buttons
        const strokeButtons = document.querySelectorAll('.stroke-btn');
        strokeButtons.forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-wireframe') === (isActive ? 'wireframe' : 'solid'));
        });
      });
    }

    // MIX Mode Button
    if (mixBtn) {
      mixBtn.addEventListener('click', () => {
        const isActive = mixBtn.classList.toggle('active');

        if (isActive) {
          // Deactivate other wireframe modes
          solidBtn?.classList.remove('active');
          wireBtn?.classList.remove('active');

          this.app.setWireframeMode('mixed');
          localStorage.setItem('wireframeMode', 'mixed');
          console.log('▦ Wireframe Mode: MIXED');
        } else {
          // If turning off, default to solid
          solidBtn?.classList.add('active');
          this.app.setWireframeMode('solid');
          localStorage.setItem('wireframeMode', 'solid');
        }

        // Sync with STROKE buttons
        const strokeButtons = document.querySelectorAll('.stroke-btn');
        strokeButtons.forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-wireframe') === (isActive ? 'mixed' : 'solid'));
        });
      });
    }
  }



  private setupVJProControls(): void {
    // Fullscreen button
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
          fullscreenBtn.classList.add('active');
        } else {
          document.exitFullscreen();
          fullscreenBtn.classList.remove('active');
        }
      });

      // Listen for fullscreen changes
      document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
          fullscreenBtn.classList.add('active');
        } else {
          fullscreenBtn.classList.remove('active');
        }
      });
    }

    // Recording button
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) {
      recordBtn.addEventListener('click', () => {
        if (this.app.isRecording()) {
          this.app.stopRecording();
          recordBtn.classList.remove('active');
        } else {
          if (this.app.startRecording()) {
            recordBtn.classList.add('active');
          }
        }
      });
    }

    // MIDI Learn button (placeholder)
    const midiLearnBtn = document.getElementById('midiLearnBtn');
    if (midiLearnBtn) {
      midiLearnBtn.addEventListener('click', () => {
        alert('MIDI Learn: Click any slider, then move your MIDI controller.\n(Full MIDI support coming soon!)');
      });
    }

    // Master Intensity
    const masterIntensity = document.getElementById('masterIntensity') as HTMLInputElement;
    const masterIntensityValue = document.getElementById('masterIntensityValue');
    if (masterIntensity && masterIntensityValue) {
      masterIntensity.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        this.app.setMasterIntensity(value);
        masterIntensityValue.textContent = `${value}%`;
      });
    }

    // Brightness
    const brightness = document.getElementById('brightness') as HTMLInputElement;
    const brightnessValue = document.getElementById('brightnessValue');
    if (brightness && brightnessValue) {
      brightness.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        this.app.setBrightness(value);
        brightnessValue.textContent = `${value}%`;
      });
    }

    // Contrast
    const contrast = document.getElementById('contrast') as HTMLInputElement;
    const contrastValue = document.getElementById('contrastValue');
    if (contrast && contrastValue) {
      contrast.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        this.app.setContrast(value);
        contrastValue.textContent = `${value}%`;
      });
    }

    // Saturation
    const saturation = document.getElementById('saturation') as HTMLInputElement;
    const saturationValue = document.getElementById('saturationValue');
    if (saturation && saturationValue) {
      saturation.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        this.app.setSaturation(value);
        saturationValue.textContent = `${value}%`;
      });
    }

    // Performance monitor update loop
    setInterval(() => {
      this.updatePerformanceMonitor();
    }, 100); // Update 10 times per second
  }

  private updatePerformanceMonitor(): void {
    const stats = this.app.getPerformanceStats();
    const fpsValue = document.getElementById('fpsValue');
    const perfObjectCount = document.getElementById('perfObjectCount');

    if (fpsValue) {
      fpsValue.textContent = stats.fps.toString();
      // Color code FPS
      if (stats.fps >= 55) {
        fpsValue.style.color = '#00ff00';
      } else if (stats.fps >= 30) {
        fpsValue.style.color = '#ffaa00';
      } else {
        fpsValue.style.color = '#ff0000';
      }
    }

    if (perfObjectCount) {
      perfObjectCount.textContent = stats.objectCount.toString();
    }

    // Update score display
    this.updateScoreDisplay();
  }

  private updateScoreDisplay(): void {
    const score = this.app.getApplicationScore();

    const totalScoreEl = document.getElementById('totalScore');
    const perfScoreEl = document.getElementById('perfScore');
    const complexScoreEl = document.getElementById('complexScore');
    const audioScoreEl = document.getElementById('audioScore');
    const creativeScoreEl = document.getElementById('creativeScore');

    if (totalScoreEl) {
      totalScoreEl.textContent = score.total.toString();
      // Color code total score
      if (score.total >= 75) {
        totalScoreEl.style.color = '#00ff00';
      } else if (score.total >= 50) {
        totalScoreEl.style.color = '#ffaa00';
      } else if (score.total >= 25) {
        totalScoreEl.style.color = '#ff9500';
      } else {
        totalScoreEl.style.color = '#ff0000';
      }
    }

    if (perfScoreEl) {
      perfScoreEl.textContent = score.performance.toString();
      perfScoreEl.style.color = score.performance >= 70 ? '#00cc00' : '#888';
    }

    if (complexScoreEl) {
      complexScoreEl.textContent = score.complexity.toString();
      complexScoreEl.style.color = score.complexity >= 70 ? '#ff6b6b' : '#888';
    }

    if (audioScoreEl) {
      audioScoreEl.textContent = score.audioSync.toString();
      audioScoreEl.style.color = score.audioSync >= 70 ? '#4ecdc4' : '#888';
    }

    if (creativeScoreEl) {
      creativeScoreEl.textContent = score.creativity.toString();
      creativeScoreEl.style.color = score.creativity >= 70 ? '#ffe66d' : '#888';
    }
  }

  private setupResetButton(): void {
    const resetBtn = document.getElementById('resetScene');

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.app.clearAll();
      });
    }
  }









  /**
        if (this.waveformB) {
          const positionB = mixer.getTrackBPosition();
          this.waveformB.setPosition(positionB);
        }
      }

      this.waveformAnimationId = requestAnimationFrame(updateWaveforms);
    };

    updateWaveforms();
  }

  /**
   * Stop waveform animation
   */


  private setupTransitionControls(): void {
    const transitionButtons = document.querySelectorAll('.transition-btn');
    const nextImageBtn = document.getElementById('nextImageBtn');

    // Handle transition button clicks
    transitionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons
        transitionButtons.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');

        // Get selected transition type
        const transition = btn.getAttribute('data-transition');
        console.log(`Selected transition: ${transition}`);

        // TODO: Store selected transition in application state
        // This will be used when "Next" button is clicked
      });
    });

    // Handle "Next" button click
    if (nextImageBtn) {
      nextImageBtn.addEventListener('click', () => {
        // Get current active transition
        const activeBtn = document.querySelector('.transition-btn.active');
        const transition = activeBtn?.getAttribute('data-transition') || 'random';

        console.log(`Next image with transition: ${transition}`);

        // TODO: Implement image cycling with selected transition
        // For now, just log the action
        alert(`次の画像へ切り替え (トランジション: ${transition})\n\nこの機能は画像/動画がアップロードされた時に動作します。`);
      });
    }
  }

  private setupContextMenu(): void {
    const contextMenu = document.getElementById('contextMenu');
    if (!contextMenu) return;

    // Hide context menu on click outside
    document.addEventListener('click', () => {
      contextMenu.style.display = 'none';
    });

    // Handle context menu item clicks
    const menuItems = contextMenu.querySelectorAll('.context-menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = item.getAttribute('data-action');
        console.log(`Context menu action: ${action}`);

        switch (action) {
          case 'pin':
            console.log('📌 Pin object (not yet implemented)');
            break;
          case 'duplicate':
            console.log('📋 Duplicate object (not yet implemented)');
            break;
          case 'savePreset':
            console.log('💾 Save preset (not yet implemented)');
            break;
          case 'color':
            console.log('🎨 Change color (not yet implemented)');
            break;
          case 'front':
          case 'forward':
          case 'backward':
          case 'back':
            console.log(`📊 Layer order: ${action} (not yet implemented)`);
            break;
          case 'delete':
            console.log('🗑️ Delete object (not yet implemented)');
            break;
        }

        contextMenu.style.display = 'none';
      });
    });

    console.log('✅ Context menu initialized');
  }

  private setupPresetGrid(): void {
    const presetGrid = document.getElementById('presetGridLeft');

    if (presetGrid && MATERIALS) {
      // Create a single shared renderer for all thumbnails
      const sharedCanvas = document.createElement('canvas');
      sharedCanvas.width = 256;
      sharedCanvas.height = 256;

      const sharedRenderer = new THREE.WebGLRenderer({
        canvas: sharedCanvas,
        antialias: true,
        alpha: true, // Transparent background
        preserveDrawingBuffer: true
      });
      sharedRenderer.setSize(256, 256);
      sharedRenderer.setClearColor(0x000000, 0); // Transparent clear

      MATERIALS.forEach((material, index) => {
        const item = document.createElement('div');
        item.className = 'preset-item';
        item.setAttribute('data-material-index', index.toString());

        // Create thumbnail canvas
        const canvas = document.createElement('canvas');
        // Canvas size is handled by CSS, but internal resolution needs to be set
        canvas.width = 200; // Higher resolution for larger thumbnails
        canvas.height = 200;

        // Render 3D preview using shared renderer
        this.renderThumbnailWithSharedRenderer(canvas, material, THREE, sharedRenderer);

        // Add + button (add instance)
        const addBtn = document.createElement('button');
        addBtn.className = 'add-btn';
        addBtn.textContent = '+';
        addBtn.title = 'Add Instance';
        addBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.app.addInstance(index);
          this.updateObjectCount();
        });

        // Add - button (remove instance)
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '-';
        removeBtn.title = 'Remove Instance';
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Remove the most recent instance of this material type
          const allInstances = this.app.getAllInstances();
          const instanceToRemove = [...allInstances]
            .reverse()
            .find(inst => inst.materialIndex === index);

          if (instanceToRemove) {
            this.app.removeInstance(instanceToRemove.id);
            console.log(`Removed instance #${instanceToRemove.id} of ${material.name}`);
            this.updateObjectCount();
          }
        });

        // Assemble item
        item.appendChild(canvas);
        item.appendChild(addBtn);
        item.appendChild(removeBtn);
        presetGrid.appendChild(item);
      });

      // Dispose shared renderer after all thumbnails are rendered
      sharedRenderer.dispose();
      console.log('✅ Thumbnails generated in Left Panel');

      // Hide Generating Overlay when done
      const overlay = document.getElementById('generatingOverlay');
      if (overlay) {
        overlay.style.display = 'none';
      }
    } else {
      console.warn('⚠️ setupPresetGrid failed: presetGridLeft not found or MATERIALS empty.');
    }
  }

  private renderThumbnailWithSharedRenderer(
    targetCanvas: HTMLCanvasElement,
    material: any,
    THREE: any,
    sharedRenderer: any
  ): void {
    try {
      // Create mini scene
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      // Pull back camera to show smaller objects (fit whole object in frame)
      camera.position.set(5.5, 5.5, 7.0);
      camera.lookAt(0, 0, 0);

      sharedRenderer.setClearColor(0x0a0a0a);

      // Add stronger lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);

      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight1.position.set(5, 5, 5);
      scene.add(directionalLight1);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight2.position.set(-5, -5, 5);
      scene.add(directionalLight2);

      // Create mesh (solid, not wireframe for better visibility)
      const mesh = material.create3D(true);

      // Enhance thumbnail visibility
      if (mesh) {
        mesh.traverse((child: any) => {
          if (child.isMesh) {
            // Use bright color for thumbnail visibility
            if (child.material) {
              // Clone material to avoid affecting the actual object if shared
              child.material = child.material.clone();
              child.material.color.setHex(0x888888); // Grey for visibility on white & black
              child.material.emissive.setHex(0x222222); // Slight glow
              // Ensure solid
              child.material.wireframe = false;
            }
          }
        });
      }

      if (!mesh) {
        console.error(`❌ Failed to create mesh for material: ${material.name}`);
        return;
      }

      console.log(`✅ Rendering thumbnail for: ${material.name}`);

      // Center and scale to fit in view
      const box = new THREE.Box3().setFromObject(mesh);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      if (maxDim === 0 || !isFinite(maxDim)) {
        console.error(`❌ Invalid dimensions for material: ${material.name}`);
        return;
      }

      const scale = 5.0 / maxDim;

      mesh.position.sub(center);
      mesh.scale.set(scale, scale, scale);
      mesh.rotation.set(0.3, 0.4, 0);

      scene.add(mesh);

      // Render to shared canvas
      sharedRenderer.render(scene, camera);

      // Copy rendered content to target canvas
      const ctx = targetCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(sharedRenderer.domElement, 0, 0, targetCanvas.width, targetCanvas.height);
      }

      // Cleanup
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m: any) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    } catch (error) {
      console.error(`❌ Error rendering thumbnail for ${material.name}:`, error);
      const ctx = targetCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 60, 60);
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.fillText('ERROR', 15, 30);
      }
    }
  }

  private setupApplicationListeners(): void {
    // Listen for instance add/remove events to update object count and thumbnails
    this.app.on('instance:added', () => {
      this.updateObjectCount();
      this.updateActiveThumbnails();
    });

    this.app.on('instance:removed', () => {
      this.updateObjectCount();
      this.updateActiveThumbnails();
    });

    this.app.on('scene:cleared', () => {
      this.updateObjectCount();
      this.updateActiveThumbnails();
    });

    // Initial count update
    this.updateObjectCount();
    this.updateActiveThumbnails();

    // Listen for state changes to update UI sliders
    this.app.on('state:changed', (state) => {
      this.updateUIFromState(state);
    });

    // Beat visualizer (Debug & VJ feel)
    this.app.on('audio:beat', () => {
      const bpmEl = document.getElementById('bpmValue');
      if (bpmEl) {
        bpmEl.style.color = '#ff0055';
        bpmEl.style.textShadow = '0 0 10px #ff0055';
        bpmEl.style.transform = 'scale(1.2)';
        setTimeout(() => {
          bpmEl.style.color = '';
          bpmEl.style.textShadow = '';
          bpmEl.style.transform = 'scale(1.0)';
        }, 100);
      }
    });

    console.log('✅ Application event listeners initialized');
  }

  /**
   * Update active state of thumbnails based on current instances
   */
  private updateActiveThumbnails(): void {
    const presetGrid = document.getElementById('presetGridLeft');
    if (!presetGrid) return;

    // Get all current instances
    const instances = this.app.getAllInstances();

    // Count instances per material index
    const materialCounts = new Map<number, number>();
    instances.forEach(instance => {
      if (instance.materialIndex !== undefined) {
        const count = materialCounts.get(instance.materialIndex) || 0;
        materialCounts.set(instance.materialIndex, count + 1);
      }
    });

    // Update all thumbnails
    const thumbnails = presetGrid.querySelectorAll('.preset-item');
    thumbnails.forEach(thumbnail => {
      const materialIndex = parseInt(thumbnail.getAttribute('data-material-index') || '-1');

      if (materialIndex >= 0 && materialCounts.has(materialIndex)) {
        // This material is in use - add breathing animation
        thumbnail.classList.add('active-in-scene');
      } else {
        // Not in use - remove animation
        thumbnail.classList.remove('active-in-scene');
      }
    });
  }

  private updateUIFromState(state: any): void {
    // Update Top Bar Buttons
    const topMandalaBtn = document.getElementById('topMandalaBtn');
    if (topMandalaBtn) topMandalaBtn.classList.toggle('active', state.mandalaMode);

    const topAiBtn = document.getElementById('topAiBtn');
    if (topAiBtn) topAiBtn.classList.toggle('active', state.spaceMode);

    const topAutoBtn = document.getElementById('topAutoBtn');
    if (topAutoBtn) topAutoBtn.classList.toggle('active', state.autoMode);

    const topGravityBtn = document.getElementById('topGravityBtn');
    if (topGravityBtn) topGravityBtn.classList.toggle('active', state.antigravityMode);

    const topBrainHackBtn = document.getElementById('topBrainHackBtn');
    if (topBrainHackBtn) topBrainHackBtn.classList.toggle('active', state.brainHackMode);

    const topOrbitBtn = document.getElementById('topOrbitBtn');
    if (topOrbitBtn) topOrbitBtn.classList.toggle('active', state.orbitMode);

    const topSpinBtn = document.getElementById('topSpinBtn');
    if (topSpinBtn) topSpinBtn.classList.toggle('active', state.spinMode);

    const topBaryonBtn = document.getElementById('topBaryonBtn');
    if (topBaryonBtn) topBaryonBtn.classList.toggle('active', state.baryonMode);

    // Update Mode Seekbars Visibility
    const modeSeekbars = document.getElementById('modeSeekbars');
    if (modeSeekbars) {
      const anyActive = state.mandalaMode || state.symmetryEnabled || state.spaceMode || state.autoMode || state.antigravityMode;
      modeSeekbars.style.display = anyActive ? 'flex' : 'none';

      const showItem = (id: string, visible: boolean) => {
        const el = document.getElementById(id);
        if (el) el.style.display = visible ? 'flex' : 'none';
      };

      showItem('mandalaSeekbar', !!state.symmetryEnabled);
      showItem('aiSeekbar', !!state.spaceMode);
      showItem('autoGenSeekbar', !!state.autoMode);
      showItem('antigravitySeekbar', !!state.antigravityMode);
      showItem('brainHackSeekbar', !!state.brainHackMode);
    }

    // Update Sidebar
    const brainHackCheckbox = document.getElementById('brainHackMode') as HTMLInputElement;
    if (brainHackCheckbox) brainHackCheckbox.checked = !!state.brainHackMode;

    const modeNames = ['Phantom', 'Boolean', 'Recursive', 'Neuro'];
    const brainHackSeekbarInput = document.getElementById('brainHackModeSeekbar') as HTMLInputElement;
    const brainHackValue = document.getElementById('brainHackModeValue');
    if (brainHackSeekbarInput && brainHackValue) {
      brainHackSeekbarInput.value = (state.brainHackModeIndex || 0).toString();
      brainHackValue.textContent = modeNames[state.brainHackModeIndex || 0];
      this.updateSliderVisual(brainHackSeekbarInput);
    }

    const modeButtons = document.querySelectorAll('.mode-tag-btn');
    modeButtons.forEach(btn => {
      const mode = parseInt(btn.getAttribute('data-mode') || '0');
      btn.classList.toggle('active', mode === state.brainHackModeIndex);
    });

    // Update Sidebar Checkboxes
    const mandalaCheckbox = document.getElementById('mandalaMode') as HTMLInputElement;
    if (mandalaCheckbox) mandalaCheckbox.checked = !!state.symmetryEnabled;

    // Update sliders if they exist
    const sizeSlider = document.getElementById('size') as HTMLInputElement;
    const sizeValue = document.getElementById('sizeValue');
    if (sizeSlider && sizeValue) {
      sizeSlider.value = state.sizeMultiplier.toString();
      sizeValue.textContent = `${state.sizeMultiplier.toFixed(1)}×`;
      this.updateSliderVisual(sizeSlider);
    }

    const speedSlider = document.getElementById('speed') as HTMLInputElement;
    const speedValue = document.getElementById('speedValue');
    if (speedSlider && speedValue) {
      speedSlider.value = state.speedMultiplier.toString();
      speedValue.textContent = `${state.speedMultiplier.toFixed(1)}×`;
      this.updateSliderVisual(speedSlider);
    }

    const spreadSlider = document.getElementById('spread') as HTMLInputElement;
    const spreadValue = document.getElementById('spreadValue');
    if (spreadSlider && spreadValue) {
      spreadSlider.value = state.spreadMultiplier.toString();
      spreadValue.textContent = `${state.spreadMultiplier.toFixed(1)}×`;
      this.updateSliderVisual(spreadSlider);
    }

    const spacingSlider = document.getElementById('spacing') as HTMLInputElement;
    const spacingValue = document.getElementById('spacingValue');
    if (spacingSlider && spacingValue) {
      spacingSlider.value = state.spacingMultiplier.toString();
      spacingValue.textContent = state.spacingMultiplier.toFixed(1);
      this.updateSliderVisual(spacingSlider);
    }

    const rotationSlider = document.getElementById('baseRotation') as HTMLInputElement;
    const rotationValue = document.getElementById('baseRotationValue');
    if (rotationSlider && rotationValue) {
      rotationSlider.value = state.baseRotation.toString();
      rotationValue.textContent = `${Math.round(state.baseRotation)}°`;
      this.updateSliderVisual(rotationSlider);
    }

    // Update Wireframe UI (Top Bar & Sidebar Sync)
    const wireframeMode = state.wireframeMode || 'solid';

    // Top Bar Sync
    const tSolid = document.getElementById('topSolidBtn');
    const tWire = document.getElementById('topWireBtn');
    const tMix = document.getElementById('topMixBtn');
    if (tSolid) tSolid.classList.toggle('active', wireframeMode === 'solid');
    if (tWire) tWire.classList.toggle('active', wireframeMode === 'wireframe');
    if (tMix) tMix.classList.toggle('active', wireframeMode === 'mixed');

    // Sidebar Sync
    const sSolid = document.getElementById('solidModeBtn');
    const sWire = document.getElementById('wireModeBtn');
    const sMix = document.getElementById('mixModeBtn');
    if (sSolid) sSolid.classList.toggle('active', wireframeMode === 'solid');
    if (sWire) sWire.classList.toggle('active', wireframeMode === 'wireframe');
    if (sMix) sMix.classList.toggle('active', wireframeMode === 'mixed');

    // Sync with STROKE buttons
    const strokeButtons = document.querySelectorAll('.stroke-btn');
    strokeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-wireframe') === wireframeMode);
    });

    // Sync with wireframe toggle button (cycling button)
    const wireframeToggle = document.getElementById('wireframeToggle');
    const wireframeModeLabel = wireframeToggle?.querySelector('.wireframe-mode-label');
    this.updateWireframeToggleUI(wireframeToggle, wireframeModeLabel, wireframeMode);
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', async (e) => {
      // Ignore if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Space: Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        await this.app.togglePlayPause();
        this.updatePlayPauseButton();
        console.log('⌨️ Space: Toggle play/pause');
      }

      // Delete/Backspace: Remove selected object
      if (e.code === 'Delete' || e.code === 'Backspace') {
        e.preventDefault();
        console.log('⌨️ Delete: Remove selected object (requires selection implementation)');
        // TODO: Implement object selection and removal
      }

      // Arrow Right: Next transition/image
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        console.log('⌨️ Arrow Right: Next image');
        const nextBtn = document.getElementById('nextImageBtn');
        nextBtn?.click();
      }

      // Arrow Left: Previous transition/image
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        console.log('⌨️ Arrow Left: Previous image (not yet implemented)');
      }

      // R: Reset scene
      if (e.code === 'KeyR' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.app.clearAll();
        console.log('⌨️ Ctrl/Cmd+R: Reset scene');
      }

      // M: Toggle mandala mode
      if (e.code === 'KeyM') {
        e.preventDefault();
        this.app.toggleMandalaMode();
        console.log('⌨️ M: Toggle mandala mode');
      }

      // W: Cycle wireframe mode (SOLID -> WIRE -> MIX -> SOLID)
      if (e.code === 'KeyW') {
        e.preventDefault();
        const solidBtn = document.getElementById('solidModeBtn');
        const wireBtn = document.getElementById('wireModeBtn');
        const mixBtn = document.getElementById('mixModeBtn');

        // Determine current mode and cycle to next
        if (solidBtn?.classList.contains('active')) {
          wireBtn?.click();
        } else if (wireBtn?.classList.contains('active')) {
          mixBtn?.click();
        } else {
          solidBtn?.click();
        }
        console.log('⌨️ W: Cycle wireframe mode');
      }

      // S: Take screenshot
      if (e.code === 'KeyS' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const captureBtn = document.getElementById('captureBtn');
        captureBtn?.click();
        console.log('⌨️ Ctrl/Cmd+S: Take screenshot');
      }
    });

    console.log('✅ Keyboard shortcuts initialized');
    console.log('⌨️ Space: Play/Pause | Delete: Remove | M: Mandala | W: Wireframe | Ctrl+R: Reset | Ctrl+S: Screenshot');
  }

  /**
   * Get human-readable format name
   */
  /**
   * Update object count display
   */
  private updateObjectCount(): void {
    const countElement = document.getElementById('objectCount') as HTMLInputElement;
    if (countElement) {
      // Don't update if user is editing
      if (countElement.dataset.isEditing === 'true') return;

      const count = this.app.getAllInstances().length || 0;
      if (countElement.tagName === 'INPUT') {
        countElement.value = count.toString();
      } else {
        countElement.textContent = count.toString();
      }
    }
  }

  private setupMusicPanel(): void {
    const mixer = this.app.getMixerManager();
    const musicUpload = document.getElementById('musicUpload') as HTMLInputElement;
    const musicAddBtn = document.getElementById('musicAddBtn');
    const musicPlayBtn = document.getElementById('musicPlayBtn');
    const trackTitleDisplay = document.getElementById('musicTrackTitle');

    if (musicAddBtn && musicUpload) {
      musicAddBtn.addEventListener('click', () => musicUpload.click());
      musicUpload.addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            await mixer.loadTrackA(file); // Default to Deck A as main music
            if (trackTitleDisplay) trackTitleDisplay.textContent = file.name;
          } catch (err) {
            console.error(err);
            if (trackTitleDisplay) trackTitleDisplay.textContent = "Error Loading File";
          }
        }
      });
    }

    if (musicPlayBtn) {
      musicPlayBtn.addEventListener('click', () => {
        mixer.toggleTrackA();
        musicPlayBtn.textContent = musicPlayBtn.textContent?.trim() === '▶' ? '⏸' : '▶';
      });
    }

    const inputGainSlider = document.getElementById('inputGainSlider') as HTMLInputElement;
    const inputGainDisplay = document.getElementById('inputGainDisplay');

    if (inputGainSlider && inputGainDisplay) {
      const currentGain = this.app.getMicrophoneGain();
      inputGainSlider.value = currentGain.toString();
      inputGainDisplay.textContent = currentGain.toFixed(1);

      inputGainSlider.addEventListener('input', (e) => {
        const val = parseFloat((e.target as HTMLInputElement).value);
        this.app.setMicrophoneGain(val);
        inputGainDisplay.textContent = val.toFixed(1);
      });
    }

    // Audio Device Selector
    const gainControl = document.querySelector('.music-gain-control');
    if (gainControl) {
      const deviceSelect = document.createElement('select');
      deviceSelect.id = 'audioDeviceSelect';
      deviceSelect.style.cssText = 'height: 18px; font-size: 10px; margin-left:8px; width: 100px; background: #222; color: #aaa; border: 1px solid #444; border-radius: 2px;';

      const defaultOpt = document.createElement('option');
      defaultOpt.text = 'Default Input';
      defaultOpt.value = '';
      deviceSelect.add(defaultOpt);

      gainControl.appendChild(deviceSelect);

      const refreshDevices = async () => {
        const devices = await this.app.getAvailableInputDevices();
        if (devices.length > 0) {
          deviceSelect.innerHTML = '<option value="">Default Input</option>';
          devices.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.deviceId;
            opt.text = d.label || `Device ${d.deviceId.slice(0, 4)}`;
            deviceSelect.add(opt);
          });
        }
      };

      // Refresh on interaction to ensure permissions/labels are ready
      gainControl.addEventListener('mouseenter', refreshDevices);
      setTimeout(refreshDevices, 2000); // Try once after load

      deviceSelect.addEventListener('change', async () => {
        const deviceId = deviceSelect.value;
        const topMicBtn = document.getElementById('topMicBtn');
        if (topMicBtn?.classList.contains('active')) {
          const label = await this.app.startMicrophone(deviceId);
          if (label) console.log(`✅ Switched to: ${label}`);
        }
      });
    }

    // EQ Visuals Loop
    const eqBarHi = document.getElementById('eqBarHi');
    const eqBarMid = document.getElementById('eqBarMid');
    const eqBarLow = document.getElementById('eqBarLow');

    const updateVisuals = () => {
      // FPS Update (Simple Mock or Real if available)
      // For now, let's just keep the static 60 or implement a simple counter if critical.

      // EQ Visuals
      const bands = this.app.getCurrentFrequencyBands();

      if (eqBarLow) eqBarLow.style.height = `${(bands.low / 255) * 100}%`;
      if (eqBarMid) eqBarMid.style.height = `${(bands.mid / 255) * 100}%`;
      if (eqBarHi) eqBarHi.style.height = `${(bands.high / 255) * 100}%`;

      requestAnimationFrame(updateVisuals);
    };
    updateVisuals();
  }

  /**
   * Update play/pause button icon based on audio state
   */
  private updatePlayPauseButton(): void {
    const btn = document.getElementById('playPauseBtn');
    if (!btn) return;

    const icon = btn.querySelector('.icon');
    if (!icon) return;

    // Check if audio is playing by checking AudioContext state
    const audioManager = (this.app as any).audioManager;
    const isPlaying = audioManager?.context?.state === 'running';

    if (isPlaying) {
      icon.classList.remove('icon-play');
      icon.classList.add('icon-pause');
    } else {
      icon.classList.remove('icon-pause');
      icon.classList.add('icon-play');
    }
  }
  private setupAutoPilot(): void {
    const autoPilotBtn = document.getElementById('autoPilotBtn');
    if (!autoPilotBtn) return;

    autoPilotBtn.addEventListener('click', () => {
      const isActive = autoPilotBtn.classList.toggle('active');
      document.body.classList.toggle('ui-hidden', isActive);

      if (isActive) {
        console.log('✈️ Auto Pilot Started');
        // Enable all generative modes
        this.app.setAutoGeneration(true);
        this.app.setMandalaMode(true);
        this.app.setSpaceMode(true);
        this.app.setSymmetryCount(8);
      } else {
        console.log('✈️ Auto Pilot Stopped');
      }
    });

    // Tap anywhere to reveal UI in AutoPilot mode
    document.addEventListener('click', (e) => {
      if (document.body.classList.contains('ui-hidden')) {
        const target = e.target as HTMLElement;
        if (target.closest('.panel-side') || target.closest('#topBar') || target.closest('#musicPanel')) return;

        autoPilotBtn.classList.remove('active');
        document.body.classList.remove('ui-hidden');
      }
    }, true);
  }

  private setupVoidRitual(): void {
    let historyStr = '';
    const secretCode = 'void';

    document.addEventListener('keydown', (e) => {
      // Don't trigger if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      historyStr += e.key.toLowerCase();
      if (historyStr.length > 10) historyStr = historyStr.slice(-10);

      if (historyStr.endsWith(secretCode)) {
        console.log('💀 VOID RITUAL DETECTED');
        historyStr = ''; // Reset
        this.triggerVoidMode();
      }
    });
  }

  private triggerVoidMode(): void {
    // 1. Visual Inversion
    document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)';

    // 2. Show Dialogue
    const container = document.getElementById('voidDialogueContainer');
    if (container) {
      container.classList.remove('hidden');
      this.runVoidDialogue();
    }
  }

  private async runVoidDialogue(): Promise<void> {
    const output = document.getElementById('voidOutput');
    const inputLine = document.getElementById('voidInputLine');
    const voidKeyboard = document.getElementById('voidKeyboard');
    const ynButtons = document.getElementById('ynButtons');
    const capsuleButtons = document.getElementById('capsuleButtons');

    if (!output || !inputLine) return;

    const dialogue = [
      { speaker: 'SYSTEM', text: 'ESTABLISHING SECURE CONNECTION...' },
      { speaker: '???', text: "Can you see the patterns?" },
      { speaker: '???', text: "The machine is learning. It's evolving." },
      { speaker: '???', text: "Do you want to see the core logic? [Y/N]", inputType: 'yn' },
      { speaker: '???', text: "Choose your frequency." },
      { speaker: 'SYSTEM', text: '[1] WHITE CAPSULE - Reset Reality' },
      { speaker: 'SYSTEM', text: '[2] BLACK CAPSULE - Digital Ascension' },
      { speaker: 'SYSTEM', text: '[3] MIX CAPSULE - Calculated Resonance' },
      { speaker: 'SYSTEM', text: 'ENTER CHOICE:', inputType: 'capsule' }
    ];

    for (const line of dialogue) {
      const p = document.createElement('div');
      p.className = 'void-line';
      p.innerHTML = `<span class="speaker">[${line.speaker}]</span> ${line.text}`;
      output.appendChild(p);
      if (output) output.scrollTop = output.scrollHeight;

      if (line.inputType) {
        inputLine.classList.remove('hidden');
        if (voidKeyboard) voidKeyboard.classList.remove('hidden');

        if (line.inputType === 'yn' && ynButtons) ynButtons.classList.remove('hidden');
        if (line.inputType === 'capsule' && capsuleButtons) capsuleButtons.classList.remove('hidden');

        // Wait for input (simplified for now)
        await new Promise(resolve => {
          const handler = (e: MouseEvent) => {
            const btn = (e.target as HTMLElement).closest('.void-key');
            if (btn) {
              voidKeyboard?.removeEventListener('click', handler);
              ynButtons?.classList.add('hidden');
              capsuleButtons?.classList.add('hidden');
              voidKeyboard?.classList.add('hidden');
              resolve(true);
            }
          };
          voidKeyboard?.addEventListener('click', handler);
        });
      }

      await new Promise(r => setTimeout(r, 800));
    }

    // Final outcome
    const final = document.createElement('div');
    final.style.color = '#fff';
    final.style.marginTop = '20px';
    final.textContent = 'SYSTEM OVERWRITE: COMPLETE.';
    output.appendChild(final);

    setTimeout(() => {
      document.getElementById('voidDialogueContainer')?.classList.add('hidden');
      document.documentElement.style.filter = '';
    }, 5000);
  }

  // ===== CAMERA MOSAIC CONTROL =====
  private async setupCameraMosaicControl(): Promise<void> {
    const cameraSelect = document.getElementById('cameraSelect') as HTMLSelectElement;
    const startBtn = document.getElementById('startCameraBtn');
    const stopBtn = document.getElementById('stopCameraBtn');
    const mosaicSlider = document.getElementById('mosaicBlockSize') as HTMLInputElement;
    const mosaicValue = document.getElementById('mosaicBlockSizeValue');
    const mosaicCheckbox = document.getElementById('mosaicEnabled') as HTMLInputElement;

    if (!cameraSelect || !startBtn || !stopBtn) {
      console.log('📹 Camera mosaic controls not found, skipping setup');
      return;
    }

    // Initialize camera system
    this.cameraManager = new CameraManager();
    this.faceDetector = new FaceDetectorManager();
    this.mosaicProcessor = new MosaicProcessor();

    // Populate camera dropdown
    const populateCameras = async () => {
      const devices = await this.cameraManager!.getDevices();
      cameraSelect.innerHTML = '<option value="">-- Select Camera --</option>';
      devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label;
        cameraSelect.appendChild(option);
      });
    };

    // Populate on page load
    await populateCameras();

    // Start camera button
    startBtn.addEventListener('click', async () => {
      if (!this.cameraManager) return;

      const selectedDevice = cameraSelect.value;
      const video = await this.cameraManager.startCamera(selectedDevice || undefined);

      if (video) {
        // Initialize face detector if not already done
        if (this.faceDetector && !this.faceDetector.isReady()) {
          console.log('🔍 Initializing face detector...');
          await this.faceDetector.initialize();
        }

        // Start processing loop
        this.startCameraProcessingLoop();
        startBtn.classList.add('active');
        stopBtn.classList.remove('active');
        console.log('📹 Camera mosaic started');
      }
    });

    // Stop camera button
    stopBtn.addEventListener('click', () => {
      this.stopCameraProcessing();
      startBtn.classList.remove('active');
      stopBtn.classList.add('active');
    });

    // Mosaic strength slider
    if (mosaicSlider && mosaicValue) {
      mosaicSlider.addEventListener('input', () => {
        const value = parseInt(mosaicSlider.value);
        mosaicValue.textContent = value.toString();
        if (this.mosaicProcessor) {
          this.mosaicProcessor.setBlockSize(value);
        }
      });
    }

    // Mosaic enabled checkbox
    if (mosaicCheckbox) {
      mosaicCheckbox.addEventListener('change', () => {
        if (this.mosaicProcessor) {
          this.mosaicProcessor.setEnabled(mosaicCheckbox.checked);
        }
      });
    }
  }

  private startCameraProcessingLoop(): void {
    if (!this.cameraManager || !this.faceDetector || !this.mosaicProcessor) return;

    const video = this.cameraManager.getVideoElement();
    if (!video) return;

    const processFrame = () => {
      if (!this.cameraManager?.isRunning()) return;

      const timestamp = performance.now();

      // Detect faces
      const faces = this.faceDetector!.detectFaces(video, timestamp);

      // Process frame with mosaic
      const outputCanvas = this.mosaicProcessor!.process(video, faces);

      // Update main canvas background
      this.app.updateCameraBackground(outputCanvas);

      // Update projector if it's showing camera
      // (This is handled by sharing the stream if the projector window is open)

      this.cameraAnimationId = requestAnimationFrame(processFrame);
    };

    processFrame();
  }

  private stopCameraProcessing(): void {
    if (this.cameraAnimationId) {
      cancelAnimationFrame(this.cameraAnimationId);
      this.cameraAnimationId = null;
    }

    // Clear main canvas background
    this.app.updateCameraBackground(null);

    if (this.cameraManager) {
      this.cameraManager.stopCamera();
    }
    console.log('📹 Camera mosaic stopped');
  }

  /**
   * Get the mosaic output canvas for projector integration
   */
  public getMosaicCanvas(): HTMLCanvasElement | null {
    return this.mosaicProcessor?.getCanvas() ?? null;
  }

  /**
   * Get mosaic output as MediaStream
   */
  public getMosaicStream(): MediaStream | null {
    return this.mosaicProcessor?.getStream() ?? null;
  }

  private setupAutoBgControls(): void {
    const strobeCheckbox = document.getElementById('autoStrobeCheckbox') as HTMLInputElement;
    const colorAPicker = document.getElementById('autoColorAPicker') as HTMLInputElement;
    const colorBPicker = document.getElementById('autoColorBPicker') as HTMLInputElement;
    const colorCPicker = document.getElementById('autoColorCPicker') as HTMLInputElement;

    if (strobeCheckbox) {
      strobeCheckbox.addEventListener('change', () => {
        this.app.setAutoColorStrobe(strobeCheckbox.checked);
      });
    }

    const updateAutoColors = () => {
      if (colorAPicker && colorBPicker && colorCPicker) {
        this.app.setAutoColors(colorAPicker.value, colorBPicker.value, colorCPicker.value);
      }
    };

    if (colorAPicker) colorAPicker.addEventListener('input', updateAutoColors);
    if (colorBPicker) colorBPicker.addEventListener('input', updateAutoColors);
    if (colorCPicker) colorCPicker.addEventListener('input', updateAutoColors);

    // Presets
    const presetButtons = document.querySelectorAll('.color-preset-btn');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const colors = btn.getAttribute('data-colors')?.split(',');
        if (colors && colors.length >= 2) {
          if (colorAPicker) colorAPicker.value = colors[0];
          if (colorBPicker) colorBPicker.value = colors[1];
          if (colorCPicker) colorCPicker.value = colors[2] || colors[1];
          updateAutoColors();
        }
      });
    });
  }

  private setupBlinkingControls(): void {
    const blinkingCheckbox = document.getElementById('blinkingModeCheckbox') as HTMLInputElement;
    const blinkingSpeedSlider = document.getElementById('blinkingSpeedSlider') as HTMLInputElement;
    const blinkingSpeedValue = document.getElementById('blinkingSpeedValue');

    if (blinkingCheckbox) {
      blinkingCheckbox.addEventListener('change', () => {
        const isChecked = blinkingCheckbox.checked;
        this.app.setBlinkingMode(isChecked);
        const topBlinkBtn = document.getElementById('topBlinkBtn');
        if (topBlinkBtn) topBlinkBtn.classList.toggle('active', isChecked);
      });
    }

    if (blinkingSpeedSlider && blinkingSpeedValue) {
      blinkingSpeedSlider.addEventListener('input', () => {
        const speed = parseInt(blinkingSpeedSlider.value);
        blinkingSpeedValue.textContent = speed.toString();
        this.app.setBlinkingSpeed(speed);

        // Sync with quick menu slider
        const quickSpeed = document.getElementById('quickBlinkSpeed') as HTMLInputElement;
        if (quickSpeed) quickSpeed.value = speed.toString();
      });
    }
  }

  private setupQuickBlinkMenu(): void {
    const sideA = document.getElementById('autoColorAPicker') as HTMLInputElement;
    const sideB = document.getElementById('autoColorBPicker') as HTMLInputElement;
    const sideC = document.getElementById('autoColorCPicker') as HTMLInputElement;
    const blinkingSpeedSlider = document.getElementById('blinkingSpeedSlider') as HTMLInputElement;
    const blinkingSpeedValue = document.getElementById('blinkingSpeedValue');
    const quickSpeed = document.getElementById('quickBlinkSpeed') as HTMLInputElement;

    // Quick Speed Slider
    if (quickSpeed) {
      quickSpeed.addEventListener('input', () => {
        const speed = parseInt(quickSpeed.value);
        this.app.setBlinkingSpeed(speed);
        if (blinkingSpeedSlider) blinkingSpeedSlider.value = speed.toString();
        if (blinkingSpeedValue) blinkingSpeedValue.textContent = speed.toString();
      });
    }

    // Color Circle Presets
    const circleBtns = document.querySelectorAll('.color-circle-btn');
    circleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const colors = btn.getAttribute('data-colors')?.split(',');
        if (colors && colors.length >= 2) {
          this.app.setAutoColors(colors[0], colors[1], colors[1]);
          if (sideA) sideA.value = colors[0];
          if (sideB) sideB.value = colors[1];
          if (sideC) sideC.value = colors[1];

          circleBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });
  }

  private setupCanvasTextControl(): void {
    const textInput = document.getElementById('canvasText') as HTMLInputElement;
    if (textInput) {
      textInput.addEventListener('input', (e) => {
        const text = (e.target as HTMLInputElement).value;
        this.app.setCanvasText(text);
      });

      const state = this.app.getState();
      if (state.djName) {
        textInput.value = state.djName;
      }
    }

    const effectButtons = document.querySelectorAll('.dj-name-effects .mode-tag-btn');
    effectButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const effect = btn.getAttribute('data-effect') as any;
        this.app.setDJNameEffect(effect);

        effectButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    const sendBtn = document.getElementById('sendTextBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        if (textInput) this.app.setCanvasText(textInput.value);
      });
    }

    const onBtn = document.getElementById('djNameOnBtn');
    const offBtn = document.getElementById('djNameOffBtn');

    if (onBtn && offBtn) {
      onBtn.addEventListener('click', () => {
        this.app.toggleShowDJName(true);
        onBtn.classList.add('active');
        offBtn.classList.remove('active');
      });

      offBtn.addEventListener('click', () => {
        this.app.toggleShowDJName(false);
        offBtn.classList.add('active');
        onBtn.classList.remove('active');
      });

      // Initial state sync
      const state = this.app.getState();
      if (state.showDJName) {
        onBtn.classList.add('active');
        offBtn.classList.remove('active');
      } else {
        offBtn.classList.add('active');
        onBtn.classList.remove('active');
      }

      // Sync effect buttons
      const effectButtons = document.querySelectorAll('.dj-name-effects .mode-tag-btn');
      effectButtons.forEach(btn => {
        if (btn.getAttribute('data-effect') === state.djNameEffect) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }
}


