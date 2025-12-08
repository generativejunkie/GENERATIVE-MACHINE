// ==================== SOUND MACHINE ====================
import { decodeAIFF } from '../utils/aiff-decoder.js';

let audioContext, analyser;
let scene, camera, renderer, pillGroups = [];
let frequencyData = { low: 0, mid: 0, high: 0 };
let pillCount = 1, pillSize = 0.7, spreadWidth = 0;
let rotationSpeed = 1, scaleIntensity = 1;
let wireframeMode = false, blockMode = false;

// Player State
let playerState = {
    mode: 'none', // 'element' or 'buffer' or 'none'
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    startTime: 0, // For buffer mode: when playback started relative to context time
    pauseTime: 0, // For buffer mode: offset when paused
    element: null, // HTMLAudioElement
    buffer: null, // AudioBuffer
    sourceNode: null, // AudioBufferSourceNode or MediaElementAudioSourceNode
    gainNode: null
};

export function initSoundMachine() {
    const container = document.getElementById('soundCanvas-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfafafa);

    camera = new THREE.PerspectiveCamera(
        75,
        container.offsetWidth / container.offsetHeight,
        0.1,
        100
    );
    camera.position.set(0, 0, 5);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true
    });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false; // Disable shadows for performance
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

    setupEventListeners();

    // Optimize rendering: only animate when visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!isAnimating) {
                    isAnimating = true;
                    animateSound();
                }
            } else {
                isAnimating = false;
            }
        });
    }, { threshold: 0 });

    observer.observe(container);

    // Initialize Visual Controller
    initVisualController();
}

let isAnimating = false;

// ==================== VISUAL CONTROLLER (RADAR) ====================
let visualController = null;

class VisualController {
    constructor(containerId, params, onChange) {
        this.container = document.getElementById(containerId);
        this.params = params; // Array of { name, value, min, max, label }
        this.onChange = onChange;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 300;
        this.height = 300;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.radius = 100;
        this.draggingIndex = -1;

        this.init();
    }

    init() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = '100%';
        this.canvas.style.height = 'auto';
        this.canvas.style.maxWidth = '300px';
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
        this.canvas.style.touchAction = 'none'; // Prevent scrolling while dragging
        this.canvas.style.cursor = 'pointer';
        this.canvas.style.zIndex = '100'; // Ensure it's on top

        // Replace existing controls or append? User said "integrate", so let's insert before reset button
        const settingsPanel = document.getElementById('settingsPanel');
        const resetBtn = document.getElementById('resetBtn');
        if (settingsPanel && resetBtn) {
            // Remove old slider groups to cleanup UI
            const controls = settingsPanel.querySelectorAll('.control-group:not(.checkbox-group)');
            controls.forEach(el => el.style.display = 'none');

            // Check if canvas already exists and remove it to avoid duplicates
            const existingCanvas = settingsPanel.querySelector('canvas');
            if (existingCanvas) existingCanvas.remove();

            // Insert canvas
            settingsPanel.insertBefore(this.canvas, resetBtn);
        }

        this.canvas.addEventListener('mousedown', this.handleStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMove.bind(this));
        window.addEventListener('mouseup', this.handleEnd.bind(this));

        this.canvas.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        window.addEventListener('touchend', this.handleEnd.bind(this));

        this.draw();
    }

    getPointOnCircle(angle, dist) {
        return {
            x: this.centerX + Math.cos(angle - Math.PI / 2) * dist,
            y: this.centerY + Math.sin(angle - Math.PI / 2) * dist
        };
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const count = this.params.length;
        const angleStep = (Math.PI * 2) / count;

        // Draw background chart (Axis and outline)
        this.ctx.beginPath();
        for (let i = 0; i < count; i++) {
            const p = this.getPointOnCircle(i * angleStep, this.radius);
            if (i === 0) this.ctx.moveTo(p.x, p.y);
            else this.ctx.lineTo(p.x, p.y);
        }
        this.ctx.closePath();
        this.ctx.strokeStyle = '#e5e5e5';
        this.ctx.stroke();

        // Draw axis lines from center
        this.ctx.beginPath();
        for (let i = 0; i < count; i++) {
            const p = this.getPointOnCircle(i * angleStep, this.radius);
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.lineTo(p.x, p.y);
        }
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.stroke();

        // Draw data shape
        this.ctx.beginPath();
        // Store first point to close path manually if needed
        let firstPoint = null;

        this.params.forEach((param, i) => {
            // Normalize value 0-1
            const normalized = (param.value - param.min) / (param.max - param.min);
            const dist = normalized * this.radius;
            const p = this.getPointOnCircle(i * angleStep, dist);

            if (i === 0) {
                this.ctx.moveTo(p.x, p.y);
                firstPoint = p;
            } else {
                this.ctx.lineTo(p.x, p.y);
            }
        });

        // Explicitly line to start
        if (firstPoint) {
            this.ctx.lineTo(firstPoint.x, firstPoint.y);
        }

        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(10, 10, 10, 0.15)'; // Slightly darker for better visibility
        this.ctx.fill();
        this.ctx.strokeStyle = '#0a0a0a';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw handles and labels
        this.params.forEach((param, i) => {
            const normalized = (param.value - param.min) / (param.max - param.min);
            const dist = normalized * this.radius;
            const p = this.getPointOnCircle(i * angleStep, dist);

            // Handle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); // Larger handle
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fill();
            this.ctx.strokeStyle = '#0a0a0a';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();

            // Label
            const labelDist = this.radius + 25;
            const labelP = this.getPointOnCircle(i * angleStep, labelDist);

            this.ctx.fillStyle = '#666';
            this.ctx.font = '10px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Format value
            let displayVal = param.value;
            if (param.name === 'pillCount') displayVal = Math.round(displayVal);
            else displayVal = displayVal.toFixed(1);

            this.ctx.fillText(param.label, labelP.x, labelP.y - 7);
            this.ctx.fillStyle = '#0a0a0a';
            this.ctx.font = 'bold 11px sans-serif';
            this.ctx.fillText(displayVal, labelP.x, labelP.y + 7);
        });
    }

    handleStart(e) {
        e.preventDefault();
        e.stopPropagation();
        const pos = this.getPos(e);
        this.draggingIndex = this.getClosestHandle(pos);
        if (this.draggingIndex !== -1) {
            this.canvas.style.cursor = 'grabbing';
        }
    }

    handleMove(e) {
        if (this.draggingIndex === -1) return;
        e.preventDefault();
        e.stopPropagation();

        const pos = this.getPos(e);
        const count = this.params.length;
        const angleStep = (Math.PI * 2) / count;
        const angle = this.draggingIndex * angleStep - Math.PI / 2;

        // Project point onto axis vector
        // Drag vector
        const dx = pos.x - this.centerX;
        const dy = pos.y - this.centerY;

        // Axis unit vector
        const axisX = Math.cos(angle);
        const axisY = Math.sin(angle);

        // Dot product to get distance along axis
        // We project the drag position onto the axis line
        let dist = dx * axisX + dy * axisY;
        dist = Math.max(0, Math.min(dist, this.radius));

        // Convert back to value
        const normalized = dist / this.radius;
        const param = this.params[this.draggingIndex];
        let newValue = param.min + normalized * (param.max - param.min);

        // Snap for integer values (pillCount)
        if (param.name === 'pillCount') {
            newValue = Math.round(newValue);
        }

        // Limit updates to meaningful changes to improve perf
        if (Math.abs(param.value - newValue) > 0.01) {
            param.value = newValue;
            this.onChange(param.name, newValue);
            this.draw();
        }
    }

    handleEnd(e) {
        if (this.draggingIndex !== -1) {
            this.draggingIndex = -1;
            this.canvas.style.cursor = 'pointer';
        }
    }

    getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    getClosestHandle(pos) {
        const count = this.params.length;
        const angleStep = (Math.PI * 2) / count;
        let minDist = 40; // Increased hit radius for better touch interaction
        let closestIndex = -1;

        this.params.forEach((param, i) => {
            const normalized = (param.value - param.min) / (param.max - param.min);
            const dist = normalized * this.radius;
            const p = this.getPointOnCircle(i * angleStep, dist);

            const dx = pos.x - p.x;
            const dy = pos.y - p.y;
            const d = Math.sqrt(dx * dx + dy * dy);

            if (d < minDist) {
                minDist = d;
                closestIndex = i;
            }
        });

        return closestIndex;
    }

    updateParam(name, value) {
        const param = this.params.find(p => p.name === name);
        if (param) {
            param.value = value;
            this.draw();
        }
    }
}

function initVisualController() {
    // Initial parameter values
    const params = [
        { name: 'scale', label: 'Scale', value: scaleIntensity, min: 0, max: 3 },
        { name: 'pillCount', label: 'Capsules', value: pillCount, min: 1, max: 12 },
        { name: 'spread', label: 'Spread', value: spreadWidth, min: 0, max: 5 },
        { name: 'pillSize', label: 'Size', value: pillSize, min: 0.3, max: 1.5 },
        { name: 'rotation', label: 'Rotation', value: rotationSpeed, min: 0, max: 3 }
    ];

    visualController = new VisualController('settingsPanel', params, (name, val) => {
        // Update variables based on name
        switch (name) {
            case 'pillCount':
                const newCount = Math.round(val);
                if (pillCount !== newCount) {
                    pillCount = newCount;
                    createPills();
                }
                break;
            case 'pillSize':
                pillSize = val;
                break;
            case 'spread':
                spreadWidth = val;
                createPills(); // spread changes positions
                break;
            case 'rotation':
                rotationSpeed = val;
                break;
            case 'scale':
                scaleIntensity = val;
                break;
        }
    });
}

function setupEventListeners() {
    const audioFile = document.getElementById('audioFile');
    const audioFileSelect = document.getElementById('audioFileSelect');

    if (audioFile) audioFile.addEventListener('change', handleAudioFile);
    if (audioFileSelect) audioFileSelect.addEventListener('change', handleAudioFile);

    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.addEventListener('click', () => togglePlayback(true));
    }

    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => togglePlayback(false));
    }

    const seekBar = document.getElementById('seekBar');
    if (seekBar) {
        seekBar.addEventListener('click', (e) => {
            if (playerState.mode === 'none') return;

            const rect = e.target.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const newTime = percent * playerState.duration;

            seek(newTime);
        });
    }

    // Settings panel listeners
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsBtn && settingsPanel) {
        settingsBtn.addEventListener('click', () => {
            const isOpen = settingsPanel.classList.toggle('open');
            settingsBtn.setAttribute('aria-expanded', isOpen);
        });
    }

    // Checkbox listeners (keep these separate from radar)
    const wireframeInput = document.getElementById('wireframe');
    if (wireframeInput) {
        wireframeInput.addEventListener('change', (e) => {
            wireframeMode = e.target.checked;
            createPills();
        });
    }

    const blockModeInput = document.getElementById('blockMode');
    if (blockModeInput) {
        blockModeInput.addEventListener('change', (e) => {
            blockMode = e.target.checked;
            createPills();
        });
    }

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSettings);
    }
}

function setupControlListener(id, callback) {
    // Obsolete with Visual Controller, keeping for compatibility if needed or removed
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', (e) => callback(e.target.value));
    }
}

function resetSettings() {
    pillCount = 1;
    pillSize = 0.7;
    spreadWidth = 0;
    rotationSpeed = 1;
    scaleIntensity = 1;
    wireframeMode = false;
    blockMode = false;

    // Reset Visual Controller
    if (visualController) {
        visualController.updateParam('pillCount', 1);
        visualController.updateParam('pillSize', 0.7);
        visualController.updateParam('spread', 0);
        visualController.updateParam('rotation', 1);
        visualController.updateParam('scale', 1);
    }

    const wireframeInput = document.getElementById('wireframe');
    if (wireframeInput) wireframeInput.checked = false;

    const blockModeInput = document.getElementById('blockMode');
    if (blockModeInput) blockModeInput.checked = false;

    createPills();
}

function updateControlValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}


// ==================== AUDIO LOGIC ====================

async function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    if (!analyser) {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.8;
        // Create a gain node to control volume if needed, or connect directly
        // We connect analyser to destination so we can hear it
        analyser.connect(audioContext.destination);
    }
}

async function handleAudioFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Reset player
    stopPlayback();
    playerState.mode = 'none';
    playerState.duration = 0;
    playerState.currentTime = 0;
    updateTimeDisplay();

    try {
        await initAudioContext();

        // Check file extension for AIFF to skip HTMLAudioElement
        // Chrome and some other browsers don't support AIFF in <audio> tags
        const isAIFF = file.name.toLowerCase().endsWith('.aiff') || file.name.toLowerCase().endsWith('.aif');

        if (isAIFF) {
            console.log('AIFF detected, skipping HTMLAudioElement and using AudioBuffer...');
            await loadAudioAsBuffer(file);
            console.log('Loaded as AudioBuffer');
        } else {
            // Try loading as Element first (streaming, better for long files)
            try {
                console.log('Attempting to load as HTMLAudioElement...');
                await loadAudioAsElement(file);
                console.log('Loaded as HTMLAudioElement');
            } catch (elementError) {
                console.warn('HTMLAudioElement failed, falling back to AudioBuffer:', elementError);
                // Fallback to Buffer (better format support like AIFF)
                await loadAudioAsBuffer(file);
                console.log('Loaded as AudioBuffer');
            }
        }

        // UI Updates
        const dropZone = document.getElementById('dropZone');
        const audioPlayer = document.getElementById('audioPlayer');
        const playBtn = document.getElementById('playBtn');

        if (dropZone) dropZone.style.display = 'none';
        if (audioPlayer) audioPlayer.classList.remove('hidden');
        if (playBtn) playBtn.disabled = false;

        // Reset file input
        e.target.value = '';

    } catch (error) {
        console.error('Audio loading error:', error);
        alert(`音声ファイルの読み込みに失敗しました。\nエラー詳細: ${error.message || 'Unknown error'}`);
    }
}

function loadAudioAsElement(file) {
    return new Promise((resolve, reject) => {
        const objectURL = URL.createObjectURL(file);
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = objectURL;

        const timeout = setTimeout(() => {
            reject(new Error('Timeout waiting for metadata'));
        }, 5000);

        audio.onloadedmetadata = () => {
            clearTimeout(timeout);
            playerState.mode = 'element';
            playerState.element = audio;
            playerState.duration = audio.duration;

            // Connect to analyser
            const source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            playerState.sourceNode = source;

            // Event listeners
            audio.ontimeupdate = () => {
                if (playerState.mode === 'element') {
                    playerState.currentTime = audio.currentTime;
                    updateTimeDisplay();
                }
            };

            audio.onended = () => {
                togglePlayback(false);
                playerState.currentTime = 0;
                updateTimeDisplay();
            };

            resolve();
        };

        audio.onerror = (e) => {
            clearTimeout(timeout);
            reject(e);
        };
    });
}

function loadAudioAsBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                let audioBuffer;

                // Check if it's an AIFF file
                const isAIFF = file.name.toLowerCase().endsWith('.aiff') || file.name.toLowerCase().endsWith('.aif');

                if (isAIFF) {
                    console.log('Using custom AIFF decoder...');
                    audioBuffer = await decodeAIFF(arrayBuffer);
                } else {
                    // Use native decoder for other formats
                    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                }

                playerState.mode = 'buffer';
                playerState.buffer = audioBuffer;
                playerState.duration = audioBuffer.duration;
                playerState.currentTime = 0;
                playerState.pauseTime = 0;

                resolve();
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

async function togglePlayback(play) {
    if (playerState.mode === 'none') return;

    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    if (play) {
        if (playerState.mode === 'element') {
            await playerState.element.play();
        } else if (playerState.mode === 'buffer') {
            playBuffer();
        }
        playerState.isPlaying = true;
        document.getElementById('playBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
    } else {
        if (playerState.mode === 'element') {
            playerState.element.pause();
        } else if (playerState.mode === 'buffer') {
            stopBuffer();
            playerState.pauseTime = playerState.currentTime;
        }
        playerState.isPlaying = false;
        document.getElementById('playBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }
}

function playBuffer() {
    // Re-create source node (they are one-time use)
    const source = audioContext.createBufferSource();
    source.buffer = playerState.buffer;
    source.connect(analyser);

    playerState.sourceNode = source;
    playerState.startTime = audioContext.currentTime - playerState.pauseTime;

    source.start(0, playerState.pauseTime);

    source.onended = () => {
        if (playerState.isPlaying && playerState.currentTime >= playerState.duration - 0.1) {
            // Natural end
            togglePlayback(false);
            playerState.pauseTime = 0;
            playerState.currentTime = 0;
            updateTimeDisplay();
        }
    };
}

function stopBuffer() {
    if (playerState.sourceNode) {
        try {
            playerState.sourceNode.stop();
            playerState.sourceNode.disconnect();
        } catch (e) {
            // Ignore if already stopped
        }
        playerState.sourceNode = null;
    }
}

function stopPlayback() {
    if (playerState.mode === 'element' && playerState.element) {
        playerState.element.pause();
        playerState.element.currentTime = 0;
    } else if (playerState.mode === 'buffer') {
        stopBuffer();
    }
    playerState.isPlaying = false;
    playerState.pauseTime = 0;
    playerState.currentTime = 0;
}

function seek(time) {
    time = Math.max(0, Math.min(time, playerState.duration));
    playerState.currentTime = time;

    if (playerState.mode === 'element') {
        playerState.element.currentTime = time;
    } else if (playerState.mode === 'buffer') {
        playerState.pauseTime = time;
        if (playerState.isPlaying) {
            stopBuffer();
            playBuffer();
        }
    }
    updateTimeDisplay();
}

// ==================== VISUALIZATION ====================

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
    if (!isAnimating) return;
    requestAnimationFrame(animateSound);

    // Update time for buffer mode
    if (playerState.mode === 'buffer' && playerState.isPlaying) {
        playerState.currentTime = audioContext.currentTime - playerState.startTime;
        if (playerState.currentTime > playerState.duration) {
            playerState.currentTime = playerState.duration;
        }
        updateTimeDisplay();
    }

    if (analyser && playerState.isPlaying) {
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
    } else {
        // When not playing, use cached frequency data (smooth idle animation)
        frequencyData.low *= 0.95;
        frequencyData.mid *= 0.95;
        frequencyData.high *= 0.95;
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
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const progressBar = document.getElementById('seekBarProgress');

    if (currentTimeEl) currentTimeEl.textContent = formatTime(playerState.currentTime);
    if (durationEl) durationEl.textContent = formatTime(playerState.duration);
    if (progressBar) {
        const progress = playerState.duration > 0 ? (playerState.currentTime / playerState.duration) * 100 : 0;
        progressBar.style.width = `${progress}%`;
    }
}

function formatTime(sec) {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}
