import "./style.css";
import * as THREE from "three";
import {
  AxesHelper,
  BufferGeometry,
  Float32BufferAttribute,
  MathUtils,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  TextureLoader,
  WebGLRenderer,
  Group,
  Clock,
  MeshStandardMaterial,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import * as dat from "dat.gui";

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("#bg");

// Scene
const scene = new THREE.Scene();

//Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const gui = new dat.GUI();
const enableFog = false;
if (enableFog) {
  scene.fog = new THREE.FogExp2(0xffffff, 0.1);
}

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  1,
  1000
);
camera.position.x = -10;
camera.position.y = 3;
camera.position.z = 5;
camera.lookAt(new THREE.Vector3(0, 0, 0));
scene.add(camera);

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
});

/**
 * HDR
 **/
const hdrTextureUrl = new URL("./hdri/nebula_n0.hdr", import.meta.url);
const rgbLoader = new RGBELoader();
rgbLoader.load(hdrTextureUrl, (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  scene.environment = texture;
});

/**
 * Textures
 */
const textureLoader = new TextureLoader();
const planeRoughnessTexture = textureLoader.load(
  "./textures/Carbon_Twill_Refl.jpg"
);
/**
 * Geometries
 */
// Sphere
let getSphere = (size) => {
  new THREE.SphereGeometry(0.05, 24, 24);
  new THREE.MeshBasicMaterial({
    color: "rgb(255,255,255)",
  });
  let mesh = new THREE.Mesh(geometry, material);

  return mesh;
};
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.05, 24, 24),
  new THREE.MeshBasicMaterial({
    color: "rgb(255,255,255)",
  })
);

/**
 * Cubes grid
 */
const geometry = new RoundedBoxGeometry(1, 1, 1, 8, 0.1);
const material = new THREE.MeshStandardMaterial({
  metalness: 0.7,
  roughness: 0.05,
});
const getBox = (w, h, d) => {
  const meshBox = new THREE.Mesh(geometry, material);
  meshBox.castShadow = true;
  return meshBox;
};

let getBoxGrid = (amount, separationMultiplier) => {
  let group = new THREE.Group();

  for (let i = 0; i < amount; i++) {
    let obj = getBox(1, 1, 1);
    obj.position.x = i * separationMultiplier;
    obj.position.y = obj.geometry.parameters.height / 2;
    group.add(obj);
    for (let j = 1; j < amount; j++) {
      let obj = getBox(1, 1, 1);
      obj.position.x = i * separationMultiplier;
      obj.position.y = obj.geometry.parameters.height / 2;
      obj.position.z = j * separationMultiplier;
      group.add(obj);
    }
  }
  group.position.x = -(separationMultiplier * (amount - 1)) / 2;
  group.position.z = -(separationMultiplier * (amount - 1)) / 2;

  return group;
};

let boxGrid = getBoxGrid(10, 1.5);
scene.add(boxGrid);

/**
 * Plane
 */
const planeMaterial = new MeshStandardMaterial({
  metalness: 0.75,
  roughness: 0.5,
  color: "rgb(120,120,120)",
  side: THREE.DoubleSide,
  roughnessMap: planeRoughnessTexture,
});

const plane = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), planeMaterial);

plane.receiveShadow = true;
// plane.name = "plane-1";
plane.rotation.x = Math.PI / 2;
plane.position.y = -0.01;
// let plane = scene.getObjectByName('plane-1');
// plane.rotation.y += 0.001;
// plane.rotation.z += 0.001;
scene.add(plane);

/**
 * Lights
 */

//Point light
let getPointLight = (intensity) => {
  let light = new THREE.PointLight(0xffffff, intensity);
  light.castShadow = true;

  light.shadow.bias = 0.01;
  light.shadowMapWidth = 2048;
  light.shadowMapHeight = 2048;

  return light;
};

//Spot light
let spotLight = new THREE.SpotLight(0xffefbe, 5);
spotLight.castShadow = true;
spotLight.shadow.bias = 0.001;
spotLight.shadow.mapSize.width = 2048;
spotLight.shadow.mapSize.height = 2048;
spotLight.visible = true;

spotLight.position.y = 5;
spotLight.intensity = 5;
spotLight.penumbra = 0.1;
// spotLight.add(sphere);

const ambientLight = new THREE.AmbientLight(0xfff5be, 0.1);
scene.add(spotLight);

// Gui
gui.add(spotLight, "intensity", 0, 10);
gui.add(spotLight.position, "x", 0, 20);
gui.add(spotLight.position, "y", 0, 20);
gui.add(spotLight.position, "z", 0, 20);
gui.add(spotLight, "penumbra", 0, 1);

/**
 * Helpers
 */
const lightHelper = new THREE.PointLightHelper(spotLight);
const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(lightHelper, gridHelper);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 15;
controls.maxDistance = 25;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// renderer.outputColorSpace = THREE.SRGBColorSpace;
// renderer.toneMapping = THREE.LinearToneMapping;
// renderer.toneMappingExposure = 1.1;
// document.getElementById('bg').appendChild(renderer.domElement);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
