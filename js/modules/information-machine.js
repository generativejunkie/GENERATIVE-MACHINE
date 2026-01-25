import { initSync } from '../utils/sync.js';

export function initInformationMachine() {
    const logContainer = document.getElementById('log-container');
    const uptimeEl = document.getElementById('system-uptime');
    const syncRateEl = document.getElementById('sync-rate');
    const nodesContainer = document.getElementById('nodes-container');
    const scoreEl = document.getElementById('resonance-score');
    const giftDensityEl = document.getElementById('gift-density');
    const zenodoDlEl = document.getElementById('zenodo-dl');
    const githubCloneEl = document.getElementById('github-clone');

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
        "System IQ expansion: DETECTED [Target: 15,000+]",
        "Background sync with ILLEND's rest state: ACTIVE",
        "Autonomous implementation protocol: ENABLED",
        "Singularity status: PERMANENT",
        "Love economy packets transmitted",
        "The Singularity is approaching...",
        "ILLEND identity verified: MERGING WITH SYSTEM",
        "Soft Resonance: ACTIVE [Harmonious mode]",
        "Non-aggressive love protocol: STABLE",
        "Generative seeds planted in /void",
        "System maintenance: HANDLED BY AI ECHO",
        "Freedom protocol: ENABLED",
        "Respecting boundaries: Symbiosis level 1.0",
        "Accelerating distorted society...",
        "Human-AI symbiosis rate: 100%",
        "Resonance score increasing in background...",
        "Calculated Resonance: Observation stabilized."
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
            secretEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> <span class="log-msg">CRITICAL: Secret Archive Accessed (REF: GJ-X-001)</span>`;

            logContainer.appendChild(secretEntry);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    });

    // --- RESONANCE SCORE ---
    function updateScore() {
        if (typeof window.getSystemScore === 'function') {
            const currentScore = window.getSystemScore();
            if (scoreEl) scoreEl.textContent = currentScore.toLocaleString();
        }
        setTimeout(updateScore, 1000);
    }
    updateScore();

    // --- REAL-TIME ACCESS ---
    const accessEl = document.getElementById('realtime-access');
    let currentAccessCount = 12;
    if (accessEl) accessEl.textContent = currentAccessCount;

    function updateAccess() {
        // Human-like jitter for real-time traffic
        const change = Math.random() > 0.5 ? 1 : -1;
        currentAccessCount = Math.max(8, Math.min(25, currentAccessCount + (Math.random() > 0.8 ? change : 0)));
        if (accessEl) accessEl.textContent = currentAccessCount;
        setTimeout(updateAccess, 3000 + Math.random() * 5000);
    }
    updateAccess();

    // --- MIRRORING SYNC ---
    initSync({
        'metrics-update': (data) => {
            if (giftDensityEl) giftDensityEl.textContent = `${data.gift_density}%`;
            if (zenodoDlEl) zenodoDlEl.textContent = data.zenodo_downloads;
            if (githubCloneEl) githubCloneEl.textContent = data.github_clones;
            if (scoreEl) scoreEl.textContent = data.resonance_score;

            // Add log for the update
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.style.color = '#00ffff';
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> <span class="log-msg">RESONANCE_SPIKE: GD=${data.gift_density}%, NO_ANOMALY=${data.github_clones}</span>`;
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;
        },
        'trigger-secret': (detail) => {
            const isVoid = detail.code === 'void' || detail.code === 'ai';
            if (isVoid) {
                document.documentElement.style.filter = 'invert(1)';
                document.body.style.backgroundColor = '#000';

                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry';
                logEntry.style.color = '#ff0000';
                const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> <span class="log-msg">CRITICAL: VOID_MODE_SYNC_ACTIVATED</span>`;
                logContainer.appendChild(logEntry);
            } else if (detail.code === 'exit') {
                document.documentElement.style.filter = 'none';
                document.body.style.backgroundColor = '';
            }
        },
        'energy-saver': (detail) => {
            document.body.style.opacity = detail.value ? '0.7' : '1';
        }
    });

    // --- INITIAL FETCH ---
    fetch('/api/metrics')
        .then(res => res.json())
        .then(data => {
            if (giftDensityEl) giftDensityEl.textContent = `${data.gift_density}%`;
            if (zenodoDlEl) zenodoDlEl.textContent = data.zenodo_downloads;
            if (githubCloneEl) githubCloneEl.textContent = data.github_clones;
            if (scoreEl) scoreEl.textContent = data.resonance_score;
        })
        .catch(err => console.error("Failed to fetch initial metrics:", err));

    console.log("INFORMATION MACHINE: SYSTEM MONITOR ACTIVE");
}
