// Importiere notwendige Three.js Module
import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// Erzeuge ein <div>-Element für Nicht-VR-Modus
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

let scene, renderer;
let cameraRig, camera;
let vrHudObject; // HUD im VR-Modus
let moveForward = false;
let moveBackward = false;
let rotateLeft = false;
let rotateRight = false;
let currentlevel = 5;

// Initialer Text
hud.textContent = 'Aktuelles Stockwerk: ' + currentlevel;

const levels = [
  {
    name: "Level 1",
    cameraStartPosition: { x: -2.123642090273303, y: 1.5, z: -94.61898176376722 },
    target: "green",
  },
  {
    name: "Level 2",
    cameraStartPosition: { x: 47.29185384241402, y: 1.5, z: -94.61898176376722 },
    target: "red",
  },
  {
    name: "Level 3",
    cameraStartPosition: { x: 97.38687727522415, y: 1.5, z: -94.61898176376722 },
    target: "red",
  },
];

init();
animate();

function init() {
  // Szene und Renderer initialisieren
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  // Dummy-Kamera erstellen
  cameraRig = new THREE.Group();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  cameraRig.add(camera);
  scene.add(cameraRig);

  // HUD-Element für VR-Modus erstellen
  const hudCanvas = document.createElement('canvas');
  hudCanvas.width = 160;
  hudCanvas.height = 70;
  const hudContext = hudCanvas.getContext('2d');
  hudContext.font = '25px sans-serif';
  hudContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
  hudContext.fillRect(0, 0, hudCanvas.width, 50);
  hudContext.fillStyle = 'rgba(255, 255, 255, 1)';
  hudContext.fillText('Aktuelles Stockwerk: ' + currentlevel, 5, 40, 150);

  const hudTexture = new THREE.CanvasTexture(hudCanvas);
  const hudMaterial = new THREE.SpriteMaterial({ map: hudTexture });
  vrHudObject = new THREE.Sprite(hudMaterial);
  vrHudObject.scale.set(2, 0.4, 0.1); // Größe des HUD
  vrHudObject.position.set(-3.15, 4.45, -3); // Position relativ zur Kamera
  vrHudObject.visible = false; // Im Nicht-VR-Modus verstecken
  cameraRig.add(vrHudObject);

  // Licht hinzufügen
  const light = new THREE.HemisphereLight(0xffffff, 0x444444);
  light.position.set(0, 200, 0);
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(0, 200, 100);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // GLTF Loader zum Laden des GLB-Modells
  const loader = new GLTFLoader();
  loader.load(
    "Corridorv2.glb",
    function (gltf) {
      gltf.scene.position.set(0, 0, 0);
      scene.add(gltf.scene);
    },
    undefined,
    function (error) {
      console.error("An error occurred while loading the GLB model", error);
    }
  );

  // Controller hinzufügen
  const controller1 = renderer.xr.getController(0);
  const controller2 = renderer.xr.getController(1);
  scene.add(controller1);
  scene.add(controller2);

  // Event-Listener für Controller
  controller1.addEventListener("selectstart", () => {
    moveForward = true;
  });
  controller1.addEventListener("selectend", () => {
    moveForward = false;
  });

  controller1.addEventListener("squeezestart", () => {
    moveBackward = true;
  });
  controller1.addEventListener("squeezeend", () => {
    moveBackward = false;
  });

  controller2.addEventListener("selectstart", () => {
    rotateRight = true;
  });
  controller2.addEventListener("selectend", () => {
    rotateRight = false;
  });

  controller2.addEventListener("squeezestart", () => {
    rotateLeft = true;
  });
  controller2.addEventListener("squeezeend", () => {
    rotateLeft = false;
  });

  // Fenstergröße anpassen
  window.addEventListener("resize", onWindowResize);

  // Wechsel zwischen VR- und Nicht-VR-Modus behandeln
  renderer.xr.addEventListener('sessionstart', () => {
    hud.style.display = 'none'; // Nicht-VR-HUD ausblenden
    vrHudObject.visible = true; // VR-HUD anzeigen
  });

  renderer.xr.addEventListener('sessionend', () => {
    hud.style.display = 'block'; // Nicht-VR-HUD anzeigen
    vrHudObject.visible = false; // VR-HUD ausblenden
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(() => {
    const movementSpeed = 0.08;
    const rotationSpeed = 0.01;

    // Bewegung und Rotation der Dummy-Kamera
    if (moveForward) {
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(cameraRig.quaternion);
      cameraRig.position.addScaledVector(forward, movementSpeed);
    }

    if (moveBackward) {
      const backward = new THREE.Vector3(0, 0, 1);
      backward.applyQuaternion(cameraRig.quaternion);
      cameraRig.position.addScaledVector(backward, movementSpeed);
    }

    if (rotateLeft) {
      cameraRig.rotation.y += rotationSpeed;
    }

    if (rotateRight) {
      cameraRig.rotation.y -= rotationSpeed;
    }

    renderer.render(scene, camera);
  });
}
