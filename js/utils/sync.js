/**
 * SYNC UTILITY - Cross-tab synchronization via BroadcastChannel
 * Allows multiple windows (Laptop/Projector/Monitor) to stay in sync.
 */

export const syncChannel = new BroadcastChannel('generative_machine_sync');

/**
 * Broadcast an event to all other open tabs
 * @param {string} type Event type
 * @param {any} detail Event data
 */
export function broadcastEvent(type, detail = {}) {
    syncChannel.postMessage({ type, detail });
    // Also dispatch locally so the current window reacts
    document.dispatchEvent(new CustomEvent(`sync-${type}`, { detail }));
}

/**
 * Initialize sync listener
 * @param {Object} handlers Mapping of type to callback functions
 */
export function initSync(handlers) {
    syncChannel.onmessage = (event) => {
        const { type, detail } = event.data;
        console.log(`[SYNC] Received: ${type}`, detail);
        if (handlers[type]) {
            handlers[type](detail);
        }
    };

    // [AI] BRIDGE SERVER RELAY (Socket.io)
    if (typeof io !== 'undefined') {
        const socket = io();
        socket.on('command-relay', (data) => {
            console.log(`[REMOTE] Relay Received: ${data.type}`, data.detail);
            // Broadcast to all tabs via the standard channel
            broadcastEvent(data.type, data.detail);
        });
    }
}
