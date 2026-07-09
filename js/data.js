/* ============================================================
   data.js — Database di gioco.
   Brawler, classi, statistiche, abilità, gadget, hypercharge,
   skin, emote, modalità, missioni, negozio e battle pass.
   Tutti i valori di bilanciamento vivono qui.
   ============================================================ */
'use strict';

/* ------------------------------------------------------------
   BRAWLER — 12 personaggi originali.
   Unità: hp = punti vita, speed = px/sec, range = px,
   damage = danno per proiettile, reload = sec per ricarica ammo.
   superCharge = danno da infliggere per caricare la Super.
   ------------------------------------------------------------ */
const BRAWLERS = [
  {
    id: 'bolt', name: 'BOLT', cls: 'Danno', color: '#ffb400', dark: '#8a5f00',
    desc: 'Pistolero elettrico veloce e affidabile. Ottimo per iniziare.',
    hp: 3800, speed: 100, unlockTrophies: 0,
    attack: { name: 'Raffica Volt', desc: '3 colpi rapidi a media distanza.',
      type: 'burst', count: 3, interval: 0.09, damage: 560, range: 230, speed: 480, radius: 6, spread: 0.05, reload: 1.5, ammo: 3 },
    super: { name: 'Tempesta di razzi', desc: 'Lancia 6 razzi esplosivi ad area.',
      type: 'barrage', count: 6, damage: 480, radius: 42, range: 260, charge: 3400 },
    gadget: { name: 'Scatto Ionico', desc: 'Scatta rapidamente in avanti.', type: 'dash', uses: 3, power: 90 },
    hyper: { name: 'Supercarica', desc: 'I colpi base perforano i nemici per 8s.', type: 'pierce', dur: 8, charge: 3 },
    emotes: ['⚡', '😎', '💥', 'GG!'],
    skins: [{ id: 'def', name: 'Classico', color: '#ffb400' },
            { id: 'neon', name: 'Bolt Neon', color: '#26d9ff', price: 500 },
            { id: 'oro', name: 'Bolt Dorato', color: '#ffe14d', price: 1200 }]
  },
  {
    id: 'titan', name: 'TITAN', cls: 'Tank', color: '#e04a4a', dark: '#7a1f1f',
    desc: 'Colosso corazzato che domina la mischia con il suo fucile a canne mozze.',
    hp: 6800, speed: 88, unlockTrophies: 30,
    attack: { name: 'Doppietta', desc: 'Rosata di 5 pallettoni a corto raggio.',
      type: 'spread', count: 5, damage: 340, range: 130, speed: 460, radius: 6, spread: 0.5, reload: 1.7, ammo: 3 },
    super: { name: 'Carica Sismica', desc: 'Carica in avanti travolgendo e respingendo i nemici.',
      type: 'charge', damage: 900, range: 190, knockback: 70, charge: 3800 },
    gadget: { name: 'Piastra d\'Acciaio', desc: 'Scudo che assorbe il 40% dei danni per 4s.', type: 'shield', uses: 3, power: 0.4, dur: 4 },
    hyper: { name: 'Furia del Colosso', desc: 'La Super infligge +50% danni e ti cura del danno inflitto.', type: 'superboost', dur: 10, charge: 3 },
    emotes: ['💪', '😤', '🛡️', 'BOOM'],
    skins: [{ id: 'def', name: 'Classico', color: '#e04a4a' },
            { id: 'notte', name: 'Titan Ombra', color: '#5a4ae0', price: 500 }]
  },
  {
    id: 'hawk', name: 'HAWK', cls: 'Cecchino', color: '#4ae06e', dark: '#1d7a36',
    desc: 'Tiratrice scelta: più il bersaglio è lontano, più fa male.',
    hp: 3200, speed: 94, unlockTrophies: 80,
    attack: { name: 'Colpo di Precisione', desc: 'Proiettile lungo: danno crescente con la distanza.',
      type: 'single', count: 1, damage: 780, range: 340, speed: 640, radius: 5, spread: 0, reload: 1.9, ammo: 3, farBonus: 1.6 },
    super: { name: 'Proiettile Perforante', desc: 'Colpo che attraversa nemici e muri.',
      type: 'railgun', damage: 1800, range: 460, charge: 3200 },
    gadget: { name: 'Drone Spia', desc: 'Rivela i nemici nei cespugli per 5s.', type: 'reveal', uses: 3, dur: 5 },
    hyper: { name: 'Occhio di Falco', desc: 'Per 8s i colpi base rallentano i nemici.', type: 'attackslow', dur: 8, charge: 3 },
    emotes: ['🎯', '🦅', '😏', 'HEADSHOT'],
    skins: [{ id: 'def', name: 'Classico', color: '#4ae06e' },
            { id: 'artico', name: 'Hawk Artico', color: '#bfe9ff', price: 500 }]
  },
  {
    id: 'meda', name: 'MEDA', cls: 'Supporto', color: '#ff7ad9', dark: '#96307c',
    desc: 'Medica da campo: i suoi dardi curano gli alleati e feriscono i nemici.',
    hp: 4200, speed: 96, unlockTrophies: 150,
    attack: { name: 'Dardo Vitale', desc: 'Cura gli alleati colpiti (60% del danno) e danneggia i nemici.',
      type: 'single', count: 1, damage: 620, range: 240, speed: 500, radius: 7, spread: 0, reload: 1.4, ammo: 3, healAlly: 0.6 },
    super: { name: 'Zona Rigenerante', desc: 'Crea un\'area che cura gli alleati per 5s.',
      type: 'healzone', heal: 400, radius: 90, dur: 5, charge: 3000 },
    gadget: { name: 'Adrenalina', desc: 'Cura istantaneamente 1200 PS a te stessa.', type: 'selfheal', uses: 3, power: 1200 },
    hyper: { name: 'Triage Totale', desc: 'La Zona Rigenerante dà anche uno scudo del 25%.', type: 'zoneshield', dur: 10, charge: 3 },
    emotes: ['💊', '💖', '✨', 'CURATI!'],
    skins: [{ id: 'def', name: 'Classico', color: '#ff7ad9' },
            { id: 'lime', name: 'Meda Lime', color: '#b6ff5e', price: 500 }]
  },
  {
    id: 'shade', name: 'SHADE', cls: 'Assassino', color: '#8a5ae0', dark: '#3f2278',
    desc: 'Lama silenziosa: appare, colpisce, svanisce.',
    hp: 4600, speed: 118, unlockTrophies: 250,
    attack: { name: 'Doppio Taglio', desc: 'Due fendenti ravvicinati molto rapidi.',
      type: 'melee', count: 2, interval: 0.12, damage: 700, range: 62, arc: 1.5, reload: 1.1, ammo: 3 },
    super: { name: 'Passo d\'Ombra', desc: 'Si teletrasporta sul nemico più vicino colpendolo.',
      type: 'blink', damage: 1100, range: 240, charge: 3600 },
    gadget: { name: 'Manto Oscuro', desc: 'Invisibile per 3s (attaccare ti rivela).', type: 'stealth', uses: 3, dur: 3 },
    hyper: { name: 'Danza Letale', desc: 'Se la Super elimina un nemico, si ricarica subito.', type: 'superreset', dur: 12, charge: 3 },
    emotes: ['🗡️', '👻', '🌑', '...'],
    skins: [{ id: 'def', name: 'Classico', color: '#8a5ae0' },
            { id: 'rosso', name: 'Shade Cremisi', color: '#e04a6e', price: 500 }]
  },
  {
    id: 'bomber', name: 'BOMBER', cls: 'Lanciatore', color: '#ff8c3a', dark: '#8f4a12',
    desc: 'Artificiere pazzo: lancia bombe oltre i muri.',
    hp: 3400, speed: 92, unlockTrophies: 400,
    attack: { name: 'Granata a Parabola', desc: 'Bomba che scavalca i muri ed esplode ad area.',
      type: 'lob', count: 1, damage: 760, range: 250, speed: 300, radius: 40, reload: 1.8, ammo: 3 },
    super: { name: 'Tappeto di Bombe', desc: 'Bombarda un\'ampia area con 8 cariche.',
      type: 'carpet', count: 8, damage: 520, radius: 46, range: 280, charge: 3400 },
    gadget: { name: 'Mina Sorpresa', desc: 'Piazza una mina invisibile ai tuoi piedi.', type: 'mine', uses: 3, power: 1300 },
    hyper: { name: 'Grande Botto', desc: 'Bombe con raggio +40% e rallentano per 8s.', type: 'bigblast', dur: 8, charge: 3 },
    emotes: ['💣', '🔥', '🤪', 'KABOOM'],
    skins: [{ id: 'def', name: 'Classico', color: '#ff8c3a' },
            { id: 'tossico', name: 'Bomber Tossico', color: '#8cff3a', price: 500 }]
  },
  {
    id: 'frost', name: 'FROST', cls: 'Controllo', color: '#6ec6ff', dark: '#2a6a96',
    desc: 'Regina del ghiaccio: rallenta, congela e controlla il campo.',
    hp: 4000, speed: 94, unlockTrophies: 600,
    attack: { name: 'Scheggia Gelida', desc: 'Cristallo che danneggia e rallenta per 1.5s.',
      type: 'single', count: 1, damage: 580, range: 220, speed: 440, radius: 7, spread: 0, reload: 1.5, ammo: 3, slow: 1.5 },
    super: { name: 'Zero Assoluto', desc: 'Zona ghiacciata che rallenta fortemente i nemici per 4s.',
      type: 'frostzone', damage: 300, radius: 100, dur: 4, charge: 3200 },
    gadget: { name: 'Muro di Ghiaccio', desc: 'Crea un muro di ghiaccio davanti a te per 5s.', type: 'icewall', uses: 3, dur: 5 },
    hyper: { name: 'Inverno Eterno', desc: 'Zero Assoluto congela (blocca) i nemici per 1.5s.', type: 'zoneroot', dur: 10, charge: 3 },
    emotes: ['❄️', '🥶', '💙', 'BRRR'],
    skins: [{ id: 'def', name: 'Classico', color: '#6ec6ff' },
            { id: 'viola', name: 'Frost Boreale', color: '#c66eff', price: 500 }]
  },
  {
    id: 'volt', name: 'VOLT', cls: 'Danno', color: '#f5e642', dark: '#8a8010',
    desc: 'Scienziato folle: i suoi fulmini rimbalzano di nemico in nemico.',
    hp: 3600, speed: 98, unlockTrophies: 850,
    attack: { name: 'Arco Voltaico', desc: 'Fulmine che rimbalza fino a 2 nemici vicini.',
      type: 'single', count: 1, damage: 640, range: 210, speed: 520, radius: 6, spread: 0, reload: 1.6, ammo: 3, chain: 2 },
    super: { name: 'Nube Tempesta', desc: 'Nuvola elettrica che ti segue e fulmina i nemici per 6s.',
      type: 'stormcloud', damage: 350, radius: 110, dur: 6, charge: 3400 },
    gadget: { name: 'Sovraccarico', desc: 'Il prossimo attacco infligge +100% danni.', type: 'overcharge', uses: 3, power: 2 },
    hyper: { name: 'Megawatt', desc: 'I fulmini rimbalzano su 2 nemici extra per 8s.', type: 'chainplus', dur: 8, charge: 3 },
    emotes: ['⚡', '🧪', '🤓', 'ZAP!'],
    skins: [{ id: 'def', name: 'Classico', color: '#f5e642' },
            { id: 'plasma', name: 'Volt Plasma', color: '#ff42f5', price: 500 }]
  },
  {
    id: 'rook', name: 'ROOK', cls: 'Tank', color: '#a8b0c0', dark: '#4e5666',
    desc: 'Guardiano di pietra con un martello che spacca la terra.',
    hp: 7200, speed: 84, unlockTrophies: 1100,
    attack: { name: 'Martellata', desc: 'Ampio colpo ad arco in mischia.',
      type: 'melee', count: 1, damage: 1150, range: 72, arc: 2.2, reload: 1.6, ammo: 3 },
    super: { name: 'Terremoto', desc: 'Onda d\'urto circolare che danneggia e respinge.',
      type: 'quake', damage: 1000, radius: 130, knockback: 60, charge: 4200 },
    gadget: { name: 'Presidio', desc: 'Scudo 50% ma resti fermo per 2s.', type: 'fortify', uses: 3, power: 0.5, dur: 2 },
    hyper: { name: 'Faglia', desc: 'Il Terremoto stordisce i nemici per 1.2s.', type: 'quakestun', dur: 10, charge: 3 },
    emotes: ['🔨', '🗿', '😠', 'SMASH'],
    skins: [{ id: 'def', name: 'Classico', color: '#a8b0c0' },
            { id: 'lava', name: 'Rook Magma', color: '#ff6a3a', price: 500 }]
  },
  {
    id: 'wisp', name: 'WISP', cls: 'Supporto', color: '#42f5c8', dark: '#0f8a6a',
    desc: 'Spirito del bosco: il suo boomerang attraversa i nemici e torna indietro.',
    hp: 3800, speed: 100, unlockTrophies: 1400,
    attack: { name: 'Boomerang Spirituale', desc: 'Perfora i nemici e ritorna colpendo di nuovo.',
      type: 'boomerang', count: 1, damage: 540, range: 240, speed: 420, radius: 8, reload: 1.5, ammo: 3 },
    super: { name: 'Totem Ancestrale', desc: 'Totem che cura e velocizza gli alleati vicini per 8s.',
      type: 'totem', heal: 300, radius: 110, dur: 8, charge: 3200 },
    gadget: { name: 'Vento Favorevole', desc: '+30% velocità a te e agli alleati vicini per 4s.', type: 'haste', uses: 3, power: 0.3, dur: 4 },
    hyper: { name: 'Ira della Foresta', desc: 'Il Totem danneggia anche i nemici vicini.', type: 'totemdmg', dur: 12, charge: 3 },
    emotes: ['🍃', '🌀', '😌', 'ZEN'],
    skins: [{ id: 'def', name: 'Classico', color: '#42f5c8' },
            { id: 'spettro', name: 'Wisp Spettro', color: '#c8c8ff', price: 500 }]
  },
  {
    id: 'fang', name: 'FANG', cls: 'Cecchino', color: '#c8f542', dark: '#6a8a10',
    desc: 'Arciera della giungla: le sue frecce infilzano intere squadre.',
    hp: 3400, speed: 96, unlockTrophies: 1800,
    attack: { name: 'Freccia Perforante', desc: 'Freccia lunga che attraversa tutti i nemici.',
      type: 'single', count: 1, damage: 680, range: 300, speed: 560, radius: 5, spread: 0, reload: 1.8, ammo: 3, pierceUnits: true },
    super: { name: 'Pioggia di Frecce', desc: '12 frecce cadono su un\'ampia area.',
      type: 'arrowrain', count: 12, damage: 380, radius: 30, range: 300, zoneRadius: 110, charge: 3300 },
    gadget: { name: 'Trappola di Rovi', desc: 'Piazza una trappola che immobilizza il primo nemico.', type: 'trap', uses: 3, dur: 1.5, power: 600 },
    hyper: { name: 'Punte Avvelenate', desc: 'Le frecce avvelenano (danno nel tempo) per 8s.', type: 'poison', dur: 8, charge: 3 },
    emotes: ['🏹', '🐍', '😼', 'BULLSEYE'],
    skins: [{ id: 'def', name: 'Classico', color: '#c8f542' },
            { id: 'regale', name: 'Fang Regale', color: '#f5b942', price: 500 }]
  },
  {
    id: 'blaze', name: 'BLAZE', cls: 'Danno', color: '#ff5a3a', dark: '#96280f',
    desc: 'Piromane con lanciafiamme: brucia tutto ciò che tocca.',
    hp: 4400, speed: 102, unlockTrophies: 2300,
    attack: { name: 'Getto Infuocato', desc: 'Cono di fuoco continuo a corto raggio.',
      type: 'cone', count: 4, interval: 0.05, damage: 260, range: 140, speed: 340, radius: 10, spread: 0.4, reload: 1.3, ammo: 3, burn: 200 },
    super: { name: 'Scia Ardente', desc: 'Scatto che lascia una scia di fiamme per 4s.',
      type: 'firedash', damage: 400, range: 220, dur: 4, charge: 3500 },
    gadget: { name: 'Nova di Fuoco', desc: 'Esplosione di fiamme attorno a te.', type: 'nova', uses: 3, power: 900, radius: 100 },
    hyper: { name: 'Inferno', desc: 'La scia è più larga e ti cura mentre bruci i nemici.', type: 'infernoheal', dur: 10, charge: 3 },
    emotes: ['🔥', '😈', '🌶️', 'BURN!'],
    skins: [{ id: 'def', name: 'Classico', color: '#ff5a3a' },
            { id: 'blu', name: 'Blaze Blu', color: '#3a8cff', price: 500 }]
  }
];

/* Mappa id -> definizione per accesso rapido */
const BRAWLER_BY_ID = {};
BRAWLERS.forEach(b => BRAWLER_BY_ID[b.id] = b);

/* Moltiplicatori di statistiche per livello (1-11) */
function statMult(level) { return 1 + (level - 1) * 0.05; }

/* Costo (monete, punti potere) per salire di livello */
const UPGRADE_COST = [0, 20, 35, 75, 140, 290, 480, 800, 1250, 1875, 2800];

/* ------------------------------------------------------------
   MODALITÀ DI GIOCO
   ------------------------------------------------------------ */
const MODES = [
  { id: 'gemgrab',  name: 'Gem Grab',      icon: '💎', team: '3v3',
    desc: 'Raccogli 10 gemme e difendile per 15 secondi per vincere.' },
  { id: 'showdown', name: 'Showdown Solo', icon: '💀', team: 'ffa',
    desc: 'Battle royale a 10: sii l\'ultimo in piedi. Il gas avanza!' },
  { id: 'duo',      name: 'Showdown Duo',  icon: '💀', team: 'duo',
    desc: 'Battle royale in coppia: 5 squadre da 2, vince l\'ultima.' },
  { id: 'brawlball', name: 'Brawl Ball',   icon: '⚽', team: '3v3',
    desc: 'Segna 2 gol nella porta avversaria. Le Super spaccano i muri!' },
  { id: 'heist',    name: 'Rapina',        icon: '💰', team: '3v3',
    desc: 'Distruggi la cassaforte nemica proteggendo la tua.' },
  { id: 'knockout', name: 'Knockout',      icon: '🥊', team: '3v3',
    desc: 'Niente respawn: vinci 2 round eliminando la squadra nemica.' },
  { id: 'hotzone',  name: 'Zona Calda',    icon: '🔥', team: '3v3',
    desc: 'Controlla la zona centrale fino a riempire la barra al 100%.' },
  { id: 'bounty',   name: 'Taglia',        icon: '⭐', team: '3v3',
    desc: 'Ogni eliminazione vale stelle. Chi ne ha di più allo scadere vince.' },
  { id: 'bossfight', name: 'Boss Fight',   icon: '🤖', team: 'coop',
    desc: 'In 3 contro un boss robotico gigante. Sopravvivete e abbattetelo!' }
];
const MODE_BY_ID = {};
MODES.forEach(m => MODE_BY_ID[m.id] = m);

/* ------------------------------------------------------------
   MISSIONI — template per generare giornaliere/settimanali
   ------------------------------------------------------------ */
const QUEST_TEMPLATES = [
  { id: 'play',   name: 'Gioca {n} partite',            icon: '🎮', stat: 'matches',  daily: 3,  weekly: 15, reward: 40 },
  { id: 'win',    name: 'Vinci {n} partite',            icon: '🏅', stat: 'wins',     daily: 2,  weekly: 8,  reward: 60 },
  { id: 'kill',   name: 'Elimina {n} avversari',        icon: '⚔️', stat: 'kills',    daily: 8,  weekly: 40, reward: 50 },
  { id: 'damage', name: 'Infliggi {n} danni',           icon: '💥', stat: 'damage',   daily: 30000, weekly: 150000, reward: 50 },
  { id: 'gems',   name: 'Raccogli {n} gemme',           icon: '💎', stat: 'gems',     daily: 10, weekly: 40, reward: 45 },
  { id: 'super',  name: 'Usa {n} Super',                icon: '🌟', stat: 'supers',   daily: 5,  weekly: 25, reward: 40 }
];

/* ------------------------------------------------------------
   NEGOZIO
   ------------------------------------------------------------ */
const SHOP_ITEMS = [
  { id: 'coins_s',  name: 'Sacco di Monete',  icon: '🪙', desc: '+300 monete',      priceGems: 30,  give: { coins: 300 } },
  { id: 'coins_m',  name: 'Forziere Monete',  icon: '💰', desc: '+800 monete',      priceGems: 70,  give: { coins: 800 } },
  { id: 'pp_s',     name: 'Punti Potere',     icon: '⚡', desc: '+100 punti potere', priceCoins: 200, give: { pp: 100 } },
  { id: 'pp_m',     name: 'Mega Punti Potere', icon: '🔋', desc: '+350 punti potere', priceCoins: 600, give: { pp: 350 } },
  { id: 'box',      name: 'Nova Box',         icon: '📦', desc: 'Ricompensa casuale!', priceCoins: 150, give: { random: true } },
  { id: 'gems_d',   name: 'Gemme Giornaliere', icon: '💎', desc: '+15 gemme (1/giorno)', priceCoins: 0, give: { gems: 15 }, daily: true }
];

/* ------------------------------------------------------------
   NOVA PASS — 30 tier, 1 tier ogni 100 punti missione
   ------------------------------------------------------------ */
const PASS_TIERS = [];
for (let i = 1; i <= 30; i++) {
  let reward;
  if (i === 30)      reward = { skinToken: true, label: 'Skin Esclusiva', icon: '👑' };
  else if (i % 10 === 0) reward = { gems: 30, label: '30 Gemme', icon: '💎' };
  else if (i % 5 === 0)  reward = { pp: 150, label: '150 Punti Potere', icon: '⚡' };
  else if (i % 2 === 0)  reward = { coins: 120, label: '120 Monete', icon: '🪙' };
  else               reward = { coins: 60, label: '60 Monete', icon: '🪙' };
  PASS_TIERS.push(reward);
}
const PASS_POINTS_PER_TIER = 100;

/* Nomi bot per riempire le partite */
const BOT_NAMES = ['Rex', 'Luna', 'Pixel', 'Dash', 'Kiwi', 'Nero', 'Vega', 'Momo',
  'Zippy', 'Faye', 'Gizmo', 'Twist', 'Echo', 'Rocco', 'Skye', 'Bruno', 'Nyx', 'Taco'];

/* Colori squadra */
const TEAM_COLORS = { 0: '#26d9ff', 1: '#ff4a5e', ffa: '#ffe14d' };
