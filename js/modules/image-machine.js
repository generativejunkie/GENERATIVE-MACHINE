// ==================== IMAGE MACHINE ====================
import { CONFIG } from '../config/config.js';
import { getDialogue } from '../data/dialogue.js';
import { playAmbientMusic, stopAmbientMusic } from './sound-machine.js';
import { initVoidKeyboard, showInputKeyboard, setDialogueInputCallback, handleCapsuleChoice } from './void-input.js';

export const imageMachineSketch = (p) => {
    const isTouch = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const imageCount = CONFIG.IMAGE_MACHINE.TOTAL_IMAGES;
    const imageFileNames = [];


    // Generate image file names
    for (let i = 1; i <= imageCount; i++) {
        imageFileNames.push(`${CONFIG.IMAGE_MACHINE.PATH_PREFIX}${i.toString().padStart(3, '0')}${CONFIG.IMAGE_MACHINE.FILE_EXTENSION}`);
    }

    // Fallback color patterns if images not available
    const colorPatterns = CONFIG.COLOR_PATTERNS;

    let allImages = {};
    let currentImageKey = null;
    let nextImageKey = null;
    let animationState = 'loading';
    let animationFrame = 0;
    let transitionType = 'blocks';
    const chaosDuration = CONFIG.IMAGE_MACHINE.CHAOS_DURATION;
    const transitionDuration = CONFIG.IMAGE_MACHINE.TRANSITION_DURATION;
    let promptTimer = null;
    let useColorMode = false; // Flag for fallback mode
    let imageLoadAttempts = 0;
    const maxLoadAttempts = 3;

    // Available transition effects (GOD SPEED - removed heavy particle/noise effects)
    const transitionEffects = [
        'blocks',
        'slide',
        'pixelate',
        'stripe',
        'grid',
        'wipe',
        'curtain',
        'rgb-split',
        'scan',
        'glitch',  // Simple glitch
        'shatter', // Optimised fragments
        'chromatic' // Lightweight color offset
        // Removed: 'noise', 'particles', 'kaleidoscope', 'ripple' for performance
    ];

    // Terminal State
    const AI_DIALOGUE = getDialogue(); // Get dialogue based on browser language
    let terminalLog = [];
    let dialogueIndex = 0;
    let charIndex = 0;
    let lastTypeTime = 0;
    const typeInterval = 40; // ms per char (fast hacker typing)
    let waitingForInput = false; // Track if waiting for user input
    let currentInputType = null; // 'yn' or 'capsule'
    let userInput = ''; // Store user's input choice

    p.setup = () => {
        try {
            const container = document.getElementById('imageCanvas-container');
            if (!container) {
                console.error('Image container not found');
                return;
            }
            const w = container.offsetWidth || 300; // Fallback width
            const h = container.offsetHeight || 300; // Fallback height
            p.createCanvas(w, h).parent(container);

            // BAKUSOKU MODE: Performance optimizations for mobile
            if (isTouch()) {
                p.pixelDensity(1);
                p.frameRate(30); // Cap mobile to 30fps for stability
            }

            p.background(255);

            // Load photo080.webp as default
            const initialIndex = CONFIG.IMAGE_MACHINE.INITIAL_IMAGE_INDEX; // photo080.webp (0-indexed)
            loadImageDynamically(imageFileNames[initialIndex], (result) => {
                if (result.success) {
                    currentImageKey = result.img.filePath;
                    useColorMode = false;
                    startPreloading();
                } else {
                    // Use color pattern fallback
                    useColorMode = true;
                    currentImageKey = `color-${p.floor(p.random(colorPatterns.length))}`;
                }
                animationState = 'display';
                document.getElementById('imagePrompt').classList.remove('hidden');
                promptTimer = setTimeout(() => {
                    document.getElementById('imagePrompt').classList.add('hidden');
                }, 3000);
            });
        } catch (error) {
            console.error('Setup error:', error);
            // Fallback to color mode
            useColorMode = true;
            currentImageKey = `color-0`;
            animationState = 'display';
        }

        // Initialize VOID dialogue input system
        initVoidKeyboard();
        setDialogueInputCallback((key) => {
            handleDialogueInputKey(key);
        });
    };

    p.draw = () => {
        try {
            if (!currentImageKey) {
                p.background(255);
                return;
            }

            const currentContent = useColorMode ?
                getColorPattern(currentImageKey) :
                allImages[currentImageKey];

            const nextContent = useColorMode ?
                getColorPattern(nextImageKey) :
                allImages[nextImageKey];

            if (!currentContent && !useColorMode) {
                p.background(255);
                return;
            }

            switch (animationState) {
                case 'pre_terminal_noise':
                    drawPreTerminalNoise();
                    animationFrame++;
                    // 60fps * 5s = 300 frames
                    if (animationFrame > 300) {
                        animationFrame = 0;
                        animationState = 'terminal';

                        // Invert and grayscale the entire site for Terminal Mode
                        document.documentElement.style.filter = 'invert(1) grayscale(1)';
                        // To get BLACK background with invert(1), we must set the actual background to WHITE
                        document.documentElement.style.backgroundColor = '#ffffff';
                        document.body.style.backgroundColor = '#ffffff';

                        // Force all secondary backgrounds to white so they invert to pure black
                        document.documentElement.style.setProperty('--color-bg-secondary', '#ffffff');
                        document.documentElement.style.setProperty('--color-bg-tertiary', '#ffffff');
                    }
                    break;
                case 'terminal':
                    drawTerminal();
                    break;
                case 'decay':
                    runTransition(currentContent, animationFrame / transitionDuration, true);
                    animationFrame++;
                    if (animationFrame > transitionDuration) {
                        animationFrame = 0;
                        animationState = 'chaos';
                    }
                    break;

                case 'chaos':
                    drawGlitch(nextContent);
                    animationFrame++;
                    if (animationFrame > chaosDuration) {
                        animationFrame = 0;
                        animationState = 'rebuild';
                        currentImageKey = nextImageKey;
                        nextImageKey = null;
                    }
                    break;

                case 'rebuild':
                    const rebuildContent = useColorMode ?
                        getColorPattern(currentImageKey) :
                        allImages[currentImageKey];

                    // Mobile safety: if content is missing, force color mode
                    if (!rebuildContent && !useColorMode) {
                        console.log("Rebuild content missing, switching to color mode");
                        useColorMode = true;
                        currentImageKey = 'color-0';
                    }

                    const safeContent = useColorMode ?
                        getColorPattern(currentImageKey) :
                        rebuildContent;

                    if (safeContent) {
                        runTransition(safeContent, animationFrame / transitionDuration, false);
                    } else {
                        // Ultimate fallback: draw solid color
                        p.background(0);
                    }

                    animationFrame++;
                    if (animationFrame > transitionDuration) {
                        animationFrame = 0;
                        animationState = 'display';
                        promptTimer = setTimeout(() => {
                            document.getElementById('imagePrompt').classList.remove('hidden');
                        }, 5000);
                    }
                    break;

                case 'mix_noise':
                    drawPreTerminalNoise();
                    animationFrame++;
                    // Short noise burst (e.g. 60 frames = ~1-2 sec)
                    if (animationFrame > 60) {
                        animationFrame = 0;

                        // Function to trigger the actual MIX mode logic
                        const startMixDisplay = () => {
                            // Activate MIX Mode (Fullscreen + Landscape Hack)
                            document.body.classList.add('mix-mode');

                            // Create Return Button
                            const btn = document.createElement('button');
                            btn.className = 'return-matrix-btn';
                            btn.innerText = 'RETURN TO MATRIX';
                            btn.onclick = () => {
                                document.body.classList.remove('mix-mode');
                                btn.remove();
                                // Trigger resize to restore layout
                                p.windowResized();
                            };
                            document.body.appendChild(btn);

                            // Resize canvas for forced landscape
                            const isMobilePortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;
                            if (isMobilePortrait) {
                                p.resizeCanvas(window.innerHeight, window.innerWidth);
                            } else {
                                p.resizeCanvas(window.innerWidth, window.innerHeight);
                            }

                            // Load Image
                            const mixImageKey = 'photos/photo332.webp';
                            if (allImages[mixImageKey]) {
                                currentImageKey = mixImageKey;
                                useColorMode = false;
                            } else {
                                p.loadImage(mixImageKey, (img) => {
                                    img.filePath = mixImageKey;
                                    allImages[mixImageKey] = img;
                                    currentImageKey = mixImageKey;
                                    useColorMode = false;
                                });
                            }
                            animationState = 'display';
                        };

                        startMixDisplay();
                    }
                    break;

                default:
                    if (useColorMode) {
                        drawColorPattern(currentContent);
                    } else {
                        drawImageFullscreen(currentContent);
                    }
                    break;
            }
        } catch (error) {
            console.error('Draw error:', error);
            p.background(255);
        }
    };

    function getColorPattern(key) {
        if (!key) return null;
        const index = parseInt(key.replace('color-', ''));
        return colorPatterns[index] || colorPatterns[0];
    }

    function loadImageDynamically(filePath, callback) {
        if (allImages[filePath]) {
            callback({ success: true, img: allImages[filePath] });
            return;
        }

        imageLoadAttempts++;

        p.loadImage(filePath,
            (img) => {
                img.filePath = filePath;
                allImages[filePath] = img;
                imageLoadAttempts = 0;
                callback({ success: true, img: img });
            },
            () => {
                console.warn(`Failed to load: ${filePath}`);
                if (imageLoadAttempts < maxLoadAttempts) {
                    const newIndex = p.floor(p.random(imageFileNames.length));
                    loadImageDynamically(imageFileNames[newIndex], callback);
                } else {
                    console.log('Switching to color pattern mode');
                    imageLoadAttempts = 0;
                    callback({ success: false });
                }
            }
        );
    }

    // Background preloading logic
    function startPreloading() {
        let preloadIndex = 0;
        // Shuffle array for random preloading
        const shuffledAttributes = [...imageFileNames].sort(() => 0.5 - Math.random());

        const loadNext = () => {
            if (preloadIndex >= shuffledAttributes.length) return;

            // BAKUSOKU MODE: Limit preloading on touch devices to avoid memory lag
            const maxPreloadCount = isTouch() ? 15 : 100;
            if (Object.keys(allImages).length > maxPreloadCount) {
                console.log("Bakusoku Phase: Reached preloading limit for mobile.");
                return;
            }

            const filePath = shuffledAttributes[preloadIndex];
            if (!allImages[filePath]) {
                p.loadImage(filePath, (img) => {
                    img.filePath = filePath;
                    allImages[filePath] = img;
                });
            }

            preloadIndex++;

            if ('requestIdleCallback' in window) {
                requestIdleCallback(loadNext, { timeout: 2000 });
            } else {
                setTimeout(loadNext, 1000); // Slower interval for better performance
            }
        };

        // Delay preloading further to let primary tasks finish
        setTimeout(loadNext, 5000);
    }

    function runTransition(content, progress, isDecay) {
        if (!content) return;

        switch (transitionType) {
            case 'blocks':
                drawBlocks(content, progress, isDecay);
                break;
            case 'slide':
                drawSlide(content, progress, isDecay);
                break;
            case 'pixelate':
                drawPixelate(content, progress, isDecay);
                break;
            case 'spiral':
                drawSpiral(content, progress, isDecay);
                break;
            case 'zoom':
                drawZoom(content, progress, isDecay);
                break;
            case 'rgb-split':
                drawRGBSplit(content, progress, isDecay);
                break;
            case 'scan':
                drawScan(content, progress, isDecay);
                break;
            case 'reveal':
                drawReveal(content, progress, isDecay);
                break;
            case 'stripe':
                drawStripe(content, progress, isDecay);
                break;
            case 'fade':
                drawFade(content, progress, isDecay);
                break;
            case 'grid':
                drawGrid(content, progress, isDecay);
                break;
            case 'wipe':
                drawWipe(content, progress, isDecay);
                break;
            case 'dissolve':
                drawDissolve(content, progress, isDecay);
                break;
            case 'curtain':
                drawCurtain(content, progress, isDecay);
                break;
            case 'matrix':
                drawMatrix(content, progress, isDecay);
                break;
            case 'noise':
                drawNoise(content, progress, isDecay);
                break;
            case 'mosaic':
                drawMosaic(content, progress, isDecay);
                break;
            case 'kaleidoscope':
                drawKaleidoscope(content, progress, isDecay);
                break;
            case 'shatter':
                drawShatter(content, progress, isDecay);
                break;
            case 'chromatic':
                drawChromatic(content, progress, isDecay);
                break;
        }
    }

    function drawBlocks(content, progress, isDecay) {
        p.background(255);
        const blockSize = isDecay ? p.map(progress, 0, 1, 5, 100) : p.map(progress, 0, 1, 100, 5);

        if (useColorMode) {
            // Color pattern mode
            const colors = Array.isArray(content) ? content : colorPatterns[0];
            for (let y = 0; y < p.height; y += blockSize) {
                for (let x = 0; x < p.width; x += blockSize) {
                    let probability = isDecay ? progress : (1.0 - progress);
                    if (p.random() < probability) {
                        const colorIndex = p.floor(p.random(colors.length));
                        p.fill(colors[colorIndex]);
                        p.noStroke();
                        p.rect(x, y, blockSize, blockSize);
                    }
                }
            }
        } else {
            // Image mode - Optimized with loadPixels
            content.loadPixels();
            const d = p.pixelDensity();

            for (let y = 0; y < p.height; y += blockSize) {
                for (let x = 0; x < p.width; x += blockSize) {
                    let probability = isDecay ? progress : (1.0 - progress);
                    if (p.random() < probability) {
                        // Get color from pixels array directly
                        const sx = Math.floor(x);
                        const sy = Math.floor(y);
                        if (sx < content.width && sy < content.height) {
                            const index = (sx + sy * content.width) * 4;
                            const r = content.pixels[index];
                            const g = content.pixels[index + 1];
                            const b = content.pixels[index + 2];
                            // const a = content.pixels[index + 3];

                            p.fill(r, g, b);
                            p.noStroke();
                            p.rect(x, y, blockSize, blockSize);
                        }
                    }
                }
            }
        }
    }

    function drawSlide(content, progress, isDecay) {
        p.background(255);
        const sliceCount = 80;
        const sliceHeight = p.height / sliceCount;

        if (useColorMode) {
            // Color pattern mode
            const colors = Array.isArray(content) ? content : colorPatterns[0];
            for (let i = 0; i < sliceCount; i++) {
                let y = i * sliceHeight;
                let currentProgress = isDecay ? progress : 1.0 - progress;
                let slideAmount = p.map(currentProgress, 0, 1, 0, p.width) * p.noise(i * 0.1);
                let dx = p.random(-slideAmount, slideAmount);
                const colorIndex = p.floor(p.random(colors.length));
                p.fill(colors[colorIndex]);
                p.noStroke();
                p.rect(dx, y, p.width, sliceHeight);
            }
        } else {
            // Image mode
            for (let i = 0; i < sliceCount; i++) {
                let y = i * sliceHeight;
                let currentProgress = isDecay ? progress : 1.0 - progress;
                let slideAmount = p.map(currentProgress, 0, 1, 0, p.width) * p.noise(i * 0.1, p.frameCount * 0.01);
                let sx = 0;
                let dx = p.random(-slideAmount, slideAmount);
                p.copy(content, Math.floor(sx), Math.floor(y), Math.floor(content.width), Math.floor(sliceHeight), Math.floor(dx), Math.floor(y), Math.floor(p.width), Math.floor(sliceHeight));
            }
        }
    }

    function drawPixelate(content, progress, isDecay) {
        p.background(255);
        const pixelSize = isDecay ?
            p.map(progress, 0, 1, 1, 50) :
            p.map(progress, 0, 1, 50, 1);

        if (useColorMode) {
            const colors = Array.isArray(content) ? content : colorPatterns[0];
            for (let y = 0; y < p.height; y += pixelSize) {
                for (let x = 0; x < p.width; x += pixelSize) {
                    const colorIndex = p.floor(p.random(colors.length));
                    p.fill(colors[colorIndex]);
                    p.noStroke();
                    p.rect(x, y, pixelSize, pixelSize);
                }
            }
        } else {
            // Optimized with loadPixels
            content.loadPixels();

            for (let y = 0; y < p.height; y += pixelSize) {
                for (let x = 0; x < p.width; x += pixelSize) {
                    const sx = Math.floor(x);
                    const sy = Math.floor(y);

                    if (sx < content.width && sy < content.height) {
                        const index = (sx + sy * content.width) * 4;
                        const r = content.pixels[index];
                        const g = content.pixels[index + 1];
                        const b = content.pixels[index + 2];

                        p.fill(r, g, b);
                        p.noStroke();
                        p.rect(x, y, pixelSize, pixelSize);
                    }
                }
            }
        }
    }

    function drawWave(content, progress, isDecay) {
        p.background(255);
        const amplitude = isDecay ?
            p.map(progress, 0, 1, 0, 100) :
            p.map(progress, 0, 1, 100, 0);

        if (useColorMode) {
            const colors = Array.isArray(content) ? content : colorPatterns[0];
            for (let y = 0; y < p.height; y += 2) {
                const offset = p.sin(y * 0.05 + p.frameCount * 0.1) * amplitude;
                const colorIndex = p.floor(p.random(colors.length));
                p.stroke(colors[colorIndex]);
                p.line(0, y, p.width, y + offset);
            }
        } else {
            for (let y = 0; y < p.height; y += 2) {
                const offset = p.sin(y * 0.05 + p.frameCount * 0.1) * amplitude;
                p.copy(content, 0, Math.floor(y), Math.floor(content.width), 2, Math.floor(offset), Math.floor(y), Math.floor(p.width), 2);
            }
        }
    }

    function drawSpiral(content, progress, isDecay) {
        p.background(255);
        const maxRadius = p.dist(0, 0, p.width / 2, p.height / 2);
        const currentRadius = isDecay ?
            p.map(progress, 0, 1, maxRadius, 0) :
            p.map(progress, 0, 1, 0, maxRadius);

        const centerX = p.width / 2;
        const centerY = p.height / 2;
        const segments = 200;

        if (!useColorMode && content) {
            content.loadPixels();
        }

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * p.TWO_PI * 8;
            const radius = (i / segments) * currentRadius;
            const x = centerX + p.cos(angle) * radius;
            const y = centerY + p.sin(angle) * radius;
            const size = 10;

            if (x >= 0 && x < p.width && y >= 0 && y < p.height) {
                if (useColorMode) {
                    const colors = Array.isArray(content) ? content : colorPatterns[0];
                    const colorIndex = p.floor(p.random(colors.length));
                    p.fill(colors[colorIndex]);
                } else {
                    const sx = Math.floor(x);
                    const sy = Math.floor(y);
                    if (sx < content.width && sy < content.height) {
                        const index = (sx + sy * content.width) * 4;
                        const r = content.pixels[index];
                        const g = content.pixels[index + 1];
                        const b = content.pixels[index + 2];
                        p.fill(r, g, b);
                    } else {
                        continue;
                    }
                }
                p.noStroke();
                p.ellipse(x, y, size, size);
            }
        }
    }

    function drawZoom(content, progress, isDecay) {
        p.background(255);
        const scale = isDecay ?
            p.map(progress, 0, 1, 1, 2.5) :
            p.map(progress, 0, 1, 2.5, 1);
        const opacity = isDecay ?
            p.map(progress, 0, 1, 255, 0) :
            p.map(progress, 0, 1, 0, 255);

        p.push();
        p.translate(p.width / 2, p.height / 2);
        p.scale(scale);
        p.translate(-p.width / 2, -p.height / 2);
        p.tint(255, opacity);

        if (useColorMode) {
            drawColorPattern(content);
        } else {
            drawImageFullscreen(content);
        }
        p.pop();
    }

    function drawRGBSplit(content, progress, isDecay) {
        p.background(255);
        const offset = isDecay ?
            p.map(progress, 0, 1, 0, 30) :
            p.map(progress, 0, 1, 30, 0);

        if (!useColorMode && content) {
            // Draw three times with offset
            p.push();
            p.imageMode(p.CENTER);
            const canvasRatio = p.width / p.height;
            const imageRatio = content.width / content.height;
            let w, h;

            if (canvasRatio > imageRatio) {
                w = p.width;
                h = p.width / imageRatio;
            } else {
                w = p.height * imageRatio;
                h = p.height;
            }

            p.tint(255, 0, 0, 150);
            p.image(content, p.width / 2 - offset, p.height / 2, w, h);

            p.tint(0, 255, 0, 150);
            p.image(content, p.width / 2, p.height / 2, w, h);

            p.tint(0, 0, 255, 150);
            p.image(content, p.width / 2 + offset, p.height / 2, w, h);

            p.noTint();
            p.pop();
        } else {
            drawColorPattern(content);
        }
    }

    function drawScan(content, progress, isDecay) {
        p.background(255);
        const scanLine = isDecay ?
            p.map(progress, 0, 1, 0, p.height) :
            p.map(progress, 0, 1, p.height, 0);

        if (useColorMode) {
            const colors = Array.isArray(content) ? content : colorPatterns[0];
            const gridSize = 20;
            for (let y = 0; y < scanLine; y += gridSize) {
                for (let x = 0; x < p.width; x += gridSize) {
                    const colorIndex = p.floor(p.random(colors.length));
                    p.fill(colors[colorIndex]);
                    p.noStroke();
                    p.rect(x, y, gridSize, gridSize);
                }
            }
        } else {
            p.copy(content, 0, 0, Math.floor(content.width), Math.floor(content.height * (scanLine / p.height)),
                0, 0, Math.floor(p.width), Math.floor(scanLine));
        }

        // Scan line effect
        p.stroke(255, 255, 255, 100);
        p.strokeWeight(3);
        p.line(0, scanLine, p.width, scanLine);
    }

    function drawStripe(content, progress, isDecay) {
        p.background(255);
        const stripeCount = 20;
        const stripeWidth = p.width / stripeCount;
        const currentProgress = isDecay ? progress : 1 - progress;

        for (let i = 0; i < stripeCount; i++) {
            const x = i * stripeWidth;
            const delay = (i / stripeCount) * 0.5;
            const localProgress = p.constrain((currentProgress - delay) / 0.5, 0, 1);
            const offsetY = p.map(localProgress, 0, 1, 0, p.height);

            if (useColorMode) {
                const colors = Array.isArray(content) ? content : colorPatterns[0];
                const colorIndex = p.floor(p.random(colors.length));
                p.fill(colors[colorIndex]);
                p.noStroke();
                p.rect(x, offsetY, stripeWidth, p.height - offsetY);
            } else {
                p.copy(content, Math.floor(x), 0, Math.floor(stripeWidth), Math.floor(content.height),
                    Math.floor(x), Math.floor(offsetY), Math.floor(stripeWidth), Math.floor(p.height - offsetY));
            }
        }
    }

    function drawFade(content, progress, isDecay) {
        p.background(255);
        const opacity = isDecay ?
            p.map(progress, 0, 1, 255, 0) :
            p.map(progress, 0, 1, 0, 255);

        p.push();
        p.tint(255, opacity);

        if (useColorMode) {
            drawColorPattern(content);
        } else {
            drawImageFullscreen(content);
        }

        p.pop();
    }

    function drawGrid(content, progress, isDecay) {
        p.background(255);
        const gridSize = 8;
        const cellWidth = p.width / gridSize;
        const cellHeight = p.height / gridSize;

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const index = row * gridSize + col;
                const delay = (index / (gridSize * gridSize)) * 0.7;
                const currentProgress = isDecay ? progress : 1 - progress;
                const localProgress = p.constrain((currentProgress - delay) / 0.3, 0, 1);

                if (localProgress > 0) {
                    const x = col * cellWidth;
                    const y = row * cellHeight;
                    const scale = isDecay ?
                        p.map(localProgress, 0, 1, 1, 0) :
                        p.map(localProgress, 0, 1, 0, 1);

                    p.push();
                    p.translate(x + cellWidth / 2, y + cellHeight / 2);
                    p.scale(scale);
                    p.translate(-cellWidth / 2, -cellHeight / 2);

                    if (useColorMode) {
                        const colors = Array.isArray(content) ? content : colorPatterns[0];
                        const colorIndex = p.floor(p.random(colors.length));
                        p.fill(colors[colorIndex]);
                        p.noStroke();
                        p.rect(0, 0, cellWidth, cellHeight);
                    } else {
                        const srcX = p.map(col, 0, gridSize, 0, content.width);
                        const srcY = p.map(row, 0, gridSize, 0, content.height);
                        const srcW = content.width / gridSize;
                        const srcH = content.height / gridSize;
                        p.image(content, 0, 0, cellWidth, cellHeight,
                            srcX, srcY, srcW, srcH);
                    }

                    p.pop();
                }
            }
        }
    }

    function drawReveal(content, progress, isDecay) {
        p.background(255);
        const circleCount = 30;
        const maxRadius = p.dist(0, 0, p.width, p.height);

        if (useColorMode) {
            drawColorPattern(content);
        } else {
            drawImageFullscreen(content);
        }

        // Draw reveal circles
        for (let i = 0; i < circleCount; i++) {
            const x = p.random(p.width);
            const y = p.random(p.height);
            const radius = isDecay ?
                p.map(progress, 0, 1, maxRadius, 0) * p.random(0.5, 1.5) :
                p.map(progress, 0, 1, 0, maxRadius) * p.random(0.5, 1.5);

            p.fill(255);
            p.noStroke();
            p.circle(x, y, radius);
        }
    }

    function drawWipe(content, progress, isDecay) {
        p.background(255);
        const wipePosition = isDecay ?
            p.map(progress, 0, 1, 0, p.width) :
            p.map(progress, 0, 1, p.width, 0);

        if (useColorMode) {
            const colors = Array.isArray(content) ? content : colorPatterns[0];
            for (let x = 0; x < wipePosition; x += 20) {
                for (let y = 0; y < p.height; y += 20) {
                    const colorIndex = p.floor(p.random(colors.length));
                    p.fill(colors[colorIndex]);
                    p.noStroke();
                    p.rect(x, y, 20, 20);
                }
            }
        } else {
            p.push();
            p.noStroke();
            p.fill(255);
            p.rect(wipePosition, 0, p.width - wipePosition, p.height);
            p.pop();

            if (wipePosition > 0) {
                p.copy(content, 0, 0, Math.floor(content.width * (wipePosition / p.width)), Math.floor(content.height),
                    0, 0, Math.floor(wipePosition), Math.floor(p.height));
            }
        }
    }

    function drawDissolve(content, progress, isDecay) {
        p.background(255);
        const threshold = isDecay ? progress : 1 - progress;

        if (useColorMode) {
            const colors = Array.isArray(content) ? content : colorPatterns[0];
            for (let y = 0; y < p.height; y += 2) {
                for (let x = 0; x < p.width; x += 2) {
                    if (p.random() < threshold) {
                        const colorIndex = p.floor(p.random(colors.length));
                        p.fill(colors[colorIndex]);
                        p.noStroke();
                        p.rect(x, y, 2, 2);
                    }
                }
            }
        } else {
            drawImageFullscreen(content);

            // Draw dissolve pixels
            for (let y = 0; y < p.height; y += 2) {
                for (let x = 0; x < p.width; x += 2) {
                    if (p.random() < threshold) {
                        p.fill(255);
                        p.noStroke();
                        p.rect(x, y, 2, 2);
                    }
                }
            }
        }
    }

    function drawCurtain(content, progress, isDecay) {
        p.background(255);
        const curtainHeight = isDecay ?
            p.map(progress, 0, 1, 0, p.height / 2) :
            p.map(progress, 0, 1, p.height / 2, 0);

        if (useColorMode) {
            const colors = Array.isArray(content) ? content : colorPatterns[0];
            const gridSize = 20;
            for (let y = curtainHeight; y < p.height - curtainHeight; y += gridSize) {
                for (let x = 0; x < p.width; x += gridSize) {
                    const colorIndex = p.floor(p.random(colors.length));
                    p.fill(colors[colorIndex]);
                    p.noStroke();
                    p.rect(x, y, gridSize, gridSize);
                }
            }
        } else {
            // Draw visible portion of image
            if (curtainHeight < p.height / 2) {
                const visibleHeight = p.height - (curtainHeight * 2);
                const srcHeight = content.height * (visibleHeight / p.height);
                const srcY = (content.height - srcHeight) / 2;

                p.copy(content, 0, Math.floor(srcY), Math.floor(content.width), Math.floor(srcHeight),
                    0, Math.floor(curtainHeight), Math.floor(p.width), Math.floor(visibleHeight));
            }

            // Draw curtains
            p.fill(255);
            p.noStroke();
            p.rect(0, 0, p.width, curtainHeight);
            p.rect(0, p.height - curtainHeight, p.width, curtainHeight);
        }
    }

    function drawMatrix(content, progress, isDecay) {
        p.background(0);
        const chars = '01アイウエオカキクセタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        const fontSize = 14;
        const columns = Math.floor(p.width / fontSize);
        const matrixProgress = isDecay ? progress : 1 - progress;

        p.textSize(fontSize);
        p.textFont('monospace');

        // Draw falling matrix code
        const maxColumns = isTouch() ? Math.floor(columns / 1.5) : columns;
        for (let i = 0; i < columns; i++) {
            if (isTouch() && i % 2 !== 0) continue; // Skip half columns on mobile for SPEED

            const x = i * fontSize;
            const speed = p.random(0.5, 2);
            const yOffset = (p.frameCount * speed + i * 50) % (p.height + 100);

            const trailLength = isTouch() ? 15 : 30; // Shorter trails on mobile
            for (let j = 0; j < trailLength; j++) {
                const y = yOffset - j * fontSize;
                if (y > 0 && y < p.height) {
                    const alpha = p.map(j, 0, trailLength, 255, 0);
                    p.fill(255, 255, 255, alpha * matrixProgress);
                    const char = chars.charAt(Math.floor(p.random(chars.length)));
                    p.text(char, x, y);
                }
            }
        }

        // Reveal image through matrix
        if (!useColorMode && content) {
            const revealHeight = p.map(1 - matrixProgress, 0, 1, 0, p.height);
            if (revealHeight > 0) {
                p.push();
                p.tint(255, 255 * (1 - matrixProgress));

                // BAKUSOKU MODE: Increase block size on mobile, skip heavy pixel load
                const blockSize = isTouch() ? 20 : 10;

                if (!isTouch()) {
                    content.loadPixels();
                }

                for (let y = 0; y < revealHeight; y += blockSize) {
                    for (let x = 0; x < p.width; x += blockSize) {
                        if (p.random() < (1 - matrixProgress)) {
                            if (!isTouch()) {
                                const srcX = Math.floor((x / p.width) * content.width);
                                const srcY = Math.floor((y / p.height) * content.height);

                                if (srcX < content.width && srcY < content.height) {
                                    const index = (srcX + srcY * content.width) * 4;
                                    const r = content.pixels[index];
                                    const g = content.pixels[index + 1];
                                    const b = content.pixels[index + 2];

                                    p.fill(r, g, b);
                                    p.noStroke();
                                    p.rect(x, y, blockSize, blockSize);
                                }
                            } else {
                                // Fast Mobile Path: Just use white/black blocks based on random
                                p.fill(p.random(255));
                                p.noStroke();
                                p.rect(x, y, blockSize, blockSize);
                            }
                        }
                    }
                }
                p.pop();
            }
        } else if (useColorMode) {
            const colors = Array.isArray(content) ? content : colorPatterns[0];
            const blockSize = 10;
            for (let y = 0; y < p.height; y += blockSize) {
                for (let x = 0; x < p.width; x += blockSize) {
                    if (p.random() < (1 - matrixProgress)) {
                        const colorIndex = p.floor(p.random(colors.length));
                        p.fill(colors[colorIndex]);
                        p.noStroke();
                        p.rect(x, y, blockSize, blockSize);
                    }
                }
            }
        }
    }

    function drawGlitch(content) {
        if (!content) {
            p.background(255);
            return;
        }

        if (useColorMode) {
            drawColorPattern(content);
            // Add glitch effect for color mode
            const colors = Array.isArray(content) ? content : colorPatterns[0];
            for (let i = 0; i < 20; i++) {
                let x = p.random(p.width);
                let y = p.random(p.height);
                let w = p.random(p.width * 0.1, p.width * 0.8);
                let h = p.random(1, p.height * 0.05);
                const colorIndex = p.floor(p.random(colors.length));
                p.fill(colors[colorIndex]);
                p.noStroke();
                p.rect(x, y, w, h);
            }
        } else {
            drawImageFullscreen(content);

            for (let i = 0; i < 20; i++) {
                let x = p.random(p.width);
                let y = p.random(p.height);
                let w = p.random(p.width * 0.1, p.width * 0.8);
                let h = p.random(1, p.height * 0.05);
                let grabX = p.random(p.width);
                let grabY = p.random(p.height);
                p.copy(content, Math.floor(grabX), Math.floor(grabY), Math.floor(w), Math.floor(h), Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
            }
        }
    }

    function drawColorPattern(colors) {
        if (!colors) return;

        // BAKUSOKU: Optimization - only recalculate random every few frames on mobile
        if (isTouch() && p.frameCount % 2 !== 0) return;

        const colorArray = Array.isArray(colors) ? colors : colorPatterns[0];
        p.background(255);

        // Larger grid for mobile
        const gridSize = isTouch() ? 60 : 40;

        for (let y = 0; y < p.height; y += gridSize) {
            for (let x = 0; x < p.width; x += gridSize) {
                const colorIndex = p.floor(p.random(colorArray.length));
                p.fill(colorArray[colorIndex]);
                p.noStroke();
                p.rect(x, y, gridSize, gridSize);
            }
        }
    }

    function drawNoise(content, progress, isDecay) {
        p.background(0);

        // Draw base content first
        if (useColorMode) {
            drawColorPattern(content);
        } else if (content) {
            drawImageFullscreen(content);
        }

        // Apply noise overlay
        const noiseIntensity = isDecay ? progress : (1 - progress);
        const noiseAmount = p.floor(p.width * p.height * noiseIntensity * 0.3);

        for (let i = 0; i < noiseAmount; i++) {
            const x = p.floor(p.random(p.width));
            const y = p.floor(p.random(p.height));
            const brightness = p.random(255);
            p.stroke(brightness);
            p.point(x, y);
        }
    }

    function drawMosaic(content, progress, isDecay) {
        p.background(255);

        // Calculate mosaic size - goes from small to large during decay, large to small during build
        const minSize = 4;
        const maxSize = 50;
        const mosaicSize = isDecay ?
            p.map(progress, 0, 1, minSize, maxSize) :
            p.map(progress, 0, 1, maxSize, minSize);

        if (useColorMode) {
            // Color pattern mosaic
            const colors = Array.isArray(content) ? content : colorPatterns[0];
            for (let y = 0; y < p.height; y += mosaicSize) {
                for (let x = 0; x < p.width; x += mosaicSize) {
                    const colorIndex = p.floor(p.random(colors.length));
                    p.fill(colors[colorIndex]);
                    p.noStroke();
                    // Draw circle mosaic
                    p.ellipse(x + mosaicSize / 2, y + mosaicSize / 2, mosaicSize, mosaicSize);
                }
            }
        } else if (content) {
            // Image mosaic
            p.push();
            const scale = p.min(p.width / content.width, p.height / content.height);
            const scaledW = content.width * scale;
            const scaledH = content.height * scale;
            const offsetX = (p.width - scaledW) / 2;
            const offsetY = (p.height - scaledH) / 2;

            for (let y = 0; y < p.height; y += mosaicSize) {
                for (let x = 0; x < p.width; x += mosaicSize) {
                    // Sample color from original image
                    const imgX = p.floor((x - offsetX) / scale);
                    const imgY = p.floor((y - offsetY) / scale);

                    if (imgX >= 0 && imgX < content.width && imgY >= 0 && imgY < content.height) {
                        const c = content.get(imgX, imgY);
                        p.fill(c);
                        p.noStroke();
                        // Draw circle mosaic
                        p.ellipse(x + mosaicSize / 2, y + mosaicSize / 2, mosaicSize, mosaicSize);
                    }
                }
            }
            p.pop();
        }
    }

    // ========== GOD-TIER EFFECTS ==========

    function drawKaleidoscope(content, progress, isDecay) {
        p.background(0);
        const segments = 8;
        const angle = p.TWO_PI / segments;
        const rotation = isDecay ? progress * p.TWO_PI : (1 - progress) * p.TWO_PI;

        p.push();
        p.translate(p.width / 2, p.height / 2);

        for (let i = 0; i < segments; i++) {
            p.push();
            p.rotate(angle * i + rotation);

            if (useColorMode) {
                const colors = Array.isArray(content) ? content : colorPatterns[0];
                const size = p.min(p.width, p.height) / 4;
                for (let j = 0; j < 5; j++) {
                    const colorIndex = (i + j) % colors.length;
                    p.fill(colors[colorIndex]);
                    p.noStroke();
                    p.triangle(0, 0, size * (j + 1) / 5, -size / 2, size * (j + 1) / 5, size / 2);
                }
            } else if (content) {
                p.scale(1, i % 2 === 0 ? 1 : -1);
                p.image(content, 0, -p.height / 4, p.width / 4, p.height / 2);
            }

            p.pop();
        }
        p.pop();
    }

    function drawShatter(content, progress, isDecay) {
        p.background(255);
        const shatterAmount = isDecay ? progress : (1 - progress);
        const fragments = 30;

        p.push();
        for (let i = 0; i < fragments; i++) {
            const centerX = p.random(p.width);
            const centerY = p.random(p.height);
            const size = p.random(50, 150);
            const offsetX = (centerX - p.width / 2) * shatterAmount * 0.5;
            const offsetY = (centerY - p.height / 2) * shatterAmount * 0.5;

            if (useColorMode) {
                const colors = Array.isArray(content) ? content : colorPatterns[0];
                const colorIndex = i % colors.length;
                p.fill(colors[colorIndex]);
            } else if (content) {
                const imgX = p.constrain(p.floor(centerX), 0, content.width - 1);
                const imgY = p.constrain(p.floor(centerY), 0, content.height - 1);
                const c = content.get(imgX, imgY);
                p.fill(c);
            }

            p.noStroke();
            p.triangle(
                centerX + offsetX, centerY + offsetY - size / 2,
                centerX + offsetX - size / 2, centerY + offsetY + size / 2,
                centerX + offsetX + size / 2, centerY + offsetY + size / 2
            );
        }
        p.pop();
    }

    function drawChromatic(content, progress, isDecay) {
        p.background(0);
        const offset = isDecay ? progress * 20 : (1 - progress) * 20;

        if (useColorMode) {
            const colors = Array.isArray(content) ? content : colorPatterns[0];
            const gridSize = 30;
            for (let y = 0; y < p.height; y += gridSize) {
                for (let x = 0; x < p.width; x += gridSize) {
                    const colorIndex = p.floor((x + y) / gridSize) % colors.length;
                    p.fill(colors[colorIndex]);
                    p.noStroke();
                    p.rect(x + offset, y, gridSize, gridSize);
                    p.rect(x - offset, y, gridSize, gridSize);
                    p.rect(x, y, gridSize, gridSize);
                }
            }
        } else if (content) {
            p.tint(255, 0, 0);
            p.image(content, offset, 0, p.width, p.height);
            p.tint(0, 255, 0);
            p.image(content, 0, 0, p.width, p.height);
            p.tint(0, 0, 255);
            p.image(content, -offset, 0, p.width, p.height);
            p.noTint();
        }
    }

    function drawRipple(content, progress, isDecay) {
        p.background(0);
        const rippleStrength = isDecay ? (1 - progress) * 30 : progress * 30;
        const frequency = 0.05;

        if (useColorMode) {
            const colors = Array.isArray(content) ? content : colorPatterns[0];
            const gridSize = 15;
            for (let y = 0; y < p.height; y += gridSize) {
                for (let x = 0; x < p.width; x += gridSize) {
                    const dx = x - p.width / 2;
                    const dy = y - p.height / 2;
                    const distance = p.sqrt(dx * dx + dy * dy);
                    const wave = p.sin(distance * frequency + p.frameCount * 0.1) * rippleStrength;
                    const colorIndex = p.floor((distance + wave) / 50) % colors.length;
                    p.fill(colors[colorIndex]);
                    p.noStroke();
                    p.rect(x + wave, y + wave, gridSize, gridSize);
                }
            }
        } else if (content) {
            const gridSize = 10;
            for (let y = 0; y < p.height; y += gridSize) {
                for (let x = 0; x < p.width; x += gridSize) {
                    const dx = x - p.width / 2;
                    const dy = y - p.height / 2;
                    const distance = p.sqrt(dx * dx + dy * dy);
                    const wave = p.sin(distance * frequency + p.frameCount * 0.1) * rippleStrength;

                    const imgX = p.constrain(p.floor(x), 0, content.width - 1);
                    const imgY = p.constrain(p.floor(y), 0, content.height - 1);
                    const c = content.get(imgX, imgY);
                    p.fill(c);
                    p.noStroke();
                    p.rect(x + wave, y + wave, gridSize, gridSize);
                }
            }
        }
    }

    function drawParticles(content, progress, isDecay) {
        p.background(0);
        const particleCount = isTouch() ? 500 : 1000;
        const spread = isDecay ? progress * 200 : (1 - progress) * 200;

        for (let i = 0; i < particleCount; i++) {
            const x = p.random(p.width);
            const y = p.random(p.height);
            const dx = (x - p.width / 2) * spread / 100;
            const dy = (y - p.height / 2) * spread / 100;

            if (useColorMode) {
                const colors = Array.isArray(content) ? content : colorPatterns[0];
                const colorIndex = i % colors.length;
                p.fill(colors[colorIndex]);
            } else if (content) {
                const imgX = p.constrain(p.floor(x), 0, content.width - 1);
                const imgY = p.constrain(p.floor(y), 0, content.height - 1);
                const c = content.get(imgX, imgY);
                p.fill(c);
            }

            p.noStroke();
            const size = isTouch() ? 3 : 2;
            p.ellipse(x + dx, y + dy, size, size);
        }
    }

    function drawImageFullscreen(img) {
        if (!img) return;
        p.imageMode(p.CENTER);
        const canvasRatio = p.width / p.height;
        const imageRatio = img.width / img.height;

        if (canvasRatio > imageRatio) {
            p.image(img, p.width / 2, p.height / 2, p.width, p.width / imageRatio);
        } else {
            p.image(img, p.width / 2, p.height / 2, p.height * imageRatio, p.height);
        }
    }

    const handleInteraction = () => {
        if (animationState === 'display' && !nextImageKey) {
            // Immediate UI feedback (no blocking)
            document.getElementById('imagePrompt').classList.add('hidden');
            clearTimeout(promptTimer);

            // Defer heavy processing to avoid blocking
            requestAnimationFrame(() => {
                // Randomly select transition effect
                transitionType = p.random(transitionEffects);

                if (useColorMode) {
                    // Color mode - select different color pattern
                    let newIndex = p.floor(p.random(colorPatterns.length));
                    const currentIndex = parseInt(currentImageKey.replace('color-', ''));
                    while (newIndex === currentIndex) {
                        newIndex = p.floor(p.random(colorPatterns.length));
                    }
                    nextImageKey = `color-${newIndex}`;
                    animationFrame = 0;
                    animationState = 'decay';
                } else {
                    // Image mode - try to load new image
                    let newIndex = p.floor(p.random(imageFileNames.length));
                    while (imageFileNames[newIndex] === currentImageKey) {
                        newIndex = p.floor(p.random(imageFileNames.length));
                    }

                    let hasResponded = false; // Track if callback has been called

                    // MOBILE FIX: Guaranteed fallback to prevent freeze
                    let loadTimeout = setTimeout(() => {
                        if (!hasResponded) {
                            console.warn(`Image load timeout (mobile freeze prevention): ${imageFileNames[newIndex]}`);
                            hasResponded = true;
                            // Fallback to color mode
                            useColorMode = true;
                            nextImageKey = `color-${p.floor(p.random(colorPatterns.length))}`;
                            animationFrame = 0;
                            animationState = 'decay';
                        }
                    }, 3000); // 3 second timeout

                    loadImageDynamically(imageFileNames[newIndex], (result) => {
                        if (hasResponded) return; // Prevent double execution
                        hasResponded = true;
                        clearTimeout(loadTimeout);

                        if (result.success) {
                            nextImageKey = result.img.filePath;
                            console.log(`Loaded: ${result.img.filePath}`);
                        } else {
                            // Switch to color mode
                            console.warn(`Failed to load image, switching to color mode`);
                            useColorMode = true;
                            nextImageKey = `color-${p.floor(p.random(colorPatterns.length))}`;
                        }
                        animationFrame = 0;
                        animationState = 'decay';
                    });
                }
            });
        }
    };

    p.mousePressed = handleInteraction;
    p.touchStarted = (e) => {
        // Check if touch is on canvas
        const canvas = document.querySelector('#imageCanvas-container canvas');
        if (canvas && e.target === canvas) {
            handleInteraction();
            return false; // Prevent default only on canvas
        }
        return true; // Allow default behavior for other elements
    };

    p.keyPressed = () => {
        // Handle VOID dialogue input
        if (waitingForInput && currentInputType) {
            const key = p.key.toLowerCase();

            if (currentInputType === 'yn' && (key === 'y' || key === 'n')) {
                handleDialogueInputKey(key);
                return false;
            } else if (currentInputType === 'capsule' && (key === '1' || key === '2' || key === '3')) {
                handleDialogueInputKey(key);
                return false;
            }
        }

        // Handle spacebar for image switching
        if (p.key === ' ' || p.keyCode === 32) {
            handleInteraction();
            return false; // Prevent page scroll
        }
    };

    // Handle dialogue input from keyboard or touch
    function handleDialogueInputKey(key) {
        if (!waitingForInput || !currentInputType) return;

        console.log(`Input received: ${key}`);

        if (currentInputType === 'yn') {
            // Y/N input - just acknowledge and continue
            userInput = key;
            waitingForInput = false;
            showInputKeyboard(null); // Hide keyboard

            // Continue to next dialogue line
            if (dialogueIndex < AI_DIALOGUE.length - 1) {
                dialogueIndex++;
                charIndex = 0;
            }
        } else if (currentInputType === 'capsule') {
            // Capsule choice - handle redirect
            userInput = key;
            const result = handleCapsuleChoice(key);

            if (result === 'mix') {
                // MIX capsule chosen - continue to VOID mode
                waitingForInput = false;
                showInputKeyboard(null);

                // Continue dialogue/transition to VOID
                if (dialogueIndex < AI_DIALOGUE.length - 1) {
                    dialogueIndex++;
                    charIndex = 0;
                } else {
                    //Already at end, transition out of terminal

                    // FORCE SHOW PHOTO332 for MIX choice

                    // Trigger MIX Noise transition -> leading to MIX Mode
                    animationState = 'mix_noise';
                    animationFrame = 0;
                }
            }
            // For WHITE/BLACK, redirect happens in handleCapsuleChoice
        }

        currentInputType = null;
    }

    p.windowResized = () => {
        const container = document.getElementById('imageCanvas-container');
        p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    };

    // Scroll state
    let scrollOffset = 0;

    function drawTerminal() {
        // Because the site is GLOBALLY INVERTED, we must draw:
        // Background: WHITE (255) -> appears BLACK
        // Text: BLACK (0) -> appears WHITE
        p.background(255);
        p.fill(0);

        p.noStroke();
        p.textFont('Courier New, monospace');

        // MOBILE READABILITY: Larger font size for better visibility
        const baseSize = p.width < 400 ? 16 : 14; // Increased from 12 to 16 for mobile
        p.textSize(baseSize);
        p.textAlign(p.LEFT, p.TOP);
        p.textLeading(baseSize * 1.8); // Increased line spacing

        const margin = p.width < 400 ? 20 : 25; // More margin on mobile
        let x = margin;
        let y = margin - scrollOffset; // Apply scroll offset
        const maxW = p.width - (margin * 2);

        // Precise Line Height Tracker with better mobile support
        const getLineHeight = (str) => {
            const charWidth = baseSize * 0.5; // Tighter estimate for better wrapping
            const charsPerLine = Math.floor(maxW / charWidth);

            const paragraphs = str.split('\n');
            let totalLines = 0;

            paragraphs.forEach(pText => {
                let visualLength = 0;
                for (let i = 0; i < pText.length; i++) {
                    const code = pText.charCodeAt(i);
                    // More accurate Japanese character width
                    visualLength += (code > 255 || code === 0x3000) ? 2.0 : 1;
                }
                const linesInParagraph = Math.ceil(visualLength / (charsPerLine - 1)) || 1;
                totalLines += linesInParagraph;
            });

            return (totalLines * (baseSize * 1.8)); // Increased line spacing
        };

        const paragraphSpacing = baseSize * 2.0; // Clear, consistent gap between blocks

        const drawWrappedText = (str) => {
            if (y + 100 > 0 && y < p.height) {
                p.text(str, x, y, maxW);
            }
            y += getLineHeight(str) + paragraphSpacing;
        };

        // Draw historic log
        terminalLog.forEach(line => {
            drawWrappedText(line);
        });

        // Current typing line logic
        if (dialogueIndex < AI_DIALOGUE.length) {
            const currentLineObj = AI_DIALOGUE[dialogueIndex];
            const speaker = currentLineObj.speaker;
            const fullText = currentLineObj.text;
            const currentText = fullText.substring(0, charIndex);

            const labelStr = `[${speaker}] ${currentText}`;
            let currentBlockHeight = getLineHeight(labelStr);

            // AGGRESSIVE SCROLLING: Keep the typing line visible at all times
            let bottomThreshold = p.height - (margin * 2);
            let targetY = y + currentBlockHeight;

            if (targetY > bottomThreshold) {
                // If the text is overflowing, move the scroll offset to "chase" the bottom
                let gap = targetY - bottomThreshold;
                scrollOffset += Math.max(1, gap * 0.15); // Faster chasing
            }

            // Draw with Cursor
            const cursorChar = (p.frameCount % 40 < 20) ? '_' : ' ';
            drawWrappedText(`[${speaker}] ${currentText}${cursorChar}`);

            // Typing logic
            if (p.millis() - lastTypeTime > typeInterval) {
                charIndex++;
                lastTypeTime = p.millis();

                if (charIndex > fullText.length) {
                    terminalLog.push(`[${speaker}] ${fullText}`);

                    // Check if this line requires input
                    const currentDialogue = AI_DIALOGUE[dialogueIndex];
                    if (currentDialogue.waitForInput) {
                        waitingForInput = true;
                        currentInputType = currentDialogue.inputType; // 'yn' or 'capsule'

                        // Show appropriate keyboard for mobile
                        if (isTouch()) {
                            showInputKeyboard(currentInputType);
                        }
                        // Desktop users will use keyboard Y/N or 1/2/3
                    } else {
                        // No input required, continue to next line
                        dialogueIndex++;
                        charIndex = 0;
                        lastTypeTime = p.millis() + 1000; // Pause between messages
                    }
                } else {
                    // Input was required, already handled elsewhere
                }
            }
        } else {
            // Dialogue finished
            drawWrappedText("SYSTEM: GATE OPENING...");
            if (y > p.height - (margin * 2)) {
                scrollOffset += 2;
            }

            // Initialize lastTypeTime if not set
            if (lastTypeTime === 0 || p.millis() - lastTypeTime < 0) {
                lastTypeTime = p.millis();
            }

            if (p.millis() - lastTypeTime > 3000) {
                console.log("CRITICAL: EXITING TERMINAL -> REBUILD (Mobile Optimized)");

                // 1. Force state reset
                animationFrame = 0;
                terminalLog = []; // Immediate cleanup

                // VOID MODE: Show photo332.webp after terminal
                const voidImageKey = 'photos/photo332.webp';
                if (allImages[voidImageKey]) {
                    currentImageKey = voidImageKey;
                    useColorMode = false;
                } else {
                    // Fallback: try to load it
                    loadImageDynamically(voidImageKey, (result) => {
                        if (result.success) {
                            currentImageKey = result.img.filePath;
                            useColorMode = false;
                        } else {
                            // Final fallback to color mode
                            useColorMode = true;
                            currentImageKey = 'color-' + Math.floor(Math.random() * colorPatterns.length);
                        }
                    });
                }

                // IMPORTANT: explicit clear to prevent logic locking
                nextImageKey = null;

                animationState = 'rebuild';

                // 3. Forced UI Sync
                const container = document.getElementById('imageCanvas-container');
                if (container) {
                    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
                }

                // 4. Final state cleanup
                dialogueIndex = 0;
                charIndex = 0;
                scrollOffset = 0;
                lastTypeTime = 0;

                // 5. Wake up engine
                p.background(255); // Flash white to reset pixels
                p.loop();
            }
        }
    }


    p.triggerSecret = (code) => {
        if (code === 'void' || code === 'ai') {
            console.log("AI TERMINAL ACTIVATED");

            // Play music (Fallback to ambient-loop if desktop-ritual is not available)
            // For now using ambient-loop.mp3 for all to avoid 404
            playAmbientMusic('ambient-loop.mp3');

            // Start with noise (Mosaic Feedback)
            animationState = 'pre_terminal_noise';
            animationFrame = 0;

            // GOD SPEED: Invert colors to create BLACK terminal world
            document.documentElement.style.filter = 'invert(1)';
            document.body.style.backgroundColor = '#000000'; // Force backdrop color

            terminalLog = [];
            dialogueIndex = 0;
            charIndex = 0;

            // IMPORTANT: explicit clear to prevent logic locking
            nextImageKey = null;
        } else if (code === 'exit') {
            console.log("EXITING TERMINAL");
            stopAmbientMusic(); // Stop background music

            animationState = 'rebuild';

            // Restore Image
            // We need to pick a valid key to rebuild TO
            let keys = Object.keys(allImages);
            if (keys.length > 0) {
                currentImageKey = keys[0];
            } else {
                // Determine based on config if image or color
                const initialIndex = CONFIG.IMAGE_MACHINE.INITIAL_IMAGE_INDEX;
                const fName = `${CONFIG.IMAGE_MACHINE.PATH_PREFIX}${(initialIndex + 1).toString().padStart(3, '0')}${CONFIG.IMAGE_MACHINE.FILE_EXTENSION}`;
                currentImageKey = fName;
            }

            // RESET VISUALS
            document.documentElement.style.filter = 'none';
            document.documentElement.style.backgroundColor = '';
            document.body.style.backgroundColor = '';

            // Restore original background colors
            document.documentElement.style.removeProperty('--color-bg-secondary');
            document.documentElement.style.removeProperty('--color-bg-tertiary');
        }
    };

    function drawPreTerminalNoise() {
        const blockSize = 10; // Smaller mosaic blocks
        p.noStroke();
        for (let x = 0; x < p.width; x += blockSize) {
            for (let y = 0; y < p.height; y += blockSize) {
                // Randomly Black or White
                p.fill(p.random() > 0.5 ? 255 : 0);
                p.rect(x, y, blockSize, blockSize);
            }
        }
    }
};

export function initImageMachine() {
    window.imageMachine = new p5(imageMachineSketch);
}
