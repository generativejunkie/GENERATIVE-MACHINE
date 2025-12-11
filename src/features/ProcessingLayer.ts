/**
 * Processing Layer
 * Overlay visualization using p5.js
 * Handles 2D HUD, BPM visualization, and MIDI controller feedback
 * @module features/ProcessingLayer
 */

import p5 from 'p5';


export class ProcessingLayer {
    private containerId: string;

    // Visual State
    private bpm: number = 0;
    private beatPulse: number = 0;

    // MIDI State (Simplified)
    private knobValues: number[] = [0, 0, 0, 0]; // 4 knobs

    constructor(containerId: string) {
        this.containerId = containerId;
        this.initialize();
    }

    private initialize(): void {
        const sketch = (p: p5) => {
            p.setup = () => {
                const container = document.getElementById(this.containerId);
                const w = container?.clientWidth || window.innerWidth;
                const h = container?.clientHeight || window.innerHeight;

                const canvas = p.createCanvas(w, h);
                canvas.parent(this.containerId);
                p.clear(); // Transparent background
                p.frameRate(60);

                // Font setup if needed
                p.textFont('monospace');
            };

            p.windowResized = () => {
                const container = document.getElementById(this.containerId);
                if (container) {
                    p.resizeCanvas(container.clientWidth, container.clientHeight);
                }
            };

            p.draw = () => {
                p.clear(); // Clear previous frame for transparency

                this.updateState();

                // 1. Draw Beat/BPM
                // this.drawBPM(p);

                // 2. Draw Audio Waveform
                // this.drawWaveform();

                // 3. Draw MIDI Controller HUD
                // this.drawControllerHUD(p);
            };
        };

        new p5(sketch);
        console.log('🎨 Processing Layer Initialized (p5.js)');
    }

    private updateState(): void {
        // Update logic
    }

    // Called from Application listeners
    public updateBPM(bpm: number): void {
        this.bpm = bpm;
        this.beatPulse = 1.0; // Reset pulse
    }

    public updateAudioData(): void {
        // scale for visualization
    }

    public updateMidi(type: string, data: any): void {
        // Update internal state based on MIDI events
        // Example: CC messages
        if (type === 'cc') {
            // Map common CCs to our visual knobs
            // This is hypothetical mapping
            const index = data.cc % 4;
            this.knobValues[index] = data.normalized;
        }
    }

    // @ts-ignore
    private drawBPM(p: p5): void {
        if (this.bpm <= 0) return;

        p.push();
        p.translate(p.width - 100, 60);
        p.textAlign(p.CENTER, p.CENTER);

        // Pulse effect
        if (this.beatPulse > 0) this.beatPulse -= 0.05;
        const scale = 1 + this.beatPulse * 0.5;

        // Circle
        p.noFill();
        p.stroke(0, 255, 255, 200);
        p.strokeWeight(2);
        p.circle(0, 0, 80 * scale);

        // Text
        p.fill(255);
        p.noStroke();
        p.textSize(24);
        p.text(this.bpm.toFixed(0), 0, -10);
        p.textSize(12);
        p.text("BPM", 0, 15);

        p.pop();
    }

    // @ts-ignore
    private drawWaveform(): void {
        // Circular waveform - disabled for now
        /*
        p.push();
        p.translate(p.width / 2, p.height / 2);
        p.noFill();
        p.stroke(255, 100);
        p.strokeWeight(1);
        p.rotate(p.frameCount * 0.005);
        p.circle(0, 0, 300);
        p.pop();
        */
    }

    // @ts-ignore
    private drawControllerHUD(p: p5): void {
        p.push();
        // Bottom left corner HUD
        p.translate(50, p.height - 150);

        // Title
        p.fill(150);
        p.noStroke();
        p.textSize(10);
        p.text("CONTROLLER LINK", 0, -20);

        // Knobs Visualization
        for (let i = 0; i < 4; i++) {
            const x = i * 40;
            const val = this.knobValues[i];

            p.noFill();
            p.stroke(255, 100);
            p.circle(x + 15, 0, 30);

            // Arc value
            p.stroke(0, 255, 128);
            p.strokeWeight(3);
            p.arc(x + 15, 0, 30, 30, -p.PI / 2, -p.PI / 2 + val * p.TWO_PI);

            p.noStroke();
            p.fill(255);
            p.textSize(8);
            p.textAlign(p.CENTER);
            p.text(`K${i + 1}`, x + 15, 25);
        }

        p.pop();
    }
}
