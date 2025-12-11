// Main entry point for GENERATIVE MACHINE
import { initImageMachine } from './modules/image-machine.js';
import { initSoundMachine } from './modules/sound-machine.js';
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