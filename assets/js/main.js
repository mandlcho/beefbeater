import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const container = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe8ff);
scene.fog = new THREE.Fog(0xbfe8ff, 60, 220);

const frustumSize = 70;
function createOrthographicCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    return new THREE.OrthographicCamera(
        (-frustumSize * aspect) / 2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.1,
        400
    );
}

const camera = createOrthographicCamera();
camera.position.set(-25, 40, 25);
scene.add(camera);
updateCameraFrustum();

function updateCameraFrustum() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = (-frustumSize * aspect) / 2;
    camera.right = (frustumSize * aspect) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();
}

const cameraState = {
    offset: new THREE.Vector3(-25, 40, 25),
    manual: new THREE.Vector3(),
    limits: { x: 24, z: 24, yMin: 18, yMax: 60 },
};

const cameraInput = { forward: false, backward: false, left: false, right: false, scrollDelta: 0 };

const hemi = new THREE.HemisphereLight(0xeef8ff, 0x315227, 1.15);
const sun = new THREE.DirectionalLight(0xffffff, 1.45);
sun.position.set(-30, 60, 20);
sun.castShadow = false;
const rimGlow = new THREE.PointLight(0xffdfb0, 6, 100);
rimGlow.position.set(18, 18, -12);
const ambient = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(hemi, sun, rimGlow, ambient);

const groundGeo = new THREE.PlaneGeometry(160, 160);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x29532d, roughness: 0.95, metalness: 0.04 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const pastureColors = [0x3f8c4c, 0x55a35d, 0x6cbf71, 0x8fd48a, 0x8c6239, 0xa77952];
function createPastures() {
    const group = new THREE.Group();
    for (let i = 0; i < 14; i += 1) {
        const width = THREE.MathUtils.randFloat(6, 14);
        const height = THREE.MathUtils.randFloat(6, 16);
        const geo = new THREE.PlaneGeometry(width, height);
        const mat = new THREE.MeshStandardMaterial({
            color: pastureColors[Math.floor(Math.random() * pastureColors.length)],
            roughness: 0.95,
            metalness: 0.02,
        });
        const patch = new THREE.Mesh(geo, mat);
        patch.rotation.x = -Math.PI / 2;
        patch.position.set(THREE.MathUtils.randFloatSpread(80), 0.05, THREE.MathUtils.randFloatSpread(80));
        patch.rotation.z = THREE.MathUtils.degToRad(THREE.MathUtils.randFloat(-12, 12));
        patch.receiveShadow = true;
        group.add(patch);
    }
    for (let j = 0; j < 10; j += 1) {
        const soilGeo = new THREE.PlaneGeometry(THREE.MathUtils.randFloat(4, 9), THREE.MathUtils.randFloat(4, 9));
        const soilMat = new THREE.MeshStandardMaterial({
            color: 0xb58a5a,
            roughness: 0.9,
            metalness: 0.03,
        });
        const soil = new THREE.Mesh(soilGeo, soilMat);
        soil.rotation.x = -Math.PI / 2;
        soil.position.set(THREE.MathUtils.randFloatSpread(70), 0.04, THREE.MathUtils.randFloatSpread(70));
        soil.receiveShadow = true;
        group.add(soil);
    }
    scene.add(group);
}

function createTrees() {
    const forest = new THREE.Group();
    for (let i = 0; i < 60; i += 1) {
        const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.6, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b3a1a, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);

        const crownGeo = new THREE.ConeGeometry(1.1, 2.4, 12);
        const crownMat = new THREE.MeshStandardMaterial({ color: 0x2f8f4a, roughness: 0.4 });
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.y = 1.4;

        const tree = new THREE.Group();
        tree.add(trunk);
        tree.add(crown);
        tree.position.set(THREE.MathUtils.randFloatSpread(70), 0.8, THREE.MathUtils.randFloatSpread(70));
        tree.rotation.y = THREE.MathUtils.randFloat(0, Math.PI * 2);
        forest.add(tree);
    }
    scene.add(forest);
}

createPastures();
createTrees();

const playerGeo = new THREE.CapsuleGeometry(0.6, 1.4, 8, 16);
const playerMat = new THREE.MeshStandardMaterial({ color: 0xfdf5a6, emissive: 0xffd166, emissiveIntensity: 0.8, roughness: 0.4 });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, 1.2, 0);
scene.add(player);

const arrowGeo = new THREE.ConeGeometry(0.35, 1.4, 16);
const arrowMat = new THREE.MeshBasicMaterial({ color: 0xfff1a1 });
const arrow = new THREE.Mesh(arrowGeo, arrowMat);
arrow.position.set(0, 1.9, 0.3);
arrow.rotation.x = Math.PI / 2;
player.add(arrow);

const shadowGeo = new THREE.CircleGeometry(1.2, 32);
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
const playerShadow = new THREE.Mesh(shadowGeo, shadowMat);
playerShadow.rotation.x = -Math.PI / 2;
playerShadow.position.y = 0.01;
scene.add(playerShadow);

const nodes = [];
const nodeGeo = new THREE.SphereGeometry(0.75, 16, 16);
const playArea = 32;
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function spawnNode() {
    const mat = new THREE.MeshStandardMaterial({
        color: 0x6cf2ff,
        emissive: 0x118192,
        emissiveIntensity: 1.2,
        roughness: 0.3,
        metalness: 0.1,
    });
    const node = new THREE.Mesh(nodeGeo, mat);
    node.position.set(randomRange(-playArea, playArea), 1.4, randomRange(-playArea, playArea));
    node.userData = { offset: Math.random() * Math.PI * 2 };
    nodes.push(node);
    scene.add(node);
}
for (let i = 0; i < 16; i += 1) {
    spawnNode();
}

const playerInput = { forward: false, backward: false, left: false, right: false, boost: false };

function handleKeyChange(key, value) {
    let handled = true;
    switch (key) {
        case 'w':
            playerInput.forward = value;
            break;
        case 's':
            playerInput.backward = value;
            break;
        case 'a':
            playerInput.left = value;
            break;
        case 'd':
            playerInput.right = value;
            break;
        case 'shift':
            playerInput.boost = value;
            break;
        case 'arrowup':
            cameraInput.forward = value;
            break;
        case 'arrowdown':
            cameraInput.backward = value;
            break;
        case 'arrowleft':
            cameraInput.left = value;
            break;
        case 'arrowright':
            cameraInput.right = value;
            break;
        case 'r':
            if (value) resetGame();
            break;
        default:
            handled = false;
    }
    return handled;
}

window.addEventListener('keydown', (event) => {
    const handled = handleKeyChange(event.key.toLowerCase(), true);
    if (handled) event.preventDefault();
});

window.addEventListener('keyup', (event) => {
    const handled = handleKeyChange(event.key.toLowerCase(), false);
    if (handled) event.preventDefault();
});

window.addEventListener(
    'wheel',
    (event) => {
        event.preventDefault();
        cameraInput.scrollDelta += event.deltaY;
    },
    { passive: false }
);

const scoreEl = document.querySelector('[data-score]');
const bestEl = document.querySelector('[data-best]');
const resetButton = document.getElementById('reset-button');

const state = {
    score: 0,
    best: 0,
};

resetButton.addEventListener('click', resetGame);

function updateUI() {
    scoreEl.textContent = Math.round(state.score);
    bestEl.textContent = Math.round(state.best);
}

function resetGame() {
    state.score = 0;
    player.position.set(0, 1.2, 0);
    cameraState.manual.set(0, 0, 0);
    cameraState.offset.set(-6, 12, 30);
    updateUI();
}

function updatePlayer(delta) {
    const move = new THREE.Vector3();
    if (playerInput.forward) move.z -= 1;
    if (playerInput.backward) move.z += 1;
    if (playerInput.left) move.x -= 1;
    if (playerInput.right) move.x += 1;
    if (move.lengthSq() > 0) {
        move.normalize();
    }
    const speed = (playerInput.boost ? 18 : 12) * delta;
    move.multiplyScalar(speed);
    player.position.add(move);
    player.position.x = THREE.MathUtils.clamp(player.position.x, -playArea, playArea);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -playArea, playArea);

    if (move.lengthSq() > 0) {
        player.rotation.y = Math.atan2(move.x, move.z);
    }

    playerShadow.position.x = player.position.x;
    playerShadow.position.z = player.position.z;
}

function handleCameraPan(delta) {
    const panSpeed = 18;
    if (cameraInput.forward) cameraState.manual.z -= panSpeed * delta;
    if (cameraInput.backward) cameraState.manual.z += panSpeed * delta;
    if (cameraInput.left) cameraState.manual.x -= panSpeed * delta;
    if (cameraInput.right) cameraState.manual.x += panSpeed * delta;

    cameraState.manual.x = THREE.MathUtils.clamp(cameraState.manual.x, -cameraState.limits.x, cameraState.limits.x);
    cameraState.manual.z = THREE.MathUtils.clamp(cameraState.manual.z, -cameraState.limits.z, cameraState.limits.z);

    if (cameraInput.scrollDelta !== 0) {
        cameraState.offset.y -= cameraInput.scrollDelta * 0.02;
        cameraInput.scrollDelta = 0;
    }
    cameraState.offset.y = THREE.MathUtils.clamp(cameraState.offset.y, cameraState.limits.yMin, cameraState.limits.yMax);
}

function updateCamera(delta) {
    handleCameraPan(delta);
    const target = player.position.clone().add(cameraState.manual);
    const desiredPosition = target.clone().add(cameraState.offset);
    camera.position.lerp(desiredPosition, 0.08);
    camera.lookAt(target);
}

let elapsed = 0;
function updateNodes(delta) {
    elapsed += delta;
    nodes.forEach((node) => {
        const pulse = Math.sin(elapsed * 2 + node.userData.offset);
        node.position.y = 1.2 + pulse * 0.5;
        const scale = 1 + Math.sin(elapsed * 3 + node.userData.offset) * 0.12;
        node.scale.setScalar(scale);
        if (player.position.distanceTo(node.position) < 1.4) {
            collectNode(node);
        }
    });
}

function collectNode(node) {
    state.score += 25;
    state.best = Math.max(state.best, state.score);
    node.position.set(randomRange(-playArea, playArea), 1.4, randomRange(-playArea, playArea));
    node.userData.offset = Math.random() * Math.PI * 2;
    updateUI();
}

const clock = new THREE.Clock();

function animate() {
    const delta = clock.getDelta();
    updatePlayer(delta);
    updateCamera(delta);
    updateNodes(delta);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    const { innerWidth, innerHeight } = window;
    updateCameraFrustum();
    renderer.setSize(innerWidth, innerHeight);
});

resetGame();
animate();
