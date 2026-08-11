<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Mario Game - Spring & Pipe Logic</title>
  <style>
    body {
      margin: 0;
      background: #222;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    canvas {
      background: #5c94fc;
      border: 2px solid #fff;
    }
  </style>
</head>
<body>

<canvas id="gameCanvas" width="600" height="350"></canvas>

<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRAVITY = 0.5;

// ==========================================
// 1. DỮ LIỆU NHÂN VẬT (PLAYER)
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

// Controls
const keys = { right: false, left: false, up: false };

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
// 2. KHỞI TẠO BẢN ĐỒ (MAP OBJECTS)
// ==========================================

// Mặt đất chính (y = 300)
const ground = { x: 0, y: 300, width: 600, height: 50 };

// Cầu / Platform tầng trên (Đặt ở x = 320 -> Không che lò xo)
const upperBridge = { x: 320, y: 160, width: 180, height: 20 };

// Khối hộp lơ lửng ở giữa màn (x = 180)
const questionBlock = { x: 180, y: 120, width: 30, height: 30 };

// LỜI GIẢI LÒ XO: Đặt tại x = 180, trên mặt đất (y = 280), ngay dưới Khối hộp
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
      p.vy = this.bounceForce; // Bật vọt lên khoảng không trống
      p.isGrounded = false;
    }
  }
}

// LỜI GIẢI ỐNG TRỤ MARIO: Vật thể đặc, cản xuyên hoàn toàn
class Pipe {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw() {
    // Thân ống
    ctx.fillStyle = '#00a800';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    // Vành ống
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
        // Đứng lên đỉnh ống trụ
        p.y = this.y - p.height;
        p.vy = 0;
        p.isGrounded = true;
      } else if (minOverlap === overlapLeft) {
        // Bị cản bên trái (Không đi xuyên qua)
        p.x = this.x - p.width;
      } else if (minOverlap === overlapRight) {
        // Bị cản bên phải (Không đi xuyên qua)
        p.x = this.x + this.width;
      } else if (minOverlap === overlapBottom) {
        // Va đầu dưới đáy ống trụ
        p.y = this.y + this.height;
        p.vy = 0;
      }
    }
  }
}

// Khởi tạo các đối tượng
const spring = new Spring(180, 280, 30, 20, -15);
const pipe = new Pipe(400, 220, 50, 80);

// ==========================================
// 3. VÒNG LẶP GAME (GAME LOOP)
// ==========================================

function update() {
  // Di chuyển ngang
  if (keys.right) player.vx = player.speed;
  else if (keys.left) player.vx = -player.speed;
  else player.vx = 0;

  player.x += player.vx;

  // Trọng lực & Di chuyển dọc
  player.vy += GRAVITY;
  player.y += player.vy;
  player.isGrounded = false;

  // Va chạm Mặt đất
  if (player.y + player.height >= ground.y) {
    player.y = ground.y - player.height;
    player.vy = 0;
    player.isGrounded = true;
  }

  // Va chạm Cầu trên (Platforms)
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

  // Va chạm Lò xo & Ống trụ
  spring.checkBounce(player);
  pipe.resolveCollision(player);

  // Giới hạn biên màn chơi
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Vẽ mặt đất
  ctx.fillStyle = '#c84c0c';
  ctx.fillRect(ground.x, ground.y, ground.width, ground.height);
  ctx.fillStyle = '#fcb438';
  ctx.fillRect(ground.x, ground.y, ground.width, 6);

  // Vẽ Cầu trên
  ctx.fillStyle = '#fcb438';
  ctx.fillRect(upperBridge.x, upperBridge.y, upperBridge.width, upperBridge.height);

  // Vẽ Khối hộp Question Block
  ctx.fillStyle = '#fcb438';
  ctx.fillRect(questionBlock.x, questionBlock.y, questionBlock.width, questionBlock.height);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(questionBlock.x, questionBlock.y, questionBlock.width, questionBlock.height);

  // Vẽ Lò xo & Ống trụ
  spring.draw();
  pipe.draw();

  // Vẽ Player (Mario)
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
</script>

</body>
</html>