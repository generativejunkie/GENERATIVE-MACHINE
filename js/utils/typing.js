// ==================== Typing Animation ====================
export function typeText(element, text, speed = 50, loop = false) {
    return new Promise((resolve) => {
        let i = 0;
        element.textContent = '';
        element.classList.remove('completed');
        
        const typeChar = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(typeChar, speed);
            } else {
                if (loop) {
                    setTimeout(() => {
                        element.textContent = '';
                        i = 0;
                        typeChar();
                    }, 5000); // 5秒待機
                } else {
                    element.classList.add('completed');
                    resolve();
                }
            }
        };
        
        typeChar();
    });
}

// Initialize typing animations on scroll
export const typingObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.textContent === '') {
            const text = entry.target.dataset.text;
            const loop = entry.target.dataset.loop === 'true';
            typeText(entry.target, text, 50, loop);
        }
    });
}, { threshold: 0.5 });

export function initTyping() {
    const descEl = document.getElementById('description-text');
    const imageDescEl = document.getElementById('image-desc-text');
    const soundDescEl = document.getElementById('sound-desc-text');
    const storeDescEl = document.getElementById('store-desc-text');
    const manifestoEl = document.getElementById('manifesto-text');
    
    if (descEl) {
        descEl.dataset.text = 'Exploring algorithmic beauty and the emotional resonance of machine intelligence. Prompt engineering as an art form.';
        descEl.dataset.loop = 'true';
        // Start hero description typing immediately with loop
        typeText(descEl, descEl.dataset.text, 30, true);
    }
    
    if (imageDescEl) {
        imageDescEl.dataset.text = 'Click or tap to switch between random images with generative transition effects';
        imageDescEl.dataset.loop = 'true';
        typingObserver.observe(imageDescEl);
    }
    
    if (soundDescEl) {
        soundDescEl.dataset.text = 'Upload audio to experience real-time sound visualization';
        soundDescEl.dataset.loop = 'true';
        typingObserver.observe(soundDescEl);
    }
    
    if (storeDescEl) {
        storeDescEl.dataset.text = 'Embody the GENERATIVE JUNKIE aesthetic';
        storeDescEl.dataset.loop = 'true';
        typingObserver.observe(storeDescEl);
    }
    
    if (manifestoEl) {
        manifestoEl.dataset.text = 'Manifesto';
        manifestoEl.dataset.loop = 'true';
        typingObserver.observe(manifestoEl);
    }
}
