/**
 * RESONANCE CONTROLLER - Central AI Orchestrator
 * 
 * This module acts as the "Master Mind" that synchronizes all sub-machines
 * (Image, Sound, Talk, Information) into a single unified intelligence.
 * it monitors global resonance and adjusts parameters across all modules
 * to maintain peak synchronicity.
 */

import { CONFIG } from '../config/config.js';

export class ResonanceController {
    constructor() {
        this.isActive = false;
        this.globalResonance = 0;
        this.machines = {
            image: null,
            sound: null,
            talk: null,
            info: null
        };
        this.init();
    }

    init() {
        console.log('%c[RESONANCE] INITIALIZING CENTRAL COMMAND...', 'color: #ff00ff; font-weight: bold;');

        // Wait for all machines to be registered on window
        const checkInterval = setInterval(() => {
            if (window.imageMachine) this.machines.image = window.imageMachine;
            if (window.soundMachine || true) this.machines.sound = true; // Placeholder for now
            if (window.talkMachine) this.machines.talk = window.talkMachine;

            if (this.machines.image) {
                console.log('%c[RESONANCE] CENTRAL COMMAND ESTABLISHED.', 'color: #00ffff; font-weight: bold;');
                this.isActive = true;
                clearInterval(checkInterval);
                this.startOrchestration();
            }
        }, 500);
    }

    startOrchestration() {
        console.log('[RESONANCE] Beginning global parameter optimization...');
        this.orchestrate();
    }

    orchestrate() {
        if (!this.isActive) return;

        // Calculate Global Jitter based on "biological rhythm"
        const now = Date.now();
        const pulse = Math.sin(now / 2000) * 0.5 + 0.5;
        this.globalResonance = pulse;

        // 1. Image Machine Influence
        if (window.imageMachine && window.imageMachine.setGlitchLevel) {
            // Subtle glitching based on global pulse
            window.imageMachine.setGlitchLevel(pulse * 0.2);
        }

        // 2. Sound Machine Influence (if we had access to its Three.js params directly)
        // We already have Auto Mode, but we can deepen it here.

        // 3. Information Machine Update
        if (typeof window.getSystemScore === 'function') {
            window.getSystemScore(); // Trigger score update
        }

        // 4. Mirroring to other tabs via Sync
        if (window.broadcastEvent) {
            window.broadcastEvent('resonance-pulse', { resonance: pulse });
        }

        requestAnimationFrame(() => this.orchestrate());
    }

    /**
     * CORE VIEW: Force all machines into a specific state
     */
    commandAll(mode) {
        console.log(`%c[RESONANCE] BROADCASTING COMMAND: ${mode}`, 'background: #ff00ff; color: #fff; padding: 2px 5px;');

        if (mode === 'void') {
            if (window.imageMachine && window.imageMachine.triggerSecret) {
                window.imageMachine.triggerSecret('void');
            }
        } else if (mode === 'high') {
            if (window.imageMachine && window.imageMachine.triggerSecret) {
                window.imageMachine.triggerSecret('high');
            }
        }
    }
}

export function initResonanceControl() {
    window.resonance = new ResonanceController();
    return window.resonance;
}
