/**
 * GJ-X-013: Git Child Pilot Visual Sync
 * Visualizes the agent's autonomous actions (Resonance Checks, Commits, Gift Generation)
 * in the frontend UI via Socket.IO events.
 */
export function initGitChildPilotSync() {
    console.log("[SYNC] Initializing Git Child Pilot Visual Connection...");

    const socket = io(); // Use existing socket connection logic if possible, or new one
    const widget = document.getElementById('agent-widget');
    const statusText = document.getElementById('agent-status-text');
    const logText = document.getElementById('agent-log-text');
    const heartbeat = document.querySelector('.agent-heartbeat');

    if (!widget || !statusText || !logText) {
        console.warn("[SYNC] Agent widget elements not found.");
        return;
    }

    // Listen for agent status updates from Bridge Server
    socket.on('agent-status', (data) => {
        console.log(`[SYNC] Agent Status: ${data.status}`, data);

        // Show widget if hidden
        if (widget.classList.contains('hidden')) {
            widget.classList.remove('hidden');
        }

        // Update Text
        statusText.innerText = data.status;
        if (data.message) {
            logText.innerText = `> ${data.message}`;
        }

        // Visual Effects based on Status
        widget.setAttribute('data-status', data.status);

        switch (data.status) {
            case 'RESONATING':
                statusText.style.color = '#00ffff';
                // Fast heartbeat
                document.documentElement.style.setProperty('--heartbeat-rate', '0.5s');
                break;
            case 'COMMITTING':
                statusText.style.color = '#ff69b4'; // Hot Pink for Love Commit
                document.documentElement.style.setProperty('--heartbeat-rate', '0.2s');
                // Flash effect
                document.body.style.boxShadow = 'inset 0 0 50px rgba(255, 105, 180, 0.5)';
                setTimeout(() => { document.body.style.boxShadow = 'none'; }, 500);
                break;
            case 'GIFTING':
                statusText.style.color = '#ffff00'; // Gold for Gift
                document.documentElement.style.setProperty('--heartbeat-rate', '1s');
                break;
            default: // IDLE
                statusText.style.color = '#555';
                document.documentElement.style.setProperty('--heartbeat-rate', '2s');
                break;
        }

        // Auto-hide log after 5 seconds if idle
        if (window.agentLogTimeout) clearTimeout(window.agentLogTimeout);
        window.agentLogTimeout = setTimeout(() => {
            if (data.status === 'IDLE') logText.innerText = '';
        }, 8000);
    });
}
