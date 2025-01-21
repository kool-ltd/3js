import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

export let scene, camera, renderer;

export async function initScene() {
    // Initialize scene
    scene = new THREE.Scene();

    // Initialize camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0.3, 0.5);

    // Initialize renderer with modified settings
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        premultipliedAlpha: false,
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: true
    });
    renderer.setClearColor(0x000000, 0); // Set clear color with 0 alpha
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true;
    document.getElementById('scene-container').appendChild(renderer.domElement);

    // Setup lighting
    setupLighting();

    // Setup environment only for non-AR mode
    if (!renderer.xr.isPresenting) {
        await setupEnvironment();
    }

    // Set animation loop
    renderer.setAnimationLoop(render);
}

function setupLighting() {
    // Subtle ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
    
    // Main key light matching studio setup
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.5);
    keyLight.position.set(3, 4, 2);
    scene.add(keyLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.2);
    fillLight.position.set(-2, 3, -2);
    scene.add(fillLight);
    
    // Ground bounce light
    const bounceLight = new THREE.DirectionalLight(0xffffff, 0.1);
    bounceLight.position.set(0, -3, 0);
    scene.add(bounceLight);
}

async function setupEnvironment(environmentIntensity = 0.8) {
    const rgbeLoader = new RGBELoader();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    try {
        const texture = await new Promise((resolve, reject) => {
            rgbeLoader.setDataType(THREE.HalfFloatType)
                .load(
                    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/brown_photostudio_02_2k.hdr',  // Using HDR instead of EXR
                    (texture) => {
                        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
                        
                        // Apply environment map and intensity
                        scene.environment = envMap;
                        scene.envMapIntensity = environmentIntensity;
                        
                        // Update materials
                        scene.traverse((object) => {
                            if (object.material) {
                                if (object.material.envMapIntensity !== undefined) {
                                    object.material.envMapIntensity = environmentIntensity;
                                }
                                if (object.material.roughness !== undefined) {
                                    object.material.roughness = Math.max(0.15, object.material.roughness);
                                }
                                if (object.material.metalness !== undefined) {
                                    object.material.metalness = Math.min(0.85, object.material.metalness);
                                }
                                object.material.needsUpdate = true;
                            }
                        });

                        // Set neutral background
                        if (!renderer.xr.isPresenting) {
                            scene.background = new THREE.Color(0x2a2a2a);
                        }
                        
                        texture.dispose();
                        pmremGenerator.dispose();
                        resolve(texture);
                    },
                    undefined,
                    reject
                );
        });
    } catch (error) {
        console.error('Error loading environment map:', error);
    }
}

function render(timestamp, frame) {
    if (!scene || !camera || !renderer) return;

    // Clear background in AR mode
    if (renderer.xr.isPresenting) {
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
    }

    try {
        renderer.render(scene, camera);
    } catch (error) {
        console.error('Render error:', error);
    }
}

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});
