import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const SETTINGS_STORAGE_KEY = 'beefbeaterCameraSettings';
const MOVEMENT_SETTINGS_STORAGE_KEY = 'beefbeaterMovementSettings';
const defaultCameraSettings = {
    offsetX: -10,
    offsetY: 12,
    offsetZ: 20,
    panLimitX: 18,
    panLimitZ: 18,
    minHeight: 8,
    maxHeight: 24,
    panSpeed: 18,
};
const defaultMovementSettings = {
    walkSpeed: 8,
    runSpeed: 15,
};
const GRAVITY = -32;
const JUMP_FORCE = 16;

function loadCameraSettings() {
    try {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!stored) return { ...defaultCameraSettings };
        return { ...defaultCameraSettings, ...JSON.parse(stored) };
    } catch (error) {
        console.warn('Unable to load camera settings; using defaults.', error);
        return { ...defaultCameraSettings };
    }
}

function persistCameraSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.warn('Unable to save camera settings.', error);
    }
}

function loadMovementSettings() {
    try {
        const stored = localStorage.getItem(MOVEMENT_SETTINGS_STORAGE_KEY);
        if (!stored) return { ...defaultMovementSettings };
        return { ...defaultMovementSettings, ...JSON.parse(stored) };
    } catch (error) {
        console.warn('Unable to load movement settings; using defaults.', error);
        return { ...defaultMovementSettings };
    }
}

function persistMovementSettings(settings) {
    try {
        localStorage.setItem(MOVEMENT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.warn('Unable to save movement settings.', error);
    }
}

let cameraSettings = loadCameraSettings();
let movementSettings = loadMovementSettings();

const playArea = 70;

const container = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfe0ff);
scene.fog = new THREE.Fog(0xcfe0ff, 40, 160);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(cameraSettings.offsetX, cameraSettings.offsetY, cameraSettings.offsetZ);
scene.add(camera);

const cameraState = {
    offset: new THREE.Vector3(cameraSettings.offsetX, cameraSettings.offsetY, cameraSettings.offsetZ),
    manual: new THREE.Vector3(),
    limits: {
        x: cameraSettings.panLimitX,
        z: cameraSettings.panLimitZ,
        yMin: cameraSettings.minHeight,
        yMax: cameraSettings.maxHeight,
    },
};

const cameraInput = { forward: false, backward: false, left: false, right: false, scrollDelta: 0 };

function applyCameraSettings() {
    cameraState.offset.set(cameraSettings.offsetX, cameraSettings.offsetY, cameraSettings.offsetZ);
    const minPanLimit = playArea;
    cameraState.limits.x = Math.max(Math.abs(cameraSettings.panLimitX), minPanLimit);
    cameraState.limits.z = Math.max(Math.abs(cameraSettings.panLimitZ), minPanLimit);
    cameraState.limits.yMin = Math.min(cameraSettings.minHeight, cameraSettings.maxHeight);
    cameraState.limits.yMax = Math.max(cameraSettings.minHeight, cameraSettings.maxHeight);
    cameraState.manual.x = THREE.MathUtils.clamp(cameraState.manual.x, -cameraState.limits.x, cameraState.limits.x);
    cameraState.manual.z = THREE.MathUtils.clamp(cameraState.manual.z, -cameraState.limits.z, cameraState.limits.z);
}

applyCameraSettings();

const hemi = new THREE.HemisphereLight(0xf6fbff, 0x4f7042, 1.1);
const dir = new THREE.DirectionalLight(0xfff3c2, 1.6);
dir.position.set(25, 50, 20);
dir.castShadow = false;
const glow = new THREE.PointLight(0xfff1a1, 2.5, 120);
glow.position.set(-4, 18, -2);
scene.add(hemi, dir, glow);

const groundGeo = new THREE.PlaneGeometry(160, 160);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x5b3a21, roughness: 0.95, metalness: 0.02 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const pastureColors = [0x3f8f3c, 0x4ba14c, 0x55b25a, 0x6ac16c];
const pasturePadding = 1.5;
const pastureSpread = Math.min(playArea * 1.2, 75);
const pasturePlacementAttempts = 30;

function patchesOverlap(position, width, height, placed) {
    return placed.some((patch) => {
        const overlapX = Math.abs(position.x - patch.x) < (width + patch.width) / 2 + pasturePadding;
        const overlapZ = Math.abs(position.z - patch.z) < (height + patch.height) / 2 + pasturePadding;
        return overlapX && overlapZ;
    });
}

function createPastures() {
    const group = new THREE.Group();
    const placed = [];
    for (let i = 0; i < 14; i += 1) {
        const width = THREE.MathUtils.randFloat(6, 14);
        const height = THREE.MathUtils.randFloat(6, 16);
        let position = null;
        for (let attempt = 0; attempt < pasturePlacementAttempts; attempt += 1) {
            const candidate = {
                x: THREE.MathUtils.randFloatSpread(pastureSpread),
                z: THREE.MathUtils.randFloatSpread(pastureSpread),
            };
            if (!patchesOverlap(candidate, width, height, placed)) {
                position = candidate;
                break;
            }
        }
        if (!position) continue;
        const geo = new THREE.PlaneGeometry(width, height);
        const mat = new THREE.MeshStandardMaterial({
            color: pastureColors[Math.floor(Math.random() * pastureColors.length)],
            roughness: 0.95,
            metalness: 0.02,
        });
        const patch = new THREE.Mesh(geo, mat);
        patch.rotation.x = -Math.PI / 2;
        patch.position.set(position.x, 0.05, position.z);
        patch.receiveShadow = true;
        placed.push({ x: position.x, z: position.z, width, height });
        group.add(patch);
    }
    scene.add(group);
}

function createTrees() {
    const forest = new THREE.Group();
    for (let i = 0; i < 60; i += 1) {
        const trunkHeight = THREE.MathUtils.randFloat(2.8, 4.6);
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, trunkHeight, 10);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a4e2b, roughness: 0.85 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);

        const crownHeight = THREE.MathUtils.randFloat(trunkHeight * 0.9, trunkHeight * 1.3);
        const crownGeo = new THREE.ConeGeometry(1.4, crownHeight, 14);
        const crownMat = new THREE.MeshStandardMaterial({ color: 0x4ac669, roughness: 0.35 });
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.y = trunkHeight / 2 + crownHeight / 2;

        const tree = new THREE.Group();
        tree.add(trunk);
        tree.add(crown);
        tree.position.set(THREE.MathUtils.randFloatSpread(playArea), trunkHeight / 2, THREE.MathUtils.randFloatSpread(playArea));
        tree.rotation.y = THREE.MathUtils.randFloat(0, Math.PI * 2);
        forest.add(tree);
    }
    scene.add(forest);
}

createPastures();
createTrees();

const PLAYER_BASE_HEIGHT = 1.2;
const player = new THREE.Group();
player.position.set(0, PLAYER_BASE_HEIGHT, 0);
scene.add(player);
const playerVelocity = new THREE.Vector3();
const playerState = {
    isGrounded: true,
};

const playerPlaceholderGeo = new THREE.CapsuleGeometry(0.6, 1.4, 8, 16);
const playerPlaceholderMat = new THREE.MeshStandardMaterial({ color: 0xfdf5a6, emissive: 0xffd166, emissiveIntensity: 0.8, roughness: 0.4 });
const playerPlaceholder = new THREE.Mesh(playerPlaceholderGeo, playerPlaceholderMat);
playerPlaceholder.position.y -= PLAYER_BASE_HEIGHT;
player.add(playerPlaceholder);

const playerModelLoader = new FBXLoader();
const PLAYER_MODEL_PATH = 'assets/rawdata/mesh/character_Mesh.fbx';
const playerAnimationLoader = new FBXLoader();
const PLAYER_ANIMATION_PATHS = {
    idle: 'assets/rawdata/animations/BEEFBEATER_TBONE2_Idle.fbx',
    walk: 'assets/rawdata/animations/BEEFBEATER_TBONE2_Walk.fbx',
    run: 'assets/rawdata/animations/BEEFBEATER_TBONE2_Run.fbx',
};
let playerMixer = null;
const playerActions = {};
let activeAnimationKey = null;

function normalizePlayerModel(model) {
    const centeredBox = new THREE.Box3().setFromObject(model);
    const center = centeredBox.getCenter(new THREE.Vector3());
    model.position.sub(center);
    const groundedBox = new THREE.Box3().setFromObject(model);
    model.position.y -= groundedBox.min.y;
}

function loadPlayerAnimations(model) {
    playerMixer = new THREE.AnimationMixer(model);
    Object.entries(PLAYER_ANIMATION_PATHS).forEach(([key, path]) => {
        playerAnimationLoader.load(
            path,
            (anim) => {
                if (!anim.animations || anim.animations.length === 0) return;
                const clip = anim.animations[0];
                const action = playerMixer.clipAction(clip);
                action.loop = THREE.LoopRepeat;
                action.clampWhenFinished = false;
                playerActions[key] = action;
                updateMovementAnimation(movementState);
            },
            undefined,
            (error) => {
                console.error(`Failed to load ${key} animation.`, error);
            },
        );
    });
}

function playPlayerAnimation(key) {
    const next = playerActions[key];
    if (!next || activeAnimationKey === key) return;
    const previousKey = activeAnimationKey;
    const previous = previousKey ? playerActions[previousKey] : null;
    next.enabled = true;
    next.reset();
    next.fadeIn(0.25).play();
    if (previous && previous !== next) {
        previous.fadeOut(0.25);
    }
    activeAnimationKey = key;
}

function updateMovementAnimation(state) {
    if (!playerMixer) return;
    let animationKey = 'idle';
    if (state === 'walking') {
        animationKey = 'walk';
    } else if (state === 'running') {
        animationKey = 'run';
    }
    playPlayerAnimation(animationKey);
}

function loadPlayerMesh() {
    playerModelLoader.load(
        PLAYER_MODEL_PATH,
        (fbx) => {
            fbx.scale.setScalar(0.01);
            normalizePlayerModel(fbx);
            fbx.position.y -= PLAYER_BASE_HEIGHT;
            fbx.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            player.add(fbx);
            player.remove(playerPlaceholder);
            playerPlaceholder.geometry.dispose();
            playerPlaceholder.material.dispose();
            loadPlayerAnimations(fbx);
        },
        undefined,
        (error) => {
            console.error('Failed to load player mesh.', error);
        },
    );
}

loadPlayerMesh();

const arrowGeo = new THREE.ConeGeometry(0.35, 1.4, 16);
const arrowMat = new THREE.MeshBasicMaterial({ color: 0xfff1a1 });
const arrow = new THREE.Mesh(arrowGeo, arrowMat);
arrow.position.set(0, 2.2, 0.3);
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
let movementState = 'idle';

function setMovementState(nextState) {
    const changed = movementState !== nextState;
    movementState = nextState;
    if (changed) {
        console.log(`Player state: ${movementState}`);
    }
    updateMovementAnimation(movementState);
}

function handleKeyChange(key, value) {
    if (!isGameActive) return false;
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

function attemptJump() {
    if (!isGameActive || !playerState.isGrounded) return;
    playerVelocity.y = JUMP_FORCE;
    playerState.isGrounded = false;
    playJumpAnimation();
}

function playJumpAnimation() {
    // Placeholder for future jump animation trigger
}

function handleAttackInput(key) {
    if (!isGameActive) return;
    const attackMap = {
        j: 'Light',
        k: 'Medium',
        l: 'Heavy',
    };
    if (attackMap[key]) {
        console.log(`[Attack] ${attackMap[key]} attack triggered`);
    }
}

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (event.code === 'Space') {
        attemptJump();
        event.preventDefault();
        return;
    }
    if (['j', 'k', 'l'].includes(key)) {
        handleAttackInput(key);
        event.preventDefault();
        return;
    }
    const handled = handleKeyChange(key, true);
    if (handled) event.preventDefault();
});

window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (event.code === 'Space') {
        event.preventDefault();
        return;
    }
    const handled = handleKeyChange(key, false);
    if (handled) event.preventDefault();
});

window.addEventListener(
    'wheel',
    (event) => {
        if (!isGameActive) return;
        event.preventDefault();
        cameraInput.scrollDelta += event.deltaY;
    },
    { passive: false }
);

const scoreEl = document.querySelector('[data-score]');
const bestEl = document.querySelector('[data-best]');
const resetButton = document.getElementById('reset-button');
const cameraForm = document.getElementById('camera-form');
const saveSettingsButton = document.getElementById('save-settings');
const movementForm = document.getElementById('movement-form');
const saveMovementButton = document.getElementById('save-movement');
const startScreen = document.querySelector('[data-start-screen]');
const startButton = document.querySelector('[data-start-button]');

let isGameActive = false;

const state = {
    score: 0,
    best: 0,
};

if (resetButton) {
    resetButton.addEventListener('click', resetGame);
}

function populateCameraForm() {
    if (!cameraForm) return;
    const mapping = {
        offsetX: cameraSettings.offsetX,
        offsetY: cameraSettings.offsetY,
        offsetZ: cameraSettings.offsetZ,
        panLimitX: cameraSettings.panLimitX,
        panLimitZ: cameraSettings.panLimitZ,
        minHeight: cameraSettings.minHeight,
        maxHeight: cameraSettings.maxHeight,
        panSpeed: cameraSettings.panSpeed,
    };
    Object.entries(mapping).forEach(([field, value]) => {
        if (cameraForm.elements[field]) {
            cameraForm.elements[field].value = value;
        }
    });
}

function populateMovementForm() {
    if (!movementForm) return;
    const mapping = {
        walkSpeed: movementSettings.walkSpeed,
        runSpeed: movementSettings.runSpeed,
    };
    Object.entries(mapping).forEach(([field, value]) => {
        if (movementForm.elements[field]) {
            movementForm.elements[field].value = value;
        }
    });
}

function toNumber(value, fallback) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

let saveFeedbackTimeout;
function handleSaveSettings() {
    if (!cameraForm) return;
    const formData = new FormData(cameraForm);
    cameraSettings = {
        offsetX: toNumber(formData.get('offsetX'), cameraSettings.offsetX),
        offsetY: toNumber(formData.get('offsetY'), cameraSettings.offsetY),
        offsetZ: toNumber(formData.get('offsetZ'), cameraSettings.offsetZ),
        panLimitX: Math.abs(toNumber(formData.get('panLimitX'), cameraSettings.panLimitX)),
        panLimitZ: Math.abs(toNumber(formData.get('panLimitZ'), cameraSettings.panLimitZ)),
        minHeight: toNumber(formData.get('minHeight'), cameraSettings.minHeight),
        maxHeight: toNumber(formData.get('maxHeight'), cameraSettings.maxHeight),
        panSpeed: Math.max(0.1, toNumber(formData.get('panSpeed'), cameraSettings.panSpeed)),
    };
    if (cameraSettings.minHeight > cameraSettings.maxHeight) {
        cameraSettings.maxHeight = cameraSettings.minHeight + 1;
    }
    persistCameraSettings(cameraSettings);
    applyCameraSettings();
    camera.position.set(cameraSettings.offsetX, cameraSettings.offsetY, cameraSettings.offsetZ);
    if (saveSettingsButton) {
        const original = saveSettingsButton.textContent;
        saveSettingsButton.textContent = 'Saved!';
        clearTimeout(saveFeedbackTimeout);
        saveFeedbackTimeout = setTimeout(() => {
            saveSettingsButton.textContent = original;
        }, 1400);
    }
}

populateCameraForm();
if (saveSettingsButton) {
    saveSettingsButton.addEventListener('click', handleSaveSettings);
}

let saveMovementFeedbackTimeout;
function handleSaveMovement() {
    if (!movementForm) return;
    const formData = new FormData(movementForm);
    const walkSpeed = Math.max(0.1, toNumber(formData.get('walkSpeed'), movementSettings.walkSpeed));
    let runSpeed = Math.max(0.1, toNumber(formData.get('runSpeed'), movementSettings.runSpeed));
    if (runSpeed <= walkSpeed) {
        runSpeed = walkSpeed + 1;
    }
    movementSettings = { walkSpeed, runSpeed };
    persistMovementSettings(movementSettings);
    if (saveMovementButton) {
        const original = saveMovementButton.textContent;
        saveMovementButton.textContent = 'Saved!';
        clearTimeout(saveMovementFeedbackTimeout);
        saveMovementFeedbackTimeout = setTimeout(() => {
            saveMovementButton.textContent = original;
        }, 1400);
    }
}

populateMovementForm();
if (saveMovementButton) {
    saveMovementButton.addEventListener('click', handleSaveMovement);
}

function updateUI() {
    scoreEl.textContent = Math.round(state.score);
    bestEl.textContent = Math.round(state.best);
}

function resetGame() {
    state.score = 0;
    player.position.set(0, PLAYER_BASE_HEIGHT, 0);
    playerVelocity.set(0, 0, 0);
    playerState.isGrounded = true;
    cameraState.manual.set(0, 0, 0);
    cameraState.offset.set(cameraSettings.offsetX, cameraSettings.offsetY, cameraSettings.offsetZ);
    camera.position.set(cameraSettings.offsetX, cameraSettings.offsetY, cameraSettings.offsetZ);
    updateUI();
}

function updatePlayer(delta) {
    const move = new THREE.Vector3();
    if (playerInput.forward) move.z -= 1;
    if (playerInput.backward) move.z += 1;
    if (playerInput.left) move.x -= 1;
    if (playerInput.right) move.x += 1;
    let state = 'idle';
    if (move.lengthSq() > 0) {
        move.normalize();
        state = playerInput.boost ? 'running' : 'walking';
    }
    if (!playerState.isGrounded && state === 'idle') {
        state = movementState;
    }
    setMovementState(state);
    const baseSpeed = playerInput.boost ? movementSettings.runSpeed : movementSettings.walkSpeed;
    move.multiplyScalar(baseSpeed * delta);
    player.position.add(move);
    player.position.x = THREE.MathUtils.clamp(player.position.x, -playArea, playArea);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -playArea, playArea);

    if (move.lengthSq() > 0) {
        player.rotation.y = Math.atan2(move.x, move.z);
    }

    playerVelocity.y += GRAVITY * delta;
    player.position.y += playerVelocity.y * delta;
    if (player.position.y <= PLAYER_BASE_HEIGHT) {
        player.position.y = PLAYER_BASE_HEIGHT;
        playerVelocity.y = 0;
        playerState.isGrounded = true;
    } else {
        playerState.isGrounded = false;
    }

    playerShadow.position.x = player.position.x;
    playerShadow.position.z = player.position.z;
}

function handleCameraPan(delta) {
    const panSpeed = cameraSettings.panSpeed;
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
    if (!isGameActive) return;
    const delta = clock.getDelta();
    updatePlayer(delta);
    updateCamera(delta);
    updateNodes(delta);
    if (playerMixer) {
        playerMixer.update(delta);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function startGame() {
    if (isGameActive) return;
    isGameActive = true;
    document.body.dataset.gameState = 'playing';
    clock.start();
    resetGame();
    animate();
}

if (startButton) {
    startButton.addEventListener('click', () => {
        startGame();
        if (startScreen) {
            startScreen.setAttribute('aria-hidden', 'true');
        }
    });
} else {
    startGame();
}

window.addEventListener('resize', () => {
    const { innerWidth, innerHeight } = window;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
