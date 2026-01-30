/**
 * Projector Manager
 * Handles secondary window output for projector usage
 * @module managers/ProjectorManager
 */

export type ProjectorOutputMode = 'mandala' | 'camera' | 'overlay';

export class ProjectorManager {
    private projectorWindow: Window | null = null;
    private checkInterval: number | null = null;
    private cameraStream: MediaStream | null = null;
    private mandalaStream: MediaStream | null = null;
    private outputMode: ProjectorOutputMode = 'mandala';
    private currentVideoElement: HTMLVideoElement | null = null;

    constructor() {
        this.setupWindowCleanup();
    }

    /**
     * Set the camera mosaic stream for projector output
     */
    public setCameraStream(stream: MediaStream): void {
        this.cameraStream = stream;
        this.updateProjectorStream();
    }

    /**
     * Set the output mode (mandala only, camera only, or overlay)
     */
    public setOutputMode(mode: ProjectorOutputMode): void {
        this.outputMode = mode;
        this.updateProjectorStream();
        console.log(`📽️ Output mode: ${mode}`);
    }

    /**
     * Update the projector stream based on current mode
     */
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
                // For overlay, we could composite streams, but for now use camera
                activeStream = this.cameraStream || this.mandalaStream;
                break;
        }

        if (activeStream && this.currentVideoElement) {
            this.currentVideoElement.srcObject = activeStream;
        }
    }

    /**
     * Open the projector window and start mirroring the canvas
     */
    public openWindow(): void {
        if (this.projectorWindow && !this.projectorWindow.closed) {
            this.projectorWindow.focus();
            return;
        }

        // Get the main canvas stream
        const canvas = document.querySelector('#canvasContainer canvas') as HTMLCanvasElement;
        if (!canvas) {
            console.error('❌ ProjectorManager: Main canvas not found');
            return;
        }

        // Create stream (30-60fps depending on browser capability)
        this.mandalaStream = canvas.captureStream(60);

        // Open new window
        // popup=yes ensures minimal UI chrome, but we add more flags to be sure
        const features = 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no,directories=no,popup=yes';
        this.projectorWindow = window.open('', 'MandalaProjector', features);

        if (!this.projectorWindow) {
            alert('Pop-up blocked! Please allow pop-ups for this site.');
            return;
        }

        this.setupProjectorDOM(this.projectorWindow, this.mandalaStream);

        // Start interval to check if window is closed
        this.startWindowCheck();
    }

    /**
     * Setup the DOM content of the child window
     */
    private setupProjectorDOM(win: Window, stream: MediaStream): void {
        const doc = win.document;

        doc.title = '𖣔 Mandala Output';
        doc.body.style.margin = '0';
        doc.body.style.backgroundColor = '#000';
        doc.body.style.overflow = 'hidden';
        doc.body.style.display = 'flex';
        doc.body.style.justifyContent = 'center';
        doc.body.style.alignItems = 'center';
        doc.body.style.cursor = 'none'; // Hide cursor by default

        // Create Video Element
        const video = doc.createElement('video');
        video.autoplay = true;
        (video as any).muted = true; // Required for autoplay usually
        video.style.width = '100vw';
        video.style.height = '100vh';
        // 'contain' ensures the whole mandala is seen without cropping. 
        // If the user wants to fill the screen (potentially cropping), 'cover' would be used.
        video.style.objectFit = 'contain';
        video.srcObject = stream;

        // Store reference for mode switching
        this.currentVideoElement = video;

        doc.body.appendChild(video);

        // Create Overlay for Fullscreen Trigger (if auto fails)
        const overlay = doc.createElement('div');
        overlay.innerText = 'Click to Fullscreen';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.color = 'rgba(255, 255, 255, 0.5)';
        overlay.style.fontFamily = 'sans-serif';
        overlay.style.fontSize = '24px';
        overlay.style.cursor = 'pointer';
        overlay.style.zIndex = '1000';
        overlay.style.background = 'rgba(0, 0, 0, 0.5)'; // Slight dim to indicate interaction needed

        const enterFullscreen = () => {
            if (!doc.fullscreenElement) {
                doc.body.requestFullscreen().then(() => {
                    overlay.style.display = 'none';
                }).catch(err => {
                    console.warn('Fullscreen denied:', err);
                });
            }
        };

        overlay.addEventListener('click', enterFullscreen);
        doc.body.appendChild(overlay);

        // Try auto-fullscreen immediately (works if triggered by trusted event closely)
        // Usually blocked, but worth a try.
        doc.body.requestFullscreen().then(() => {
            overlay.style.display = 'none';
        }).catch(() => {
            // Expected failure if no user gesture interaction chain
            // Keep overlay visible
        });

        // Add double-click to toggle fullscreen (backup)
        doc.body.addEventListener('dblclick', () => {
            if (!doc.fullscreenElement) {
                doc.body.requestFullscreen().then(() => {
                    overlay.style.display = 'none';
                });
            } else {
                doc.exitFullscreen().then(() => {
                    // When exiting fullscreen, maybe show overlay again? 
                    // Or assume they know what they are doing. Let's keep it hidden to be clean.
                });
            }
        });

        // Add 'Esc' to close
        doc.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                win.close();
            }
        });

        // Hide overlay on fullscreen change if it happens via other means
        doc.addEventListener('fullscreenchange', () => {
            if (doc.fullscreenElement) {
                overlay.style.display = 'none';
            }
        });

        console.log('📽️ Projector window initialized');
    }

    private startWindowCheck(): void {
        if (this.checkInterval) clearInterval(this.checkInterval);

        this.checkInterval = window.setInterval(() => {
            if (this.projectorWindow && this.projectorWindow.closed) {
                this.projectorWindow = null;
                if (this.checkInterval) clearInterval(this.checkInterval);
                console.log('📽️ Projector window closed');
            }
        }, 1000);
    }

    private setupWindowCleanup(): void {
        window.addEventListener('beforeunload', () => {
            if (this.projectorWindow) {
                this.projectorWindow.close();
            }
        });
    }
}
