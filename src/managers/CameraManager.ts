/**
 * Camera Manager
 * Handles WebRTC camera input from external cameras (e.g., Insta360 GO3)
 * @module managers/CameraManager
 */

export interface CameraDevice {
    deviceId: string;
    label: string;
}

export class CameraManager {
    private videoElement: HTMLVideoElement | null = null;
    private stream: MediaStream | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private isActive: boolean = false;

    constructor() {
        // Create hidden video element for camera feed
        this.videoElement = document.createElement('video');
        this.videoElement.setAttribute('autoplay', '');
        this.videoElement.setAttribute('playsinline', '');
        this.videoElement.muted = true;
        this.videoElement.style.display = 'none';
        document.body.appendChild(this.videoElement);

        // Create canvas for frame capture
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Get list of available camera devices
     */
    async getDevices(): Promise<CameraDevice[]> {
        try {
            // Request permission first (required to get device labels)
            await navigator.mediaDevices.getUserMedia({ video: true });

            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices
                .filter(device => device.kind === 'videoinput')
                .map(device => ({
                    deviceId: device.deviceId,
                    label: device.label || `Camera ${device.deviceId.slice(0, 8)}`
                }));

            console.log('📷 Found cameras:', cameras);
            return cameras;
        } catch (error) {
            console.error('❌ CameraManager: Failed to enumerate devices:', error);
            return [];
        }
    }

    /**
     * Start camera capture from specified device
     * @param deviceId - Optional device ID (uses default camera if not specified)
     * @param width - Desired video width
     * @param height - Desired video height
     */
    async startCamera(deviceId?: string, width: number = 1280, height: number = 720): Promise<HTMLVideoElement | null> {
        if (this.isActive) {
            console.warn('⚠️ CameraManager: Camera already active');
            return this.videoElement;
        }

        try {
            const constraints: MediaStreamConstraints = {
                video: {
                    width: { ideal: width },
                    height: { ideal: height },
                    frameRate: { ideal: 30 },
                    ...(deviceId ? { deviceId: { exact: deviceId } } : {})
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);

            if (this.videoElement) {
                this.videoElement.srcObject = this.stream;
                await this.videoElement.play();

                // Update canvas size to match video
                if (this.canvas) {
                    this.canvas.width = this.videoElement.videoWidth || width;
                    this.canvas.height = this.videoElement.videoHeight || height;
                }

                this.isActive = true;
                console.log(`📷 Camera started: ${this.videoElement.videoWidth}x${this.videoElement.videoHeight}`);
                return this.videoElement;
            }

            return null;
        } catch (error) {
            console.error('❌ CameraManager: Failed to start camera:', error);
            return null;
        }
    }

    /**
     * Stop camera capture
     */
    stopCamera(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }

        this.isActive = false;
        console.log('📷 Camera stopped');
    }

    /**
     * Get current video element
     */
    getVideoElement(): HTMLVideoElement | null {
        return this.videoElement;
    }

    /**
     * Get current video dimensions
     */
    getVideoDimensions(): { width: number; height: number } {
        if (this.videoElement) {
            return {
                width: this.videoElement.videoWidth,
                height: this.videoElement.videoHeight
            };
        }
        return { width: 0, height: 0 };
    }

    /**
     * Capture current frame as ImageData
     */
    captureFrame(): ImageData | null {
        if (!this.isActive || !this.videoElement || !this.canvas || !this.ctx) {
            return null;
        }

        this.ctx.drawImage(this.videoElement, 0, 0);
        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Check if camera is currently active
     */
    isRunning(): boolean {
        return this.isActive;
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.stopCamera();

        if (this.videoElement && this.videoElement.parentNode) {
            this.videoElement.parentNode.removeChild(this.videoElement);
        }

        this.videoElement = null;
        this.canvas = null;
        this.ctx = null;
    }
}
