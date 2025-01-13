//Importiere notwendige Three.js Module
import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from "./node_modules/three/examples/jsm/controls/PointerLockControls.js";

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
let level = 0; // Der Spieler beginnt bei Level 1
let currentlevel = 5; // Der Spieler beginnt bei Level 5 Stockwerke hochgehen


// Initialer Text
hud.textContent = 'Aktuelles Stockwerk: ' + currentlevel;
const levels = [
  {
    name: "Level 1",
    cameraStartPosition: { x: -2.123642090273303, y: 1.4999999999999947, z: -94.61898176376722 },
    target: "green" // Der Collider, zu dem der Spieler gehen muss
  },
  {
    name: "Level 2",
    cameraStartPosition: { x: 47.29185384241402, y: 1.4999999999999947, z: -94.61898176376722 },
    target: "red"
  },
  {
    name: "Level 3",
    cameraStartPosition: { x: 97.38687727522415, y: 1.4999999999999947, z: -94.61898176376722 },
    target: "red"
  }
];

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
  camera.position.set(-2.123642090273303, 1.4999999999999947, -94.61898176376722);
  camera.lookAt(0, 1.5, 0);

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
    "Corridorv2.glb",
    function (gltf) {
      gltf.scene.position.set(0, 0, 0);
      scene.add(gltf.scene);
      // Liste der gewünschten Objektnamen
const collidableObjects = ["green","red"]; //, "wall2", "elev1", "elev2", "elev3", "elev4", "elev5", "elev6","elev7","elev8","elev9","elev10"];

// Für jedes Objekt in der Liste einen Collider erstellen
collidableObjects.forEach((name) => {
    const object = gltf.scene.getObjectByName(name);
    if (object) {
        // BoundingBox für das Objekt erstellen
        const boundingBox = new THREE.Box3().setFromObject(object);
        objectsBoundingBoxes.push(boundingBox);
        objects.push(object); // Objekt zur Liste hinzufügen
    } else {
        console.warn(`Das Objekt '${name}' wurde im GLTF-Modell nicht gefunden.`);
    }
});
    },
    undefined,
    function (error) {
      console.error(
        "An error occurred while loading the GLB model",
        error
      );
    }
  );

  // GLTF Loader zum Laden des zweiten GLB-Modells
  const loader2 = new GLTFLoader();
  loader2.load("Corridorv3.glb", (gltf) => {
    gltf.scene.position.set(50, 0, 0);
    scene.add(gltf.scene);
    gltf.scene.updateMatrixWorld(true);
  
    // Liste aller gesuchten Objekt-Namen
    const collidableObjects = ["red", "green"];
  
    collidableObjects.forEach((name) => {
      const object = gltf.scene.getObjectByName(name);
      if (object) {
        object.updateMatrixWorld(true);
        
        const boundingBox = new THREE.Box3().setFromObject(object);
        const helper = new THREE.Box3Helper(boundingBox, 0xff0000);
        scene.add(helper);
  
        objectsBoundingBoxes.push(boundingBox);
        objects.push(object);
      }
    });
  });

 // GLTF Loader zum Laden des dritte GLB-Modells
 const loader3 = new GLTFLoader();
 loader3.load("Corridorv3.glb", (gltf) => {
   gltf.scene.position.set(100, 0, 0);
   scene.add(gltf.scene);
   gltf.scene.updateMatrixWorld(true);
 
   // Liste aller gesuchten Objekt-Namen
   const collidableObjects3 = ["red", "green"];
 
   collidableObjects3.forEach((name) => {
     const object = gltf.scene.getObjectByName(name);
     if (object) {
       object.updateMatrixWorld(true);
       
       const boundingBox = new THREE.Box3().setFromObject(object);
       const helper = new THREE.Box3Helper(boundingBox, 0xff0000);
       scene.add(helper);
 
       objectsBoundingBoxes.push(boundingBox);
       objects.push(object);
     }
   });
 });


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

  setLevel(level);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  if (controls.isLocked === true) {
    const delta = 0.05;

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
    let collidedObjectName = null; // Variable für den Namen des kollidierten Objekts
    
    for (let i = 0; i < objectsBoundingBoxes.length; i++) {
      if (cameraBoundingBox.intersectsBox(objectsBoundingBoxes[i])) {
        collision = true;
        collidedObjectName = objects[i].name; // Den Namen des kollidierten Objekts speichern
        break;
      }
    }
    if (collision) {
      // Kollision erkannt, Bewegung rückgängig machen
      camera.position.copy(prevPosition);
      cameraCollider.position.copy(prevPosition);
      velocity.set(0, 0, 0);
    }
    const random = Math.floor(Math.random() * (2 - 0 + 1)) + 0;
    if (collision) {
      console.log(collidedObjectName);
      if(collidedObjectName === "green" || collidedObjectName === "red")
      {
        if (collidedObjectName === levels[level].target) {
          console.log("LEVEL:" + currentlevel);
  
          console.log(`Ziel erreicht: ${collidedObjectName}`);
          
          // Zum nächsten Level wechseln
          console.log("Anzahl der Level:", levels.length);


          
          if (currentlevel == 0 ) {
            console.log("Herzlichen Glückwunsch! Du hast alle Levels abgeschlossen.");
          } else {
            currentlevel--;
            hud.textContent = 'Aktuelles Stockwerk: ' + currentlevel;
          }
          level = random;
          setLevel(level);
        } else {
          currentlevel = 5; 
          hud.textContent = 'Aktuelles Stockwerk: ' + currentlevel;
          level = random;
          setLevel(level);
        }
      }
      else
      {
        console.log(collidedObjectName);
      }
    }
    // Aktuelle Kamera-Koordinaten ausgeben
    //console.log(`Kamera Position: x=${camera.position.x}, y=${camera.position.y}, z=${camera.position.z}`);
  }

  renderer.render(scene, camera);
}
function setLevel(levelIndex) {
  const level = levels[levelIndex];
  if (!level) {
    console.error("Level nicht gefunden!");
    return;
  }

  // Kamera-Position aktualisieren
  camera.position.set(
    level.cameraStartPosition.x,
    level.cameraStartPosition.y,
    level.cameraStartPosition.z
  );
  camera.lookAt(0, 1.5, 0);

  // Ausgabe in der Konsole
  console.log(`Starte ${level.name}, Ziel: ${level.target}`);
}
