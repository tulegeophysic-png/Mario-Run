// 1. LỚP VẬT CẢN: ỐNG TRỤ MARIO (Chặn đi xuyên, bắt buộc nhảy lên)
class Pipe {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  // Xử lý va chạm cứng với Player
  resolveCollision(player) {
    // Kiểm tra có va chạm khung (AABB) hay không
    if (
      player.x < this.x + this.width &&
      player.x + player.width > this.x &&
      player.y < this.y + this.height &&
      player.y + player.height > this.y
    ) {
      // Tính khoảng cách va chạm từ các phía
      let overlapLeft = (player.x + player.width) - this.x;
      let overlapRight = (this.x + this.width) - player.x;
      let overlapTop = (player.y + player.height) - this.y;
      let overlapBottom = (this.y + this.height) - player.y;

      // Tìm hướng va chạm nhỏ nhất để đẩy Player ra
      let minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapTop && player.vy >= 0) {
        // Đứng trên đỉnh ống trụ
        player.y = this.y - player.height;
        player.vy = 0;
        player.isGrounded = true;
      } else if (minOverlap === overlapLeft) {
        // Bị chặn lại từ bên trái thân ống (Không cho đi xuyên)
        player.x = this.x - player.width;
        player.vx = 0;
      } else if (minOverlap === overlapRight) {
        // Bị chặn lại từ bên phải thân ống (Không cho đi xuyên)
        player.x = this.x + this.width;
        player.vx = 0;
      } else if (minOverlap === overlapBottom) {
        // Cộc đầu vào đáy ống (nếu nhảy từ dưới lên)
        player.y = this.y + this.height;
        player.vy = 0;
      }
    }
  }
}

// 2. LỚP LÒ XO (Đặt ở giữa màn, phía trên thoáng)
class Spring {
  constructor(x, y, width, height, bounceForce = -15) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.bounceForce = bounceForce; // Lực bật nảy lên cao
  }

  // Kiểm tra giẫm lên lò xo
  checkBounce(player) {
    if (
      player.x < this.x + this.width &&
      player.x + player.width > this.x &&
      player.y + player.height >= this.y &&
      player.y + player.height <= this.y + 10 &&
      player.vy > 0 // Đang rơi xuống giẫm lên lò xo
    ) {
      player.vy = this.bounceForce; // Bật vọt lên cao
    }
  }
}