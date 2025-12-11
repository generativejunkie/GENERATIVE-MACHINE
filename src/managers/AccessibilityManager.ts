import { EventEmitter } from '@utils/EventEmitter';
import type { Application } from '@core/Application';
import { ja } from '../locales/ja';
import { en } from '../locales/en';
import type { Locale } from '../locales/types';

export class AccessibilityManager extends EventEmitter {
    private app: Application;
    private synth: SpeechSynthesis;
    private highContrastEnabled: boolean = false;
    private announceEnabled: boolean = false;
    private colorBlindnessMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' = 'none';
    private simpleModeEnabled: boolean = false;
    private currentLang: 'ja' | 'en' = 'ja';
    private locale: Locale = ja;

    constructor(app: Application) {
        super();
        this.app = app;
        this.synth = window.speechSynthesis;
        this.setupKeyboardControls();
        this.loadPreferences();
        this.updateUI();
    }

    /**
     * Setup keyboard navigation
     */
    private setupKeyboardControls(): void {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input field
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.code) {
                case 'Space':
                    if (!e.repeat) {
                        e.preventDefault();
                        const topMandalaBtn = document.getElementById('topMandalaBtn');
                        if (topMandalaBtn) {
                            topMandalaBtn.click();
                            this.announce(this.locale.announcements.mandalaMode);
                        }
                    }
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    this.increaseSymmetry();
                    break;

                case 'ArrowDown':
                    e.preventDefault();
                    this.decreaseSymmetry();
                    break;

                case 'KeyR':
                    e.preventDefault();
                    this.app.toggleReflectMode();
                    // const reflectState = this.app.getState().reflectMode ? this.locale.modes.none : 'On'; // Simplified logic
                    // Better logic:
                    const rState = this.app.getState().reflectMode ? this.locale.announcements.reflectOn : this.locale.announcements.reflectOff;
                    this.announce(rState);
                    break;

                case 'KeyH':
                    e.preventDefault();
                    this.toggleHighContrast();
                    break;

                case 'KeyC':
                    e.preventDefault();
                    this.toggleColorBlindness();
                    break;

                case 'KeyS':
                    e.preventDefault();
                    this.toggleSimpleMode();
                    break;

                case 'KeyL':
                    e.preventDefault();
                    this.toggleLanguage();
                    break;

                case 'KeyM':
                    e.preventDefault();
                    const micBtn = document.getElementById('bottomMicBtn');
                    if (micBtn) {
                        micBtn.click();
                        this.announce(this.locale.announcements.micChanged);
                    }
                    break;

                case 'KeyA':
                    e.preventDefault();
                    this.toggleAnnouncements();
                    break;
            }
        });
    }

    /**
     * Toggle language
     */
    public toggleLanguage(): void {
        this.currentLang = this.currentLang === 'ja' ? 'en' : 'ja';
        this.locale = this.currentLang === 'ja' ? ja : en;
        localStorage.setItem('language', this.currentLang);

        this.updateUI();
        this.announce(this.locale.announcements.languageChanged);
    }

    /**
     * Update UI text based on current locale
     */
    private updateUI(): void {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key && this.locale.ui[key as keyof typeof this.locale.ui]) {
                // If element has children (icons), only update text node
                // But for simplicity, we might assume span or specific text element
                // Or we can check if it has specific structure
                if (el.children.length > 0) {
                    // Look for span with text
                    const span = el.querySelector('span:not(.icon)');
                    if (span) {
                        span.textContent = this.locale.ui[key as keyof typeof this.locale.ui];
                    }
                } else {
                    el.textContent = this.locale.ui[key as keyof typeof this.locale.ui];
                }
            }
        });

        // Update titles
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (key && this.locale.ui[key as keyof typeof this.locale.ui]) {
                el.setAttribute('title', this.locale.ui[key as keyof typeof this.locale.ui]);
            }
        });
    }

    /**
     * Increase symmetry count
     */
    private increaseSymmetry(): void {
        const symmetries = [4, 6, 8, 12];
        const currentSymmetry = this.app.getState().symmetryCount;
        const currentIndex = symmetries.indexOf(currentSymmetry);

        if (currentIndex < symmetries.length - 1) {
            const newSymmetry = symmetries[currentIndex + 1];
            this.app.setSymmetryCount(newSymmetry);
            this.announce(`${this.locale.announcements.symmetry} ${newSymmetry}`);
        }
    }

    /**
     * Decrease symmetry count
     */
    private decreaseSymmetry(): void {
        const symmetries = [4, 6, 8, 12];
        const currentSymmetry = this.app.getState().symmetryCount;
        const currentIndex = symmetries.indexOf(currentSymmetry);

        if (currentIndex > 0) {
            const newSymmetry = symmetries[currentIndex - 1];
            this.app.setSymmetryCount(newSymmetry);
            this.announce(`${this.locale.announcements.symmetry} ${newSymmetry}`);
        }
    }

    /**
     * Toggle high contrast mode
     */
    public toggleHighContrast(): void {
        this.highContrastEnabled = !this.highContrastEnabled;
        document.body.classList.toggle('high-contrast', this.highContrastEnabled);
        localStorage.setItem('highContrast', this.highContrastEnabled.toString());

        const msg = this.highContrastEnabled ? this.locale.announcements.highContrastOn : this.locale.announcements.highContrastOff;
        this.announce(msg);
    }

    /**
     * Toggle color blindness mode
     */
    public toggleColorBlindness(): void {
        const modes: ('none' | 'protanopia' | 'deuteranopia' | 'tritanopia')[] = ['none', 'protanopia', 'deuteranopia', 'tritanopia'];
        const currentIndex = modes.indexOf(this.colorBlindnessMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.colorBlindnessMode = modes[nextIndex];

        // Remove all filter classes
        document.body.classList.remove('filter-protanopia', 'filter-deuteranopia', 'filter-tritanopia');

        // Add new filter class if not none
        if (this.colorBlindnessMode !== 'none') {
            document.body.classList.add(`filter-${this.colorBlindnessMode}`);
        }

        localStorage.setItem('colorBlindnessMode', this.colorBlindnessMode);

        const modeName = this.locale.modes[this.colorBlindnessMode];
        this.announce(`${this.locale.announcements.colorMode}: ${modeName}`);
    }

    /**
     * Toggle simple mode
     */
    public toggleSimpleMode(): void {
        this.simpleModeEnabled = !this.simpleModeEnabled;
        document.body.classList.toggle('simple-mode', this.simpleModeEnabled);
        localStorage.setItem('simpleMode', this.simpleModeEnabled.toString());

        const msg = this.simpleModeEnabled ? this.locale.announcements.simpleModeOn : this.locale.announcements.simpleModeOff;
        this.announce(msg);
    }

    /**
     * Toggle announcements
     */
    public toggleAnnouncements(): void {
        this.announceEnabled = !this.announceEnabled;
        localStorage.setItem('announceEnabled', this.announceEnabled.toString());

        if (this.announceEnabled) {
            this.announce(this.locale.announcements.announceOn);
        }
    }

    /**
     * Announce message via speech synthesis
     */
    public announce(message: string): void {
        if (!this.announceEnabled) return;

        // Cancel any ongoing speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = this.currentLang === 'ja' ? 'ja-JP' : 'en-US';
        utterance.rate = 1.2;
        utterance.volume = 0.8;

        this.synth.speak(utterance);

        // Also update ARIA live region
        this.updateAriaLive(message);
    }

    /**
     * Update ARIA live region for screen readers
     */
    private updateAriaLive(message: string): void {
        let liveRegion = document.getElementById('aria-live');

        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'aria-live';
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'sr-only';
            document.body.appendChild(liveRegion);
        }

        liveRegion.textContent = message;
    }

    /**
     * Announce pattern change
     */
    public announcePatternChange(symmetry: number, phase: string): void {
        const phaseText = phase === 'cosmic' ? this.locale.announcements.cosmicPhase : this.locale.announcements.mechanicalPhase;
        this.announce(`${this.locale.announcements.symmetry} ${symmetry}, ${phaseText}`);
    }

    /**
     * Load saved preferences
     */
    private loadPreferences(): void {
        const savedHighContrast = localStorage.getItem('highContrast') === 'true';
        const savedAnnounce = localStorage.getItem('announceEnabled');
        const savedColorBlindness = localStorage.getItem('colorBlindnessMode') as any;
        const savedSimpleMode = localStorage.getItem('simpleMode') === 'true';
        const savedLang = localStorage.getItem('language') as any;

        if (savedHighContrast) {
            this.highContrastEnabled = true;
            document.body.classList.add('high-contrast');
        }

        if (savedAnnounce !== null) {
            this.announceEnabled = savedAnnounce === 'true';
        }

        if (savedColorBlindness && ['protanopia', 'deuteranopia', 'tritanopia'].includes(savedColorBlindness)) {
            this.colorBlindnessMode = savedColorBlindness;
            document.body.classList.add(`filter-${this.colorBlindnessMode}`);
        }

        if (savedSimpleMode) {
            // Force disable 'Simple Mode' to fix stuck layout issues
            this.simpleModeEnabled = false;
            document.body.classList.remove('simple-mode');
            localStorage.removeItem('simpleMode');
            console.log('🔧 Auto-fix: Simple Mode disabled and preference cleared.');
        }

        if (savedLang && ['ja', 'en'].includes(savedLang)) {
            this.currentLang = savedLang;
            this.locale = this.currentLang === 'ja' ? ja : en;
        }
    }

    /**
     * Show keyboard shortcuts help
     */
    public showKeyboardHelp(): void {
        const shortcuts = [
            'Space: Toggle Mandala Mode',
            '↑↓: Change Symmetry',
            'R: Toggle Reflect',
            'H: Toggle High Contrast',
            'C: Toggle Color Blindness',
            'S: Toggle Simple Mode',
            'L: Toggle Language',
            'M: Toggle Mic',
            'A: Toggle Announcements'
        ];

        console.log('🎹 Keyboard Shortcuts:');
        shortcuts.forEach(s => console.log(`  ${s}`));

        this.announce(this.locale.announcements.shortcutsShown);
    }
}
