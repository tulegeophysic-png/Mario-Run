// ==========================================
// 1. CẤU HÌNH CANVAS & BIẾN HỆ THỐNG
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GRAVITY = 0.5;

// ==========================================
// 2. NHÂN VẬT (PLAYER)
// ==========================================
const player = {
  x: 30,
  y: 200,
  width: 24,
  height: 32,
  vx: 0,
  vy: 0,
  speed: 3,
  jumpForce: -10,
  isGrounded: false
};

const keys = { right: false, left: false };

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
  if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') && player.isGrounded) {
    player.vy = player.jumpForce;
    player.isGrounded = false;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
});

// ==========================================
// 3. KHỞI TẠO BẢN ĐỒ & ĐỐI TƯỢNG
// ==========================================
const ground = { x: 0, y: 300, width: 600, height: 50 };
const upperBridge = { x: 320, y: 160, width: 180, height: 20 }; // Cầu lùi sang x=320
const questionBlock = { x: 180, y: 120, width: 30, height: 30 };

// Class Lò Xo: Đặt ở x=180 (vùng trống giữa màn, dưới khối hộp, không vướng cầu)
class Spring {
  constructor(x, y, width, height, bounceForce = -15) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.bounceForce = bounceForce;
  }

  draw() {
    ctx.fillStyle = '#aaa';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = '#555';
    ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 4);
  }

  checkBounce(p) {
    if (
      p.x < this.x + this.width &&
      p.x + p.width > this.x &&
      p.y + p.height >= this.y &&
      p.y + p.height <= this.y + 12 &&
      p.vy > 0
    ) {
      p.vy = this.bounceForce;
      p.isGrounded = false;
    }
  }
}

// Class Ống Trụ: Va chạm cứng, bắt buộc nhảy lên trên, không đi xuyên
class Pipe {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw() {
    ctx.fillStyle = '#00a800';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.fillRect(this.x - 4, this.y, this.width + 8, 16);
    ctx.strokeRect(this.x - 4, this.y, this.width + 8, 16);
  }

  resolveCollision(p) {
    if (
      p.x < this.x + this.width &&
      p.x + p.width > this.x &&
      p.y < this.y + this.height &&
      p.y + p.height > this.y
    ) {
      let overlapLeft = (p.x + p.width) - this.x;
      let overlapRight = (this.x + this.width) - p.x;
      let overlapTop = (p.y + p.height) - this.y;
      let overlapBottom = (this.y + this.height) - p.y;

      let minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapTop && p.vy >= 0) {
        // Đứng trên đỉnh ống trụ
        p.y = this.y - p.height;
        p.vy = 0;
        p.isGrounded = true;
      } else if (minOverlap === overlapLeft) {
        // Chặn va chạm bên trái
        p.x = this.x - p.width;
      } else if (minOverlap === overlapRight) {
        // Chặn va chạm bên phải
        p.x = this.x + this.width;
      } else if (minOverlap === overlapBottom) {
        // Chặn va chạm từ bên dưới
        p.y = this.y + this.height;
        p.vy = 0;
      }
    }
  }
}

const spring = new Spring(180, 280, 30, 20, -15);
const pipe = new Pipe(400, 220, 50, 80);

// ==========================================
// 4. VÒNG LẶP XỬ LÝ & VẼ (GAME LOOP)
// ==========================================
function update() {
  if (keys.right) player.vx = player.speed;
  else if (keys.left) player.vx = -player.speed;
  else player.vx = 0;

  player.x += player.vx;
  player.vy += GRAVITY;
  player.y += player.vy;
  player.isGrounded = false;

  // Va chạm mặt đất
  if (player.y + player.height >= ground.y) {
    player.y = ground.y - player.height;
    player.vy = 0;
    player.isGrounded = true;
  }

  // Va chạm cầu trên
  if (
    player.x < upperBridge.x + upperBridge.width &&
    player.x + player.width > upperBridge.x &&
    player.y + player.height >= upperBridge.y &&
    player.y + player.height <= upperBridge.y + 12 &&
    player.vy >= 0
  ) {
    player.y = upperBridge.y - player.height;
    player.vy = 0;
    player.isGrounded = true;
  }

  // Xử lý logic Lò xo & Ống trụ
  spring.checkBounce(player);
  pipe.resolveCollision(player);

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Vẽ đất & cầu
  ctx.fillStyle = '#c84c0c';
  ctx.fillRect(ground.x, ground.y, ground.width, ground.height);
  ctx.fillStyle = '#fcb438';
  ctx.fillRect(upperBridge.x, upperBridge.y, upperBridge.width, upperBridge.height);

  // Vẽ khối hộp
  ctx.fillRect(questionBlock.x, questionBlock.y, questionBlock.width, questionBlock.height);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(questionBlock.x, questionBlock.y, questionBlock.width, questionBlock.height);

  // Vẽ các vật thể
  spring.draw();
  pipe.draw();

  // Vẽ nhân vật
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();