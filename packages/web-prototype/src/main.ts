import { PLANTS, ZOMBIES, type LevelDefinition } from '@rootguard/shared';
import { CombatEngine, type CombatSnapshot, type MatchOutcome } from '@rootguard/game-core';

/**
 * Prototipo giocabile minimale: dimostra il CombatEngine (packages/game-core)
 * con una UI reale nel browser. La grafica è deliberatamente placeholder
 * (emoji + colori piatti): l'art direction cartoon 3D definitiva è descritta
 * in docs/gdd/11 e richiede una pipeline art/engine separata (doc 12/14).
 */

const CELL_PX = 56;
const GAP_PX = 2;
const STEP_PX = CELL_PX + GAP_PX;

const PLANT_EMOJI: Record<string, string> = {
  'girasole-solare': '🌻',
  'baccello-tiratore': '🫛',
  'muro-di-corteccia': '🌳',
  'patata-detonante': '🥔',
  'baccello-di-gelo': '🧊',
  'vite-spinata': '🌿',
  'cactus-tiratore': '🌵',
  'pepe-esplosivo': '🌶️',
};

const DECK_IDS = Object.keys(PLANT_EMOJI);

const ZOMBIE_EMOJI: Record<string, string> = {
  'marcito-comune': '🧟',
  'marcito-cappello-di-paglia': '🧟‍♂️',
  'marcito-saltatore': '🏃',
  'marcito-aerostato': '🎈',
  'marcito-corazza-piena': '🛡️',
  'marcito-colossale': '👹',
};

const WEATHER_LABEL: Record<string, string> = {
  Nessuno: '🌤️ Sereno',
  SoleCocente: '☀️ Sole Cocente',
  Pioggia: '🌧️ Pioggia',
  NebbiaSpore: '🌫️ Nebbia di Spore',
  Gelo: '❄️ Gelo',
  Vento: '💨 Vento',
};

function buildDemoLevel(): LevelDefinition {
  return {
    id: 'demo-giardini-sospesi',
    world: 1,
    name: 'Dimostrazione — Giardini Sospesi',
    objective: 'Sopravvivi a tutte le ondate',
    reserveSeeds: 1,
    terrainOverrides: [
      { lane: 1, column: 4, state: 'Bruciato' },
      { lane: 3, column: 6, state: 'Ghiacciato' },
    ],
    weatherTimeline: [
      { weather: 'Nessuno', startSecond: 0 },
      { weather: 'Pioggia', startSecond: 18 },
      { weather: 'Gelo', startSecond: 40 },
    ],
    waves: [
      {
        index: 0,
        isFinalWave: false,
        spawns: [
          { zombieId: 'marcito-comune', lane: 0, delaySeconds: 0 },
          { zombieId: 'marcito-comune', lane: 2, delaySeconds: 3 },
          { zombieId: 'marcito-comune', lane: 4, delaySeconds: 6 },
        ],
      },
      {
        index: 1,
        isFinalWave: false,
        spawns: [
          { zombieId: 'marcito-cappello-di-paglia', lane: 1, delaySeconds: 0 },
          { zombieId: 'marcito-cappello-di-paglia', lane: 3, delaySeconds: 3 },
          { zombieId: 'marcito-comune', lane: 2, delaySeconds: 5 },
        ],
      },
      {
        index: 2,
        isFinalWave: false,
        spawns: [
          { zombieId: 'marcito-saltatore', lane: 0, delaySeconds: 0 },
          { zombieId: 'marcito-aerostato', lane: 2, delaySeconds: 2 },
          { zombieId: 'marcito-saltatore', lane: 4, delaySeconds: 4 },
        ],
      },
      {
        index: 3,
        isFinalWave: true,
        spawns: [
          { zombieId: 'marcito-corazza-piena', lane: 1, delaySeconds: 0 },
          { zombieId: 'marcito-comune', lane: 0, delaySeconds: 1 },
          { zombieId: 'marcito-comune', lane: 4, delaySeconds: 1 },
          { zombieId: 'marcito-corazza-piena', lane: 3, delaySeconds: 3 },
          { zombieId: 'marcito-comune', lane: 2, delaySeconds: 5 },
        ],
      },
    ],
  };
}

const plantDefs = new Map(PLANTS.map((p) => [p.id, p]));
const zombieDefs = new Map(ZOMBIES.map((z) => [z.id, z]));

let engine!: CombatEngine;
let selectedCard: string | null = null;
let speedMultiplier = 1;
let knownZombieIds = new Set<string>();
let lastReserve = 0;
let lastOutcome: MatchOutcome = 'InProgress';
const logLines: string[] = [];

function pushLog(line: string) {
  logLines.unshift(line);
  logLines.splice(20);
  const logEl = document.getElementById('log');
  if (logEl) logEl.innerHTML = logLines.map((l) => `<div>${l}</div>`).join('');
}

function newGame() {
  const level = buildDemoLevel();
  engine = new CombatEngine(level, plantDefs, zombieDefs, Math.floor(Math.random() * 1e9), 200);
  selectedCard = null;
  knownZombieIds = new Set();
  lastReserve = level.reserveSeeds;
  lastOutcome = 'InProgress';
  logLines.length = 0;
  pushLog('🌱 Partita iniziata: difendi l’Arca Radice dalle ondate di Marciti!');
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.remove();
}

const app = document.getElementById('app')!;
app.innerHTML = `
  <h1>🌱 ROOTGUARD — Prototipo giocabile</h1>
  <div class="subtitle">Grafica placeholder (emoji/colori) — vedi docs/gdd/11 per l'art direction definitiva. Motore: packages/game-core/CombatEngine.ts.</div>
  <div class="hud">
    <div class="hud-stat"><span class="icon">💧</span><span id="sap">0</span> Linfa</div>
    <div class="hud-stat"><span class="icon">🛡️</span><span id="reserve">0</span> Semi di Riserva</div>
    <div class="hud-stat"><span class="icon">⏱️</span><span id="clock">0s</span></div>
    <div class="hud-stat" id="weather">🌤️ Sereno</div>
    <div class="hud-spacer"></div>
    <div class="speed-controls">
      <button data-speed="1" class="active">1x</button>
      <button data-speed="2">2x</button>
      <button data-speed="4">4x</button>
    </div>
    <button class="restart-btn" id="restart">↺ Riavvia</button>
  </div>
  <div class="card-bar" id="cardBar"></div>
  <div class="grid-wrapper" id="gridWrapper" style="width:${9 * STEP_PX + 16}px;">
    <div class="grid" id="grid" style="--cell:${CELL_PX}px;"></div>
  </div>
  <div class="log" id="log"></div>
  <div class="hint">Scegli una carta pianta, poi clicca su una casella della griglia per piazzarla. Le caselle colorate hanno terreno alterato (doc 03: Bruciato/Ghiacciato).</div>
`;

document.getElementById('restart')!.addEventListener('click', () => newGame());

for (const btn of Array.from(document.querySelectorAll<HTMLButtonElement>('.speed-controls button'))) {
  btn.addEventListener('click', () => {
    speedMultiplier = Number(btn.dataset.speed);
    for (const b of Array.from(document.querySelectorAll('.speed-controls button'))) {
      b.classList.toggle('active', b === btn);
    }
  });
}

// --- Griglia statica (le 45 tile) --------------------------------------
const gridEl = document.getElementById('grid')!;
function renderStaticTiles(snapshot: CombatSnapshot) {
  gridEl.querySelectorAll('.tile').forEach((el) => el.remove());
  for (let lane = 0; lane < snapshot.tiles.length; lane++) {
    for (let column = 0; column < snapshot.tiles[lane].length; column++) {
      const tile = snapshot.tiles[lane][column];
      const div = document.createElement('div');
      div.className = `tile ${tile.terrain} ${(lane + column) % 2 === 0 ? 'alt' : ''}`;
      div.dataset.lane = String(lane);
      div.dataset.column = String(column);
      div.style.gridColumn = String(column + 1);
      div.style.gridRow = String(lane + 1);
      div.addEventListener('click', () => onTileClick(lane, column));
      gridEl.appendChild(div);
    }
  }
}

function onTileClick(lane: number, column: number) {
  if (!selectedCard || engine.getSnapshot().outcome !== 'InProgress') return;
  const placed = engine.placePlant(selectedCard, { lane, column });
  if (placed) {
    pushLog(`🪴 Hai piantato ${plantDefs.get(selectedCard)!.name} in corsia ${lane + 1}, colonna ${column + 1}.`);
  }
}

// --- Barra delle carte ---------------------------------------------------
const cardBarEl = document.getElementById('cardBar')!;
function renderCardBar(snapshot: CombatSnapshot) {
  cardBarEl.innerHTML = '';
  for (const id of DECK_IDS) {
    const def = plantDefs.get(id)!;
    const recharge = engine.getCardRechargeRemainingSeconds(id);
    const affordable = snapshot.sap >= def.cost;
    const div = document.createElement('div');
    div.className = `plant-card ${selectedCard === id ? 'selected' : ''} ${!affordable || recharge > 0 ? 'disabled' : ''}`;
    div.innerHTML = `
      <div class="emoji">${PLANT_EMOJI[id]}</div>
      <div class="name">${def.name}</div>
      <div class="cost">💧${def.cost}</div>
      ${recharge > 0 ? `<div class="recharge-overlay" style="height:${Math.min(100, (recharge / def.rechargeSeconds) * 100)}%">${recharge.toFixed(0)}s</div>` : ''}
    `;
    div.addEventListener('click', () => {
      if (!affordable || recharge > 0) return;
      selectedCard = selectedCard === id ? null : id;
      renderCardBar(engine.getSnapshot());
    });
    cardBarEl.appendChild(div);
  }
}

// --- Entità (piante/nemici) ------------------------------------------------
function renderEntities(snapshot: CombatSnapshot) {
  gridEl.querySelectorAll('.entity').forEach((el) => el.remove());

  for (const plant of snapshot.plants) {
    const div = document.createElement('div');
    div.className = 'entity plant';
    div.style.left = `${plant.coord.column * STEP_PX}px`;
    div.style.top = `${plant.coord.lane * STEP_PX}px`;
    const hpPct = Math.max(0, (plant.currentHp / plant.maxHp) * 100);
    div.innerHTML = `
      <div class="emoji">${PLANT_EMOJI[plant.definitionId] ?? '🌱'}</div>
      <div class="hp-bar"><div class="hp-bar-fill" style="width:${hpPct}%"></div></div>
    `;
    gridEl.appendChild(div);
  }

  for (const zombie of snapshot.zombies) {
    const def = zombieDefs.get(zombie.definitionId)!;
    const div = document.createElement('div');
    div.className = 'entity zombie';
    div.style.left = `${zombie.position * STEP_PX}px`;
    div.style.top = `${zombie.lane * STEP_PX}px`;
    const hpPct = Math.max(0, (zombie.currentHp / def.hp) * 100);
    div.innerHTML = `
      <div class="emoji">${ZOMBIE_EMOJI[zombie.definitionId] ?? '🧟'}</div>
      <div class="hp-bar"><div class="hp-bar-fill" style="width:${hpPct}%"></div></div>
    `;
    gridEl.appendChild(div);
  }
}

function renderOverlayIfNeeded(snapshot: CombatSnapshot) {
  if (snapshot.outcome === 'InProgress') return;
  if (document.getElementById('overlay')) return;
  const wrapper = document.getElementById('gridWrapper')!;
  const overlay = document.createElement('div');
  overlay.id = 'overlay';
  overlay.className = 'overlay';
  overlay.innerHTML =
    snapshot.outcome === 'Victory'
      ? `<h2>🌸 Vittoria!</h2><div>L'Arca Radice è al sicuro. Norun approva (a modo suo).</div>`
      : `<h2>🍂 Sconfitta</h2><div>I Marciti hanno raggiunto l'Arca Radice. Riprova!</div>`;
  wrapper.appendChild(overlay);
}

function updateHud(snapshot: CombatSnapshot) {
  document.getElementById('sap')!.textContent = String(Math.floor(snapshot.sap));
  document.getElementById('reserve')!.textContent = String(snapshot.reserveSeedsLeft);
  document.getElementById('clock')!.textContent = `${Math.floor(snapshot.elapsedMs / 1000)}s`;
  document.getElementById('weather')!.textContent = WEATHER_LABEL[snapshot.currentWeather] ?? snapshot.currentWeather;
}

function trackEvents(snapshot: CombatSnapshot) {
  const currentIds = new Set(snapshot.zombies.map((z) => z.instanceId));
  for (const zombie of snapshot.zombies) {
    if (!knownZombieIds.has(zombie.instanceId)) {
      const def = zombieDefs.get(zombie.definitionId)!;
      pushLog(`⚠️ ${def.name} avanza sulla corsia ${zombie.lane + 1}!`);
    }
  }
  knownZombieIds = currentIds;

  if (snapshot.reserveSeedsLeft < lastReserve) {
    pushLog('🚨 Un Marcito ha raggiunto l’Arca! Consumato un Seme di Riserva.');
  }
  lastReserve = snapshot.reserveSeedsLeft;

  if (snapshot.outcome !== lastOutcome) {
    if (snapshot.outcome === 'Victory') pushLog('🌸 Vittoria! Tutte le ondate sono state respinte.');
    if (snapshot.outcome === 'Defeat') pushLog('🍂 Sconfitta: l’Arca Radice è stata raggiunta senza più Semi di Riserva.');
    lastOutcome = snapshot.outcome;
  }
}

function render(snapshot: CombatSnapshot) {
  updateHud(snapshot);
  renderCardBar(snapshot);
  renderEntities(snapshot);
  renderOverlayIfNeeded(snapshot);
}

// --- Game loop: un tick di simulazione ogni 100ms reali (doc 03/12) ------
newGame();
renderStaticTiles(engine.getSnapshot());
render(engine.getSnapshot());

setInterval(() => {
  let snapshot = engine.getSnapshot();
  for (let i = 0; i < speedMultiplier; i++) {
    if (snapshot.outcome !== 'InProgress') break;
    snapshot = engine.step();
    trackEvents(snapshot);
  }
  render(snapshot);
}, 100);
