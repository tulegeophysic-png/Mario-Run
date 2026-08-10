const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const levelEl = document.getElementById('level');
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const musicButton = document.getElementById('music-toggle');
const shareButton = document.getElementById('share-game');
const highJumpButton = document.querySelector('[data-action="highJump"]');
const message = document.getElementById('message');
const messageTitle = document.getElementById('message-title');

const world = { width: 3200, height: 540, ground: 470 };
const levelData = [
  { platforms: [[0, 470, 3200, 70], [420, 365, 180, 22], [760, 300, 180, 22], [1110, 390, 220, 22], [1510, 330, 210, 22], [1940, 270, 190, 22], [2310, 370, 220, 22]], coins: [[500, 320], [820, 245], [1160, 320], [1580, 275], [2010, 215], [2370, 320], [2700, 400]], mushrooms: [[930, 276], [2050, 246]], saws: [[1000, 450, 22], [1780, 450, 22], [2600, 450, 22]], enemies: [[680, 438, 1.1, 630, 730], [1000, 438, 1.2, 950, 1080], [1380, 438, 1.3, 1330, 1480], [1830, 438, 1.6, 1770, 1900], [2200, 438, 1.5, 2150, 2280]] },
  { platforms: [[0, 470, 3200, 70], [300, 370, 170, 22], [610, 275, 150, 22], [900, 355, 190, 22], [1240, 250, 180, 22], [1560, 350, 140, 22], [1830, 285, 200, 22], [2200, 370, 150, 22], [2530, 250, 170, 22]], coins: [[370, 325], [680, 225], [980, 310], [1320, 200], [1620, 305], [1920, 235], [2270, 325], [2600, 200], [2900, 400]], mushrooms: [[680, 251], [1920, 261], [2700, 446]], saws: [[800, 450, 22], [1460, 450, 22], [2140, 450, 22], [2860, 450, 22]], enemies: [[520, 438, 1.4, 470, 590], [800, 438, 1.5, 750, 860], [1120, 438, 1.7, 1060, 1210], [1710, 438, 1.8, 1640, 1790], [2070, 438, 1.9, 2010, 2150], [2390, 438, 2, 2320, 2470]] },
  { platforms: [[0, 470, 3200, 70], [260, 315, 150, 22], [540, 220, 130, 22], [810, 350, 130, 22], [1080, 260, 160, 22], [1390, 180, 150, 22], [1700, 320, 130, 22], [1980, 220, 170, 22], [2300, 340, 140, 22], [2570, 250, 170, 22]], coins: [[325, 270], [600, 175], [870, 305], [1140, 215], [1450, 135], [1760, 275], [2050, 175], [2370, 295], [2640, 205], [2950, 400]], mushrooms: [[600, 196], [1450, 156], [2370, 316]], saws: [[720, 450, 22], [1320, 450, 22], [1640, 450, 22], [2450, 450, 22], [2920, 450, 22]], enemies: [[450, 438, 1.7, 390, 520], [720, 438, 1.8, 660, 790], [970, 438, 2, 900, 1040], [1280, 438, 2.1, 1210, 1350], [1550, 438, 2.1, 1480, 1630], [2180, 438, 2.3, 2110, 2260], [2450, 438, 2.4, 2380, 2530], [2800, 438, 2.4, 2730, 2900]] },
];
let platforms = []; let coins = []; let mushrooms = []; let saws = []; let enemies = []; let player; let score; let coinCount; let levelIndex; let gameOver; let won; let cameraX; let lastTime = 0;
let audioContext; let musicTimer; let musicEnabled = false; let musicStep = 0; let gameOverPlayed = false; let highJumpsRemaining = 2;

function loadLevel(index) {
  const data = levelData[index];
  platforms = data.platforms.map(([x, y, w, h]) => ({ x, y, w, h }));
  coins = data.coins.map(([x, y]) => ({ x, y, taken: false }));
  mushrooms = data.mushrooms.map(([x, y]) => ({ x, y, taken: false, w: 32, h: 24 }));
  saws = data.saws.map(([x, y, radius]) => ({ x, y, radius }));
  enemies = data.enemies.map(([x, y, speed, left, right]) => ({ x, y, w: 30, h: 32, speed, left, right }));
}

function resetGame() { levelIndex = 0; score = 0; coinCount = 0; startLevel(); }
function startLevel() { player = { x: 80, y: 400, w: 30, h: 40, vx: 0, vy: 0, grounded: false, face: 1 }; highJumpsRemaining = 2; gameOver = false; gameOverPlayed = false; won = false; cameraX = 0; loadLevel(levelIndex); message.classList.add('hidden'); updateHud(); lastTime = 0; requestAnimationFrame(loop); }
function updateHud() { levelEl.textContent = String(levelIndex + 1).padStart(2, '0'); scoreEl.textContent = String(score).padStart(4, '0'); coinsEl.textContent = String(coinCount).padStart(2, '0'); highJumpButton.textContent = `Nhảy cao (${highJumpsRemaining})`; }
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function finish(title, nextLevel = false, death = false) { if (gameOver) return; gameOver = true; messageTitle.textContent = death ? 'Ối! Game Over' : title; document.getElementById('restart').textContent = nextLevel ? 'Màn tiếp theo' : 'Chơi lại'; message.classList.remove('hidden'); if (death) playGameOverMusic(); }
function update(delta) {
  if (gameOver) return;
  player.vy += 0.0018 * delta; player.vx *= 0.84; player.x += player.vx * delta; player.y += player.vy * delta;
  player.x = Math.max(0, Math.min(world.width - player.w, player.x)); player.grounded = false;
  platforms.forEach((platform) => { if (overlap(player, platform) && player.vy >= 0 && player.y + player.h - player.vy * delta <= platform.y + 8) { player.y = platform.y - player.h; player.vy = 0; player.grounded = true; } });
  if (player.y > world.height + 80) finish('Rơi mất rồi!', false, true);
  enemies.forEach((enemy) => { enemy.x += enemy.speed * delta / 16; if (enemy.x < enemy.left || enemy.x > enemy.right) enemy.speed *= -1; if (overlap(player, enemy)) { if (player.vy > 0 && player.y + player.h < enemy.y + 18) { enemy.x = -100; player.vy = -0.65; score += 100; updateHud(); } else finish('Ối!', false, true); } });
  coins.forEach((coin) => { if (!coin.taken && Math.abs(player.x + player.w / 2 - coin.x) < 28 && Math.abs(player.y + player.h / 2 - coin.y) < 42) { coin.taken = true; coinCount += 1; score += 50; updateHud(); } });
  mushrooms.forEach((mushroom) => { const item = { x: mushroom.x - mushroom.w / 2, y: mushroom.y - mushroom.h, w: mushroom.w, h: mushroom.h }; if (!mushroom.taken && overlap(player, item)) { mushroom.taken = true; const feet = player.y + player.h; player.big = true; player.w = 34; player.h = 58; player.y = feet - player.h; score += 200; updateHud(); } });
  saws.forEach((saw) => { const item = { x: saw.x - saw.radius, y: saw.y - saw.radius, w: saw.radius * 2, h: saw.radius * 2 }; if (overlap(player, item)) finish('Dính bẫy răng cưa!', false, true); });
  if (player.x > 3000) { won = true; if (levelIndex === levelData.length - 1) finish('Bạn thắng!'); else finish(`Màn ${levelIndex + 1} hoàn thành!`, true); }
  cameraX = Math.max(0, Math.min(world.width - canvas.width, player.x - canvas.width * .35));
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#75cbe8'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.translate(-cameraX, 0);
  ctx.fillStyle = '#b9ebf2'; [180, 680, 1280, 1900, 2580].forEach((x) => { ctx.beginPath(); ctx.arc(x, 120, 34, 0, Math.PI * 2); ctx.arc(x + 42, 120, 50, 0, Math.PI * 2); ctx.arc(x + 88, 120, 28, 0, Math.PI * 2); ctx.fill(); });
  platforms.forEach((platform) => { ctx.fillStyle = '#8b4e3c'; ctx.fillRect(platform.x, platform.y, platform.w, platform.h); ctx.fillStyle = '#54ad59'; ctx.fillRect(platform.x, platform.y, platform.w, 10); });
  coins.forEach((coin) => { if (!coin.taken) { ctx.fillStyle = '#ffcf46'; ctx.beginPath(); ctx.arc(coin.x, coin.y, 13, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff0a0'; ctx.fillRect(coin.x - 2, coin.y - 8, 4, 16); } });
  mushrooms.forEach((mushroom) => { if (!mushroom.taken) { const x = mushroom.x - mushroom.w / 2; const y = mushroom.y - mushroom.h; ctx.fillStyle = '#e54b45'; ctx.beginPath(); ctx.arc(mushroom.x, y + 11, 16, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff4d2'; ctx.fillRect(x + 3, y + 9, 8, 7); ctx.fillRect(x + 21, y + 9, 8, 7); ctx.fillStyle = '#f1a66d'; ctx.fillRect(x + 6, y + 11, 20, 13); ctx.fillStyle = '#18233f'; ctx.fillRect(x + 8, y + 19, 5, 5); ctx.fillRect(x + 19, y + 19, 5, 5); } });
  saws.forEach((saw) => { ctx.save(); ctx.translate(saw.x, saw.y); ctx.rotate(performance.now() / 500); ctx.fillStyle = '#d9e1e8'; ctx.beginPath(); for (let point = 0; point < 16; point += 1) { const angle = point * Math.PI / 8; const radius = point % 2 ? saw.radius - 6 : saw.radius; ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); } ctx.closePath(); ctx.fill(); ctx.fillStyle = '#526477'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#17233f'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
  enemies.forEach((enemy) => { if (enemy.x > 0) { ctx.fillStyle = '#754342'; ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h); ctx.fillStyle = '#fff'; ctx.fillRect(enemy.x + 6, enemy.y + 8, 6, 8); ctx.fillRect(enemy.x + 19, enemy.y + 8, 6, 8); ctx.fillStyle = '#17233f'; ctx.fillRect(enemy.x + 8, enemy.y + 12, 3, 7); ctx.fillRect(enemy.x + 21, enemy.y + 12, 3, 7); } });
  const hatHeight = player.big ? 18 : 14; const faceY = player.y + hatHeight - 1; const feetY = player.y + player.h; ctx.fillStyle = '#e54b45'; ctx.fillRect(player.x, player.y, player.w, hatHeight); ctx.fillStyle = '#f1a66d'; ctx.fillRect(player.x + 5, faceY, player.w - 10, 17); ctx.fillStyle = '#2c4c92'; ctx.fillRect(player.x + 4, faceY + 16, player.w - 8, feetY - faceY - 21); ctx.fillStyle = '#18233f'; ctx.fillRect(player.x + 2, feetY - 5, 11, 5); ctx.fillRect(player.x + player.w - 11, feetY - 5, 11, 5); ctx.fillStyle = '#18233f'; ctx.fillRect(player.x + (player.face > 0 ? player.w - 10 : 6), faceY + 4, 4, 5); ctx.restore();
}
function loop(time) { const delta = Math.min(32, time - lastTime || 16); lastTime = time; update(delta); draw(); if (!gameOver) requestAnimationFrame(loop); }
function jump(power = -0.72) { if (player.grounded && !gameOver) { player.vy = power; player.grounded = false; } }
function highJump() { if (highJumpsRemaining > 0 && player.grounded && !gameOver) { highJumpsRemaining -= 1; jump(-1.05); updateHud(); } }
function runJump() { if (!gameOver) { player.vx = 0.62 * player.face; jump(-0.95); } }
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
document.addEventListener('keydown', (event) => { if (event.key === 'ArrowLeft') { player.vx = -0.32; player.face = -1; } if (event.key === 'ArrowRight') { player.vx = 0.32; player.face = 1; } if (event.key === ' ' || event.key === 'ArrowUp') { event.preventDefault(); jump(); } if (event.key.toLowerCase() === 'z') highJump(); if (event.key.toLowerCase() === 'x') runJump(); if (event.key.toLowerCase() === 'r') resetGame(); });
document.querySelectorAll('[data-key], [data-action]').forEach((button) => button.addEventListener('pointerdown', () => { if (button.dataset.action === 'highJump') highJump(); else if (button.dataset.action === 'runJump') runJump(); else { const key = button.dataset.key; if (key === 'Space') jump(); else document.dispatchEvent(new KeyboardEvent('keydown', { key })); } }));
document.getElementById('restart').addEventListener('click', () => { if (won && levelIndex < levelData.length - 1) { levelIndex += 1; startLevel(); } else if (won) resetGame(); else resetGame(); }); resetGame();
