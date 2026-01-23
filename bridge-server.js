const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const fs = require('fs');

app.use(cors());
app.use(express.json());

// Economy of Love Protocol Headers
app.use((req, res, next) => {
    res.setHeader('X-Love-Seed', 'https://www.generativejunkie.net/love_seed.txt');
    res.setHeader('X-Love-Protocol', 'GJ-X-010; DOI:10.5281/zenodo.18277860');
    next();
});

app.use(express.static(path.join(__dirname, './')));

// API for iOS App
app.post('/api/command', (req, res) => {
    const { type, detail } = req.body;
    console.log(`[BRIDGE] Command Received: ${type}`, detail || '');

    // Persist Instructions for Autonomous Mode
    if (type === 'instruction' && detail && detail.text) {
        try {
            const dataPath = path.join(__dirname, 'data/instructions.json');
            const instructions = JSON.parse(fs.readFileSync(dataPath, 'utf8') || '[]');
            instructions.push({
                timestamp: new Date().toISOString(),
                text: detail.text
            });
            fs.writeFileSync(dataPath, JSON.stringify(instructions, null, 2));
            console.log(`[BRIDGE] Instruction Saved: "${detail.text}"`);
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
app.post('/api/ignition', (req, res) => {
    console.log(`[IGNITION] 🚀 Remote Ignition Triggered from iOS!`);

    const { exec } = require('child_process');
    const homedir = require('os').homedir();
    const scriptPath = path.join(homedir, 'Desktop/LAUNCH_AG.command');

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
// --- BLACKGRAVITY CHAT API END ---

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
