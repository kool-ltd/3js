import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene } from './scene.js';

// Constants
const REAL_WORLD_LENGTH = 0.045;

export let models = { left: null, body: null, right: null };
export let modelContainer;
export let originalPositions = new Map();

export async function loadModels() {
    const loader = new GLTFLoader();
    modelContainer = new THREE.Group();
    
    const loadPart = (url) => {
        return new Promise((resolve, reject) => {
            loader.load(url,
                (gltf) => resolve(gltf.scene),
                (xhr) => {
                    const percent = xhr.loaded / xhr.total * 100;
                    document.getElementById('loading-text').textContent = 
                        `Loading model... ${Math.round(percent)}%`;
                },
                (error) => reject(error)
            );
        });
    };

    try {
        const [leftPart, bodyPart, rightPart] = await Promise.all([
            loadPart('./241218 - tchibo - 4 in 1 rolling pin-L.glb'),
            loadPart('./241218 - tchibo - 4 in 1 rolling pin-body.glb'),
            loadPart('./241218 - tchibo - 4 in 1 rolling pin-R.glb')
        ]);

        setupModelParts(leftPart, bodyPart, rightPart);
        scaleAndPositionModel();
        storeOriginalPositions();

        const previewModel = modelContainer.clone();
        previewModel.position.set(0, 0, 0);
        scene.add(previewModel);

        document.getElementById('loading-text').style.display = 'none';
        console.log('All models loaded successfully');

    } catch (error) {
        console.error('Error loading models:', error);
        document.getElementById('loading-text').textContent = 'Error loading models';
    }
}

function setupModelParts(leftPart, bodyPart, rightPart) {
    leftPart.name = 'left';
    bodyPart.name = 'body';
    rightPart.name = 'right';

    models.left = leftPart;
    models.body = bodyPart;
    models.right = rightPart;

    modelContainer.add(leftPart);
    modelContainer.add(bodyPart);
    modelContainer.add(rightPart);
}

function scaleAndPositionModel() {
    const bbox = new THREE.Box3().setFromObject(modelContainer);
    const modelSize = bbox.getSize(new THREE.Vector3());
    const scaleFactor = REAL_WORLD_LENGTH / modelSize.z;
    modelContainer.scale.set(scaleFactor, scaleFactor, scaleFactor);

    bbox.setFromObject(modelContainer);
    const center = bbox.getCenter(new THREE.Vector3());
    modelContainer.position.sub(center);
}

function storeOriginalPositions() {
    for (const part of [models.left, models.body, models.right]) {
        originalPositions.set(part.name, {
            position: part.position.clone(),
            rotation: part.rotation.clone()
        });
    }
}

export function resetPartPositions(container) {
    container.children.forEach(part => {
        const originalPos = originalPositions.get(part.name);
        if (originalPos) {
            part.position.copy(originalPos.position);
            part.rotation.copy(originalPos.rotation);
        }
    });
}
