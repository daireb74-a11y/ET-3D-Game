// E.T. Escape 3D Game using Three.js
let scene, camera, renderer, et, spaceship, ground;
let fbiAgents = [];
let powerUps = [];
let stars = [];
let gameState = {
    playing: false,
    score: 0,
    health: 3,
    level: 1,
    gameWidth: 200,
    gameHeight: 200
};

function initThreeJS() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x001a4d);
    scene.fog = new THREE.Fog(0x001a4d, 500, 1000);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    document.getElementById('canvas').parentElement.replaceChild(renderer.domElement, document.getElementById('canvas'));

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 150, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Stars in background
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array();
    for (let i = 0; i < 1000; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 2000;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 3 });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(gameState.gameWidth * 2, gameState.gameHeight * 2);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x1a4d1a });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create E.T.
    createET();

    // Create Spaceship (goal)
    createSpaceship();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Mouse/Touch controls
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('touchstart', onDocumentTouch);
    document.addEventListener('keydown', onKeyDown);

    gameLoop();
}

function createET() {
    const group = new THREE.Group();
    
    // Body (sphere)
    const bodyGeometry = new THREE.SphereGeometry(3, 32, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xaa6600, 
        roughness: 0.7,
        metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head (smaller sphere)
    const headGeometry = new THREE.SphereGeometry(2.5, 32, 32);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 4;
    head.castShadow = true;
    group.add(head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-1, 5, 2.2);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(1, 5, 2.2);
    group.add(leftEye);
    group.add(rightEye);

    // Finger (glowing)
    const fingerGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const fingerMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffff00, 
        emissive: 0xffff00,
        metalness: 0.8
    });
    const finger = new THREE.Mesh(fingerGeometry, fingerMaterial);
    finger.position.set(3.5, 1, 0);
    group.add(finger);

    group.position.set(0, 0, 0);
    et = group;
    scene.add(et);
}

function createSpaceship() {
    const group = new THREE.Group();

    // Main body (cone)
    const bodyGeometry = new THREE.ConeGeometry(8, 25, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00, 
        emissive: 0x00aa00,
        metalness: 0.8,
        roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Bottom circle
    const bottomGeometry = new THREE.CylinderGeometry(8, 8, 2, 32);
    const bottom = new THREE.Mesh(bottomGeometry, bodyMaterial);
    bottom.position.y = -12;
    bottom.castShadow = true;
    group.add(bottom);

    // Lights around ship
    const lightCount = 6;
    for (let i = 0; i < lightCount; i++) {
        const angle = (i / lightCount) * Math.PI * 2;
        const lightGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const lightMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00ffff, 
            emissive: 0x00ffff
        });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(Math.cos(angle) * 9, -5, Math.sin(angle) * 9);
        group.add(light);
    }

    // Add point light from spaceship
    const pointLight = new THREE.PointLight(0x00ff00, 2, 150);
    pointLight.position.set(0, 5, 0);
    group.add(pointLight);

    group.position.set(-gameState.gameWidth * 0.4, 0, -gameState.gameHeight * 0.4);
    spaceship = group;
    scene.add(spaceship);
}

function createFBIAgent(x, z) {
    const group = new THREE.Group();

    // Body (cube)
    const bodyGeometry = new THREE.BoxGeometry(3, 5, 3);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 0.5
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    group.add(body);

    // Head (sphere)
    const headGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 4;
    head.castShadow = true;
    group.add(head);

    // Light on head
    const lightGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00 });
    const light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.set(0, 5, 1.2);
    group.add(light);

    group.position.set(x, 0, z);
    group.userData = {
        vx: (Math.random() - 0.5) * 2,
        vz: (Math.random() - 0.5) * 2
    };

    scene.add(group);
    return group;
}

function createPowerUp(x, z) {
    const geometry = new THREE.OctahedronGeometry(1.5, 2);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0xff00ff, 
        emissive: 0xff00ff,
        metalness: 0.8
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 2, z);
    mesh.castShadow = true;
    mesh.userData = { rotation: 0 };
    scene.add(mesh);
    return mesh;
}

function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('winScreen').classList.add('hidden');
    document.getElementById('hud').style.display = 'flex';

    gameState.playing = true;
    gameState.score = 0;
    gameState.health = 3;

    // Clear existing objects
    fbiAgents.forEach(agent => scene.remove(agent));
    powerUps.forEach(powerup => scene.remove(powerup));
    fbiAgents = [];
    powerUps = [];

    // Spawn FBI agents
    const agentCount = 3 + gameState.level;
    for (let i = 0; i < agentCount; i++) {
        const x = (Math.random() - 0.5) * gameState.gameWidth;
        const z = (Math.random() - 0.5) * gameState.gameHeight;
        fbiAgents.push(createFBIAgent(x, z));
    }

    // Spawn power-ups
    const powerUpCount = 5 + gameState.level * 2;
    for (let i = 0; i < powerUpCount; i++) {
        const x = (Math.random() - 0.5) * gameState.gameWidth;
        const z = (Math.random() - 0.5) * gameState.gameHeight;
        powerUps.push(createPowerUp(x, z));
    }

    updateHUD();
}

function updateET(targetX, targetZ) {
    const speed = 1;
    const distance = Math.sqrt(targetX * targetX + targetZ * targetZ);
    
    if (distance > speed) {
        et.position.x += (targetX / distance) * speed;
        et.position.z += (targetZ / distance) * speed;
        
        // Rotate ET to face direction
        et.rotation.y = Math.atan2(targetX, targetZ);
    }
}

function updateFBIAgents() {
    fbiAgents.forEach(agent => {
        // Movement
        agent.position.x += agent.userData.vx;
        agent.position.z += agent.userData.vz;

        // Boundary check and bounce
        if (agent.position.x > gameState.gameWidth / 2 || agent.position.x < -gameState.gameWidth / 2) {
            agent.userData.vx *= -1;
        }
        if (agent.position.z > gameState.gameHeight / 2 || agent.position.z < -gameState.gameHeight / 2) {
            agent.userData.vz *= -1;
        }

        // Chase E.T.
        const dx = et.position.x - agent.position.x;
        const dz = et.position.z - agent.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 80) {
            agent.userData.vx += (dx / dist) * 0.15;
            agent.userData.vz += (dz / dist) * 0.15;
        }

        // Rotation for effect
        agent.rotation.y += 0.02;
    });
}

function updatePowerUps() {
    powerUps.forEach(powerup => {
        powerup.rotation.x += 0.05;
        powerup.rotation.y += 0.1;
        powerup.position.y = 2 + Math.sin(Date.now() * 0.003) * 0.8;
    });
}

function checkCollisions() {
    // Check power-ups
    powerUps = powerUps.filter(powerup => {
        const dist = et.position.distanceTo(powerup.position);
        if (dist < 8) {
            gameState.score += 50;
            scene.remove(powerup);
            return false;
        }
        return true;
    });

    // Check FBI agents
    fbiAgents.forEach(agent => {
        const dist = et.position.distanceTo(agent.position);
        if (dist < 10) {
            gameState.health--;
            et.position.x = 0;
            et.position.z = 0;
            if (gameState.health <= 0) {
                endGame();
            }
        }
    });

    // Check spaceship
    const distToShip = et.position.distanceTo(spaceship.position);
    if (distToShip < 20) {
        winLevel();
    }
}

function updateHUD() {
    document.getElementById('scoreValue').textContent = gameState.score;
    document.getElementById('healthValue').textContent = gameState.health;
    document.getElementById('levelValue').textContent = gameState.level;
}

function endGame() {
    gameState.playing = false;
    document.getElementById('hud').style.display = 'none';
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('finalScore').textContent = gameState.score;
}

function winLevel() {
    gameState.playing = false;
    document.getElementById('hud').style.display = 'none';
    document.getElementById('winScreen').classList.remove('hidden');
    document.getElementById('winScore').textContent = gameState.score;
}

function nextLevel() {
    gameState.level++;
    startGame();
}

function gameLoop() {
    requestAnimationFrame(gameLoop);

    if (gameState.playing) {
        updateFBIAgents();
        updatePowerUps();
        checkCollisions();
        updateHUD();
        
        // Camera follow E.T.
        camera.position.x = et.position.x;
        camera.position.z = et.position.z + 100;
        camera.lookAt(et.position.x, 30, et.position.z);
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentClick(event) {
    if (!gameState.playing) return;
    const targetX = (event.clientX / window.innerWidth - 0.5) * 200;
    const targetZ = (event.clientY / window.innerHeight - 0.5) * 200;
    updateET(targetX, targetZ);
}

function onDocumentTouch(event) {
    if (!gameState.playing) return;
    const touch = event.touches[0];
    const targetX = (touch.clientX / window.innerWidth - 0.5) * 200;
    const targetZ = (touch.clientY / window.innerHeight - 0.5) * 200;
    updateET(targetX, targetZ);
}

function onKeyDown(event) {
    if (!gameState.playing) return;
    const speed = 10;
    switch(event.key) {
        case 'ArrowUp':
            et.position.z -= speed;
            break;
        case 'ArrowDown':
            et.position.z += speed;
            break;
        case 'ArrowLeft':
            et.position.x -= speed;
            break;
        case 'ArrowRight':
            et.position.x += speed;
            break;
    }
}

// Start when page loads
window.addEventListener('load', initThreeJS);
