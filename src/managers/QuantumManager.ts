import { EventEmitter } from '../utils/EventEmitter';

/**
 * Quantum simulator manager inspired by Google Cirq.
 * Uses probability amplitudes to drive visual parameters.
 */
export class QuantumManager extends EventEmitter<any> {
    private numQubits: number = 3;
    private stateVector: { real: number; imag: number }[] = [];
    private coherence: number = 0.5;
    private isEntangled: boolean = false;
    private phase: number = 0;

    constructor() {
        super();
        this.reset();
    }

    /**
     * Initialize state to |000>
     */
    public reset(): void {
        const size = Math.pow(2, this.numQubits);
        this.stateVector = new Array(size).fill(0).map(() => ({ real: 0, imag: 0 }));
        this.stateVector[0].real = 1.0;
        this.phase = 0;
    }

    /**
     * Update quantum state evolution based on time and coherence
     */
    public update(dt: number, coherence: number, entangled: boolean): void {
        this.coherence = coherence;
        this.isEntangled = entangled;
        this.phase += dt * 0.001 * (1.0 + this.coherence * 2.0);

        // Simulate basic evolution: simple rotation in Hilbert space
        // This creates a "drifting" superposition
        const size = this.stateVector.length;
        for (let i = 0; i < size; i++) {
            // Add some wave-like interference based on coherence
            const freq = (i + 1) * 0.5;
            const amp = Math.sin(this.phase * freq) * this.coherence * 0.2;

            this.stateVector[i].real += Math.cos(this.phase + i) * amp;
            this.stateVector[i].imag += Math.sin(this.phase + i) * amp;
        }

        // Normalize state vector
        this.normalize();

        // Emit update event
        this.emit('quantum:updated', {
            stateVector: this.getProbabilities()
        });
    }

    /**
     * Normalize the state vector so the sum of squares is 1
     */
    private normalize(): void {
        let normSq = 0;
        for (const val of this.stateVector) {
            normSq += val.real * val.real + val.imag * val.imag;
        }

        const norm = Math.sqrt(normSq);
        if (norm > 0) {
            for (let i = 0; i < this.stateVector.length; i++) {
                this.stateVector[i].real /= norm;
                this.stateVector[i].imag /= norm;

                // Entanglement simulation effect: 
                // In quantum mode, if entangled, states reflect each other's changes more strongly
                if (this.isEntangled && i > 0) {
                    this.stateVector[i].real = this.smooth(this.stateVector[i].real, this.stateVector[0].real, 0.1);
                }
            }
        }
    }

    private smooth(current: number, target: number, factor: number): number {
        return current + (target - current) * factor;
    }

    /**
     * Get measurement probabilities (|amplitude|^2)
     */
    public getProbabilities(): number[] {
        return this.stateVector.map(v => v.real * v.real + v.imag * v.imag);
    }

    /**
     * Map quantum states to a visual parameter (0-1)
     */
    public getQuantumFactor(index: number): number {
        const probs = this.getProbabilities();
        // Return a value based on the probability distribution
        // This will "flicker" or change smoothly based on how state evolves
        return probs[index % probs.length] * probs.length;
    }

    /**
     * "Measurement" collapses the state to a specific basis state
     */
    public measure(): void {
        const probs = this.getProbabilities();
        const rand = Math.random();
        let cumulative = 0;
        let selected = 0;

        for (let i = 0; i < probs.length; i++) {
            cumulative += probs[i];
            if (rand <= cumulative) {
                selected = i;
                break;
            }
        }

        // Collapse
        this.stateVector = this.stateVector.map((_, i) => ({
            real: i === selected ? 1.0 : 0,
            imag: 0
        }));

        console.log(`🌌 Quantum Measurement: State collapsed to |${selected}>`);
    }

    public setCoherence(val: number): void {
        this.coherence = val;
    }

    public setEntangled(val: boolean): void {
        this.isEntangled = val;
    }
}
