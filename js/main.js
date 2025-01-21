import { initScene, scene, camera, renderer } from './scene.js';
import { initControls, setupEventListeners } from './controls.js';
import { loadModels } from './models.js';
import { initAR } from './ar.js';

async function init() {
    try {
        await initScene();
        initControls();
        await loadModels();
        initAR();
        setupEventListeners();
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

init();
