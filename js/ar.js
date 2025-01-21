import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { scene, renderer } from './scene.js';
import { modelContainer } from './models.js';

let hitTestSource = null;
let hitTestSourceRequested = false;
let reticle;
export let isInAR = false;
export let placedModels = [];

export function initAR() {
    createReticle();
    setupARButton();
}

function createReticle() {
    reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    reticle.visible = false;
    scene.add(reticle);
}

function setupARButton() {
    if ('xr' in navigator) {
        navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
            if (supported) {
                const arButton = ARButton.createButton(renderer, {
                    requiredFeatures: ['hit-test'],
                    optionalFeatures: ['dom-overlay'],
                    domOverlay: { root: document.body },
                    onSessionStart: () => {
                        isInAR = true;
                        scene.background = null;
                        renderer.setClearColor(0x000000, 0);
                        document.getElementById('reset-button').style.display = 'block';
                    },
                    onSessionEnd: () => {
                        isInAR = false;
                        scene.background = new THREE.Color(0xf0f0f0);
                        document.getElementById('reset-button').style.display = 'none';
                    }
                });
                document.body.appendChild(arButton);
            }
        });
    }
}

function onARButtonClick() {
    isInAR = true;
    document.getElementById('reset-button').style.display = 'block';
}

export function handleARFrame(frame) {
    if (!frame) return;

    if (!hitTestSourceRequested) {
        requestHitTestSource(frame);
        hitTestSourceRequested = true;
    }

    if (hitTestSource) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            reticle.visible = true;
            reticle.matrix.fromArray(hit.getPose(renderer.xr.getReferenceSpace()).transform.matrix);
        } else {
            reticle.visible = false;
        }
    }
}

async function requestHitTestSource(frame) {
    const session = frame.session;
    const referenceSpace = await session.requestReferenceSpace('viewer');
    hitTestSource = await session.requestHitTestSource({ space: referenceSpace });
}

export function onSelect() {
    if (reticle.visible && modelContainer) {
        const containerClone = modelContainer.clone();
        containerClone.position.setFromMatrixPosition(reticle.matrix);
        scene.add(containerClone);
        placedModels.push(containerClone);
        document.getElementById('instructions').style.display = 'block';
    }
}
