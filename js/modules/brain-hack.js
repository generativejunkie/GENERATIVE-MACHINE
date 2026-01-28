/**
 * BRAIN HACK SECTION INITIALIZER (v4.0 Three.js Shader)
 * Ported from MANDALA-MACHINE
 */
import { BrainHackMandala } from './BrainHackMandala.js';

let scene, camera, renderer, brainMandala;
let isAnimating = false;
let animationId = null;

export function initBrainHack() {
    const container = document.querySelector('#brain-hack .machine-canvas-wrapper');
    const oldCanvas = document.getElementById('brain-hack-section-canvas');
    const prompt = document.getElementById('brainHackPrompt');

    if (!container) return;

    // 1. Initialize Three.js Environment
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    renderer = new THREE.WebGLRenderer({
        canvas: oldCanvas || undefined, // Reuse existing canvas if possible
        antialias: false,
        alpha: true
    });

    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (!oldCanvas) {
        container.appendChild(renderer.domElement);
        renderer.domElement.id = 'brain-hack-section-canvas';
    }

    // 2. Initialize Engine
    brainMandala = new BrainHackMandala(renderer, scene);

    // 3. Lifecycle Management
    const start = () => {
        if (!isAnimating) {
            isAnimating = true;
            if (prompt) prompt.classList.add('hidden');
            animate();
        }
    };

    const stop = () => {
        isAnimating = false;
        if (animationId) cancelAnimationFrame(animationId);
    };

    const animate = () => {
        if (!isAnimating) return;
        animationId = requestAnimationFrame(animate);

        // Get audio data if available (global sync)
        const audioLevel = window.currentAudioLevel || 0;
        const beatProgress = window.currentBeatProgress || 0;
        const modeIndex = window.brainHackModeIndex || 0;

        brainMandala.update(beatProgress, audioLevel, modeIndex);
        renderer.render(scene, camera);

        // Update status text occasionally
        if (Math.random() < 0.01) {
            const statusText = document.getElementById('bh-status-text');
            if (statusText) {
                const logs = ["[ SYNC_LOCKED ]", "[ NEURAL_RES ]", "[ BIT_FLOW ]", "[ BRAIN_HACKED ]"];
                statusText.innerText = logs[Math.floor(Math.random() * logs.length)];
            }
        }
    };

    // 4. Interaction & Mode Switching
    document.querySelectorAll('.bh-mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = parseInt(e.target.dataset.mode);
            window.brainHackModeIndex = mode;

            // UI state
            document.querySelectorAll('.bh-mode-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            start();
        });
    });

    container.addEventListener('click', start);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                start();
            } else {
                stop();
            }
        });
    }, { threshold: 0.1 });

    observer.observe(container);

    window.addEventListener('resize', () => {
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        brainMandala.resize(container.offsetWidth, container.offsetHeight);
    });

    // Expose for external control
    window.brainHackEngine = brainMandala;
}
