/* ============================================================
   map.js — Mappe a tile: layout, collisioni, distruzione
   ambientale, cespugli, acqua, jump pad, teletrasporti,
   pathfinding A* e rendering con pseudo-3D.

   Legenda simboli dei template:
   .  terreno       #  cassa distruttibile   X  roccia
   b  cespuglio     w  acqua                 J  jump pad
   T  teletrasporto C  cassa power cube (showdown)
   1  spawn squadra blu   2  spawn squadra rossa
   G  punto centrale modalità (gemme / zona / palla)
   S  cassaforte (rapina)  P  porta (brawl ball)
   ============================================================ */
'use strict';

const TILE = 36;   // dimensione tile in pixel-mondo

/* Tipi di tile runtime */
const T_EMPTY = 0, T_WALL = 1, T_ROCK = 2, T_BUSH = 3, T_WATER = 4, T_JUMP = 5, T_TELE = 6;

/* ------------------------------------------------------------
   Template 3v3 — metà superiore (14 righe) + riga centrale.
   La metà inferiore viene generata specchiando e ruotando,
   garantendo mappe perfettamente simmetriche.
   ------------------------------------------------------------ */
const MAP_TEMPLATES_3V3 = [
  { name: 'Canyon Cristallino', top: [
    '.....................',
    '...1....1....1.......',
    '.....................',
    '..##..........##.....',
    '..#X....bb....X#.....',
    '........bb...........',
    '.bb............ .bb..',
    '.bb...X####X....bb...',
    '......#....#.........',
    '..w....J..........w..',
    '..w...........bb..w..',
    '......##..##..bb.....',
    '.....................',
    '...bbb.........bbb...',
  ], mid: '..........G..........' },

  { name: 'Miniera Profonda', top: [
    '.....................',
    '....1.....1.....1....',
    '.....................',
    '.XX.....###.....XX...',
    '........#.#..........',
    '..bb............bb...',
    '..bb...w....w...bb...',
    '.......w....w........',
    '.###..............###',
    '.#..................#',
    '....X..........X.....',
    '..T....bbbb......T...',
    '.......bbbb..........',
    '.....................',
  ], mid: '..........G..........' },

  { name: 'Giungla Ardente', top: [
    '.....................',
    '..1......1......1....',
    '....................b',
    '.bbb..........bbb..bb',
    '.bbb....####..bbb....',
    '........#............',
    '...X............X....',
    '...X....J..J....X....',
    '.....................',
    '.w.......##.......w..',
    '.w..bb...##...bb..w..',
    '....bb........bb.....',
    '.....###....###......',
    '.....................',
  ], mid: '..........G..........' }
];

class GameMap {
  /* mode: id modalità — determina template e oggetti */
  constructor(modeId, seed) {
    this.modeId = modeId;
    this.rng = Util.seededRng(seed || (Math.random() * 1e9) | 0);
    this.jumpPads = [];      // {tx, ty}
    this.teleports = [];     // coppie collegate
    this.spawns = { 0: [], 1: [], ffa: [] };
    this.center = { x: 0, y: 0 };
    this.wallHp = {};        // hp residui delle casse: chiave "tx,ty"
    this.cubes = [];         // casse power-cube (showdown)
    this.decor = [];         // dettagli estetici del terreno
    this.time = 0;

    if (modeId === 'showdown' || modeId === 'duo') this.buildShowdown();
    else this.buildTeamMap();
    this.buildDecor();
  }

  /* ---------- Costruzione mappa 3v3 da template simmetrico ---------- */
  buildTeamMap() {
    const t = MAP_TEMPLATES_3V3[(this.rng() * MAP_TEMPLATES_3V3.length) | 0];
    this.name = t.name;
    const rows = t.top.slice();
    rows.push(t.mid);
    /* Specchia ruotando di 180°: riga invertita + scambio marker squadre */
    for (let i = t.top.length - 1; i >= 0; i--) {
      rows.push(t.top[i].split('').reverse().join('')
        .replace(/1/g, '2'));
    }
    this.loadRows(rows);
  }

  /* ---------- Showdown: arena procedurale simmetrica ---------- */
  buildShowdown() {
    const W = 36, H = 36;
    const rows = [];
    for (let y = 0; y < H; y++) rows.push('.'.repeat(W).split(''));

    /* Genera un quadrante e replicalo a specchio nei 4 angoli */
    const half = W / 2;
    for (let i = 0; i < 42; i++) {
      const x = (this.rng() * half) | 0, y = (this.rng() * half) | 0;
      const r = this.rng();
      const c = r < 0.38 ? '#' : r < 0.55 ? 'X' : r < 0.9 ? 'b' : 'w';
      for (const [px, py] of [[x, y], [W - 1 - x, y], [x, H - 1 - y], [W - 1 - x, H - 1 - y]]) {
        if (px > 1 && py > 1 && px < W - 2 && py < H - 2) rows[py][px] = c;
      }
    }
    /* Casse power-cube: al centro e sparse simmetriche */
    rows[half][half] = 'C'; rows[half - 1][half - 1] = 'C';
    for (let i = 0; i < 4; i++) {
      const x = 3 + ((this.rng() * (half - 5)) | 0), y = 3 + ((this.rng() * (half - 5)) | 0);
      for (const [px, py] of [[x, y], [W - 1 - x, H - 1 - y]]) rows[py][px] = 'C';
    }
    /* 10 punti di spawn distribuiti lungo il perimetro */
    const spots = [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3], [half, 2], [half, H - 3],
                   [2, half], [W - 3, half], [half - 6, 2], [half + 6, H - 3]];
    for (const [sx, sy] of spots) { rows[sy][sx] = '*'; }
    this.loadRows(rows.map(r => r.join('')));
    this.name = 'Isola della Sopravvivenza';
  }

  /* ---------- Parsing dei template in griglia runtime ---------- */
  loadRows(rows) {
    this.h = rows.length;
    this.w = rows[0].length;
    this.grid = new Uint8Array(this.w * this.h);
    const telePoints = [];

    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const c = rows[y][x] || '.';
        let t = T_EMPTY;
        const wx = (x + 0.5) * TILE, wy = (y + 0.5) * TILE;
        switch (c) {
          case '#': t = T_WALL; this.wallHp[x + ',' + y] = 2000; break;
          case 'X': t = T_ROCK; break;
          case 'b': t = T_BUSH; break;
          case 'w': t = T_WATER; break;
          case 'J': t = T_JUMP; this.jumpPads.push({ tx: x, ty: y }); break;
          case 'T': t = T_TELE; telePoints.push({ tx: x, ty: y }); break;
          case 'C': t = T_WALL; this.wallHp[x + ',' + y] = 1200; this.cubes.push({ tx: x, ty: y }); break;
          case '1': this.spawns[0].push({ x: wx, y: wy }); break;
          case '2': this.spawns[1].push({ x: wx, y: wy }); break;
          case '*': this.spawns.ffa.push({ x: wx, y: wy }); break;
          case 'G': this.center = { x: wx, y: wy }; break;
        }
        this.grid[y * this.w + x] = t;
      }
    }
    /* Collega i teletrasporti a coppie */
    for (let i = 0; i + 1 < telePoints.length; i += 2) {
      this.teleports.push([telePoints[i], telePoints[i + 1]]);
    }
    if (!this.center.x) this.center = { x: this.w * TILE / 2, y: this.h * TILE / 2 };
    this.pixelW = this.w * TILE;
    this.pixelH = this.h * TILE;
  }

  /* Dettagli estetici casuali del terreno (fili d'erba, sassolini) */
  buildDecor() {
    for (let i = 0; i < (this.w * this.h) / 14; i++) {
      this.decor.push({
        x: this.rng() * this.pixelW, y: this.rng() * this.pixelH,
        k: this.rng() < 0.5 ? 0 : 1, s: 2 + this.rng() * 3
      });
    }
  }

  /* ---------- Query griglia ---------- */
  tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return T_ROCK; // bordi solidi
    return this.grid[ty * this.w + tx];
  }
  tileAtWorld(x, y) { return this.tileAt((x / TILE) | 0, (y / TILE) | 0); }

  isSolid(t) { return t === T_WALL || t === T_ROCK || t === T_WATER; }
  blocksProjectile(t) { return t === T_WALL || t === T_ROCK; }
  isWalkable(tx, ty) { const t = this.tileAt(tx, ty); return !this.isSolid(t); }

  isBushAt(x, y) { return this.tileAtWorld(x, y) === T_BUSH; }

  /* ---------- Collisione cerchio vs griglia ----------
     Risolve il movimento per assi separati (scivolamento sui muri). */
  moveCircle(px, py, dx, dy, r) {
    let nx = px + dx;
    if (this.circleHits(nx, py, r)) nx = px;
    let ny = py + dy;
    if (this.circleHits(nx, ny, r)) ny = py;
    /* Confini mappa */
    nx = Util.clamp(nx, r, this.pixelW - r);
    ny = Util.clamp(ny, r, this.pixelH - r);
    return { x: nx, y: ny };
  }

  circleHits(x, y, r) {
    const x0 = ((x - r) / TILE) | 0, x1 = ((x + r) / TILE) | 0;
    const y0 = ((y - r) / TILE) | 0, y1 = ((y + r) / TILE) | 0;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.isSolid(this.tileAt(tx, ty))) continue;
        /* Punto più vicino del tile al centro del cerchio */
        const cx = Util.clamp(x, tx * TILE, (tx + 1) * TILE);
        const cy = Util.clamp(y, ty * TILE, (ty + 1) * TILE);
        if (Util.dist2(x, y, cx, cy) < r * r) return true;
      }
    }
    return false;
  }

  /* ---------- Distruzione ambientale ----------
     Ritorna true se un muro è stato abbattuto. */
  damageWall(tx, ty, dmg, game) {
    if (this.tileAt(tx, ty) !== T_WALL) return false;
    const key = tx + ',' + ty;
    this.wallHp[key] = (this.wallHp[key] || 2000) - dmg;
    if (this.wallHp[key] <= 0) {
      this.grid[ty * this.w + tx] = T_EMPTY;
      const wx = (tx + 0.5) * TILE, wy = (ty + 0.5) * TILE;
      if (game) {
        game.particles.wallBreak(wx, wy, '#b98a5a');
        AudioSys.sfx('wall');
        /* Le casse power-cube rilasciano un cubo */
        const ci = this.cubes.findIndex(c => c.tx === tx && c.ty === ty);
        if (ci >= 0) { this.cubes.splice(ci, 1); game.spawnPickup(wx, wy, 'cube'); }
      }
      return true;
    }
    return false;
  }

  /* Distrugge muri e cespugli in un raggio (usato dalle Super) */
  destroyArea(x, y, radius, game) {
    const x0 = ((x - radius) / TILE) | 0, x1 = ((x + radius) / TILE) | 0;
    const y0 = ((y - radius) / TILE) | 0, y1 = ((y + radius) / TILE) | 0;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const cx = (tx + 0.5) * TILE, cy = (ty + 0.5) * TILE;
        if (Util.dist(x, y, cx, cy) > radius + TILE / 2) continue;
        const t = this.tileAt(tx, ty);
        if (t === T_WALL) this.damageWall(tx, ty, 99999, game);
        else if (t === T_BUSH) {
          this.grid[ty * this.w + tx] = T_EMPTY;
          if (game) game.particles.burst(cx, cy, 5, { color: '#3a9a4a', maxSpeed: 80, life: 0.5 });
        }
      }
    }
  }

  /* Muro temporaneo di ghiaccio (gadget di Frost) */
  placeTempWall(tx, ty, dur, game) {
    if (this.tileAt(tx, ty) !== T_EMPTY) return;
    this.grid[ty * this.w + tx] = T_ROCK;
    setTimeout(() => {
      if (this.grid[ty * this.w + tx] === T_ROCK) this.grid[ty * this.w + tx] = T_EMPTY;
    }, dur * 1000);
  }

  /* ---------- Pathfinding A* sulla griglia ----------
     Ritorna una lista di waypoint mondo (max ~200 nodi esplorati
     per chiamata: i bot lo usano con parsimonia). */
  findPath(x0, y0, x1, y1) {
    const sx = (x0 / TILE) | 0, sy = (y0 / TILE) | 0;
    let ex = (x1 / TILE) | 0, ey = (y1 / TILE) | 0;
    if (!this.isWalkable(ex, ey)) {
      /* Se la destinazione è solida, cerca la cella libera più vicina */
      outer: for (let r = 1; r < 5; r++) {
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (this.isWalkable(ex + dx, ey + dy)) { ex += dx; ey += dy; break outer; }
        }
      }
    }
    const open = [{ x: sx, y: sy, g: 0, f: 0, parent: null }];
    const seen = new Set([sx + ',' + sy]);
    let iter = 0;
    while (open.length && iter++ < 400) {
      /* Estrae il nodo con f minore (lista piccola: scan lineare ok) */
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0];
      if (cur.x === ex && cur.y === ey) {
        const path = [];
        let n = cur;
        while (n) { path.unshift({ x: (n.x + 0.5) * TILE, y: (n.y + 0.5) * TILE }); n = n.parent; }
        return path;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const nx = cur.x + dx, ny = cur.y + dy;
        const key = nx + ',' + ny;
        if (seen.has(key) || !this.isWalkable(nx, ny)) continue;
        /* Evita di tagliare gli spigoli in diagonale */
        if (dx && dy && (!this.isWalkable(cur.x + dx, cur.y) || !this.isWalkable(cur.x, cur.y + dy))) continue;
        seen.add(key);
        const g = cur.g + ((dx && dy) ? 1.41 : 1);
        const h = Math.abs(ex - nx) + Math.abs(ey - ny);
        open.push({ x: nx, y: ny, g, f: g + h, parent: cur });
      }
    }
    return null; // nessun percorso trovato
  }

  /* Linea di vista tra due punti (per IA e mira automatica) */
  lineOfSight(x0, y0, x1, y1) {
    const steps = Math.ceil(Util.dist(x0, y0, x1, y1) / (TILE / 2));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const tile = this.tileAtWorld(Util.lerp(x0, x1, t), Util.lerp(y0, y1, t));
      if (this.blocksProjectile(tile)) return false;
    }
    return true;
  }

  /* ---------- Rendering ---------- */
  draw(ctx, cam, vw, vh) {
    this.time += 1 / 60;
    const x0 = Math.max(0, (cam.x / TILE) | 0);
    const y0 = Math.max(0, (cam.y / TILE) | 0);
    const x1 = Math.min(this.w - 1, ((cam.x + vw) / TILE) | 0);
    const y1 = Math.min(this.h - 1, ((cam.y + vh) / TILE) | 0);

    /* Terreno a scacchiera */
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const px = tx * TILE, py = ty * TILE;
        ctx.fillStyle = (tx + ty) % 2 === 0 ? '#8fd05f' : '#84c754';
        ctx.fillRect(px, py, TILE, TILE);
      }
    }
    /* Decorazioni del terreno */
    ctx.fillStyle = 'rgba(60,120,40,.5)';
    for (const d of this.decor) {
      if (d.x < cam.x - 10 || d.x > cam.x + vw + 10 || d.y < cam.y - 10 || d.y > cam.y + vh + 10) continue;
      if (d.k === 0) ctx.fillRect(d.x, d.y, 2, d.s + 2);
      else { ctx.beginPath(); ctx.arc(d.x, d.y, d.s * 0.6, 0, TAU); ctx.fill(); }
    }

    /* Tile solidi e speciali */
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = this.grid[ty * this.w + tx];
        if (t === T_EMPTY) continue;
        const px = tx * TILE, py = ty * TILE;
        switch (t) {
          case T_WALL: this.drawCrate(ctx, px, py, tx, ty); break;
          case T_ROCK: this.drawRock(ctx, px, py); break;
          case T_BUSH: this.drawBush(ctx, px, py, tx, ty); break;
          case T_WATER: this.drawWater(ctx, px, py, tx, ty); break;
          case T_JUMP: this.drawJumpPad(ctx, px, py); break;
          case T_TELE: this.drawTeleport(ctx, px, py); break;
        }
      }
    }
  }

  drawCrate(ctx, px, py, tx, ty) {
    const hp = this.wallHp[tx + ',' + ty] || 2000;
    const isCube = this.cubes.some(c => c.tx === tx && c.ty === ty);
    /* Faccia superiore con effetto profondità */
    ctx.fillStyle = isCube ? '#7a4ae0' : '#b98a5a';
    ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = isCube ? '#9a6af5' : '#d0a26e';
    ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 10);
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
    /* Crepe se danneggiata */
    if (hp < 1400) {
      ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px + 8, py + 6); ctx.lineTo(px + 16, py + 18); ctx.lineTo(px + 10, py + 28);
      ctx.stroke();
    }
    if (isCube) { ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('▣', px + TILE / 2, py + TILE / 2 + 5); }
  }

  drawRock(ctx, px, py) {
    ctx.fillStyle = '#7d8797';
    ctx.beginPath();
    ctx.moveTo(px + 4, py + TILE - 3);
    ctx.lineTo(px + 2, py + 14); ctx.lineTo(px + 12, py + 3);
    ctx.lineTo(px + TILE - 6, py + 5); ctx.lineTo(px + TILE - 2, py + 18);
    ctx.lineTo(px + TILE - 5, py + TILE - 3);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9aa5b5';
    ctx.beginPath();
    ctx.moveTo(px + 6, py + 14); ctx.lineTo(px + 13, py + 6); ctx.lineTo(px + 22, py + 8); ctx.lineTo(px + 18, py + 16);
    ctx.closePath(); ctx.fill();
  }

  drawBush(ctx, px, py, tx, ty) {
    const sway = Math.sin(this.time * 2 + tx * 1.7 + ty) * 1.5;
    ctx.fillStyle = '#3f9e3f';
    ctx.beginPath();
    ctx.arc(px + 10 + sway, py + 12, 10, 0, TAU);
    ctx.arc(px + 24 + sway, py + 10, 9, 0, TAU);
    ctx.arc(px + 18 + sway, py + 24, 11, 0, TAU);
    ctx.arc(px + 8 + sway, py + 26, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#54b854';
    ctx.beginPath();
    ctx.arc(px + 14 + sway, py + 14, 6, 0, TAU);
    ctx.arc(px + 22 + sway, py + 20, 5, 0, TAU);
    ctx.fill();
  }

  drawWater(ctx, px, py, tx, ty) {
    ctx.fillStyle = '#3a7bd5';
    ctx.fillRect(px, py, TILE, TILE);
    const wave = Math.sin(this.time * 2.4 + tx + ty * 0.7);
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.fillRect(px + 4 + wave * 3, py + 10, 12, 2);
    ctx.fillRect(px + 16 - wave * 3, py + 24, 14, 2);
  }

  drawJumpPad(ctx, px, py) {
    ctx.fillStyle = '#2a9a5a';
    ctx.beginPath(); ctx.arc(px + TILE / 2, py + TILE / 2, 14, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5ee08a';
    const b = Math.sin(this.time * 5) * 2;
    ctx.beginPath();
    ctx.moveTo(px + TILE / 2, py + 8 - b);
    ctx.lineTo(px + TILE / 2 + 8, py + 20 - b);
    ctx.lineTo(px + TILE / 2 - 8, py + 20 - b);
    ctx.closePath(); ctx.fill();
  }

  drawTeleport(ctx, px, py) {
    const a = this.time * 3;
    ctx.strokeStyle = '#c66eff';
    ctx.lineWidth = 3;
    for (let i = 0; i < 2; i++) {
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(a + i * 2);
      ctx.beginPath();
      ctx.arc(px + TILE / 2, py + TILE / 2, 7 + i * 6, a + i, a + i + 4.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
