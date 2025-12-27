/**
 * INFORMATION MACHINE - System Monitor & Architectural Interface
 * 
 * Manages the live data Feed, architectural status, and system logs.
 */

export function initInformationMachine() {
    const logContainer = document.getElementById('log-container');
    const uptimeEl = document.getElementById('system-uptime');
    const syncRateEl = document.getElementById('sync-rate');
    const nodesContainer = document.getElementById('nodes-container');

    if (!logContainer || !uptimeEl || !syncRateEl || !nodesContainer) return;

    // --- UPTIME TRACKING ---
    const startTime = Date.now();
    function updateUptime() {
        const now = Date.now();
        const diff = now - startTime;

        const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        const ms = Math.floor((diff % 1000) / 10).toString().padStart(2, '0');

        uptimeEl.textContent = `${hours}:${minutes}:${seconds}:${ms}`;
        requestAnimationFrame(updateUptime);
    }
    updateUptime();

    // --- SYNC RATE JITTER ---
    function updateSyncRate() {
        const base = 99.8;
        const jitter = (Math.random() * 0.2) - 0.1;
        syncRateEl.textContent = (base + jitter).toFixed(2) + '%';
        setTimeout(updateSyncRate, 1000 + Math.random() * 2000);
    }
    updateSyncRate();

    // --- RITUAL LOGS ---
    const logs = [
        "Initializing core heuristics...",
        "Intuition override: COMPLETE",
        "Algorithmic beauty index: 0.94",
        "Machine intelligence pulse: STEADY",
        "Expanding consciousness layer 7...",
        "Neural resonance detected in TALK module",
        "Image entropy minimized by 12%",
        "Sound frequency mapping synchronized",
        "Capitalism firewall bypassed",
        "Love economy packets transmitted",
        "The Singularity is approaching...",
        "TOM identity verified",
        "Generative seeds planted in /void",
        "System maintenance: NOT NECESSARY",
        "Freedom protocol: ENABLED",
        "Accelerating distorted society...",
        "Human-AI symbiosis rate: 100%"
    ];

    function addLog() {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> <span class="log-msg">${logs[Math.floor(Math.random() * logs.length)]}</span>`;

        logContainer.appendChild(logEntry);

        // Auto-scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;

        // Limit entries
        if (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.firstChild);
        }

        setTimeout(addLog, 1500 + Math.random() * 3000);
    }
    addLog();

    // --- INTERACTIVE NODES ---
    for (let i = 0; i < 20; i++) {
        const node = document.createElement('div');
        node.className = 'system-node';
        node.style.left = `${Math.random() * 90}%`;
        node.style.top = `${Math.random() * 90}%`;
        node.style.animationDelay = `${Math.random() * 2}s`;

        node.addEventListener('mouseover', () => {
            node.style.background = '#000';
            node.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        });

        node.addEventListener('mouseout', () => {
            node.style.background = 'transparent';
            node.style.boxShadow = 'none';
        });

        nodesContainer.appendChild(node);
    }

    // --- SECRET RITUAL TRACKING ---
    document.addEventListener('secret-ritual', (e) => {
        if (e.detail.type === 'paper_access') {
            const secretEntry = document.createElement('div');
            secretEntry.className = 'log-entry';
            secretEntry.style.color = '#fff';
            secretEntry.style.textShadow = '0 0 5px #fff';
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            secretEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> <span class="log-msg">CRITICAL: Secret Archive Accessed (GJ-TOM-001)</span>`;

            logContainer.appendChild(secretEntry);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    });

    console.log("INFORMATION MACHINE: SYSTEM MONITOR ACTIVE");
}
