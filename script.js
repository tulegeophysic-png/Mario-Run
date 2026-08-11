const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const levelEl = document.getElementById('level');
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const mushroomsEl = document.getElementById('mushrooms');
const livesEl = document.getElementById('lives');
const musicButton = document.getElementById('music-toggle');
const shareButton = document.getElementById('share-game');
const highJumpButton = document.querySelector('[data-action="highJump"]');
const runJumpButton = document.querySelector('[data-action="runJump"]');
const message = document.getElementById('message');
const messageTitle = document.getElementById('message-title');

const world = { width: 3200, height: 540, ground: 470 };

// Danh sách hiệu ứng động (Score popup, vỡ gạch, v.v.)
let visualEffects = [];

const levelData = [
  { 
    platforms: [[0, 470, 3200, 70], [420, 365, 180, 22], [760, 300, 180, 22], [1110, 390, 220, 22], [1510, 330, 210, 22], [1940, 270, 190, 22], [2310, 370, 220, 22]], 
    coins: [[500, 320], [820, 245], [1160, 320], [1580, 275], [2010, 215], [2370, 320], [2700, 400]], 
    mushrooms: [[930, 276], [2050, 246]], 
    clouds: [[930, 235], [2050, 205]], 
    saws: [[1000, 450, 22], [1780, 450, 22], [2600, 450, 22]], 
    cacti: [[1220, 440, 28], [2480, 440, 28]], 
    enemies: [[680, 438, 1.1, 630, 730], [1000, 438, 1.2, 950, 1080], [1380, 438, 1.3, 1330, 1480], [1830, 438, 1.6, 1770, 1900], [2200, 438, 1.5, 2150, 2280]],
    // Ý 1: Rãnh hào tử thần
    pits: [{ x: 1300, w: 120 }, { x: 2150, w: 140 }],
    // Ý 7: Hộp dấu hỏi (?)
    questionBoxes: [
      { x: 300, y: 350, content: 'coin' },
      { x: 500, y: 250, content: 'mushroom' },
      { x: 800, y: 320, content: 'coin' },
      { x: 1400, y: 280, content: 'mushroom' }
    ]
  },
  { 
    platforms: [[0, 470, 3200, 70], [300, 370, 170, 22], [610, 275, 150, 22], [900, 355, 190, 22], [1240, 250, 180, 22], [1560, 350, 140, 22], [1830, 285, 200, 22], [2200, 370, 150, 22], [2530, 250, 170, 22]], 
    coins: [[370, 325], [680, 225], [980, 310], [1320, 200], [1620, 305], [1920, 235], [2270, 325], [2600, 200], [2900, 400]], 
    mushrooms: [[680, 251], [1920, 261], [2700, 446]], 
    clouds: [[680, 210], [1920, 220], [2700, 405]], 
    saws: [[800, 450, 22], [1460, 450, 22], [2140, 450, 22], [2860, 450, 22]], 
    cacti: [[1040, 440, 28], [1980, 440, 28], [2760, 440, 28]], 
    enemies: [[520, 438, 1.4, 470, 590], [800, 438, 1.5, 750, 860], [1120, 438, 1.7, 1060, 1210], [1710, 438, 1.8, 1640, 1790], [2070, 438, 1.9, 2010, 2150], [2390, 438, 2, 2320, 2470]],
    pits: [{ x: 1000, w: 150 }, { x: 1750, w: 130 }],
    questionBoxes: [
      { x: 350, y: 320, content: 'mushroom' },
      { x: 750, y: 300, content: 'coin' },
      { x: 1200, y: 310, content: 'coin' }
    ]
  },
  { 
    platforms: [[0, 470, 3200, 70], [260, 315, 150, 22], [540, 220, 130, 22], [810, 350, 130, 22], [1080, 260, 160, 22], [1390, 180, 150, 22], [1700, 320, 130, 22], [1980, 220, 170, 22], [2300, 340, 140, 22], [2570, 250, 170, 22]], 
    coins: [[325, 270], [600, 175], [870, 305], [1140, 215], [1450, 135], [1760, 275], [2050, 175], [2370, 295], [2640, 205], [2950, 400]], 
    mushrooms: [[600, 196], [1450, 156], [2370, 316]], 
    clouds: [[600, 155], [1450, 115], [2370, 275]], 
    saws: [[720, 450, 22], [1320, 450, 22], [1640, 450, 22], [2450, 450, 22], [2920, 450, 22]], 
    cacti: [[900, 440, 28], [1850, 440, 28], [2700, 440, 28]], 
    enemies: [[450, 438, 1.7, 390, 520], [720, 438, 1.8, 660, 790], [970, 438, 2, 900, 1040], [1280, 438, 2.1, 1210, 1350], [1550, 438, 2.1, 1480, 1630], [2180, 438, 2.3, 2110, 2260], [2450, 438, 2.4, 2380, 2530], [2800, 438, 2.4, 2730, 2900]],
    pits: [{ x: 1200, w: 160 }, { x: 2000, w: 150 }],
    questionBoxes: [
      { x: 400, y: 300, content: 'coin' },
      { x: 1000, y: 220, content: 'mushroom' }
    ]
  },
];

for (let levelNumber = 4; levelNumber <= 10; levelNumber += 1) {
  const source = levelData[(levelNumber - 4) % 3];
  const difficulty = levelNumber - 3;
  const extraHazards = Array.from({ length: Math.min(7, difficulty + 1) }, (_, index) => [360 + index * 420, 450, 22]);
  const extraEnemies = Array.from({ length: Math.min(6, difficulty) }, (_, index) => [360 + index * 420, 438, 1.2 + difficulty * 0.18, 320 + index * 420, 410 + index * 420]);
  levelData.push({
    platforms: source.platforms.map((platform) => [...platform]),
    coins: source.coins.map((coin) => [...coin]),
    mushrooms: source.mushrooms.map((mushroom) => [...mushroom]),
    clouds: source.clouds.map((cloud) => [...cloud]),
    saws: [...source.saws.map((saw) => [...saw]), ...extraHazards],
    cacti: Array.from({ length: Math.min(6, difficulty) }, (_, index) => [500 + index * 500, 440, 28]),
    enemies: [...source.enemies.map(([x, y, speed, left, right]) => [x, y, speed + difficulty * 0.12, left, right]), ...extraEnemies],
    pits: source.pits || [],
    questionBoxes: source.questionBoxes || []
  });
}

let platforms = []; let coins = []; let mushrooms = []; let clouds = []; let springs = []; let movingBridges = []; let bridgeGaps = []; let saws = []; let cacti = []; let enemies = []; let snails = []; let pits = []; let questionBoxes = [];
let player; let score; let coinCount; let mushroomCount; let lives; let levelIndex; let gameOver; let won; let levelEnding = false; let endStartedAt = 0; let cameraX; let lastTime = 0;
let audioContext; let musicTimer; let musicEnabled = false; let musicStep = 0; let gameOverPlayed = false; let highJumpsRemaining = 2; let runJumpsRemaining = 2;
const heldKeys = new Set();

function addEffect(x, y, text, color = '#ffdf77') {
  visualEffects.push({ x, y, text, color, alpha: 1, vy: -1.5, life: 30 });
}

function loadLevel(index) {
  const data = levelData[index];
  platforms = data.platforms.map(([x, y, w, h]) => ({ x, y, w, h }));
  coins = data.coins.map(([x, y]) => ({ x, y, taken: false }));
  mushrooms = data.mushrooms.map(([x, y]) => ({ x, y, taken: false, w: 32, h: 24 }));
  clouds = data.clouds.map(([x, y]) => ({ x, y, revealed: false, content: Math.random() < 0.45 ? 'mushroom' : (Math.random() < 0.7 ? 'coin' : 'empty'), item: null }));
  
  pits = data.pits ? data.pits.map(p => ({ x: p.x, w: p.w, y: 470, h: 70 })) : [];
  questionBoxes = data.questionBoxes ? data.questionBoxes.map(b => ({ x: b.x, y: b.y, w: 32, h: 32, hit: false, content: b.content })) : [];

  const towerX = 880 + (index % 4) * 90;
  const towerPlatforms = [
    { x: towerX, y: 390, w: 150, h: 14 },
    { x: towerX + 170, y: 330, w: 150, h: 14 },
    { x: towerX + 80, y: 270, w: 150, h: 14 },
    { x: towerX + 250, y: 210, w: 150, h: 14 },
  ];
  platforms.push(...towerPlatforms);
  movingBridges = [{ x: 540 + (index % 3) * 24, y: 395, w: 128, h: 14, min: 500, max: 760, speed: 0.7 + (index % 3) * 0.12, direction: 1 }];
  if (index > 4) movingBridges.push({ x: 1740, y: 315, w: 108, h: 14, min: 1660, max: 1940, speed: 0.9, direction: -1 });
  bridgeGaps = [{ x: 470, w: 390 }];
  if (index > 4) bridgeGaps.push({ x: 1620, w: 380 });
  platforms.push(...movingBridges);

  const movingBridgeMushrooms = movingBridges.map((bridge) => ({ x: bridge.x + bridge.w / 2, y: bridge.y - 14, taken: false, w: 32, h: 24, type: 'green', attachedBridge: bridge }));
  movingBridges.forEach((bridge) => { coins.push({ x: bridge.x + bridge.w / 2, y: bridge.y - 44, taken: false, attachedBridge: bridge }); });

  // Ý 5: Đặt lò xo ở vị trí thích hợp (dưới bệ đỡ tower/nấm)
  const springSpots = [{ x: towerX + 30, y: 470 }, { x: towerX + 110, y: 390 }];
  springs = springSpots.map(s => ({ x: s.x, y: s.y, bouncing: false }));
  
  mushrooms.push({ x: towerX + 30, y: 220, taken: false, w: 32, h: 24, type: 'red' });
  mushrooms.push({ x: towerX + 110, y: 150, taken: false, w: 32, h: 24, type: 'green' });

  saws = data.saws.map(([x, y, radius]) => ({ x, y, radius }));
  cacti = data.cacti.map(([x, y, radius]) => ({ x, y, radius }));
  enemies = data.enemies.map(([x, y, speed, left, right], enemyIndex) => { const fastFactor = [0.72, 1.05, 1.42][(enemyIndex + index) % 3]; const patrolExtra = (enemyIndex + index) % 2 ? 70 : 18; return { x, y, w: 30, h: 32, speed: speed * fastFactor, left: Math.max(0, left - patrolExtra), right: Math.min(world.width - 50, right + patrolExtra) }; });
  snails = [{ x: 640 + (index % 3) * 120, y: 438, w: 34, h: 30, speed: 0.45 + (index % 3) * 0.12, left: 580, right: 760 }, { x: 1660 + (index % 4) * 90, y: 438, w: 34, h: 30, speed: 0.38 + (index % 2) * 0.14, left: 1560, right: 1840 }];
}

function resetGame() { levelIndex = 0; score = 0; coinCount = 0; mushroomCount = 0; lives = 1; startLevel(); }
function startLevel() { 
  player = { x: 80, y: 400, w: 24, h: 32, vx: 0, vy: 0, grounded: false, face: 1, big: false, redMushrooms: 0, greenBoost: false, blinkUntil: 0, eatEffectTimer: 0 }; 
  highJumpsRemaining = 2; runJumpsRemaining = 2; gameOver = false; gameOverPlayed = false; won = false; levelEnding = false; cameraX = 0; visualEffects = []; loadLevel(levelIndex); message.classList.add('hidden'); updateHud(); lastTime = 0; requestAnimationFrame(loop); 
}

function updateHud() { levelEl.textContent = String(levelIndex + 1).padStart(2, '0'); scoreEl.textContent = String(score).padStart(4, '0'); coinsEl.textContent = String(coinCount).padStart(2, '0'); mushroomsEl.textContent = String(mushroomCount).padStart(2, '0'); livesEl.textContent = String(lives).padStart(2, '0'); highJumpButton.textContent = `Nhảy cao (${highJumpsRemaining})`; runJumpButton.textContent = `Chạy + nhảy (${runJumpsRemaining})`; }
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function finish(title, nextLevel = false, death = false) { if (gameOver) return; gameOver = true; messageTitle.textContent = death ? 'Ối! Game Over' : title; document.getElementById('restart').textContent = nextLevel ? 'Màn tiếp theo' : 'Chơi lại'; message.classList.remove('hidden'); if (death) playGameOverMusic(); }

function update(delta) {
  if (gameOver) return;
  if (levelEnding) { updateLevelFinish(); return; }

  // Cập nhật hiệu ứng chữ/điểm
  for (let i = visualEffects.length - 1; i >= 0; i--) {
    let ef = visualEffects[i];
    ef.y += ef.vy;
    ef.life -= 1;
    ef.alpha = ef.life / 30;
    if (ef.life <= 0) visualEffects.splice(i, 1);
  }

  movingBridges.forEach((bridge) => { bridge.x += bridge.speed * bridge.direction * delta / 16; if (bridge.x <= bridge.min || bridge.x >= bridge.max) bridge.direction *= -1; });
  mushrooms.forEach((mushroom) => { if (mushroom.attachedBridge && !mushroom.taken) { mushroom.x = mushroom.attachedBridge.x + mushroom.attachedBridge.w / 2; mushroom.y = mushroom.attachedBridge.y - 14; } });
  coins.forEach((coin) => { if (coin.attachedBridge && !coin.taken) { coin.x = coin.attachedBridge.x + coin.attachedBridge.w / 2; coin.y = coin.attachedBridge.y - 44; } });

  player.vy += 0.0018 * delta;
  const horizontalAcceleration = (player.greenBoost ? 0.0126 : 0.0105) * delta;
  const horizontalDirection = (heldKeys.has('ArrowRight') ? 1 : 0) - (heldKeys.has('ArrowLeft') ? 1 : 0);
  if (horizontalDirection) { player.vx += horizontalDirection * horizontalAcceleration; player.face = horizontalDirection; } else { player.vx *= player.big ? 0.88 : 0.84; }
  const maxSpeed = player.greenBoost ? 0.273 : (player.big ? 0.1764 : 0.168);
  player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx)); player.x += player.vx * delta; player.y += player.vy * delta;
  player.x = Math.max(0, Math.min(world.width - player.w, player.x)); player.grounded = false;

  // Va chạm với mặt đất và các bệ đỡ (Tránh các rãnh hào pit)
  platforms.forEach((platform) => { 
    const inPit = pits.some(p => player.x + player.w > p.x && player.x < p.x + p.w && platform.y === 470);
    const overGap = platform.y === 470 && (bridgeGaps.some((gap) => player.x + player.w > gap.x && player.x < gap.x + gap.w) || inPit); 
    if (!overGap && overlap(player, platform) && player.vy >= 0 && player.y + player.h - player.vy * delta <= platform.y + 8) { 
      player.y = platform.y - player.h; player.vy = 0; player.grounded = true; 
    } 
  });

  // Ý 7: Va chạm Hộp dấu hỏi (?) từ dưới lên
  questionBoxes.forEach((box) => {
    if (overlap(player, box)) {
      if (player.vy < 0 && player.y >= box.y + box.h - 10) {
        player.vy = 0.1;
        if (!box.hit) {
          box.hit = true;
          if (box.content === 'coin') {
            coinCount += 1; score += 50;
            addEffect(box.x, box.y - 10, '+50 xu!', '#ffcf46');
          } else if (box.content === 'mushroom') {
            mushrooms.push({ x: box.x + 16, y: box.y - 20, taken: false, w: 32, h: 24, type: 'red' });
            addEffect(box.x, box.y - 10, 'Nấm xuất hiện!', '#e54b45');
          }
          updateHud();
        }
      }
    }
  });

  // Ý 2: Lò xo được tăng lực bật cao đến vị trí nấm (-1.05)
  springs.forEach((spring) => { 
    const item = { x: spring.x - 14, y: spring.y - 16, w: 28, h: 18 }; 
    if (overlap(player, item) && player.vy >= 0) { 
      player.y = spring.y - player.h - 2; 
      player.vy = -1.05; 
      player.grounded = false; 
      spring.bouncing = true; 
      addEffect(spring.x, spring.y - 20, 'BOING!', '#ffdf77');
    } 
  });

  // Ý 1: Rơi xuống rãnh hào tốn mạng lập tức
  pits.forEach((pit) => {
    if (player.x + player.w > pit.x && player.x < pit.x + pit.w && player.y + player.h >= pit.y) {
      finish('Lọt xuống rãnh hào!', false, true);
    }
  });

  if (player.y > world.height + 80) finish('Rơi mất rồi!', false, true);

  // Kẻ thù & Quái
  enemies.forEach((enemy) => { 
    enemy.x += enemy.speed * delta / 16; 
    if (enemy.x < enemy.left || enemy.x > enemy.right) enemy.speed *= -1; 
    if (overlap(player, enemy)) { 
      if (player.vy > 0 && player.y + player.h < enemy.y + 18) { 
        enemy.x = -100; player.vy = -0.65; score += 100; collectEnemyCoin(); 
        addEffect(player.x, player.y, '+100 DIỂM'); // Ý 6
      } else handleObstacleHit(); 
    } 
  });

  snails.forEach((snail) => { 
    snail.x += snail.speed * delta / 16; 
    if (snail.x < snail.left || snail.x > snail.right) snail.speed *= -1; 
    if (overlap(player, snail)) { 
      if (player.vy > 0 && player.y + player.h < snail.y + 16) { 
        snail.defeated = true; player.vy = -0.68; score += 120; collectEnemyCoin(); 
        addEffect(player.x, player.y, '+120 DIỂM'); // Ý 6
      } else if (!snail.defeated) handleObstacleHit(); 
    } 
  });

  // Ý 6: Ăn xu có hiệu ứng
  coins.forEach((coin) => { 
    if (!coin.taken && Math.abs(player.x + player.w / 2 - coin.x) < 28 && Math.abs(player.y + player.h / 2 - coin.y) < 42) { 
      coin.taken = true; coinCount += 1; score += 50; 
      addEffect(coin.x, coin.y - 10, '+50', '#ffcf46');
      updateHud(); 
    } 
  });

  // Băng qua Mây
  clouds.forEach((cloud) => { 
    const cloudHitbox = { x: cloud.x - 42, y: cloud.y - 18, w: 84, h: 32 }; 
    if (!cloud.revealed && player.vy < 0 && overlap(player, cloudHitbox)) { 
      cloud.revealed = true; 
      if (cloud.content === 'mushroom' || cloud.content === 'coin') cloud.item = { x: cloud.x, y: cloud.y + 48, type: cloud.content, taken: false }; 
    } 
    if (cloud.item && !cloud.item.taken && Math.abs(player.x + player.w / 2 - cloud.item.x) < 30 && Math.abs(player.y + player.h / 2 - cloud.item.y) < 42) { 
      cloud.item.taken = true; 
      if (cloud.item.type === 'mushroom') collectMushroom(); 
      else { 
        coinCount += 1; score += 50; 
        addEffect(cloud.item.x, cloud.item.y, '+50');
        updateHud(); 
      } 
    } 
  });

  // Ăn nấm
  mushrooms.forEach((mushroom) => { 
    const item = { x: mushroom.x - mushroom.w / 2, y: mushroom.y - mushroom.h, w: mushroom.w, h: mushroom.h }; 
    if (!mushroom.taken && overlap(player, item)) { 
      mushroom.taken = true; 
      collectMushroom(mushroom.type || 'red'); 
    } 
  });

  saws.forEach((saw) => { const item = { x: saw.x - saw.radius, y: saw.y - saw.radius, w: saw.radius * 2, h: saw.radius * 2 }; if (overlap(player, item)) handleObstacleHit(); });
  cacti.forEach((cactus) => { const item = { x: cactus.x - cactus.radius, y: cactus.y - cactus.radius, w: cactus.radius * 2, h: cactus.radius * 2 }; if (overlap(player, item)) handleObstacleHit(); });

  if (player.x > 3000) startLevelFinish();
  cameraX = Math.max(0, Math.min(world.width - canvas.width, player.x - canvas.width * .35));
}

function startLevelFinish() { levelEnding = true; endStartedAt = performance.now(); player.vx = 0; player.vy = 0; won = true; }
function updateLevelFinish() { const elapsed = performance.now() - endStartedAt; if (elapsed < 850) { const progress = elapsed / 850; player.x = 2990 + progress * 24; player.y = 400 - Math.sin(progress * Math.PI) * 110; } else if (elapsed < 1500) { player.x = 3014; player.y = 360; } else if (elapsed < 2450) { const progress = (elapsed - 1500) / 950; player.x = 3014 + progress * 100; player.y = 400; } else { levelEnding = false; finish(levelIndex === levelData.length - 1 ? 'Bạn thắng!' : `Màn ${levelIndex + 1} hoàn thành!`, levelIndex < levelData.length - 1); } cameraX = Math.max(0, Math.min(world.width - canvas.width, player.x - canvas.width * .35)); }

// Ý 4 & 6: Hiệu ứng nhấp nháy loen lên khi ăn nấm
function collectMushroom(type = 'red') { 
  const feet = player.y + player.h; 
  mushroomCount += 1; lives += 1; score += 250; 
  player.eatEffectTimer = performance.now() + 600; // Nhấp nháy 600ms
  addEffect(player.x, player.y - 20, 'LỚN LÊN! +250', '#54ad59');
  
  if (type === 'green') player.greenBoost = true; 
  else { 
    player.redMushrooms += 1; player.big = true; player.w = 28; player.h = 46; player.y = feet - player.h; 
  } 
  updateHud(); 
}

function collectEnemyCoin() { coinCount += 1; score += 50; updateHud(); }

function handleObstacleHit() { 
  if (performance.now() < player.blinkUntil || gameOver) return; 
  if (player.big) { 
    const feet = player.y + player.h; 
    player.big = false; player.redMushrooms = 0; player.w = 24; player.h = 32; player.y = feet - player.h; 
    player.blinkUntil = performance.now() + 1100; 
    updateHud(); 
  } else { 
    lives -= 1; updateHud(); 
    if (lives <= 0) finish('Ối! Game Over', false, true); 
    else { 
      player.x = Math.max(80, player.x - 120); player.vx = 0; player.blinkUntil = performance.now() + 1100; 
    } 
  } 
}

// Ý 3: Vẽ Mario chi tiết & thực tế hơn (Áo yếm, Mũ có logo, Râu, Mắt)
function drawMario(ctx, player) {
  const x = player.x;
  const y = player.y;
  const w = player.w;
  const h = player.h;

  ctx.save();
  if (player.face < 0) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(-1, 1);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }

  // Ý 4: Xử lý hiệu ứng nhấp nháy sáng chói khi mới ăn nấm
  if (performance.now() < player.eatEffectTimer) {
    if (Math.floor(performance.now() / 50) % 2 === 0) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffffff';
    }
  }

  // 1. Mũ đỏ & Vành mũ
  ctx.fillStyle = '#e52521';
  ctx.fillRect(x + 2, y, w - 4, 8);
  ctx.fillRect(x + 4, y - 2, w - 8, 2);
  ctx.fillRect(x, y + 6, w, 3); // Vành mũ

  // Logo M màu trắng trên mũ
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 4, 3, 0, Math.PI * 2);
  ctx.fill();

  // 2. Khuôn mặt & Da
  ctx.fillStyle = '#fcc082';
  ctx.fillRect(x + 3, y + 9, w - 6, 9);

  // Mắt
  ctx.fillStyle = '#000000';
  ctx.fillRect(x + w - 8, y + 10, 2, 3);

  // Mũi to tròn
  ctx.fillStyle = '#fcc082';
  ctx.fillRect(x + w - 5, y + 12, 5, 4);

  // Râu đặc trưng
  ctx.fillStyle = '#4a2500';
  ctx.fillRect(x + w - 9, y + 15, 8, 3);

  // 3. Áo trong màu đỏ
  ctx.fillStyle = '#e52521';
  ctx.fillRect(x + 4, y + 18, w - 8, 4);

  // 4. Quần yếm màu xanh dương
  ctx.fillStyle = '#0020c2';
  ctx.fillRect(x + 3, y + 21, w - 6, h - 26);

  // Cúc áo vàng
  ctx.fillStyle = '#fcd800';
  ctx.fillRect(x + 5, y + 22, 2, 2);

  // 5. Giày màu nâu
  ctx.fillStyle = '#654321';
  ctx.fillRect(x + 1, y + h - 5, 9, 5);
  ctx.fillRect(x + w - 10, y + h - 5, 9, 5);

  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#75cbe8'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.translate(-cameraX, 0);

  // Vẽ mây
  ctx.fillStyle = '#b9ebf2'; [180, 680, 1280, 1900, 2580].forEach((x) => { ctx.beginPath(); ctx.arc(x, 120, 34, 0, Math.PI * 2); ctx.arc(x + 42, 120, 50, 0, Math.PI * 2); ctx.arc(x + 88, 120, 28, 0, Math.PI * 2); ctx.fill(); });

  // Vẽ các nền đất
  platforms.forEach((platform) => { ctx.fillStyle = '#8b4e3c'; ctx.fillRect(platform.x, platform.y, platform.w, platform.h); ctx.fillStyle = '#54ad59'; ctx.fillRect(platform.x, platform.y, platform.w, 10); });

  // Ý 1: Vẽ các rãnh hào tử thần
  pits.forEach((pit) => {
    ctx.fillStyle = '#162b4d';
    ctx.fillRect(pit.x, pit.y, pit.w, pit.h);
    ctx.fillStyle = '#0a1424';
    ctx.fillRect(pit.x, pit.y + 20, pit.w, pit.h - 20);
  });

  // Ý 7: Vẽ Hộp Dấu Hỏi (?)
  questionBoxes.forEach((box) => {
    if (box.hit) {
      ctx.fillStyle = '#8f795d';
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.strokeStyle = '#524331';
      ctx.strokeRect(box.x, box.y, box.w, box.h);
    } else {
      ctx.fillStyle = '#fca048';
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x + 2, box.y + 2, box.w - 4, box.h - 4);
      
      // Vẽ dấu ?
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('?', box.x + 10, box.y + 24);
    }
  });

  movingBridges.forEach((bridge) => { ctx.fillStyle = '#75452f'; ctx.fillRect(bridge.x, bridge.y + bridge.h - 2, bridge.w, 5); ctx.fillStyle = '#d28a4d'; ctx.fillRect(bridge.x, bridge.y, bridge.w, bridge.h); ctx.fillStyle = '#f0b66b'; ctx.fillRect(bridge.x + 5, bridge.y + 3, bridge.w - 10, 4); ctx.fillStyle = '#526477'; ctx.fillRect(bridge.x + 12, bridge.y + bridge.h, 4, 18); ctx.fillRect(bridge.x + bridge.w - 16, bridge.y + bridge.h, 4, 18); });
  bridgeGaps.forEach((gap) => { ctx.fillStyle = '#245477'; ctx.fillRect(gap.x, 470, gap.w, 70); ctx.fillStyle = '#5eb8c3'; ctx.fillRect(gap.x + 20, 490, 44, 4); ctx.fillRect(gap.x + 140, 515, 58, 4); });

  // Vẽ lò xo
  springs.forEach((spring) => { const compressed = spring.bouncing && performance.now() % 420 < 120 ? 2 : 0; const baseY = spring.y + 1; const topY = spring.y - 17 + compressed; ctx.fillStyle = '#75452f'; ctx.fillRect(spring.x - 9, baseY, 18, 4); ctx.fillStyle = '#d28a4d'; ctx.fillRect(spring.x - 9, baseY - 2, 18, 3); ctx.fillStyle = '#e0e7ed'; ctx.fillRect(spring.x - 9, topY, 18, 4); ctx.strokeStyle = '#526477'; ctx.lineWidth = 1; ctx.strokeRect(spring.x - 9, topY, 18, 4); ctx.strokeStyle = '#394a5f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(spring.x - 6, baseY); ctx.lineTo(spring.x + 5, baseY - 4); ctx.lineTo(spring.x - 5, baseY - 7); ctx.lineTo(spring.x + 6, baseY - 11); ctx.lineTo(spring.x - 4, baseY - 14); ctx.lineTo(spring.x + 6, topY + 4); ctx.stroke(); });

  coins.forEach((coin) => { if (!coin.taken) { ctx.fillStyle = '#ffcf46'; ctx.beginPath(); ctx.arc(coin.x, coin.y, 13, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff0a0'; ctx.fillRect(coin.x - 2, coin.y - 8, 4, 16); } });
  clouds.forEach((cloud) => { ctx.fillStyle = '#f6fbff'; ctx.beginPath(); ctx.arc(cloud.x - 25, cloud.y, 18, 0, Math.PI * 2); ctx.arc(cloud.x, cloud.y - 10, 25, 0, Math.PI * 2); ctx.arc(cloud.x + 28, cloud.y, 18, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#d9eef5'; ctx.fillRect(cloud.x - 42, cloud.y, 84, 13); if (cloud.item && !cloud.item.taken) { if (cloud.item.type === 'coin') { ctx.fillStyle = '#ffcf46'; ctx.beginPath(); ctx.arc(cloud.item.x, cloud.item.y, 13, 0, Math.PI * 2); ctx.fill(); } else { ctx.fillStyle = '#e54b45'; ctx.beginPath(); ctx.arc(cloud.item.x, cloud.item.y - 13, 16, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#f1a66d'; ctx.fillRect(cloud.item.x - 10, cloud.item.y - 13, 20, 13); } } });
  mushrooms.forEach((mushroom) => { if (!mushroom.taken) { const x = mushroom.x - mushroom.w / 2; const y = mushroom.y - mushroom.h; const green = mushroom.type === 'green'; ctx.fillStyle = green ? '#39b86b' : '#e54b45'; ctx.beginPath(); ctx.arc(mushroom.x, y + 11, 16, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff4d2'; ctx.fillRect(x + 3, y + 9, 8, 7); ctx.fillRect(x + 21, y + 9, 8, 7); ctx.fillStyle = '#f1a66d'; ctx.fillRect(x + 6, y + 11, 20, 13); ctx.fillStyle = '#18233f'; ctx.fillRect(x + 8, y + 19, 5, 5); ctx.fillRect(x + 19, y + 19, 5, 5); } });
  saws.forEach((saw) => { ctx.save(); ctx.translate(saw.x, saw.y); ctx.rotate(performance.now() / 500); ctx.fillStyle = '#d9e1e8'; ctx.beginPath(); for (let point = 0; point < 16; point += 1) { const angle = point * Math.PI / 8; const radius = point % 2 ? saw.radius - 6 : saw.radius; ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); } ctx.closePath(); ctx.fill(); ctx.fillStyle = '#526477'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#17233f'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
  cacti.forEach((cactus) => { ctx.save(); ctx.translate(cactus.x, cactus.y); ctx.fillStyle = '#ba6f46'; ctx.fillRect(-22, 0, 44, 12); ctx.fillStyle = '#3f9b61'; ctx.fillRect(-11, -34, 22, 36); ctx.fillRect(-17, -25, 12, 10); ctx.fillRect(5, -18, 12, 10); ctx.fillStyle = '#f7c66a'; ctx.fillRect(-18, 4, 36, 5); ctx.strokeStyle = '#b9e58c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, -30); ctx.lineTo(-5, -4); ctx.moveTo(5, -30); ctx.lineTo(5, -4); ctx.stroke(); ctx.restore(); });
  drawFinishGoal();
  snails.forEach((snail) => { if (!snail.defeated) { ctx.fillStyle = '#d58a45'; ctx.fillRect(snail.x, snail.y + 17, snail.w, 10); ctx.fillStyle = '#7d5aa5'; ctx.beginPath(); ctx.arc(snail.x + 14, snail.y + 13, 14, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#d8b4ed'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(snail.x + 14, snail.y + 13, 7, 0, Math.PI * 1.6); ctx.stroke(); ctx.fillStyle = '#18233f'; ctx.fillRect(snail.x + 25, snail.y + 7, 3, 3); } });
  enemies.forEach((enemy) => { if (enemy.x > 0) { ctx.fillStyle = '#754342'; ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h); ctx.fillStyle = '#fff'; ctx.fillRect(enemy.x + 6, enemy.y + 8, 6, 8); ctx.fillRect(enemy.x + 19, enemy.y + 8, 6, 8); ctx.fillStyle = '#17233f'; ctx.fillRect(enemy.x + 8, enemy.y + 12, 3, 7); ctx.fillRect(enemy.x + 21, enemy.y + 12, 3, 7); } });

  // Vẽ Mario (chế độ chớp tắt khi bị dính đòn)
  const blinking = performance.now() < player.blinkUntil && Math.floor(performance.now() / 90) % 2 === 0; 
  if (!blinking) { 
    drawMario(ctx, player);
  }

  // Ý 6: Vẽ hiệu ứng văn bản bay lên
  visualEffects.forEach((ef) => {
    ctx.save();
    ctx.globalAlpha = ef.alpha;
    ctx.fillStyle = ef.color;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(ef.text, ef.x, ef.y);
    ctx.restore();
  });

  ctx.restore();
}

function drawFinishGoal() { const flagX = 3045; const poleTop = 245; ctx.fillStyle = '#526477'; ctx.fillRect(flagX, poleTop, 8, 225); ctx.fillStyle = '#d9e1e8'; ctx.beginPath(); ctx.arc(flagX + 4, poleTop - 5, 8, 0, Math.PI * 2); ctx.fill(); const progress = levelEnding ? Math.min(1, Math.max(0, (performance.now() - endStartedAt - 850) / 650)) : 0; ctx.fillStyle = '#e54b45'; ctx.beginPath(); ctx.moveTo(flagX + 8, poleTop + 12 + progress * 160); ctx.lineTo(flagX + 72, poleTop + 30 + progress * 160); ctx.lineTo(flagX + 8, poleTop + 58 + progress * 160); ctx.closePath(); ctx.fill(); const gateX = 3150; ctx.fillStyle = '#8b4e3c'; ctx.fillRect(gateX, 400, 76, 70); ctx.fillStyle = '#d28a4d'; ctx.fillRect(gateX + 10, 390, 56, 80); ctx.fillStyle = '#17233f'; ctx.beginPath(); ctx.arc(gateX + 38, 420, 25, Math.PI, 0); ctx.lineTo(gateX + 63, 470); ctx.lineTo(gateX + 13, 470); ctx.closePath(); ctx.fill(); }
function loop(time) { const delta = Math.min(32, time - lastTime || 16); lastTime = time; update(delta); draw(); if (!gameOver) requestAnimationFrame(loop); }
function jump(power = -0.72) { if (player.grounded && !gameOver) { const direction = (heldKeys.has('ArrowRight') ? 1 : 0) - (heldKeys.has('ArrowLeft') ? 1 : 0); if (direction) { player.face = direction; player.vx = (player.greenBoost ? 0.273 : (player.big ? 0.1764 : 0.168)) * direction; } player.vy = power; player.grounded = false; } }
function highJump() { if (highJumpsRemaining > 0 && player.grounded && !gameOver) { highJumpsRemaining -= 1; jump(-1.05); updateHud(); } }
function runJump() { if (runJumpsRemaining > 0 && player.grounded && !gameOver) { runJumpsRemaining -= 1; player.vx = (player.greenBoost ? 0.4725 : (player.big ? 0.4095 : 0.3255)) * player.face; jump(-0.95); updateHud(); } }

function playMusicNote(frequency, duration = 0.18) { if (!audioContext || !musicEnabled) return; const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); oscillator.type = 'square'; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(0.035, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration); oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + duration); }
function playGameOverMusic() { if (gameOverPlayed) return; gameOverPlayed = true; if (musicEnabled) stopMusic(); const AudioContext = window.AudioContext || window.webkitAudioContext; if (!AudioContext) return; audioContext = audioContext || new AudioContext(); audioContext.resume(); [392, 330, 262, 196].forEach((frequency, index) => { window.setTimeout(() => { const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); oscillator.type = 'sawtooth'; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(0.07, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.32); oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + 0.32); }, index * 220); }); }
function startMusic() { if (musicEnabled) return; const AudioContext = window.AudioContext || window.webkitAudioContext; if (!AudioContext) return; audioContext = audioContext || new AudioContext(); audioContext.resume(); musicEnabled = true; musicButton.textContent = '♫ Nhạc: Bật'; const melody = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23]; playMusicNote(melody[musicStep], 0.2); musicTimer = setInterval(() => { musicStep = (musicStep + 1) % melody.length; playMusicNote(melody[musicStep]); }, 240); }
function stopMusic() { musicEnabled = false; clearInterval(musicTimer); musicTimer = null; musicButton.textContent = '♫ Nhạc: Tắt'; if (audioContext) audioContext.suspend(); }
function toggleMusic() { if (musicEnabled) stopMusic(); else startMusic(); }
musicButton.addEventListener('click', toggleMusic);

async function shareGame() {
  if (window.location.protocol === 'file:' || ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    shareButton.textContent = 'Cần đưa game lên web trước';
    window.setTimeout(() => { shareButton.textContent = '↗ Chia sẻ game'; }, 2600);
    return;
  }
  const shareUrl = window.location.href;
  try {
    if (navigator.share) await navigator.share({ title: 'Marrio Run', text: 'Chơi Marrio Run cùng mình!', url: shareUrl });
    else await navigator.clipboard.writeText(shareUrl);
    shareButton.textContent = '✓ Đã sao chép link';
  } catch (error) {
    if (error.name !== 'AbortError') shareButton.textContent = 'Link đã sẵn sàng';
  }
  window.setTimeout(() => { shareButton.textContent = '↗ Chia sẻ game'; }, 2200);
}

shareButton.addEventListener('click', shareGame);
document.addEventListener('keydown', (event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); heldKeys.add(event.key); } if (event.key === ' ' || event.key === 'ArrowUp') { event.preventDefault(); jump(); } if (event.key.toLowerCase() === 'z') highJump(); if (event.key.toLowerCase() === 'x') runJump(); if (event.key.toLowerCase() === 'r') resetGame(); });
document.addEventListener('keyup', (event) => { heldKeys.delete(event.key); });
document.querySelectorAll('[data-key], [data-action]').forEach((button) => { button.addEventListener('pointerdown', () => { if (button.dataset.action === 'highJump') highJump(); else if (button.dataset.action === 'runJump') runJump(); else { const key = button.dataset.key; if (key === 'Space') jump(); else heldKeys.add(key); } }); button.addEventListener('pointerup', () => heldKeys.delete(button.dataset.key)); button.addEventListener('pointerleave', () => heldKeys.delete(button.dataset.key)); });
document.getElementById('restart').addEventListener('click', () => { if (won && levelIndex < levelData.length - 1) { levelIndex += 1; startLevel(); } else if (won) resetGame(); else resetGame(); }); resetGame();