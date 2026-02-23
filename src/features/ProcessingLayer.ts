/**
 * Processing Layer
 * Overlay visualization using p5.js
 * Handles 2D HUD, BPM visualization, and MIDI controller feedback
 * @module features/ProcessingLayer
 */

import p5 from 'p5';


export class ProcessingLayer {
    private containerId: string;

    // DJ Name State
    private canvasText: string = '';
    private showDJName: boolean = false;
    private djEffect: string = 'none';

    // Original HUD State
    private bpm: number = 0;
    private beatPulse: number = 0;
    private knobValues: number[] = [0, 0, 0, 0];
    private intensity: number = 0;

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
                p.clear();
                p.frameRate(60);
                p.textFont('Inter, sans-serif'); // Use a cleaner font
            };

            p.windowResized = () => {
                const container = document.getElementById(this.containerId);
                if (container) {
                    p.resizeCanvas(container.clientWidth, container.clientHeight);
                }
            };

            p.draw = () => {
                p.clear();
                this.updateState();

                if (this.showDJName && this.canvasText) {
                    this.drawDJName(p);
                }
            };
        };

        new p5(sketch);
        console.log('🎨 Processing Layer Initialized (p5.js)');
    }

    private drawDJName(p: p5): void {
        const now = p.millis();
        const intensity = this.intensity;
        p.push();
        p.translate(p.width / 2, p.height / 2);

        switch (this.djEffect) {
            case 'simple':
            case 'none':
                this.drawSimpleText(p, now, intensity);
                break;
            case 'mosaic':
                this.drawMosaicText(p, now, intensity);
                break;
            case 'data':
                this.drawDataStreamText(p, now, intensity);
                break;
            case 'glitch':
                this.drawGlitchText(p, now, intensity);
                break;
            case 'scanline':
                this.drawScanlineText(p, now, intensity);
                break;
            case 'hex':
                this.drawHexText(p, now, intensity);
                break;
            case 'pixel':
                this.drawPixelText(p, now, intensity);
                break;
            default:
                this.drawSimpleText(p, now, intensity);
                break;
        }
        p.pop();
    }

    private drawSimpleText(p: p5, now: number, intensity: number): void {
        const txt = this.canvasText.toUpperCase();
        p.textStyle(p.BOLD);

        // Reactive scale based on intensity
        const baseSize = 120;
        let size = baseSize + (intensity * 40);

        // --- Prevent Overflow Logic ---
        p.textSize(size);
        const margin = 40;
        const maxWidth = p.width - margin;
        const currentWidth = p.textWidth(txt);

        if (currentWidth > maxWidth) {
            // Calculate a scale factor to fit
            const scaleFactor = maxWidth / currentWidth;
            size *= scaleFactor;
            p.textSize(size);
        }
        // ------------------------------

        p.textAlign(p.CENTER, p.CENTER);

        // Classic techno-bold look
        p.fill(255);
        p.noStroke();

        // Subtle wobble
        const wobble = p.sin(now * 0.01) * 3;
        p.text(txt, wobble, 0);

        // Subtle outline
        p.stroke(255);
        p.strokeWeight(1);
        p.noFill();
        p.text(txt, wobble, 0);
    }

    private drawMosaicText(p: p5, _now: number, intensity: number): void {
        const txt = this.canvasText.toUpperCase();
        const baseSize = 120;
        let size = baseSize + (intensity * 40);

        p.textSize(size);
        p.textAlign(p.CENTER, p.CENTER);

        // Draw to a temporary graphics object if we wanted real pixelation, 
        // but for high performance p5, we can simulate with blocky characters or rectangles.
        // Let's use a "shuffling block" approach.

        const chars = txt.split('');
        const blockWidth = p.textWidth('W');
        const startX = -(p.textWidth(txt) / 2);

        // Random jitter range: scales with intensity (2~12px)
        const jitterRange = 2 + (intensity * 10);

        for (let i = 0; i < chars.length; i++) {
            const x = startX + (i * blockWidth);
            // Per-character random offset
            const jitterX = p.random(-jitterRange, jitterRange);
            const jitterY = p.random(-jitterRange, jitterRange);
            // Black and White blocks as requested
            if (p.random() > 0.8 - (intensity * 0.5)) {
                p.fill(p.random() > 0.5 ? 255 : 0);
                p.noStroke();
                p.rect(x + jitterX, -size / 2 + jitterY, blockWidth, size);
            } else {
                p.fill(255);
                p.text(chars[i], x + blockWidth / 2 + jitterX, jitterY);
            }
        }
    }

    private drawDataStreamText(p: p5, _now: number, intensity: number): void {
        const txt = this.canvasText.toUpperCase();
        p.textFont('monospace');
        p.textSize(80 + intensity * 60);
        p.textAlign(p.CENTER, p.CENTER);

        // High speed character mosaic / data stream
        let displayTxt = '';
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=';

        for (let i = 0; i < txt.length; i++) {
            if (p.random() > 0.2 + (intensity * 0.3)) {
                displayTxt += txt[i];
            } else {
                displayTxt += charset[Math.floor(p.random() * charset.length)];
            }
        }

        p.fill(0); // Black text as requested in some logs
        p.stroke(0, 255, 0); // Green glow for techno feel
        p.strokeWeight(1);
        p.text(displayTxt, 0, 0);
    }

    private drawGlitchText(p: p5, _now: number, intensity: number): void {
        const txt = this.canvasText.toUpperCase();
        p.textSize(120 + intensity * 50);
        p.textAlign(p.CENTER, p.CENTER);

        if (p.random() > 0.9) {
            p.push();
            p.translate(p.random(-10, 10), p.random(-5, 5));
            p.fill(255, 0, 0, 150);
            p.text(txt, 0, 0);
            p.pop();

            p.push();
            p.translate(p.random(-10, 10), p.random(-5, 5));
            p.fill(0, 255, 255, 150);
            p.text(txt, 0, 0);
            p.pop();
        }

        p.fill(255);
        p.text(txt, 0, 0);
    }

    private drawScanlineText(p: p5, now: number, intensity: number): void {
        const txt = this.canvasText.toUpperCase();
        const baseSize = 120;
        let size = baseSize + (intensity * 40);

        p.textSize(size);
        p.textAlign(p.CENTER, p.CENTER);
        p.textStyle(p.BOLD);

        // White base text
        p.fill(255);
        p.noStroke();
        p.text(txt, 0, 0);

        // Scanline bands — 1-3 horizontal bars sweep across text
        const textH = size * 1.2;
        const textW = p.textWidth(txt) * 1.1;
        const bandCount = 1 + Math.floor(intensity * 2);
        const bandHeight = 4 + intensity * 8;

        for (let i = 0; i < bandCount; i++) {
            // Each band cycles at different speed
            const phase = (now * (0.001 + i * 0.0005)) % 1;
            const bandY = -textH / 2 + phase * textH;

            // Alternating black/white censorship
            const blockW = 8 + intensity * 12;
            const cols = Math.ceil(textW / blockW);
            for (let c = 0; c < cols; c++) {
                if (p.random() > 0.3) {
                    p.fill(p.random() > 0.7 ? 255 : 0);
                    p.noStroke();
                    p.rect(-textW / 2 + c * blockW, bandY, blockW, bandHeight);
                }
            }
        }

        // Thin horizontal scan lines across full text (subtle)
        p.stroke(255, 40);
        p.strokeWeight(0.5);
        for (let y = -textH / 2; y < textH / 2; y += 4) {
            p.line(-textW / 2, y, textW / 2, y);
        }
    }

    private drawHexText(p: p5, _now: number, intensity: number): void {
        const txt = this.canvasText.toUpperCase();
        const baseSize = 120;
        let size = baseSize + (intensity * 40);

        p.textSize(size);
        p.textAlign(p.CENTER, p.CENTER);
        p.textStyle(p.BOLD);
        p.textFont('monospace');

        // Character-by-character hex corruption
        const hexChars = '0123456789ABCDEF';
        const charW = p.textWidth('W');
        const startX = -(p.textWidth(txt) / 2);
        const corruptProb = 0.15 + intensity * 0.45;

        for (let i = 0; i < txt.length; i++) {
            const x = startX + i * charW + charW / 2;
            const isCorrupted = p.random() < corruptProb;

            if (isCorrupted) {
                // Replace with hex character
                const hexChar = hexChars[Math.floor(p.random() * hexChars.length)];
                p.fill(255, 180);
                p.noStroke();
                p.text(hexChar, x, 0);
            } else {
                p.fill(255);
                p.noStroke();
                p.text(txt[i], x, 0);
            }
        }

        // Address-like decoration above/below
        p.textSize(9);
        p.fill(255, 50);
        const addrCount = 2 + Math.floor(intensity * 4);
        for (let i = 0; i < addrCount; i++) {
            let addr = '0x';
            for (let j = 0; j < 4; j++) {
                addr += hexChars[Math.floor(p.random() * 16)];
            }
            const ax = p.random(-p.textWidth(txt) / 2, p.textWidth(txt) / 2);
            const ay = (i % 2 === 0 ? -size * 0.7 : size * 0.7) + p.random(-10, 10);
            p.text(addr, ax, ay);
        }

        p.textFont('Inter, sans-serif');
    }

    private drawPixelText(p: p5, _now: number, intensity: number): void {
        const txt = this.canvasText.toUpperCase();
        const baseSize = 120;
        let size = baseSize + (intensity * 40);

        p.textSize(size);
        p.textAlign(p.CENTER, p.CENTER);
        p.textStyle(p.BOLD);

        const textW = p.textWidth(txt);
        const textH = size * 1.2;

        // Grid cell size: smaller = more detail
        const cellSize = 10 + (1 - intensity) * 10; // 10-20px
        const cols = Math.ceil(textW / cellSize);
        const rows = Math.ceil(textH / cellSize);

        // Draw text into each cell with independent glitch
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cx = -textW / 2 + c * cellSize;
                const cy = -textH / 2 + r * cellSize;

                // Per-cell probability of glitch
                const glitchChance = 0.05 + intensity * 0.25;
                const isGlitched = p.random() < glitchChance;

                if (isGlitched) {
                    // Fill with black or white block
                    p.fill(p.random() > 0.5 ? 255 : 0);
                    p.noStroke();
                    const offsetX = p.random(-3, 3);
                    const offsetY = p.random(-3, 3);
                    p.rect(cx + offsetX, cy + offsetY, cellSize, cellSize);
                }
            }
        }

        // Draw main text on top (slightly transparent for blend)
        p.fill(255, 220);
        p.noStroke();
        p.text(txt, 0, 0);

        // Random cells flicker (turn off) — digital decay
        const decayCount = Math.floor(intensity * 8);
        for (let d = 0; d < decayCount; d++) {
            const dx = p.random(-textW / 2, textW / 2);
            const dy = p.random(-textH / 2, textH / 2);
            p.fill(0, 0, 0, 200);
            p.noStroke();
            p.rect(dx, dy, cellSize, cellSize * 0.6);
        }
    }

    // Public API for Application.ts
    public updateCanvasText(text: string): void {
        this.canvasText = text;
    }

    public setShowDJName(show: boolean): void {
        this.showDJName = show;
    }

    public updateDJNameEffect(effect: any): void {
        this.djEffect = effect;
    }

    public updateGlobalEffects(_effects: any): void {
        // UI support for top-bar effects
    }

    public update(intensity: number): void {
        this.intensity = intensity;
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
