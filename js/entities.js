/* ============================================================
   entities.js — Entità di gioco.
   Brawler (giocatore/bot/boss), proiettili, zone ad area,
   raccoglibili, effetti di stato, super, gadget, hypercharge.
   ============================================================ */
'use strict';

let ENTITY_ID = 1;

/* ------------------------------------------------------------
   BRAWLER — l'entità principale controllata da umano o IA
   ------------------------------------------------------------ */
class Brawler {
  constructor(defId, level, team, name, isBot, skinColor) {
    this.id = ENTITY_ID++;
    this.def = BRAWLER_BY_ID[defId];
    this.level = level || 1;
    this.team = team;              // 0/1 per 3v3, id squadra univoco in showdown
    this.name = name;
    this.isBot = isBot;
    this.color = skinColor || this.def.color;

    const m = statMult(this.level);
    this.maxHp = Math.round(this.def.hp * m);
    this.hp = this.maxHp;
    this.dmgMult = m;

    this.x = 0; this.y = 0;
    this.radius = 15;
    this.facing = 0;               // direzione visuale
    this.moveX = 0; this.moveY = 0;

    /* Munizioni e ricariche */
    this.maxAmmo = this.def.attack.ammo || 3;
    this.ammo = this.maxAmmo;
    this.superCharge = 0;          // 0..1
    this.hyperCharge = 0;          // 0..1
    this.hyperT = 0;               // tempo hypercharge attivo
    this.gadgetUses = this.def.gadget.uses;
    this.gadgetCd = 0;
    this.attackCd = 0;
    this.queue = [];               // colpi in coda (raffiche / super multiple)

    /* Effetti di stato (timer in secondi) */
    this.slowT = 0; this.stunT = 0; this.rootT = 0;
    this.burnT = 0; this.burnDps = 0; this.burnFrom = null;
    this.hasteT = 0; this.hasteAmt = 0;
    this.stealthT = 0; this.revealT = 0; this.exposeT = 0;
    this.shieldT = 0; this.shieldPct = 0;
    this.overchargeNext = false;

    /* Stato vitale */
    this.alive = true;
    this.respawnT = 0;
    this.invulnT = 0;
    this.regenDelay = 0;           // rigenerazione passiva dopo 4s senza danni

    /* Oggetti modalità */
    this.gems = 0;
    this.cubes = 0;                // power cube (showdown)
    this.stars = 2;                // taglia (bounty)
    this.hasBall = false;

    /* Statistiche partita */
    this.kills = 0; this.deaths = 0; this.dmgDealt = 0; this.supersUsed = 0;

    /* Emote corrente */
    this.emoteT = 0; this.emoteStr = '';

    /* Dash in corso (super di carica / gadget scatto) */
    this.dash = null;              // {ang, speed, t, fn}
  }

  speed() {
    let s = this.def.speed;
    if (this.slowT > 0) s *= 0.55;
    if (this.hasteT > 0) s *= 1 + this.hasteAmt;
    if (this.hyperT > 0) s *= 1.12;
    return s;
  }

  attackDamage() {
    let d = this.def.attack.damage * this.dmgMult * (1 + this.cubes * 0.1);
    if (this.hyperT > 0) d *= 1.08;
    return Math.round(d);
  }

  effMaxHp() { return Math.round(this.maxHp * (1 + this.cubes * 0.1)); }

  /* Visibile per la squadra "viewerTeam"? (gestione cespugli/stealth) */
  visibleTo(game, viewer) {
    if (viewer.team === this.team) return true;
    if (this.stealthT > 0) return false;
    if (this.revealT > 0 || this.exposeT > 0) return true;
    if (game.map.isBushAt(this.x, this.y)) {
      return Util.dist(this.x, this.y, viewer.x, viewer.y) < 78;
    }
    return true;
  }

  /* ---------- Aggiornamento per frame (dt fisso) ---------- */
  update(game, dt) {
    if (!this.alive) {
      this.respawnT -= dt;
      return;
    }
    const def = this.def;

    /* Timer effetti */
    for (const k of ['slowT', 'stunT', 'rootT', 'burnT', 'hasteT', 'stealthT', 'revealT', 'exposeT', 'shieldT', 'hyperT', 'invulnT', 'gadgetCd', 'attackCd', 'emoteT']) {
      if (this[k] > 0) this[k] -= dt;
    }

    /* Danno nel tempo (fuoco/veleno) */
    if (this.burnT > 0 && this.burnDps > 0) {
      this.takeDamage(game, this.burnDps * dt, this.burnFrom, true);
      if (Math.random() < dt * 8) game.particles.sparkle(this.x + Util.rand(-8, 8), this.y + Util.rand(-8, 8), '#ff8c3a');
    }

    /* Le entità statiche (casseforti) non si muovono né rigenerano */
    if (this.staticEntity) return;

    /* Rigenerazione passiva stile brawler: dopo 4s senza subire danni */
    this.regenDelay -= dt;
    if (this.regenDelay <= 0 && this.hp < this.effMaxHp()) {
      this.hp = Math.min(this.effMaxHp(), this.hp + this.effMaxHp() * 0.14 * dt);
    }

    /* Dash in corso (ignora input di movimento) */
    if (this.dash) {
      const d = this.dash;
      const step = d.speed * dt;
      const res = game.map.moveCircle(this.x, this.y, Math.cos(d.ang) * step, Math.sin(d.ang) * step, this.radius);
      this.x = res.x; this.y = res.y;
      if (d.fn) d.fn(this, game, dt);
      d.t -= dt;
      if (d.t <= 0) this.dash = null;
    }
    /* Movimento normale */
    else if (this.stunT <= 0 && this.rootT <= 0 && (this.moveX || this.moveY)) {
      const len = Math.hypot(this.moveX, this.moveY) || 1;
      const s = this.speed() * dt;
      const res = game.map.moveCircle(this.x, this.y, this.moveX / len * s, this.moveY / len * s, this.radius);
      this.x = res.x; this.y = res.y;
      this.facing = Util.lerpAng(this.facing, Math.atan2(this.moveY, this.moveX), 0.25);
      /* polvere dei passi */
      if (Math.random() < dt * 6) game.particles.emit(this.x, this.y + 10, { vx: Util.rand(-15, 15), vy: Util.rand(-8, 0), life: 0.4, size: 3, color: 'rgba(120,90,60,.5)' });
    }

    /* Tile speciali: jump pad e teletrasporti */
    this.checkSpecialTiles(game);

    /* Ricarica munizioni */
    if (this.ammo < this.maxAmmo) {
      this.ammo = Math.min(this.maxAmmo, this.ammo + dt / def.attack.reload);
    }

    /* Coda di colpi (raffiche, super multi-proiettile) */
    if (this.queue.length && this.stunT <= 0) {
      const q = this.queue[0];
      q.t -= dt;
      if (q.t <= 0) { this.queue.shift(); q.fire(game); }
    }
  }

  /* Jump pad e teletrasporti sotto i piedi */
  checkSpecialTiles(game) {
    const tx = (this.x / TILE) | 0, ty = (this.y / TILE) | 0;
    const t = game.map.tileAt(tx, ty);
    if (t === T_JUMP && !this.dash && this.jumpCd !== true) {
      /* Salto: dash veloce nella direzione di movimento (o facing) */
      const ang = (this.moveX || this.moveY) ? Math.atan2(this.moveY, this.moveX) : this.facing;
      this.dash = { ang, speed: 480, t: 0.32 };
      this.invulnT = Math.max(this.invulnT, 0.32);
      AudioSys.sfx('jump');
      game.particles.burst(this.x, this.y, 8, { color: '#5ee08a', maxSpeed: 90, life: 0.4 });
    }
    if (t === T_TELE && this.teleCd <= 0) {
      for (const [a, b] of game.map.teleports) {
        const here = (a.tx === tx && a.ty === ty) ? a : (b.tx === tx && b.ty === ty) ? b : null;
        if (!here) continue;
        const dest = here === a ? b : a;
        game.particles.burst(this.x, this.y, 12, { color: '#c66eff', maxSpeed: 120, life: 0.5, glow: true });
        this.x = (dest.tx + 0.5) * TILE;
        this.y = (dest.ty + 0.5) * TILE;
        this.teleCd = 1.5;
        AudioSys.sfx('tele');
        game.particles.burst(this.x, this.y, 12, { color: '#c66eff', maxSpeed: 120, life: 0.5, glow: true });
        break;
      }
    }
    if (this.teleCd > 0) this.teleCd -= 1 / 60;
    else this.teleCd = 0;
  }

  /* ---------- ATTACCO BASE ---------- */
  canAttack() { return this.alive && this.ammo >= 1 && this.attackCd <= 0 && this.stunT <= 0 && this.queue.length === 0; }

  attack(game, ang) {
    if (!this.canAttack()) return false;
    /* Brawl Ball: se porti la palla, attaccare = calciare */
    if (game.mode.ball && game.mode.ball.carrier === this) {
      return game.mode.kickBall(game, this, ang);
    }
    const a = this.def.attack;
    this.ammo -= 1;
    this.attackCd = 0.25;
    this.facing = ang;
    this.stealthT = 0;                       // attaccare rivela
    this.exposeT = 1.2;                      // visibile brevemente nei cespugli
    const over = this.overchargeNext; this.overchargeNext = false;
    const dmgMul = over ? this.def.gadget.power || 2 : 1;

    const fireShot = (i) => {
      if (!this.alive) return;
      let sa = ang;
      if (a.type === 'spread' || a.type === 'cone') {
        sa = ang + (i - (a.count - 1) / 2) * (a.spread / Math.max(1, a.count - 1)) * 2;
      } else if (a.spread) {
        sa = ang + Util.rand(-a.spread, a.spread);
      }
      game.spawnProjectile(this, sa, {
        damage: this.attackDamage() * dmgMul,
        range: a.range, speed: a.speed, radius: a.radius,
        lob: a.type === 'lob', aoe: a.type === 'lob' ? a.radius : 0,
        pierceUnits: !!a.pierceUnits || (this.hyperT > 0 && this.def.hyper.type === 'pierce'),
        chain: (a.chain || 0) + (this.hyperT > 0 && this.def.hyper.type === 'chainplus' ? 2 : 0),
        slow: a.slow || (this.hyperT > 0 && this.def.hyper.type === 'attackslow' ? 1.2 : 0),
        burn: a.burn ? a.burn * this.dmgMult : (this.hyperT > 0 && this.def.hyper.type === 'poison' ? 300 : 0),
        healAlly: a.healAlly || 0,
        boomerang: a.type === 'boomerang',
        farBonus: a.farBonus || 0,
        color: this.color
      });
      if (over) game.particles.burst(this.x, this.y, 6, { color: '#f5e642', maxSpeed: 90, life: 0.3, glow: true });
    };

    if (a.type === 'melee') {
      /* Colpo in mischia: arco istantaneo davanti a sé */
      const swings = a.count || 1;
      for (let i = 0; i < swings; i++) {
        this.queue.push({ t: i * (a.interval || 0), fire: (g) => this.meleeSwing(g, ang, dmgMul) });
      }
      AudioSys.sfx('melee');
    } else if (a.count > 1 && (a.type === 'burst' || a.type === 'cone')) {
      for (let i = 0; i < a.count; i++) {
        const idx = i;
        this.queue.push({ t: i === 0 ? 0 : (a.interval || 0.08), fire: () => fireShot(idx) });
      }
      AudioSys.sfx(a.type === 'cone' ? 'shoot2' : 'shoot');
    } else if (a.type === 'spread') {
      for (let i = 0; i < a.count; i++) fireShot(i);
      AudioSys.sfx('shoot2');
    } else {
      fireShot(0);
      AudioSys.sfx(a.type === 'lob' ? 'lob' : 'shoot');
    }
    game.particles.muzzle(this.x + Math.cos(ang) * 18, this.y + Math.sin(ang) * 18, ang, this.color);
    if (!this.isBot) Util.vibrate(12);
    return true;
  }

  meleeSwing(game, ang, dmgMul) {
    if (!this.alive) return;
    const a = this.def.attack;
    game.particles.emit(this.x + Math.cos(ang) * 30, this.y + Math.sin(ang) * 30,
      { life: 0.22, size: a.range * 0.55, color: this.color, shape: 'ring' });
    for (const e of game.brawlers) {
      if (e.team === this.team || !e.alive) continue;
      const d = Util.dist(this.x, this.y, e.x, e.y);
      if (d > a.range + e.radius) continue;
      const angTo = Util.angTo(this.x, this.y, e.x, e.y);
      let diff = Math.abs(((angTo - ang) % TAU + TAU) % TAU);
      if (diff > Math.PI) diff = TAU - diff;
      if (diff < (a.arc || 1.5) / 2) {
        game.dealDamage(this, e, this.attackDamage() * dmgMul);
      }
    }
  }

  /* ---------- SUPER ---------- */
  canSuper() { return this.alive && this.superCharge >= 1 && this.stunT <= 0; }

  useSuper(game, ang) {
    if (!this.canSuper()) return false;
    const sd = this.def.super;
    this.superCharge = 0;
    this.supersUsed++;
    this.stealthT = 0;
    this.exposeT = 1.2;
    /* Ogni super carica l'hypercharge */
    this.hyperCharge = Math.min(1, this.hyperCharge + 1 / this.def.hyper.charge);
    const dmg = (base) => Math.round(base * this.dmgMult * (1 + this.cubes * 0.1));
    AudioSys.sfx('super');
    if (!this.isBot) Util.vibrate(40);
    const hyperOn = this.hyperT > 0;

    switch (sd.type) {
      case 'barrage': { /* Bolt: raffica di razzi */
        for (let i = 0; i < sd.count; i++) {
          const idx = i;
          this.queue.push({ t: i === 0 ? 0 : 0.12, fire: (g) => {
            if (!this.alive) return;
            g.spawnProjectile(this, ang + Util.rand(-0.15, 0.15), {
              damage: dmg(sd.damage), range: sd.range, speed: 380, radius: 8,
              aoe: sd.radius, isSuper: true, color: '#ffcf5e'
            });
          }});
        }
        break;
      }
      case 'charge': { /* Titan: carica travolgente */
        const boost = hyperOn && this.def.hyper.type === 'superboost' ? 1.5 : 1;
        const hitSet = new Set();
        this.dash = { ang, speed: 420, t: sd.range / 420, fn: (self, g) => {
          g.map.destroyArea(self.x + Math.cos(ang) * 20, self.y + Math.sin(ang) * 20, 30, g);
          for (const e of g.brawlers) {
            if (e.team === self.team || !e.alive || hitSet.has(e.id)) continue;
            if (Util.dist(self.x, self.y, e.x, e.y) < self.radius + e.radius + 8) {
              hitSet.add(e.id);
              const d = dmg(sd.damage) * boost;
              g.dealDamage(self, e, d);
              if (boost > 1) self.heal(g, d * 0.5);
              /* respinta */
              const ka = Util.angTo(self.x, self.y, e.x, e.y);
              const kres = g.map.moveCircle(e.x, e.y, Math.cos(ka) * sd.knockback, Math.sin(ka) * sd.knockback, e.radius);
              e.x = kres.x; e.y = kres.y;
            }
          }
        }};
        break;
      }
      case 'railgun': { /* Hawk: colpo perforante */
        game.spawnProjectile(this, ang, {
          damage: dmg(sd.damage), range: sd.range, speed: 780, radius: 7,
          pierceUnits: true, pierceWalls: true, isSuper: true, color: '#b6ffcf', trail: true
        });
        break;
      }
      case 'healzone': { /* Meda: zona di cura */
        const shield = hyperOn && this.def.hyper.type === 'zoneshield';
        game.zones.push({ x: this.x, y: this.y, radius: sd.radius, dur: sd.dur, type: 'heal',
          team: this.team, owner: this, heal: sd.heal * this.dmgMult, tick: 0, shield });
        break;
      }
      case 'blink': { /* Shade: teletrasporto offensivo */
        let best = null, bd = sd.range;
        for (const e of game.brawlers) {
          if (e.team === this.team || !e.alive) continue;
          const d = Util.dist(this.x, this.y, e.x, e.y);
          if (d < bd) { bd = d; best = e; }
        }
        if (best) {
          game.particles.burst(this.x, this.y, 14, { color: '#8a5ae0', maxSpeed: 150, life: 0.4, glow: true });
          const ba = Util.angTo(best.x, best.y, this.x, this.y);
          this.x = best.x + Math.cos(ba) * (best.radius + this.radius + 2);
          this.y = best.y + Math.sin(ba) * (best.radius + this.radius + 2);
          const hpBefore = best.hp;
          game.dealDamage(this, best, dmg(sd.damage));
          game.particles.burst(this.x, this.y, 14, { color: '#8a5ae0', maxSpeed: 150, life: 0.4, glow: true });
          /* Hyper: uccisione con super la ricarica subito */
          if (hyperOn && this.def.hyper.type === 'superreset' && hpBefore > 0 && !best.alive) {
            this.superCharge = 1;
            game.particles.text(this.x, this.y - 30, 'RESET!', '#ffe14d', 16);
          }
        } else {
          this.superCharge = 0.5; // nessun bersaglio: rimborso parziale
        }
        break;
      }
      case 'carpet': { /* Bomber: tappeto di bombe */
        const bigger = hyperOn && this.def.hyper.type === 'bigblast' ? 1.4 : 1;
        for (let i = 0; i < sd.count; i++) {
          this.queue.push({ t: i === 0 ? 0 : 0.1, fire: (g) => {
            if (!this.alive) return;
            g.spawnProjectile(this, ang + Util.rand(-0.35, 0.35), {
              damage: dmg(sd.damage), range: sd.range * Util.rand(0.6, 1), speed: 300, radius: 8,
              lob: true, aoe: sd.radius * bigger, isSuper: true,
              slow: bigger > 1 ? 1.2 : 0, color: '#ff8c3a'
            });
          }});
        }
        break;
      }
      case 'frostzone': { /* Frost: zona congelante */
        const root = hyperOn && this.def.hyper.type === 'zoneroot';
        const tx = this.x + Math.cos(ang) * 130, ty = this.y + Math.sin(ang) * 130;
        game.zones.push({ x: tx, y: ty, radius: sd.radius, dur: sd.dur, type: 'frost',
          team: this.team, owner: this, dmg: dmg(sd.damage), tick: 0, root });
        AudioSys.sfx('freeze');
        break;
      }
      case 'stormcloud': { /* Volt: nube che ti segue */
        game.zones.push({ x: this.x, y: this.y, radius: sd.radius, dur: sd.dur, type: 'storm',
          team: this.team, owner: this, dmg: dmg(sd.damage), tick: 0, follow: this });
        break;
      }
      case 'quake': { /* Rook: terremoto */
        const stun = hyperOn && this.def.hyper.type === 'quakestun';
        game.map.destroyArea(this.x, this.y, sd.radius, game);
        game.particles.explosion(this.x, this.y, sd.radius * 0.6, '#a8b0c0');
        game.shake(10);
        for (const e of game.brawlers) {
          if (e.team === this.team || !e.alive) continue;
          if (Util.dist(this.x, this.y, e.x, e.y) < sd.radius + e.radius) {
            game.dealDamage(this, e, dmg(sd.damage));
            if (stun) { e.stunT = 1.2; game.particles.text(e.x, e.y - 30, '💫', '#fff', 18); }
            const ka = Util.angTo(this.x, this.y, e.x, e.y);
            const kres = game.map.moveCircle(e.x, e.y, Math.cos(ka) * sd.knockback, Math.sin(ka) * sd.knockback, e.radius);
            e.x = kres.x; e.y = kres.y;
          }
        }
        AudioSys.sfx('explode');
        break;
      }
      case 'totem': { /* Wisp: totem ancestrale */
        game.zones.push({ x: this.x, y: this.y, radius: sd.radius, dur: sd.dur, type: 'totem',
          team: this.team, owner: this, heal: sd.heal * this.dmgMult, tick: 0,
          dmgEnemies: hyperOn && this.def.hyper.type === 'totemdmg' ? 250 * this.dmgMult : 0 });
        break;
      }
      case 'arrowrain': { /* Fang: pioggia di frecce */
        const tx = this.x + Math.cos(ang) * Math.min(sd.range, 200);
        const ty = this.y + Math.sin(ang) * Math.min(sd.range, 200);
        for (let i = 0; i < sd.count; i++) {
          this.queue.push({ t: i === 0 ? 0.1 : 0.09, fire: (g) => {
            const ax = tx + Util.rand(-sd.zoneRadius, sd.zoneRadius);
            const ay = ty + Util.rand(-sd.zoneRadius, sd.zoneRadius);
            g.particles.emit(ax, ay, { life: 0.25, size: sd.radius, color: '#c8f542', shape: 'ring' });
            for (const e of g.brawlers) {
              if (e.team === this.team || !e.alive) continue;
              if (Util.dist(ax, ay, e.x, e.y) < sd.radius + e.radius) g.dealDamage(this, e, dmg(sd.damage));
            }
            AudioSys.sfx('hit');
          }});
        }
        break;
      }
      case 'firedash': { /* Blaze: scia ardente */
        const wide = hyperOn && this.def.hyper.type === 'infernoheal';
        this.dash = { ang, speed: 400, t: sd.range / 400, fn: (self, g) => {
          if (Math.random() < 0.5) {
            g.zones.push({ x: self.x, y: self.y, radius: wide ? 44 : 30, dur: sd.dur, type: 'fire',
              team: self.team, owner: self, dmg: dmg(sd.damage), tick: 0, healOwner: wide });
          }
        }};
        this.invulnT = 0.4;
        break;
      }
    }
    return true;
  }

  /* ---------- GADGET ---------- */
  canGadget() { return this.alive && this.gadgetUses > 0 && this.gadgetCd <= 0 && this.stunT <= 0; }

  useGadget(game) {
    if (!this.canGadget()) return false;
    const g = this.def.gadget;
    this.gadgetUses--;
    this.gadgetCd = 3;
    AudioSys.sfx('gadget');
    game.particles.text(this.x, this.y - 34, g.name + '!', '#4ae06e', 13);

    switch (g.type) {
      case 'dash':
        this.dash = { ang: this.facing, speed: 460, t: g.power / 460 * 2 };
        break;
      case 'shield': case 'fortify':
        this.shieldT = g.dur; this.shieldPct = g.power;
        if (g.type === 'fortify') this.rootT = g.dur;
        AudioSys.sfx('shield');
        break;
      case 'reveal':
        for (const e of game.brawlers) if (e.team !== this.team) e.revealT = g.dur;
        break;
      case 'selfheal':
        this.heal(game, g.power);
        break;
      case 'stealth':
        this.stealthT = g.dur;
        game.particles.burst(this.x, this.y, 10, { color: '#8a5ae0', maxSpeed: 80, life: 0.5 });
        break;
      case 'mine':
        game.zones.push({ x: this.x, y: this.y, radius: 26, dur: 15, type: 'mine',
          team: this.team, owner: this, dmg: g.power * this.dmgMult });
        break;
      case 'icewall': {
        const tx = ((this.x + Math.cos(this.facing) * TILE * 1.5) / TILE) | 0;
        const ty = ((this.y + Math.sin(this.facing) * TILE * 1.5) / TILE) | 0;
        game.map.placeTempWall(tx, ty, g.dur, game);
        AudioSys.sfx('freeze');
        break;
      }
      case 'overcharge':
        this.overchargeNext = true;
        break;
      case 'haste':
        for (const e of game.brawlers) {
          if (e.team === this.team && e.alive && Util.dist(this.x, this.y, e.x, e.y) < 140) {
            e.hasteT = g.dur; e.hasteAmt = g.power;
          }
        }
        break;
      case 'trap':
        game.zones.push({ x: this.x, y: this.y, radius: 24, dur: 20, type: 'trap',
          team: this.team, owner: this, dmg: g.power * this.dmgMult, rootDur: g.dur });
        break;
      case 'nova':
        game.particles.explosion(this.x, this.y, g.radius, '#ff5a3a');
        for (const e of game.brawlers) {
          if (e.team !== this.team && e.alive && Util.dist(this.x, this.y, e.x, e.y) < g.radius + e.radius) {
            game.dealDamage(this, e, g.power * this.dmgMult);
            e.burnT = 2; e.burnDps = 150 * this.dmgMult; e.burnFrom = this;
          }
        }
        AudioSys.sfx('explode');
        break;
    }
    return true;
  }

  /* ---------- HYPERCHARGE ---------- */
  canHyper() { return this.alive && this.hyperCharge >= 1 && this.hyperT <= 0; }
  useHyper(game) {
    if (!this.canHyper()) return false;
    this.hyperCharge = 0;
    this.hyperT = this.def.hyper.dur;
    AudioSys.sfx('hyper');
    game.shake(6);
    game.particles.burst(this.x, this.y, 24, { color: ['#ff42f5', '#42d9ff', '#ffe14d'], maxSpeed: 200, life: 0.7, glow: true });
    game.particles.text(this.x, this.y - 40, 'HYPERCHARGE!', '#ff42f5', 18);
    if (!this.isBot) Util.vibrate([30, 40, 30]);
    return true;
  }

  /* ---------- Danni, cure, morte ---------- */
  takeDamage(game, amount, attacker, silent) {
    if (!this.alive || this.invulnT > 0) return 0;
    let dmg = amount;
    if (this.shieldT > 0) dmg *= (1 - this.shieldPct);
    dmg = Math.round(dmg);
    if (dmg <= 0) return 0;
    this.hp -= dmg;
    this.regenDelay = 4;
    if (!silent) {
      game.particles.text(this.x + Util.rand(-8, 8), this.y - 24, String(dmg),
        attacker && attacker.team === game.playerTeam ? '#ffe14d' : '#ff6a6a', 13 + Math.min(6, dmg / 400));
      game.particles.hit(this.x, this.y, '#ff4a4a');
      AudioSys.sfx('hit');
    }
    if (attacker && attacker.team !== this.team) {
      attacker.dmgDealt += dmg;
      attacker.superCharge = Math.min(1, attacker.superCharge + dmg / attacker.def.super.charge);
      if (attacker.hyperT > 0) attacker.hyperCharge = Math.min(1, attacker.hyperCharge + dmg / (attacker.def.super.charge * 6));
    }
    if (this.hp <= 0) this.die(game, attacker);
    else if (!this.isBot) Util.vibrate(18);
    return dmg;
  }

  heal(game, amount) {
    if (!this.alive) return;
    const before = this.hp;
    this.hp = Math.min(this.effMaxHp(), this.hp + amount);
    const healed = Math.round(this.hp - before);
    if (healed > 0) {
      game.particles.healFx(this.x, this.y);
      game.particles.text(this.x, this.y - 24, '+' + healed, '#4ae06e', 12);
      AudioSys.sfx('heal');
    }
  }

  die(game, killer) {
    this.alive = false;
    this.deaths++;
    this.hp = 0;
    if (killer && killer !== this) killer.kills++;
    game.particles.death(this.x, this.y, this.color);
    AudioSys.sfx('death');
    game.shake(5);
    if (!this.isBot) Util.vibrate([50, 60, 80]);
    game.mode.onDeath(game, this, killer);
    this.queue.length = 0;
    this.dash = null;
    this.hasBall = false;
  }

  respawn(game, x, y) {
    this.alive = true;
    this.hp = this.effMaxHp();
    this.x = x; this.y = y;
    this.invulnT = 2;
    this.ammo = this.maxAmmo;
    this.slowT = this.stunT = this.rootT = this.burnT = 0;
    AudioSys.sfx('respawn');
    game.particles.burst(x, y, 14, { color: [this.color, '#ffffff'], maxSpeed: 130, life: 0.5, glow: true });
  }

  showEmote(str) { this.emoteStr = str; this.emoteT = 2; }

  /* ---------- Rendering ---------- */
  draw(ctx, game) {
    if (!this.alive) return;
    const inBush = game.map.isBushAt(this.x, this.y);
    const isAllyView = this.team === game.playerTeam;
    /* Trasparenza per cespugli/stealth (i nemici invisibili non arrivano qui) */
    let alpha = 1;
    if (this.stealthT > 0) alpha = isAllyView ? 0.45 : 0;
    else if (inBush) alpha = isAllyView ? 0.65 : 0.85;
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;

    const r = this.radius;
    /* Ombra */
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.ellipse(this.x, this.y + r - 3, r * 0.9, r * 0.4, 0, 0, TAU); ctx.fill();

    /* Anello squadra */
    const ringColor = this.team === game.playerTeam ? (this === game.player ? '#ffffff' : '#26d9ff') : '#ff4a5e';
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(this.x, this.y, r + 3, 0, TAU); ctx.stroke();

    /* Corpo */
    const grad = ctx.createRadialGradient(this.x - r * 0.4, this.y - r * 0.5, 2, this.x, this.y, r + 2);
    grad.addColorStop(0, Util.shade(this.color, 0.35));
    grad.addColorStop(1, this.color);
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, TAU); ctx.fill();

    /* Arma: piccolo indicatore direzionale per classe */
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.facing);
    ctx.fillStyle = Util.shade(this.def.dark || '#333333', -0.1);
    const cls = this.def.cls;
    if (cls === 'Cecchino') ctx.fillRect(r - 4, -2.5, 16, 5);
    else if (cls === 'Tank' || cls === 'Assassino') { ctx.fillRect(r - 6, -4, 12, 8); }
    else if (cls === 'Lanciatore') { ctx.beginPath(); ctx.arc(r + 2, 0, 5, 0, TAU); ctx.fill(); }
    else ctx.fillRect(r - 4, -3, 12, 6);
    ctx.restore();

    /* Faccia semplice (occhi verso il facing) */
    const ex = Math.cos(this.facing) * 4, ey = Math.sin(this.facing) * 4;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x - 5 + ex, this.y - 3 + ey, 3.4, 0, TAU);
    ctx.arc(this.x + 5 + ex, this.y - 3 + ey, 3.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(this.x - 5 + ex * 1.3, this.y - 3 + ey * 1.3, 1.6, 0, TAU);
    ctx.arc(this.x + 5 + ex * 1.3, this.y - 3 + ey * 1.3, 1.6, 0, TAU);
    ctx.fill();

    /* Effetti di stato visivi */
    if (this.shieldT > 0) {
      ctx.strokeStyle = 'rgba(110,198,255,.8)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(this.x, this.y, r + 7 + Math.sin(game.time * 8), 0, TAU); ctx.stroke();
    }
    if (this.hyperT > 0) {
      ctx.strokeStyle = `hsla(${(game.time * 300) % 360},100%,65%,.9)`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.x, this.y, r + 6, 0, TAU); ctx.stroke();
    }
    if (this.slowT > 0 || this.rootT > 0) {
      ctx.fillStyle = 'rgba(110,198,255,.6)';
      ctx.fillRect(this.x - 8, this.y + r - 2, 16, 4);
    }
    if (this.stunT > 0) {
      ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('💫', this.x, this.y - r - 18);
    }
    if (this.invulnT > 0) ctx.globalAlpha = alpha * (0.5 + 0.5 * Math.sin(game.time * 20));

    /* Barra vita + nome */
    const bw = 40, bh = 6;
    const bx = this.x - bw / 2, by = this.y - r - 16;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    const hpFrac = this.hp / this.effMaxHp();
    ctx.fillStyle = this.team === game.playerTeam ? '#4ae06e' : '#ff4a5e';
    ctx.fillRect(bx, by, bw * hpFrac, bh);
    /* Tacche super pronte */
    if (this.superCharge >= 1) {
      ctx.fillStyle = '#ffe14d';
      ctx.fillRect(bx, by - 4, bw, 2.5);
    }
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = this === game.player ? '#ffe14d' : '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 2.5;
    ctx.strokeText(this.name, this.x, by - 6);
    ctx.fillText(this.name, this.x, by - 6);

    /* Gemme / power cube trasportati */
    if (this.gems > 0) {
      ctx.font = 'bold 11px sans-serif';
      const s = '💎' + this.gems;
      ctx.strokeText(s, this.x, this.y + r + 14);
      ctx.fillStyle = '#b78aff'; ctx.fillText(s, this.x, this.y + r + 14);
    }
    if (this.cubes > 0) {
      ctx.font = 'bold 11px sans-serif';
      const s = '▣' + this.cubes;
      ctx.strokeText(s, this.x, this.y + r + 14);
      ctx.fillStyle = '#c66eff'; ctx.fillText(s, this.x, this.y + r + 14);
    }
    if (this.hasBall) {
      ctx.font = '16px sans-serif';
      ctx.fillText('⚽', this.x, this.y - r - 26);
    }

    /* Emote */
    if (this.emoteT > 0) {
      ctx.font = '18px sans-serif';
      ctx.fillStyle = '#fff';
      const bob = Math.sin(game.time * 6) * 2;
      ctx.strokeText(this.emoteStr, this.x + 22, this.y - r - 22 + bob);
      ctx.fillText(this.emoteStr, this.x + 22, this.y - r - 22 + bob);
    }
    ctx.globalAlpha = 1;
  }
}

/* ------------------------------------------------------------
   PROIETTILE — gestito da game.spawnProjectile / updateProjectiles
   ------------------------------------------------------------ */
class Projectile {
  constructor() { this.reset(); }
  reset() {
    this.alive = false;
    this.hitSet = null;
  }
  init(owner, ang, opts) {
    this.alive = true;
    this.owner = owner;
    this.team = owner.team;
    this.x = owner.x + Math.cos(ang) * (owner.radius + 6);
    this.y = owner.y + Math.sin(ang) * (owner.radius + 6);
    this.sx = this.x; this.sy = this.y;
    this.ang = ang;
    this.speed = opts.speed || 400;
    this.range = opts.range || 200;
    this.damage = opts.damage || 100;
    this.radius = opts.radius || 6;
    this.lob = !!opts.lob;
    this.aoe = opts.aoe || 0;
    this.pierceUnits = !!opts.pierceUnits;
    this.pierceWalls = !!opts.pierceWalls || this.lob;
    this.chain = opts.chain || 0;
    this.slow = opts.slow || 0;
    this.burn = opts.burn || 0;
    this.healAlly = opts.healAlly || 0;
    this.boomerang = !!opts.boomerang;
    this.returning = false;
    this.farBonus = opts.farBonus || 0;
    this.isSuper = !!opts.isSuper;
    this.trail = !!opts.trail;
    this.color = opts.color || '#fff';
    this.traveled = 0;
    this.hitSet = new Set();
  }
}

/* ------------------------------------------------------------
   PICKUP — gemme, power cube, cure, stelle
   ------------------------------------------------------------ */
class Pickup {
  constructor(x, y, type) {
    this.x = x; this.y = y;
    this.type = type;          // 'gem' | 'cube' | 'heal'
    this.bob = Math.random() * TAU;
    this.spawnT = 0.3;         // piccola animazione di comparsa
  }
  draw(ctx, time) {
    const b = Math.sin(time * 3 + this.bob) * 3;
    const scale = this.spawnT > 0 ? 1 - this.spawnT / 0.3 : 1;
    ctx.save();
    ctx.translate(this.x, this.y + b);
    ctx.scale(scale, scale);
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = this.type === 'gem' ? '#b78aff' : '#c66eff';
    ctx.shadowBlur = 10;
    ctx.fillText(this.type === 'gem' ? '💎' : this.type === 'cube' ? '▣' : '➕', 0, 6);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

/* ------------------------------------------------------------
   Boss per la modalità Boss Fight: definizione dinamica
   ------------------------------------------------------------ */
function makeBossDef() {
  return {
    id: 'boss', name: 'MEGA-TRON', cls: 'Boss', color: '#5a6478', dark: '#23283a',
    hp: 60000, speed: 66, desc: 'Boss robotico gigante.',
    attack: { name: 'Cannoni Gemelli', type: 'spread', count: 6, damage: 500, range: 260,
      speed: 380, radius: 9, spread: 0.7, reload: 0.9, ammo: 3 },
    super: { name: 'Onda Devastante', type: 'quake', damage: 900, radius: 170, knockback: 90, charge: 8000 },
    gadget: { name: '-', type: 'none', uses: 0 },
    hyper: { name: '-', type: 'none', dur: 0, charge: 99 },
    emotes: ['🤖'],
    skins: [{ id: 'def', name: 'Boss', color: '#5a6478' }]
  };
}
