/**
 * VJ SYNC MODULE - High Performance State Sync
 * Replaces inefficient canvas.captureStream with lightweight data broadcasting.
 */
import { broadcastEvent, initSync } from './sync.js';

export function initVJSync() {
    // 判定ロジックを強化
    const isProjector = window.location.href.includes('projector=true');
    console.log(`[VJ-SYNC] Initializing for ${isProjector ? 'PROJECTOR' : 'CONTROLLER'}`);

    if (isProjector) {
        setupProjectorUI();
    }

    // Wait for the engine to be ready
    const checkEngine = setInterval(() => {
        const mm = window.mandalaMachine;
        if (!mm) return;
        clearInterval(checkEngine);

        if (isProjector) {
            setupProjectorLogic(mm);
        } else {
            setupController(mm);
        }
    }, 100);

    function setupController(mm) {
        console.log('[VJ-SYNC] Controller monitoring active.');

        // Monkey-patch methods to broadcast state changes
        const methodsToSync = [
            'setObjectCount', 'setSizeMultiplier', 'setSpeedMultiplier',
            'setSpreadMultiplier', 'setSpacingMultiplier', 'setBackgroundColor',
            'setDefaultObjectColor', 'setWireframeMode', 'setGlobalEffect',
            'setBlinkingMode', 'setBlinkingSpeed', 'toggleBaryonMode',
            'setMandalaMode', 'setSpaceMode', 'toggleAutoMode',
            'setBrainHackModeIndex', 'setBrainHackColors', 'toggleBrainHackMode',
            'toggleQuantumMode', 'setQuantumCoherence', 'setMasterIntensity'
        ];

        methodsToSync.forEach(methodName => {
            if (typeof mm[methodName] === 'function') {
                const original = mm[methodName].bind(mm);
                mm[methodName] = (...args) => {
                    original(...args);
                    broadcastEvent('vj-state-update', { method: methodName, args });
                };
            }
        });

        // Loop to find buttons and update UI
        const binderInterval = setInterval(() => {
            const vOutBtn = document.getElementById('vOutBtn');
            if (vOutBtn && !vOutBtn.dataset.vjInitted) {
                vOutBtn.dataset.vjInitted = "true";

                // Reset style
                vOutBtn.style.padding = "5px 15px";
                vOutBtn.style.background = "#222";
                vOutBtn.style.color = "#888";
                vOutBtn.style.border = "1px solid #444";
                vOutBtn.style.borderRadius = "4px";
                vOutBtn.style.fontSize = "10px";
                vOutBtn.style.fontWeight = "bold";
                vOutBtn.style.transition = "all 0.3s ease";
                vOutBtn.style.cursor = "pointer";
                vOutBtn.innerText = 'VJ PROJECTOR: OFF';

                vOutBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    vOutBtn.innerText = 'VJ PROJECTOR: ACTIVE';
                    vOutBtn.style.background = "#00ffcc";
                    vOutBtn.style.color = "#000";
                    vOutBtn.style.boxShadow = "0 0 15px #00ffcc";
                    vOutBtn.style.borderColor = "#fff";

                    console.log('[VJ-SYNC] Requesting Projector Window.');
                    if (window.require) {
                        const { ipcRenderer } = window.require('electron');
                        ipcRenderer.send('open-projector');
                    }
                }, { capture: true });
            }
        }, 500);

        // Sync text updates
        const textBtn = document.getElementById('sendTextBtn');
        if (textBtn) {
            textBtn.addEventListener('click', () => {
                const text = document.getElementById('canvasText')?.value;
                if (text) broadcastEvent('vj-text-update', { text });
            });
        }
    }

    function setupProjectorUI() {
        // More aggressive UI hiding for projector window
        const style = document.createElement('style');
        style.textContent = `
            #leftPanel, #rightPanel, #topBar, #musicPanel, .menu-section, .ui-panel, #leftPanelToggle, .context-menu, #voidDialogueContainer {
                display: none !important;
                visibility: hidden !important;
                width: 0 !important;
                height: 0 !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }
            #app-root {
                padding: 0 !important;
                display: block !important;
                grid-template-columns: 1fr !important;
            }
            #mainPanel {
                width: 100vw !important;
                height: 100vh !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                background: #000 !important;
                margin: 0 !important;
                padding: 0 !important;
                z-index: 9999 !important;
            }
            #canvasWrapper, .canvas-container, #p5-container {
                width: 100vw !important;
                height: 100vh !important;
            }
            body {
                cursor: none !important;
                background: #000 !important;
                overflow: hidden !important;
            }
        `;
        document.head.appendChild(style);
        console.log('[VJ-SYNC] Projector CSS applied.');
    }

    function setupProjectorLogic(mm) {
        console.log('[VJ-SYNC] Projector receiver active.');

        initSync({
            'vj-state-update': (detail) => {
                const { method, args } = detail;
                if (typeof mm[method] === 'function') {
                    mm[method](...args);
                }
            },
            'vj-text-update': (detail) => {
                const input = document.getElementById('canvasText');
                if (input) input.value = detail.text;
                const btn = document.getElementById('sendTextBtn');
                if (btn) btn.click();
            }
        });
    }
}
