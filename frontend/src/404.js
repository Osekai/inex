'use strict';

// Import Three.js.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; // Import GLTFLoader

// Scene.
let camera, scene, renderer, orbitControls;
let gltfModel;

var spinspeed_x = 0.02;
var spinspeed_y = 0.04;

function init() {
    // Camera.
    const fov = 45;
    const aspect = 1;
    const near = 0.1;
    const far = 2000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 0, 500);

    const canvasContainer = document.getElementById('canvas-container');
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x000000, 0); // Set a transparent clear color
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(300, 300);
    canvasContainer.appendChild(renderer.domElement);

    // Scene.
    scene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Create a GLTFLoader instance
    const gltfLoader = new GLTFLoader();

    // Load the GLTF model

    // Load the cube map textures
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    cubeTextureLoader.setPath('/assets/cubemap/');

    const cubeMapTexture = cubeTextureLoader.load([
        'shiny.png', 'shiny.png',
        'shiny.png', 'shiny.png',
        'shiny.png', 'shiny.png'
    ]);


    const material = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        roughness: 0.2,
        metalness: 1,
        envMap: cubeMapTexture,
        envMapIntensity: 1,
    });

    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }


    canvasContainer.addEventListener("click", () => {
        // Generate random vibrant color using HSL
        const hue = Math.random(); // Random hue between 0 and 1
        const saturation = 1;    // You can adjust this for different saturation levels
        const lightness = getRandomArbitrary(0, 1);     // You can adjust this for different lightness levels

        const randomColor = new THREE.Color().setHSL(hue, saturation, lightness);

        // Update material color
        material.color.copy(randomColor);
        material.needsUpdate = true;
        spinspeed_x = getRandomArbitrary(-0.05, 0.05);
        spinspeed_y = getRandomArbitrary(-0.05, 0.05);

    });

    gltfLoader.load('/assets/sadface/untitled.gltf', (gltf) => {
        gltfModel = gltf.scene;
        scene.add(gltfModel);

        // Position, scale, or rotate the model as needed
        gltfModel.position.set(0, 0, 0);
        gltfModel.scale.set(30, 30, 30);

        gltfModel.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
    });




    // Start the animation loop
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    // Rotate the cube
    if (gltfModel) {
        gltfModel.rotation.x += spinspeed_x;
        gltfModel.rotation.y += spinspeed_y;
    }

    // Update the orbit controls if you're using them
    if (orbitControls) {
        orbitControls.update();
    }

    // Render the scene
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

// Start scene
init();
