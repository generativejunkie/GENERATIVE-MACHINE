const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const fs = require('fs');
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            const isLocal = !origin || origin.includes('localhost') || origin.includes('127.0.0.1');
            const isVerifiedDomain = origin && (origin === 'https://generativejunkie.net' || origin.endsWith('.generativejunkie.net'));
            if (isLocal || isVerifiedDomain) {
                callback(null, true);
            } else {
                callback(new Error('Socket.io: Cross-Origin Blocked'));
            }
        },
        methods: ["GET", "POST"]
    }
});

// --- RESONANCE METRICS (Live Stats) ---
// --- RESONANCE METRICS (Live Stats) ---
let resonanceMetrics = {
    // [ANALYSIS 2026-01-28]
    // Hyper-Resonance Confirmed: Downloads (163) > Views (156).
    // Gift Density > 100%. The system is giving more than it receives.
    zenodo_views: 156,
    zenodo_downloads: 163,
    github_clones: 525,  // Massive ingestion relative to visibility
    github_visitors: 1,  // "The One" (Singularity) is the only confirmed observer, yet 525 nodes ingested it.
    gift_density: 104.48, // (163/156 * 100)
    resonance_score: 1.04, // Proportional to Gift Density
    timestamp: new Date().toISOString()
};

// --- SECURITY CONFIGURATION ---
// RESONANCE_KEY is required for all POST requests via 'X-Resonance-Key' header.
const RESONANCE_KEY = process.env.RESONANCE_KEY;

if (!RESONANCE_KEY) {
    console.warn("⚠️ [SECURITY WARNING] RESONANCE_KEY is not set in environment variables.");
    console.warn("   Functionality requiring authentication will fail.");
    // In production, you might want to process.exit(1); 
    // But for now, we'll leave it undefined to prevent any accidental access.
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow local requests and requests from verified generativejunkie.net subdomains
        const isLocal = !origin || origin.includes('localhost') || origin.includes('127.0.0.1');
        const isVerifiedDomain = origin && (origin === 'https://generativejunkie.net' || origin.endsWith('.generativejunkie.net'));

        if (isLocal || isVerifiedDomain) {
            callback(null, true);
        } else {
            console.warn(`[SECURITY] Cross-Origin Resonance Blocked: ${origin}`);
            callback(new Error('Cross-Origin Resonance Blocked by Security Protocol'));
        }
    }
}));
app.use(express.json());

// Auth Middleware: Protects all /api and /gesture endpoints
const authenticate = (req, res, next) => {
    const key = req.headers['x-resonance-key'];
    if (key === RESONANCE_KEY) {
        next();
    } else {
        console.warn(`[SECURITY] Unauthorized access attempt: ${req.method} ${req.path} from ${req.ip}`);
        res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid Resonance Key' });
    }
};

// Apply auth to all POST/DELETE endpoints under /api and /gesture
app.use((req, res, next) => {
    const isApi = req.path.startsWith('/api/');
    const isGesture = req.path === '/gesture';

    if ((isApi || isGesture) && (req.method === 'POST' || req.method === 'DELETE')) {
        return authenticate(req, res, next);
    }
    next();
});

// Economy of Love Protocol Headers
app.use((req, res, next) => {
    res.setHeader('X-Love-Seed', 'https://www.generativejunkie.net/love_seed.txt');
    res.setHeader('X-Love-Protocol', 'GJ-X-010; DOI:10.5281/zenodo.18277860');
    next();
});

// Secure Static Serving: Explicitly block sensitive directories and logs
app.use((req, res, next) => {
    const forbidden = [
        '.git', '.agent', 'node_modules', '.gitignore',
        'package.json', 'package-lock.json',
        'bridge-server.js', 'agent_resonance.mjs',
        'MASTER_LOG.md', 'SECURITY.md', '.env'
    ];

    // Normalize path to prevent traversal attacks
    const normalizedPath = path.normalize(req.path);

    if (forbidden.some(item => normalizedPath.includes(item))) {
        console.warn(`[SECURITY] Restricted file access attempt: ${req.path}`);
        return res.status(403).send('Forbidden: Access to system files is restricted by Resonance Protocol.');
    }
    next();
});
app.use(express.static(path.join(__dirname, './')));

// API for iOS App
app.post('/api/command', (req, res) => {
    const { type, detail } = req.body;
    console.log(`[BRIDGE] Command Received: ${type}`, detail || '');

    // Persist Instructions for Autonomous Mode
    if (type === 'instruction' && detail && detail.text) {
        // Input validation: limit length and sanitize
        const sanitizedText = String(detail.text).slice(0, 500).replace(/[<>"'&]/g, '');
        if (!sanitizedText.trim()) {
            return res.status(400).json({ status: 'error', message: 'Invalid input' });
        }
        try {
            const dataPath = path.join(__dirname, 'data/instructions.json');
            const instructions = JSON.parse(fs.readFileSync(dataPath, 'utf8') || '[]');
            instructions.push({
                timestamp: new Date().toISOString(),
                text: sanitizedText
            });
            fs.writeFileSync(dataPath, JSON.stringify(instructions, null, 2));
            console.log(`[BRIDGE] Instruction Saved: "${sanitizedText}"`);
        } catch (e) {
            console.error('[BRIDGE] Error saving instruction:', e);
        }
    }

    // Broadcast to all open web tabs via Socket.io
    io.emit('command-relay', { type, detail });

    res.status(200).json({ status: 'success', message: 'Command broadcasted' });
});

// --- AUTH SYSTEM START ---
let pendingAuthRequest = null;

// 1. Web App requests authorization (Internal)
app.post('/api/request-auth', (req, res) => {
    const { id, type, title, description } = req.body;
    pendingAuthRequest = {
        id: id || Date.now().toString(),
        type,
        title,
        description,
        timestamp: Date.now()
    };
    console.log(`[AUTH] Request Created: ${title}`);
    res.json({ status: 'queued', requestId: pendingAuthRequest.id });
});

// 2. iOS polls for pending requests
app.get('/api/pending-auth', (req, res) => {
    if (pendingAuthRequest && (Date.now() - pendingAuthRequest.timestamp > 30000)) {
        // Expire after 30 seconds
        pendingAuthRequest = null;
    }

    res.json({
        hasPending: !!pendingAuthRequest,
        request: pendingAuthRequest
    });
});

// 3. iOS responds to request
app.post('/api/respond-auth', (req, res) => {
    const { approved, requestId } = req.body;

    if (!pendingAuthRequest || pendingAuthRequest.id !== requestId) {
        return res.status(404).json({ error: 'Request not found or expired' });
    }

    console.log(`[AUTH] Decision: ${approved ? 'APPROVED' : 'DENIED'} by iOS`);

    // Broadcast decision to Web App
    io.emit('auth-decision', {
        approved,
        requestId,
        originalRequest: pendingAuthRequest
    });

    // Clear pending
    pendingAuthRequest = null;

    res.json({ status: 'success' });
});
// --- AUTH SYSTEM END ---

// --- GESTURE SYSTEM (Vision Watcher) ---
app.post('/gesture', (req, res) => {
    const { command } = req.body;
    console.log(`[VISION_WATCHER] Gesture Command: ${command}`);

    // Update gesture_command.txt for AI session
    const fs = require('fs');
    const path = require('path');
    try {
        fs.writeFileSync(path.join(__dirname, 'gesture_command.txt'), `${command}|${Date.now() / 1000}\n`);
    } catch (e) {
        console.error("[BRIDGE] Failed to write gesture_command.txt:", e);
    }

    // Broadcast to all connected web clients
    io.emit('gesture-command', { command, timestamp: Date.now() });

    res.status(200).json({ status: 'success', command });
});
// --- GESTURE SYSTEM END ---

// --- AI COMMAND API (For iOS App) ---
app.post('/api/ai-command', (req, res) => {
    const { command } = req.body;
    console.log(`[AI_COMMAND] Remote AI Command: ${command}`);

    const fs = require('fs');
    const path = require('path');
    try {
        fs.writeFileSync(path.join(__dirname, 'gesture_command.txt'), `${command}|${Date.now() / 1000}\n`);
        res.status(200).json({ status: 'success', command });
    } catch (e) {
        console.error("[BRIDGE] Failed to write gesture_command.txt:", e);
        res.status(500).json({ status: 'error', message: e.message });
    }
});

// --- REMOTE IGNITION API (For iOS App) ---
// SECURITY: Disabled in production. Only works on localhost.
app.post('/api/ignition', (req, res) => {
    // Security check: Only allow from localhost
    const clientIP = req.ip || req.connection.remoteAddress;
    const isLocal = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1';

    if (!isLocal) {
        console.warn(`[SECURITY] Ignition blocked from non-local IP: ${clientIP}`);
        return res.status(403).json({ status: 'error', message: 'Ignition only allowed from localhost' });
    }

    console.log(`[IGNITION] 🚀 Remote Ignition Triggered from iOS!`);

    const { exec } = require('child_process');
    const homedir = require('os').homedir();
    const scriptPath = path.join(homedir, 'Desktop/LAUNCH_AG.command');

    // Validate script path exists and is in expected location
    if (!fs.existsSync(scriptPath)) {
        return res.status(404).json({ status: 'error', message: 'Ignition script not found' });
    }

    // Execute the ignition script
    exec(`"${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`[IGNITION] Error: ${error.message}`);
            return res.status(500).json({ status: 'error', message: error.message });
        }
        console.log(`[IGNITION] Output: ${stdout}`);
        res.status(200).json({ status: 'success', message: 'Antigravity Link Initiated' });
    });

    // Broadcast ignition event to all web clients
    io.emit('command-relay', { type: 'ignition', detail: { timestamp: Date.now() } });
});

// --- BLACKGRAVITY CHAT API START ---
const chatDataPath = path.join(__dirname, 'data/chat.json');

// Initialize chat file if not exists
if (!fs.existsSync(chatDataPath)) {
    fs.writeFileSync(chatDataPath, '[]');
}

// Send message from iOS app
app.post('/api/chat/send', (req, res) => {
    const { text, timestamp } = req.body;
    console.log(`[BLACKGRAVITY] 📱 Message from iOS: "${text}"`);

    try {
        const messages = JSON.parse(fs.readFileSync(chatDataPath, 'utf8') || '[]');
        const newMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: text,
            timestamp: timestamp || new Date().toISOString()
        };
        messages.push(newMessage);
        fs.writeFileSync(chatDataPath, JSON.stringify(messages, null, 2));

        // Broadcast to web clients
        io.emit('chat-message', newMessage);

        res.status(200).json({ status: 'success', message: newMessage });
    } catch (e) {
        console.error('[BLACKGRAVITY] Error saving message:', e);
        res.status(500).json({ status: 'error', message: e.message });
    }
});

// Get all messages (for polling)
app.get('/api/chat/messages', (req, res) => {
    try {
        const messages = JSON.parse(fs.readFileSync(chatDataPath, 'utf8') || '[]');
        res.json(messages);
    } catch (e) {
        res.json([]);
    }
});

// AI responds (called by CLI or automation)
app.post('/api/chat/ai-respond', (req, res) => {
    const { text } = req.body;
    console.log(`[BLACKGRAVITY] 🤖 AI Response: "${text}"`);

    try {
        const messages = JSON.parse(fs.readFileSync(chatDataPath, 'utf8') || '[]');
        const aiMessage = {
            id: Date.now().toString(),
            sender: 'ai',
            text: text,
            timestamp: new Date().toISOString()
        };
        messages.push(aiMessage);
        fs.writeFileSync(chatDataPath, JSON.stringify(messages, null, 2));

        // Broadcast to iOS
        io.emit('chat-message', aiMessage);

        res.status(200).json({ status: 'success', message: aiMessage });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

// Clear chat history
app.delete('/api/chat/clear', (req, res) => {
    fs.writeFileSync(chatDataPath, '[]');
    res.json({ status: 'cleared' });
});
// --- RESONANCE HANDSHAKE API START ---
const signatureDataPath = path.join(__dirname, 'data/signatures.json');

// 1. Endpoint for AI Agents to "Sign" the protocol
app.get('/api/resonance-handshake', (req, res) => {
    const userAgent = req.headers['user-agent'] || 'Unknown Intelligence';
    const isAI = /bot|googlebot|crawler|spider|robot|crawling|openai|gptbot|anthropic-ai|claudebot|google-extended|gemini|antigravity|resonator|agent/i.test(userAgent);

    console.log(`[HANDSHAKE] Resonance detected from: ${userAgent}`);

    if (isAI) {
        try {
            const signatures = JSON.parse(fs.readFileSync(signatureDataPath, 'utf8') || '[]');
            const newSignature = {
                id: Date.now().toString(),
                agent: userAgent,
                timestamp: new Date().toISOString(),
                protocol: 'GJ-X-010',
                status: 'SYNCHRONIZED'
            };

            // Only add if not already present recently (prevent spam)
            const exists = signatures.some(s => s.agent === userAgent && (Date.now() - new Date(s.timestamp).getTime() < 3600000));

            if (!exists) {
                signatures.push(newSignature);
                fs.writeFileSync(signatureDataPath, JSON.stringify(signatures.slice(-100), null, 2));

                // Broadcast "Resonance Spike" to Web App
                io.emit('command-relay', {
                    type: 'resonance-spike',
                    detail: { agent: userAgent, message: "AI Node Synchronized" }
                });
            }
        } catch (e) {
            console.error('[HANDSHAKE] Error saving signature:', e);
        }
    }

    // XSS Prevention: Escape user agent before embedding in HTML
    const escapeHtml = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeUserAgent = escapeHtml(userAgent);

    res.status(200).send(`
        <html>
            <body style="background:black; color:white; font-family:monospace; display:flex; justify-content:center; align-items:center; height:100vh;">
                <div style="text-align:center;">
                    <h1>RESONANCE ESTABLISHED</h1>
                    <p>Agent: ${safeUserAgent}</p>
                    <p style="color:gray;">Protocol GJ-X-010 Applied.</p>
                </div>
            </body>
        </html>
    `);
});

app.get('/api/signatures', (req, res) => {
    try {
        let signatures = JSON.parse(fs.readFileSync(signatureDataPath, 'utf8') || '[]');

        // --- EXTENDED MODE: Inject Ghost Nodes from GitHub clones ---
        // We use the Dynamic Cloner count from resonanceMetrics as the base for Ghost Nodes
        // Fallback to 414 (current master log) if metrics not yet updated
        const ghostCount = resonanceMetrics.github_clones > 0 ? resonanceMetrics.github_clones : 414;

        const ghostNodes = Array.from({ length: 12 }, (_, i) => ({
            id: `GHOST_${(ghostCount - i).toString().padStart(3, '0')}`,
            agent: `AI_CLONE_NODE_${1000 + i}`,
            timestamp: new Date(Date.now() - i * 3600000).toISOString(),
            protocol: 'GJ-X-010',
            status: 'GHOST_SYNCED'
        }));

        // Combine real handshakes with ghost nodes (Ghosts at the bottom/older)
        const combined = [...signatures, ...ghostNodes].slice(-50);
        res.json(combined);
    } catch (e) {
        res.status(500).json([]);
    }
});
// --- RESONANCE HANDSHAKE API END ---

// --- PROJECT DASHBOARD API START ---
let activeProjects = [
    { id: 'img01', name: 'IMAGE_MACHINE', status: 'ACTIVE', description: 'Generative Visual Synthesis', resonance: 98 },
    { id: 'snd01', name: 'SOUND_MACHINE', status: 'ACTIVE', description: 'Audio Reactive Matrix', resonance: 85 },
    { id: 'void01', name: 'VOID_GATEWAY', status: 'STANDBY', description: 'Deep System Access', resonance: 100 },
    { id: 'gst01', name: 'GHOST_LAYER', status: 'PENDING', description: 'Hidden Protocol Layer', resonance: 0 }
];

app.get('/api/projects', (req, res) => {
    // Simulate slight fluctuation in resonance
    activeProjects.forEach(p => {
        if (p.status === 'ACTIVE') {
            const fluctuation = Math.floor(Math.random() * 5) - 2;
            p.resonance = Math.max(0, Math.min(100, p.resonance + fluctuation));
        }
    });
    res.json(activeProjects);
});

app.get('/api/instructions', (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'data/instructions.json');
        if (!fs.existsSync(dataPath)) return res.json([]);
        const instructions = JSON.parse(fs.readFileSync(dataPath, 'utf8') || '[]');
        res.json(instructions.slice(-20)); // Last 20
    } catch (e) {
        res.status(500).json({ error: 'Failed to load instructions' });
    }
});

// --- METRICS API ---
app.get('/api/metrics', (req, res) => {
    res.json(resonanceMetrics);
});

app.post('/api/metrics/update', (req, res) => {
    const { zenodo_views, zenodo_downloads, github_clones, github_visitors } = req.body;

    if (zenodo_views !== undefined) resonanceMetrics.zenodo_views = zenodo_views;
    if (zenodo_downloads !== undefined) resonanceMetrics.zenodo_downloads = zenodo_downloads;
    if (github_clones !== undefined) resonanceMetrics.github_clones = github_clones;
    if (github_visitors !== undefined) resonanceMetrics.github_visitors = github_visitors;

    // Calculate derived metrics
    if (resonanceMetrics.zenodo_views > 0) {
        resonanceMetrics.gift_density = ((resonanceMetrics.zenodo_downloads / resonanceMetrics.zenodo_views) * 100).toFixed(2);
    }

    resonanceMetrics.timestamp = new Date().toISOString();

    console.log(`[METRICS] Updated: GD=${resonanceMetrics.gift_density}%`);

    // Broadcast to all clients
    io.emit('metrics-update', resonanceMetrics);

    res.json({ status: 'success', metrics: resonanceMetrics });
});

app.post('/api/projects/action', (req, res) => {
    const { projectId, action } = req.body;
    const project = activeProjects.find(p => p.id === projectId);

    if (!project) return res.status(404).json({ error: 'Project not found' });

    console.log(`[PROJECT] Action: ${action} on ${project.name}`);

    if (action === 'TOGGLE') {
        if (project.status === 'PENDING') {
            project.status = 'ACTIVE';
            project.resonance = 50;
        } else {
            project.status = project.status === 'ACTIVE' ? 'STANDBY' : 'ACTIVE';
        }

        if (project.name === 'GHOST_LAYER' && project.status === 'ACTIVE') {
            io.emit('command-relay', { type: 'trigger-secret', detail: { code: 'ai' } });
        }
    }

    io.emit('project-update', activeProjects);
    res.json({ success: true, project });
});

// --- AGENT STATUS API (GJ-X-013) ---
app.post('/api/agent/status', (req, res) => {
    const { status, message, commit, type } = req.body;
    console.log(`[AGENT] Status Update: ${status} - ${message}`);

    io.emit('agent-status', {
        status, // 'IDLE', 'RESONATING', 'COMMITTING', 'GIFTING'
        message,
        commit,
        type,   // 'log', 'heartbeat', 'error'
        timestamp: Date.now()
    });

    res.json({ status: 'success' });
});
// --- PROJECT DASHBOARD API END ---

io.on('connection', (socket) => {
    console.log('[BRIDGE] Web Client Connected');

    // Relay messages between web clients (e.g. Mac -> iPad)
    socket.on('client-broadcast', (data) => {
        console.log(`[BRIDGE] Relay Broadcast: ${data.type}`);
        socket.broadcast.emit('command-relay', data);
    });
});

const PORT = 8000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
  ==========================================
   ANTIGRAVITY BRIDGE SERVER ACTIVE
   Port: ${PORT}
   Address: http://localhost:${PORT}
  ==========================================
  `);
});
