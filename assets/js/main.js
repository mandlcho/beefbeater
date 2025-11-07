import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const container = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04070f);
scene.fog = new THREE.Fog(0x04070f, 45, 140);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(-6, 12, 30);
scene.add(camera);

const cameraState = {
    offset: new THREE.Vector3(-6, 12, 30),
    manual: new THREE.Vector3(),
    limits: { x: 18, z: 18, yMin: 8, yMax: 24 },
};

const cameraInput = { forward: false, backward: false, left: false, right: false, scrollDelta: 0 };

const hemi = new THREE.HemisphereLight(0xa1b9ff, 0x05070d, 0.8);
const dir = new THREE.DirectionalLight(0xffc7a4, 1.2);
dir.position.set(25, 40, 10);
dir.castShadow = false;
const glow = new THREE.PointLight(0xff5caa, 8, 80);
glow.position.set(-10, 12, -6);
scene.add(hemi, dir, glow);

const groundGeo = new THREE.PlaneGeometry(160, 160);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x050912, roughness: 0.7, metalness: 0.1 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(160, 40, 0x1b2c49, 0x0a1424);
grid.position.y = 0.02;
scene.add(grid);

const district = new THREE.Group();
scene.add(district);

const blockSize = 5;
const spacing = 8;
const color = new THREE.Color();
for (let x = -blockSize; x <= blockSize; x += 1) {
    for (let z = -blockSize; z <= blockSize; z += 1) {
        if (Math.abs(x) < 2 && Math.abs(z) < 2) continue;
        const height = THREE.MathUtils.randFloat(1.5, 12);
        const geo = new THREE.BoxGeometry(3.5, height, 3.5);
        color.setHSL(THREE.MathUtils.randFloat(0.55, 0.68), 0.4, THREE.MathUtils.randFloat(0.25, 0.42));
        const mat = new THREE.MeshStandardMaterial({
            color: color.clone(),
            emissive: color.clone().multiplyScalar(0.18),
            roughness: 0.6,
            metalness: 0.2,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x * spacing, height / 2, z * spacing);
        district.add(mesh);
    }
}

const playerGeo = new THREE.CapsuleGeometry(0.6, 1.4, 8, 16);
const playerMat = new THREE.MeshStandardMaterial({ color: 0xfdf5a6, emissive: 0xffd166, emissiveIntensity: 0.8, roughness: 0.4 });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, 1.2, 0);
scene.add(player);

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
    const panSpeed = 20;
    if (cameraInput.forward) cameraState.manual.z -= panSpeed * delta;
    if (cameraInput.backward) cameraState.manual.z += panSpeed * delta;
    if (cameraInput.left) cameraState.manual.x -= panSpeed * delta;
    if (cameraInput.right) cameraState.manual.x += panSpeed * delta;

    cameraState.manual.x = THREE.MathUtils.clamp(cameraState.manual.x, -cameraState.limits.x, cameraState.limits.x);
    cameraState.manual.z = THREE.MathUtils.clamp(cameraState.manual.z, -cameraState.limits.z, cameraState.limits.z);

    if (cameraInput.scrollDelta !== 0) {
        cameraState.offset.y += cameraInput.scrollDelta * 0.01;
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
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

resetGame();
animate();
