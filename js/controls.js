import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { camera, renderer, scene } from './scene.js';
import { resetPartPositions } from './models.js';

export let controls;
let selectedObject = null;
let isMoving = false;
const initialTouchPosition = new THREE.Vector2();

export function initControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.1, 0);
    controls.update();
}

export function setupEventListeners() {
    renderer.domElement.addEventListener('touchstart', onTouchStart);
    renderer.domElement.addEventListener('touchmove', onTouchMove);
    renderer.domElement.addEventListener('touchend', onTouchEnd);

    document.getElementById('reset-button').addEventListener('click', () => {
        placedModels.forEach(container => {
            resetPartPositions(container);
        });
    });
}

function findSelectedObject(x, y) {
    const raycaster = new THREE.Raycaster();
    const touch = new THREE.Vector2();
    
    touch.x = (x / window.innerWidth) * 2 - 1;
    touch.y = -(y / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(touch, camera);
    
    const allParts = [];
    scene.children.forEach(child => {
        if (child.type === 'Group') {
            child.children.forEach(part => {
                allParts.push(part);
            });
        }
    });
    
    const intersects = raycaster.intersectObjects(allParts, true);
    if (intersects.length > 0) {
        let object = intersects[0].object;
        while (object.parent && !allParts.includes(object)) {
            object = object.parent;
        }
        return object;
    }
    return null;
}

function onTouchStart(event) {
    if (event.touches.length === 1) {
        isMoving = true;
        initialTouchPosition.set(
            event.touches[0].pageX,
            event.touches[0].pageY
        );
        selectedObject = findSelectedObject(event.touches[0].pageX, event.touches[0].pageY);
    }
}

function onTouchMove(event) {
    if (!selectedObject) return;

    if (isMoving && event.touches.length === 1) {
        const touch = event.touches[0];
        const deltaX = (touch.pageX - initialTouchPosition.x) * 0.002;
        const deltaZ = (touch.pageY - initialTouchPosition.y) * 0.002;

        selectedObject.position.x += deltaX;
        selectedObject.position.z += deltaZ;

        initialTouchPosition.set(touch.pageX, touch.pageY);
    } else if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const rotation = Math.atan2(
            touch2.pageY - touch1.pageY,
            touch2.pageX - touch1.pageX
        );
        
        if (selectedObject) {
            selectedObject.rotation.y = rotation;
        }
    }
}

function onTouchEnd() {
    isMoving = false;
    selectedObject = null;
}
