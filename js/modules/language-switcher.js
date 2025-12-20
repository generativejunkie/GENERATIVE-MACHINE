// Language switcher module
import { detectLanguage, TRANSLATIONS } from '../data/translations.js';

// Apply translations to the entire site
export function applyTranslations() {
    const lang = detectLanguage();

    // Hero section
    applyHeroTranslations(lang);

    // Section descriptions
    applySectionTranslations(lang);

    // Navigation
    applyNavTranslations(lang);

    // Stats/Controls
    applyStatsTranslations(lang);

    console.log(`Language set to: ${lang === 'ja' ? 'Japanese' : 'English'}`);
}

function applyHeroTranslations(lang) {
    const descText = document.getElementById('description-text');
    if (descText) {
        descText.textContent = TRANSLATIONS.hero.description[lang];
    }
}

function applySectionTranslations(lang) {
    // Image Machine
    const imageMachineDesc = document.getElementById('image-desc-text');
    if (imageMachineDesc) {
        imageMachineDesc.textContent = TRANSLATIONS.sections.imagemachine.description[lang];
    }

    // Sound Machine
    const soundMachineDesc = document.getElementById('sound-desc-text');
    if (soundMachineDesc) {
        soundMachineDesc.textContent = TRANSLATIONS.sections.soundmachine.description[lang];
    }

    // Store
    const storeTitle = document.querySelector('.store-card-title');
    if (storeTitle) {
        storeTitle.textContent = TRANSLATIONS.sections.store.card.title[lang];
    }

    const storeDesc = document.querySelector('.store-card-description');
    if (storeDesc) {
        storeDesc.textContent = TRANSLATIONS.sections.store.card.description[lang];
    }

    const storeButton = document.querySelector('.store-card-button');
    if (storeButton) {
        storeButton.textContent = TRANSLATIONS.sections.store.card.button[lang];
    }

    // About section description
    const aboutElements = document.querySelectorAll('.section-description');
    if (aboutElements.length >= 4) { // About is the 4th section
        const aboutDesc = aboutElements[3].querySelector('.typing-text');
        if (aboutDesc) {
            aboutDesc.textContent = TRANSLATIONS.sections.about.description[lang];
        }
    }
}

function applyNavTranslations(lang) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === '#image-machine') {
            link.textContent = TRANSLATIONS.nav.imagemachine[lang];
        } else if (href === '#sound-machine') {
            link.textContent = TRANSLATIONS.nav.soundmachine[lang];
        } else if (href === '#store') {
            link.textContent = TRANSLATIONS.nav.store[lang];
        } else if (href === '#about') {
            link.textContent = TRANSLATIONS.nav.about[lang];
        }
    });
}

function applyStatsTranslations(lang) {
    const statItems = document.querySelectorAll('.machine-stat-item');
    if (statItems.length >= 4) {
        statItems[0].textContent = TRANSLATIONS.sections.imagemachine.stats.clickTap[lang];
        statItems[1].textContent = TRANSLATIONS.sections.imagemachine.stats.space[lang];
        statItems[2].textContent = TRANSLATIONS.sections.imagemachine.stats.images[lang];
        statItems[3].textContent = TRANSLATIONS.sections.imagemachine.stats.effects[lang];
    }
}

// Initialize on page load
export function initLanguage() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyTranslations);
    } else {
        applyTranslations();
    }
}
