
import { Application } from '@core/Application';
import { clamp } from '@utils/helpers';

interface AxisConfig {
    id: string;
    label: string;
    min: number;
    max: number;
    value: number;
    setter: (val: number) => void;
}

export class RadarController {
    private container: HTMLElement;
    private app: Application;
    private svg!: SVGSVGElement;
    private width: number = 280;
    private height: number = 280;
    private centerX: number;
    private centerY: number;
    private radius: number;
    private axes: AxisConfig[] = [];
    private isDragging: boolean = false;
    private activeAxisIndex: number = -1;

    constructor(containerId: string, app: Application) {
        const container = document.getElementById(containerId);
        if (!container) throw new Error(`Container ${containerId} not found`);
        this.container = container;
        this.app = app;

        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.radius = Math.min(this.width, this.height) / 2 - 40; // Padding

        this.initAxes();
        this.createSVG();
        this.setupEventListeners();
        this.render();

        // Listen for external updates
        this.app.on('state:changed', () => this.updateFromState());
    }

    private initAxes(): void {
        const state = this.app.getState();
        this.axes = [
            {
                id: 'size',
                label: 'SIZE',
                min: 0.5,
                max: 2.0,
                value: Math.abs(state.sizeMultiplier),
                setter: (v) => this.app.setSizeMultiplier(v)
            },
            {
                id: 'speed',
                label: 'SPEED',
                min: -3.0,
                max: 3.0,
                value: state.speedMultiplier,
                setter: (v) => this.app.setSpeedMultiplier(v)
            },
            {
                id: 'spread', // SCALE in UI
                label: 'SCALE',
                min: 0.5,
                max: 3.0,
                value: state.spreadMultiplier,
                setter: (v) => this.app.setSpreadMultiplier(v)
            },
            {
                id: 'spacing', // DISTANCE in UI
                label: 'DIST',
                min: 0.1,
                max: 30.0,
                value: state.spacingMultiplier,
                setter: (v) => this.app.setSpacingMultiplier(v)
            },
            {
                id: 'rotation',
                label: 'ROT',
                min: 0,
                max: 360,
                value: state.baseRotation,
                setter: (v) => this.app.setBaseRotation(v)
            }
        ];
    }

    private createSVG(): void {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        this.svg.style.overflow = 'visible';
        this.container.appendChild(this.svg);
    }

    private setupEventListeners(): void {
        // Mouse events
        this.svg.addEventListener('mousedown', (e) => this.handleStart(e.clientX, e.clientY));
        window.addEventListener('mousemove', (e) => this.handleMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', () => this.handleEnd());

        // Touch events
        this.svg.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleStart(touch.clientX, touch.clientY);
        }, { passive: false });
        window.addEventListener('touchmove', (e) => {
            if (this.isDragging) e.preventDefault();
            const touch = e.touches[0];
            this.handleMove(touch.clientX, touch.clientY);
        }, { passive: false });
        window.addEventListener('touchend', () => this.handleEnd());
    }

    private handleStart(clientX: number, clientY: number): void {
        const pt = this.getSVGPoint(clientX, clientY);

        // Find closest axis vertex
        // let minDist = Infinity; // Unused
        let closestIndex = -1;

        this.axes.forEach((axis, i) => {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const normalizedValue = (axis.value - axis.min) / (axis.max - axis.min);
            const valRadius = normalizedValue * this.radius;
            const x = this.centerX + Math.cos(angle) * valRadius;
            const y = this.centerY + Math.sin(angle) * valRadius;

            const dist = Math.sqrt(Math.pow(pt.x - x, 2) + Math.pow(pt.y - y, 2));
            if (dist < 30) { // Hit radius
                // minDist = dist; // Unused
                closestIndex = i;
            }
        });

        if (closestIndex !== -1) {
            this.isDragging = true;
            this.activeAxisIndex = closestIndex;
            this.updateValueFromPoint(pt);
        }
    }

    private handleMove(clientX: number, clientY: number): void {
        if (!this.isDragging || this.activeAxisIndex === -1) return;
        const pt = this.getSVGPoint(clientX, clientY);
        this.updateValueFromPoint(pt);
    }

    private handleEnd(): void {
        this.isDragging = false;
        this.activeAxisIndex = -1;
    }

    private getSVGPoint(clientX: number, clientY: number): DOMPoint {
        const rect = this.svg.getBoundingClientRect();
        const pt = this.svg.createSVGPoint();

        // Calculate position relative to the SVG element
        // We need to account for the viewBox scaling
        const scaleX = this.width / rect.width;
        const scaleY = this.height / rect.height;

        pt.x = (clientX - rect.left) * scaleX;
        pt.y = (clientY - rect.top) * scaleY;

        return pt;
    }

    private updateValueFromPoint(pt: DOMPoint): void {
        const axisIndex = this.activeAxisIndex;
        const angle = (Math.PI * 2 * axisIndex) / 5 - Math.PI / 2;

        // Project point onto axis vector
        // Axis vector: (cos(angle), sin(angle))
        // Vector from center: (pt.x - centerX, pt.y - centerY)
        // Dot product
        const dx = pt.x - this.centerX;
        const dy = pt.y - this.centerY;
        const axisX = Math.cos(angle);
        const axisY = Math.sin(angle);

        let projection = dx * axisX + dy * axisY;

        // Normalize to 0-1 based on radius
        let normalized = projection / this.radius;
        normalized = clamp(normalized, 0, 1);

        // Map back to value
        const axis = this.axes[axisIndex];
        const newValue = axis.min + normalized * (axis.max - axis.min);

        // Update axis value locally
        axis.value = newValue;

        // Call setter
        axis.setter(newValue);

        // Re-render
        this.render();
    }

    private updateFromState(): void {
        if (this.isDragging) return; // Don't update while dragging to avoid jitter

        const state = this.app.getState();
        this.axes[0].value = Math.abs(state.sizeMultiplier);
        this.axes[1].value = state.speedMultiplier;
        this.axes[2].value = state.spreadMultiplier;
        this.axes[3].value = state.spacingMultiplier;
        this.axes[4].value = state.baseRotation;

        this.render();
    }

    private render(): void {
        // Clear SVG
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }

        // Draw background pentagon (grid)
        this.drawGrid();

        // Draw value polygon
        this.drawValuePolygon();

        // Draw axes and labels
        this.drawAxes();

        // Draw control points
        this.drawControlPoints();
    }

    private drawGrid(): void {
        const levels = 4;
        for (let j = 1; j <= levels; j++) {
            const levelRadius = (this.radius / levels) * j;
            let points = '';
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                const x = this.centerX + Math.cos(angle) * levelRadius;
                const y = this.centerY + Math.sin(angle) * levelRadius;
                points += `${x},${y} `;
            }

            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', points);
            polygon.setAttribute('fill', 'none');
            polygon.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
            polygon.setAttribute('stroke-width', '1');
            this.svg.appendChild(polygon);
        }
    }

    private drawAxes(): void {
        this.axes.forEach((axis, i) => {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const x = this.centerX + Math.cos(angle) * this.radius;
            const y = this.centerY + Math.sin(angle) * this.radius;

            // Line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', this.centerX.toString());
            line.setAttribute('y1', this.centerY.toString());
            line.setAttribute('x2', x.toString());
            line.setAttribute('y2', y.toString());
            line.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
            line.setAttribute('stroke-width', '1');
            this.svg.appendChild(line);

            // Label
            const labelDist = this.radius + 20;
            const labelX = this.centerX + Math.cos(angle) * labelDist;
            const labelY = this.centerY + Math.sin(angle) * labelDist;

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', labelX.toString());
            text.setAttribute('y', labelY.toString());
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', 'rgba(255, 255, 255, 0.7)');
            text.setAttribute('font-size', '10px');
            text.setAttribute('font-family', 'Inter, sans-serif');
            text.textContent = axis.label;
            this.svg.appendChild(text);
        });
    }

    private drawValuePolygon(): void {
        let points = '';
        this.axes.forEach((axis, i) => {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const normalized = (axis.value - axis.min) / (axis.max - axis.min);
            const r = normalized * this.radius;
            const x = this.centerX + Math.cos(angle) * r;
            const y = this.centerY + Math.sin(angle) * r;
            points += `${x},${y} `;
        });

        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', points);
        polygon.setAttribute('fill', 'rgba(0, 168, 255, 0.2)');
        polygon.setAttribute('stroke', '#00a8ff');
        polygon.setAttribute('stroke-width', '2');
        this.svg.appendChild(polygon);
    }

    private drawControlPoints(): void {
        this.axes.forEach((axis, i) => {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const normalized = (axis.value - axis.min) / (axis.max - axis.min);
            const r = normalized * this.radius;
            const x = this.centerX + Math.cos(angle) * r;
            const y = this.centerY + Math.sin(angle) * r;

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x.toString());
            circle.setAttribute('cy', y.toString());
            circle.setAttribute('r', '6');
            circle.setAttribute('fill', '#00a8ff');
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('stroke-width', '2');
            circle.style.cursor = 'pointer';

            // Hover effect
            circle.addEventListener('mouseover', () => circle.setAttribute('r', '8'));
            circle.addEventListener('mouseout', () => circle.setAttribute('r', '6'));

            this.svg.appendChild(circle);
        });
    }
}
