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
    // Increase hit area visually/functionally
    if (imageTitle) {
        imageTitle.style.display = 'inline-block';
        imageTitle.style.padding = '10px 20px';
    }

    let imageTitleTapCount = 0;
    let imageTitleTapTimer = null;

    if (imageTitle) {
        const handleTap = (e) => {
            imageTitleTapCount++;

            if (imageTitleTapTimer) clearTimeout(imageTitleTapTimer);

            // Determine current state
            const isVoid = document.documentElement.style.filter === 'invert(1)';

            // Determine environment
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            // If in VOID mode -> 2 Taps to EXIT (Keep for all devices as safety)
            if (isVoid) {
                if (imageTitleTapCount === 2) {
                    if (e.cancelable) e.preventDefault();
                    console.log("IMAGE TITLE RITUAL: EXIT (2-TAP)");
                    if (window.imageMachine && window.imageMachine.triggerSecret) {
                        window.imageMachine.triggerSecret('exit');
                    }
                    imageTitleTapCount = 0;
                }
            }
            // If in NORMAL mode -> 3 Taps to ENTER (Mobile Only)
            else {
                if (imageTitleTapCount === 3) {
                    if (!isTouchDevice) {
                        console.log("IMAGE TITLE RITUAL: BLOCKED ON DESKTOP (Use keyboard)");
                        imageTitleTapCount = 0;
                        return;
                    }
                    if (e.cancelable) e.preventDefault();
                    console.log("IMAGE TITLE RITUAL: VOID (3-TAP)");
                    if (window.imageMachine && window.imageMachine.triggerSecret) {
                        window.imageMachine.triggerSecret('void');
                    }
                    imageTitleTapCount = 0;
                }
            }

            // Reset timer logic
            // We use the same timeout but rely on the state check above to fire early for exit
            if (imageTitleTapTimer) clearTimeout(imageTitleTapTimer);
            imageTitleTapTimer = setTimeout(() => {
                imageTitleTapCount = 0;
            }, 1000); // Relaxed to 1000ms for easier tapping
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
        }
    });

    console.log('GENERATIVE MACHINE System Initialized');
});