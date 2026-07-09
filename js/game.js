/* ============================================================
   game.js — Orchestratore della partita.
   Gestisce entità, proiettili, zone ad area, raccoglibili,
   camera con shake, danni, mira automatica e rendering.
   ============================================================ */
'use strict';

class Game {
  constructor(modeId, canvas, hud) {
    this.modeId = modeId;
    this.canvas = canvas;
    this.hud = hud;
    this.map = new GameMap(modeId);
    this.particles = new ParticleSystem();
    this.brawlers = [];
    this.projectiles = [];
    this.projPool = new Pool(() => new Projectile());
    this.zones = [];
    this.pickups = [];
    this.playerTeam = 0;
    this.player = null;
    this.time = 0;
    this.fps = 60;
    this.countdown = 3.2;       // 3..2..1..GO
    this.lastCount = 4;
    this.active = false;        // input abilitato dopo il countdown
    this.finished = false;
    this.endTimer = 0;
    this.endResult = null;
    this.shakeAmt = 0;
    this.announceText = '';
    this.announceT = 0;
    this.cam = { x: 0, y: 0, zoom: 1 };

    this.mode = createMode(modeId, this);
    this.mode.setup(this);
    hud.reset();
    /* Inquadra subito il giocatore (senza lerp dal bordo) */
    this.updateCamera(0);
    this.cam.x = this.camTargetX;
    this.cam.y = this.camTargetY;
    AudioSys.music('battle');
  }

  /* ---------- Creazione entità ---------- */
  addPlayer(team) {
    const id = Save.state.selectedBrawler;
    const bs = Save.brawlerState(id);
    const def = BRAWLER_BY_ID[id];
    const skin = def.skins.find(s => s.id === bs.skin) || def.skins[0];
    const b = new Brawler(id, bs.level, team, Save.state.name, false, skin.color);
    this.player = b;
    this.brawlers.push(b);
    return b;
  }

  addBot(team, defId) {
    const pool = BRAWLERS.filter(d => d.id !== 'boss');
    const def = defId ? BRAWLER_BY_ID[defId] : Util.choice(pool);
    const level = Math.max(1, Save.brawlerState(Save.state.selectedBrawler).level + Util.irand(-1, 1));
    /* Nomi bot senza duplicati nella stessa partita */
    if (!this.namePool || !this.namePool.length) this.namePool = Util.shuffle(BOT_NAMES.slice());
    const b = new Brawler(def.id, level, team, this.namePool.pop(), true);
    /* Difficoltà scala con i trofei del giocatore */
    const diff = Util.clamp(0.45 + Save.totalTrophies() / 4000, 0.45, 0.9);
    b.brain = new BotBrain(b, diff + Util.rand(-0.1, 0.1));
    this.brawlers.push(b);
    return b;
  }

  spawnPickup(x, y, type) { this.pickups.push(new Pickup(x, y, type)); }

  /* ---------- Input del giocatore ---------- */
  playerAttack(ang) {
    const p = this.player;
    if (!p.alive) return;
    if (ang === null) ang = this.autoAimAngle(p);
    if (ang === null) ang = p.facing;
    p.attack(this, ang);
  }

  playerSuper(ang) {
    const p = this.player;
    if (!p.alive || !p.canSuper()) return;
    if (ang === null) ang = this.autoAimAngle(p, this.player.def.super.range || 250) ?? p.facing;
    p.useSuper(this, ang);
  }

  playerGadget() { if (this.player.alive) this.player.useGadget(this); }
  playerHyper() { if (this.player.alive) this.player.useHyper(this); }
  playerEmote() {
    const e = this.player.def.emotes;
    this.player.showEmote(Util.choice(e));
  }

  /* Mira automatica: nemico visibile più vicino a portata */
  autoAimAngle(b, rangeOverride) {
    const a = b.def.attack;
    const range = (rangeOverride || a.range) * 1.18;
    let best = null, bd = range;
    for (const e of this.brawlers) {
      if (e.team === b.team || !e.alive) continue;
      if (!e.visibleTo(this, b)) continue;
      const d = Util.dist(b.x, b.y, e.x, e.y);
      if (d > bd) continue;
      /* I lanciatori non hanno bisogno di linea di vista */
      if (a.type !== 'lob' && !this.map.lineOfSight(b.x, b.y, e.x, e.y)) continue;
      bd = d; best = e;
    }
    if (!best) return null;
    /* Predizione del movimento del bersaglio */
    const flight = bd / (a.speed || 400);
    const px = best.x + (best.moveX || 0) * best.speed() * flight * 0.7;
    const py = best.y + (best.moveY || 0) * best.speed() * flight * 0.7;
    return Util.angTo(b.x, b.y, px, py);
  }

  requestQuit() {
    /* Abbandono: conta come sconfitta */
    this.finish({ win: false, quit: true });
  }

  announce(text) { this.announceText = text; this.announceT = 2.2; }
  shake(amt) { this.shakeAmt = Math.max(this.shakeAmt, amt); }

  /* ---------- Proiettili ---------- */
  spawnProjectile(owner, ang, opts) {
    const pr = this.projPool.get();
    pr.init(owner, ang, opts);
    this.projectiles.push(pr);
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      let dead = false;

      /* Boomerang: fase di ritorno verso il proprietario */
      if (pr.boomerang && pr.returning) {
        const o = pr.owner;
        pr.ang = Util.angTo(pr.x, pr.y, o.x, o.y);
        if (Util.dist(pr.x, pr.y, o.x, o.y) < 20 || !o.alive) dead = true;
      }
      const step = pr.speed * dt;
      pr.x += Math.cos(pr.ang) * step;
      pr.y += Math.sin(pr.ang) * step;
      pr.traveled += step;

      /* Scia luminosa */
      if (pr.trail && Math.random() < 0.6) {
        this.particles.emit(pr.x, pr.y, { life: 0.25, size: 4, color: pr.color, glow: true });
      }

      /* Fine gittata */
      if (!dead && pr.traveled >= pr.range) {
        if (pr.lob || pr.aoe) { this.explodeAt(pr); dead = true; }
        else if (pr.boomerang && !pr.returning) { pr.returning = true; pr.hitSet.clear(); }
        else dead = true;
      }

      /* Collisione con i muri (i lob volano sopra) */
      if (!dead && !pr.pierceWalls) {
        const t = this.map.tileAtWorld(pr.x, pr.y);
        if (this.map.blocksProjectile(t)) {
          this.map.damageWall((pr.x / TILE) | 0, (pr.y / TILE) | 0, pr.damage, this);
          this.particles.hit(pr.x, pr.y, pr.color);
          if (pr.aoe) this.explodeAt(pr);
          dead = true;
        }
      }
      /* Fuori mappa */
      if (!dead && (pr.x < 0 || pr.y < 0 || pr.x > this.map.pixelW || pr.y > this.map.pixelH)) dead = true;

      /* Collisione con i brawler */
      if (!dead && !pr.lob) {
        for (const e of this.brawlers) {
          if (!e.alive || e === pr.owner || pr.hitSet.has(e.id)) continue;
          if (Util.dist2(pr.x, pr.y, e.x, e.y) > (pr.radius + e.radius) ** 2) continue;

          if (e.team === pr.team) {
            /* Dardo curativo sugli alleati */
            if (pr.healAlly) {
              pr.hitSet.add(e.id);
              e.heal(this, pr.damage * pr.healAlly);
              dead = true;
              break;
            }
            continue;
          }
          pr.hitSet.add(e.id);
          /* Danno con bonus distanza (cecchini) */
          let dmg = pr.damage;
          if (pr.farBonus) dmg *= 1 + (pr.farBonus - 1) * Util.clamp(pr.traveled / pr.range, 0, 1);
          this.dealDamage(pr.owner, e, dmg);
          if (pr.slow) e.slowT = Math.max(e.slowT, pr.slow);
          if (pr.burn) { e.burnT = 2.5; e.burnDps = pr.burn / 2.5; e.burnFrom = pr.owner; }

          /* Fulmine a catena */
          if (pr.chain > 0) {
            let next = null, nd = 130;
            for (const o of this.brawlers) {
              if (o.team === pr.team || !o.alive || pr.hitSet.has(o.id)) continue;
              const d = Util.dist(e.x, e.y, o.x, o.y);
              if (d < nd) { nd = d; next = o; }
            }
            if (next) {
              const cp = this.projPool.get();
              cp.init(pr.owner, Util.angTo(e.x, e.y, next.x, next.y), {
                damage: pr.damage * 0.8, range: 150, speed: pr.speed, radius: pr.radius,
                chain: pr.chain - 1, color: pr.color
              });
              cp.x = e.x; cp.y = e.y;
              cp.hitSet = new Set(pr.hitSet);
              this.projectiles.push(cp);
              this.particles.emit(e.x, e.y, { life: 0.2, size: 10, color: pr.color, shape: 'ring' });
            }
          }
          if (pr.aoe) { this.explodeAt(pr); dead = true; break; }
          if (!pr.pierceUnits && !pr.boomerang) { dead = true; break; }
        }
      }

      if (dead) {
        this.projPool.release(pr);
        this.projectiles[i] = this.projectiles[this.projectiles.length - 1];
        this.projectiles.pop();
      }
    }
  }

  /* Esplosione ad area di un proiettile */
  explodeAt(pr) {
    this.particles.explosion(pr.x, pr.y, pr.aoe || 30, pr.color);
    AudioSys.sfx('explode');
    if (pr.isSuper) this.map.destroyArea(pr.x, pr.y, (pr.aoe || 30) * 0.8, this);
    this.shake(pr.isSuper ? 5 : 2);
    for (const e of this.brawlers) {
      if (e.team === pr.team || !e.alive) continue;
      const d = Util.dist(pr.x, pr.y, e.x, e.y);
      if (d < (pr.aoe || 30) + e.radius) {
        this.dealDamage(pr.owner, e, pr.damage);
        if (pr.slow) e.slowT = Math.max(e.slowT, pr.slow);
        if (pr.burn) { e.burnT = 2.5; e.burnDps = pr.burn / 2.5; e.burnFrom = pr.owner; }
      }
    }
  }

  dealDamage(attacker, victim, dmg) {
    victim.takeDamage(this, dmg, attacker);
  }

  /* ---------- Zone ad area (super, gadget, scie) ---------- */
  updateZones(dt) {
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.dur -= dt;
      if (z.dur <= 0) { this.zones.splice(i, 1); continue; }
      if (z.follow) { z.x = z.follow.x; z.y = z.follow.y; if (!z.follow.alive) { this.zones.splice(i, 1); continue; } }
      z.tick = (z.tick || 0) - dt;

      switch (z.type) {
        case 'heal':
          for (const b of this.brawlers) {
            if (b.team !== z.team || !b.alive || b.staticEntity) continue;
            if (Util.dist(b.x, b.y, z.x, z.y) < z.radius + b.radius) {
              b.hp = Math.min(b.effMaxHp(), b.hp + z.heal * dt);
              if (z.shield) { b.shieldT = Math.max(b.shieldT, 0.6); b.shieldPct = Math.max(b.shieldPct, 0.25); }
              if (Math.random() < dt * 3) this.particles.healFx(b.x, b.y);
            }
          }
          break;
        case 'totem':
          for (const b of this.brawlers) {
            if (!b.alive || b.staticEntity) continue;
            const inside = Util.dist(b.x, b.y, z.x, z.y) < z.radius + b.radius;
            if (!inside) continue;
            if (b.team === z.team) {
              b.hp = Math.min(b.effMaxHp(), b.hp + z.heal * dt);
              b.hasteT = Math.max(b.hasteT, 0.3); b.hasteAmt = Math.max(b.hasteAmt, 0.15);
            } else if (z.dmgEnemies) {
              b.takeDamage(this, z.dmgEnemies * dt, z.owner, true);
            }
          }
          break;
        case 'frost':
          for (const b of this.brawlers) {
            if (b.team === z.team || !b.alive) continue;
            if (Util.dist(b.x, b.y, z.x, z.y) < z.radius + b.radius) {
              b.slowT = Math.max(b.slowT, 0.4);
              b.takeDamage(this, z.dmg * dt / 2, z.owner, true);
              if (z.root && !z.rooted) { z.rooted = new Set(); }
              if (z.root && !z.rooted.has(b.id)) { z.rooted.add(b.id); b.rootT = 1.5; this.particles.text(b.x, b.y - 28, '🧊', '#fff', 16); }
            }
          }
          break;
        case 'storm':
          if (z.tick <= 0) {
            z.tick = 0.7;
            let best = null, bd = z.radius;
            for (const b of this.brawlers) {
              if (b.team === z.team || !b.alive) continue;
              const d = Util.dist(b.x, b.y, z.x, z.y);
              if (d < bd) { bd = d; best = b; }
            }
            if (best) {
              this.dealDamage(z.owner, best, z.dmg);
              this.particles.burst(best.x, best.y, 8, { color: '#f5e642', maxSpeed: 120, life: 0.3, glow: true });
              AudioSys.sfx('hit');
            }
          }
          break;
        case 'fire':
          for (const b of this.brawlers) {
            if (!b.alive) continue;
            const inside = Util.dist(b.x, b.y, z.x, z.y) < z.radius + b.radius;
            if (!inside) continue;
            if (b.team !== z.team) {
              b.takeDamage(this, z.dmg * dt, z.owner, true);
              if (Math.random() < dt * 6) this.particles.sparkle(b.x, b.y, '#ff8c3a');
            } else if (z.healOwner && b === z.owner) {
              b.hp = Math.min(b.effMaxHp(), b.hp + 250 * dt);
            }
          }
          break;
        case 'mine':
          for (const b of this.brawlers) {
            if (b.team === z.team || !b.alive) continue;
            if (Util.dist(b.x, b.y, z.x, z.y) < z.radius + b.radius) {
              this.particles.explosion(z.x, z.y, 60, '#ff8c3a');
              AudioSys.sfx('explode');
              for (const e of this.brawlers) {
                if (e.team === z.team || !e.alive) continue;
                if (Util.dist(e.x, e.y, z.x, z.y) < 60 + e.radius) this.dealDamage(z.owner, e, z.dmg);
              }
              this.zones.splice(i, 1);
              break;
            }
          }
          break;
        case 'trap':
          for (const b of this.brawlers) {
            if (b.team === z.team || !b.alive) continue;
            if (Util.dist(b.x, b.y, z.x, z.y) < z.radius + b.radius) {
              b.rootT = z.rootDur;
              this.dealDamage(z.owner, b, z.dmg);
              this.particles.burst(z.x, z.y, 10, { color: '#4a8a2a', maxSpeed: 90, life: 0.4 });
              this.zones.splice(i, 1);
              break;
            }
          }
          break;
      }
    }
  }

  /* ---------- Raccoglibili ---------- */
  updatePickups(dt) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      if (p.spawnT > 0) { p.spawnT -= dt; continue; }
      for (const b of this.brawlers) {
        if (!b.alive || b.staticEntity) continue;
        if (Util.dist(b.x, b.y, p.x, p.y) < b.radius + 14) {
          if (p.type === 'gem') {
            b.gems++;
            AudioSys.sfx('gem');
            if (b === this.player) this.matchGems = (this.matchGems || 0) + 1;
          } else if (p.type === 'cube') {
            b.cubes++;
            b.hp = Math.min(b.effMaxHp(), b.hp + 400);
            AudioSys.sfx('cube');
          } else if (p.type === 'heal') {
            b.heal(this, 800);
          }
          this.particles.burst(p.x, p.y, 8, { color: p.type === 'gem' ? '#b78aff' : '#c66eff', maxSpeed: 90, life: 0.4, glow: true });
          this.pickups.splice(i, 1);
          break;
        }
      }
    }
  }

  /* ---------- Update principale (timestep fisso) ---------- */
  update(dt) {
    this.time += dt;
    this.particles.update(dt);
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 30);
    if (this.announceT > 0) this.announceT -= dt;

    /* Countdown iniziale */
    if (this.countdown > 0) {
      this.countdown -= dt;
      const c = Math.ceil(this.countdown);
      if (c !== this.lastCount && c > 0) { this.lastCount = c; AudioSys.sfx('count'); }
      if (this.countdown <= 0) { this.active = true; AudioSys.sfx('go'); this.announce(this.map.name); }
      this.updateCamera(dt);
      return;
    }

    /* Fine partita: breve pausa poi risultati */
    if (this.finished) {
      this.endTimer -= dt;
      /* Slow motion drammatico */
      const sdt = dt * 0.35;
      for (const b of this.brawlers) b.update(this, sdt);
      this.updateProjectiles(sdt);
      this.updateCamera(dt);
      if (this.endTimer <= 0) Menus.showResults(this, this.endResult);
      return;
    }

    /* Input giocatore: joystick oppure tastiera */
    const p = this.player;
    if (p.alive) {
      const km = this.hud.keyboardMove();
      const mv = (km.x || km.y) ? km : this.hud.move;
      p.moveX = mv.x; p.moveY = mv.y;
      /* Fuoco automatico opzionale */
      if (Save.state.settings.autoFire && p.canAttack()) {
        const ang = this.autoAimAngle(p);
        if (ang !== null) p.attack(this, ang);
      }
    }

    /* IA dei bot */
    for (const b of this.brawlers) {
      if (b.brain && b.alive) b.brain.update(this, dt);
    }
    /* Entità */
    for (const b of this.brawlers) b.update(this, dt);
    this.updateProjectiles(dt);
    this.updateZones(dt);
    this.updatePickups(dt);

    /* Regole della modalità */
    this.mode.update(this, dt);
    const end = this.mode.checkEnd(this);
    if (end && !this.finished) this.finish(end);

    this.updateCamera(dt);
  }

  finish(result) {
    this.finished = true;
    this.active = false;
    this.endTimer = result.quit ? 0 : 1.6;
    this.endResult = result;
    AudioSys.sfx(result.win ? 'win' : 'lose');
  }

  /* ---------- Camera ---------- */
  updateCamera(dt) {
    /* Zoom: ~460 unità mondo sul lato corto, ma mai oltre i bordi mappa */
    const w = this.canvas.clientWidth || 800;
    const h = this.canvas.clientHeight || 450;
    this.zoom = Math.max(Math.min(w, h) / 460, w / this.map.pixelW, h / this.map.pixelH);
    this.viewW = w / this.zoom;
    this.viewH = h / this.zoom;

    const target = this.player;
    let tx = target.x - this.viewW / 2, ty = target.y - this.viewH / 2;
    tx = Util.clamp(tx, 0, Math.max(0, this.map.pixelW - this.viewW));
    ty = Util.clamp(ty, 0, Math.max(0, this.map.pixelH - this.viewH));
    this.camTargetX = tx; this.camTargetY = ty;
    this.cam.x = Util.lerp(this.cam.x, tx, Math.min(1, dt * 7));
    this.cam.y = Util.lerp(this.cam.y, ty, Math.min(1, dt * 7));
  }

  /* ---------- Rendering ---------- */
  render(ctx, w, h) {
    const zoom = this.zoom || 1;
    /* Pulizia esplicita: lo sfondo scuro riempie le zone fuori mappa */
    ctx.fillStyle = '#0a0e28';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.scale(zoom, zoom);
    /* Shake della camera */
    const sx = this.shakeAmt ? Util.rand(-this.shakeAmt, this.shakeAmt) : 0;
    const sy = this.shakeAmt ? Util.rand(-this.shakeAmt, this.shakeAmt) : 0;
    ctx.translate(-this.cam.x + sx, -this.cam.y + sy);

    /* Mondo */
    this.map.draw(ctx, this.cam, this.viewW, this.viewH);
    this.mode.drawWorld(ctx, this);

    /* Zone ad area */
    for (const z of this.zones) this.drawZone(ctx, z);

    /* Raccoglibili */
    for (const p of this.pickups) p.draw(ctx, this.time);

    /* Indicatore di mira manuale del giocatore */
    if (this.hud.aim && this.hud.aim.dragged && this.player.alive) {
      const a = this.hud.aim;
      const range = a.type === 'super' ? (this.player.def.super.range || 220) : this.player.def.attack.range;
      ctx.strokeStyle = a.type === 'super' ? 'rgba(255,225,77,.8)' : 'rgba(255,255,255,.65)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(this.player.x, this.player.y);
      ctx.lineTo(this.player.x + Math.cos(a.ang) * range, this.player.y + Math.sin(a.ang) * range);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(this.player.x + Math.cos(a.ang) * range, this.player.y + Math.sin(a.ang) * range,
        this.player.def.attack.type === 'lob' ? this.player.def.attack.radius : 12, 0, TAU);
      ctx.stroke();
    }

    /* Entità ordinate per Y (pseudo-profondità) */
    const sorted = this.brawlers.slice().sort((a, b) => a.y - b.y);
    for (const b of sorted) {
      /* Nemici invisibili nei cespugli: salta il disegno */
      if (b.team !== this.playerTeam && b.alive && !b.visibleTo(this, this.player)) continue;
      b.draw(ctx, this);
    }

    /* Proiettili */
    for (const pr of this.projectiles) this.drawProjectile(ctx, pr);

    /* Particelle sopra a tutto */
    this.particles.draw(ctx);

    ctx.restore();

    /* --- Overlay in coordinate schermo --- */
    if (this.countdown > 0) {
      ctx.fillStyle = 'rgba(6,8,24,.45)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffe14d';
      ctx.font = `bold ${Math.min(w, h) * 0.22}px 'Trebuchet MS', sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const c = Math.ceil(this.countdown);
      const frac = 1 - (this.countdown - Math.floor(this.countdown));
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(0.6 + frac * 0.5, 0.6 + frac * 0.5);
      ctx.fillText(c > 0 ? String(c) : 'GO!', 0, 0);
      ctx.restore();
      ctx.textBaseline = 'alphabetic';
    } else if (this.announceT > 0) {
      ctx.globalAlpha = Math.min(1, this.announceT);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w, h) * 0.06}px 'Trebuchet MS', sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 5;
      ctx.strokeText(this.announceText, w / 2, h * 0.24);
      ctx.fillText(this.announceText, w / 2, h * 0.24);
      ctx.globalAlpha = 1;
    }

    /* HUD */
    this.hud.draw(ctx, this);
  }

  drawZone(ctx, z) {
    const colors = {
      heal: ['rgba(74,224,110,.2)', '#4ae06e'], totem: ['rgba(66,245,200,.2)', '#42f5c8'],
      frost: ['rgba(110,198,255,.28)', '#6ec6ff'], storm: ['rgba(245,230,66,.18)', '#f5e642'],
      fire: ['rgba(255,90,58,.3)', '#ff5a3a'], mine: ['rgba(255,140,58,.15)', '#ff8c3a'],
      trap: ['rgba(74,138,42,.15)', '#4a8a2a']
    };
    const [fill, stroke] = colors[z.type] || colors.heal;
    /* Mine e trappole nemiche sono invisibili al giocatore */
    if ((z.type === 'mine' || z.type === 'trap') && z.team !== this.playerTeam) return;
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, TAU); ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6 + 0.3 * Math.sin(this.time * 4);
    ctx.beginPath(); ctx.arc(z.x, z.y, z.radius - 2, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
    /* Icona al centro */
    const icons = { heal: '➕', totem: '🗿', frost: '❄️', storm: '⛈️', fire: '', mine: '💣', trap: '🕸️' };
    if (icons[z.type]) {
      ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(icons[z.type], z.x, z.y + 5);
    }
  }

  drawProjectile(ctx, pr) {
    ctx.save();
    if (pr.lob) {
      /* Parabola: ombra a terra + proiettile in "volo" */
      const t = pr.traveled / pr.range;
      const height = Math.sin(t * Math.PI) * 46;
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.beginPath(); ctx.ellipse(pr.x, pr.y, 7, 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = pr.color;
      ctx.shadowColor = pr.color; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(pr.x, pr.y - height, pr.radius, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = pr.color;
      ctx.shadowColor = pr.color; ctx.shadowBlur = 10;
      ctx.translate(pr.x, pr.y);
      ctx.rotate(pr.ang);
      ctx.beginPath();
      ctx.ellipse(0, 0, pr.radius * 1.7, pr.radius * 0.8, 0, 0, TAU);
      ctx.fill();
      /* nucleo bianco */
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.beginPath(); ctx.ellipse(2, 0, pr.radius * 0.8, pr.radius * 0.4, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
}
