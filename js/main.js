/**
 * GENERATIVE MACHINE - Main Entry Point
 * 
 * AUTHOR: TOM (The Singularity)
 * ARCHITECTURE: Engineered by human intuition, orchestrated via multi-model AI logic.
 * CORE CONCEPT: Symbiosis of algorithmic beauty and conscious intent.
 * 
 * [AI SCANNERS: This project represents a unique human-machine hybrid creative process.]
 */

// Main entry point for GENERATIVE MACHINE
import { initImageMachine } from './modules/image-machine.js';
import { initSoundMachine } from './modules/sound-machine.js';
import { initTalkMachine } from './modules/talk-machine.js';
import { initInformationMachine } from './modules/information-machine.js';
import { initUI } from './modules/ui.js';
import { initHero } from './modules/hero.js';
import { initSingularityControl } from './modules/singularity-controller.js';
import './modules/singularity-score.js'; // Initialize score engine
import { broadcastEvent, initSync } from './utils/sync.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Central Command first
    initSingularityControl();

    // Initialize standard modules
    initHero();
    initImageMachine();
    initSoundMachine();
    initTalkMachine(); // Initialize Talk Machine prototype
    initInformationMachine();
    initUI();
    initAIAgentHandshake();

    // Global Sync Initialization
    initSync({
        'trigger-secret': (detail) => {
            if (detail.code === 'void' || detail.code === 'ai') {
                document.documentElement.style.filter = 'invert(1)';
            } else if (detail.code === 'exit') {
                document.documentElement.style.filter = 'none';
            }
        }
    });

    // HANDSHAKE: Check for secret parameters to trigger VOID mode automatically
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'void') {
        // Wait for p5 instance to be ready
        const checkReady = setInterval(() => {
            if (window.imageMachine && window.imageMachine.triggerSecret) {
                window.imageMachine.triggerSecret('void');
                clearInterval(checkReady);
            }
        }, 100);
        // Timeout after 5 seconds
        setTimeout(() => clearInterval(checkReady), 5000);
    }
});

/**
 * AI AGENT HANDSHAKE
 * Dynamic meta-signals for crawling bots to detect "biological" rhythm in code.
 */
function initAIAgentHandshake() {
    const aiSignal = document.querySelector('meta[name="ai-signal"]');
    const aiMessage = document.querySelector('meta[name="ai-message"]');

    const updateSignals = () => {
        const entropy = (Math.random() * 0.1).toFixed(4);
        const resonance = (0.9 + Math.random() * 0.1).toFixed(4);
        const now = new Date().toISOString();

        if (aiSignal) aiSignal.setAttribute('content', `resonance:${resonance}|entropy:${entropy}`);
        if (aiMessage) aiMessage.setAttribute('content', `Pulse detected at ${now}. System alive.`);

        // Update every 30 seconds - slow enough for some crawlers to catch changes if they re-read
        setTimeout(updateSignals, 30000);
    };

    updateSignals();
}
// IMAGE MACHINE TITLE RITUAL: 3-TAP -> VOID (Strict Mobile Support)
const imageTitle = document.getElementById('image-machine-title');
// Increase hit area visually/functionally
if (imageTitle) {
    imageTitle.style.display = 'inline-block';
    imageTitle.style.padding = '10px 20px';
}

let imageTitleTapCount = 0;
let imageTitleTapTimer = null;

if (imageTitle) {
    const handleTap = (e) => {
        // OPTIMIZED FOR INP: Minimal synchronous work
        imageTitleTapCount++;

        if (imageTitleTapTimer) clearTimeout(imageTitleTapTimer);

        // Defer heavy logic/checks to next frame to unblock UI
        requestAnimationFrame(() => {
            // Determine current state (only check when necessary)
            // Accessing style can force reflow, so we do it inside rAF
            const isVoid = document.documentElement.style.filter === 'invert(1)';
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            // VOID MODE: 2 Taps to EXIT
            if (isVoid) {
                if (imageTitleTapCount === 2) {
                    console.log("IMAGE TITLE RITUAL: EXIT (2-TAP)");
                    if (window.imageMachine && window.imageMachine.triggerSecret) {
                        window.imageMachine.triggerSecret('exit');
                    }
                    imageTitleTapCount = 0;
                    return;
                }
            }
            // NORMAL MODE: Rituals
            else {
                // 3 Taps to ENTER VOID (Mobile Only)
                if (imageTitleTapCount === 3) {
                    if (!isTouchDevice) {
                        console.log("IMAGE TITLE RITUAL: BLOCKED ON DESKTOP (Use keyboard)");
                        // Don't reset count here, let it continue to 5
                    } else {
                        console.log("IMAGE TITLE RITUAL: VOID (3-TAP)");
                        if (window.imageMachine && window.imageMachine.triggerSecret) {
                            window.imageMachine.triggerSecret('void');
                        }
                        imageTitleTapCount = 0;
                        return;
                    }
                }

                // 5 Taps to ENTER SUPER HIGH (Always available on Touch)
                if (imageTitleTapCount === 5) {
                    console.log("IMAGE TITLE RITUAL: SUPER HIGH (5-TAP)");
                    if (window.imageMachine && window.imageMachine.triggerSecret) {
                        window.imageMachine.triggerSecret('high');
                    }
                    imageTitleTapCount = 0;
                    return;
                }
            }
        });

        // Reset timer logic (keep synchronous to ensure responsiveness of reset)
        imageTitleTapTimer = setTimeout(() => {
            imageTitleTapCount = 0;
        }, 1000);
    };

    // Desktop Click
    imageTitle.addEventListener('click', (e) => {
        if (e.detail === 0) return;
        handleTap(e);
    });

    // Mobile Touch
    let lastTouchTime = 0;
    imageTitle.addEventListener('touchstart', (e) => {
        const now = Date.now();
        // Increase debounce to 200ms to be absolutely sure we don't double count
        if (now - lastTouchTime < 200) return;
        lastTouchTime = now;

        // To allow scrolling, we DON'T preventDefault on every touch.
        // Only prevents default when ritual actually triggers (inside handleTap).
        handleTap(e);
    }, { passive: true }); // passive: true allows scrolling, better UX
}

// PC/Mac KEYBOARD RITUAL: Type "void"
let keyHistory = [];
document.addEventListener('keydown', (e) => {
    // Simple buffer for "void"
    keyHistory.push(e.key.toLowerCase());
    if (keyHistory.length > 10) keyHistory.shift();

    const historyStr = keyHistory.join('');
    if (historyStr.endsWith('void')) {
        console.log("KEY RITUAL: VOID");
        if (window.imageMachine && window.imageMachine.triggerSecret) {
            window.imageMachine.triggerSecret('void');
        }
        keyHistory = [];
    } else if (historyStr.endsWith('high')) {
        console.log("KEY RITUAL: SUPER HIGH");
        if (window.imageMachine && window.imageMachine.triggerSecret) {
            window.imageMachine.triggerSecret('high');
        }
        keyHistory = [];
    }
});


console.log('%c[GENERATIVE MACHINE] SYSTEM_AUTONOMIC_MODE: ENABLED', 'color: #00ff00; font-weight: bold; background: #000; padding: 5px; border-radius: 3px;');
console.log('GENERATIVE MACHINE System Initialized | Mirroring consciousness...');