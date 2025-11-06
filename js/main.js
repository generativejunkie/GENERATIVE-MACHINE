// ==================== Typing Animation ====================
        function typeText(element, text, speed = 50, loop = false) {
            return new Promise((resolve) => {
                let i = 0;
                element.textContent = '';
                element.classList.remove('completed');
                
                const typeChar = () => {
                    if (i < text.length) {
                        element.textContent += text.charAt(i);
                        i++;
                        setTimeout(typeChar, speed);
                    } else {
                        if (loop) {
                            setTimeout(() => {
                                element.textContent = '';
                                i = 0;
                                typeChar();
                            }, 5000); // 5秒待機
                        } else {
                            element.classList.add('completed');
                            resolve();
                        }
                    }
                };
                
                typeChar();
            });
        }
        
        // Initialize typing animations on scroll
        const typingObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.target.textContent === '') {
                    const text = entry.target.dataset.text;
                    const loop = entry.target.dataset.loop === 'true';
                    typeText(entry.target, text, 50, loop);
                }
            });
        }, { threshold: 0.5 });
        
        // Setup typing texts
        document.addEventListener('DOMContentLoaded', () => {
            const descEl = document.getElementById('description-text');
            const imageDescEl = document.getElementById('image-desc-text');
            const soundDescEl = document.getElementById('sound-desc-text');
            const storeDescEl = document.getElementById('store-desc-text');
            
            descEl.dataset.text = 'Exploring algorithmic beauty and the emotional resonance of machine intelligence. Prompt engineering as an art form.';
            descEl.dataset.loop = 'true';
            imageDescEl.dataset.text = 'Click or tap to switch between random images with generative transition effects';
            imageDescEl.dataset.loop = 'true';
            soundDescEl.dataset.text = 'Upload audio to experience real-time sound visualization';
            soundDescEl.dataset.loop = 'true';
            storeDescEl.dataset.text = 'Embody the GENERATIVE JUNKIE aesthetic';
            storeDescEl.dataset.loop = 'true';
            
            // Start hero description typing immediately with loop
            typeText(descEl, descEl.dataset.text, 30, true);
            
            // Observe other sections
            typingObserver.observe(imageDescEl);
            typingObserver.observe(soundDescEl);
            typingObserver.observe(storeDescEl);
        });
        
        // ==================== IMAGE MACHINE ====================
        const imageMachineSketch = (p) => {
            const imageCount = 394;
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
            const transitionDuration = 40;
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
                'grid'
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
                    
                    switch(animationState) {
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
                
                switch(transitionType) {
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
                        p.copy(content, sx, y, content.width, sliceHeight, dx, y, p.width, sliceHeight);
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
                        p.copy(content, 0, y, content.width, 2, offset, y, p.width, 2);
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
                    p.copy(content, 0, 0, content.width, content.height * (scanLine / p.height), 
                           0, 0, p.width, scanLine);
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
                        p.copy(content, x, 0, stripeWidth, content.height, 
                               x, offsetY, stripeWidth, p.height - offsetY);
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
                        p.copy(content, grabX, grabY, w, h, x, y, w, h);
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
            
            p.windowResized = () => {
                const container = document.getElementById('imageCanvas-container');
                p.resizeCanvas(container.offsetWidth, container.offsetHeight);
            };
        };
        
        new p5(imageMachineSketch);
        
        // ==================== SOUND MACHINE ====================
        let audioContext, analyser, source, buffer;
        let isPlaying = false;
        let startTime = 0, pauseTime = 0;
        let duration = 0, currentTime = 0;
        let scene, camera, renderer, pillGroups = [];
        let frequencyData = { low: 0, mid: 0, high: 0 };
        let pillCount = 1, pillSize = 0.7, spreadWidth = 0;
        let rotationSpeed = 1, scaleIntensity = 1;
        let wireframeMode = false, blockMode = false;
        let audioElement = null; // HTML Audio element for iOS compatibility
        
        function initSoundMachine() {
            const container = document.getElementById('soundCanvas-container');
            
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xfafafa);
            
            camera = new THREE.PerspectiveCamera(
                75,
                container.offsetWidth / container.offsetHeight,
                0.1,
                100
            );
            camera.position.set(0, 0, 5);
            
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(container.offsetWidth, container.offsetHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.appendChild(renderer.domElement);
            
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            
            const mainLight = new THREE.DirectionalLight(0xffffff, 1);
            mainLight.position.set(5, 5, 5);
            scene.add(mainLight);
            
            createPills();
            animateSound();
            
            window.addEventListener('resize', () => {
                camera.aspect = container.offsetWidth / container.offsetHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.offsetWidth, container.offsetHeight);
            });
        }
        
        function createPill() {
            const pillGroup = new THREE.Group();
            
            const whiteMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.3,
                roughness: 0.4,
                wireframe: wireframeMode
            });
            
            const blackMat = new THREE.MeshStandardMaterial({
                color: 0x0a0a0a,
                metalness: 0.3,
                roughness: 0.4,
                wireframe: wireframeMode
            });
            
            if (blockMode) {
                const topBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), whiteMat);
                topBox.position.y = 0.5;
                pillGroup.add(topBox);
                
                const bottomBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), blackMat);
                bottomBox.position.y = -0.5;
                pillGroup.add(bottomBox);
            } else {
                const topCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 32), whiteMat);
                topCyl.position.y = 0.5;
                pillGroup.add(topCyl);
                
                const bottomCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 32), blackMat);
                bottomCyl.position.y = -0.5;
                pillGroup.add(bottomCyl);
                
                const topSphere = new THREE.Mesh(
                    new THREE.SphereGeometry(0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2),
                    whiteMat
                );
                topSphere.position.y = 1;
                pillGroup.add(topSphere);
                
                const bottomSphere = new THREE.Mesh(
                    new THREE.SphereGeometry(0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2),
                    blackMat
                );
                bottomSphere.position.y = -1;
                bottomSphere.rotation.x = Math.PI;
                pillGroup.add(bottomSphere);
            }
            
            return pillGroup;
        }
        
        function createPills() {
            pillGroups.forEach(pill => {
                scene.remove(pill);
                pill.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            });
            pillGroups = [];
            
            for (let i = 0; i < pillCount; i++) {
                const pill = createPill();
                if (pillCount === 1) {
                    pill.position.set(0, 0, 0);
                } else {
                    const angle = (i / pillCount) * Math.PI * 2;
                    pill.position.set(
                        Math.cos(angle) * spreadWidth,
                        0,
                        Math.sin(angle) * spreadWidth
                    );
                }
                scene.add(pill);
                pillGroups.push(pill);
            }
        }
        
        function animateSound() {
            requestAnimationFrame(animateSound);
            
            if (analyser && isPlaying) {
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);
                
                const bufferLength = dataArray.length;
                const lowEnd = Math.floor(bufferLength * 0.1);
                const midEnd = Math.floor(bufferLength * 0.5);
                
                let low = 0, mid = 0, high = 0;
                
                for (let i = 0; i < lowEnd; i++) low += dataArray[i];
                for (let i = lowEnd; i < midEnd; i++) mid += dataArray[i];
                for (let i = midEnd; i < bufferLength; i++) high += dataArray[i];
                
                low = (low / lowEnd) / 255;
                mid = (mid / (midEnd - lowEnd)) / 255;
                high = (high / (bufferLength - midEnd)) / 255;
                
                frequencyData = { low, mid, high };
                updateFrequencyBars();
                
                if (audioContext && source) {
                    const elapsed = audioContext.currentTime - startTime;
                    currentTime = Math.min(elapsed, duration);
                    updateTimeDisplay();
                }
            }
            
            pillGroups.forEach((pillGroup, index) => {
                const audioReaction = (frequencyData.low + frequencyData.mid + frequencyData.high) / 3;
                const targetScale = pillSize + audioReaction * 1.0 * scaleIntensity;
                pillGroup.scale.set(targetScale, targetScale, targetScale);
                
                pillGroup.rotation.x += (0.005 + frequencyData.mid * 0.02) * rotationSpeed;
                pillGroup.rotation.y += (0.003 + frequencyData.low * 0.01) * rotationSpeed;
                pillGroup.rotation.z += (0.002 + frequencyData.high * 0.015) * rotationSpeed;
                
                if (pillCount > 1) {
                    const angle = (index / pillCount) * Math.PI * 2;
                    pillGroup.position.x = Math.cos(angle) * spreadWidth;
                    pillGroup.position.z = Math.sin(angle) * spreadWidth;
                }
            });
            
            renderer.render(scene, camera);
        }
        
        function updateFrequencyBars() {
            const freqTypes = ['low', 'mid', 'high'];
            freqTypes.forEach(type => {
                const bars = document.querySelectorAll(`#${type}Freq .freq-bar`);
                const value = frequencyData[type.replace('Freq', '')];
                bars.forEach((bar, index) => {
                    if (value > index / 10) {
                        bar.classList.add('active');
                    } else {
                        bar.classList.remove('active');
                    }
                });
            });
        }
        
        function updateTimeDisplay() {
            document.getElementById('currentTime').textContent = formatTime(currentTime);
            document.getElementById('duration').textContent = formatTime(duration);
            const progress = (currentTime / duration) * 100;
            document.getElementById('seekBarProgress').style.width = `${progress}%`;
        }
        
        function formatTime(sec) {
            if (isNaN(sec)) return '0:00';
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${m}:${s.toString().padStart(2, '0')}`;
        }
        
        // Audio file handling
        document.getElementById('audioFile').addEventListener('change', handleAudioFile);
        document.getElementById('audioFileSelect').addEventListener('change', handleAudioFile);
        
        let sourceCreated = false;
        
        async function handleAudioFile(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // Stop any existing playback
            if (audioElement) {
                audioElement.pause();
                audioElement.currentTime = 0;
            }
            
            isPlaying = false;
            pauseTime = 0;
            currentTime = 0;
            
            try {
                // Create audio element for iOS compatibility
                if (!audioElement) {
                    audioElement = new Audio();
                    audioElement.crossOrigin = 'anonymous';
                }
                
                // Create object URL for the file
                const objectURL = URL.createObjectURL(file);
                audioElement.src = objectURL;
                
                // Initialize Web Audio API
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                
                // Resume audio context (required for iOS)
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }
                
                // Create analyser
                if (!analyser) {
                    analyser = audioContext.createAnalyser();
                    analyser.fftSize = 1024;
                    analyser.smoothingTimeConstant = 0.8;
                    analyser.connect(audioContext.destination);
                }
                
                // Connect audio element to analyser (only once)
                if (!sourceCreated) {
                    source = audioContext.createMediaElementSource(audioElement);
                    source.connect(analyser);
                    sourceCreated = true;
                }
                
                // Wait for metadata to load
                await new Promise((resolve, reject) => {
                    audioElement.onloadedmetadata = resolve;
                    audioElement.onerror = reject;
                    setTimeout(reject, 5000); // timeout after 5s
                });
                
                duration = audioElement.duration;
                
                // Update time during playback
                audioElement.ontimeupdate = () => {
                    currentTime = audioElement.currentTime;
                    updateTimeDisplay();
                };
                
                audioElement.onended = () => {
                    isPlaying = false;
                    pauseTime = 0;
                    currentTime = 0;
                    document.getElementById('playBtn').disabled = false;
                    document.getElementById('pauseBtn').disabled = true;
                    updateTimeDisplay();
                };
                
                document.getElementById('dropZone').style.display = 'none';
                document.getElementById('audioPlayer').style.display = 'block';
                document.getElementById('playBtn').disabled = false;
                updateTimeDisplay();
                
                // Reset file input
                e.target.value = '';
            } catch (error) {
                console.error('Audio loading error:', error);
                alert('音声ファイルの読み込みに失敗しました。MP3またはWAV形式のファイルをお試しください。');
            }
        }
        
        document.getElementById('playBtn').addEventListener('click', async () => {
            if (!audioElement) return;
            
            try {
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }
                
                await audioElement.play();
                
                isPlaying = true;
                document.getElementById('playBtn').disabled = true;
                document.getElementById('pauseBtn').disabled = false;
            } catch (error) {
                console.error('Playback error:', error);
                alert('Playback error. Please try again.');
            }
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            if (audioElement) {
                audioElement.pause();
            }
            isPlaying = false;
            document.getElementById('playBtn').disabled = false;
            document.getElementById('pauseBtn').disabled = true;
        });
        
        // Seek bar functionality
        document.getElementById('seekBar').addEventListener('click', (e) => {
            if (!audioElement) return;
            
            const rect = e.target.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const newTime = percent * duration;
            
            audioElement.currentTime = newTime;
            currentTime = newTime;
            updateTimeDisplay();
        });
        
        // Settings panel
        document.getElementById('settingsBtn').addEventListener('click', () => {
            document.getElementById('settingsPanel').classList.toggle('open');
        });
        
        document.getElementById('pillCount').addEventListener('input', (e) => {
            pillCount = parseInt(e.target.value);
            document.getElementById('pillCountVal').textContent = pillCount;
            createPills();
        });
        
        document.getElementById('pillSize').addEventListener('input', (e) => {
            pillSize = parseFloat(e.target.value);
            document.getElementById('pillSizeVal').textContent = pillSize.toFixed(1);
        });
        
        document.getElementById('spread').addEventListener('input', (e) => {
            spreadWidth = parseFloat(e.target.value);
            document.getElementById('spreadVal').textContent = spreadWidth.toFixed(1);
            createPills();
        });
        
        document.getElementById('rotation').addEventListener('input', (e) => {
            rotationSpeed = parseFloat(e.target.value);
            document.getElementById('rotationVal').textContent = rotationSpeed.toFixed(1);
        });
        
        document.getElementById('scale').addEventListener('input', (e) => {
            scaleIntensity = parseFloat(e.target.value);
            document.getElementById('scaleVal').textContent = scaleIntensity.toFixed(1);
        });
        
        document.getElementById('wireframe').addEventListener('change', (e) => {
            wireframeMode = e.target.checked;
            createPills();
        });
        
        document.getElementById('blockMode').addEventListener('change', (e) => {
            blockMode = e.target.checked;
            createPills();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            pillCount = 1;
            pillSize = 0.7;
            spreadWidth = 0;
            rotationSpeed = 1;
            scaleIntensity = 1;
            wireframeMode = false;
            blockMode = false;
            
            document.getElementById('pillCount').value = 1;
            document.getElementById('pillSize').value = 0.7;
            document.getElementById('spread').value = 0;
            document.getElementById('rotation').value = 1;
            document.getElementById('scale').value = 1;
            document.getElementById('wireframe').checked = false;
            document.getElementById('blockMode').checked = false;
            
            document.getElementById('pillCountVal').textContent = '1';
            document.getElementById('pillSizeVal').textContent = '0.7';
            document.getElementById('spreadVal').textContent = '0.0';
            document.getElementById('rotationVal').textContent = '1.0';
            document.getElementById('scaleVal').textContent = '1.0';
            
            createPills();
        });
        
        initSoundMachine();
        
        // ==================== Smooth Scroll ====================
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });