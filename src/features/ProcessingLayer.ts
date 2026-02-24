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

    // Animation state (persistent across frames)
    private frameCount: number = 0;
    private hexLockState: number[] = [];
    private hexLockTimers: number[] = [];
    private datDecodeIndex: number = 0;
    private datCycleTimer: number = 0;
    private scanPhase: number = 0;

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
                p.textFont('Inter, sans-serif');
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
                this.frameCount++;

                if (this.showDJName && this.canvasText) {
                    this.drawDJName(p);
                }
            };
        };

        new p5(sketch);
        console.log('🎨 Processing Layer Initialized (p5.js)');
    }

    /** Fit text to canvas width, returns adjusted size */
    private fitTextSize(p: p5, txt: string, baseSize: number): number {
        let size = baseSize;
        p.textSize(size);
        const maxW = p.width * 0.85;
        const w = p.textWidth(txt);
        if (w > maxW) size *= (maxW / w);
        p.textSize(size);
        return size;
    }

    private drawDJName(p: p5): void {
        const now = p.millis();
        const intensity = this.intensity;
        p.push();
        p.translate(p.width / 2, p.height / 2);

        switch (this.djEffect) {
            case 'simple':
            case 'none':
                this.drawMinimalText(p, now, intensity);
                break;
            case 'neon':
                this.drawNeonText(p, now, intensity);
                break;
            case 'glitch':
                this.drawGlitchText(p, now, intensity);
                break;
            case 'plasma':
                this.drawLiquidText(p, now, intensity);
                break;
            case 'mosaic':
                this.drawMosaicText(p, now, intensity);
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
            case 'data':
                this.drawDataStreamText(p, now, intensity);
                break;
            default:
                this.drawMinimalText(p, now, intensity);
                break;
        }
        p.pop();
    }

    // ─── MIN: Breathing Typography ───────────────────────────────
    // Ultra-clean text with micro-breathing scale + sliding hairline underline
    private drawMinimalText(p: p5, now: number, intensity: number): void {
        const txt = this.canvasText.toUpperCase();
        p.textStyle(p.BOLD);
        const breath = 1.0 + Math.sin(now * 0.002) * 0.015;
        const baseSize = (120 + intensity * 30) * breath;
        const size = this.fitTextSize(p, txt, baseSize);
        p.textAlign(p.CENTER, p.CENTER);

        // Main text — pure white, no stroke
        p.fill(255);
        p.noStroke();
        p.text(txt, 0, 0);

        // Hairline underline that slides
        const tw = p.textWidth(txt);
        const lineW = tw * 0.6;
        const lineX = Math.sin(now * 0.001) * (tw * 0.2);
        p.stroke(255, 80);
        p.strokeWeight(1);
        p.line(lineX - lineW / 2, size * 0.45, lineX + lineW / 2, size * 0.45);
    }

    // ─── FLT: Neon Bloom ─────────────────────────────────────────
    // Multi-layered soft glow. White core, fading concentric copies
    private drawNeonText(p: p5, now: number, intensity: number): void {
        const txt = this.canvasText.toUpperCase();
        p.textStyle(p.BOLD);
        const pulse = 1.0 + Math.sin(now * 0.003) * 0.02;
        const size = this.fitTextSize(p, txt, (120 + intensity * 30) * pulse);
        p.textAlign(p.CENTER, p.CENTER);
        p.noStroke();

        // Outer glow layers (large to small, fading)
        const layers = 5;
        for (let i = layers; i >= 1; i--) {
            const spread = i * (1.5 + intensity * 1.5);
            const alpha = 12 + intensity * 8;
            p.fill(255, 255, 255, alpha);
            p.textSize(size + spread * 2);
            p.text(txt, 0, 0);
        }

        // Core text — crisp white
        p.textSize(size);
        p.fill(255);
        p.text(txt, 0, 0);

        // Subtle top highlight line
        const tw = p.textWidth(txt);
        p.stroke(255, 30);
        p.strokeWeight(0.5);
        p.line(-tw / 2, -size * 0.42, tw / 2, -size * 0.42);
    }

    // ─── GLT: Chromatic Slice ────────────────────────────────────
    // Precise horizontal band displacement with RGB channel split
    private drawGlitchText(p: p5, now: number, intensity: number): void {
        const txt = this.canvasText.toUpperCase();
        p.textStyle(p.BOLD);
        const size = this.fitTextSize(p, txt, 120 + intensity * 30);
        p.textAlign(p.CENTER, p.CENTER);
        p.noStroke();

        const glitchActive = Math.sin(now * 0.005) > 0.7 || intensity > 0.5;
        const shift = glitchActive ? (2 + intensity * 6) : 0;

        // Red channel — shift left
        p.fill(255, 0, 0, glitchActive ? 100 + intensity * 60 : 0);
        p.text(txt, -shift, 0);

        // Cyan channel — shift right
        p.fill(0, 255, 255, glitchActive ? 100 + intensity * 60 : 0);
        p.text(txt, shift, 0);

        // Horizontal slice displacement
        if (glitchActive && this.frameCount % 3 === 0) {
            const sliceCount = 2 + Math.floor(intensity * 3);
            const textH = size * 1.2;
            const tw = p.textWidth(txt);
            for (let i = 0; i < sliceCount; i++) {
                const sy = p.random(-textH / 2, textH / 2);
                const sh = 2 + p.random() * 6;
                const sx = p.random(-8, 8) * (1 + intensity * 3);
                // Copy-shift illusion via rect
                p.fill(255, p.random(60, 120));
                p.rect(-tw / 2 + sx, sy, tw, sh);
            }
        }

        // Main white text on top
        p.fill(255);
        p.text(txt, 0, 0);

        // Occasional full-frame blank (frame drop)
        if (intensity > 0.3 && p.random() > 0.97) {
            p.fill(0, 0, 0, 0); // skip frame
        }
    }

    // ─── LIQ: Wave Displacement ──────────────────────────────────
    // Each character floats with sine wave Y-offset. Liquid ripple through text
    private drawLiquidText(p: p5, now: number, intensity: number): void {
        const txt = this.canvasText.toUpperCase();
        p.textStyle(p.BOLD);
        const baseSize = 120 + intensity * 30;
        const size = this.fitTextSize(p, txt, baseSize);
        p.textAlign(p.CENTER, p.CENTER);
        p.noStroke();

        const chars = txt.split('');
        const charW = p.textWidth('W');
        const totalW = charW * chars.length;
        const startX = -totalW / 2;

        for (let i = 0; i < chars.length; i++) {
            const x = startX + i * charW + charW / 2;
            // Two sine waves at different frequencies for organic motion
            const wave1 = Math.sin(now * 0.003 + i * 0.6) * (8 + intensity * 15);
            const wave2 = Math.sin(now * 0.005 + i * 1.1) * (3 + intensity * 5);
            const y = wave1 + wave2;

            // Slight alpha variation per character
            const alpha = 200 + Math.sin(now * 0.004 + i * 0.8) * 55;

            p.fill(255, alpha);
            p.text(chars[i], x, y);
        }

        // Ripple line underneath
        const tw = totalW;
        p.noFill();
        p.stroke(255, 25);
        p.strokeWeight(1);
        p.beginShape();
        for (let x = -tw / 2; x <= tw / 2; x += 3) {
            const y = Math.sin(now * 0.004 + x * 0.02) * (6 + intensity * 8);
            p.vertex(x, size * 0.5 + y);
        }
        p.endShape();
    }

    // ─── MOS: White-on-White Irregular Mosaic ───────────────────
    // White text + irregular white blocks. Invisible on white bg,
    // text revealed when dark mandala objects appear behind.
    private drawMosaicText(p: p5, _now: number, intensity: number): void {
        const txt = this.canvasText.toUpperCase();
        p.textStyle(p.BOLD);
        const size = this.fitTextSize(p, txt, 120 + intensity * 30);
        p.textAlign(p.CENTER, p.CENTER);
        p.noStroke();

        // White text — always white, visible only against dark bg
        p.fill(255);
        p.text(txt, 0, 0);

        const tw = p.textWidth(txt);
        const th = size * 1.6;

        // Irregular white blocks scattered over text area
        // On white bg: blocks blend in, text invisible
        // On dark bg (mandala): gaps between blocks reveal white text
        const blockCount = 40 + Math.floor(intensity * 60);

        for (let i = 0; i < blockCount; i++) {
            // Irregular position — not grid-aligned
            const bx = p.random(-tw / 2 - 20, tw / 2 + 20);
            const by = p.random(-th / 2, th / 2);

            // Irregular size — varying widths and heights
            const bw = p.random(6, 30 + intensity * 15);
            const bh = p.random(4, 20 + intensity * 10);

            // Slight random rotation for more organic feel
            p.push();
            p.translate(bx, by);
            p.rotate(p.random(-0.15, 0.15));

            // All blocks are white — camouflage on white bg
            p.fill(255);
            p.rect(-bw / 2, -bh / 2, bw, bh);
            p.pop();
        }
    }

    // ─── SCN: Laser Scan Reveal ──────────────────────────────────
    // Single precise line sweeps vertically. Text revealed above, dimmed below
    private drawScanlineText(p: p5, now: number, intensity: number): void {
        const txt = this.canvasText.toUpperCase();
        p.textStyle(p.BOLD);
        const size = this.fitTextSize(p, txt, 120 + intensity * 30);
        p.textAlign(p.CENTER, p.CENTER);

        const tw = p.textWidth(txt);
        const th = size * 1.2;

        // Smooth scan phase (0 to 1, loop)
        this.scanPhase = (this.scanPhase + 0.008 + intensity * 0.005) % 1.0;
        const scanY = -th / 2 + this.scanPhase * th;

        // Dimmed base text
        p.noStroke();
        p.fill(255, 40);
        p.text(txt, 0, 0);

        // Bright text clipped above scan line (simulated with multiple thin lines of text)
        // Use graphics clipping via overlay
        p.fill(255, 230);
        p.push();
        // Draw text then cover below scan with dark rect
        p.text(txt, 0, 0);
        p.fill(0, 0, 0, 190);
        p.noStroke();
        p.rect(-tw / 2 - 10, scanY + 2, tw + 20, th);
        p.pop();

        // Scan line — bright, thin, precise
        p.stroke(255);
        p.strokeWeight(1.5);
        p.line(-tw / 2 - 20, scanY, tw / 2 + 20, scanY);

        // Subtle glow around scan line
        for (let i = 1; i <= 3; i++) {
            p.stroke(255, 40 - i * 10);
            p.strokeWeight(1);
            p.line(-tw / 2 - 20, scanY + i * 2, tw / 2 + 20, scanY + i * 2);
            p.line(-tw / 2 - 20, scanY - i * 2, tw / 2 + 20, scanY - i * 2);
        }
    }

    // ─── HEX: Cascade Lock ───────────────────────────────────────
    // Characters rapidly cycle through hex values then "lock in" left-to-right
    private drawHexText(p: p5, now: number, intensity: number): void {
        const txt = this.canvasText.toUpperCase();
        p.textStyle(p.BOLD);
        p.textFont('monospace');
        const size = this.fitTextSize(p, txt, 110 + intensity * 30);
        p.textAlign(p.CENTER, p.CENTER);
        p.noStroke();

        const hexChars = '0123456789ABCDEF';
        const chars = txt.split('');
        const charW = p.textWidth('W');
        const startX = -(charW * chars.length) / 2;

        // Initialize lock state arrays if needed
        if (this.hexLockState.length !== chars.length) {
            this.hexLockState = new Array(chars.length).fill(0);
            this.hexLockTimers = new Array(chars.length).fill(0);
        }

        // Cascade speed
        const lockSpeed = 0.015 + intensity * 0.01;
        const cycleDuration = chars.length * 12 + 60; // frames per full cycle

        for (let i = 0; i < chars.length; i++) {
            const x = startX + i * charW + charW / 2;

            // Update lock timer
            this.hexLockTimers[i] += lockSpeed;
            const cascadeDelay = i * 8;
            const cyclePos = (this.frameCount - cascadeDelay) % cycleDuration;

            // Phase: cycling (0) → locked (1) → cycling again
            const lockPhase = cyclePos > 20 && cyclePos < cycleDuration - 30;

            if (lockPhase) {
                // Locked — show correct character
                p.fill(255);
                p.text(chars[i], x, 0);
            } else {
                // Cycling — rapid hex scramble
                const hexChar = hexChars[Math.floor((this.frameCount * 3 + i * 7) % 16)];
                p.fill(255, 120);
                p.text(hexChar, x, 0);
            }
        }

        // Minimal border frame
        const totalW = charW * chars.length;
        p.noFill();
        p.stroke(255, 25);
        p.strokeWeight(0.5);
        p.rect(-totalW / 2 - 8, -size * 0.5 - 4, totalW + 16, size + 8);

        // Corner markers
        const cm = 6;
        p.stroke(255, 60);
        p.strokeWeight(1);
        // Top-left
        p.line(-totalW / 2 - 8, -size * 0.5 - 4, -totalW / 2 - 8 + cm, -size * 0.5 - 4);
        p.line(-totalW / 2 - 8, -size * 0.5 - 4, -totalW / 2 - 8, -size * 0.5 - 4 + cm);
        // Top-right
        p.line(totalW / 2 + 8, -size * 0.5 - 4, totalW / 2 + 8 - cm, -size * 0.5 - 4);
        p.line(totalW / 2 + 8, -size * 0.5 - 4, totalW / 2 + 8, -size * 0.5 - 4 + cm);
        // Bottom-left
        p.line(-totalW / 2 - 8, size * 0.5 + 4, -totalW / 2 - 8 + cm, size * 0.5 + 4);
        p.line(-totalW / 2 - 8, size * 0.5 + 4, -totalW / 2 - 8, size * 0.5 + 4 - cm);
        // Bottom-right
        p.line(totalW / 2 + 8, size * 0.5 + 4, totalW / 2 + 8 - cm, size * 0.5 + 4);
        p.line(totalW / 2 + 8, size * 0.5 + 4, totalW / 2 + 8, size * 0.5 + 4 - cm);

        p.textFont('Inter, sans-serif');
    }

    // ─── PIX: LED Matrix ─────────────────────────────────────────
    // Text rendered as dot-matrix LED display. Each pixel is a circle.
    private drawPixelText(p: p5, now: number, intensity: number): void {
        const txt = this.canvasText.toUpperCase();
        p.textStyle(p.BOLD);
        p.noStroke();

        // Render text to off-screen buffer to sample pixels
        const bufSize = 120;
        const buf = p.createGraphics(p.width, p.height);
        buf.textFont('Inter, sans-serif');
        buf.textStyle(buf.BOLD);
        buf.textSize(bufSize);
        buf.textAlign(buf.CENTER, buf.CENTER);
        buf.fill(255);
        buf.noStroke();
        buf.text(txt, p.width / 2, p.height / 2);

        // Sample pixels and draw as dots
        const dotSpacing = 6;
        const dotRadius = 2 + intensity * 1.5;
        const tw = buf.textWidth(txt);
        const startX = (p.width - tw) / 2 - 10;
        const endX = startX + tw + 20;
        const startY = (p.height - bufSize) / 2 - 10;
        const endY = startY + bufSize + 20;

        buf.loadPixels();
        for (let y = startY; y < endY; y += dotSpacing) {
            for (let x = startX; x < endX; x += dotSpacing) {
                const idx = (Math.floor(y) * p.width + Math.floor(x)) * 4;
                const brightness = buf.pixels[idx] || 0;

                if (brightness > 128) {
                    // Flicker chance
                    const flicker = p.random() < (0.02 + intensity * 0.08) ? 0 : 1;
                    const alpha = brightness * flicker;

                    // Slight wave displacement
                    const wave = Math.sin(now * 0.003 + x * 0.01 + y * 0.01) * (1 + intensity * 2);

                    p.fill(255, alpha);
                    p.circle(x - p.width / 2 + wave, y - p.height / 2, dotRadius * 2);
                }
            }
        }

        buf.remove();

        // Subtle grid lines
        p.stroke(255, 8);
        p.strokeWeight(0.3);
        for (let x = startX; x < endX; x += dotSpacing) {
            p.line(x - p.width / 2, startY - p.height / 2, x - p.width / 2, endY - p.height / 2);
        }
    }

    // ─── DAT: Terminal Decode ────────────────────────────────────
    // Characters decode one by one, left to right, then hold and restart
    private drawDataStreamText(p: p5, now: number, intensity: number): void {
        const txt = this.canvasText.toUpperCase();
        p.textStyle(p.BOLD);
        p.textFont('monospace');
        const size = this.fitTextSize(p, txt, 100 + intensity * 30);
        p.textAlign(p.CENTER, p.CENTER);
        p.noStroke();

        const chars = txt.split('');
        const charW = p.textWidth('W');
        const startX = -(charW * chars.length) / 2;
        const charset = '0123456789ABCDEF@#$%&+-=/<>[]{}|~';

        // Cycle: decode → hold → reset
        this.datCycleTimer++;
        const decodeSpeed = 3 + Math.floor((1 - intensity) * 4); // frames per char
        const holdFrames = 90;
        const totalFrames = chars.length * decodeSpeed + holdFrames;

        if (this.datCycleTimer >= totalFrames) {
            this.datCycleTimer = 0;
        }

        this.datDecodeIndex = Math.floor(this.datCycleTimer / decodeSpeed);

        for (let i = 0; i < chars.length; i++) {
            const x = startX + i * charW + charW / 2;

            if (i < this.datDecodeIndex) {
                // Decoded — show real char
                p.fill(255);
                p.text(chars[i], x, 0);
            } else if (i === this.datDecodeIndex && this.datCycleTimer < chars.length * decodeSpeed) {
                // Currently decoding — rapid scramble
                const scramble = charset[Math.floor(this.frameCount * 5 + i) % charset.length];
                p.fill(255, 180);
                p.text(scramble, x, 0);

                // Block cursor
                p.fill(255, 150 + Math.sin(now * 0.01) * 105);
                p.rect(x - charW * 0.4, -size * 0.4, charW * 0.8, size * 0.8);
            } else if (this.datCycleTimer >= chars.length * decodeSpeed) {
                // All decoded — hold
                p.fill(255);
                p.text(chars[i], x, 0);
            } else {
                // Not yet reached — show dim placeholder
                p.fill(255, 20);
                p.text('_', x, 0);
            }
        }

        // Progress bar underneath
        const totalW = charW * chars.length;
        const progress = Math.min(this.datDecodeIndex / chars.length, 1.0);
        p.fill(255, 15);
        p.rect(-totalW / 2, size * 0.55, totalW, 2);
        p.fill(255, 80);
        p.rect(-totalW / 2, size * 0.55, totalW * progress, 2);

        p.textFont('Inter, sans-serif');
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
