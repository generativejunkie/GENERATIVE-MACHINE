// ==================== IMAGE MACHINE ====================
export const imageMachineSketch = (p) => {
    const imageCount = 383;
    const imageFileNames = [];

    // Generate image file names
    for (let i = 1; i <= imageCount; i++) {
        imageFileNames.push(`/photos/photo${i.toString().padStart(3, '0')}.webp`);
    }

    // Fallback color patterns if images not available
    const colorPatterns = [
        ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE'],
        ['#96CEB4', '#FFEAA7', '#DFE6E9', '#74B9FF', '#FD79A8'],
        ['#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7', '#00B894'],
        ['#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E', '#00CEC9'],
        ['#00B894', '#00CEC9', '#0984E3', '#6C5CE7', '#FD79A8'],
        ['#E17055', '#FDCB6E', '#00B894', '#74B9FF', '#A29BFE'],
        ['#2D3436', '#636E72', '#B2BEC3', '#DFE6E9', '#FFFFFF']
    ];

    let allImages = {};
    let currentImageKey = null;
    let nextImageKey = null;
    let animationState = 'loading';
    let animationFrame = 0;
    let transitionType = 'blocks';
    const chaosDuration = 15;
    const transitionDuration = 20;
    let promptTimer = null;
    let useColorMode = false; // Flag for fallback mode
    let imageLoadAttempts = 0;
    const maxLoadAttempts = 3;

    // Available transition effects
    const transitionEffects = [
        'blocks',
        'slide',
        'pixelate',
        'spiral',
        'zoom',
        'rgb-split',
        'scan',
        'reveal',
        'stripe',
        'fade',
        'grid',
        'wipe',
        'dissolve',
        'curtain',
        'matrix'
    ];

    p.setup = () => {
        try {
            const container = document.getElementById('imageCanvas-container');
            p.createCanvas(container.offsetWidth, container.offsetHeight).parent(container);
            p.background(255);

            // Try to load initial image, fallback to color mode
            const initialIndex = p.floor(p.random(imageFileNames.length));
            loadImageDynamically(imageFileNames[initialIndex], (result) => {
                if (result.success) {
                    currentImageKey = result.img.filePath;
                    useColorMode = false;
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
                    runTransition(rebuildContent, animationFrame / transitionDuration, false);
                    animationFrame++;
                    if (animationFrame > transitionDuration) {
                        animationFrame = 0;
                        animationState = 'display';
                        promptTimer = setTimeout(() => {
                            document.getElementById('imagePrompt').classList.remove('hidden');
                        }, 5000);
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
                    // Switch to color mode after max attempts
                    console.log('Switching to color pattern mode');
                    imageLoadAttempts = 0;
                    callback({ success: false });
                }
            }
        );
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
            // Image mode
            for (let y = 0; y < p.height; y += blockSize) {
                for (let x = 0; x < p.width; x += blockSize) {
                    let probability = isDecay ? progress : (1.0 - progress);
                    if (p.random() < probability) {
                        let c = content.get(x, y);
                        p.fill(c);
                        p.noStroke();
                        p.rect(x, y, blockSize, blockSize);
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
            for (let y = 0; y < p.height; y += pixelSize) {
                for (let x = 0; x < p.width; x += pixelSize) {
                    let c = content.get(p.floor(x), p.floor(y));
                    p.fill(c);
                    p.noStroke();
                    p.rect(x, y, pixelSize, pixelSize);
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
                    let c = content.get(p.floor(x), p.floor(y));
                    p.fill(c);
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
        for (let i = 0; i < columns; i++) {
            const x = i * fontSize;
            const speed = p.random(0.5, 2);
            const yOffset = (p.frameCount * speed + i * 50) % (p.height + 100);

            for (let j = 0; j < 30; j++) {
                const y = yOffset - j * fontSize;
                if (y > 0 && y < p.height) {
                    const alpha = p.map(j, 0, 30, 255, 0);
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
                const blockSize = 10;
                for (let y = 0; y < revealHeight; y += blockSize) {
                    for (let x = 0; x < p.width; x += blockSize) {
                        if (p.random() < (1 - matrixProgress)) {
                            const srcX = Math.floor((x / p.width) * content.width);
                            const srcY = Math.floor((y / p.height) * content.height);
                            const c = content.get(srcX, srcY);
                            p.fill(c);
                            p.noStroke();
                            p.rect(x, y, blockSize, blockSize);
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
        const colorArray = Array.isArray(colors) ? colors : colorPatterns[0];
        p.background(255);
        const gridSize = 40;
        for (let y = 0; y < p.height; y += gridSize) {
            for (let x = 0; x < p.width; x += gridSize) {
                const colorIndex = p.floor(p.random(colorArray.length));
                p.fill(colorArray[colorIndex]);
                p.noStroke();
                p.rect(x, y, gridSize, gridSize);
            }
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
            document.getElementById('imagePrompt').classList.add('hidden');
            clearTimeout(promptTimer);

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

                loadImageDynamically(imageFileNames[newIndex], (result) => {
                    if (result.success) {
                        nextImageKey = result.img.filePath;
                    } else {
                        // Switch to color mode
                        useColorMode = true;
                        nextImageKey = `color-${p.floor(p.random(colorPatterns.length))}`;
                    }
                    animationFrame = 0;
                    animationState = 'decay';
                });
            }
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
        // Handle spacebar for image switching
        if (p.key === ' ' || p.keyCode === 32) {
            handleInteraction();
            return false; // Prevent page scroll
        }
    };

    p.windowResized = () => {
        const container = document.getElementById('imageCanvas-container');
        p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    };
};

export function initImageMachine() {
    new p5(imageMachineSketch);
}
