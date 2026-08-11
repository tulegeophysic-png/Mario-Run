// ==========================================
// 1. CẤU HÌNH BẢN ĐỒ & TỌA ĐỘ
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GRAVITY = 0.5;

// Nhân vật
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

// BẢN ĐỒ:
const ground = { x: 0, y: 300, width: 600, height: 50 };

// 1. CẦU TẦNG TRÊN: Dịch hẳn sang phải (x từ 360 -> 540)
const upperBridge = { x: 360, y: 150, width: 180, height: 20 };

// 2. LÒ XO + KHỐI HỘP: Đặt ở giữa màn (x = 180). Khoảng trời x: 0 -> 360 phía trên hoàn toàn trống
const questionBlock = { x: 180, y: 110, width: 30, height: 30 };

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
        p.y = this.y - p.height;
        p.vy = 0;
        p.isGrounded = true;
      } else if (minOverlap === overlapLeft) {
        p.x = this.x - p.width;
      } else if (minOverlap === overlapRight) {
        p.x = this.x + this.width;
      } else if (minOverlap === overlapBottom) {
        p.y = this.y + this.height;
        p.vy = 0;
      }
    }
  }
}

const spring = new Spring(180, 280, 30, 20, -15);
const pipe = new Pipe(430, 220, 50, 80);

// ==========================================
// 2. HÀM XỬ LÝ VA CHẠM CẦU (CHẶN NHẢY TỪ DƯỚI LÊN)
// ==========================================
function resolveBridgeCollision(p, bridge) {
  if (
    p.x < bridge.x + bridge.width &&
    p.x + p.width > bridge.x &&
    p.y < bridge.y + bridge.height &&
    p.y + p.height > bridge.y
  ) {
    let overlapLeft = (p.x + p.width) - bridge.x;
    let overlapRight = (bridge.x + bridge.width) - p.x;
    let overlapTop = (p.y + p.height) - bridge.y;
    let overlapBottom = (bridge.y + bridge.height) - p.y;

    let minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    // 1. Nhảy từ trên xuống -> Đứng trên mặt cầu
    if (minOverlap === overlapTop && p.vy >= 0) {
      p.y = bridge.y - p.height;
      p.vy = 0;
      p.isGrounded = true;
    } 
    // 2. Nhảy từ dưới lên -> CHẶN LẠI (Cộc đầu vào đáy cầu, không cho đi xuyên)
    else if (minOverlap === overlapBottom && p.vy < 0) {
      p.y = bridge.y + bridge.height;
      p.vy = 0; // Triệt tiêu lực nhảy, cho rơi xuống lại
    } 
    // 3. Va chạm hông cầu
    else if (minOverlap === overlapLeft) {
      p.x = bridge.x - p.width;
    } else if (minOverlap === overlapRight) {
      p.x = bridge.x + bridge.width;
    }
  }
}

// Va chạm khối hộp lơ lửng
function resolveBlockCollision(p, block) {
  if (
    p.x < block.x + block.width &&
    p.x + p.width > block.x &&
    p.y < block.y + block.height &&
    p.y + p.height > block.y
  ) {
    let overlapBottom = (block.y + block.height) - p.y;
    let overlapTop = (p.y + p.height) - block.y;
    
    if (overlapBottom < overlapTop && p.vy < 0) {
      p.y = block.y + block.height;
      p.vy = 0;
    } else if (overlapTop <= overlapBottom && p.vy >= 0) {
      p.y = block.y - p.height;
      p.vy = 0;
      p.isGrounded = true;
    }
  }
}

// ==========================================
// 3. VÒNG LẶP GAME (GAME LOOP)
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

  // Xử lý Lò xo & Ống trụ
  spring.checkBounce(player);
  pipe.resolveCollision(player);

  // Xử lý va chạm Cầu & Khối hộp (Chặn xuyên 2 chiều)
  resolveBridgeCollision(player, upperBridge);
  resolveBlockCollision(player, questionBlock);

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Vẽ đất
  ctx.fillStyle = '#c84c0c';
  ctx.fillRect(ground.x, ground.y, ground.width, ground.height);

  // Vẽ Cầu (x = 360 -> 540)
  ctx.fillStyle = '#fcb438';
  ctx.fillRect(upperBridge.x, upperBridge.y, upperBridge.width, upperBridge.height);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(upperBridge.x, upperBridge.y, upperBridge.width, upperBridge.height);

  // Vẽ Khối hộp (x = 180)
  ctx.fillStyle = '#fcb438';
  ctx.fillRect(questionBlock.x, questionBlock.y, questionBlock.width, questionBlock.height);
  ctx.strokeRect(questionBlock.x, questionBlock.y, questionBlock.width, questionBlock.height);

  // Vẽ Vật thể
  spring.draw();
  pipe.draw();

  // Vẽ Player
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();