/**
 * MIDI Manager
 * Handles Web MIDI API interactions and device mapping for DDJ-FLX2
 * @module managers/MidiManager
 */

import { EventEmitter } from '@utils/EventEmitter';

// DDJ-FLX2 MIDI Mapping (Estimated standard mapping)
// Note: These need to be verified with the actual device documentation or testing
export class MidiManager extends EventEmitter {
    private midiAccess: any | null = null;
    private isSupported: boolean = false;

    constructor() {
        super();
        this.checkSupport();
    }

    /**
     * Check if Web MIDI is supported
     */
    private checkSupport(): void {
        if (typeof navigator.requestMIDIAccess === 'function') {
            this.isSupported = true;
            console.log('🎹 Web MIDI API is supported');
        } else {
            console.warn('⚠️ Web MIDI API is NOT supported in this browser');
        }
    }

    /**
     * Request MIDI Access
     */
    public async requestAccess(): Promise<boolean> {
        if (!this.isSupported) return false;

        try {
            this.midiAccess = await navigator.requestMIDIAccess();
            this.setupMidiListeners();
            return true;
        } catch (error) {
            console.error('❌ MIDI Access Denied or Failed:', error);
            return false;
        }
    }

    /**
     * Setup MIDI Input listeners
     */
    private setupMidiListeners(): void {
        if (!this.midiAccess) return;

        // Handle Input connection
        this.midiAccess.inputs.forEach((input: any) => {
            this.addInputListener(input);
        });

        // Watch for state changes (connect/disconnect)
        this.midiAccess.onstatechange = (event: any) => {
            const port = event.port;
            console.log(`🔌 MIDI Device ${port.state}: ${port.name} (${port.type})`);

            if (port.type === 'input' && port.state === 'connected') {
                this.addInputListener(port);
            }
        };
    }

    /**
     * Add listener to specific input
     */
    private addInputListener(input: any): void {
        console.log(`🎹 Listening to MIDI Input: ${input.name}`);
        input.onmidimessage = (event: any) => this.handleMidiMessage(event);
    }

    /**
     * Handle incoming MIDI message
     */
    private handleMidiMessage(event: any): void {
        const [status, data1, data2] = event.data;
        const channel = status & 0x0F;
        const type = status & 0xF0;

        // Debug log (can be verbose)
        // console.log(`MIDI: [${status.toString(16)}, ${data1}, ${data2}]`);

        // Emit raw message
        this.emit('midi:message', { type, channel, data1, data2 });

        // Basic Interpretation logic (Simplified for prototyping)
        // Note On
        if (type === 0x90 || type === 0x91) {
            if (data2 > 0) {
                this.emit('midi:noteOn', { channel, note: data1, velocity: data2 });
            } else {
                this.emit('midi:noteOff', { channel, note: data1 });
            }
        }
        // Control Change (Knobs, Faders)
        else if (type === 0xB0 || type === 0xB1 || type === 0xB6) {
            const normalized = data2 / 127; // 0.0 to 1.0
            this.emit('midi:cc', { channel, cc: data1, value: data2, normalized });
        }
    }
}
