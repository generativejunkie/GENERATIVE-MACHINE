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
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            document.getElementById('settingsPanel').classList.toggle('open');
        });
    }

    setupControlListener('pillCount', (val) => {
        pillCount = parseInt(val);
        document.getElementById('pillCountVal').textContent = pillCount;
        createPills();
    });

    setupControlListener('pillSize', (val) => {
        pillSize = parseFloat(val);
        document.getElementById('pillSizeVal').textContent = pillSize.toFixed(1);
    });

    setupControlListener('spread', (val) => {
        spreadWidth = parseFloat(val);
        document.getElementById('spreadVal').textContent = spreadWidth.toFixed(1);
        createPills();
    });

    setupControlListener('rotation', (val) => {
        rotationSpeed = parseFloat(val);
        document.getElementById('rotationVal').textContent = rotationSpeed.toFixed(1);
    });

    setupControlListener('scale', (val) => {
        scaleIntensity = parseFloat(val);
        document.getElementById('scaleVal').textContent = scaleIntensity.toFixed(1);
    });

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

    updateControlValue('pillCount', 1);
    updateControlValue('pillSize', 0.7);
    updateControlValue('spread', 0);
    updateControlValue('rotation', 1);
    updateControlValue('scale', 1);

    const wireframeInput = document.getElementById('wireframe');
    if (wireframeInput) wireframeInput.checked = false;

    const blockModeInput = document.getElementById('blockMode');
    if (blockModeInput) blockModeInput.checked = false;

    document.getElementById('pillCountVal').textContent = '1';
    document.getElementById('pillSizeVal').textContent = '0.7';
    document.getElementById('spreadVal').textContent = '0.0';
    document.getElementById('rotationVal').textContent = '1.0';
    document.getElementById('scaleVal').textContent = '1.0';

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
