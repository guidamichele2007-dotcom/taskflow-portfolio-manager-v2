/* ============================================================
   particles.js — Sistema particellare con object pooling
   e testi fluttuanti (danni, cure, annunci).
   ============================================================ */
'use strict';

class ParticleSystem {
  constructor() {
    this.parts = [];
    this.texts = [];
    this.pool = new Pool(() => ({}));
  }

  clear() { this.parts.length = 0; this.texts.length = 0; }

  /* Particella generica */
  emit(x, y, opts) {
    const p = this.pool.get();
    p.x = x; p.y = y;
    p.vx = opts.vx || 0; p.vy = opts.vy || 0;
    p.life = p.maxLife = opts.life || 0.5;
    p.size = opts.size || 4;
    p.color = opts.color || '#fff';
    p.grav = opts.grav || 0;
    p.drag = opts.drag !== undefined ? opts.drag : 0.92;
    p.shape = opts.shape || 'circle';   // circle | spark | ring
    p.glow = opts.glow || false;
    this.parts.push(p);
  }

  /* Esplosione radiale di n particelle */
  burst(x, y, n, opts) {
    for (let i = 0; i < n; i++) {
      const a = Util.rand(0, TAU);
      const sp = Util.rand(opts.minSpeed || 40, opts.maxSpeed || 160);
      this.emit(x, y, {
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: Util.rand(0.25, opts.life || 0.6),
        size: Util.rand(2, opts.size || 6),
        color: Array.isArray(opts.color) ? Util.choice(opts.color) : opts.color,
        grav: opts.grav || 0, shape: opts.shape || 'circle', glow: opts.glow
      });
    }
  }

  /* Preset di uso comune */
  muzzle(x, y, ang, color) {
    for (let i = 0; i < 4; i++) {
      const a = ang + Util.rand(-0.3, 0.3);
      const sp = Util.rand(80, 200);
      this.emit(x, y, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.18, size: 3, color, shape: 'spark', glow: true });
    }
  }
  hit(x, y, color) { this.burst(x, y, 8, { color: [color, '#ffffff'], maxSpeed: 140, life: 0.35, glow: true }); }
  explosion(x, y, radius, color) {
    this.burst(x, y, 22, { color: [color, '#ffcf5e', '#ff8c3a'], maxSpeed: radius * 3.2, life: 0.55, size: 7, glow: true });
    this.emit(x, y, { life: 0.3, size: radius, color: '#ffffff', shape: 'ring' });
  }
  death(x, y, color) {
    this.burst(x, y, 26, { color: [color, '#ffffff'], maxSpeed: 220, life: 0.8, size: 7, grav: 160 });
    this.emit(x, y, { life: 0.45, size: 34, color, shape: 'ring' });
  }
  healFx(x, y) { this.burst(x, y, 6, { color: ['#4ae06e', '#b6ffcf'], maxSpeed: 60, life: 0.6, grav: -70, glow: true }); }
  wallBreak(x, y, color) { this.burst(x, y, 12, { color: [color, '#8a6a4a'], maxSpeed: 120, life: 0.6, size: 6, grav: 220 }); }
  sparkle(x, y, color) { this.emit(x, y, { vx: Util.rand(-25, 25), vy: Util.rand(-45, -12), life: 0.7, size: 3, color, shape: 'spark', glow: true }); }

  /* Testo fluttuante: danno, cura, annunci */
  text(x, y, str, color, size) {
    this.texts.push({ x, y, str, color: color || '#fff', size: size || 14, life: 0.9, maxLife: 0.9, vy: -46 });
  }

  update(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) { this.pool.release(p); this.parts[i] = this.parts[this.parts.length - 1]; this.parts.pop(); continue; }
      p.vy += p.grav * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy *= Math.pow(p.drag, dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      if (t.life <= 0) { this.texts.splice(i, 1); continue; }
      t.y += t.vy * dt;
      t.vy *= 0.92;
    }
  }

  /* Disegno nel sistema di coordinate del mondo (camera già applicata) */
  draw(ctx) {
    const lowQ = Save.state.settings.quality === 'bassa';
    for (const p of this.parts) {
      const a = Util.clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = a;
      if (p.glow && !lowQ) { ctx.shadowColor = p.color; ctx.shadowBlur = 8; }
      ctx.fillStyle = p.color;
      if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.6 - a * 0.6), 0, TAU);
        ctx.stroke();
      } else if (p.shape === 'spark') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a, 0, TAU);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    /* Testi fluttuanti */
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      const a = Util.clamp(t.life / t.maxLife, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = `bold ${t.size}px 'Trebuchet MS', sans-serif`;
      ctx.strokeStyle = 'rgba(0,0,0,.7)';
      ctx.lineWidth = 3;
      ctx.strokeText(t.str, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
