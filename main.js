// Importiere notwendige Three.js Module
import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// Erzeuge ein <div>-Element
const hud = document.createElement('div');

// Style das <div> direkt per JavaScript (ähnlich wie in CSS)
hud.style.position = 'fixed';
hud.style.top = '10px';
hud.style.left = '10px';
hud.style.padding = '5px 10px';
hud.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
hud.style.color = '#fff';
hud.style.fontFamily = 'sans-serif';
hud.style.zIndex = '9999';

// Füge das <div> ins <body> ein
document.body.appendChild(hud);

let camera, scene, renderer;
let moveForward = false;
let moveBackward = false;
let rotateLeft = false;
let rotateRight = false;

// Initialisiere Szene, Kamera, Renderer
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.6, 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(VRButton.createButton(renderer));
    renderer.xr.enabled = true;

    // Licht hinzufügen
    const light = new THREE.HemisphereLight(0xffffff, 0x444444);
    light.position.set(0, 200, 0);
    scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(0, 200, 100);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Dummy-Objekt für Bewegungen
    const cameraRig = new THREE.Group();
    cameraRig.add(camera);
    scene.add(cameraRig);

    // GLTF Loader (optional, für Inhalte)
    const loader = new GLTFLoader();
    loader.load(
        'Corridorv2.glb',
        function (gltf) {
            gltf.scene.position.set(0, 0, 0);
            scene.add(gltf.scene);
        },
        undefined,
        function (error) {
            console.error('An error occurred while loading the GLB model', error);
        }
    );

    // Controller hinzufügen
    const controller1 = renderer.xr.getController(0);
    const controller2 = renderer.xr.getController(1);

    scene.add(controller1);
    scene.add(controller2);

    // Event-Listener für Controller
    controller1.addEventListener('selectstart', () => {
        moveForward = true;
        console.log('Controller 1: Move Forward');
    });
    controller1.addEventListener('selectend', () => {
        moveForward = false;
        console.log('Controller 1: Stop Moving Forward');
    });

    controller1.addEventListener('squeezestart', () => {
        moveBackward = true;
        console.log('Controller 1: Move Backward');
    });
    controller1.addEventListener('squeezeend', () => {
        moveBackward = false;
        console.log('Controller 1: Stop Moving Backward');
    });

    controller2.addEventListener('selectstart', () => {
        rotateRight = true;
        console.log('Controller 2: Rotate Right');
    });
    controller2.addEventListener('selectend', () => {
        rotateRight = false;
        console.log('Controller 2: Stop Rotating Right');
    });

    controller2.addEventListener('squeezestart', () => {
        rotateLeft = true;
        console.log('Controller 2: Rotate Left');
    });
    controller2.addEventListener('squeezeend', () => {
        rotateLeft = false;
        console.log('Controller 2: Stop Rotating Left');
    });

    animate(cameraRig);
}

// Animation mit Dummy-Objekt für Bewegungen
function animate(cameraRig) {
    renderer.setAnimationLoop(() => {
        const movementSpeed = 0.08; // Geschwindigkeit der Bewegung
        const rotationSpeed = 0.01; // Geschwindigkeit der Drehung

        // Kamera-Bewegungen basierend auf den Controller-Zuständen
        if (moveForward) {
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(cameraRig.quaternion); // Orientierung berücksichtigen
            cameraRig.position.addScaledVector(forward, movementSpeed);
            console.log('Rig forward:', cameraRig.position);
        }
        if (moveBackward) {
            const backward = new THREE.Vector3(0, 0, 1);
            backward.applyQuaternion(cameraRig.quaternion); // Orientierung berücksichtigen
            cameraRig.position.addScaledVector(backward, movementSpeed);
            console.log('Rig backward:', cameraRig.position);
        }

        // Kamera-Rotation basierend auf den Controller-Zuständen
        if (rotateRight) {
            cameraRig.rotation.y -= rotationSpeed;
            console.log('Rig rotating right:', cameraRig.rotation.y);
        }
        if (rotateLeft) {
            cameraRig.rotation.y += rotationSpeed;
            console.log('Rig rotating left:', cameraRig.rotation.y);
        }

        renderer.render(scene, camera);
    });
}

// Starte die Szene
init();
