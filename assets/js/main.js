import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const root = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(root.clientWidth, root.clientHeight);
root.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02030a);
scene.fog = new THREE.FogExp2(0x03060f, 0.02);

const camera = new THREE.PerspectiveCamera(60, root.clientWidth / root.clientHeight, 0.1, 200);
camera.position.set(0, 4.5, 12);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
const dir = new THREE.DirectionalLight(0xffc9a0, 1.2);
dir.position.set(-3, 6, 5);
scene.add(ambient, dir);

const groundGeo = new THREE.PlaneGeometry(40, 200, 40, 40);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a0f1e, wireframe: true, opacity: 0.3, transparent: true });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const railMaterial = new THREE.MeshBasicMaterial({ color: 0xff8f5c });
const railGeo = new THREE.CylinderGeometry(0.1, 0.1, 120, 12);
const leftRail = new THREE.Mesh(railGeo, railMaterial);
leftRail.rotation.z = Math.PI / 2;
leftRail.position.set(-10, 0.3, -30);
const rightRail = leftRail.clone();
rightRail.position.x = 10;
scene.add(leftRail, rightRail);

const starCount = 600;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = THREE.MathUtils.randFloatSpread(40);
    starPositions[i * 3 + 1] = THREE.MathUtils.randFloat(5, 30);
    starPositions[i * 3 + 2] = THREE.MathUtils.randFloat(-120, 20);
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.8 })
);
scene.add(stars);

const playerGeometry = new THREE.DodecahedronGeometry(1.2, 0);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0x442200, metalness: 0.2, roughness: 0.4 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 1.6, 0);
scene.add(player);

const thrusterGeo = new THREE.ConeGeometry(0.4, 1.6, 16);
const thrusterMat = new THREE.MeshBasicMaterial({ color: 0xff5caa, transparent: true, opacity: 0.6 });
const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
thruster.rotation.x = Math.PI;
thruster.position.set(0, 0, 1.2);
player.add(thruster);

const crates = [];
const clock = new THREE.Clock();
let spawnTimer = 0;

const state = {
    score: 0,
    combo: 0,
    health: 3,
    wave: 1,
    speed: 18,
    spawnInterval: 1.5,
    elapsed: 0,
    active: true,
};

const input = { left: false, right: false, up: false, down: false };

const scoreEl = document.querySelector('[data-score]');
const comboEl = document.querySelector('[data-combo]');
const healthEl = document.querySelector('[data-health]');
const waveEl = document.querySelector('[data-wave]');
const statusEl = document.getElementById('status-banner');
const logEl = document.getElementById('event-log');

function updateUI() {
    scoreEl.textContent = Math.floor(state.score);
    comboEl.textContent = `${state.combo}x`;
    healthEl.textContent = state.health;
    waveEl.textContent = state.wave;
}

function logEvent(message) {
    const entry = document.createElement('p');
    entry.textContent = message;
    logEl.prepend(entry);
    while (logEl.childNodes.length > 6) {
        logEl.removeChild(logEl.lastChild);
    }
}

function setStatus(text) {
    statusEl.textContent = text;
}

function spawnCrate() {
    const isPayload = Math.random() > 0.3;
    const size = isPayload ? THREE.MathUtils.randFloat(0.6, 1.4) : THREE.MathUtils.randFloat(0.5, 1.1);
    const geometry = isPayload ? new THREE.BoxGeometry(size, size, size) : new THREE.IcosahedronGeometry(size, 0);
    const material = new THREE.MeshStandardMaterial({
        color: isPayload ? 0x4ef5ff : 0xff5caa,
        emissive: isPayload ? 0x0c7fa0 : 0x441133,
        metalness: 0.3,
        roughness: 0.4,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(THREE.MathUtils.randFloatSpread(14), THREE.MathUtils.randFloat(0.6, 3.2), -45);
    mesh.userData = {
        type: isPayload ? 'payload' : 'hazard',
        speed: THREE.MathUtils.randFloat(state.speed * 0.6, state.speed * 1.15),
    };
    crates.push(mesh);
    scene.add(mesh);
}

function resetGame() {
    state.score = 0;
    state.combo = 0;
    state.health = 3;
    state.wave = 1;
    state.speed = 18;
    state.spawnInterval = 1.5;
    state.elapsed = 0;
    state.active = true;
    spawnTimer = 0;
    crates.forEach((c) => scene.remove(c));
    crates.length = 0;
    setStatus('Fresh runway online. Collect teal payloads. Avoid magenta contaminants.');
    logEvent('Simulation reset. Wave 1 engaged.');
    updateUI();
}

document.getElementById('reset-button').addEventListener('click', resetGame);

window.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
            input.left = true;
            break;
        case 'd':
        case 'arrowright':
            input.right = true;
            break;
        case 'w':
        case 'arrowup':
            input.up = true;
            break;
        case 's':
        case 'arrowdown':
            input.down = true;
            break;
        case 'r':
            resetGame();
            break;
        default:
            break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
            input.left = false;
            break;
        case 'd':
        case 'arrowright':
            input.right = false;
            break;
        case 'w':
        case 'arrowup':
            input.up = false;
            break;
        case 's':
        case 'arrowdown':
            input.down = false;
            break;
        default:
            break;
    }
});

function updatePlayer(delta) {
    const lateralSpeed = 16;
    const verticalSpeed = 10;
    if (input.left) player.position.x -= lateralSpeed * delta;
    if (input.right) player.position.x += lateralSpeed * delta;
    if (input.up) player.position.y += verticalSpeed * delta;
    if (input.down) player.position.y -= verticalSpeed * delta;

    player.position.x = THREE.MathUtils.clamp(player.position.x, -8.5, 8.5);
    player.position.y = THREE.MathUtils.clamp(player.position.y, 0.8, 4.5);

    thruster.scale.y = THREE.MathUtils.lerp(thruster.scale.y, input.up ? 0.6 : 1, 0.15);
}

function handleCollision(crate) {
    if (crate.userData.type === 'payload') {
        state.combo += 1;
        const bonus = 10 + state.combo * 2;
        state.score += bonus;
        logEvent(`Captured payload +${bonus} (combo ${state.combo}x)`);
        setStatus('Payload secured. Keep the rhythm.');
    } else {
        state.combo = 0;
        state.health -= 1;
        state.score = Math.max(0, state.score - 15);
        logEvent('Contaminant impact! Integrity reduced.');
        setStatus('Warning: contaminant breach. Realign lanes.');
        if (state.health <= 0) {
            state.active = false;
            setStatus('Run failed. Integrity depleted. Press R to restart.');
            logEvent('Integrity offline. Simulation halted.');
        }
    }
    updateUI();
}

function updateCrates(delta) {
    for (let i = crates.length - 1; i >= 0; i -= 1) {
        const crate = crates[i];
        crate.position.z += crate.userData.speed * delta;
        crate.rotation.x += delta * 1.2;
        crate.rotation.y += delta * 0.8;

        if (state.active) {
            const distance = crate.position.distanceTo(player.position);
            if (distance < 1.3) {
                handleCollision(crate);
                scene.remove(crate);
                crates.splice(i, 1);
                continue;
            }
        }

        if (crate.position.z > 10) {
            if (crate.userData.type === 'payload' && state.active) {
                state.combo = 0;
                logEvent('Payload missed. Combo reset.');
                setStatus('Orders slipping! Tighten your line.');
                updateUI();
            }
            scene.remove(crate);
            crates.splice(i, 1);
        }
    }
}

function escalateDifficulty() {
    const waveThreshold = Math.floor(state.elapsed / 25) + 1;
    if (waveThreshold > state.wave) {
        state.wave = waveThreshold;
        state.spawnInterval = Math.max(0.6, state.spawnInterval - 0.15);
        state.speed += 2;
        logEvent(`Wave ${state.wave} activated. Throughput accelerated.`);
        setStatus(`Wave ${state.wave}: throughput acceleration engaged.`);
        updateUI();
    }
}

function animate() {
    const delta = clock.getDelta();
    spawnTimer += delta;

    if (state.active) {
        state.elapsed += delta;
        if (spawnTimer > state.spawnInterval) {
            spawnCrate();
            spawnTimer = 0;
        }
        updatePlayer(delta);
        escalateDifficulty();
    }

    updateCrates(delta);

    const starPositionsAttr = stars.geometry.attributes.position;
    for (let i = 0; i < starPositionsAttr.count; i += 1) {
        starPositionsAttr.array[i * 3 + 2] += state.speed * 0.02 * delta * 60;
        if (starPositionsAttr.array[i * 3 + 2] > 20) {
            starPositionsAttr.array[i * 3 + 2] = -120;
        }
    }
    starPositionsAttr.needsUpdate = true;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, player.position.x * 0.3, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, player.position.y + 3, 0.05);
    camera.lookAt(player.position.x, player.position.y, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function handleResize() {
    const { clientWidth, clientHeight } = root;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight);
}

window.addEventListener('resize', handleResize);

resetGame();
animate();
