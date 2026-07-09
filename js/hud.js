/* ============================================================
   hud.js — HUD di battaglia e input touch.
   Joystick dinamico (lato sinistro), pulsanti attacco / super /
   gadget / hypercharge / emote (lato destro) con mira manuale
   trascinando o mira automatica con un tocco.
   Fallback tastiera+mouse per desktop: WASD, click, E, Q, H.
   ============================================================ */
'use strict';

class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset();

    /* Layout ricalcolato a ogni resize */
    this.buttons = {};
    this.relayout(canvas.clientWidth, canvas.clientHeight);

    /* Tocco / mouse unificati via Pointer Events */
    canvas.addEventListener('pointerdown', (e) => this.onDown(e));
    canvas.addEventListener('pointermove', (e) => this.onMove(e));
    canvas.addEventListener('pointerup', (e) => this.onUp(e));
    canvas.addEventListener('pointercancel', (e) => this.onUp(e));

    /* Tastiera (desktop) */
    this.keys = {};
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (!window.game || !window.game.active) return;
      if (e.key.toLowerCase() === 'e') window.game.playerSuper(null);
      if (e.key.toLowerCase() === 'q') window.game.playerGadget();
      if (e.key.toLowerCase() === 'h') window.game.playerHyper();
      if (e.key.toLowerCase() === 't') window.game.playerEmote();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  reset() {
    this.move = { x: 0, y: 0 };
    this.joy = null;            // {id, baseX, baseY, x, y}
    this.aim = null;            // {id, type, startX, startY, ang, dist, dragged}
    this.pressed = {};          // pulsanti premuti (feedback visivo)
  }

  relayout(w, h) {
    const s = Math.min(w, h) / 420;   // scala UI in base allo schermo
    const m = 18 * s;
    this.scale = s;
    this.buttons = {
      attack: { x: w - 78 * s, y: h - 84 * s, r: 52 * s },
      super:  { x: w - 172 * s, y: h - 62 * s, r: 38 * s },
      gadget: { x: w - 60 * s, y: h - 178 * s, r: 27 * s },
      hyper:  { x: w - 148 * s, y: h - 152 * s, r: 27 * s },
      emote:  { x: w - 34 * s, y: h * 0.42, r: 20 * s },
      quit:   { x: 30 * s, y: 30 * s, r: 20 * s }
    };
    this.w = w; this.h = h;
  }

  pos(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  hitButton(p) {
    for (const name in this.buttons) {
      const b = this.buttons[name];
      if (Util.dist(p.x, p.y, b.x, b.y) < b.r + 8) return name;
    }
    return null;
  }

  /* ---------- Gestione tocchi ---------- */
  onDown(e) {
    const g = window.game;
    if (!g || !g.active) return;
    e.preventDefault();
    const p = this.pos(e);
    const btn = this.hitButton(p);

    if (btn === 'attack' || btn === 'super') {
      /* Inizio mira: tap = auto, drag = manuale */
      if (btn === 'super' && !g.player.canSuper()) { AudioSys.sfx('ui'); return; }
      this.aim = { id: e.pointerId, type: btn, startX: p.x, startY: p.y, ang: 0, dist: 0, dragged: false };
      this.pressed[btn] = true;
      return;
    }
    if (btn === 'gadget') { g.playerGadget(); this.flash('gadget'); return; }
    if (btn === 'hyper') { g.playerHyper(); this.flash('hyper'); return; }
    if (btn === 'emote') { g.playerEmote(); this.flash('emote'); return; }
    if (btn === 'quit') { g.requestQuit(); return; }

    /* Joystick dinamico: qualsiasi tocco sulla metà sinistra */
    if (p.x < this.w * 0.5 && !this.joy) {
      this.joy = { id: e.pointerId, baseX: p.x, baseY: p.y, x: p.x, y: p.y };
    }
  }

  onMove(e) {
    const p = this.pos(e);
    if (this.joy && e.pointerId === this.joy.id) {
      this.joy.x = p.x; this.joy.y = p.y;
      const dx = p.x - this.joy.baseX, dy = p.y - this.joy.baseY;
      const d = Math.hypot(dx, dy);
      const max = 52 * this.scale;
      /* La base segue il dito se trascinato oltre il raggio (joystick "flottante") */
      if (d > max) {
        this.joy.baseX = p.x - dx / d * max;
        this.joy.baseY = p.y - dy / d * max;
      }
      const dead = 8 * this.scale;
      this.move = d > dead ? { x: dx / Math.max(d, 1), y: dy / Math.max(d, 1) } : { x: 0, y: 0 };
    }
    if (this.aim && e.pointerId === this.aim.id) {
      const dx = p.x - this.aim.startX, dy = p.y - this.aim.startY;
      const d = Math.hypot(dx, dy);
      if (d > 24 * this.scale) this.aim.dragged = true;
      if (this.aim.dragged) {
        this.aim.ang = Math.atan2(dy, dx);
        this.aim.dist = d;
      }
    }
  }

  onUp(e) {
    const g = window.game;
    if (this.joy && e.pointerId === this.joy.id) {
      this.joy = null;
      this.move = { x: 0, y: 0 };
    }
    if (this.aim && e.pointerId === this.aim.id) {
      const a = this.aim;
      this.aim = null;
      this.pressed[a.type] = false;
      if (g && g.active) {
        const ang = a.dragged ? a.ang : null;   // null = mira automatica
        if (a.type === 'attack') g.playerAttack(ang);
        else g.playerSuper(ang);
      }
    }
  }

  flash(name) {
    this.pressed[name] = true;
    setTimeout(() => this.pressed[name] = false, 130);
  }

  /* Input tastiera → movimento (desktop) */
  keyboardMove() {
    let x = 0, y = 0;
    if (this.keys['w'] || this.keys['arrowup']) y -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) y += 1;
    if (this.keys['a'] || this.keys['arrowleft']) x -= 1;
    if (this.keys['d'] || this.keys['arrowright']) x += 1;
    return { x, y };
  }

  /* ---------- Disegno HUD (coordinate schermo) ---------- */
  draw(ctx, game) {
    const s = this.scale;
    const p = game.player;

    /* --- Joystick --- */
    if (this.joy) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(this.joy.baseX, this.joy.baseY, 52 * s, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.7;
      const dx = this.joy.x - this.joy.baseX, dy = this.joy.y - this.joy.baseY;
      const d = Math.min(Math.hypot(dx, dy), 52 * s);
      const a = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.arc(this.joy.baseX + Math.cos(a) * d, this.joy.baseY + Math.sin(a) * d, 26 * s, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    /* --- Pulsante attacco --- */
    const atk = this.buttons.attack;
    this.drawButton(ctx, atk, this.pressed.attack ? '#ff6a6a' : '#e04a4a', '#7a1f1f');
    /* Tacche munizioni dentro il pulsante */
    const maxA = p.maxAmmo;
    for (let i = 0; i < maxA; i++) {
      const aa = -Math.PI / 2 + (i - (maxA - 1) / 2) * 0.55;
      const full = p.ammo >= i + 1;
      const part = !full && p.ammo > i ? p.ammo - i : 0;
      ctx.strokeStyle = full ? '#ffe14d' : part > 0 ? `rgba(255,225,77,${0.25 + part * 0.5})` : 'rgba(255,255,255,.25)';
      ctx.lineWidth = 7 * s;
      ctx.beginPath();
      ctx.arc(atk.x, atk.y, atk.r - 8 * s, aa - 0.22, aa + 0.22);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.font = `${26 * s}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('⚔️', atk.x, atk.y + 4 * s);

    /* --- Pulsante super --- */
    const sup = this.buttons.super;
    const ready = p.canSuper();
    this.drawButton(ctx, sup, ready ? '#ffe14d' : '#3a4160', '#8a6a00');
    /* Anello di carica */
    ctx.strokeStyle = ready ? '#fff' : '#ffe14d';
    ctx.lineWidth = 5 * s;
    ctx.beginPath();
    ctx.arc(sup.x, sup.y, sup.r - 4 * s, -Math.PI / 2, -Math.PI / 2 + TAU * Util.clamp(p.superCharge, 0, 1));
    ctx.stroke();
    if (ready) {
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(game.time * 6);
      ctx.fillStyle = '#ffe14d';
      ctx.beginPath(); ctx.arc(sup.x, sup.y, sup.r + 6 * s, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = ready ? '#5a3800' : '#8892c9';
    ctx.font = `bold ${22 * s}px sans-serif`;
    ctx.fillText('★', sup.x, sup.y + 2 * s);

    /* --- Gadget --- */
    const gad = this.buttons.gadget;
    const canG = p.canGadget();
    this.drawButton(ctx, gad, canG ? '#4ae06e' : '#3a4160', '#1d7a36');
    ctx.font = `${18 * s}px sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.fillText('🔧', gad.x, gad.y);
    ctx.font = `bold ${11 * s}px sans-serif`;
    ctx.fillText(String(p.gadgetUses), gad.x + gad.r * 0.7, gad.y - gad.r * 0.7);

    /* --- Hypercharge --- */
    const hyp = this.buttons.hyper;
    const canH = p.canHyper();
    const hypOn = p.hyperT > 0;
    this.drawButton(ctx, hyp, hypOn ? `hsl(${(game.time * 300) % 360},90%,55%)` : canH ? '#ff42f5' : '#3a4160', '#7a1f78');
    ctx.strokeStyle = '#ff8af5';
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.arc(hyp.x, hyp.y, hyp.r - 3 * s, -Math.PI / 2, -Math.PI / 2 + TAU * Util.clamp(p.hyperCharge, 0, 1));
    ctx.stroke();
    ctx.font = `${16 * s}px sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.fillText('⚡', hyp.x, hyp.y);

    /* --- Emote e uscita --- */
    this.drawButton(ctx, this.buttons.emote, 'rgba(30,38,90,.8)', '#131b52');
    ctx.font = `${16 * s}px sans-serif`;
    ctx.fillText('💬', this.buttons.emote.x, this.buttons.emote.y);
    this.drawButton(ctx, this.buttons.quit, 'rgba(30,38,90,.8)', '#131b52');
    ctx.fillStyle = '#ff6a6a';
    ctx.font = `bold ${18 * s}px sans-serif`;
    ctx.fillText('✕', this.buttons.quit.x, this.buttons.quit.y);

    /* --- Barra superiore: punteggio modalità + timer --- */
    const hudTxt = game.mode.hudText(game);
    if (hudTxt) {
      ctx.font = `bold ${17 * s}px 'Trebuchet MS', sans-serif`;
      const tw = ctx.measureText(hudTxt).width + 30 * s;
      ctx.fillStyle = 'rgba(10,14,40,.75)';
      this.roundRect(ctx, this.w / 2 - tw / 2, 10 * s, tw, 30 * s, 15 * s);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(hudTxt, this.w / 2, 25 * s);
    }
    if (game.mode.timeLeft !== undefined && game.mode.timeLeft < 9000) {
      const t = Math.max(0, Math.ceil(game.mode.timeLeft));
      ctx.font = `bold ${14 * s}px sans-serif`;
      ctx.fillStyle = t <= 10 ? '#ff6a6a' : '#c8d0ff';
      ctx.fillText(`⏱ ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`, this.w / 2, 52 * s);
    }

    /* --- Vita del giocatore in basso a sinistra --- */
    if (p.alive) {
      const bw = 130 * s, bh = 14 * s, bx = 16 * s, by = this.h - 28 * s;
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      this.roundRect(ctx, bx - 2, by - 2, bw + 4, bh + 4, 7 * s); ctx.fill();
      const frac = p.hp / p.effMaxHp();
      ctx.fillStyle = frac > 0.5 ? '#4ae06e' : frac > 0.25 ? '#ffe14d' : '#ff4a5e';
      this.roundRect(ctx, bx, by, bw * frac, bh, 6 * s); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${11 * s}px sans-serif`;
      ctx.fillText(`${Math.ceil(p.hp)} / ${p.effMaxHp()}`, bx + bw / 2, by + bh / 2 + 1);
    } else if (p.respawnT > 0) {
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${30 * s}px sans-serif`;
      ctx.fillText(`Rientri tra ${Math.ceil(p.respawnT)}...`, this.w / 2, this.h / 2);
    }

    /* --- FPS (opzionale nelle impostazioni) --- */
    if (Save.state.settings.showFps) {
      ctx.font = `${11 * s}px monospace`;
      ctx.fillStyle = '#8cff3a';
      ctx.textAlign = 'left';
      ctx.fillText(`${game.fps | 0} FPS`, 8, this.h - 60 * s);
      ctx.textAlign = 'center';
    }
    ctx.textBaseline = 'alphabetic';
  }

  drawButton(ctx, b, fill, shadow) {
    ctx.fillStyle = shadow;
    ctx.beginPath(); ctx.arc(b.x, b.y + 3, b.r, 0, TAU); ctx.fill();
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 2, 0, TAU); ctx.stroke();
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
