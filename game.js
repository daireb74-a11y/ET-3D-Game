// E.T. Escape Game
const canvas = document.getElementById('gameCanvas');
let gameState = {
    playing: false,
    level: 1,
    score: 0,
    health: 3,
    et: { x: 0, y: 0, width: 40, height: 40 },
    fbiAgents: [],
    stars: [],
    bike: { x: 0, y: 0, width: 50, height: 50 },
    gameWidth: 0,
    gameHeight: 0
};

function startGame() {
    document.getElementById('startScreen').classList.remove('active');
    document.getElementById('gameOverScreen').classList.remove('active');
    document.getElementById('winScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');
    
    gameState.playing = true;
    gameState.score = 0;
    gameState.health = 3;
    gameState.level = 1;
    
    initGame();
    gameLoop();
}

function initGame() {
    gameState.gameWidth = canvas.clientWidth;
    gameState.gameHeight = canvas.clientHeight;
    
    // E.T. starting position (bottom left)
    gameState.et = {
        x: 50,
        y: gameState.gameHeight - 80,
        width: 40,
        height: 40,
        vx: 0,
        vy: 0
    };
    
    // Bike position (top right)
    gameState.bike = {
        x: gameState.gameWidth - 80,
        y: 50,
        width: 50,
        height: 50
    };
    
    // Create FBI agents
    gameState.fbiAgents = [];
    const agentCount = 2 + gameState.level;
    for (let i = 0; i < agentCount; i++) {
        gameState.fbiAgents.push({
            x: Math.random() * (gameState.gameWidth - 100) + 50,
            y: Math.random() * (gameState.gameHeight - 150) + 50,
            width: 35,
            height: 35,
            vx: (Math.random() - 0.5) * 2 * (1 + gameState.level * 0.3),
            vy: (Math.random() - 0.5) * 2 * (1 + gameState.level * 0.3)
        });
    }
    
    // Create stars
    gameState.stars = [];
    const starCount = 5 + gameState.level * 2;
    for (let i = 0; i < starCount; i++) {
        gameState.stars.push({
            x: Math.random() * (gameState.gameWidth - 50) + 25,
            y: Math.random() * (gameState.gameHeight - 100) + 50,
            width: 25,
            height: 25
        });
    }
    
    canvas.innerHTML = '';
    renderGame();
}

function gameLoop() {
    if (!gameState.playing) return;
    
    updateGame();
    renderGame();
    checkCollisions();
    
    requestAnimationFrame(gameLoop);
}

function updateGame() {
    // Smooth E.T. movement
    gameState.et.x += gameState.et.vx;
    gameState.et.y += gameState.et.vy;
    
    // Boundary checking
    gameState.et.x = Math.max(0, Math.min(gameState.et.x, gameState.gameWidth - gameState.et.width));
    gameState.et.y = Math.max(0, Math.min(gameState.et.y, gameState.gameHeight - gameState.et.height));
    
    // Update FBI agents
    gameState.fbiAgents.forEach(fbi => {
        fbi.x += fbi.vx;
        fbi.y += fbi.vy;
        
        // Bounce off walls
        if (fbi.x <= 0 || fbi.x >= gameState.gameWidth - fbi.width) {
            fbi.vx *= -1;
        }
        if (fbi.y <= 0 || fbi.y >= gameState.gameHeight - fbi.height - 50) {
            fbi.vy *= -1;
        }
        
        // Chase E.T. if close
        const distX = gameState.et.x - fbi.x;
        const distY = gameState.et.y - fbi.y;
        const dist = Math.sqrt(distX * distX + distY * distY);
        
        if (dist < 200) {
            fbi.vx += (distX / dist) * 0.1;
            fbi.vy += (distY / dist) * 0.1;
        }
    });
}

function renderGame() {
    // Clear canvas
    canvas.innerHTML = '';
    
    // E.T.
    const etDiv = document.createElement('div');
    etDiv.className = 'et';
    etDiv.textContent = '👽';
    etDiv.style.left = gameState.et.x + 'px';
    etDiv.style.top = gameState.et.y + 'px';
    canvas.appendChild(etDiv);
    
    // FBI agents
    gameState.fbiAgents.forEach(fbi => {
        const fbiDiv = document.createElement('div');
        fbiDiv.className = 'fbi';
        fbiDiv.textContent = '🚗';
        fbiDiv.style.left = fbi.x + 'px';
        fbiDiv.style.top = fbi.y + 'px';
        canvas.appendChild(fbiDiv);
    });
    
    // Stars
    gameState.stars.forEach(star => {
        const starDiv = document.createElement('div');
        starDiv.className = 'star';
        starDiv.textContent = '⭐';
        starDiv.style.left = star.x + 'px';
        starDiv.style.top = star.y + 'px';
        canvas.appendChild(starDiv);
    });
    
    // Bike
    const bikeDiv = document.createElement('div');
    bikeDiv.className = 'bike';
    bikeDiv.textContent = '🚲';
    bikeDiv.style.left = gameState.bike.x + 'px';
    bikeDiv.style.top = gameState.bike.y + 'px';
    canvas.appendChild(bikeDiv);
    
    // Update HUD
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('health').textContent = gameState.health;
    document.getElementById('level').textContent = gameState.level;
}

function checkCollisions() {
    // Check E.T. vs Stars
    gameState.stars = gameState.stars.filter(star => {
        if (distance(gameState.et, star) < 40) {
            gameState.score += 10;
            return false;
        }
        return true;
    });
    
    // Check E.T. vs FBI agents
    gameState.fbiAgents.forEach(fbi => {
        if (distance(gameState.et, fbi) < 50) {
            gameState.health--;
            // Knockback E.T.
            gameState.et.x -= Math.sign(gameState.et.x - fbi.x) * 50;
            gameState.et.y -= Math.sign(gameState.et.y - fbi.y) * 50;
            
            if (gameState.health <= 0) {
                endGame();
            }
        }
    });
    
    // Check E.T. vs Bike (goal)
    if (distance(gameState.et, gameState.bike) < 60) {
        winLevel();
    }
}

function distance(obj1, obj2) {
    const x = (obj1.x + obj1.width / 2) - (obj2.x + obj2.width / 2);
    const y = (obj1.y + obj1.height / 2) - (obj2.y + obj2.height / 2);
    return Math.sqrt(x * x + y * y);
}

function endGame() {
    gameState.playing = false;
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('gameOverScreen').classList.add('active');
    document.getElementById('finalScore').textContent = gameState.score;
}

function winLevel() {
    gameState.playing = false;
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('winScreen').classList.add('active');
    document.getElementById('winScore').textContent = gameState.score;
}

function nextLevel() {
    gameState.level++;
    startGame();
}

function backToMenu() {
    gameState.playing = false;
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('gameOverScreen').classList.remove('active');
    document.getElementById('winScreen').classList.remove('active');
    document.getElementById('startScreen').classList.add('active');
}

// Handle click/tap to move E.T.
canvas.addEventListener('click', (e) => {
    if (!gameState.playing) return;
    
    const rect = canvas.getBoundingClientRect();
    const targetX = e.clientX - rect.left;
    const targetY = e.clientY - rect.top;
    
    const distX = targetX - gameState.et.x;
    const distY = targetY - gameState.et.y;
    const dist = Math.sqrt(distX * distX + distY * distY);
    
    const speed = 3;
    gameState.et.vx = (distX / dist) * speed;
    gameState.et.vy = (distY / dist) * speed;
});

// Touch support for mobile
canvas.addEventListener('touchstart', (e) => {
    if (!gameState.playing) return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const targetX = touch.clientX - rect.left;
    const targetY = touch.clientY - rect.top;
    
    const distX = targetX - gameState.et.x;
    const distY = targetY - gameState.et.y;
    const dist = Math.sqrt(distX * distX + distY * distY);
    
    const speed = 3;
    gameState.et.vx = (distX / dist) * speed;
    gameState.et.vy = (distY / dist) * speed;
});

// Keyboard support for desktop
document.addEventListener('keydown', (e) => {
    if (!gameState.playing) return;
    
    const speed = 3;
    switch(e.key) {
        case 'ArrowUp':
            gameState.et.vy = -speed;
            e.preventDefault();
            break;
        case 'ArrowDown':
            gameState.et.vy = speed;
            e.preventDefault();
            break;
        case 'ArrowLeft':
            gameState.et.vx = -speed;
            e.preventDefault();
            break;
        case 'ArrowRight':
            gameState.et.vx = speed;
            e.preventDefault();
            break;
    }
});

document.addEventListener('keyup', (e) => {
    if (!gameState.playing) return;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
            gameState.et.vy = 0;
            break;
        case 'ArrowLeft':
        case 'ArrowRight':
            gameState.et.vx = 0;
            break;
    }
});
