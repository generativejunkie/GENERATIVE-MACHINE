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
            } catch (_) {}

            // Layer 2: p5.js text overlay — re-query each frame to handle late initialization
            const p5c = document.querySelector('#p5-container canvas') as HTMLCanvasElement | null;
            if (p5c) {
                try {
                    ctx.drawImage(p5c, 0, 0, composite.width, composite.height);
                } catch (_) {}
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

        const features = 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no,directories=no,popup=yes';
        this.projectorWindow = window.open('', 'MandalaProjector', features);

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

        const overlay = doc.createElement('div');
        overlay.innerText = 'Click to Fullscreen';
        overlay.style.cssText = 'position:absolute;top:0;left:0;width:100vw;height:100vh;display:flex;justify-content:center;align-items:center;color:rgba(255,255,255,0.5);font-family:sans-serif;font-size:24px;cursor:pointer;z-index:1000;background:rgba(0,0,0,0.5);';

        const enterFS = () => {
            if (!doc.fullscreenElement) {
                doc.body.requestFullscreen()
                    .then(() => { overlay.style.display = 'none'; })
                    .catch(err => console.warn('Fullscreen denied:', err));
            }
        };

        overlay.addEventListener('click', enterFS);
        doc.body.appendChild(overlay);


        doc.body.addEventListener('dblclick', () => {
            if (!doc.fullscreenElement) {
                doc.body.requestFullscreen().then(() => { overlay.style.display = 'none'; });
            } else {
                doc.exitFullscreen();
            }
        });

        doc.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') win.close();
        });

        doc.addEventListener('fullscreenchange', () => {
            if (doc.fullscreenElement) overlay.style.display = 'none';
        });

        console.log('📽️ Projector window ready — composite stream (Three.js + p5.js text) active');
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
