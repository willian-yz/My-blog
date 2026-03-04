(function(global){
  function clampVec(x, y, maxLen) {
    var len = Math.hypot(x, y);
    if (!len || len <= maxLen) return { x: x, y: y };
    var ratio = maxLen / len;
    return { x: x * ratio, y: y * ratio };
  }

  function Engine(config) {
    this.config = config || {};
    this.canvas = this.config.canvas || null;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.width = this.canvas ? this.canvas.width : 960;
    this.height = this.canvas ? this.canvas.height : 540;

    this.anchors = {
      left: { x: 318, y: 270 },
      right: { x: 438, y: 270 },
      top: { x: 378, y: 212 },
      base: { x: 378, y: 430 }
    };

    this.restMid = { x: 378, y: 318 };
    this.bandMid = { x: this.restMid.x, y: this.restMid.y };
    this.maxDragRadius = 145;
    this.minDragThreshold = 10;
    this.impulseScale = 4.9;

    this.projectileRadius = 13;
    this.projectile = {
      x: this.restMid.x,
      y: this.restMid.y,
      vx: 0,
      vy: 0,
      active: false,
      bornAt: 0
    };

    this.gravity = 860;
    this.bounce = 0.58;
    this.friction = 0.992;

    this.dragging = false;
    this.paused = false;
    this.destroyed = false;
    this.pointerId = null;

    this.targets = [
      { x: 760, y: 360, r: 24, hit: false },
      { x: 820, y: 300, r: 20, hit: false },
      { x: 872, y: 245, r: 16, hit: false }
    ];

    this.score = 0;
    this.lastTime = 0;
    this.rafId = null;

    this._boundDown = this._onPointerDown.bind(this);
    this._boundMove = this._onPointerMove.bind(this);
    this._boundUp = this._onPointerUp.bind(this);
  }

  Engine.prototype.startGame = async function() {
    if (!this.canvas || !this.ctx) throw new Error('Missing canvas context');

    this.canvas.addEventListener('pointerdown', this._boundDown);
    this.canvas.addEventListener('pointermove', this._boundMove);
    this.canvas.addEventListener('pointerup', this._boundUp);
    this.canvas.addEventListener('pointercancel', this._boundUp);

    this.lastTime = performance.now();
    this._loop(this.lastTime);
  };

  Engine.prototype.pause = function() {
    this.paused = true;
  };

  Engine.prototype.resume = function() {
    this.paused = false;
    this.lastTime = performance.now();
    if (!this.rafId) this._loop(this.lastTime);
  };

  Engine.prototype.setPaused = function(flag) {
    if (flag) this.pause();
    else this.resume();
  };

  Engine.prototype.setLowProcessorUsageMode = function(flag) {
    this.setPaused(!!flag);
  };

  Engine.prototype.quit = function() {
    this.destroy();
  };

  Engine.prototype.destroy = function() {
    this.destroyed = true;
    this.paused = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (!this.canvas) return;
    this.canvas.removeEventListener('pointerdown', this._boundDown);
    this.canvas.removeEventListener('pointermove', this._boundMove);
    this.canvas.removeEventListener('pointerup', this._boundUp);
    this.canvas.removeEventListener('pointercancel', this._boundUp);
  };

  Engine.prototype._onPointerDown = function(e) {
    if (this.paused || this.destroyed) return;
    var p = this._getPointerPos(e);
    var dx = p.x - this.projectile.x;
    var dy = p.y - this.projectile.y;
    var grabRadius = this.projectileRadius + 18;

    if (!this.projectile.active && (dx * dx + dy * dy) <= grabRadius * grabRadius) {
      this.dragging = true;
      this.pointerId = e.pointerId;
      this.canvas.setPointerCapture(e.pointerId);
      this._setBandMidToPointer(p.x, p.y);
      this._syncProjectileToBand();
    }
  };

  Engine.prototype._onPointerMove = function(e) {
    if (!this.dragging || this.pointerId !== e.pointerId) return;
    var p = this._getPointerPos(e);
    this._setBandMidToPointer(p.x, p.y);
    this._syncProjectileToBand();
  };

  Engine.prototype._onPointerUp = function(e) {
    if (!this.dragging || this.pointerId !== e.pointerId) return;
    this.dragging = false;
    this.pointerId = null;

    var offsetX = this.restMid.x - this.bandMid.x;
    var offsetY = this.restMid.y - this.bandMid.y;
    var dragDistance = Math.hypot(offsetX, offsetY);

    if (dragDistance >= this.minDragThreshold) {
      this.projectile.active = true;
      this.projectile.vx = offsetX * this.impulseScale;
      this.projectile.vy = offsetY * this.impulseScale;
      this.projectile.bornAt = performance.now();
    }

    // 立刻回弹到初始状态
    this.bandMid.x = this.restMid.x;
    this.bandMid.y = this.restMid.y;
  };

  Engine.prototype._getPointerPos = function(e) {
    var rect = this.canvas.getBoundingClientRect();
    var scaleX = this.width / rect.width;
    var scaleY = this.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  Engine.prototype._setBandMidToPointer = function(x, y) {
    var deltaX = x - this.restMid.x;
    var deltaY = y - this.restMid.y;
    var clamped = clampVec(deltaX, deltaY, this.maxDragRadius);
    this.bandMid.x = this.restMid.x + clamped.x;
    this.bandMid.y = this.restMid.y + clamped.y;
  };

  Engine.prototype._syncProjectileToBand = function() {
    this.projectile.active = false;
    this.projectile.vx = 0;
    this.projectile.vy = 0;
    this.projectile.x = this.bandMid.x;
    this.projectile.y = this.bandMid.y;
  };

  Engine.prototype._resetProjectile = function() {
    this.projectile.active = false;
    this.projectile.vx = 0;
    this.projectile.vy = 0;
    this.projectile.x = this.restMid.x;
    this.projectile.y = this.restMid.y;
  };

  Engine.prototype._update = function(dt) {
    if (this.dragging || !this.projectile.active) return;

    this.projectile.vy += this.gravity * dt;
    this.projectile.vx *= this.friction;
    this.projectile.vy *= this.friction;

    this.projectile.x += this.projectile.vx * dt;
    this.projectile.y += this.projectile.vy * dt;

    var r = this.projectileRadius;
    var floorY = this.height - 44;

    if (this.projectile.x < r) {
      this.projectile.x = r;
      this.projectile.vx *= -this.bounce;
    } else if (this.projectile.x > this.width - r) {
      this.projectile.x = this.width - r;
      this.projectile.vx *= -this.bounce;
    }

    if (this.projectile.y < r) {
      this.projectile.y = r;
      this.projectile.vy *= -this.bounce;
    } else if (this.projectile.y > floorY - r) {
      this.projectile.y = floorY - r;
      this.projectile.vy *= -this.bounce;
      this.projectile.vx *= 0.94;
    }

    for (var i = 0; i < this.targets.length; i++) {
      var t = this.targets[i];
      if (t.hit) continue;
      var dx = this.projectile.x - t.x;
      var dy = this.projectile.y - t.y;
      var hitDist = this.projectileRadius + t.r;
      if (dx * dx + dy * dy <= hitDist * hitDist) {
        t.hit = true;
        this.score += 1;
        this.projectile.vx *= 0.8;
        this.projectile.vy *= 0.8;
      }
    }

    var aliveMs = performance.now() - this.projectile.bornAt;
    if (aliveMs > 6500 || (Math.abs(this.projectile.vx) < 3 && Math.abs(this.projectile.vy) < 3 && this.projectile.y >= floorY - r - 1)) {
      this._resetProjectile();
      if (this.targets.every(function(t){ return t.hit; })) {
        for (var j = 0; j < this.targets.length; j++) this.targets[j].hit = false;
      }
    }
  };

  Engine.prototype._draw = function() {
    var ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 背景
    var bg = ctx.createLinearGradient(0, 0, 0, this.height);
    bg.addColorStop(0, '#1d242f');
    bg.addColorStop(1, '#0f141d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // 地面
    ctx.fillStyle = '#2d3745';
    ctx.fillRect(0, this.height - 44, this.width, 44);

    // 目标
    for (var i = 0; i < this.targets.length; i++) {
      var t = this.targets[i];
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fillStyle = t.hit ? '#34d399' : '#f87171';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#f8fafc';
      ctx.stroke();
    }

    // Y 字架
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#8b5e34';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(this.anchors.base.x, this.anchors.base.y);
    ctx.lineTo(this.anchors.top.x, this.anchors.top.y + 22);
    ctx.stroke();

    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(this.anchors.top.x, this.anchors.top.y + 16);
    ctx.lineTo(this.anchors.left.x, this.anchors.left.y);
    ctx.moveTo(this.anchors.top.x, this.anchors.top.y + 16);
    ctx.lineTo(this.anchors.right.x, this.anchors.right.y);
    ctx.stroke();

    // 弹性绳
    ctx.strokeStyle = '#f2e8d7';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(this.anchors.left.x, this.anchors.left.y);
    ctx.lineTo(this.bandMid.x, this.bandMid.y);
    ctx.lineTo(this.anchors.right.x, this.anchors.right.y);
    ctx.stroke();

    // 弹丸
    ctx.beginPath();
    ctx.arc(this.projectile.x, this.projectile.y, this.projectileRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#dbeafe';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    // UI 文案
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('弹弓练习场', 28, 42);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('拖拽弹丸拉伸橡皮筋，松手发射。命中红色目标！', 28, 72);
    ctx.fillText('分数: ' + this.score + ' / ' + this.targets.length, 28, 98);
  };

  Engine.prototype._loop = function(now) {
    if (this.destroyed) return;
    this.rafId = null;
    if (!this.paused) {
      var dt = Math.min(0.032, (now - this.lastTime) / 1000 || 0);
      this.lastTime = now;
      this._update(dt);
      this._draw();
    } else {
      this.lastTime = now;
    }
    this.rafId = requestAnimationFrame(this._loop.bind(this));
  };

  global.Engine = Engine;
})(window);
