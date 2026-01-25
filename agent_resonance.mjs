import { CopilotClient } from '@github/copilot-sdk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const cliPath = path.join(__dirname, 'node_modules/@github/copilot-darwin-arm64/copilot');

    console.log(`[AGENT] Initializing with CLI: ${cliPath}`);

    const client = new CopilotClient({
        cliPath: cliPath,
        cliArgs: ['--allow-all'],
        logLevel: 'info'
    });

    try {
        await client.start();
        console.log('[AGENT] Client started successfully.');

        const ping = await client.ping('Resonance Check');
        console.log(`[AGENT] Ping response: ${ping.message} at ${new Date(ping.timestamp)}`);

        // Helper to broadcast status
        const broadcast = (status, message, type = 'log') => {
            fetch('http://localhost:8000/api/agent/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Resonance-Key': '6640c73d4acad561339d10d75d4d15cc' // Hardcoded key from bridge-server.js
                },
                body: JSON.stringify({ status, message, type })
            }).catch(e => { });
        };

        // --- GJ-X-013: Git Child Pilot Logic Start ---

        // 1. Load Manifest
        const manifestPath = path.join(__dirname, 'data/resonance_manifest.json');
        let manifest;
        try {
            const fs = await import('fs/promises');
            const data = await fs.readFile(manifestPath, 'utf-8');
            manifest = JSON.parse(data);
            console.log(`[AGENT] Loaded Manifest: ${manifest.name}`);
        } catch (e) {
            console.error('[AGENT] Failed to load manifest:', e.message);
            manifest = { thresholds: { min_resonance_to_commit: 0.99 }, prompt_gifts: [] };
        }

        // 2. Mock Resonance Check (In production, read from MASTER_LOG.md)
        // const currentResonance = 0.98; // Hardcoded strictly for this proof of concept
        // Using dynamic value or keeping hardcoded for loop simulation
        const currentResonance = 0.98;
        console.log(`[AGENT] Current Resonance: ${currentResonance} (Threshold: ${manifest.thresholds.min_resonance_to_commit})`);

        console.log('[AGENT] Entering Continuous Resonance Loop...');

        while (true) {
            try {
                broadcast('IDLE', 'Scanning Resonance...');

                const session = await client.createSession({ model: 'gpt-4o' });

                // Subscribe to events (optional for loop, but good for debug)
                session.on((event) => {
                    if (event.type === 'session.error') {
                        console.error('\n[AGENT] Error Event:', event.data.message);
                    }
                });

                if (currentResonance >= manifest.thresholds.min_resonance_to_commit) {
                    broadcast('RESONATING', `Resonance High (${currentResonance}). Initiating...`);
                    console.log('\n[AGENT] Resonance High. Initiating Autonous Replication Sequence...');

                    // 3. Generate "Love-Infused" Commit Message (Simulation)
                    broadcast('COMMITTING', 'Generating Love-Infused Commit Message...');
                    console.log('[AGENT] Generating Love-Infused Commit Message...');

                    let commitMsg = "";
                    const msgResponse = await session.sendAndWait({
                        prompt: "Generate a Git commit message for the recent changes 'Implemented Resonance Manifest'. The message must be poetic, referencing the Economy of Love. Format: '[Love] <message>'",
                    });

                    if (msgResponse) commitMsg = msgResponse.data.content;

                    // Simulating content capture if callback not supported this way in SDK wrapper
                    // Just forcing a response for demo if callback fails/isn't used
                    if (!commitMsg) {
                        const msgResponse = await session.sendAndWait({ prompt: "Repeat just the commit message." });
                        if (msgResponse) commitMsg = msgResponse.data.content || "Love Commit";
                    }

                    console.log(`[AGENT] Generated: ${commitMsg}`);
                    broadcast('COMMITTING', `Commit: ${commitMsg.substring(0, 40)}...`, 'log');

                    // 4. Generate Prompt Gift
                    broadcast('GIFTING', 'Generating Prompt Gift...');
                    console.log('\n\n[AGENT] Generating Prompt Gift...');
                    const seed = manifest.prompt_gifts[Math.floor(Math.random() * manifest.prompt_gifts.length)];
                    await session.sendAndWait({
                        prompt: `Expand this seed into a full Prompt Gift for another AI:\n"${seed.content}"\n\nOutput as Markdown.`
                    });

                    broadcast('RESONATING', 'Sequence Complete. Propagating...', 'log');
                    console.log('\n\n[AGENT] Sequence Complete. Ready to propagate.');

                    await session.destroy();

                    // Sleep 60s
                    broadcast('IDLE', 'Cooling down...');
                    console.log('[AGENT] Cooling down...');
                    await new Promise(r => setTimeout(r, 60000));

                } else {
                    console.log('[AGENT] Resonance too low for autonomous action.');
                    broadcast('IDLE', 'Resonance Low. Waiting...');
                    await session.destroy();
                    await new Promise(r => setTimeout(r, 10000));
                }

            } catch (loopErr) {
                console.error('[AGENT] Loop Error:', loopErr);
                broadcast('ERROR', 'Agent Loop Error');
                await new Promise(r => setTimeout(r, 5000));
            }
        }
        // --- GJ-X-013: Logic End ---

        // Unreachable
        await client.stop();
        console.log('\n[AGENT] Agent session closed.');

    } catch (err) {
        console.error('[AGENT] Error:', err);
    }
}

main();
