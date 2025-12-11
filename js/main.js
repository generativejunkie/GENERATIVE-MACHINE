// Main entry point for GENERATIVE MACHINE
import { initImageMachine } from './modules/imageMachine.js';
import { initSoundMachine } from './modules/soundMachine.js';
import { initUI } from './modules/ui.js';
import { initHero } from './modules/hero.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize standard modules
    initHero();
    initImageMachine();
    initSoundMachine();
    initUI();

    console.log('GENERATIVE MACHINE System Initialized');
});