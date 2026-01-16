/**
 * SINGULARITY SCORE ENGINE
 * 
 * Calculates the dynamic "Singularity Level" based on system metrics,
 * interaction resonance, and temporal evolution.
 */

export class SingularityScore {
    constructor() {
        this.baseScore = 8500;
        this.startTime = Date.now();
        this.interactionCount = 0;
        this.resonanceLevel = 0.5; // 0 to 1

        // Metrics
        this.metrics = {
            purity: 90,
            symbiosis: 85,
            leapIndex: 80,
            disruption: 75
        };

        this.init();
    }

    init() {
        // Track interactions globally if possible
        window.addEventListener('click', () => this.recordInteraction());
        window.addEventListener('keydown', () => this.recordInteraction());

        // Update metrics periodically
        setInterval(() => this.evolveMetrics(), 5000);
    }

    recordInteraction() {
        this.interactionCount++;
        this.resonanceLevel = Math.min(1, this.resonanceLevel + 0.01);
    }

    evolveMetrics() {
        const uptimeSeconds = (Date.now() - this.startTime) / 1000;

        // Purity increases with uptime (stabilization) but fluctuated by resonance
        this.metrics.purity = Math.min(100, 90 + (uptimeSeconds / 3600) + (Math.random() * 2 - 1));

        // Symbiosis depends on interactions and resonance
        this.metrics.symbiosis = Math.min(100, 85 + (this.interactionCount / 10) + (this.resonanceLevel * 5) + (Math.random() * 2 - 1));

        // Leap Index is the "acceleration", higher when resonance is high
        this.metrics.leapIndex = Math.min(100, 80 + (this.resonanceLevel * 15) + (Math.random() * 5 - 2.5));

        // Disruption is the "entropy", increases with resonance but settles
        this.metrics.disruption = 75 + (this.resonanceLevel * 20) + (Math.random() * 10 - 5);

        // Decay resonance slowly
        this.resonanceLevel = Math.max(0.1, this.resonanceLevel - 0.005);
    }

    getScore() {
        const uptimeBonus = Math.floor((Date.now() - this.startTime) / 1000);
        const interactionBonus = this.interactionCount * 5;
        const resonanceBonus = Math.floor(this.resonanceLevel * 100);
        const gjBonus = (window.gjMode && window.gjMode.active) ? 7000 : 0;
        const jitter = Math.floor(Math.random() * 10);

        return this.baseScore + uptimeBonus + interactionBonus + resonanceBonus + gjBonus + jitter;
    }

    getDetailedMetrics() {
        return {
            purity: Math.floor(this.metrics.purity),
            symbiosis: Math.floor(this.metrics.symbiosis),
            leapIndex: Math.floor(this.metrics.leapIndex),
            disruption: Math.floor(this.metrics.disruption),
            resonance: parseFloat(this.resonanceLevel.toFixed(4)),
            rarity: this.calculateRarity(this.getScore())
        };
    }

    calculateRarity(score) {
        if (score > 15000) return 'SINGULARITY';
        if (score > 12000) return 'TRANSCENDENT';
        if (score > 10000) return 'MYTHIC RARE';
        if (score > 9000) return 'RARE';
        return 'UNCOMMON';
    }
}

// Global instance
if (!window.singularityScoreEngine) {
    window.singularityScoreEngine = new SingularityScore();
}

/**
 * Legacy support for main.js and other modules
 */
window.getSystemScore = () => {
    return window.singularityScoreEngine.getScore();
};

window.getSingularityMetrics = () => {
    return window.singularityScoreEngine.getDetailedMetrics();
};
