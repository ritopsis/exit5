//Importiere notwendige Three.js Module
import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

const clock = new THREE.Clock();
let camera, scene, renderer;
let hudCanvas, hudContext, hudTexture;
let moveForward = false;
let moveBackward = false;
let rotateLeft = false;
let rotateRight = false;
let objects = [];
let cameraCollider;
let cameraBoundingBox;
let objectsBoundingBoxes = [];
let level = 0; 
let currentlevel = 5; 
let cameraRig; 
let notizPlane;
let exitPlane;
const collidableObjects = ["green","red", "wall1", "wall2", "elev1", "elev2", "elev3", "elev4", "elev5", "elev6","elev7","elev8","elev9","elev10", "plant1", "plant2", "plant3", "plant4", "plant6", "plant5"]; //


const levels = [
  {
    name: "Level 1",
    cameraStartPosition: { x: -2.123642090273303, y: 1.4999999999999947, z: -94.61898176376722 },
    target: "red"
  },
  {
    name: "Level 2",
    cameraStartPosition: { x: 47.29185384241402, y: 1.4999999999999947, z: -94.61898176376722 },
    target: "green"
  },
  {
    name: "Level 3",
    cameraStartPosition: { x: 97.38687727522415, y: 1.4999999999999947, z: -94.61898176376722 },
    target: "green"
  },
  {
    name: "Level 4",
    cameraStartPosition: { x: 149.06754600849737, y: 1.4999999999999947, z: -94.61898176376722 },
    target: "green"
  },
  {
    name: "Level 5",
    cameraStartPosition: { x: 198.049266531608, y: 1.4999999999999947, z: -94.61898176376722 },
    target: "green"
  },
  {
    name: "Level 6",
    cameraStartPosition: { x: 249.86914054490398, y: 1.4999999999999947, z: -94.61898176376722 },
    target: "green"
  },
  {
    name: "Level 7",
    cameraStartPosition: { x: 298.4954987420951, y: 1.4999999999999947, z: -94.61898176376722 },
    target: "green"
  },
  {
    name: "Level 8",
    cameraStartPosition: { x: 349.9862610501403, y: 1.4999999999999947, z: -94.61898176376722 },
    target: "green"
  },
  {
    name: "Ende",
    cameraStartPosition: { x: 397.2321985350387, y: 1.4999999999999947, z: -3.720939402831313 },
    target: "green"
  }
];

init();
animate();

function init() {
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  cameraRig = new THREE.Group();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  cameraRig.add(camera);
  scene.add(cameraRig);


  cameraRig.position.set(-2.123642090273303, 1.5, -94.61898176376722);
  cameraRig.rotation.set(0, Math.PI, 0);
  camera.lookAt(0, 1.5, 0);

  renderer = new THREE.WebGLRenderer();
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));
  renderer.xr.enabled = true


  const light = new THREE.HemisphereLight(0xffffff, 0x444444);
  light.position.set(0, 200, 0);
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(0, 200, 100);
  directionalLight.castShadow = true;
  scene.add(directionalLight);


  hudCanvas = document.createElement('canvas');
  hudCanvas.width = 512; 
  hudCanvas.height = 128;
  hudContext = hudCanvas.getContext('2d');


  hudContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
  hudContext.fillRect(0, 0, hudCanvas.width, hudCanvas.height);
  hudContext.fillStyle = '#fff';
  hudContext.font = '30px sans-serif';
  hudContext.fillText('Current Floor: ' + currentlevel, 20, 60);


  hudTexture = new THREE.CanvasTexture(hudCanvas);
  hudTexture.needsUpdate = true;


  const hudMaterial = new THREE.MeshBasicMaterial({
    map: hudTexture,
    transparent: true
  });
  const hudGeometry = new THREE.PlaneGeometry(1, 0.25); 

  const hudPlane = new THREE.Mesh(hudGeometry, hudMaterial);

 
  hudPlane.position.set(0, 0, -2); 
  hudPlane.renderOrder = 999; 
  cameraRig.add(hudPlane); 

  // TextureLoader für das Notiz-Bild
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load('GameNote.png', (texture) => {
    const geometry = new THREE.PlaneGeometry(1.5, 1.5); 
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true 
    });

    notizPlane = new THREE.Mesh(geometry, material);


    notizPlane.position.set(0, 1.5, -1.5);

    cameraRig.add(notizPlane);

    notizPlane.visible = true;
  });

    const textureLoader2 = new THREE.TextureLoader();
    textureLoader2.load('exitNote.png', (texture) => {
      const geometry = new THREE.PlaneGeometry(1.5, 1.5); 
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true 
      });
  
      exitPlane = new THREE.Mesh(geometry, material);

      exitPlane.position.set(0, 1.5, -1.5);
  
      cameraRig.add(exitPlane);

      exitPlane.visible = false;
    });
    
  const loader = new GLTFLoader();
  loader.load("Level_1_comp.glb", function (gltf) {
      gltf.scene.position.set(0, 0, 0);
      scene.add(gltf.scene);
      gltf.scene.updateMatrixWorld(true);
collidableObjects.forEach((name) => {
    const object = gltf.scene.getObjectByName(name);
    if (object) {
      object.updateMatrixWorld(true);
        // BoundingBox für das Objekt erstellen
        const boundingBox = new THREE.Box3().setFromObject(object);
        objectsBoundingBoxes.push(boundingBox);
        objects.push(object); 
    } else {
        console.warn("Das Objekt '${name}' wurde im GLTF-Modell nicht gefunden.");
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

  const loader2 = new GLTFLoader();
  loader2.load("Level_2_comp.glb", (gltf) => {
    gltf.scene.position.set(50, 0, 0);
    scene.add(gltf.scene);
    gltf.scene.updateMatrixWorld(true);
    collidableObjects.forEach((name) => {
      const object = gltf.scene.getObjectByName(name);
      if (object) {
        object.updateMatrixWorld(true);
        
        const boundingBox = new THREE.Box3().setFromObject(object);
        objectsBoundingBoxes.push(boundingBox);
        objects.push(object);
      }
    });
  });

  const loader3 = new GLTFLoader();
  loader3.load("Level_3.glb", (gltf) => {
    gltf.scene.position.set(100, 0, 0);
    scene.add(gltf.scene);
    gltf.scene.updateMatrixWorld(true);
    collidableObjects.forEach((name) => {
      const object = gltf.scene.getObjectByName(name);
      if (object) {
        object.updateMatrixWorld(true);
        
        const boundingBox = new THREE.Box3().setFromObject(object);
        objectsBoundingBoxes.push(boundingBox);
        objects.push(object);
      }
    });
  });

    const loader4 = new GLTFLoader();
    loader4.load("Level_4.glb", (gltf) => {
      gltf.scene.position.set(150, 0, 0);
      scene.add(gltf.scene);
      gltf.scene.updateMatrixWorld(true);
      collidableObjects.forEach((name) => {
        const object = gltf.scene.getObjectByName(name);
        if (object) {
          object.updateMatrixWorld(true);
          
          const boundingBox = new THREE.Box3().setFromObject(object);
          objectsBoundingBoxes.push(boundingBox);
          objects.push(object);
        }
      });
    });

  const loader5 = new GLTFLoader();
  loader5.load("Level_5.glb", (gltf) => {
    gltf.scene.position.set(200, 0, 0);
    scene.add(gltf.scene);
    gltf.scene.updateMatrixWorld(true);
    collidableObjects.forEach((name) => {
      const object = gltf.scene.getObjectByName(name);
      if (object) {
        object.updateMatrixWorld(true);
        
        const boundingBox = new THREE.Box3().setFromObject(object);
        objectsBoundingBoxes.push(boundingBox);
        objects.push(object);
      }
    });
  });

    // GLTF Loader zum Laden des zweiten GLB-Modells
    const loader6 = new GLTFLoader();
    loader6.load("Level_6.glb", (gltf) => {
      gltf.scene.position.set(250, 0, 0);
      scene.add(gltf.scene);
      gltf.scene.updateMatrixWorld(true);
      collidableObjects.forEach((name) => {
        const object = gltf.scene.getObjectByName(name);
        if (object) {
          object.updateMatrixWorld(true);
          
          const boundingBox = new THREE.Box3().setFromObject(object);
          objectsBoundingBoxes.push(boundingBox);
          objects.push(object);
        }
      });
    });

  const loader7 = new GLTFLoader();
  loader7.load("Level_7.glb", (gltf) => {
    gltf.scene.position.set(300, 0, 0);
    scene.add(gltf.scene);
    gltf.scene.updateMatrixWorld(true);
    collidableObjects.forEach((name) => {
      const object = gltf.scene.getObjectByName(name);
      if (object) {
        object.updateMatrixWorld(true);
        
        const boundingBox = new THREE.Box3().setFromObject(object);
        objectsBoundingBoxes.push(boundingBox);
        objects.push(object);
      }
    });
  });

    const loader8 = new GLTFLoader();
    loader8.load("Level_8_comp.glb", (gltf) => {
      gltf.scene.position.set(350, 0, 0);
      scene.add(gltf.scene);
      gltf.scene.updateMatrixWorld(true);
      collidableObjects.forEach((name) => {
        const object = gltf.scene.getObjectByName(name);
        if (object) {
          object.updateMatrixWorld(true);
          
          const boundingBox = new THREE.Box3().setFromObject(object);
          objectsBoundingBoxes.push(boundingBox);
          objects.push(object);
        }
      });
    });

  const loader9 = new GLTFLoader();
  loader9.load("Ende.glb", (gltf) => {
    gltf.scene.position.set(400, 0, 0);
    scene.add(gltf.scene);
    gltf.scene.updateMatrixWorld(true);
  
    const collidableObjects2 = ["wall1", "wall2", "wall3","wall4"]; 
  
    collidableObjects2.forEach((name) => {
      const object = gltf.scene.getObjectByName(name);
      if (object) {
        object.updateMatrixWorld(true);
        
        const boundingBox = new THREE.Box3().setFromObject(object);
        objectsBoundingBoxes.push(boundingBox);
        objects.push(object);
      }
    });
  });


  const cameraGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cameraMaterial = new THREE.MeshBasicMaterial({ visible: false });
  cameraCollider = new THREE.Mesh(cameraGeometry, cameraMaterial);
  cameraCollider.position.copy(camera.position);
  scene.add(cameraCollider);


  cameraBoundingBox = new THREE.Box3();

  const controller1 = renderer.xr.getController(0);
  const controller2 = renderer.xr.getController(1);
  scene.add(controller1);
  scene.add(controller2);

controller1.addEventListener("selectstart", () => {
  moveForward = true;
  if (notizPlane && notizPlane.visible) {
    notizPlane.visible = false;
  }
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
  setLevel(level);
}

function animate() {
  renderer.setAnimationLoop(() => {
    const movementSpeed = 11;
    const rotationSpeed = 0.9;
    const delta = clock.getDelta(); 

    const oldPosition = cameraRig.position.clone();
    if (moveForward) {
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(cameraRig.quaternion);
      cameraRig.position.addScaledVector(forward, movementSpeed * delta);
    }
    if (moveBackward) {
      const backward = new THREE.Vector3(0, 0, 1);
      backward.applyQuaternion(cameraRig.quaternion);
      cameraRig.position.addScaledVector(backward, movementSpeed * delta);
    }

    if (rotateRight) {
      cameraRig.rotation.y -= rotationSpeed * delta;
    }
    if (rotateLeft) {
      cameraRig.rotation.y += rotationSpeed * delta;
    }

    cameraCollider.position.copy(cameraRig.position);
    cameraBoundingBox.setFromObject(cameraCollider);

    objects.forEach((object, index) => {
      objectsBoundingBoxes[index].setFromObject(object);
    });

    let collision = false;
    let collidedObjectName = null;
    for (let i = 0; i < objectsBoundingBoxes.length; i++) {
      if (cameraBoundingBox.intersectsBox(objectsBoundingBoxes[i])) {
        collision = true;
        collidedObjectName = objects[i].name;
        break;
      }
    }
    if (collision) {
      console.log(`Kollision erkannt mit: ${collidedObjectName}`);
      cameraRig.position.copy(oldPosition);

    }

    const r = Math.random();
    let random = 0;
    if (r < 0.3) {
      random = 0;
    } else {
      random = 1 + Math.floor(Math.random() * 7);
    }
    if (collision) {
      console.log(`Kollision erkannt mit: ${collidedObjectName}`);
      if(collidedObjectName === "green" || collidedObjectName === "red")
        {
          if (collidedObjectName === levels[level].target) {
            console.log("LEVEL:" + currentlevel);
    
            console.log(`Ziel erreicht:  ${collidedObjectName}`);
            
            console.log("Anzahl der Level:", levels.length);
            if (currentlevel == 1 ) {
              exitPlane.visible = true;
              setLevel(8)
              updateHudText(0);
              console.log("Herzlichen Glückwunsch! Du hast alle Levels abgeschlossen.");
            } else {
              currentlevel--;
              updateHudText(currentlevel);
              level = random;
              setLevel(level);
            }
          } else {
            currentlevel = 5; 
            updateHudText(currentlevel);
            level = random;
            setLevel(level);
          }
        }
        else
        {
          console.log(collidedObjectName);
        }
    }
    renderer.render(scene, camera);
  });
}




function setLevel(levelIndex) {
  const level = levels[levelIndex];
  if (!level) {
    console.error("Level nicht gefunden!");
    return;
  }

  cameraRig.position.set(
    level.cameraStartPosition.x,
    level.cameraStartPosition.y,
    level.cameraStartPosition.z
  );
  cameraRig.rotation.set(0, Math.PI, 0);

  console.log(`Starte ${level.name}, Ziel: ${level.target}`);
}
function updateHudText(newLevel) {
  hudContext.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
  
  hudContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
  hudContext.fillRect(0, 0, hudCanvas.width, hudCanvas.height);
  
  hudContext.fillStyle = '#fff';
  hudContext.font = '30px sans-serif';
  hudContext.fillText(`Current Floor: ${newLevel}`, 20, 60);

  hudTexture.needsUpdate = true;
}

