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
const cameraRig = new THREE.Group();
scene.add(cameraRig);
cameraRig.add(camera);
camera.position.set(0, 10, 25);

const cameraState = {
    orbitAngle: 0,
    orbitSpeed: 0.35,
    radius: 34,
    height: 14,
};

const pointer = { x: 0, y: 0 };

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

const blockSize = 7;
const spacing = 6;
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

const cars = [];
const carGeo = new THREE.BoxGeometry(1.4, 0.8, 3.2);
function spawnCar() {
    const carMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(THREE.MathUtils.randFloat(0, 1), 0.8, 0.5),
        emissive: 0xff5caa,
        emissiveIntensity: 0.4,
        roughness: 0.4,
    });
    const car = new THREE.Mesh(carGeo, carMat);
    car.position.set(THREE.MathUtils.randFloatSpread(60), 0.5, THREE.MathUtils.randFloatSpread(60));
    car.userData = {
        axis: Math.random() > 0.5 ? 'x' : 'z',
        dir: Math.random() > 0.5 ? 1 : -1,
        speed: THREE.MathUtils.randFloat(6, 12),
        offset: Math.random() * Math.PI * 2,
    };
    cars.push(car);
    scene.add(car);
}
for (let i = 0; i < 14; i += 1) {
    spawnCar();
}

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

const input = { forward: false, backward: false, left: false, right: false, boost: false };

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') input.forward = true;
    if (key === 's' || key === 'arrowdown') input.backward = true;
    if (key === 'a' || key === 'arrowleft') input.left = true;
    if (key === 'd' || key === 'arrowright') input.right = true;
    if (key === 'shift') input.boost = true;
    if (key === 'r') resetGame();
});

window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') input.forward = false;
    if (key === 's' || key === 'arrowdown') input.backward = false;
    if (key === 'a' || key === 'arrowleft') input.left = false;
    if (key === 'd' || key === 'arrowright') input.right = false;
    if (key === 'shift') input.boost = false;
});

window.addEventListener('pointermove', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
});

const scoreEl = document.querySelector('[data-score]');
const bestEl = document.querySelector('[data-best]');
const energyEl = document.querySelector('[data-energy]');
const energyFill = document.querySelector('[data-energy-fill]');
const timeEl = document.querySelector('[data-time]');
const statusEl = document.getElementById('status-text');
const resetButton = document.getElementById('reset-button');

const state = {
    score: 0,
    best: 0,
    energy: 100,
    time: 0,
    active: true,
};

resetButton.addEventListener('click', resetGame);

function setStatus(message) {
    statusEl.textContent = message;
}

function updateUI() {
    scoreEl.textContent = Math.round(state.score);
    bestEl.textContent = Math.round(state.best);
    energyEl.textContent = `${Math.max(0, state.energy).toFixed(0)}%`;
    energyFill.style.width = `${Math.max(0, Math.min(100, state.energy))}%`;
    timeEl.textContent = formatTime(state.time);
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60)
        .toString()
        .padStart(2, '0');
    const seconds = Math.floor(totalSeconds % 60)
        .toString()
        .padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function resetGame() {
    state.score = 0;
    state.energy = 100;
    state.time = 0;
    state.active = true;
    player.position.set(0, 1.2, 0);
    setStatus('Collect aqua nodes to keep the district online.');
    updateUI();
}

function updatePlayer(delta) {
    const move = new THREE.Vector3();
    if (input.forward) move.z -= 1;
    if (input.backward) move.z += 1;
    if (input.left) move.x -= 1;
    if (input.right) move.x += 1;
    if (move.lengthSq() > 0) {
        move.normalize();
    }
    const speed = (input.boost ? 18 : 12) * delta;
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

function updateCamera(delta) {
    cameraState.orbitAngle += cameraState.orbitSpeed * delta;
    const radius = cameraState.radius + pointer.x * 4;
    const targetY = cameraState.height + pointer.y * 3;
    const targetPosition = new THREE.Vector3(
        player.position.x + Math.cos(cameraState.orbitAngle) * radius,
        targetY,
        player.position.z + Math.sin(cameraState.orbitAngle) * radius
    );
    camera.position.lerp(targetPosition, 0.05);
    const lookAt = new THREE.Vector3(player.position.x, player.position.y + 3, player.position.z);
    camera.lookAt(lookAt);
}

function updateCars(delta) {
    const limit = playArea + 10;
    cars.forEach((car) => {
        const dirSpeed = car.userData.speed * delta * car.userData.dir;
        if (car.userData.axis === 'x') {
            car.position.x += dirSpeed;
            if (car.position.x > limit || car.position.x < -limit) {
                car.userData.dir *= -1;
            }
        } else {
            car.position.z += dirSpeed;
            if (car.position.z > limit || car.position.z < -limit) {
                car.userData.dir *= -1;
            }
        }
        car.rotation.y += delta * 2;
    });
}

let elapsed = 0;
function updateNodes(delta) {
    elapsed += delta;
    nodes.forEach((node) => {
        const pulse = Math.sin(elapsed * 2 + node.userData.offset);
        node.position.y = 1.2 + pulse * 0.5;
        const scale = 1 + Math.sin(elapsed * 3 + node.userData.offset) * 0.12;
        node.scale.setScalar(scale);
        if (state.active && player.position.distanceTo(node.position) < 1.4) {
            collectNode(node);
        }
    });
}

function collectNode(node) {
    state.score += 25;
    state.energy = Math.min(100, state.energy + 18);
    setStatus('Node stabilized. Keep sweeping.');
    node.position.set(randomRange(-playArea, playArea), 1.4, randomRange(-playArea, playArea));
    node.userData.offset = Math.random() * Math.PI * 2;
    updateUI();
}

function updateGameState(delta) {
    if (!state.active) return;
    state.energy -= delta * 6;
    state.time += delta;
    if (state.energy <= 0) {
        state.energy = 0;
        state.active = false;
        state.best = Math.max(state.best, state.score);
        setStatus('Energy depleted. Press reset to start another survey.');
    }
    updateUI();
}

const clock = new THREE.Clock();

function animate() {
    const delta = clock.getDelta();
    if (state.active) {
        updatePlayer(delta);
    }
    updateCamera(delta);
    updateCars(delta);
    updateNodes(delta);
    updateGameState(delta);

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
