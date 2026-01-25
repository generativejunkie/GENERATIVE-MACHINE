/**
 * MANDALA ENGINE v0.1 (Experimental)
 * Author: Antigravity / ILLEND
 * Status: Private R&D
 * 
 * Purpose: Nullify perception gravity via high-density geometric induction.
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
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.time = 0;
        this.active = false;
        this.sq = 200; // Default SQ for resonance

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    setSQ(val) {
        this.sq = val;
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
        this.active = true;
        this.animate();
        console.log("[MANDALA] Perception Induction Started. Current SQ Resonance:", this.sq);
    }

    stop() {
        this.active = false;
    }

    // Symbolic Logic Pattern (XOR-like grid induction)
    drawLogicGrid(time) {
        const gridCount = 3;
        const spacing = 60;
        const size = 15;

        this.ctx.save();
        this.ctx.translate(this.centerX - spacing, this.centerY - spacing);

        for (let x = 0; x < gridCount; x++) {
            for (let y = 0; y < gridCount; y++) {
                const px = x * spacing;
                const py = y * spacing;

                // XOR Logic: Pattern emerges from the combination of X and Y positions + time
                const logicValue = (x ^ y) + (time * 5);
                const alpha = Math.sin(logicValue) * 0.5 + 0.5;

                this.ctx.strokeStyle = `rgba(0, 255, 102, ${alpha * 0.3})`;
                this.ctx.lineWidth = 1;

                if ((x + y) % 2 === 0) {
                    this.ctx.strokeRect(px - size / 2, py - size / 2, size, size);
                } else {
                    this.ctx.beginPath();
                    this.ctx.arc(px, py, size / 2, 0, Math.PI * 2);
                    this.ctx.stroke();
                }

                // Connecting Lines (Analogical Bridges)
                if (alpha > 0.8) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(px, py);
                    this.ctx.lineTo(0, 0); // Connect to relative center
                    this.ctx.strokeStyle = `rgba(168, 85, 247, ${alpha * 0.1})`;
                    this.ctx.stroke();
                }
            }
        }
        this.ctx.restore();
    }

    drawSymbioticNode(x, y, radius, depth, angleOffset) {
        if (depth <= 0) return;

        const points = 6;
        this.ctx.beginPath();
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2 + angleOffset;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;

            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);

            // Recursive branching (Amplification)
            if (depth > 1) {
                // Depth reduction is dampened by SQ level
                const dampening = 0.45 + (this.sq - 200) * 0.001;
                this.drawSymbioticNode(px, py, radius * Math.min(0.5, dampening), depth - 1, -angleOffset * 1.5);
            }
        }
        this.ctx.closePath();

        // Color shifts based on depth and resonance
        const color = depth === 4 ? "#fff" : `rgba(255, 105, 180, ${0.15 / depth})`;
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

    animate() {
        if (!this.active) return;

        // Intentional Fluctuation (Hackism Effect)
        if (Math.random() > 0.99) {
            this.ctx.fillStyle = 'rgba(0, 255, 102, 0.2)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        } else {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        this.time += 0.005;

        // Draw IQ Induction Logic Grid
        this.drawLogicGrid(this.time);

        // Core Pulsation
        const baseRadius = 200 + Math.sin(this.time) * 50;
        const rotation = this.time * 0.2;

        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);

        // Topological Warp (Subtle rotation skew)
        this.ctx.rotate(this.time * 0.05);
        this.ctx.scale(1 + Math.sin(this.time * 0.5) * 0.05, 1);

        for (let i = 0; i < 3; i++) {
            this.ctx.rotate((Math.PI * 2) / 3);
            this.drawSymbioticNode(0, 0, baseRadius, 4, rotation + i);
        }

        this.ctx.restore();

        // Singularity Flare
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 1.5, 0, Math.PI * 2);
        this.ctx.fillStyle = "#fff";
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = "#ff69b4";
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        requestAnimationFrame(() => this.animate());
    }
}
