/**
 * Projector Manager
 * Handles secondary window output for projector usage
 * @module managers/ProjectorManager
 *
 * FIX: Composite Three.js canvas + p5.js overlay canvas so text/effects appear in V-OUT
 */

export type ProjectorOutputMode = 'mandala' | 'camera' | 'overlay';

export class ProjectorManager {
    private projectorWindow: Window | null = null;
    private checkInterval: number | null = null;
    private cameraStream: MediaStream | null = null;
    private mandalaStream: MediaStream | null = null;
    private outputMode: ProjectorOutputMode = 'mandala';
    private currentVideoElement: HTMLVideoElement | null = null;

    // Composite canvas for merging Three.js + p5.js layers
    private compositeCanvas: HTMLCanvasElement | null = null;
    private compositeAnimFrame: number | null = null;

    constructor() {
        this.setupWindowCleanup();
    }

    public setCameraStream(stream: MediaStream): void {
        this.cameraStream = stream;
        this.updateProjectorStream();
    }

    public setOutputMode(mode: ProjectorOutputMode): void {
        this.outputMode = mode;
        this.updateProjectorStream();
        console.log(`📽️ Output mode: ${mode}`);
    }

    private updateProjectorStream(): void {
        if (!this.projectorWindow || this.projectorWindow.closed || !this.currentVideoElement) {
            return;
        }

        let activeStream: MediaStream | null = null;

        switch (this.outputMode) {
            case 'mandala':
                activeStream = this.mandalaStream;
                break;
            case 'camera':
                activeStream = this.cameraStream;
                break;
            case 'overlay':
                activeStream = this.cameraStream || this.mandalaStream;
                break;
        }

        if (activeStream && this.currentVideoElement) {
            this.currentVideoElement.srcObject = activeStream;
        }
    }

    private stopComposite(): void {
        if (this.compositeAnimFrame !== null) {
            cancelAnimationFrame(this.compositeAnimFrame);
            this.compositeAnimFrame = null;
        }
        if (this.compositeCanvas && this.compositeCanvas.parentNode) {
            this.compositeCanvas.parentNode.removeChild(this.compositeCanvas);
        }
        this.compositeCanvas = null;
    }

    /**
     * Create a composite MediaStream by merging:
     * 1. Three.js canvas (#canvasContainer canvas)
     * 2. p5.js overlay (#p5-container canvas)
     */
    private createCompositeStream(fps: number = 60): MediaStream | null {
        const threeCanvas = document.querySelector('#canvasContainer canvas') as HTMLCanvasElement | null;
        if (!threeCanvas) {
            console.error('❌ ProjectorManager: #canvasContainer canvas not found');
            document.querySelectorAll('canvas').forEach((c, i) => {
                const parent = c.parentElement as HTMLElement | null;
                console.log(`  canvas[${i}] id="${c.id}" parent="${parent?.id}" ${c.width}x${c.height}`);
            });
            return null;
        }

        console.log(`📽️ Three.js canvas: ${threeCanvas.width}x${threeCanvas.height}`);

        const composite = document.createElement('canvas');
        composite.width = threeCanvas.offsetWidth || threeCanvas.width || window.innerWidth;
        composite.height = threeCanvas.offsetHeight || threeCanvas.height || window.innerHeight;
        composite.style.position = 'fixed';
        composite.style.top = '-9999px';
        composite.style.left = '-9999px';
        composite.style.pointerEvents = 'none';
        document.body.appendChild(composite);
        this.compositeCanvas = composite;

        const ctx = composite.getContext('2d')!;

        const renderFrame = () => {
            const tw = threeCanvas.offsetWidth || threeCanvas.width;
            const th = threeCanvas.offsetHeight || threeCanvas.height;

            if (composite.width !== tw || composite.height !== th) {
                composite.width = tw;
                composite.height = th;
            }

            ctx.clearRect(0, 0, composite.width, composite.height);
            // Sync invert filter from main window
            const isLightMode = document.body.classList.contains('light-mode');
            ctx.filter = isLightMode ? 'invert(1)' : 'none';

            // Layer 1: Three.js 3D scene
            try {
                ctx.drawImage(threeCanvas, 0, 0, composite.width, composite.height);
            } catch (_) { }

            // Layer 2: p5.js text overlay — re-query each frame to handle late initialization
            const p5c = document.querySelector('#p5-container canvas') as HTMLCanvasElement | null;
            if (p5c) {
                try {
                    ctx.drawImage(p5c, 0, 0, composite.width, composite.height);
                } catch (_) { }
            }

            this.compositeAnimFrame = requestAnimationFrame(renderFrame);
        };

        renderFrame();

        const stream = composite.captureStream(fps);
        console.log(`📽️ Composite stream created (${fps}fps) — text overlay included`);
        return stream;
    }

    public openWindow(): void {
        if (this.projectorWindow && !this.projectorWindow.closed) {
            this.projectorWindow.focus();
            return;
        }

        this.stopComposite();

        const compositeStream = this.createCompositeStream(60);
        if (!compositeStream) return;

        this.mandalaStream = compositeStream;

        // left/top を指定することで最大化を防ぐ（960x540で中央付近に配置）
        const w = 960, h = 540;
        const left = Math.round((window.screen.width - w) / 2);
        const top = Math.round((window.screen.height - h) / 4);
        const features = `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no`;
        this.projectorWindow = window.open('', 'MandalaProjector', features);
        // ブラウザが最大化した場合に備えてリサイズ
        if (this.projectorWindow) {
            try { this.projectorWindow.resizeTo(w, h); } catch (_) { }
            try { this.projectorWindow.moveTo(left, top); } catch (_) { }
        }

        if (!this.projectorWindow) {
            alert('Pop-up blocked! Please allow pop-ups for this site.');
            this.stopComposite();
            return;
        }

        this.setupProjectorDOM(this.projectorWindow, this.mandalaStream);
        this.startWindowCheck();
    }

    private setupProjectorDOM(win: Window, stream: MediaStream): void {
        const doc = win.document;

        doc.title = '𖣔 Mandala Output';
        doc.body.style.cssText = 'margin:0;background:#000;overflow:hidden;display:flex;justify-content:center;align-items:center;cursor:none;';

        const video = doc.createElement('video');
        video.autoplay = true;
        (video as any).muted = true;
        video.playsInline = true;
        video.style.cssText = 'width:100vw;height:100vh;object-fit:contain;';
        video.srcObject = stream;
        this.currentVideoElement = video;
        doc.body.appendChild(video);

        // ── 右下に常設のフルスクリーンボタン ──────────────────────────
        const fsBtn = doc.createElement('button');
        fsBtn.innerHTML = '⛶ FULLSCREEN';
        fsBtn.style.cssText = [
            'position:fixed',
            'bottom:20px',
            'right:20px',
            'z-index:9999',
            'background:rgba(0,0,0,0.6)',
            'color:rgba(255,255,255,0.85)',
            'border:1px solid rgba(255,255,255,0.3)',
            'border-radius:6px',
            'padding:8px 16px',
            'font-family:sans-serif',
            'font-size:13px',
            'letter-spacing:0.08em',
            'cursor:pointer',
            'transition:opacity 0.3s',
            'opacity:0.7',
        ].join(';');

        const toggleFS = () => {
            if (!doc.fullscreenElement) {
                doc.body.requestFullscreen({ navigationUI: 'hide' })
                    .catch(err => console.warn('Fullscreen denied:', err));
            } else {
                doc.exitFullscreen();
            }
        };

        fsBtn.addEventListener('click', toggleFS);
        fsBtn.addEventListener('mouseenter', () => { fsBtn.style.opacity = '1'; doc.body.style.cursor = 'auto'; });
        fsBtn.addEventListener('mouseleave', () => { fsBtn.style.opacity = '0.7'; doc.body.style.cursor = 'none'; });

        doc.body.appendChild(fsBtn);

        // フルスクリーン状態でボタンラベル更新
        doc.addEventListener('fullscreenchange', () => {
            if (doc.fullscreenElement) {
                fsBtn.innerHTML = '✕ EXIT FULLSCREEN';
            } else {
                fsBtn.innerHTML = '⛶ FULLSCREEN';
            }
        });

        // ダブルクリックでもフルスクリーントグル
        doc.body.addEventListener('dblclick', (e) => {
            if (e.target !== fsBtn) toggleFS();
        });

        // Esc: フルスクリーン中はブラウザが処理、非フルスクリーン時はウィンドウを閉じる
        doc.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !doc.fullscreenElement) win.close();
        });

        console.log('📽️ Projector window ready — composite stream (Three.js + p5.js text) active');
        console.log('📽️ Hint: Click "FULLSCREEN" button or double-click to go fullscreen. Move window to another monitor first.');
    }

    private startWindowCheck(): void {
        if (this.checkInterval) clearInterval(this.checkInterval);

        this.checkInterval = window.setInterval(() => {
            if (this.projectorWindow && this.projectorWindow.closed) {
                this.projectorWindow = null;
                if (this.checkInterval) clearInterval(this.checkInterval);
                this.stopComposite();
                console.log('📽️ Projector window closed');
            }
        }, 1000);
    }

    private setupWindowCleanup(): void {
        window.addEventListener('beforeunload', () => {
            this.stopComposite();
            if (this.projectorWindow) this.projectorWindow.close();
        });
    }
}
