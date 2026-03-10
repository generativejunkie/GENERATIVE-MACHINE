/**
 * Face Detector Manager
 * Real-time face detection using MediaPipe Face Detection
 * @module managers/FaceDetector
 */

import { FaceDetector, FilesetResolver, Detection } from '@mediapipe/tasks-vision';

export interface FaceBounds {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
}

export class FaceDetectorManager {
    private detector: FaceDetector | null = null;
    private isInitialized: boolean = false;
    private lastDetections: FaceBounds[] = [];
    private detectionInterval: number = 2; // Detect every N frames
    private frameCount: number = 0;

    constructor() { }

    /**
     * Initialize the face detector with MediaPipe model
     */
    async initialize(): Promise<boolean> {
        try {
            console.log('🔍 Initializing Face Detector...');

            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            );

            this.detector = await FaceDetector.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
                    delegate: 'GPU' // Use GPU for better performance
                },
                runningMode: 'VIDEO',
                minDetectionConfidence: 0.5
            });

            this.isInitialized = true;
            console.log('✅ Face Detector initialized');
            return true;
        } catch (error) {
            console.error('❌ FaceDetector: Failed to initialize:', error);
            return false;
        }
    }

    /**
     * Detect faces in the current video frame
     * @param video - HTMLVideoElement to detect faces in
     * @param timestamp - Current timestamp in milliseconds
     */
    detectFaces(video: HTMLVideoElement, timestamp: number): FaceBounds[] {
        if (!this.isInitialized || !this.detector) {
            return this.lastDetections;
        }

        // Skip frames for performance
        this.frameCount++;
        if (this.frameCount % this.detectionInterval !== 0) {
            return this.lastDetections;
        }

        try {
            const result = this.detector.detectForVideo(video, timestamp);

            if (result.detections && result.detections.length > 0) {
                this.lastDetections = result.detections.map((detection: Detection) => {
                    const bbox = detection.boundingBox;
                    if (bbox) {
                        return {
                            x: bbox.originX,
                            y: bbox.originY,
                            width: bbox.width,
                            height: bbox.height,
                            confidence: detection.categories?.[0]?.score ?? 0
                        };
                    }
                    return null;
                }).filter((item): item is FaceBounds => item !== null);
            } else {
                this.lastDetections = [];
            }
        } catch (error) {
            // Silently handle errors during detection
            console.warn('⚠️ Face detection error:', error);
        }

        return this.lastDetections;
    }

    /**
     * Get the last detected face bounds (for use in non-detection frames)
     */
    getLastDetections(): FaceBounds[] {
        return this.lastDetections;
    }

    /**
     * Set the detection interval (skip N frames between detections)
     * Higher values = better performance, lower accuracy
     */
    setDetectionInterval(interval: number): void {
        this.detectionInterval = Math.max(1, Math.min(10, interval));
    }

    /**
     * Check if detector is initialized
     */
    isReady(): boolean {
        return this.isInitialized;
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        if (this.detector) {
            this.detector.close();
            this.detector = null;
        }
        this.isInitialized = false;
        this.lastDetections = [];
    }
}
