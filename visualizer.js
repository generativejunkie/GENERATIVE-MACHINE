import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';

// ===========================
// MATERIALS DEFINITION
// ===========================
const MATERIALS = [
    {
        id: 'mat1',
        name: 'Bar',
        create3D: (isSolid = false) => {
            const geo = new THREE.BoxGeometry(0.3, 3, 0.3);
            let mesh;
            if (isSolid) {
                mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x000000 }));
            } else {
                const edges = new THREE.EdgesGeometry(geo);
                mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            }
            mesh.userData = { vel: new THREE.Vector3(0.01, 0.01, 0.01), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat2',
        name: 'Cube',
        create3D: (isSolid = false) => {
            const geo = new THREE.BoxGeometry(2, 2, 2, 1, 1, 1);
            let mesh;
            if (isSolid) {
                mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x000000 }));
            } else {
                const edges = new THREE.EdgesGeometry(geo);
                mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            }
            mesh.userData = { vel: new THREE.Vector3(0.015, 0.01, 0.008), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat3',
        name: 'Sphere',
        create3D: (isSolid = false) => {
            const geo = new THREE.SphereGeometry(1.5, 32, 32);
            let mesh;
            if (isSolid) {
                mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x000000 }));
            } else {
                const edges = new THREE.EdgesGeometry(geo, 10);
                mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));
            }
            mesh.userData = { vel: new THREE.Vector3(0.012, 0.015, 0.01), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat4',
        name: 'Torus',
        create3D: () => {
            const geo = new THREE.TorusGeometry(1.2, 0.4, 16, 32);
            const edges = new THREE.EdgesGeometry(geo, 15);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.userData = { vel: new THREE.Vector3(0.01, 0.012, 0.015), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat5',
        name: 'Cone',
        create3D: () => {
            const geo = new THREE.ConeGeometry(1, 2.5, 16, 1);
            const edges = new THREE.EdgesGeometry(geo);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.userData = { vel: new THREE.Vector3(0.018, 0.01, 0.012), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat6',
        name: 'Cylinder',
        create3D: () => {
            const geo = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 16, 1);
            const edges = new THREE.EdgesGeometry(geo);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.userData = { vel: new THREE.Vector3(0.01, 0.014, 0.009), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat7',
        name: 'Octahedron',
        create3D: () => {
            const geo = new THREE.OctahedronGeometry(1.5, 0);
            const edges = new THREE.EdgesGeometry(geo);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.userData = { vel: new THREE.Vector3(0.013, 0.01, 0.016), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat8',
        name: 'Tetrahedron',
        create3D: () => {
            const geo = new THREE.TetrahedronGeometry(1.8, 0);
            const edges = new THREE.EdgesGeometry(geo);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.userData = { vel: new THREE.Vector3(0.015, 0.012, 0.01), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat9',
        name: 'Dodecahedron',
        create3D: () => {
            const geo = new THREE.DodecahedronGeometry(1.3, 0);
            const edges = new THREE.EdgesGeometry(geo);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.userData = { vel: new THREE.Vector3(0.01, 0.016, 0.013), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat10',
        name: 'Icosahedron',
        create3D: () => {
            const geo = new THREE.IcosahedronGeometry(1.4, 0);
            const edges = new THREE.EdgesGeometry(geo);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.userData = { vel: new THREE.Vector3(0.014, 0.01, 0.011), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat11',
        name: 'TorusKnot',
        create3D: () => {
            const geo = new THREE.TorusKnotGeometry(0.8, 0.3, 64, 8);
            const edges = new THREE.EdgesGeometry(geo, 15);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.userData = { vel: new THREE.Vector3(0.01, 0.013, 0.015), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat12',
        name: 'Ring',
        create3D: () => {
            const geo = new THREE.RingGeometry(0.8, 1.5, 16);
            const edges = new THREE.EdgesGeometry(geo);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.userData = { vel: new THREE.Vector3(0.012, 0.01, 0.014), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat13',
        name: 'Capsule',
        create3D: () => {
            const geo = new THREE.CapsuleGeometry(0.6, 1.5, 8, 16);
            const edges = new THREE.EdgesGeometry(geo, 15);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.userData = { vel: new THREE.Vector3(0.016, 0.01, 0.012), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat14',
        name: 'Prism',
        create3D: () => {
            const geo = new THREE.CylinderGeometry(1.2, 1.2, 2, 6, 1);
            const edges = new THREE.EdgesGeometry(geo);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.userData = { vel: new THREE.Vector3(0.01, 0.015, 0.013), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat15',
        name: 'Plane',
        create3D: () => {
            const geo = new THREE.PlaneGeometry(2.5, 2.5, 1, 1);
            const edges = new THREE.EdgesGeometry(geo);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.userData = { vel: new THREE.Vector3(0.013, 0.01, 0.017), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat16',
        name: 'Thin Torus',
        create3D: () => {
            const geo = new THREE.TorusGeometry(1.5, 0.2, 16, 32);
            const edges = new THREE.EdgesGeometry(geo, 15);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.userData = { vel: new THREE.Vector3(0.01, 0.018, 0.011), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat17',
        name: 'Wide Box',
        create3D: () => {
            const geo = new THREE.BoxGeometry(3, 0.5, 1.5);
            const edges = new THREE.EdgesGeometry(geo);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.userData = { vel: new THREE.Vector3(0.014, 0.01, 0.012), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat18',
        name: 'Tall Cone',
        create3D: () => {
            const geo = new THREE.ConeGeometry(0.8, 3.5, 8);
            const edges = new THREE.EdgesGeometry(geo);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.userData = { vel: new THREE.Vector3(0.01, 0.012, 0.016), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat19',
        name: 'Small Sphere',
        create3D: () => {
            const geo = new THREE.SphereGeometry(1, 12, 12);
            const edges = new THREE.EdgesGeometry(geo);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.userData = { vel: new THREE.Vector3(0.017, 0.01, 0.014), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat20',
        name: 'Double Torus',
        create3D: () => {
            const group = new THREE.Group();
            const geo1 = new THREE.TorusGeometry(1, 0.3, 16, 32);
            const edges1 = new THREE.EdgesGeometry(geo1, 15);
            const mesh1 = new THREE.LineSegments(edges1, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh1.userData.originalGeo = geo1;

            const geo2 = new THREE.TorusGeometry(1, 0.3, 16, 32);
            const edges2 = new THREE.EdgesGeometry(geo2, 15);
            const mesh2 = new THREE.LineSegments(edges2, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh2.rotation.x = Math.PI / 2;
            mesh2.userData.originalGeo = geo2;

            group.add(mesh1);
            group.add(mesh2);
            group.userData = { vel: new THREE.Vector3(0.01, 0.014, 0.012) };
            return group;
        }
    },
    {
        id: 'mat21',
        name: 'Star',
        create3D: () => {
            const geo = new THREE.OctahedronGeometry(1.8);
            const edges = new THREE.EdgesGeometry(geo);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.rotation.x = Math.PI / 4;
            mesh.userData = { vel: new THREE.Vector3(0.015, 0.01, 0.013), originalGeo: geo };
            return mesh;
        }
    },
    {
        id: 'mat22',
        name: 'Cross',
        create3D: () => {
            const group = new THREE.Group();
            const geo = new THREE.BoxGeometry(0.4, 2.5, 0.4);

            const edges1 = new THREE.EdgesGeometry(geo);
            const mesh1 = new THREE.LineSegments(edges1, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh1.userData.originalGeo = geo;

            const edges2 = new THREE.EdgesGeometry(geo);
            const mesh2 = new THREE.LineSegments(edges2, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh2.rotation.z = Math.PI / 2;
            mesh2.userData.originalGeo = geo;

            const edges3 = new THREE.EdgesGeometry(geo);
            const mesh3 = new THREE.LineSegments(edges3, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh3.rotation.x = Math.PI / 2;
            mesh3.userData.originalGeo = geo;

            group.add(mesh1);
            group.add(mesh2);
            group.add(mesh3);
            group.userData = { vel: new THREE.Vector3(0.01, 0.013, 0.015) };
            return group;
        }
    },
    {
        id: 'mat23',
        name: 'Diamond',
        create3D: () => {
            const geo = new THREE.OctahedronGeometry(1.6);
            const edges = new THREE.EdgesGeometry(geo);
            const mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            mesh.scale.y = 1.5;
            mesh.userData = { vel: new THREE.Vector3(0.012, 0.01, 0.016), originalGeo: geo };
            return mesh;
        }
    }
];

// ===========================
// STATE MANAGEMENT
// ===========================
let scene, camera, renderer;
let audioContext, analyser;
let objectInstances = []; // 全オブジェクトインスタンス [{id, materialIndex, position, rotation, scale, wireframe}]
let nextInstanceId = 0;
let selectedInstance = null; // 現在選択中のインスタンス
let selectedInstances = []; // 複数選択されたインスタンス
let currentMeshes = [];
let isSelecting = false; // ドラッグ選択中かどうか
let selectionStart = { x: 0, y: 0 }; // 選択開始位置
let selectionBox = null; // 選択範囲を表示するDOM要素
let mandalaMode = false;
let symmetryCount = 8;
let sizeMultiplier = 1;
let speedMultiplier = 1;
let spreadMultiplier = 1; // オブジェクト間の距離
let spacingMultiplier = 10;
let isPlaying = false;
let animationId = null;
let dragControls = null;

// Auto-generation state
let autoGenerateMode = false;
let lastBeatTime = 0;
let estimatedBPM = 120; // デフォルトBPM
let beatInterval = 60000 / 120; // ミリ秒単位
let autoGenerateTimer = null;
let maxObjects = 5; // オブジェクトの最大数（1-10、デフォルト5）
let autoGenerateSpeedMultiplier = 4; // オート生成スピード倍率（1-8、デフォルト4）
let beatHistory = []; // ビート間隔の履歴
let peakHistory = []; // ピーク値の履歴
let customMaterials = []; // ユーザーがアップロードした画像
let selectedTransition = 'random'; // 選択されたトランジション

// Frequency-based spawning
let frequencySpawnMode = false;

// Color palette
let savedColors = [];
let lastSpawnTime = { low: 0, mid: 0, high: 0 };
let spawnCooldown = 150; // ミリ秒

// Color
let objectColor = { r: 0, g: 0, b: 0 }; // RGB values 0-255

// Canvas text
let canvasTextSprite = null;
let canvasTextValue = '';

// Audio sources
let uploadedAudioElement = null;
let uploadedAudioSource = null;
let microphoneStream = null;
let microphoneSource = null;
let currentAudioSource = null; // 'file' or 'microphone'

// Click detection for double-click
let clickCounts = new Map();
let clickTimers = new Map();

// ===========================
// INITIALIZATION
// ===========================
function init() {
    initThreeJS();
    initUI();
    initAudioContext();
    loadCustomMaterials();
    createPresetGrid();
    updateScene();
    animate();
}

function loadCustomMaterials() {
    const saved = localStorage.getItem('customMaterials');
    if (saved) {
        try {
            customMaterials = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load custom materials:', e);
            customMaterials = [];
        }
    }
}

function saveCustomMaterials() {
    localStorage.setItem('customMaterials', JSON.stringify(customMaterials));
}

function initThreeJS() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // ライティングを追加 - より立体的に見えるように改善
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // メインライト（上から斜め）
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight1.position.set(10, 10, 5);
    scene.add(directionalLight1);

    // フィルライト（下から）
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, -10, -5);
    scene.add(directionalLight2);

    // リムライト（後ろから）
    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight3.position.set(0, 0, -10);
    scene.add(directionalLight3);

    // Camera - 4K aspect ratio (16:9)
    const container = document.getElementById('canvasContainer');
    const aspect = 16 / 9;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.z = 15;

    // Renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    const width = Math.min(container.clientWidth, container.clientHeight * aspect);
    const height = width / aspect;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    const container = document.getElementById('canvasContainer');
    const aspect = 16 / 9;
    const width = Math.min(container.clientWidth, container.clientHeight * aspect);
    const height = width / aspect;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function initAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.connect(audioContext.destination);

    // Create audio indicator bars
    const indicatorBars = document.getElementById('indicatorBars');
    indicatorBars.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        indicatorBars.appendChild(bar);
    }
}

// ===========================
// AUDIO SYNTHESIS
// ===========================
// Audio source management
async function startMicrophone() {
    try {
        // Stop any current audio (but don't reset isPlaying yet)
        stopMicrophone();
        if (uploadedAudioElement) {
            uploadedAudioElement.pause();
            uploadedAudioElement.currentTime = 0;
        }

        // Request microphone access
        microphoneStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        // Get audio device information
        let deviceLabel = 'Live Audio';
        try {
            const audioTrack = microphoneStream.getAudioTracks()[0];
            if (audioTrack && audioTrack.label) {
                deviceLabel = audioTrack.label;
            }
        } catch (e) {
            console.log('Could not get device label:', e);
        }

        // Connect microphone to analyser
        microphoneSource = audioContext.createMediaStreamSource(microphoneStream);
        microphoneSource.connect(analyser);

        currentAudioSource = 'microphone';
        isPlaying = true; // マイク入力中は常にtrue

        // Update UI with device information
        document.getElementById('trackTitle').textContent = '🎧 Audio Input';
        document.getElementById('trackArtist').textContent = deviceLabel;

        return true;
    } catch (error) {
        console.error('マイクへのアクセスに失敗:', error);
        alert('マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。');
        return false;
    }
}

function stopMicrophone() {
    if (microphoneSource) {
        microphoneSource.disconnect();
        microphoneSource = null;
    }

    if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
        microphoneStream = null;
    }
}

function stopAllAudio() {
    // Stop microphone
    stopMicrophone();

    // Stop uploaded audio
    if (uploadedAudioElement) {
        uploadedAudioElement.pause();
        uploadedAudioElement.currentTime = 0;
    }

    currentAudioSource = null;
    isPlaying = false;

    // オートジェネレートが有効な場合は停止
    if (autoGenerateMode) {
        stopAutoGeneration();
    }
}

// ===========================
// SCENE MANAGEMENT
// ===========================
function updateScene() {
    // Clear existing meshes
    currentMeshes.forEach(mesh => scene.remove(mesh));
    currentMeshes = [];

    if (mandalaMode) {
        // Mandala mode: 対称的に配置（ミラー効果）
        objectInstances.forEach((instance) => {
            let mesh;

            // メディアインスタンスの場合は1つだけ中央に配置
            if (instance.mediaData) {
                const mediaData = instance.mediaData;

                // カメラの視野角からキャンバスサイズを計算
                const distance = camera.position.z;
                const vFov = camera.fov * Math.PI / 180;
                const canvasHeight = 2 * Math.tan(vFov / 2) * distance;
                const canvasWidth = canvasHeight * camera.aspect;

                // アスペクト比を考慮したサイズを計算
                const aspectRatio = mediaData.aspectRatio || 1;
                let width, height;

                if (aspectRatio > camera.aspect) {
                    width = canvasWidth * 0.9;
                    height = width / aspectRatio;
                } else {
                    height = canvasHeight * 0.9;
                    width = height * aspectRatio;
                }

                const geometry = new THREE.PlaneGeometry(width, height);
                let texture;

                // テクスチャをキャッシュ（初回のみ作成）
                if (!instance.cachedTexture) {
                    if (mediaData.type === 'image') {
                        texture = new THREE.TextureLoader().load(mediaData.url);
                        texture.colorSpace = THREE.SRGBColorSpace;
                    } else if (mediaData.type === 'video') {
                        if (!instance.videoElement) {
                            const video = document.createElement('video');
                            video.src = mediaData.url;
                            video.loop = true;
                            video.muted = true;
                            video.play();
                            instance.videoElement = video;
                        }
                        texture = new THREE.VideoTexture(instance.videoElement);
                        texture.colorSpace = THREE.SRGBColorSpace;
                    }
                    instance.cachedTexture = texture;
                } else {
                    texture = instance.cachedTexture;
                }

                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true,
                    color: 0xffffff,
                    opacity: 1
                });

                mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(0, 0, -5);  // 中央の最背面に配置
                mesh.userData.vel = new THREE.Vector3(0.01, 0.01, 0.01);
                mesh.userData.isMedia = true;
                mesh.userData.instanceId = instance.id;
                mesh.renderOrder = -1;

                scene.add(mesh);
                currentMeshes.push(mesh);
                return;  // メディアは対称配置しない
            }

            // マテリアルインデックスがMATERIALS配列内か確認
            if (instance.materialIndex >= MATERIALS.length) return;

            const material = MATERIALS[instance.materialIndex];
            if (!material || !material.create3D) return;

            // 各対称軸に対してオブジェクトを配置
            for (let i = 0; i < symmetryCount; i++) {
                const angle = (i / symmetryCount) * Math.PI * 2;
                mesh = material.create3D();
                mesh.renderOrder = 1;  // 前面に描画

                // インスタンスの位置を極座標で回転してspreadを適用
                const r = Math.sqrt(instance.position.x * instance.position.x + instance.position.y * instance.position.y);
                const theta = Math.atan2(instance.position.y, instance.position.x);
                const rotatedAngle = theta + angle;

                const x = Math.cos(rotatedAngle) * r * spreadMultiplier;
                const y = Math.sin(rotatedAngle) * r * spreadMultiplier;

                mesh.position.set(x, y, instance.position.z * spreadMultiplier);
                mesh.rotation.set(
                    instance.rotation.x,
                    instance.rotation.y,
                    instance.rotation.z + angle
                );
                mesh.scale.multiplyScalar(sizeMultiplier * instance.scale);

                // ソリッド表示の場合は変換
                if (!instance.wireframe) {
                    const solidMesh = convertToSolid(mesh);
                    solidMesh.position.set(x, y, instance.position.z * spreadMultiplier);
                    solidMesh.rotation.set(
                        instance.rotation.x,
                        instance.rotation.y,
                        instance.rotation.z + angle
                    );
                    solidMesh.scale.multiplyScalar(sizeMultiplier * instance.scale);
                    solidMesh.userData.instanceId = instance.id;
                    solidMesh.userData.materialIndex = instance.materialIndex;
                    solidMesh.userData.vel = mesh.userData.vel;
                    mesh = solidMesh;
                } else {
                    mesh.userData.instanceId = instance.id;
                    mesh.userData.materialIndex = instance.materialIndex;
                }

                // 固定状態を記録
                if (instance.pinned) {
                    mesh.userData.pinned = true;
                }

                scene.add(mesh);
                currentMeshes.push(mesh);
            }
        });
    } else {
        // Normal mode: インスタンスベースの配置
        objectInstances.forEach((instance) => {
            let mesh;

            // メディアインスタンスの場合
            if (instance.mediaData) {
                const mediaData = instance.mediaData;

                // カメラの視野角からキャンバスサイズを計算
                const distance = camera.position.z;
                const vFov = camera.fov * Math.PI / 180;
                const canvasHeight = 2 * Math.tan(vFov / 2) * distance;
                const canvasWidth = canvasHeight * camera.aspect;

                // アスペクト比を考慮したサイズを計算（キャンバスに収まる最大サイズ）
                const aspectRatio = mediaData.aspectRatio || 1;
                let width, height;

                if (aspectRatio > camera.aspect) {
                    // 横長の画像：幅をキャンバス幅に合わせる
                    width = canvasWidth * 0.9;
                    height = width / aspectRatio;
                } else {
                    // 縦長の画像：高さをキャンバス高さに合わせる
                    height = canvasHeight * 0.9;
                    width = height * aspectRatio;
                }

                const geometry = new THREE.PlaneGeometry(width, height);
                let texture;

                // テクスチャをキャッシュ（初回のみ作成）
                if (!instance.cachedTexture) {
                    if (mediaData.type === 'image') {
                        texture = new THREE.TextureLoader().load(mediaData.url);
                        texture.colorSpace = THREE.SRGBColorSpace;
                    } else if (mediaData.type === 'video') {
                        if (!instance.videoElement) {
                            const video = document.createElement('video');
                            video.src = mediaData.url;
                            video.loop = true;
                            video.muted = true;
                            video.play();
                            instance.videoElement = video;
                        }
                        texture = new THREE.VideoTexture(instance.videoElement);
                        texture.colorSpace = THREE.SRGBColorSpace;
                    }
                    instance.cachedTexture = texture;
                } else {
                    texture = instance.cachedTexture;
                }

                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true,
                    color: 0xffffff,
                    opacity: 1
                });

                mesh = new THREE.Mesh(geometry, material);
                mesh.userData.vel = new THREE.Vector3(0.01, 0.01, 0.01);
                mesh.userData.isMedia = true;  // メディアフラグを設定
                mesh.renderOrder = -1;  // 最背面に描画
            }
            // 通常のマテリアルインスタンスの場合
            else {
                // マテリアルインデックスがMATERIALS配列内か確認
                if (instance.materialIndex >= MATERIALS.length) return;

                const material = MATERIALS[instance.materialIndex];
                if (!material || !material.create3D) return;

                mesh = material.create3D();
                mesh.renderOrder = 1;  // 前面に描画
            }

            mesh.position.set(
                instance.position.x * spreadMultiplier,
                instance.position.y * spreadMultiplier,
                instance.position.z * spreadMultiplier - (instance.mediaData ? 5 : 0)  // メディアは後ろに配置
            );
            mesh.rotation.set(instance.rotation.x, instance.rotation.y, instance.rotation.z);
            mesh.scale.multiplyScalar(sizeMultiplier * instance.scale);

            // ソリッド表示の場合は変換
            if (!instance.wireframe) {
                const solidMesh = convertToSolid(mesh);
                solidMesh.position.set(
                    instance.position.x * spreadMultiplier,
                    instance.position.y * spreadMultiplier,
                    instance.position.z * spreadMultiplier
                );
                solidMesh.rotation.set(instance.rotation.x, instance.rotation.y, instance.rotation.z);
                solidMesh.scale.multiplyScalar(sizeMultiplier * instance.scale);
                solidMesh.userData.instanceId = instance.id;
                solidMesh.userData.materialIndex = instance.materialIndex;
                solidMesh.userData.vel = mesh.userData.vel;
                mesh = solidMesh;
            } else {
                mesh.userData.instanceId = instance.id;
                mesh.userData.materialIndex = instance.materialIndex;
            }

            // 選択状態の表示
            if (selectedInstance && selectedInstance.id === instance.id) {
                mesh.userData.selected = true;
            }

            // 固定状態を記録とピンマーク表示
            if (instance.pinned) {
                mesh.userData.pinned = true;

                // ピンマークを作成
                const canvas = document.createElement('canvas');
                canvas.width = 64;
                canvas.height = 64;
                const ctx = canvas.getContext('2d');
                ctx.font = '48px Arial';
                ctx.fillText('📌', 8, 48);

                const texture = new THREE.CanvasTexture(canvas);
                const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
                const sprite = new THREE.Sprite(spriteMaterial);
                sprite.scale.set(0.5, 0.5, 1);
                sprite.position.set(
                    instance.position.x * spreadMultiplier,
                    instance.position.y * spreadMultiplier + 2,
                    instance.position.z * spreadMultiplier
                );
                scene.add(sprite);
                currentMeshes.push(sprite);
            }

            scene.add(mesh);
            currentMeshes.push(mesh);
        });
    }

    // ドラッグコントロールを更新
    updateDragControls();
    updatePresetCounts();

    // 色を適用
    applyColorToMeshes();
}

// オブジェクトに色を適用
function applyColorToMeshes() {
    const globalColor = new THREE.Color(objectColor.r / 255, objectColor.g / 255, objectColor.b / 255);

    currentMeshes.forEach(mesh => {
        // メディアオブジェクトには色を適用しない
        if (mesh.userData.isMedia) {
            return;
        }

        if (mesh.material && mesh.material.color) {
            // インスタンスIDから個別の色を取得
            const instanceId = mesh.userData.instanceId;
            if (instanceId !== undefined) {
                const instance = objectInstances.find(inst => inst.id === instanceId);
                if (instance && instance.color) {
                    // 個別の色が設定されている場合
                    const instanceColor = new THREE.Color(
                        instance.color.r / 255,
                        instance.color.g / 255,
                        instance.color.b / 255
                    );
                    mesh.material.color.copy(instanceColor);
                } else {
                    // グローバルカラーを使用
                    mesh.material.color.copy(globalColor);
                }
            } else {
                // インスタンスIDがない場合はグローバルカラー
                mesh.material.color.copy(globalColor);
            }
        }
    });
}

// テキストスプライトを更新
function updateCanvasText(text) {
    // 既存のテキストスプライトを削除
    if (canvasTextSprite) {
        scene.remove(canvasTextSprite);
        if (canvasTextSprite.material.map) {
            canvasTextSprite.material.map.dispose();
        }
        canvasTextSprite.material.dispose();
        canvasTextSprite = null;
    }

    canvasTextValue = text;

    // テキストが空の場合は何もしない
    if (!text || text.trim() === '') {
        return;
    }

    // Canvasでテキストを描画
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // キャンバスサイズを設定（高解像度）
    canvas.width = 1024;
    canvas.height = 256;

    // テキストスタイル
    context.fillStyle = '#000000';
    context.font = 'bold 80px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // テキストを描画
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // テクスチャを作成
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // スプライトマテリアルを作成
    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
    });

    // スプライトを作成（ビルボード効果で常にカメラを向く）
    canvasTextSprite = new THREE.Sprite(spriteMaterial);
    canvasTextSprite.scale.set(10, 2.5, 1); // スケール調整
    canvasTextSprite.position.set(0, -8, 0); // 画面下部に配置

    scene.add(canvasTextSprite);
}

function addInstance(materialIndex) {
    const range = spacingMultiplier;
    let position;
    let attempts = 0;
    const maxAttempts = 50;
    const minDistance = 3; // 最小距離

    // 重ならない位置を探す
    do {
        position = {
            x: (Math.random() - 0.5) * range,
            y: (Math.random() - 0.5) * range,
            z: (Math.random() - 0.5) * (range / 2)
        };
        attempts++;

        // 他のオブジェクトとの距離をチェック
        const tooClose = objectInstances.some(inst => {
            const dx = inst.position.x - position.x;
            const dy = inst.position.y - position.y;
            const dz = inst.position.z - position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            return distance < minDistance;
        });

        if (!tooClose || attempts >= maxAttempts) {
            break;
        }
    } while (true);

    const instance = {
        id: nextInstanceId++,
        materialIndex: materialIndex,
        position: position,
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
        wireframe: true,  // 初期状態をワイヤーフレーム表示に変更
        pinned: false,    // 固定状態
        color: null       // 個別の色（nullの場合はグローバル色を使用）
    };

    objectInstances.push(instance);
    updateScene();
    return instance;
}

function removeInstance(instanceId, immediate = false) {
    console.log('removeInstance called with id:', instanceId);
    const index = objectInstances.findIndex(inst => inst.id === instanceId);
    console.log('Found at index:', index, 'Total instances:', objectInstances.length);
    if (index > -1) {
        objectInstances.splice(index, 1);
        if (selectedInstance && selectedInstance.id === instanceId) {
            selectedInstance = null;
        }
        updateScene();
        console.log('Instance removed. Remaining instances:', objectInstances.length);
    } else {
        console.error('Instance not found:', instanceId);
    }
}

function duplicateInstance(instanceId) {
    const original = objectInstances.find(inst => inst.id === instanceId);
    if (!original) return;

    // オフセット値（少しずらす）
    const offset = 2;

    const duplicate = {
        id: nextInstanceId++,
        materialIndex: original.materialIndex,
        position: {
            x: original.position.x + offset,
            y: original.position.y + offset,
            z: original.position.z
        },
        rotation: { ...original.rotation },
        scale: original.scale,
        wireframe: original.wireframe,
        pinned: false,
        color: original.color ? { ...original.color } : null
    };

    objectInstances.push(duplicate);
    updateScene();
    return duplicate;
}

function saveAsPreset(instances) {
    if (!instances || instances.length === 0) return;

    const presetName = prompt('プリセット名を入力してください:', `Custom ${customMaterials.length + 1}`);
    if (!presetName) return;

    // 選択されたオブジェクトの情報を保存
    const presetData = {
        name: presetName,
        instances: instances.map(inst => ({
            materialIndex: inst.materialIndex,
            position: { ...inst.position },
            rotation: { ...inst.rotation },
            scale: inst.scale,
            wireframe: inst.wireframe,
            color: inst.color ? { ...inst.color } : null
        })),
        timestamp: Date.now()
    };

    // カスタムマテリアルとして保存
    customMaterials.push(presetData);
    saveCustomMaterials();

    // プリセットグリッドを更新
    createPresetGrid();

    console.log('Preset saved:', presetName);
    alert(`プリセット「${presetName}」を保存しました`);
}

function loadPreset(preset) {
    if (!preset || !preset.instances) return;

    console.log('Loading preset:', preset.name);

    // プリセットのインスタンスを追加
    preset.instances.forEach(instData => {
        const instance = {
            id: nextInstanceId++,
            materialIndex: instData.materialIndex,
            position: { ...instData.position },
            rotation: { ...instData.rotation },
            scale: instData.scale,
            wireframe: instData.wireframe,
            pinned: false,
            color: instData.color ? { ...instData.color } : null
        };

        // MAX OBJECTSに達している場合は古いオブジェクトを削除
        if (objectInstances.length >= maxObjects) {
            removeInstance(objectInstances[0].id, true);
        }

        objectInstances.push(instance);
    });

    updateScene();
    console.log('Preset loaded:', preset.name);
}

function addMediaInstance(mediaData) {
    // メディアマテリアルを動的に作成して追加
    const mediaIndex = MATERIALS.length + customMaterials.findIndex(m => m.id === mediaData.id);

    // キャンバス中央に配置
    const position = {
        x: 0,
        y: 0,
        z: 0
    };

    // トランジション効果を選択
    let transition;
    if (selectedTransition === 'random') {
        const transitions = ['fadeIn', 'scaleIn', 'slideIn', 'rotateIn'];
        transition = transitions[Math.floor(Math.random() * transitions.length)];
    } else {
        transition = selectedTransition;
    }

    const instance = {
        id: nextInstanceId++,
        mediaData: mediaData,  // メディアデータを保持
        position: position,
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
        wireframe: false,
        pinned: false,
        color: null,
        transition: transition,  // トランジション効果
        transitionProgress: 0  // トランジション進行度 (0-1)
    };

    // MAX OBJECTSに達している場合は古いオブジェクトを削除
    if (objectInstances.length >= maxObjects) {
        removeInstance(objectInstances[0].id, true);
    }

    objectInstances.push(instance);
    updateScene();
}

// Color palette functions
function loadColorPalette() {
    const saved = localStorage.getItem('colorPalette');
    if (saved) {
        try {
            savedColors = JSON.parse(saved);
            renderColorPalette();
        } catch (e) {
            console.error('Failed to load color palette:', e);
            savedColors = [];
        }
    }
}

function saveColorPalette() {
    localStorage.setItem('colorPalette', JSON.stringify(savedColors));
}

function renderColorPalette() {
    const palette = document.getElementById('colorPalette');
    if (!palette) return;

    palette.innerHTML = '';

    savedColors.forEach((color, index) => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.background = `rgb(${color.r}, ${color.g}, ${color.b})`;
        swatch.title = `RGB(${color.r}, ${color.g}, ${color.b})`;

        // クリックで色を適用
        swatch.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-color')) return;

            objectColor.r = color.r;
            objectColor.g = color.g;
            objectColor.b = color.b;

            document.getElementById('colorR').value = color.r;
            document.getElementById('colorG').value = color.g;
            document.getElementById('colorB').value = color.b;
            document.getElementById('colorRValue').textContent = color.r;
            document.getElementById('colorGValue').textContent = color.g;
            document.getElementById('colorBValue').textContent = color.b;

            updateScene();
        });

        // 削除ボタン
        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'delete-color';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            savedColors.splice(index, 1);
            saveColorPalette();
            renderColorPalette();
        });

        swatch.appendChild(deleteBtn);
        palette.appendChild(swatch);
    });
}

function updatePresetCounts() {
    const counts = {};
    objectInstances.forEach(inst => {
        counts[inst.materialIndex] = (counts[inst.materialIndex] || 0) + 1;
    });

    document.querySelectorAll('.preset-item').forEach((item, index) => {
        const badge = item.querySelector('.count-badge');
        const count = counts[index] || 0;

        if (count > 0) {
            if (!badge) {
                const newBadge = document.createElement('div');
                newBadge.className = 'count-badge';
                newBadge.textContent = count;
                item.appendChild(newBadge);
            } else {
                badge.textContent = count;
            }
        } else {
            if (badge) {
                badge.remove();
            }
        }
    });
}

// Auto-generation functions
function detectBPM() {
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // 低周波（ベース/キック）の平均を計算
    const bassRange = Math.floor(bufferLength * 0.15);
    let bassSum = 0;
    for (let i = 0; i < bassRange; i++) {
        bassSum += dataArray[i];
    }
    const bassAverage = bassSum / bassRange;

    // ピーク履歴を更新（最大100フレーム分保持）
    peakHistory.push(bassAverage);
    if (peakHistory.length > 100) {
        peakHistory.shift();
    }

    // 動的閾値を計算（平均 + 標準偏差）
    const avg = peakHistory.reduce((a, b) => a + b, 0) / peakHistory.length;
    const variance = peakHistory.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / peakHistory.length;
    const stdDev = Math.sqrt(variance);
    const threshold = avg + stdDev * 1.5;

    const currentTime = Date.now();

    // ビート検出
    if (bassAverage > threshold && bassAverage > 150 && currentTime - lastBeatTime > 250) {
        const timeSinceLastBeat = currentTime - lastBeatTime;

        if (lastBeatTime > 0 && timeSinceLastBeat >= 300 && timeSinceLastBeat <= 2000) {
            // ビート間隔を履歴に追加（最大8ビート分）
            beatHistory.push(timeSinceLastBeat);
            if (beatHistory.length > 8) {
                beatHistory.shift();
            }

            // BPMを計算（中央値を使用して外れ値を除外）
            if (beatHistory.length >= 4) {
                const sorted = [...beatHistory].sort((a, b) => a - b);
                const median = sorted[Math.floor(sorted.length / 2)];
                const detectedBPM = 60000 / median;

                // BPM範囲を60-180に制限（妥当な範囲）
                if (detectedBPM >= 60 && detectedBPM <= 180) {
                    // スムーシングを適用
                    estimatedBPM = estimatedBPM * 0.85 + detectedBPM * 0.15;
                    beatInterval = 60000 / estimatedBPM;

                    // コントロールパネルのBPM表示を更新
                    const bpmDisplay = document.getElementById('bpmDisplay');
                    if (bpmDisplay) {
                        bpmDisplay.textContent = Math.round(estimatedBPM);
                    }

                    // サイドメニューのBPM表示も更新
                    const bpmValue = document.getElementById('bpmValue');
                    if (bpmValue) {
                        bpmValue.textContent = Math.round(estimatedBPM);
                    }
                }
            }
        }
        lastBeatTime = currentTime;
    }
}

function startAutoGeneration() {
    if (autoGenerateTimer) {
        clearInterval(autoGenerateTimer);
    }

    autoGenerateTimer = setInterval(() => {
        if (autoGenerateMode && isPlaying) {
            // メディアインスタンス以外の数をカウント
            const nonMediaCount = objectInstances.filter(inst => !inst.mediaData).length;
            if (nonMediaCount >= maxObjects) {
                // メディア以外の最も古いインスタンスを削除
                const oldestNonMedia = objectInstances.find(inst => !inst.mediaData);
                if (oldestNonMedia) removeInstance(oldestNonMedia.id);
            }

            // ランダムなマテリアルを選択して追加
            const randomMaterialIndex = Math.floor(Math.random() * MATERIALS.length);
            addInstance(randomMaterialIndex);
        }
    }, beatInterval / autoGenerateSpeedMultiplier); // スピード倍率を適用（割り算に修正）
}

function stopAutoGeneration() {
    if (autoGenerateTimer) {
        clearInterval(autoGenerateTimer);
        autoGenerateTimer = null;
    }
}

// Frequency-based object spawning
function spawnObjectsByFrequency(dataArray) {
    const now = Date.now();
    const bufferLength = dataArray.length;

    // 周波数帯域を分割
    const lowEnd = Math.floor(bufferLength * 0.15);    // 低音域 (0-15%)
    const midEnd = Math.floor(bufferLength * 0.5);     // 中音域 (15-50%)
    // 高音域 (50-100%)

    // 各帯域の平均値を計算
    let lowAvg = 0, midAvg = 0, highAvg = 0;

    for (let i = 0; i < lowEnd; i++) lowAvg += dataArray[i];
    lowAvg /= lowEnd;

    for (let i = lowEnd; i < midEnd; i++) midAvg += dataArray[i];
    midAvg /= (midEnd - lowEnd);

    for (let i = midEnd; i < bufferLength; i++) highAvg += dataArray[i];
    highAvg /= (bufferLength - midEnd);

    // 閾値（感度）
    const threshold = 200;

    // 低音域でオブジェクト発散
    if (lowAvg > threshold && now - lastSpawnTime.low > spawnCooldown) {
        // メディアインスタンス以外の数をカウント
        const nonMediaCount = objectInstances.filter(inst => !inst.mediaData).length;
        if (nonMediaCount >= maxObjects) {
            // メディア以外の最も古いインスタンスを削除
            const oldestNonMedia = objectInstances.find(inst => !inst.mediaData);
            if (oldestNonMedia) removeInstance(oldestNonMedia.id, true);
        }
        // 低音域用: 0-7番目のマテリアル
        const materialIndex = Math.floor(Math.random() * 8);
        addInstance(materialIndex);
        lastSpawnTime.low = now;
    }

    // 中音域でオブジェクト発散
    if (midAvg > threshold && now - lastSpawnTime.mid > spawnCooldown) {
        const nonMediaCount = objectInstances.filter(inst => !inst.mediaData).length;
        if (nonMediaCount >= maxObjects) {
            const oldestNonMedia = objectInstances.find(inst => !inst.mediaData);
            if (oldestNonMedia) removeInstance(oldestNonMedia.id, true);
        }
        // 中音域用: 8-15番目のマテリアル
        const materialIndex = 8 + Math.floor(Math.random() * 8);
        addInstance(materialIndex);
        lastSpawnTime.mid = now;
    }

    // 高音域でオブジェクト発散
    if (highAvg > threshold && now - lastSpawnTime.high > spawnCooldown) {
        const nonMediaCount = objectInstances.filter(inst => !inst.mediaData).length;
        if (nonMediaCount >= maxObjects) {
            const oldestNonMedia = objectInstances.find(inst => !inst.mediaData);
            if (oldestNonMedia) removeInstance(oldestNonMedia.id, true);
        }
        // 高音域用: 16-22番目のマテリアル
        const materialIndex = 16 + Math.floor(Math.random() * Math.min(7, MATERIALS.length - 16));
        addInstance(materialIndex);
        lastSpawnTime.high = now;
    }
}

// Audio metadata extraction
async function extractMetadata(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(e) {
            const buffer = e.target.result;
            const view = new DataView(buffer);

            try {
                // ID3v2タグを探す
                if (view.byteLength >= 10) {
                    const id3Header = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2));

                    if (id3Header === 'ID3') {
                        const metadata = parseID3v2(view);
                        resolve(metadata);
                        return;
                    }
                }

                // ID3v1タグを探す（ファイル末尾）
                if (view.byteLength >= 128) {
                    const tagStart = view.byteLength - 128;
                    const tagHeader = String.fromCharCode(
                        view.getUint8(tagStart),
                        view.getUint8(tagStart + 1),
                        view.getUint8(tagStart + 2)
                    );

                    if (tagHeader === 'TAG') {
                        const metadata = parseID3v1(view, tagStart);
                        resolve(metadata);
                        return;
                    }
                }

                // メタデータが見つからない場合
                resolve({ title: null, artist: null });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = reject;
        reader.readAsArrayBuffer(file.slice(0, Math.min(file.size, 1024 * 1024))); // 最大1MB読み込み
    });
}

function parseID3v2(view) {
    const metadata = { title: null, artist: null };

    try {
        // ID3v2ヘッダーのサイズを取得
        const size = ((view.getUint8(6) & 0x7f) << 21) |
                     ((view.getUint8(7) & 0x7f) << 14) |
                     ((view.getUint8(8) & 0x7f) << 7) |
                     (view.getUint8(9) & 0x7f);

        let offset = 10;
        const endOffset = Math.min(10 + size, view.byteLength);

        // フレームを読み取る
        while (offset < endOffset - 10) {
            const frameId = String.fromCharCode(
                view.getUint8(offset),
                view.getUint8(offset + 1),
                view.getUint8(offset + 2),
                view.getUint8(offset + 3)
            );

            if (frameId === '\0\0\0\0') break;

            const frameSize = view.getUint32(offset + 4, false);
            const frameDataOffset = offset + 10;

            if (frameId === 'TIT2') { // タイトル
                metadata.title = extractTextFrame(view, frameDataOffset, frameSize);
            } else if (frameId === 'TPE1') { // アーティスト
                metadata.artist = extractTextFrame(view, frameDataOffset, frameSize);
            }

            offset += 10 + frameSize;
        }
    } catch (error) {
        console.error('ID3v2パース エラー:', error);
    }

    return metadata;
}

function parseID3v1(view, offset) {
    const metadata = { title: null, artist: null };

    try {
        // タイトル（30バイト）
        let title = '';
        for (let i = 0; i < 30; i++) {
            const char = view.getUint8(offset + 3 + i);
            if (char === 0) break;
            title += String.fromCharCode(char);
        }
        metadata.title = title.trim() || null;

        // アーティスト（30バイト）
        let artist = '';
        for (let i = 0; i < 30; i++) {
            const char = view.getUint8(offset + 33 + i);
            if (char === 0) break;
            artist += String.fromCharCode(char);
        }
        metadata.artist = artist.trim() || null;
    } catch (error) {
        console.error('ID3v1パース エラー:', error);
    }

    return metadata;
}

function extractTextFrame(view, offset, size) {
    try {
        // エンコーディングを取得
        const encoding = view.getUint8(offset);
        let text = '';

        // ISO-8859-1またはUTF-8として読み取る
        for (let i = 1; i < size; i++) {
            const char = view.getUint8(offset + i);
            if (char === 0) break;
            text += String.fromCharCode(char);
        }

        return text.trim() || null;
    } catch (error) {
        return null;
    }
}

// Layer management functions
function togglePin(instanceId) {
    const instance = objectInstances.find(inst => inst.id === instanceId);
    if (instance) {
        instance.pinned = !instance.pinned;

        // コンテキストメニューのテキストを更新
        const pinMenuItem = document.querySelector('.context-menu-item[data-action="pin"]');
        if (pinMenuItem) {
            pinMenuItem.textContent = instance.pinned ? '📍 固定解除' : '📌 固定';
        }

        updateScene();
    }
}

function moveForward(instanceId) {
    const index = objectInstances.findIndex(inst => inst.id === instanceId);
    if (index < objectInstances.length - 1) {
        [objectInstances[index], objectInstances[index + 1]] = [objectInstances[index + 1], objectInstances[index]];
        updateScene();
    }
}

function moveBackward(instanceId) {
    const index = objectInstances.findIndex(inst => inst.id === instanceId);
    if (index > 0) {
        [objectInstances[index], objectInstances[index - 1]] = [objectInstances[index - 1], objectInstances[index]];
        updateScene();
    }
}

function moveToFront(instanceId) {
    const index = objectInstances.findIndex(inst => inst.id === instanceId);
    if (index !== -1) {
        const instance = objectInstances.splice(index, 1)[0];
        objectInstances.push(instance);
        updateScene();
    }
}

function moveToBack(instanceId) {
    const index = objectInstances.findIndex(inst => inst.id === instanceId);
    if (index !== -1) {
        const instance = objectInstances.splice(index, 1)[0];
        objectInstances.unshift(instance);
        updateScene();
    }
}

// Color picker for individual instances
let colorPickerTargetId = null;

function openColorPicker(instanceId) {
    colorPickerTargetId = instanceId;
    const instance = objectInstances.find(inst => inst.id === instanceId);

    // Get current color (instance color or global color)
    const currentColor = instance && instance.color ? instance.color : objectColor;

    // Set sliders to current color
    const pickerR = document.getElementById('pickerR');
    const pickerG = document.getElementById('pickerG');
    const pickerB = document.getElementById('pickerB');
    const pickerRValue = document.getElementById('pickerRValue');
    const pickerGValue = document.getElementById('pickerGValue');
    const pickerBValue = document.getElementById('pickerBValue');

    pickerR.value = currentColor.r;
    pickerG.value = currentColor.g;
    pickerB.value = currentColor.b;
    pickerRValue.textContent = currentColor.r;
    pickerGValue.textContent = currentColor.g;
    pickerBValue.textContent = currentColor.b;

    // Update preview
    updateColorPreview();

    // Show modal
    const modal = document.getElementById('colorPickerModal');
    modal.style.display = 'flex';
}

function updateColorPreview() {
    const r = parseInt(document.getElementById('pickerR').value);
    const g = parseInt(document.getElementById('pickerG').value);
    const b = parseInt(document.getElementById('pickerB').value);

    const preview = document.getElementById('colorPreview');
    preview.style.background = `rgb(${r}, ${g}, ${b})`;
}

function applyColorPicker() {
    const r = parseInt(document.getElementById('pickerR').value);
    const g = parseInt(document.getElementById('pickerG').value);
    const b = parseInt(document.getElementById('pickerB').value);

    if (colorPickerTargetId !== null) {
        const instance = objectInstances.find(inst => inst.id === colorPickerTargetId);
        if (instance) {
            instance.color = { r, g, b };
            applyColorToMeshes();
        }
    }

    closeColorPicker();
}

function closeColorPicker() {
    const modal = document.getElementById('colorPickerModal');
    modal.style.display = 'none';
    colorPickerTargetId = null;
}

function updateDragControls() {
    // 既存のドラッグコントロールを削除
    if (dragControls) {
        dragControls.dispose();
    }

    // 新しいドラッグコントロールを作成
    if (currentMeshes.length > 0) {
        dragControls = new DragControls(currentMeshes, camera, renderer.domElement);

        dragControls.addEventListener('dragstart', function (event) {
            // インスタンスを選択
            const instanceId = event.object.userData.instanceId;
            const instance = objectInstances.find(inst => inst.id === instanceId);
            selectedInstance = instance;

            // 固定されているオブジェクトはドラッグ不可
            if (instance && instance.pinned) {
                event.object.userData.isDragging = false;
                dragControls.enabled = false;
                setTimeout(() => {
                    dragControls.enabled = true;
                }, 0);
                return;
            }

            event.object.userData.isDragging = true;
        });

        dragControls.addEventListener('drag', function (event) {
            // ドラッグ中にインスタンスの位置を更新
            const instanceId = event.object.userData.instanceId;
            const instance = objectInstances.find(inst => inst.id === instanceId);
            if (instance) {
                instance.position.x = event.object.position.x;
                instance.position.y = event.object.position.y;
                instance.position.z = event.object.position.z;
            }
        });

        dragControls.addEventListener('dragend', function (event) {
            event.object.userData.isDragging = false;
        });
    }
}

function convertToSolid(mesh) {
    // LineSegmentsの場合、元のジオメトリからMeshを作成して置き換える
    if (mesh instanceof THREE.LineSegments && mesh.userData.originalGeo) {
        const solidGeo = mesh.userData.originalGeo;
        const solidMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.4,
            metalness: 0.1,
            flatShading: false
        });
        const solidMesh = new THREE.Mesh(solidGeo, solidMat);

        // プロパティをコピー
        solidMesh.position.copy(mesh.position);
        solidMesh.rotation.copy(mesh.rotation);
        solidMesh.scale.copy(mesh.scale);
        solidMesh.userData = { ...mesh.userData };

        return solidMesh;
    }
    // Groupの場合、各子要素を置き換え
    else if (mesh instanceof THREE.Group) {
        const newGroup = new THREE.Group();
        newGroup.userData = { ...mesh.userData };

        mesh.children.forEach((child) => {
            if (child instanceof THREE.LineSegments && child.userData.originalGeo) {
                const originalGeo = child.userData.originalGeo;

                const solidMat = new THREE.MeshStandardMaterial({
                    color: 0x1a1a1a,
                    roughness: 0.4,
                    metalness: 0.1,
                    flatShading: false
                });
                const solidMesh = new THREE.Mesh(originalGeo.clone(), solidMat);
                solidMesh.position.copy(child.position);
                solidMesh.rotation.copy(child.rotation);
                solidMesh.scale.copy(child.scale);
                newGroup.add(solidMesh);
            }
        });

        return newGroup;
    }

    return mesh;
}

// ===========================
// ANIMATION
// ===========================
function animate() {
    animationId = requestAnimationFrame(animate);

    // トランジション効果を適用
    objectInstances.forEach((instance, index) => {
        if (instance.transition && instance.transitionProgress < 1) {
            instance.transitionProgress += 0.02; // トランジション速度
            if (instance.transitionProgress > 1) instance.transitionProgress = 1;

            const mesh = currentMeshes[index];
            if (mesh && mesh.userData.isMedia) {
                const progress = instance.transitionProgress;

                switch (instance.transition) {
                    case 'fadeIn':
                        mesh.material.opacity = progress;
                        break;
                    case 'scaleIn':
                        const scale = progress;
                        mesh.scale.set(scale, scale, scale);
                        mesh.material.opacity = 1;
                        break;
                    case 'slideIn':
                        mesh.position.y = (1 - progress) * 10;
                        mesh.material.opacity = progress;
                        break;
                    case 'rotateIn':
                        mesh.rotation.y = (1 - progress) * Math.PI * 2;
                        mesh.material.opacity = progress;
                        break;
                }
            }
        }
    });

    // Rotate meshes (ドラッグ中も回転を継続)
    // ただしメディア（画像・動画）は回転させない
    currentMeshes.forEach(mesh => {
        if (mesh.userData && mesh.userData.vel && !mesh.userData.isMedia) {
            const vel = mesh.userData.vel;
            mesh.rotation.x += vel.x * speedMultiplier;
            mesh.rotation.y += vel.y * speedMultiplier;
            mesh.rotation.z += vel.z * speedMultiplier;
        }
    });

    // Update audio indicator
    const bars = document.querySelectorAll('.bar');
    if (analyser && isPlaying) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        const step = Math.floor(dataArray.length / bars.length);

        bars.forEach((bar, i) => {
            const value = dataArray[i * step];
            const percent = (value / 255) * 100;
            bar.style.height = `${Math.max(10, percent)}%`;
        });

        // BPM検出（常に実行）
        detectBPM();

        // 周波数ベースのオブジェクト発散
        if (frequencySpawnMode) {
            spawnObjectsByFrequency(dataArray);
        }
    } else {
        // 再生していない場合はインジケーターとBPMをリセット
        bars.forEach(bar => {
            bar.style.height = '10%';
        });
        document.getElementById('bpmDisplay').textContent = '--';
    }

    // Update time display
    if (currentAudioSource === 'file' && uploadedAudioElement) {
        const currentTime = uploadedAudioElement.currentTime;
        const duration = uploadedAudioElement.duration;

        // 現在時刻を更新
        const currentMinutes = Math.floor(currentTime / 60);
        const currentSeconds = Math.floor(currentTime % 60);
        document.getElementById('currentTime').textContent =
            `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`;

        // 総時間を更新
        if (!isNaN(duration) && isFinite(duration)) {
            const durationMinutes = Math.floor(duration / 60);
            const durationSeconds = Math.floor(duration % 60);
            document.getElementById('duration').textContent =
                `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
        }
    } else if (currentAudioSource === 'microphone') {
        // マイク入力の場合はライブ表示
        document.getElementById('currentTime').textContent = 'LIVE';
        document.getElementById('duration').textContent = '∞';
    } else {
        // 音源なし
        document.getElementById('currentTime').textContent = '0:00';
        document.getElementById('duration').textContent = '--';
    }

    renderer.render(scene, camera);
}

// ===========================
// UI CONTROLS
// ===========================
function initUI() {
    // Double click to open color picker
    let clickTimeout = null;
    let clickCount = 0;

    renderer.domElement.addEventListener('click', (e) => {
        clickCount++;

        if (clickCount === 1) {
            clickTimeout = setTimeout(() => {
                clickCount = 0;
            }, 300);
        } else if (clickCount === 2) {
            clearTimeout(clickTimeout);
            clickCount = 0;

            // Get clicked object
            const mouse = new THREE.Vector2(
                (e.clientX / renderer.domElement.clientWidth) * 2 - 1,
                -(e.clientY / renderer.domElement.clientHeight) * 2 + 1
            );

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(currentMeshes, true);

            if (intersects.length > 0) {
                const object = intersects[0].object;
                let targetObject = object;

                // Find the top-level mesh
                while (targetObject.parent && targetObject.parent !== scene) {
                    targetObject = targetObject.parent;
                }

                const instanceId = targetObject.userData.instanceId;
                if (instanceId !== undefined) {
                    selectedInstance = objectInstances.find(inst => inst.id === instanceId);
                    openColorPicker(instanceId);
                }
            }
        }
    });

    // Play/Pause button (宣言を先に行う)
    const playPauseBtn = document.getElementById('playPause');
    const playIcon = playPauseBtn.querySelector('.play-icon');
    const pauseIcon = playPauseBtn.querySelector('.pause-icon');

    // bodyにフォーカスを設定
    document.body.focus();

    // Keyboard shortcuts - documentレベルでキャプチャ
    document.addEventListener('keydown', (e) => {
        // スペースバー: 再生/一時停止
        if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
            e.preventDefault();
            e.stopPropagation();

            // 直接再生/停止を切り替え
            if (isPlaying) {
                isPlaying = false;
                stopGenerativeAudio();
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
                playPauseBtn.classList.remove('active');
            } else {
                isPlaying = true;
                startGenerativeAudio();
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
                playPauseBtn.classList.add('active');
            }
            return false;
        }

        // 以下はオブジェクトが選択されている場合のみ
        if (!selectedInstance) return;

        // レイヤー操作
        if (e.key === '[') {
            if (e.shiftKey) {
                // Shift + [ : 最背面へ
                moveToBack(selectedInstance.id);
            } else {
                // [ : 1つ後ろへ
                moveBackward(selectedInstance.id);
            }
            e.preventDefault();
        } else if (e.key === ']') {
            if (e.shiftKey) {
                // Shift + ] : 最前面へ
                moveToFront(selectedInstance.id);
            } else {
                // ] : 1つ前へ
                moveForward(selectedInstance.id);
            }
            e.preventDefault();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            // Delete/Backspace : 削除
            removeInstance(selectedInstance.id);
            e.preventDefault();
        }
    });

    // Hamburger menu
    const hamburger = document.getElementById('hamburger');
    const sideMenu = document.getElementById('sideMenu');
    const menuIcon = document.getElementById('menuIcon');
    const closeIcon = document.getElementById('closeIcon');

    hamburger.addEventListener('click', () => {
        sideMenu.classList.toggle('open');
        document.body.classList.toggle('menu-open');
        const isOpen = sideMenu.classList.contains('open');
        menuIcon.style.display = isOpen ? 'none' : 'block';
        closeIcon.style.display = isOpen ? 'block' : 'none';
    });

    // Size control
    const sizeSlider = document.getElementById('size');
    const sizeValue = document.getElementById('sizeValue');

    sizeSlider.addEventListener('input', (e) => {
        sizeMultiplier = parseFloat(e.target.value);
        sizeValue.textContent = `${sizeMultiplier.toFixed(1)}×`;
        updateScene();
    });

    // Speed control
    const speedSlider = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');

    speedSlider.addEventListener('input', (e) => {
        speedMultiplier = parseFloat(e.target.value);
        speedValue.textContent = `${speedMultiplier.toFixed(1)}×`;
    });

    // Spread control
    const spreadSlider = document.getElementById('spread');
    const spreadValue = document.getElementById('spreadValue');

    spreadSlider.addEventListener('input', (e) => {
        spreadMultiplier = parseFloat(e.target.value);
        spreadValue.textContent = `${spreadMultiplier.toFixed(1)}×`;
        updateScene();
    });

    // Mandala mode
    const mandalaCheckbox = document.getElementById('mandalaMode');
    const symmetryControls = document.getElementById('symmetryControls');

    mandalaCheckbox.addEventListener('change', (e) => {
        mandalaMode = e.target.checked;
        symmetryControls.style.display = mandalaMode ? 'grid' : 'none';
        updateScene();
    });

    // Symmetry controls
    const symmetryButtons = document.querySelectorAll('#symmetryControls .symmetry-btn');
    symmetryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            symmetryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            symmetryCount = parseInt(btn.dataset.value);
            updateScene();
        });
    });

    // Auto-generation mode
    const autoGenerateCheckbox = document.getElementById('autoGenerateMode');
    const bpmDisplay = document.getElementById('bpmDisplay');
    const autoGenerateSpeed = document.getElementById('autoGenerateSpeed');

    autoGenerateCheckbox.addEventListener('change', (e) => {
        autoGenerateMode = e.target.checked;
        bpmDisplay.style.display = autoGenerateMode ? 'block' : 'none';
        autoGenerateSpeed.style.display = autoGenerateMode ? 'block' : 'none';

        // FREQUENCY SPAWNと排他的
        if (autoGenerateMode && frequencySpawnMode) {
            frequencySpawnMode = false;
            document.getElementById('frequencySpawnMode').checked = false;
        }

        if (autoGenerateMode) {
            startAutoGeneration();
        } else {
            stopAutoGeneration();
        }
    });

    // Frequency spawn mode
    const frequencySpawnCheckbox = document.getElementById('frequencySpawnMode');

    frequencySpawnCheckbox.addEventListener('change', (e) => {
        frequencySpawnMode = e.target.checked;

        // AUTO GENERATEと排他的
        if (frequencySpawnMode && autoGenerateMode) {
            autoGenerateMode = false;
            document.getElementById('autoGenerateMode').checked = false;
            stopAutoGeneration();
            bpmDisplay.style.display = 'none';
            autoGenerateSpeed.style.display = 'none';
        }
    });

    // Auto-generation speed control
    const autoSpeedSlider = document.getElementById('autoSpeed');
    const autoSpeedValue = document.getElementById('autoSpeedValue');

    autoSpeedSlider.addEventListener('input', (e) => {
        autoGenerateSpeedMultiplier = parseInt(e.target.value);
        autoSpeedValue.textContent = `${autoGenerateSpeedMultiplier}×`;

        // オート生成中の場合は再起動して新しいスピードを適用
        if (autoGenerateMode) {
            startAutoGeneration();
        }
    });

    // Max objects control
    const maxObjectsInput = document.getElementById('maxObjects');
    const maxObjectsValue = document.getElementById('maxObjectsValue');
    let maxObjectsTimeout = null;

    maxObjectsInput.addEventListener('input', (e) => {
        const newMax = parseInt(e.target.value) || 5;
        maxObjectsValue.textContent = newMax;

        // デバウンス処理（連続入力時に処理を遅延）
        if (maxObjectsTimeout) {
            clearTimeout(maxObjectsTimeout);
        }

        maxObjectsTimeout = setTimeout(() => {
            maxObjects = newMax;

            // 既存のオブジェクトが最大数を超えている場合は削除（即座に削除）
            const toRemove = objectInstances.length - maxObjects;
            if (toRemove > 0) {
                // 一度に削除するオブジェクトのIDを取得
                const idsToRemove = objectInstances.slice(0, toRemove).map(inst => inst.id);

                // バッチで削除
                idsToRemove.forEach(id => {
                    removeInstance(id, true); // immediate=trueで即座に削除
                });
            }
        }, 100); // 100ms待機
    });

    playPauseBtn.addEventListener('click', async () => {
        // AudioContextを確実に初期化
        if (!audioContext) {
            initAudioContext();
        }

        // AudioContextのresumeを確実に実行
        if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        if (isPlaying) {
            // 停止
            stopAllAudio();
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            playPauseBtn.classList.remove('active');
        } else {
            // 再生
            if (currentAudioSource === 'file' && uploadedAudioElement) {
                uploadedAudioElement.play();
                isPlaying = true;
            } else if (currentAudioSource === 'microphone') {
                // マイクは既に接続されているので、isPlayingフラグだけ更新
                isPlaying = true;
            } else {
                // 音源がない場合は何もしない（またはマイク入力を開始）
                alert('音楽ファイルをアップロードするか、マイク入力を開始してください。');
                return;
            }
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            playPauseBtn.classList.add('active');

            // オートジェネレートが有効な場合は再開
            if (autoGenerateMode) {
                startAutoGeneration();
            }
        }
    });

    // Upload audio button
    const uploadAudioBtn = document.getElementById('uploadAudio');
    uploadAudioBtn.addEventListener('click', () => {
        document.getElementById('audioUpload').click();
    });

    // Upload media (image/video) button
    const uploadMediaBtn = document.getElementById('uploadMediaBtn');
    const mediaUpload = document.getElementById('mediaUpload');

    if (uploadMediaBtn && mediaUpload) {
        uploadMediaBtn.addEventListener('click', () => {
            mediaUpload.click();
        });

        mediaUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const fileType = file.type.split('/')[0]; // 'image' or 'video'

            // ファイルをBase64に変換
            const reader = new FileReader();
            const base64Data = await new Promise((resolve) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });

            // 画像の場合、アスペクト比を取得
            let aspectRatio = 1;
            if (fileType === 'image') {
                const img = new Image();
                img.src = base64Data;
                await new Promise((resolve) => {
                    img.onload = () => {
                        aspectRatio = img.width / img.height;
                        resolve();
                    };
                });
            } else if (fileType === 'video') {
                const video = document.createElement('video');
                video.src = base64Data;
                await new Promise((resolve) => {
                    video.onloadedmetadata = () => {
                        aspectRatio = video.videoWidth / video.videoHeight;
                        resolve();
                    };
                });
            }

            const mediaData = {
                id: `media-${Date.now()}`,
                name: file.name,
                type: fileType,
                url: base64Data,
                aspectRatio: aspectRatio
            };

            customMaterials.push(mediaData);
            saveCustomMaterials();
            createPresetGrid();

            // Clear input
            e.target.value = '';
        });
    }

    // Microphone button
    const micBtn = document.getElementById('micBtn');
    micBtn.addEventListener('click', async () => {
        // AudioContextを確実に初期化
        if (!audioContext) {
            initAudioContext();
        }

        // AudioContextのresumeを確実に実行
        if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        if (currentAudioSource === 'microphone') {
            // マイクを停止
            stopMicrophone();
            currentAudioSource = null;
            isPlaying = false;
            micBtn.classList.remove('active');
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            playPauseBtn.classList.remove('active');
            document.getElementById('trackTitle').textContent = 'No Input';
            document.getElementById('trackArtist').textContent = '';
        } else {
            // マイクを開始
            const success = await startMicrophone();
            if (success) {
                micBtn.classList.add('active');
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
                playPauseBtn.classList.add('active');
            }
        }
    });

    // Audio upload handler
    document.getElementById('audioUpload').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            // 既存の音声を停止
            stopAllAudio();

            // 新しい音楽ファイルを読み込み
            const url = URL.createObjectURL(file);
            uploadedAudioElement = new Audio(url);

            // Web Audio APIに接続
            if (!uploadedAudioSource) {
                uploadedAudioSource = audioContext.createMediaElementSource(uploadedAudioElement);
                uploadedAudioSource.connect(analyser);
            }

            currentAudioSource = 'file';

            // メタデータを取得
            try {
                const metadata = await extractMetadata(file);

                // タイトルとアーティストを表示
                const title = metadata.title || file.name.replace(/\.[^/.]+$/, '');
                const artist = metadata.artist || 'Unknown Artist';

                document.getElementById('trackTitle').textContent = title;
                document.getElementById('trackArtist').textContent = artist;
            } catch (error) {
                console.error('メタデータの取得に失敗:', error);
                // フォールバック: ファイル名を使用
                document.getElementById('trackTitle').textContent = file.name;
                document.getElementById('trackArtist').textContent = 'Uploaded Audio';
            }

            // 自動再生
            uploadedAudioElement.play();
            isPlaying = true;
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            playPauseBtn.classList.add('active');
        }
        e.target.value = '';
    });

    // Capture screenshot
    document.getElementById('captureBtn').addEventListener('click', () => {
        // レンダラーからスクリーンショットを取得
        renderer.render(scene, camera);
        const dataURL = renderer.domElement.toDataURL('image/png');

        // ダウンロード
        const link = document.createElement('a');
        link.download = `mandala-machine-${Date.now()}.png`;
        link.href = dataURL;
        link.click();
    });

    // Share to X (Twitter)
    document.getElementById('shareXBtn').addEventListener('click', async () => {
        try {
            // スクリーンショットを取得
            renderer.render(scene, camera);

            // CanvasをBlobに変換
            renderer.domElement.toBlob(async (blob) => {
                try {
                    // クリップボードに画像をコピー
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            'image/png': blob
                        })
                    ]);

                    // Xの投稿画面を開く
                    const text = encodeURIComponent('Created with 𖣔 Mandala Machine');
                    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');

                    // ユーザーに通知
                    alert('画像をクリップボードにコピーしました！\nXの投稿画面で Ctrl+V (Mac: ⌘+V) で貼り付けてください。');
                } catch (err) {
                    console.error('クリップボードへのコピーに失敗:', err);
                    // フォールバック: 画像をダウンロード
                    const dataURL = renderer.domElement.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.download = `mandala-machine-${Date.now()}.png`;
                    link.href = dataURL;
                    link.click();

                    const text = encodeURIComponent('Created with 𖣔 Mandala Machine');
                    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');

                    alert('画像をダウンロードしました！\nXの投稿画面で画像をアップロードしてください。');
                }
            }, 'image/png');
        } catch (err) {
            console.error('シェアに失敗:', err);
            alert('シェアに失敗しました。もう一度お試しください。');
        }
    });

    // Color controls
    const colorRSlider = document.getElementById('colorR');
    const colorGSlider = document.getElementById('colorG');
    const colorBSlider = document.getElementById('colorB');
    const colorRValue = document.getElementById('colorRValue');
    const colorGValue = document.getElementById('colorGValue');
    const colorBValue = document.getElementById('colorBValue');

    colorRSlider.addEventListener('input', (e) => {
        objectColor.r = parseInt(e.target.value);
        colorRValue.textContent = objectColor.r;
        updateScene();
    });

    colorGSlider.addEventListener('input', (e) => {
        objectColor.g = parseInt(e.target.value);
        colorGValue.textContent = objectColor.g;
        updateScene();
    });

    colorBSlider.addEventListener('input', (e) => {
        objectColor.b = parseInt(e.target.value);
        colorBValue.textContent = objectColor.b;
        updateScene();
    });

    // Color palette
    loadColorPalette();

    const saveColorBtn = document.getElementById('saveColorBtn');
    saveColorBtn.addEventListener('click', () => {
        const color = { r: objectColor.r, g: objectColor.g, b: objectColor.b };

        // 同じ色が既に存在するかチェック
        const exists = savedColors.some(c => c.r === color.r && c.g === color.g && c.b === color.b);
        if (exists) {
            alert('この色は既に保存されています');
            return;
        }

        savedColors.push(color);
        saveColorPalette();
        renderColorPalette();
    });

    // Canvas text input
    const canvasTextInput = document.getElementById('canvasText');
    if (canvasTextInput) {
        canvasTextInput.addEventListener('input', (e) => {
            updateCanvasText(e.target.value);
        });
    }

    // Color picker event listeners
    const pickerR = document.getElementById('pickerR');
    const pickerG = document.getElementById('pickerG');
    const pickerB = document.getElementById('pickerB');
    const pickerRValue = document.getElementById('pickerRValue');
    const pickerGValue = document.getElementById('pickerGValue');
    const pickerBValue = document.getElementById('pickerBValue');

    if (pickerR && pickerG && pickerB) {
        pickerR.addEventListener('input', (e) => {
            pickerRValue.textContent = e.target.value;
            updateColorPreview();
        });
        pickerG.addEventListener('input', (e) => {
            pickerGValue.textContent = e.target.value;
            updateColorPreview();
        });
        pickerB.addEventListener('input', (e) => {
            pickerBValue.textContent = e.target.value;
            updateColorPreview();
        });
    }

    const colorPickerApply = document.getElementById('colorPickerApply');
    const colorPickerCancel = document.getElementById('colorPickerCancel');
    const colorPickerModal = document.getElementById('colorPickerModal');

    if (colorPickerApply) {
        colorPickerApply.addEventListener('click', applyColorPicker);
    }
    if (colorPickerCancel) {
        colorPickerCancel.addEventListener('click', closeColorPicker);
    }
    // Close modal when clicking outside
    if (colorPickerModal) {
        colorPickerModal.addEventListener('click', (e) => {
            if (e.target === colorPickerModal) {
                closeColorPicker();
            }
        });
    }

    // Reset scene
    document.getElementById('resetScene').addEventListener('click', () => {
        if (confirm('すべてのオブジェクトをリセットしますか？')) {
            objectInstances = [];
            nextInstanceId = 0;
            selectedInstance = null;

            // Reset settings
            speedMultiplier = 1;
            sizeMultiplier = 1;
            spacingMultiplier = 10;
            mandalaMode = false;
            symmetryCount = 8;
            currentPattern = 0;

            // Update UI
            document.getElementById('speed').value = 1;
            document.getElementById('speedValue').textContent = '1.0×';
            document.getElementById('size').value = 1;
            document.getElementById('sizeValue').textContent = '1.0×';
            document.getElementById('spacing').value = 10;
            document.getElementById('spacingValue').textContent = '10.0';
            document.getElementById('mandalaMode').checked = false;
            document.getElementById('symmetryControls').style.display = 'none';

            // Update audio pattern buttons
            document.querySelectorAll('[data-pattern]').forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.dataset.pattern) === 0);
            });

            // Add initial instance
            addInstance(0);
        }
    });

    // Context menu
    const contextMenu = document.getElementById('contextMenu');
    let contextMenuTargetId = null;

    // Right click to show context menu
    renderer.domElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();

        // Get clicked object
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(currentMeshes, true);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            let targetObject = object;

            // Find the top-level mesh
            while (targetObject.parent && targetObject.parent !== scene) {
                targetObject = targetObject.parent;
            }

            const instanceId = targetObject.userData.instanceId;
            if (instanceId !== undefined) {
                contextMenuTargetId = instanceId;
                const instance = objectInstances.find(inst => inst.id === instanceId);

                // 右クリックしたオブジェクトが選択範囲に含まれているか確認
                const isInSelection = selectedInstances.some(inst => inst.id === instanceId);
                if (!isInSelection && selectedInstances.length > 0) {
                    // 選択範囲外のオブジェクトを右クリックした場合、選択をクリア
                    selectedInstances = [];
                }

                // Update pin text
                const pinMenuItem = document.querySelector('.context-menu-item[data-action="pin"]');
                if (pinMenuItem && instance) {
                    pinMenuItem.textContent = instance.pinned ? '📍 固定解除' : '📌 固定';
                }

                // Show context menu
                contextMenu.style.display = 'block';
                contextMenu.style.left = e.clientX + 'px';
                contextMenu.style.top = e.clientY + 'px';
            }
        }
    });

    // Hide context menu on click outside
    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });

    // Context menu item clicks
    document.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = item.dataset.action;

            // 選択されているインスタンスを取得（複数選択または単一選択）
            const targetInstances = selectedInstances.length > 0
                ? selectedInstances
                : (contextMenuTargetId !== null ? [objectInstances.find(inst => inst.id === contextMenuTargetId)] : []);

            console.log('Menu action:', action, 'Selected instances count:', selectedInstances.length, 'Context menu target:', contextMenuTargetId, 'Target instances:', targetInstances.length, targetInstances);

            if (targetInstances.length > 0) {
                switch(action) {
                    case 'pin':
                        targetInstances.forEach(inst => togglePin(inst.id));
                        break;
                    case 'duplicate':
                        targetInstances.forEach(inst => duplicateInstance(inst.id));
                        break;
                    case 'savePreset':
                        console.log('Saving preset with instances:', targetInstances);
                        saveAsPreset(targetInstances);
                        break;
                    case 'color':
                        if (targetInstances.length === 1) {
                            openColorPicker(targetInstances[0].id);
                        }
                        break;
                    case 'front':
                        targetInstances.forEach(inst => moveToFront(inst.id));
                        break;
                    case 'forward':
                        targetInstances.forEach(inst => moveForward(inst.id));
                        break;
                    case 'backward':
                        targetInstances.forEach(inst => moveBackward(inst.id));
                        break;
                    case 'back':
                        targetInstances.forEach(inst => moveToBack(inst.id));
                        break;
                    case 'delete':
                        console.log('Deleting instances:', targetInstances);
                        targetInstances.forEach(inst => {
                            console.log('Removing instance:', inst.id);
                            removeInstance(inst.id);
                        });
                        selectedInstances = [];
                        break;
                }
            }

            contextMenu.style.display = 'none';
        });
    });

    // Multi-selection with drag
    selectionBox = document.getElementById('selectionBox');
    let isDragging = false;

    renderer.domElement.addEventListener('mousedown', (e) => {
        // 左クリックのみ（右クリックはコンテキストメニュー用）
        if (e.button !== 0) return;

        // DragControlsがドラッグ中の場合はスキップ
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(currentMeshes, true);

        // オブジェクトをクリックした場合は、DragControlsに任せる
        if (intersects.length > 0) {
            return;
        }

        // 空白をクリックした場合は選択開始
        isSelecting = true;
        isDragging = false;
        selectionStart.x = e.clientX;
        selectionStart.y = e.clientY;

        // Shiftキーが押されていない場合は既存の選択をクリア
        if (!e.shiftKey) {
            selectedInstances = [];
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isSelecting) return;

        isDragging = true;

        const currentX = e.clientX;
        const currentY = e.clientY;

        const left = Math.min(selectionStart.x, currentX);
        const top = Math.min(selectionStart.y, currentY);
        const width = Math.abs(currentX - selectionStart.x);
        const height = Math.abs(currentY - selectionStart.y);

        // 選択ボックスを表示
        selectionBox.style.display = 'block';
        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';
    });

    document.addEventListener('mouseup', (e) => {
        if (!isSelecting) return;

        if (isDragging) {
            // 選択範囲内のオブジェクトを検出
            const rect = renderer.domElement.getBoundingClientRect();
            const selectionRect = {
                left: Math.min(selectionStart.x, e.clientX),
                top: Math.min(selectionStart.y, e.clientY),
                right: Math.max(selectionStart.x, e.clientX),
                bottom: Math.max(selectionStart.y, e.clientY)
            };

            // 各オブジェクトの画面座標をチェック
            currentMeshes.forEach(mesh => {
                const instanceId = mesh.userData.instanceId;
                const instance = objectInstances.find(inst => inst.id === instanceId);
                if (!instance) return;

                // 3D座標を2D座標に変換
                const vector = new THREE.Vector3();
                mesh.getWorldPosition(vector);
                vector.project(camera);

                const screenX = (vector.x * 0.5 + 0.5) * rect.width + rect.left;
                const screenY = (-vector.y * 0.5 + 0.5) * rect.height + rect.top;

                // 選択範囲内にあるかチェック
                if (screenX >= selectionRect.left && screenX <= selectionRect.right &&
                    screenY >= selectionRect.top && screenY <= selectionRect.bottom) {
                    if (!selectedInstances.includes(instance)) {
                        selectedInstances.push(instance);
                    }
                }
            });
        }

        // 選択ボックスを非表示
        selectionBox.style.display = 'none';
        isSelecting = false;
        isDragging = false;
    });

    // Transition buttons
    const transitionBtns = document.querySelectorAll('.transition-btn');
    transitionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            transitionBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Update selected transition
            selectedTransition = btn.dataset.transition;
        });
    });

    // Next image button
    const nextImageBtn = document.getElementById('nextImageBtn');
    if (nextImageBtn) {
        nextImageBtn.addEventListener('click', () => {
            showNextImage();
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // スペースキーまたは右矢印で次の画像
        if (e.code === 'Space' || e.code === 'ArrowRight') {
            // テキスト入力中は無視
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                return;
            }
            e.preventDefault();
            showNextImage();
        }
        // 左矢印で前の画像
        if (e.code === 'ArrowLeft') {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                return;
            }
            e.preventDefault();
            showPreviousImage();
        }
    });
}

// 次の画像を表示
function showNextImage() {
    const mediaList = customMaterials.filter(m => m.type === 'image' || m.type === 'video');
    if (mediaList.length === 0) return;

    // 現在表示中のメディアを探す
    const currentMediaInstance = objectInstances.find(inst => inst.mediaData);
    let nextIndex = 0;

    if (currentMediaInstance) {
        const currentIndex = mediaList.findIndex(m => m.id === currentMediaInstance.mediaData.id);
        nextIndex = (currentIndex + 1) % mediaList.length;
        // 現在の画像を削除
        removeInstance(currentMediaInstance.id);
    }

    // 次の画像を追加
    addMediaInstance(mediaList[nextIndex]);
}

// 前の画像を表示
function showPreviousImage() {
    const mediaList = customMaterials.filter(m => m.type === 'image' || m.type === 'video');
    if (mediaList.length === 0) return;

    const currentMediaInstance = objectInstances.find(inst => inst.mediaData);
    let prevIndex = mediaList.length - 1;

    if (currentMediaInstance) {
        const currentIndex = mediaList.findIndex(m => m.id === currentMediaInstance.mediaData.id);
        prevIndex = (currentIndex - 1 + mediaList.length) % mediaList.length;
        removeInstance(currentMediaInstance.id);
    }

    addMediaInstance(mediaList[prevIndex]);
}

// サムネール生成用の共有レンダラー（1つだけ作成して再利用）
let thumbnailRenderer = null;
let thumbnailScene = null;
let thumbnailCamera = null;

function initThumbnailRenderer() {
    if (!thumbnailRenderer) {
        const thumbnailSize = 256;
        thumbnailScene = new THREE.Scene();
        thumbnailScene.background = new THREE.Color(0xffffff);

        thumbnailCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
        thumbnailCamera.position.set(3, 3, 5);
        thumbnailCamera.lookAt(0, 0, 0);

        thumbnailRenderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true
        });
        thumbnailRenderer.setSize(thumbnailSize, thumbnailSize);
    }
}

function generateThumbnail(material) {
    initThumbnailRenderer();

    // シーンをクリア
    while(thumbnailScene.children.length > 0) {
        thumbnailScene.remove(thumbnailScene.children[0]);
    }

    // オブジェクトを生成
    const mesh = material.create3D();
    thumbnailScene.add(mesh);

    // レンダリング
    thumbnailRenderer.render(thumbnailScene, thumbnailCamera);

    // Data URLを取得
    const dataURL = thumbnailRenderer.domElement.toDataURL('image/png');

    // シーンからオブジェクトを削除（レンダラーは再利用）
    thumbnailScene.remove(mesh);

    return dataURL;
}

function createPresetGrid() {
    const presetGrid = document.getElementById('presetGridLeft');
    const visualGrid = document.getElementById('visualGridLeft');
    if (!presetGrid) return;
    presetGrid.innerHTML = '';
    if (visualGrid) visualGrid.innerHTML = '';

    // OBJECTS: MATERIALSを表示
    MATERIALS.forEach((material, index) => {
        const item = document.createElement('div');
        item.className = 'preset-item';
        item.dataset.index = index;

        // ワイヤーフレーム/ソリッド状態をチェック
        const instances = objectInstances.filter(inst => inst.materialIndex === index);
        if (instances.length > 0) {
            if (instances[0].wireframe) {
                item.classList.add('wireframe');
            } else {
                item.classList.add('solid');
            }
        }

        // サムネール画像を追加（3Dオブジェクトから生成）
        const img = document.createElement('img');
        img.alt = material.name;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';

        // 3Dオブジェクトから直接サムネールを生成
        try {
            const thumbnailData = generateThumbnail(material);
            img.src = thumbnailData;
            console.log(`Generated thumbnail for: ${material.name}`);
        } catch (e) {
            console.error(`Failed to generate thumbnail for ${material.name}:`, e);
            // サムネール生成に失敗した場合はテキストで表示
            img.style.display = 'none';
            const text = document.createElement('div');
            text.textContent = material.name;
            text.style.fontSize = '8px';
            text.style.textAlign = 'center';
            item.appendChild(text);
        }
        item.appendChild(img);

        // +ボタンを追加
        const addBtn = document.createElement('button');
        addBtn.className = 'add-btn';
        addBtn.textContent = '+';
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // MAX OBJECTSに達している場合は古いオブジェクトを削除
            if (objectInstances.length >= maxObjects) {
                removeInstance(objectInstances[0].id, true);
            }
            addInstance(index);
        });
        item.appendChild(addBtn);

        // -ボタンを追加
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '-';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // このマテリアルの最後のインスタンスを削除
            const instances = objectInstances.filter(inst => inst.materialIndex === index);
            if (instances.length > 0) {
                removeInstance(instances[instances.length - 1].id);
            }
        });
        item.appendChild(removeBtn);

        // クリックイベント（ダブルクリックでワイヤーフレーム切り替え）
        item.addEventListener('click', () => {
            const currentCount = clickCounts.get(index) || 0;
            const newCount = currentCount + 1;
            clickCounts.set(index, newCount);

            if (clickTimers.has(index)) {
                clearTimeout(clickTimers.get(index));
            }

            const timer = setTimeout(() => {
                const finalCount = clickCounts.get(index) || 0;

                if (finalCount >= 2) {
                    // ダブルクリック - このマテリアルの全インスタンスのワイヤーフレーム/ソリッド切り替え
                    const instances = objectInstances.filter(inst => inst.materialIndex === index);
                    if (instances.length > 0) {
                        const currentWireframe = instances[0].wireframe;
                        const newWireframe = !currentWireframe;
                        instances.forEach(inst => {
                            inst.wireframe = newWireframe;
                        });
                        // W/Sマークの表示を更新
                        if (newWireframe) {
                            item.classList.add('wireframe');
                            item.classList.remove('solid');
                        } else {
                            item.classList.remove('wireframe');
                            item.classList.add('solid');
                        }
                        updateScene();
                    }
                }

                clickCounts.set(index, 0);
            }, 300);

            clickTimers.set(index, timer);
        });

        presetGrid.appendChild(item);
    });

    // VISUALS: カスタムプリセット・メディアを追加
    customMaterials.forEach((preset, index) => {
        const item = document.createElement('div');
        item.className = 'preset-item custom-preset';
        item.dataset.presetIndex = index;

        // 画像・動画の場合はサムネイル表示（visualGridに追加）
        if (preset.type === 'image' || preset.type === 'video') {
            const mediaElement = document.createElement(preset.type === 'image' ? 'img' : 'video');
            mediaElement.src = preset.url;
            mediaElement.style.width = '100%';
            mediaElement.style.height = '100%';
            mediaElement.style.objectFit = 'cover';
            if (preset.type === 'video') {
                mediaElement.muted = true;
                mediaElement.loop = true;
            }
            item.appendChild(mediaElement);
        } else {
            // プリセットの場合はテキスト表示
            const nameLabel = document.createElement('div');
            nameLabel.textContent = preset.name;
            nameLabel.style.fontSize = '8px';
            nameLabel.style.textAlign = 'center';
            nameLabel.style.padding = '4px';
            nameLabel.style.fontWeight = 'bold';
            nameLabel.style.background = 'rgba(0, 123, 255, 0.1)';
            item.appendChild(nameLabel);
        }

        // +ボタン
        const addBtn = document.createElement('button');
        addBtn.className = 'add-btn';
        addBtn.textContent = '+';
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (preset.type === 'image' || preset.type === 'video') {
                addMediaInstance(preset);
            } else {
                loadPreset(preset);
            }
        });
        item.appendChild(addBtn);

        // ×ボタン
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'remove-btn';
        deleteBtn.textContent = '×';
        deleteBtn.style.background = '#ff0000';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const confirmMsg = preset.type === 'image' || preset.type === 'video'
                ? `メディア「${preset.name}」を削除しますか？`
                : `プリセット「${preset.name}」を削除しますか？`;
            if (confirm(confirmMsg)) {
                customMaterials.splice(index, 1);
                saveCustomMaterials();
                createPresetGrid();
            }
        });
        item.appendChild(deleteBtn);

        // 画像・動画はvisualGridに、プリセットはpresetGridに追加
        if (preset.type === 'image' || preset.type === 'video') {
            if (visualGrid) visualGrid.appendChild(item);
        } else {
            presetGrid.appendChild(item);
        }
    });

    // 初期インスタンスを1つ追加
    if (objectInstances.length === 0) {
        addInstance(0);
    }
}

// ===========================
// START APPLICATION
// ===========================
try {
    init();

    // ページ読み込み後にbodyにフォーカスを当てる
    setTimeout(() => {
        document.body.focus();
    }, 100);
} catch (error) {
    console.error('Failed to initialize:', error);
}
