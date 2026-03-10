/**
 * Mosaic Processor
 * Applies pixelation/mosaic effect to detected face regions
 * @module processors/MosaicProcessor
 */

import type { FaceBounds } from '../managers/FaceDetector';

export class MosaicProcessor {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private tempCanvas: HTMLCanvasElement;
    private tempCtx: CanvasRenderingContext2D;
    private blockSize: number = 15;
    private enabled: boolean = true;
    private padding: number = 20; // Extra padding around face bounds

    constructor(width: number = 1280, height: number = 720) {
        // Main output canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;

        // Temporary canvas for mosaic processing
        this.tempCanvas = document.createElement('canvas');
        this.tempCtx = this.tempCanvas.getContext('2d', { willReadFrequently: true })!;
    }

    /**
     * Process a video frame and apply mosaic to detected faces
     * @param source - Video element to process
     * @param faceBounds - Array of detected face bounding boxes
     */
    process(source: HTMLVideoElement, faceBounds: FaceBounds[]): HTMLCanvasElement {
        const { videoWidth, videoHeight } = source;

        // Resize canvases if needed
        if (this.canvas.width !== videoWidth || this.canvas.height !== videoHeight) {
            this.canvas.width = videoWidth;
            this.canvas.height = videoHeight;
        }

        // Draw the full video frame
        this.ctx.drawImage(source, 0, 0, videoWidth, videoHeight);

        // Apply mosaic to each detected face if enabled
        if (this.enabled && faceBounds.length > 0) {
            for (const face of faceBounds) {
                this.applyMosaicToRegion(face);
            }
        }

        return this.canvas;
    }

    /**
     * Apply mosaic effect to a specific region
     */
    private applyMosaicToRegion(bounds: FaceBounds): void {
        // Add padding to the bounds
        const x = Math.max(0, bounds.x - this.padding);
        const y = Math.max(0, bounds.y - this.padding);
        const width = Math.min(this.canvas.width - x, bounds.width + this.padding * 2);
        const height = Math.min(this.canvas.height - y, bounds.height + this.padding * 2);

        if (width <= 0 || height <= 0) return;

        // Calculate scaled dimensions for pixelation
        const scaledWidth = Math.max(1, Math.floor(width / this.blockSize));
        const scaledHeight = Math.max(1, Math.floor(height / this.blockSize));

        // Setup temp canvas
        this.tempCanvas.width = scaledWidth;
        this.tempCanvas.height = scaledHeight;

        // Disable image smoothing for pixelated effect
        this.tempCtx.imageSmoothingEnabled = false;
        this.ctx.imageSmoothingEnabled = false;

        // Step 1: Draw region to temp canvas (scaled down)
        this.tempCtx.drawImage(
            this.canvas,
            x, y, width, height,
            0, 0, scaledWidth, scaledHeight
        );

        // Step 2: Draw back to main canvas (scaled up = pixelated)
        this.ctx.drawImage(
            this.tempCanvas,
            0, 0, scaledWidth, scaledHeight,
            x, y, width, height
        );

        // Re-enable smoothing for other operations
        this.ctx.imageSmoothingEnabled = true;
    }

    /**
     * Set the mosaic block size (larger = more pixelated)
     */
    setBlockSize(size: number): void {
        this.blockSize = Math.max(5, Math.min(50, size));
    }

    /**
     * Get current block size
     */
    getBlockSize(): number {
        return this.blockSize;
    }

    /**
     * Enable or disable mosaic processing
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * Check if mosaic is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Set padding around detected faces
     */
    setPadding(padding: number): void {
        this.padding = Math.max(0, Math.min(100, padding));
    }

    /**
     * Get the output canvas
     */
    getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    /**
     * Get output canvas as MediaStream for projector
     */
    getStream(fps: number = 30): MediaStream {
        return this.canvas.captureStream(fps);
    }

    /**
     * Resize the processor canvas
     */
    resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        // Clear canvases
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
    }
}
