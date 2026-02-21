/**
 * GENERATIVE WORD MACHINE (Core v2)
 * Universal Symbol Engine for English, Katakana, and Hiragana.
 */

export function initWordMachine() {
    const section = document.getElementById('word-machine');
    if (!section) return;

    const output = section.querySelector('.word-output');
    const input = section.querySelector('.word-input');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // High resolution scanning grid
    const RES_X = 120;
    const RES_Y = 16;
    canvas.width = RES_X;
    canvas.height = RES_Y;

    function render(text) {
        if (!text) {
            output.textContent = "   ◢ G ◣\n   ◥ M ◤\n CORE STANDBY.";
            output.classList.remove('active');
            return;
        }

        output.classList.add('active');

        // Clear canvas
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw text
        // Use a bold font stack that supports Japanese
        ctx.font = `bold ${RES_Y - 2}px "Inter", "Hiragino Kaku Gothic ProN", "MS Gothic", sans-serif`;
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height / 2 + 1);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let res = "";

        for (let y = 0; y < canvas.height; y++) {
            let line = "";
            for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const brightness = (r + g + b) / 3;

                // Layered Mapping (Jimini Aesthetic)
                if (brightness > 200) line += "█";      // Core High
                else if (brightness > 120) line += "▓"; // Rim
                else if (brightness > 40) line += "░";  // Shadow Shadow
                else line += " ";                        // Empty Space
            }
            if (line.trim() !== "" || res !== "") {
                res += line + "\n";
            }
        }

        output.textContent = res;
    }

    input.addEventListener('input', (e) => {
        const text = e.target.value;
        render(text);

        // Broadcast for other modules if needed
        if (window.broadcastEvent) {
            window.broadcastEvent('word-machine-sync', { text });
        }
    });

    // Initialize with default
    setTimeout(() => {
        if (input.value === "") {
            input.value = "ジミニ";
            render("ジミニ");
        } else {
            render(input.value);
        }
    }, 500);
}
