/* ============================================================
   ai.js — Intelligenza artificiale dei bot.
   Macchina a stati (obiettivo → ingaggio → ritirata) con
   pathfinding A*, kiting, raccolta oggetti e uso di
   super/gadget contestuale. Difficoltà scalabile.
   ============================================================ */
'use strict';

class BotBrain {
  constructor(brawler, difficulty) {
    this.b = brawler;
    this.diff = difficulty || 0.6;      // 0..1: precisione e reattività
    this.path = null;
    this.pathIdx = 0;
    this.repathT = 0;
    this.target = null;                 // nemico corrente
    this.thinkT = Util.rand(0, 0.3);    // decisioni sfalsate tra i bot
    this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    this.strafeT = 0;
    this.goal = null;                   // {x, y, kind}
  }

  update(game, dt) {
    const b = this.b;
    if (!b.alive) return;

    this.thinkT -= dt;
    if (this.thinkT <= 0) {
      this.thinkT = 0.25 + (1 - this.diff) * 0.3;
      this.think(game);
    }
    this.moveAlongPath(game, dt);
    this.combat(game, dt);
  }

  /* ---------- Decisioni ad alto livello ---------- */
  think(game) {
    const b = this.b;

    /* 1. Trova il nemico visibile più vicino */
    this.target = null;
    let bd = 1e9;
    for (const e of game.brawlers) {
      if (e.team === b.team || !e.alive) continue;
      if (!e.visibleTo(game, b)) continue;
      const d = Util.dist(b.x, b.y, e.x, e.y);
      if (d < bd) { bd = d; this.target = e; }
    }

    /* 2. Scegli la destinazione in base a salute/obiettivo */
    const lowHp = b.hp < b.effMaxHp() * 0.3;
    let goal = null;

    if (lowHp && this.target) {
      /* Ritirata: allontanati dal nemico */
      const a = Util.angTo(this.target.x, this.target.y, b.x, b.y);
      goal = { x: b.x + Math.cos(a) * 180, y: b.y + Math.sin(a) * 180, kind: 'flee' };
    } else {
      /* Obiettivo di modalità (gemme, palla, zona, cassaforte...) */
      goal = game.mode.botGoal(game, b) || null;
      /* Raccogli pickup vicini */
      let bestPick = null, bpd = 240;
      for (const p of game.pickups) {
        const d = Util.dist(b.x, b.y, p.x, p.y);
        if (d < bpd) { bpd = d; bestPick = p; }
      }
      if (bestPick && (!goal || goal.prio !== 2)) goal = { x: bestPick.x, y: bestPick.y, kind: 'pickup' };
      /* Nessun obiettivo: insegui il bersaglio o vaga */
      if (!goal && this.target) goal = { x: this.target.x, y: this.target.y, kind: 'hunt' };
      if (!goal) goal = { x: game.map.center.x + Util.rand(-100, 100), y: game.map.center.y + Util.rand(-100, 100), kind: 'wander' };
    }
    this.goal = goal;

    /* 3. Ricalcola il percorso se serve */
    this.repathT -= this.thinkT;
    const needRepath = !this.path || this.pathIdx >= this.path.length || this.repathT <= 0;
    if (needRepath && goal) {
      this.path = game.map.findPath(b.x, b.y, goal.x, goal.y);
      this.pathIdx = 0;
      this.repathT = 1.2;
    }
  }

  /* ---------- Movimento lungo il percorso + strafe in combattimento ---------- */
  moveAlongPath(game, dt) {
    const b = this.b;
    b.moveX = 0; b.moveY = 0;

    /* In combattimento ravvicinato: kiting laterale per schivare */
    const a = b.def.attack;
    if (this.target && this.goal && this.goal.kind !== 'flee') {
      const d = Util.dist(b.x, b.y, this.target.x, this.target.y);
      const ideal = a.type === 'melee' ? a.range * 0.7 : a.range * 0.72;
      if (d < a.range * 1.05) {
        this.strafeT -= dt;
        if (this.strafeT <= 0) { this.strafeT = Util.rand(0.5, 1.4); this.strafeDir *= -1; }
        const toT = Util.angTo(b.x, b.y, this.target.x, this.target.y);
        /* Mantieni la distanza ideale + movimento laterale */
        const radial = d > ideal + 20 ? 1 : d < ideal - 20 ? -1 : 0;
        const strafe = this.strafeDir;
        b.moveX = Math.cos(toT) * radial + Math.cos(toT + Math.PI / 2) * strafe;
        b.moveY = Math.sin(toT) * radial + Math.sin(toT + Math.PI / 2) * strafe;
        return;
      }
    }

    /* Segui i waypoint del percorso A* */
    if (this.path && this.pathIdx < this.path.length) {
      const wp = this.path[this.pathIdx];
      const d = Util.dist(b.x, b.y, wp.x, wp.y);
      if (d < TILE * 0.6) { this.pathIdx++; return; }
      b.moveX = (wp.x - b.x) / d;
      b.moveY = (wp.y - b.y) / d;
    } else if (this.goal) {
      const d = Util.dist(b.x, b.y, this.goal.x, this.goal.y);
      if (d > 20) {
        b.moveX = (this.goal.x - b.x) / d;
        b.moveY = (this.goal.y - b.y) / d;
      }
    }
  }

  /* ---------- Combattimento: attacco, super, gadget ---------- */
  combat(game, dt) {
    const b = this.b;
    const t = this.target;
    if (!t) return;
    const a = b.def.attack;
    const d = Util.dist(b.x, b.y, t.x, t.y);
    if (d > a.range * 1.05) return;

    /* Serve linea di vista (tranne i lanciatori) */
    if (a.type !== 'lob' && !game.map.lineOfSight(b.x, b.y, t.x, t.y)) return;

    /* Predizione di tiro: mira dove sarà il bersaglio */
    const flight = d / (a.speed || 400);
    const lead = this.diff * 0.85;
    const px = t.x + (t.moveX || 0) * t.speed() * flight * lead;
    const py = t.y + (t.moveY || 0) * t.speed() * flight * lead;
    let ang = Util.angTo(b.x, b.y, px, py);
    /* Errore di mira in base alla difficoltà */
    ang += Util.rand(-1, 1) * (1 - this.diff) * 0.25;
    b.facing = ang;

    /* Attacca (i bot tengono 1 colpo di riserva a bassa difficoltà) */
    if (b.canAttack() && Math.random() < this.diff * 0.9 + 0.1) {
      b.attack(game, ang);
    }

    /* Super: usala se il bersaglio è a portata e la super è carica */
    if (b.canSuper() && d < (b.def.super.range || 200) && Math.random() < 0.35) {
      b.useSuper(game, ang);
    }

    /* Hypercharge: appena pronta in combattimento */
    if (b.canHyper() && Math.random() < 0.3) b.useHyper(game);

    /* Gadget difensivi quando la vita scende */
    if (b.canGadget()) {
      const g = b.def.gadget.type;
      const low = b.hp < b.effMaxHp() * 0.4;
      if ((g === 'selfheal' || g === 'shield' || g === 'stealth' || g === 'fortify') && low && Math.random() < 0.5) b.useGadget(game);
      else if ((g === 'dash' || g === 'nova' || g === 'overcharge') && d < 120 && Math.random() < 0.25) b.useGadget(game);
      else if ((g === 'mine' || g === 'trap' || g === 'icewall') && Math.random() < 0.08) b.useGadget(game);
    }

    /* Emote occasionale dopo un'uccisione (personalità!) */
    if (Math.random() < dt * 0.02) b.showEmote(Util.choice(b.def.emotes));
  }
}
