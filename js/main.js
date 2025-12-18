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

    // IMAGE MACHINE TITLE RITUAL: 3-TAP -> VOID (Strict Mobile Support)
    const imageTitle = document.getElementById('image-machine-title');
    let imageTitleTapCount = 0;
    let imageTitleTapTimer = null;

    if (imageTitle) {
        const handleTap = (e) => {
            imageTitleTapCount++;

            if (imageTitleTapTimer) clearTimeout(imageTitleTapTimer);

            if (imageTitleTapCount === 3) {
                // Trigger Void / AI Mode
                e.preventDefault();
                console.log("IMAGE TITLE RITUAL: VOID (3-TAP)");
                if (window.imageMachine && window.imageMachine.triggerSecret) {
                    window.imageMachine.triggerSecret('void');
                }
                imageTitleTapCount = 0;
            } else {
                imageTitleTapTimer = setTimeout(() => {
                    imageTitleTapCount = 0;
                }, 800);
            }
        };

        // Desktop Click
        imageTitle.addEventListener('click', (e) => {
            // Ignore synthetic clicks from touch
            if (e.detail === 0) return;
            handleTap(e);
        });

        // Mobile Touch (Instant)
        let lastTouchTime = 0;
        imageTitle.addEventListener('touchstart', (e) => {
            const now = Date.now();
            if (now - lastTouchTime < 100) return; // Debounce
            lastTouchTime = now;

            if (e.cancelable) e.preventDefault(); // Block synthetic click
            handleTap(e);
        }, { passive: false });
    }

    console.log('GENERATIVE MACHINE System Initialized');
});