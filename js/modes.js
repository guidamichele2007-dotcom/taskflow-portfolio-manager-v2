/* ============================================================
   modes.js — Logica delle modalità di gioco.
   Ogni modalità implementa un'interfaccia comune:
     setup(game)                — crea brawler e oggetti
     update(game, dt)           — regole per frame
     onDeath(game, b, killer)   — gestione eliminazioni
     botGoal(game, bot)         — obiettivo per l'IA
     drawWorld(ctx, game)       — oggetti di modalità
     hudText(game)              — testo punteggio in alto
     checkEnd(game)             — condizione di fine partita
   ============================================================ */
'use strict';

/* Definizione della cassaforte (Rapina) come entità statica */
function makeSafeDef() {
  return {
    id: 'safe', name: 'CASSAFORTE', cls: 'Statico', color: '#8892a8', dark: '#3a4152',
    hp: 26000, speed: 0, desc: '',
    attack: { name: '-', type: 'single', count: 1, damage: 0, range: 0, speed: 1, radius: 1, reload: 99, ammo: 0 },
    super: { name: '-', type: 'none', charge: 1e9 },
    gadget: { name: '-', type: 'none', uses: 0 },
    hyper: { name: '-', type: 'none', dur: 0, charge: 99 },
    emotes: [], skins: [{ id: 'def', name: '-', color: '#8892a8' }]
  };
}

/* ---------- Classe base con comportamenti comuni ---------- */
class BaseMode {
  constructor(game) {
    this.game = game;
    this.timeLeft = 120;        // limite standard 2 minuti
    this.respawnTime = 3;       // 0 = niente respawn
    this.over = null;           // risultato finale
  }

  /* Crea il giocatore + bot per una 3v3 standard */
  setup3v3(game) {
    game.playerTeam = 0;
    const used = new Set([Save.state.selectedBrawler]);
    const pick = () => {
      const free = BRAWLERS.filter(b => !used.has(b.id));
      const d = Util.choice(free.length ? free : BRAWLERS);
      used.add(d.id);
      return d.id;
    };
    game.addPlayer(0);
    game.addBot(0, pick()); game.addBot(0, pick());
    game.addBot(1, pick()); game.addBot(1, pick()); game.addBot(1, pick());
    /* Posiziona sulle piazzole di spawn */
    for (const team of [0, 1]) {
      const spots = game.map.spawns[team];
      let i = 0;
      for (const b of game.brawlers) {
        if (b.team !== team) continue;
        const s = spots[i % spots.length] || game.map.center;
        b.x = s.x; b.y = s.y;
        b.homeX = s.x; b.homeY = s.y;
        i++;
      }
    }
  }

  /* Respawn automatico alla base */
  handleRespawns(game, dt) {
    if (!this.respawnTime) return;
    for (const b of game.brawlers) {
      if (b.alive || b.staticEntity || b.respawnT > 0) continue;
      b.respawn(game, b.homeX, b.homeY);
    }
  }

  onDeath(game, b, killer) {
    if (this.respawnTime) b.respawnT = this.respawnTime;
  }

  botGoal() { return null; }
  drawWorld() {}
  hudText() { return ''; }
  update(game, dt) {
    this.timeLeft -= dt;
    this.handleRespawns(game, dt);
  }

  /* Vittoria a tempo scaduto in base a un punteggio [team0, team1] */
  timeoutResult(score0, score1) {
    if (score0 > score1) return { win: true };
    if (score1 > score0) return { win: false };
    return { win: false, draw: true };
  }
}

/* ============================ GEM GRAB ============================ */
class GemGrabMode extends BaseMode {
  constructor(game) {
    super(game);
    this.spawnT = 2;
    this.countdown = -1;        // conto alla rovescia di vittoria
    this.countTeam = -1;
    this.timeLeft = 150;
  }
  setup(game) { this.setup3v3(game); }

  teamGems(game, team) {
    let g = 0;
    for (const b of game.brawlers) if (b.team === team && b.alive) g += b.gems;
    return g;
  }

  update(game, dt) {
    super.update(game, dt);
    /* Il pozzo genera una gemma ogni 4 secondi (max 12 sul campo) */
    this.spawnT -= dt;
    const onField = game.pickups.filter(p => p.type === 'gem').length;
    if (this.spawnT <= 0 && onField < 12) {
      this.spawnT = 4;
      game.spawnPickup(game.map.center.x + Util.rand(-14, 14), game.map.center.y + Util.rand(-14, 14), 'gem');
      game.particles.burst(game.map.center.x, game.map.center.y, 6, { color: '#b78aff', maxSpeed: 70, life: 0.5, glow: true });
    }
    /* Conto alla rovescia quando una squadra ha 10+ gemme */
    const g0 = this.teamGems(game, 0), g1 = this.teamGems(game, 1);
    const leader = g0 >= 10 ? 0 : g1 >= 10 ? 1 : -1;
    if (leader >= 0) {
      if (this.countTeam !== leader) { this.countTeam = leader; this.countdown = 15; }
      this.countdown -= dt;
      if (this.countdown <= 0) this.over = { win: leader === 0 };
    } else {
      this.countTeam = -1; this.countdown = -1;
    }
    if (this.timeLeft <= 0) this.over = this.timeoutResult(g0, g1);
  }

  onDeath(game, b, killer) {
    super.onDeath(game, b, killer);
    /* Le gemme si spargono a terra */
    for (let i = 0; i < b.gems; i++) {
      const a = Util.rand(0, TAU);
      game.spawnPickup(b.x + Math.cos(a) * Util.rand(10, 40), b.y + Math.sin(a) * Util.rand(10, 40), 'gem');
    }
    b.gems = 0;
  }

  botGoal(game, bot) {
    /* I portatori carichi si ritirano, gli altri contestano il centro */
    if (bot.gems >= 4) return { x: bot.homeX, y: bot.homeY, kind: 'retreat', prio: 2 };
    return { x: game.map.center.x, y: game.map.center.y, kind: 'objective', prio: 1 };
  }

  drawWorld(ctx, game) {
    /* Pozzo delle gemme */
    const c = game.map.center;
    ctx.fillStyle = '#3a2a5a';
    ctx.beginPath(); ctx.arc(c.x, c.y, 20, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#b78aff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(c.x, c.y, 20 + Math.sin(game.time * 3) * 2, 0, TAU); ctx.stroke();
  }

  hudText(game) {
    const g0 = this.teamGems(game, 0), g1 = this.teamGems(game, 1);
    let s = `💎 ${g0}  —  ${g1} 💎`;
    if (this.countdown > 0) s += `   ⏳ ${Math.ceil(this.countdown)}`;
    return s;
  }
  checkEnd() { return this.over; }
}

/* ============================ SHOWDOWN ============================ */
class ShowdownMode extends BaseMode {
  constructor(game, duo) {
    super(game);
    this.duo = duo;
    this.respawnTime = 0;
    this.timeLeft = 150;
    this.gasR = 0;              // raggio del gas (dal bordo verso il centro)
    this.gasT = 12;             // il gas inizia dopo 12s
    this.rankOut = 0;           // quanti eliminati finora
  }

  setup(game) {
    const spots = Util.shuffle(game.map.spawns.ffa.slice());
    if (this.duo) {
      /* 5 squadre da 2: il giocatore è nel team 0 col suo compagno */
      game.playerTeam = 0;
      this.respawnTime = 5;   // in duo si rientra se il compagno è vivo
      game.addPlayer(0);
      game.addBot(0);
      for (let t = 1; t < 5; t++) { game.addBot(t); game.addBot(t); }
      let i = 0;
      for (const b of game.brawlers) {
        const s = spots[Math.floor(i / 2) % spots.length];
        b.x = s.x + (i % 2) * 30; b.y = s.y;
        b.homeX = b.x; b.homeY = b.y;
        i++;
      }
      this.teamsTotal = 5;
    } else {
      game.playerTeam = 0;
      game.addPlayer(0);
      for (let t = 1; t < 10; t++) game.addBot(t);
      let i = 0;
      for (const b of game.brawlers) {
        const s = spots[i % spots.length];
        b.x = s.x; b.y = s.y; b.homeX = s.x; b.homeY = s.y;
        i++;
      }
      this.teamsTotal = 10;
    }
  }

  aliveTeams(game) {
    const t = new Set();
    for (const b of game.brawlers) if (b.alive || b.respawnT > 0) t.add(b.team);
    return t;
  }

  update(game, dt) {
    this.timeLeft -= dt;
    /* Respawn duo: solo se il compagno è ancora vivo */
    if (this.duo) {
      for (const b of game.brawlers) {
        if (b.alive || b.respawnT > 0) continue;
        const mate = game.brawlers.find(o => o.team === b.team && o !== b && o.alive);
        if (mate) b.respawn(game, mate.x + 20, mate.y);
      }
    }
    /* Avanzamento del gas velenoso */
    this.gasT -= dt;
    if (this.gasT <= 0) this.gasR = Math.min(game.map.pixelW * 0.42, this.gasR + dt * 9);
    /* Danno da gas */
    const m = game.map;
    for (const b of game.brawlers) {
      if (!b.alive) continue;
      const inGas = b.x < this.gasR || b.y < this.gasR || b.x > m.pixelW - this.gasR || b.y > m.pixelH - this.gasR;
      if (inGas) {
        b.takeDamage(game, 700 * dt, null, true);
        if (Math.random() < dt * 4) game.particles.sparkle(b.x, b.y, '#8cff3a');
      }
    }
  }

  onDeath(game, b, killer) {
    /* Rilascia i power cube */
    for (let i = 0; i < Math.max(1, b.cubes); i++) {
      const a = Util.rand(0, TAU);
      game.spawnPickup(b.x + Math.cos(a) * Util.rand(8, 30), b.y + Math.sin(a) * Util.rand(8, 30), 'cube');
    }
    b.cubes = 0;
    if (this.duo) {
      const mate = game.brawlers.find(o => o.team === b.team && o !== b && o.alive);
      if (mate) b.respawnT = this.respawnTime;
    }
  }

  botGoal(game, bot) {
    /* Fuggi dal gas prima di tutto */
    const m = game.map, margin = this.gasR + TILE * 2;
    if (bot.x < margin || bot.y < margin || bot.x > m.pixelW - margin || bot.y > m.pixelH - margin) {
      return { x: m.pixelW / 2, y: m.pixelH / 2, kind: 'flee-gas', prio: 2 };
    }
    /* Rompi le casse dei power cube */
    let best = null, bd = 400;
    for (const c of m.cubes) {
      const d = Util.dist(bot.x, bot.y, (c.tx + 0.5) * TILE, (c.ty + 0.5) * TILE);
      if (d < bd) { bd = d; best = c; }
    }
    if (best) return { x: (best.tx + 0.5) * TILE, y: (best.ty + 0.5) * TILE, kind: 'cube', prio: 1 };
    return null;
  }

  drawWorld(ctx, game) {
    /* Gas velenoso ai bordi */
    if (this.gasR > 2) {
      const m = game.map, r = this.gasR;
      ctx.fillStyle = 'rgba(120,220,60,.3)';
      ctx.fillRect(0, 0, m.pixelW, r);
      ctx.fillRect(0, m.pixelH - r, m.pixelW, r);
      ctx.fillRect(0, r, r, m.pixelH - r * 2);
      ctx.fillRect(m.pixelW - r, r, r, m.pixelH - r * 2);
      ctx.strokeStyle = 'rgba(140,255,58,.8)'; ctx.lineWidth = 2;
      ctx.strokeRect(r, r, m.pixelW - r * 2, m.pixelH - r * 2);
    }
  }

  hudText(game) {
    const alive = this.aliveTeams(game).size;
    return this.duo ? `👥 Squadre rimaste: ${alive}` : `💀 Rimasti: ${alive}`;
  }

  checkEnd(game) {
    const alive = this.aliveTeams(game);
    const playerIn = alive.has(game.playerTeam);
    if (!playerIn) {
      /* Il giocatore è eliminato: piazzamento = squadre rimaste + 1 */
      return { win: alive.size <= 1, rank: alive.size + 1 };
    }
    if (alive.size <= 1) return { win: true, rank: 1 };
    if (this.timeLeft <= 0) return { win: false, rank: alive.size, draw: true };
    return null;
  }
}

/* ============================ BRAWL BALL ============================ */
class BrawlBallMode extends BaseMode {
  constructor(game) {
    super(game);
    this.score = [0, 0];
    this.timeLeft = 150;
    this.ball = { x: 0, y: 0, vx: 0, vy: 0, carrier: null };
    this.resetT = 0;
    this.goalW = TILE * 4;
  }

  setup(game) {
    this.setup3v3(game);
    this.ball.x = game.map.center.x;
    this.ball.y = game.map.center.y;
  }

  /* Rettangoli delle porte: team 0 difende in alto, team 1 in basso */
  goalRect(game, team) {
    const m = game.map;
    const gx = m.pixelW / 2 - this.goalW / 2;
    return team === 0 ? { x: gx, y: 0, w: this.goalW, h: TILE }
                      : { x: gx, y: m.pixelH - TILE, w: this.goalW, h: TILE };
  }

  update(game, dt) {
    super.update(game, dt);
    const ball = this.ball;

    if (this.resetT > 0) { this.resetT -= dt; return; }

    if (ball.carrier && !ball.carrier.alive) ball.carrier = null;
    if (ball.carrier) {
      /* La palla segue il portatore */
      ball.x = ball.carrier.x + Math.cos(ball.carrier.facing) * 20;
      ball.y = ball.carrier.y + Math.sin(ball.carrier.facing) * 20;
    } else {
      /* Fisica della palla: attrito e rimbalzo sui muri */
      ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      const f = Math.pow(0.4, dt);
      ball.vx *= f; ball.vy *= f;
      if (game.map.circleHits(ball.x, ball.y, 9)) {
        ball.x -= ball.vx * dt * 2; ball.y -= ball.vy * dt * 2;
        if (game.map.circleHits(ball.x + ball.vx * dt, ball.y, 9)) ball.vx *= -0.7;
        if (game.map.circleHits(ball.x, ball.y + ball.vy * dt, 9)) ball.vy *= -0.7;
      }
      ball.x = Util.clamp(ball.x, 10, game.map.pixelW - 10);
      ball.y = Util.clamp(ball.y, 10, game.map.pixelH - 10);
      /* Raccolta */
      for (const b of game.brawlers) {
        if (!b.alive || b.stunT > 0) continue;
        if (Util.dist(b.x, b.y, ball.x, ball.y) < b.radius + 12) {
          ball.carrier = b; b.hasBall = true;
          AudioSys.sfx('kick');
          break;
        }
      }
    }

    /* Gol! */
    for (const team of [0, 1]) {
      const g = this.goalRect(game, team);
      if (ball.x > g.x && ball.x < g.x + g.w && ball.y > g.y && ball.y < g.y + g.h) {
        const scorer = 1 - team;          // chi segna nella porta di "team"
        this.score[scorer]++;
        AudioSys.sfx('goal');
        game.shake(8);
        game.particles.explosion(ball.x, ball.y, 60, '#ffe14d');
        game.announce(scorer === game.playerTeam ? 'GOL! ⚽' : 'Gol subito...');
        if (this.score[scorer] >= 2) this.over = { win: scorer === 0 };
        this.resetPositions(game);
        return;
      }
    }
    if (this.timeLeft <= 0) this.over = this.timeoutResult(this.score[0], this.score[1]);
  }

  resetPositions(game) {
    this.ball.carrier = null;
    this.ball.vx = this.ball.vy = 0;
    this.ball.x = game.map.center.x;
    this.ball.y = game.map.center.y;
    this.resetT = 1.5;
    for (const b of game.brawlers) {
      b.hasBall = false;
      if (b.alive) { b.x = b.homeX; b.y = b.homeY; b.hp = b.effMaxHp(); }
    }
  }

  /* Chiamato dal gioco quando il portatore preme attacco: calcio! */
  kickBall(game, kicker, ang) {
    if (this.ball.carrier !== kicker) return false;
    this.ball.carrier = null;
    kicker.hasBall = false;
    this.ball.vx = Math.cos(ang) * 520;
    this.ball.vy = Math.sin(ang) * 520;
    AudioSys.sfx('kick');
    game.particles.muzzle(this.ball.x, this.ball.y, ang, '#ffffff');
    return true;
  }

  onDeath(game, b, killer) {
    super.onDeath(game, b, killer);
    if (this.ball.carrier === b) { this.ball.carrier = null; b.hasBall = false; }
  }

  botGoal(game, bot) {
    const enemyGoal = this.goalRect(game, 1 - bot.team);
    if (this.ball.carrier === bot) {
      /* Porta la palla in porta; calcia se vicino */
      const gx = enemyGoal.x + enemyGoal.w / 2, gy = enemyGoal.y + enemyGoal.h / 2;
      if (Util.dist(bot.x, bot.y, gx, gy) < 200 && game.map.lineOfSight(bot.x, bot.y, gx, gy)) {
        this.kickBall(game, bot, Util.angTo(bot.x, bot.y, gx, gy));
      }
      return { x: gx, y: gy, kind: 'score', prio: 2 };
    }
    if (!this.ball.carrier) return { x: this.ball.x, y: this.ball.y, kind: 'ball', prio: 2 };
    if (this.ball.carrier.team !== bot.team) return { x: this.ball.carrier.x, y: this.ball.carrier.y, kind: 'chase', prio: 1 };
    /* Compagno con la palla: accompagna l'azione */
    const g2 = this.goalRect(game, 1 - bot.team);
    return { x: g2.x + g2.w / 2 + Util.rand(-80, 80), y: g2.y + (bot.team === 0 ? -60 : 60) * -1, kind: 'support', prio: 0 };
  }

  drawWorld(ctx, game) {
    /* Porte */
    for (const team of [0, 1]) {
      const g = this.goalRect(game, team);
      ctx.fillStyle = team === 0 ? 'rgba(38,217,255,.35)' : 'rgba(255,74,94,.35)';
      ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = team === 0 ? '#26d9ff' : '#ff4a5e';
      ctx.lineWidth = 3;
      ctx.strokeRect(g.x, g.y, g.w, g.h);
    }
    /* Palla */
    if (!this.ball.carrier && this.resetT <= 0) {
      ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('⚽', this.ball.x, this.ball.y + 8);
    }
  }

  hudText() { return `⚽ ${this.score[0]}  —  ${this.score[1]}`; }
  checkEnd() { return this.over; }
}

/* ============================ RAPINA (HEIST) ============================ */
class HeistMode extends BaseMode {
  constructor(game) { super(game); this.timeLeft = 120; }

  setup(game) {
    this.setup3v3(game);
    /* Casseforti davanti agli spawn */
    this.safes = [];
    for (const team of [0, 1]) {
      const s = new Brawler('safe', 1, team, 'CASSAFORTE', true);
      s.staticEntity = true;
      s.radius = 22;
      const spot = game.map.spawns[team][1] || game.map.spawns[team][0];
      s.x = spot.x; s.y = spot.y + (team === 0 ? 60 : -60);
      s.homeX = s.x; s.homeY = s.y;
      game.brawlers.push(s);
      this.safes.push(s);
    }
  }

  update(game, dt) {
    super.update(game, dt);
    const hp0 = this.safes[0].hp, hp1 = this.safes[1].hp;
    if (this.timeLeft <= 0) this.over = this.timeoutResult(hp0, hp1);
  }

  onDeath(game, b, killer) {
    if (b.staticEntity) {
      this.over = { win: b.team === 1 };   // cassaforte rossa distrutta = vittoria blu
      game.shake(14);
      game.particles.explosion(b.x, b.y, 90, '#ffcf5e');
      return;
    }
    super.onDeath(game, b, killer);
  }

  botGoal(game, bot) {
    const enemySafe = this.safes[1 - bot.team];
    const mySafe = this.safes[bot.team];
    /* Metà squadra difende se la propria cassaforte è sotto attacco */
    if (mySafe.hp < mySafe.maxHp * 0.7 && (bot.id % 2 === 0)) {
      return { x: mySafe.x, y: mySafe.y - 40, kind: 'defend', prio: 1 };
    }
    return { x: enemySafe.x, y: enemySafe.y + (bot.team === 0 ? -50 : 50), kind: 'attack', prio: 1 };
  }

  drawWorld(ctx, game) {
    for (const s of this.safes) {
      if (!s.alive) continue;
      ctx.font = '30px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('💰', s.x, s.y + 10);
    }
  }

  hudText() {
    const p = (s) => Math.max(0, Math.round(s.hp / s.maxHp * 100)) + '%';
    return `💰 ${p(this.safes[0])}  —  ${p(this.safes[1])} 💰`;
  }
  checkEnd() { return this.over; }
}

/* ============================ KNOCKOUT ============================ */
class KnockoutMode extends BaseMode {
  constructor(game) {
    super(game);
    this.respawnTime = 0;
    this.rounds = [0, 0];
    this.roundTime = 60;
    this.betweenT = 0;
  }
  setup(game) { this.setup3v3(game); }

  update(game, dt) {
    if (this.betweenT > 0) {
      this.betweenT -= dt;
      if (this.betweenT <= 0) this.resetRound(game);
      return;
    }
    this.roundTime -= dt;
    const alive0 = game.brawlers.filter(b => b.team === 0 && b.alive).length;
    const alive1 = game.brawlers.filter(b => b.team === 1 && b.alive).length;
    let roundWinner = -1;
    if (alive0 === 0) roundWinner = 1;
    else if (alive1 === 0) roundWinner = 0;
    else if (this.roundTime <= 0) roundWinner = alive0 >= alive1 ? 0 : 1;
    if (roundWinner >= 0) {
      this.rounds[roundWinner]++;
      game.announce(roundWinner === game.playerTeam ? 'Round vinto! 🥊' : 'Round perso...');
      if (this.rounds[roundWinner] >= 2) this.over = { win: roundWinner === 0 };
      else this.betweenT = 2.5;
    }
  }

  resetRound(game) {
    this.roundTime = 60;
    for (const b of game.brawlers) {
      b.respawn(game, b.homeX, b.homeY);
      b.superCharge = 0.4;   // piccolo aiuto tra i round
      b.gadgetUses = Math.max(1, b.gadgetUses);
    }
  }

  botGoal(game, bot) {
    return { x: game.map.center.x + Util.rand(-90, 90), y: game.map.center.y + Util.rand(-60, 60), kind: 'objective', prio: 0 };
  }

  hudText() { return `🥊 ${this.rounds[0]}  —  ${this.rounds[1]}   ⏱ ${Math.max(0, Math.ceil(this.roundTime))}`; }
  checkEnd() { return this.over; }
}

/* ============================ ZONA CALDA ============================ */
class HotZoneMode extends BaseMode {
  constructor(game) {
    super(game);
    this.progress = [0, 0];
    this.need = 30;          // secondi di controllo per vincere
    this.timeLeft = 150;
    this.zoneR = 100;
  }
  setup(game) { this.setup3v3(game); }

  update(game, dt) {
    super.update(game, dt);
    const c = this.game.map.center;
    let in0 = 0, in1 = 0;
    for (const b of this.game.brawlers) {
      if (!b.alive) continue;
      if (Util.dist(b.x, b.y, c.x, c.y) < this.zoneR) {
        if (b.team === 0) in0++; else in1++;
      }
    }
    if (in0 > 0 && in1 === 0) this.progress[0] += dt;
    if (in1 > 0 && in0 === 0) this.progress[1] += dt;
    if (this.progress[0] >= this.need) this.over = { win: true };
    else if (this.progress[1] >= this.need) this.over = { win: false };
    else if (this.timeLeft <= 0) this.over = this.timeoutResult(this.progress[0], this.progress[1]);
  }

  botGoal(game, bot) {
    const c = game.map.center;
    return { x: c.x + Util.rand(-this.zoneR, this.zoneR) * 0.6, y: c.y + Util.rand(-this.zoneR, this.zoneR) * 0.6, kind: 'objective', prio: 1 };
  }

  drawWorld(ctx, game) {
    const c = game.map.center;
    const pulse = Math.sin(game.time * 3) * 4;
    ctx.fillStyle = 'rgba(255,110,60,.18)';
    ctx.beginPath(); ctx.arc(c.x, c.y, this.zoneR, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ff6e3c'; ctx.lineWidth = 3;
    ctx.setLineDash([12, 8]);
    ctx.beginPath(); ctx.arc(c.x, c.y, this.zoneR + pulse, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
  }

  hudText() {
    const p = (v) => Math.min(100, Math.round(v / this.need * 100)) + '%';
    return `🔥 ${p(this.progress[0])}  —  ${p(this.progress[1])}`;
  }
  checkEnd() { return this.over; }
}

/* ============================ TAGLIA (BOUNTY) ============================ */
class BountyMode extends BaseMode {
  constructor(game) {
    super(game);
    this.stars = [0, 0];
    this.timeLeft = 120;
  }
  setup(game) {
    this.setup3v3(game);
    for (const b of game.brawlers) b.stars = 2;
  }

  update(game, dt) {
    super.update(game, dt);
    if (this.timeLeft <= 0) this.over = this.timeoutResult(this.stars[0], this.stars[1]);
  }

  onDeath(game, b, killer) {
    super.onDeath(game, b, killer);
    if (killer && killer.team !== b.team && !killer.staticEntity) {
      this.stars[killer.team] += b.stars;
      game.particles.text(b.x, b.y - 40, `+${b.stars} ⭐`, '#ffe14d', 16);
      killer.stars = Math.min(7, killer.stars + 1);
      b.stars = 2;
    }
  }

  botGoal(game, bot) {
    /* Gioca prudente: resta a metà campo */
    const c = game.map.center;
    const side = bot.team === 0 ? -1 : 1;
    return { x: c.x + Util.rand(-120, 120), y: c.y + side * Util.rand(30, 130), kind: 'objective', prio: 0 };
  }

  hudText() { return `⭐ ${this.stars[0]}  —  ${this.stars[1]}`; }
  checkEnd() { return this.over; }
}

/* ============================ BOSS FIGHT ============================ */
class BossFightMode extends BaseMode {
  constructor(game) {
    super(game);
    this.respawnTime = 6;
    this.timeLeft = 180;
    this.lives = 6;           // respawn di squadra limitati
  }

  setup(game) {
    game.playerTeam = 0;
    game.addPlayer(0);
    game.addBot(0); game.addBot(0);
    /* Il boss */
    const boss = new Brawler('boss', 1, 1, 'MEGA-TRON', true);
    boss.radius = 30;
    boss.brain = new BotBrain(boss, 0.75);
    boss.x = game.map.center.x; boss.y = game.map.center.y;
    boss.homeX = boss.x; boss.homeY = boss.y;
    game.brawlers.push(boss);
    this.boss = boss;
    /* Posiziona la squadra */
    const spots = game.map.spawns[0].length ? game.map.spawns[0] : game.map.spawns.ffa;
    let i = 0;
    for (const b of game.brawlers) {
      if (b.team !== 0) continue;
      const s = spots[i % spots.length];
      b.x = s.x; b.y = s.y; b.homeX = s.x; b.homeY = s.y;
      i++;
    }
  }

  update(game, dt) {
    this.timeLeft -= dt;
    /* Il boss usa la super quando circondato */
    if (this.boss.alive && this.boss.superCharge >= 1) this.boss.useSuper(game, this.boss.facing);
    /* Il boss si infuria sotto il 50% */
    if (this.boss.alive && this.boss.hp < this.boss.maxHp * 0.5 && !this.enraged) {
      this.enraged = true;
      this.boss.hasteT = 999; this.boss.hasteAmt = 0.35;
      game.announce('Il boss è FURIOSO! 😡');
    }
    /* Respawn con vite di squadra */
    for (const b of game.brawlers) {
      if (b.team !== 0 || b.alive || b.respawnT > 0) continue;
      if (this.lives > 0) { this.lives--; b.respawnT = this.respawnTime; }
    }
    if (this.timeLeft <= 0) this.over = { win: false };
  }

  onDeath(game, b, killer) {
    if (b === this.boss) { this.over = { win: true }; return; }
  }

  botGoal(game, bot) {
    if (bot.team === 0) return { x: this.boss.x + Util.rand(-100, 100), y: this.boss.y + Util.rand(-100, 100), kind: 'boss', prio: 1 };
    return null;
  }

  hudText() {
    const pct = Math.max(0, Math.round(this.boss.hp / this.boss.maxHp * 100));
    return `🤖 Boss: ${pct}%   ❤️ Vite: ${this.lives}`;
  }
  checkEnd() { return this.over; }
}

/* ---------- Factory ---------- */
function createMode(id, game) {
  switch (id) {
    case 'gemgrab':   return new GemGrabMode(game);
    case 'showdown':  return new ShowdownMode(game, false);
    case 'duo':       return new ShowdownMode(game, true);
    case 'brawlball': return new BrawlBallMode(game);
    case 'heist':     return new HeistMode(game);
    case 'knockout':  return new KnockoutMode(game);
    case 'hotzone':   return new HotZoneMode(game);
    case 'bounty':    return new BountyMode(game);
    case 'bossfight': return new BossFightMode(game);
    default:          return new GemGrabMode(game);
  }
}

/* Registra le definizioni dinamiche (boss, cassaforte) */
BRAWLER_BY_ID['boss'] = makeBossDef();
BRAWLER_BY_ID['safe'] = makeSafeDef();
