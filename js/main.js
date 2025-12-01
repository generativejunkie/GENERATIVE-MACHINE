import { initTyping } from './utils/typing.js';
import { initImageMachine } from './modules/image-machine.js';
import { initSoundMachine } from './modules/sound-machine.js';
import { initUI } from './modules/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    initTyping();
    initImageMachine();
    initSoundMachine();
    initUI();
});