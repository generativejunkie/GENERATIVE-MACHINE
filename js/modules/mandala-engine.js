/**
 * MANDALA ENGINE v3.0: IQ INDUCTION PROTOCOL
 * Author: Antigravity / ILLEND
 * Status: VISUAL_HACK_ACTIVE
 * 
 * Purpose: Overclock human pattern recognition via recursive high-density logic.
 */

export class MandalaEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = canvasId;
            document.body.appendChild(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');

        // State
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.time = 0;
        this.active = false;

        // Resonance Metrics (Simulated IQ)
        this.baseIQ = 110;
        this.currentIQ = this.baseIQ;
        this.iqVelocity = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }

    start() {
        if (this.active) return;
        this.active = true;
        this.animate();
        console.log("[MANDALA] IQ Induction Protocol Initiated.");
    }

    stop() {
        this.active = false;
    }

    // --- VISUAL LOGIC KERNELS ---

    /**
     * Draw specific Raven's Matrix-like logical fragments
     * They don't solve anything; they just look like they contain deep logic.
     */
    drawRavenFragment(x, y, size, type, rotation) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);

        this.ctx.strokeStyle = `rgba(0, 255, 204, ${0.3 + Math.sin(this.time * 2) * 0.2})`;
        this.ctx.lineWidth = 1.5;

        if (type === 0) { // Square Logic
            this.ctx.strokeRect(-size / 2, -size / 2, size, size);
            if (Math.sin(this.time * 3) > 0) {
                this.ctx.fillStyle = 'rgba(0, 255, 204, 0.1)';
                this.ctx.fillRect(-size / 2, -size / 2, size, size);
            }
        } else if (type === 1) { // Circle Logic
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
            this.ctx.stroke();
            // Concentric
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size / 4, 0, Math.PI * 2);
            this.ctx.stroke();
        } else if (type === 2) { // Cross Logic (XOR visual)
            this.ctx.beginPath();
            this.ctx.moveTo(-size / 2, 0); this.ctx.lineTo(size / 2, 0);
            this.ctx.moveTo(0, -size / 2); this.ctx.lineTo(0, size / 2);
            this.ctx.stroke();
        } else if (type === 3) { // Triangle Progression
            this.ctx.beginPath();
            const h = size * Math.sqrt(3) / 2;
            this.ctx.moveTo(0, -h / 2);
            this.ctx.lineTo(-size / 2, h / 2);
            this.ctx.lineTo(size / 2, h / 2);
            this.ctx.closePath();
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    /**
     * Recursive geometry generator.
     * Creates infinite-feeling depth.
     */
    drawRecursiveMandala(x, y, r, depth, angleOffset) {
        if (depth <= 0) return;

        const branchCount = 6; // Hexagonal symmetry (Nature's efficiency)

        this.ctx.beginPath();
        for (let i = 0; i < branchCount; i++) {
            const angle = (Math.PI * 2 / branchCount) * i + angleOffset;
            const nx = x + Math.cos(angle) * r;
            const ny = y + Math.sin(angle) * r;

            // Connect nodes
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(nx, ny);

            // Draw logical fragments at nodes
            if (depth > 1) {
                const type = (i + depth + Math.floor(this.time)) % 4;
                const fragSize = r * 0.3;
                this.drawRavenFragment(nx, ny, fragSize, type, angle + this.time);
            }

            // Recurse
            if (depth > 1) {
                // Golden ratio decay approx
                const nextR = r * 0.618;
                // Rotation adds "spin" to the logic
                const nextAngle = angleOffset + (this.time * 0.1 * (depth % 2 === 0 ? 1 : -1));
                this.drawRecursiveMandala(nx, ny, nextR, depth - 1, nextAngle);
            }
        }

        // Color: Deep Cyber-Psych or Void White
        const alpha = (depth / 6) * 0.6;
        this.ctx.strokeStyle = `rgba(200, 200, 255, ${alpha})`;
        this.ctx.stroke();
    }

    /**
     * Moiré patterns / Interference (Theta/Gamma wave simulation)
     */
    drawInterference(time) {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';

        const count = 40;
        const spacing = 30 + Math.sin(time * 0.5) * 10;

        this.ctx.beginPath();
        for (let i = 0; i < count; i++) {
            // Horizontal waves
            let y = (i * spacing + time * 20) % this.height;
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
        }

        // Rotated waves to create interference
        // ... (Simplified for performance, using just simple grid overlay maybe?)
        // Let's do concentric circles for interference

        for (let j = 0; j < 5; j++) {
            const r = (time * 50 + j * 100) % (this.width / 1.5);
            this.ctx.arc(this.centerX, this.centerY, r, 0, Math.PI * 2);
        }

        this.ctx.strokeStyle = `rgba(50, 255, 255, 0.03)`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.restore();
    }

    // --- IQ SIMULATION LOGIC ---
    updateIQ(dt) {
        // Accelerate IQ based on "focus" (just time for now)
        // Sigmoid-like curve that effectively goes to "infinity" (or very high)
        if (Math.random() < 0.1) {
            this.iqVelocity += 0.01;
        }
        this.currentIQ += this.iqVelocity * dt;

        // Occasional "Eureka" jumps
        if (Math.random() < 0.005) {
            this.currentIQ += 5;
        }
    }

    drawIQOverlay() {
        this.ctx.save();
        this.ctx.font = '100 24px "Courier New", monospace';
        this.ctx.fillStyle = '#0f0';
        this.ctx.textAlign = 'right';
        this.ctx.shadowColor = '#0f0';
        this.ctx.shadowBlur = 10;

        const displayIQ = Math.floor(this.currentIQ);
        const text = `CURRENT RESONANCE (IQ): ${displayIQ}`;

        this.ctx.fillText(text, this.width - 40, this.height - 40);

        // Subtext
        this.ctx.font = '12px "Inter", sans-serif';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.shadowBlur = 0;
        this.ctx.fillText("INDUCTION PROTOCOL ACTIVE", this.width - 40, this.height - 20);

        this.ctx.restore();
    }

    animate() {
        if (!this.active) return;

        // Clear with trails
        this.ctx.fillStyle = 'rgba(5, 5, 10, 0.15)'; // Deep dark fade
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.time += 0.008; // Slower, deeper time

        // 1. Grid / Matrix Background
        // (Optional, maybe implied by other shapes)

        // 2. The Main Recursive Structure
        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        // Slowly rotate entire universe
        this.ctx.rotate(this.time * 0.05);
        this.ctx.translate(-this.centerX, -this.centerY);

        const breath = 150 + Math.sin(this.time) * 30;
        this.drawRecursiveMandala(this.centerX, this.centerY, breath, 4, this.time * 0.1);
        this.ctx.restore();

        // 3. Interference Layers
        this.drawInterference(this.time);

        // 4. Update & Draw IQ
        this.updateIQ(0.1);
        this.drawIQOverlay();

        requestAnimationFrame(() => this.animate());
    }
}
