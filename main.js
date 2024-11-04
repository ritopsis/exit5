// Importiere notwendige Three.js Module
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { PointerLockControls } from "./node_modules/three/examples/jsm/controls/PointerLockControls.js";
import * as THREE from "./node_modules/three";

let camera, scene, renderer;
let controls;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let objects = [];
let cameraCollider;
let cameraBoundingBox;
let objectsBoundingBoxes = [];

init();
animate();

function init() {
  // Szene, Kamera und Renderer initialisieren
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.y = 1.5;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

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
    "room.glb",
    function (gltf) {
      scene.add(gltf.scene);

      // Zugriff auf das Objekt "Plane" im GLTF-Modell
      const plane = gltf.scene.getObjectByName("Plane");

      if (plane) {
        // BoundingBox für das Objekt "Plane" erstellen
        const planeBoundingBox = new THREE.Box3().setFromObject(plane);
        objectsBoundingBoxes.push(planeBoundingBox);
        objects.push(plane); // Objekt zur Liste hinzufügen, falls benötigt
      } else {
        console.error("Das Objekt 'Plane' wurde im GLTF-Modell nicht gefunden.");
      }
    },
    undefined,
    function (error) {
      console.error(
        "An error occurred while loading the GLB model",
        error
      );
    }
  );

  // PointerLockControls für die First-Person-Steuerung
  controls = new PointerLockControls(camera, document.body);

  document.addEventListener("click", function () {
    controls.lock();
  });

  controls.addEventListener("lock", function () {
    console.log("Pointer locked");
  });

  controls.addEventListener("unlock", function () {
    console.log("Pointer unlocked");
  });

  scene.add(controls.getObject());

  // Kamera-Collider erstellen
  const cameraGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cameraMaterial = new THREE.MeshBasicMaterial({ visible: false });
  cameraCollider = new THREE.Mesh(cameraGeometry, cameraMaterial);
  cameraCollider.position.copy(camera.position);
  scene.add(cameraCollider);

  // Kamera-BoundingBox initialisieren
  cameraBoundingBox = new THREE.Box3();

  // EventListener für Tastatursteuerung
  const onKeyDown = function (event) {
    switch (event.code) {
      case "KeyW":
        moveForward = true;
        break;
      case "KeyA":
        moveLeft = true;
        break;
      case "KeyS":
        moveBackward = true;
        break;
      case "KeyD":
        moveRight = true;
        break;
    }
  };

  const onKeyUp = function (event) {
    switch (event.code) {
      case "KeyW":
        moveForward = false;
        break;
      case "KeyA":
        moveLeft = false;
        break;
      case "KeyS":
        moveBackward = false;
        break;
      case "KeyD":
        moveRight = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  window.addEventListener("resize", onWindowResize);

  // Rotes Objekt im Raum hinzufügen
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const redCube = new THREE.Mesh(geometry, redMaterial);
  redCube.position.set(0, 1.5, -2);
  scene.add(redCube);
  objects.push(redCube);

  // BoundingBox für das rote Objekt erstellen
  const redCubeBoundingBox = new THREE.Box3().setFromObject(redCube);
  objectsBoundingBoxes.push(redCubeBoundingBox);

  // Blaue Box neben der roten Box hinzufügen
  const blueMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const blueCube = new THREE.Mesh(geometry, blueMaterial);
  blueCube.position.set(2, 1.5, -2); // Neben der roten Box platzieren
  scene.add(blueCube);
  objects.push(blueCube);

  // BoundingBox für die blaue Box erstellen
  const blueCubeBoundingBox = new THREE.Box3().setFromObject(blueCube);
  objectsBoundingBoxes.push(blueCubeBoundingBox);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  if (controls.isLocked === true) {
    const delta = 0.025;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward)
      velocity.z -= direction.z * 100.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 100.0 * delta;

    // Vorherige Position speichern
    const prevPosition = camera.position.clone();

    // Kamera bewegen
    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    // Kamera-Collider-Position aktualisieren
    cameraCollider.position.copy(camera.position);
    cameraCollider.updateMatrixWorld();

    // Kamera-BoundingBox aktualisieren
    cameraBoundingBox.setFromObject(cameraCollider);

    // Kollisionsprüfung
    let collision = false;
    for (let i = 0; i < objectsBoundingBoxes.length; i++) {
      if (cameraBoundingBox.intersectsBox(objectsBoundingBoxes[i])) {
        collision = true;
        break;
      }
    }

    if (collision) {
      // Kollision erkannt, Bewegung rückgängig machen
      camera.position.copy(prevPosition);
      cameraCollider.position.copy(prevPosition);
      velocity.set(0, 0, 0);
    }
  }

  renderer.render(scene, camera);
}
