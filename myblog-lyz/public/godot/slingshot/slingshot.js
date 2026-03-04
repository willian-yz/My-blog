(function(global) {
  function clampVector(vec, maxLen) {
    var len = Math.hypot(vec.x, vec.y);
    if (len <= maxLen || len === 0) return vec;
    var k = maxLen / len;
    return { x: vec.x * k, y: vec.y * k };
  }

  function Engine(config) {
    this.config = config || {};
    this.canvas = this.config.canvas || null;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.rafId = 0;
    this.lastTs = 0;

    this.world = {
      state: 'idle',
      maxDragRadius: 120,
      minDragThreshold: 10,
      impulseScale: 5.4,
      maxImpulse: 950,
      gravity: 880,
      autoResetDelay: 1.6,
      resetTimer: 0,
      dragging: false,
      dragMid: { x: 0, y: 0 },
      projectilePos: { x: 0, y: 0 },
      projectileVel: { x: 0, y: 0 },
      projectileRadius: 14,
      projectileActive: false
    };

    this.frame = {
      centerX: 480,
      centerY: 270,
      anchorLeft: { x: 410, y: 175 },
      anchorRight: { x: 550, y: 175 },
      restMid: { x: 480, y: 250 }
    };

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.loop = this.loop.bind(this);
  }

  Engine.prototype.startGame = async function() {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas is unavailable for slingshot game');
    }

    this.world.dragMid = { x: this.frame.restMid.x, y: this.frame.restMid.y };
    this.resetProjectile();

    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    this.canvas.style.touchAction = 'none';

    this.lastTs = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  };

  Engine.prototype.getPointerPos = function(evt) {
    var rect = this.canvas.getBoundingClientRect();
    var scaleX = this.canvas.width / rect.width;
    var scaleY = this.canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY
    };
  };

  Engine.prototype.onPointerDown = function(evt) {
    var p = this.getPointerPos(evt);
    var dx = p.x - this.world.projectilePos.x;
    var dy = p.y - this.world.projectilePos.y;
    var hitRadius = this.world.projectileRadius + 18;

    if (!this.world.projectileActive && Math.hypot(dx, dy) <= hitRadius) {
      this.world.state = 'dragging';
      this.world.dragging = true;
      this.updateDrag(p);
      evt.preventDefault();
    }
  };

  Engine.prototype.onPointerMove = function(evt) {
    if (!this.world.dragging) return;
    var p = this.getPointerPos(evt);
    this.updateDrag(p);
    evt.preventDefault();
  };

  Engine.prototype.onPointerUp = function() {
    if (!this.world.dragging) return;
    this.release();
  };

  Engine.prototype.updateDrag = function(pointer) {
    var rest = this.frame.restMid;
    var delta = clampVector({ x: pointer.x - rest.x, y: pointer.y - rest.y }, this.world.maxDragRadius);
    this.world.dragMid = { x: rest.x + delta.x, y: rest.y + delta.y };
    this.world.projectilePos = { x: this.world.dragMid.x, y: this.world.dragMid.y };
    this.world.projectileVel = { x: 0, y: 0 };
  };

  Engine.prototype.release = function() {
    this.world.dragging = false;
    this.world.state = 'idle';

    var rest = this.frame.restMid;
    var offset = {
      x: rest.x - this.world.dragMid.x,
      y: rest.y - this.world.dragMid.y
    };

    var distance = Math.hypot(offset.x, offset.y);
    var impulse = Math.min(distance * this.world.impulseScale, this.world.maxImpulse);

    if (distance >= this.world.minDragThreshold && impulse > 0) {
      var inv = 1 / (distance || 1);
      this.world.projectileVel = {
        x: offset.x * inv * impulse,
        y: offset.y * inv * impulse
      };
      this.world.projectileActive = true;
      this.world.resetTimer = this.world.autoResetDelay;
    }

    this.world.dragMid = { x: rest.x, y: rest.y };
    if (!this.world.projectileActive) {
      this.resetProjectile();
    }
  };

  Engine.prototype.resetProjectile = function() {
    this.world.projectilePos = { x: this.frame.restMid.x, y: this.frame.restMid.y };
    this.world.projectileVel = { x: 0, y: 0 };
    this.world.projectileActive = false;
    this.world.resetTimer = 0;
  };

  Engine.prototype.update = function(dt) {
    if (!this.world.projectileActive || this.world.dragging) return;

    this.world.projectileVel.y += this.world.gravity * dt;
    this.world.projectilePos.x += this.world.projectileVel.x * dt;
    this.world.projectilePos.y += this.world.projectileVel.y * dt;

    this.world.resetTimer -= dt;
    if (
      this.world.resetTimer <= 0 ||
      this.world.projectilePos.x < -120 ||
      this.world.projectilePos.x > this.canvas.width + 120 ||
      this.world.projectilePos.y > this.canvas.height + 120 ||
      this.world.projectilePos.y < -160
    ) {
      this.resetProjectile();
    }
  };

  Engine.prototype.draw = function() {
    var ctx = this.ctx;
    var c = this.canvas;
    var f = this.frame;
    var w = this.world;

    ctx.clearRect(0, 0, c.width, c.height);

    var bg = ctx.createLinearGradient(0, 0, 0, c.height);
    bg.addColorStop(0, '#1f1711');
    bg.addColorStop(1, '#2f2318');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.strokeStyle = '#6e4a2e';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(f.centerX, f.centerY + 120);
    ctx.lineTo(f.centerX, f.centerY - 10);
    ctx.lineTo(f.anchorLeft.x, f.anchorLeft.y);
    ctx.moveTo(f.centerX, f.centerY - 10);
    ctx.lineTo(f.anchorRight.x, f.anchorRight.y);
    ctx.stroke();

    ctx.strokeStyle = '#141414';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(f.anchorLeft.x, f.anchorLeft.y);
    ctx.lineTo(w.dragMid.x, w.dragMid.y);
    ctx.lineTo(f.anchorRight.x, f.anchorRight.y);
    ctx.stroke();

    ctx.fillStyle = '#e95d67';
    ctx.beginPath();
    ctx.arc(w.projectilePos.x, w.projectilePos.y, w.projectileRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f7e9db';
    ctx.font = '18px sans-serif';
    ctx.fillText('拖动红色弹丸并松手，橡皮筋会立刻回位并按偏移量发射。', 34, 40);
  };

  Engine.prototype.loop = function(ts) {
    var dt = Math.min((ts - this.lastTs) / 1000, 0.033);
    this.lastTs = ts;

    this.update(dt);
    this.draw();

    this.rafId = requestAnimationFrame(this.loop);
  };

  global.Engine = Engine;
})(window);
