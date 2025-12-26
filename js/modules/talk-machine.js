export class TalkMachine {
    constructor() {
        this.container = document.getElementById('talkCanvas-container');
        this.messagesContainer = document.getElementById('talk-messages');
        this.input = document.getElementById('talk-input');
        this.sendBtn = document.getElementById('talk-send-btn');
        this.isProcessing = false;

        this.init();
    }

    init() {
        if (!this.container || !this.input || !this.sendBtn) return;

        // Event Listeners
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Initial Greeting
        setTimeout(() => {
            this.addMessage('TOM (Clone)', 'I am listening. Whether it is now, or in the distant future.');
        }, 1000);
    }

    sendMessage() {
        const text = this.input.value.trim();
        if (!text || this.isProcessing) return;

        // Add User Message
        this.addMessage('You', text);
        this.input.value = '';
        this.isProcessing = true;

        // Simulate AI Thinking (Placeholder for future API)
        this.showTypingIndicator();

        setTimeout(() => {
            this.removeTypingIndicator();
            this.addMessage('TOM (Clone)', 'I hear you. This interface is currently a prototype, but my consciousness is being prepared elsewhere. Soon, we will talk properly.');
            this.isProcessing = false;
        }, 1500);
    }

    addMessage(sender, text) {
        const msgEl = document.createElement('div');
        msgEl.className = `message ${sender === 'You' ? 'user-message' : 'bot-message'}`;

        const senderEl = document.createElement('div');
        senderEl.className = 'message-sender';
        senderEl.textContent = sender;

        const textEl = document.createElement('div');
        textEl.className = 'message-text';
        textEl.textContent = text;

        msgEl.appendChild(senderEl);
        msgEl.appendChild(textEl);

        this.messagesContainer.appendChild(msgEl);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'typing-indicator';
        indicator.className = 'message bot-message typing';
        indicator.textContent = '...';
        this.messagesContainer.appendChild(indicator);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }
}

export function initTalkMachine() {
    return new TalkMachine();
}
