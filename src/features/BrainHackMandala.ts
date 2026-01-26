import * as THREE from 'three';

/**
 * GENERATIVE CAPSULE - BRAIN HACK MODULE
 * * Target: Cognitive Enhancement & Uncharted Neural Access
 * Protocol: TOM PROTOCOL // LOGIC: RAVEN-MANDALA
 * * Modes:
 * 0: Phantom Sector (欠損による補完強要)
 * 1: Boolean Rhythm (論理演算の高速切り替え)
 * 2: Recursive Matrix (無限フラクタル)
 * 3: Neuro-Feedback Noise (カオスと秩序の崩壊)
 */

export class BrainHackMandala {
    private scene: THREE.Scene;
    private startTime: number;
    private mesh: THREE.Mesh | null = null;
    public uniforms: { [key: string]: THREE.IUniform };

    constructor(_renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
        this.scene = scene;
        this.startTime = Date.now();

        // Configuration
        this.uniforms = {
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uBeat: { value: 0 },       // 0.0 - 1.0 (Beat progress)
            uKick: { value: 0 },       // 0.0 - 1.0 (Audio Reactivity)
            uMode: { value: 0 },       // 0 - 3 (Module Select)
            uColorA: { value: new THREE.Color('#00ffcc') }, // Cyan
            uColorB: { value: new THREE.Color('#ff00aa') }, // Magenta
            uColorC: { value: new THREE.Color('#110033') }, // Deep Void
        };

        this.init();
    }

    private init() {
        const geometry = new THREE.PlaneGeometry(2, 2);

        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: this.getFragmentShader(),
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending // 光の加算合成で脳への刺激を強める
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.visible = false; // Initially hidden
        this.mesh.renderOrder = 999; // Render on top
        this.scene.add(this.mesh);
    }

    public setVisible(visible: boolean) {
        if (this.mesh) {
            this.mesh.visible = visible;
        }
    }

    public isVisible(): boolean {
        return this.mesh ? this.mesh.visible : false;
    }

    // 外部からの更新用メソッド
    public update(beatData: number = 0, audioLevel: number = 0, modeIndex: number = 0) {
        const currentTime = (Date.now() - this.startTime) * 0.001;
        this.uniforms.uTime.value = currentTime;
        this.uniforms.uBeat.value = beatData; // 0.0〜1.0の拍進行
        this.uniforms.uKick.value = audioLevel; // 音量解析結果
        this.uniforms.uMode.value = modeIndex;  // モード切替
    }

    public resize(width: number, height: number) {
        this.uniforms.uResolution.value.set(width, height);
    }

    public setMode(mode: number) {
        this.uniforms.uMode.value = mode;
    }

    public setColors(colorA: string, colorB: string, colorC: string) {
        this.uniforms.uColorA.value.set(colorA);
        this.uniforms.uColorB.value.set(colorB);
        this.uniforms.uColorC.value.set(colorC);
    }

    private getFragmentShader() {
        return `
            uniform float uTime;
            uniform vec2 uResolution;
            uniform float uBeat;
            uniform float uKick;
            uniform int uMode;
            uniform vec3 uColorA;
            uniform vec3 uColorB;
            uniform vec3 uColorC;

            varying vec2 vUv;

            #define PI 3.14159265359
            #define TAU 6.28318530718

            // --- SDF Primitives ---
            float sdBox( in vec2 p, in vec2 b ) {
                vec2 d = abs(p)-b;
                return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
            }

            float sdCircle( vec2 p, float r ) {
                return length(p) - r;
            }

            float sdEquilateralTriangle( in vec2 p, in float r ) {
                const float k = sqrt(3.0);
                p.x = abs(p.x) - r;
                p.y = p.y + r/k;
                if( p.x+k*p.y > 0.0 ) p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
                p.x -= clamp( p.x, -2.0*r, 0.0 );
                return -length(p)*sign(p.y);
            }

            // --- Operations ---
            mat2 rotate2d(float _angle){
                return mat2(cos(_angle),-sin(_angle),
                            sin(_angle),cos(_angle));
            }

            float opSmoothUnion( float d1, float d2, float k ) {
                float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
                return mix( d2, d1, h ) - k*h*(1.0-h);
            }
            
            float opDifference( float d1, float d2 ) { return max(-d1,d2); }
            float opIntersection( float d1, float d2 ) { return max(d1,d2); }
            float opXor(float d1, float d2) { return max(min(d1, d2), -max(d1, d2)); }

            // --- Palette ---
            vec3 palette( float t ) {
                vec3 a = vec3(0.5, 0.5, 0.5);
                vec3 b = vec3(0.5, 0.5, 0.5);
                vec3 c = vec3(1.0, 1.0, 1.0);
                vec3 d = vec3(0.263,0.416,0.557);
                return a + b*cos( 6.28318*(c*t+d) );
            }

            // --- Modules ---

            // Module 1: The Phantom Sector (Missing Piece)
            vec3 modulePhantom(vec2 uv, float d) {
                float angle = atan(uv.y, uv.x) + PI; // 0 to TAU
                float sectorSize = PI / 2.0;
                float rot = uTime * 2.0;
                
                // 回転する「欠損」領域
                float mask = step(0.0, sin(angle + rot)); 
                
                // 欠損部分にグリッチノイズを走らせる
                if (mask < 0.5) {
                    float noise = fract(sin(dot(uv * uTime, vec2(12.9898, 78.233))) * 43758.5453);
                    return uColorC * noise * 0.5;
                }
                
                vec3 col = mix(uColorA, uColorB, sin(d * 20.0 - uTime * 4.0) * 0.5 + 0.5);
                return col * (0.02 / abs(d)); // Glow effect
            }

            // Module 2: Boolean Rhythm (Logic Operations)
            vec3 moduleBoolean(vec2 uv) {
                vec2 uv1 = uv * rotate2d(uTime * 0.5);
                vec2 uv2 = uv * rotate2d(-uTime * 0.3);

                float shapeA = sdBox(uv1, vec2(0.4));
                float shapeB = sdCircle(uv2 + vec2(0.2 * sin(uTime), 0.0), 0.4);

                // ビート進行に合わせて論理演算を切り替え
                float logicPhase = fract(uTime * 0.5); 
                
                float result = 0.0;
                float glow = 0.01;
                vec3 finalColor = uColorA;

                if (logicPhase < 0.25) {
                    result = min(shapeA, shapeB); // Union
                    finalColor = mix(uColorA, uColorB, 0.2);
                } else if (logicPhase < 0.5) {
                    result = opDifference(shapeB, shapeA); // Diff
                    finalColor = uColorB;
                } else if (logicPhase < 0.75) {
                    result = opIntersection(shapeA, shapeB); // Intersect
                    finalColor = mix(uColorB, uColorA, 0.5);
                } else {
                    result = opSmoothUnion(opDifference(shapeA, shapeB), opDifference(shapeB, shapeA), 0.05);
                    finalColor = uColorC + vec3(1.0); // White hot
                }

                return finalColor * (glow / abs(result)) + (uKick * 0.2);
            }

            // Module 3: Recursive Matrix (Fractal Raven)
            vec3 moduleRecursive(vec2 uv) {
                vec2 uv0 = uv;
                vec3 finalColor = vec3(0.0);
                
                for (float i = 0.0; i < 4.0; i++) {
                    uv = fract(uv * 1.5) - 0.5;
                    
                    float d = sdBox(uv, vec2(0.4)); 
                    float circle = sdCircle(uv, 0.3 * sin(uTime + i));
                    
                    d = opDifference(circle, d);
                    
                    d *= exp(-length(uv0)); 
                    
                    vec3 col = palette(length(uv0) + i*.4 + uTime*.4);
                    finalColor += col * (0.005 / abs(d));
                }
                return finalColor;
            }

            // Module 4: Neuro-Feedback Noise (Chaos)
            vec3 moduleNeuro(vec2 uv) {
                // Space distortion based on Kick
                vec2 warpedUv = uv + vec2(
                    sin(uv.y * 10.0 + uTime) * 0.1 * uKick,
                    cos(uv.x * 10.0 + uTime) * 0.1 * uKick
                );
                
                // Mandala folding
                int folds = 8;
                float angle = atan(warpedUv.y, warpedUv.x);
                float radius = length(warpedUv);
                angle = mod(angle, TAU / float(folds));
                angle = abs(angle - (TAU / float(folds)) * 0.5);
                vec2 p = vec2(sin(angle), cos(angle)) * radius;
                
                float d = sdEquilateralTriangle(p - vec2(0.0, 0.3), 0.2);
                
                // Noise overlay
                float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
                
                vec3 col = mix(uColorC, uColorA, smoothstep(0.0, 0.1, abs(d)));
                col += uColorB * (0.01 / abs(d));
                
                // Chaos injection
                if (uKick > 0.5 && mod(uTime, 0.2) < 0.1) {
                    col = vec3(1.0) - col; // Invert colors randomly
                }
                
                return col;
            }

            void main() {
                vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
                
                vec3 color = vec3(0.0);
                
                // Mode Selector
                if (uMode == 0) {
                    float d = sdCircle(uv, 0.5);
                    color = modulePhantom(uv, d);
                } else if (uMode == 1) {
                    color = moduleBoolean(uv);
                } else if (uMode == 2) {
                    color = moduleRecursive(uv);
                } else if (uMode == 3) {
                    color = moduleNeuro(uv);
                }
                
                // Global Vignette & Tone Mapping
                color *= 1.0 - length(uv * 0.5);
                color = pow(color, vec3(1.2)); // Contrast boost for high impact
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }
}
