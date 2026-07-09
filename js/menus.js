/* ============================================================
   menus.js — Interfaccia utente DOM.
   Home/lobby, selezione modalità e brawler, negozio, missioni,
   Nova Pass, classifica, profilo, impostazioni, risultati.
   ============================================================ */
'use strict';

const Menus = {
  current: 'home',

  init() {
    /* Navigazione con data-nav */
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => {
        AudioSys.init();
        AudioSys.sfx('ui');
        this.show(el.dataset.nav);
      });
    });
    document.getElementById('btn-play').addEventListener('click', () => {
      AudioSys.init();
      this.startMatch();
    });
    document.getElementById('btn-results-ok').addEventListener('click', () => {
      AudioSys.sfx('ui');
      this.show('home');
    });
    this.show('home');
  },

  /* Mostra una schermata e nasconde le altre */
  show(name) {
    this.current = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const el = document.getElementById('screen-' + name);
    if (el) el.classList.remove('hidden');
    document.getElementById('ui-root').style.display = '';
    AudioSys.music('menu');

    switch (name) {
      case 'home': this.renderHome(); break;
      case 'modes': this.renderModes(); break;
      case 'brawlers': this.renderBrawlers(); break;
      case 'shop': this.renderShop(); break;
      case 'quests': this.renderQuests(); break;
      case 'pass': this.renderPass(); break;
      case 'ranking': this.renderRanking(); break;
      case 'profile': this.renderProfile(); break;
      case 'settings': this.renderSettings(); break;
    }
  },

  toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.classList.remove('show'), 2200);
  },

  /* ---------- Ritratto di un brawler su canvas ---------- */
  drawPortrait(canvas, def, color) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.34;
    /* Aura */
    const aura = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.5);
    aura.addColorStop(0, color + '55');
    aura.addColorStop(1, 'transparent');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, w, h);
    /* Ombra */
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(cx, cy + r * 1.15, r * 0.9, r * 0.25, 0, 0, TAU); ctx.fill();
    /* Corpo */
    const g = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.5, 4, cx, cy, r * 1.1);
    g.addColorStop(0, Util.shade(color, 0.4));
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    /* Occhi */
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - r * 0.32, cy - r * 0.15, r * 0.22, 0, TAU);
    ctx.arc(cx + r * 0.32, cy - r * 0.15, r * 0.22, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(cx - r * 0.28, cy - r * 0.12, r * 0.1, 0, TAU);
    ctx.arc(cx + r * 0.36, cy - r * 0.12, r * 0.1, 0, TAU);
    ctx.fill();
    /* Sorriso */
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = r * 0.08;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.25, r * 0.3, 0.25, Math.PI - 0.25);
    ctx.stroke();
  },

  /* ---------- Home ---------- */
  renderHome() {
    const s = Save.state;
    document.getElementById('home-name').textContent = s.name;
    document.getElementById('home-level').textContent = 'Lv ' + s.level;
    document.getElementById('home-xpfill').style.width =
      Math.round(s.xp / Save.xpForLevel(s.level) * 100) + '%';
    document.getElementById('home-trophies').textContent = Util.fmt(Save.totalTrophies());
    document.getElementById('home-coins').textContent = Util.fmt(s.coins);
    document.getElementById('home-gems').textContent = Util.fmt(s.gems);

    const def = BRAWLER_BY_ID[s.selectedBrawler];
    const bs = Save.brawlerState(s.selectedBrawler);
    const skin = def.skins.find(k => k.id === bs.skin) || def.skins[0];
    document.getElementById('home-brawler-name').textContent = def.name;
    this.drawPortrait(document.getElementById('home-portrait'), def, skin.color);

    const mode = MODE_BY_ID[s.selectedMode];
    document.getElementById('home-mode-ico').textContent = mode.icon;
    document.getElementById('home-mode-name').textContent = mode.name;
  },

  /* ---------- Modalità ---------- */
  renderModes() {
    const list = document.getElementById('modes-list');
    list.innerHTML = '';
    for (const m of MODES) {
      const btn = document.createElement('button');
      btn.className = 'mode-card' + (m.id === Save.state.selectedMode ? ' active' : '');
      btn.innerHTML = `<span class="mc-ico">${m.icon}</span>
        <span><div class="mc-name">${m.name}</div><div class="mc-desc">${m.desc}</div></span>`;
      btn.addEventListener('click', () => {
        Save.state.selectedMode = m.id;
        Save.save();
        AudioSys.sfx('ui');
        this.show('home');
      });
      list.appendChild(btn);
    }
  },

  /* ---------- Collezione brawler ---------- */
  renderBrawlers() {
    const grid = document.getElementById('brawlers-grid');
    grid.innerHTML = '';
    for (const def of BRAWLERS) {
      const unlocked = Save.isUnlocked(def.id);
      const bs = Save.brawlerState(def.id);
      const card = document.createElement('div');
      card.className = 'brawler-card' + (unlocked ? '' : ' locked') +
        (def.id === Save.state.selectedBrawler ? ' selected' : '');
      const cv = document.createElement('canvas');
      cv.width = 80; cv.height = 80;
      card.appendChild(cv);
      const skin = def.skins.find(k => k.id === bs.skin) || def.skins[0];
      this.drawPortrait(cv, def, skin.color);
      card.insertAdjacentHTML('beforeend',
        `<div class="bc-name">${def.name}</div>
         <div class="bc-class">${def.cls} · Lv ${bs.level}</div>
         <div class="bc-trophies">🏆 ${bs.trophies}</div>
         ${unlocked ? '' : `<div class="bc-lock">🔒 ${def.unlockTrophies}🏆</div>`}`);
      card.addEventListener('click', () => {
        AudioSys.sfx('ui');
        if (!unlocked) { this.toast(`Sblocchi ${def.name} a ${def.unlockTrophies} trofei totali!`); return; }
        this.showBrawlerDetail(def.id);
      });
      grid.appendChild(card);
    }
  },

  showBrawlerDetail(id) {
    this._detailId = id;
    const def = BRAWLER_BY_ID[id];
    const bs = Save.brawlerState(id);
    this.show('brawler-detail');
    document.getElementById('bd-name').textContent = `${def.name} — ${def.cls}`;
    const skin = def.skins.find(k => k.id === bs.skin) || def.skins[0];
    this.drawPortrait(document.getElementById('bd-portrait'), def, skin.color);

    const m = statMult(bs.level);
    document.getElementById('bd-stats').innerHTML = `
      <div class="stat-box">Salute<b>${Math.round(def.hp * m)}</b></div>
      <div class="stat-box">Danno<b>${Math.round(def.attack.damage * m)}</b></div>
      <div class="stat-box">Velocità<b>${def.speed}</b></div>
      <div class="stat-box">Livello<b>${bs.level}/11</b></div>
      <div class="stat-box">Trofei<b>${bs.trophies}</b></div>`;

    document.getElementById('bd-abilities').innerHTML = `
      <div class="ability-row"><div class="ab-ico">⚔️</div><div>
        <div class="ab-name">${def.attack.name}</div><div class="ab-desc">${def.attack.desc}</div></div></div>
      <div class="ability-row"><div class="ab-ico">🌟</div><div>
        <div class="ab-name">${def.super.name} (Super)</div><div class="ab-desc">${def.super.desc}</div></div></div>
      <div class="ability-row"><div class="ab-ico">🔧</div><div>
        <div class="ab-name">${def.gadget.name} (Gadget)</div><div class="ab-desc">${def.gadget.desc}</div></div></div>
      <div class="ability-row"><div class="ab-ico">⚡</div><div>
        <div class="ab-name">${def.hyper.name} (Hypercharge)</div><div class="ab-desc">${def.hyper.desc}</div></div></div>
      <div class="ability-row"><div class="ab-ico">📖</div><div>
        <div class="ab-desc">${def.desc}</div></div></div>`;

    /* Skin */
    const skins = document.getElementById('bd-skins');
    skins.innerHTML = '';
    for (const sk of def.skins) {
      const chip = document.createElement('button');
      const owned = bs.skins.includes(sk.id);
      chip.className = 'skin-chip' + (owned ? ' owned' : '') + (bs.skin === sk.id ? ' active' : '');
      chip.textContent = sk.name + (owned ? '' : ` — 🪙${sk.price}`);
      chip.addEventListener('click', () => {
        const r = Save.buySkin(id, sk.id);
        this.toast(r.msg);
        if (r.ok) { AudioSys.sfx('buy'); this.showBrawlerDetail(id); }
      });
      skins.appendChild(chip);
    }

    /* Azioni */
    const up = document.getElementById('bd-upgrade');
    const cost = bs.level < 11 ? UPGRADE_COST[bs.level] : null;
    up.textContent = cost ? `POTENZIA (${cost}⚡ + ${cost}🪙)` : 'LIVELLO MAX';
    up.disabled = !cost;
    up.onclick = () => {
      const r = Save.upgradeBrawler(id);
      this.toast(r.msg);
      if (r.ok) { AudioSys.sfx('buy'); this.showBrawlerDetail(id); }
    };
    document.getElementById('bd-select').onclick = () => {
      Save.state.selectedBrawler = id;
      Save.save();
      AudioSys.sfx('ui');
      this.show('home');
    };
  },

  /* ---------- Negozio ---------- */
  renderShop() {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    const day = Math.floor(Date.now() / 86400000);
    for (const item of SHOP_ITEMS) {
      const card = document.createElement('div');
      const soldOut = (item.daily && Save.state.shopDaily === day) ||
                      (!item.daily && Save.state.shopBought.includes(item.id) && item.give.random !== true);
      card.className = 'shop-card' + (soldOut ? ' bought' : '');
      const price = item.priceGems ? `💎 ${item.priceGems}` : item.priceCoins ? `🪙 ${item.priceCoins}` : 'GRATIS';
      card.innerHTML = `<div class="sc-ico">${item.icon}</div>
        <div class="sc-name">${item.name}</div>
        <div class="sc-desc" style="font-size:11px;opacity:.7">${item.desc}</div>
        <div class="sc-price">${soldOut ? 'RISCATTATO' : price}</div>`;
      card.addEventListener('click', () => {
        if (soldOut) { this.toast('Torna domani!'); return; }
        this.buyItem(item, day);
      });
      grid.appendChild(card);
    }
  },

  buyItem(item, day) {
    if (item.priceGems && !Save.spendGems(item.priceGems)) { this.toast('Gemme insufficienti!'); return; }
    if (item.priceCoins && !Save.spendCoins(item.priceCoins)) { this.toast('Monete insufficienti!'); return; }
    let msg = '';
    if (item.give.random) {
      /* Nova Box: ricompensa casuale */
      const roll = Math.random();
      if (roll < 0.5) { const n = Util.irand(40, 120); Save.addCoins(n); msg = `+${n} monete!`; }
      else if (roll < 0.85) { const n = Util.irand(30, 90); Save.addPP(n); msg = `+${n} punti potere!`; }
      else { const n = Util.irand(5, 15); Save.addGems(n); msg = `+${n} gemme! ✨`; }
    } else {
      if (item.give.coins) { Save.addCoins(item.give.coins); msg = `+${item.give.coins} monete!`; }
      if (item.give.pp) { Save.addPP(item.give.pp); msg = `+${item.give.pp} punti potere!`; }
      if (item.give.gems) { Save.addGems(item.give.gems); msg = `+${item.give.gems} gemme!`; }
      if (item.daily) Save.state.shopDaily = day;
      else Save.state.shopBought.push(item.id);
      Save.save();
    }
    AudioSys.sfx('buy');
    this.toast(msg);
    this.renderShop();
    this.renderHome();
  },

  /* ---------- Missioni ---------- */
  renderQuests() {
    Save.refreshQuests();
    const list = document.getElementById('quests-list');
    list.innerHTML = '';
    const groups = [['Giornaliere', false], ['Settimanali', true]];
    for (const [title, weekly] of groups) {
      list.insertAdjacentHTML('beforeend', `<h3 style="margin:8px 0;opacity:.7">${title}</h3>`);
      Save.state.quests.forEach((q, i) => {
        if (q.weekly !== weekly) return;
        const done = q.progress >= q.target;
        const row = document.createElement('div');
        row.className = 'quest-row' + (done && !q.claimed ? ' done' : '');
        row.style.opacity = q.claimed ? 0.5 : 1;
        row.innerHTML = `<div class="q-ico">${q.icon}</div>
          <div style="flex:1"><div class="q-name">${q.name}</div>
          <div class="q-bar"><div class="q-fill" style="width:${Math.round(q.progress / q.target * 100)}%"></div></div></div>
          <div class="q-reward">${q.claimed ? '✔' : done ? 'RISCUOTI!' : `🎫 ${q.reward}`}</div>`;
        if (done && !q.claimed) {
          row.addEventListener('click', () => {
            if (Save.claimQuest(i)) {
              AudioSys.sfx('buy');
              this.toast(`+${q.reward} punti pass, +${Math.floor(q.reward / 2)} monete!`);
              this.renderQuests();
            }
          });
        }
        list.appendChild(row);
      });
    }
  },

  /* ---------- Nova Pass ---------- */
  renderPass() {
    const tier = Save.passTier();
    const pts = Save.state.passPoints;
    document.getElementById('pass-fill').style.width =
      Math.min(100, (pts % PASS_POINTS_PER_TIER) / PASS_POINTS_PER_TIER * 100) + '%';
    document.getElementById('pass-label').textContent =
      `Tier ${tier}/30 — ${pts % PASS_POINTS_PER_TIER}/${PASS_POINTS_PER_TIER} 🎫`;
    const list = document.getElementById('pass-list');
    list.innerHTML = '';
    PASS_TIERS.forEach((r, i) => {
      const t = i + 1;
      const claimed = Save.state.passClaimed.includes(t);
      const claimable = !claimed && tier >= t;
      const row = document.createElement('div');
      row.className = 'pass-row' + (claimed ? ' claimed' : claimable ? ' claimable' : '');
      row.innerHTML = `<div class="pr-tier">${t}</div><div style="font-size:22px">${r.icon}</div>
        <div style="flex:1">${r.label}</div>
        <div>${claimed ? '✔' : claimable ? 'RISCUOTI!' : '🔒'}</div>`;
      if (claimable) {
        row.addEventListener('click', () => {
          const got = Save.claimPassTier(t);
          if (got) { AudioSys.sfx('buy'); this.toast(`Riscattato: ${got.label}!`); this.renderPass(); }
        });
      }
      list.appendChild(row);
    });
  },

  /* ---------- Classifica (locale, con bot simulati) ---------- */
  renderRanking() {
    const list = document.getElementById('ranking-list');
    list.innerHTML = '';
    const mine = Save.totalTrophies();
    /* Genera avversari fittizi attorno al punteggio del giocatore */
    const rng = Util.seededRng(42 + Save.state.level);
    const rows = [{ name: Save.state.name + ' (tu)', t: mine, me: true }];
    for (let i = 0; i < 19; i++) {
      rows.push({ name: BOT_NAMES[i % BOT_NAMES.length] + Util.irand(10, 99),
        t: Math.max(0, Math.round(mine + (rng() - 0.45) * 400)) });
    }
    rows.sort((a, b) => b.t - a.t);
    rows.forEach((r, i) => {
      const div = document.createElement('div');
      div.className = 'rank-row' + (r.me ? ' me' : '');
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
      div.innerHTML = `<div class="rr-pos">${medal}</div>
        <div style="flex:1;font-weight:${r.me ? 'bold' : 'normal'}">${r.name}</div>
        <div>🏆 ${Util.fmt(r.t)}</div>`;
      list.appendChild(div);
    });
  },

  /* ---------- Profilo ---------- */
  renderProfile() {
    const s = Save.state, st = s.stats;
    const body = document.getElementById('profile-body');
    body.innerHTML = `
      <div class="setting-row"><span>Nome</span><button class="action-btn" id="btn-rename">${s.name} ✏️</button></div>
      <div class="setting-row"><span>Livello account</span><b>${s.level}</b></div>
      <div class="setting-row"><span>Trofei totali</span><b>🏆 ${Util.fmt(Save.totalTrophies())}</b></div>
      <div class="setting-row"><span>Record trofei</span><b>${Util.fmt(st.bestTrophies)}</b></div>
      <div class="setting-row"><span>Partite giocate</span><b>${st.matches}</b></div>
      <div class="setting-row"><span>Vittorie</span><b>${st.wins}</b></div>
      <div class="setting-row"><span>Eliminazioni</span><b>${Util.fmt(st.kills)}</b></div>
      <div class="setting-row"><span>Danni totali</span><b>${Util.fmt(st.damage)}</b></div>
      <div class="setting-row"><span>Brawler sbloccati</span><b>${BRAWLERS.filter(b => Save.isUnlocked(b.id)).length}/${BRAWLERS.length}</b></div>`;
    document.getElementById('btn-rename').addEventListener('click', () => {
      const n = prompt('Nuovo nome:', s.name);
      if (n && n.trim()) { s.name = n.trim().slice(0, 14); Save.save(); this.renderProfile(); }
    });
  },

  /* ---------- Impostazioni ---------- */
  renderSettings() {
    const s = Save.state.settings;
    const body = document.getElementById('settings-body');
    body.innerHTML = '';
    const toggles = [
      ['music', '🎵 Musica'], ['sfx', '🔊 Effetti sonori'], ['vibration', '📳 Vibrazione'],
      ['autoFire', '🎯 Fuoco automatico'], ['showFps', '📈 Mostra FPS']
    ];
    for (const [key, label] of toggles) {
      const row = document.createElement('div');
      row.className = 'setting-row';
      row.innerHTML = `<span>${label}</span><button class="toggle ${s[key] ? 'on' : ''}"></button>`;
      row.querySelector('.toggle').addEventListener('click', (e) => {
        s[key] = !s[key];
        e.target.classList.toggle('on', s[key]);
        Save.save();
        AudioSys.applySettings();
        AudioSys.sfx('ui');
      });
      body.appendChild(row);
    }
    /* Qualità grafica */
    const qrow = document.createElement('div');
    qrow.className = 'setting-row';
    qrow.innerHTML = `<span>✨ Qualità grafica</span><button class="action-btn" id="btn-quality">${s.quality.toUpperCase()}</button>`;
    qrow.querySelector('#btn-quality').addEventListener('click', (e) => {
      s.quality = s.quality === 'alta' ? 'bassa' : 'alta';
      e.target.textContent = s.quality.toUpperCase();
      Save.save();
    });
    body.appendChild(qrow);
    /* Reset */
    const rrow = document.createElement('div');
    rrow.className = 'setting-row';
    rrow.innerHTML = `<span>⚠️ Cancella salvataggio</span><button class="action-btn" id="btn-reset">RESET</button>`;
    rrow.querySelector('#btn-reset').addEventListener('click', () => {
      if (confirm('Sicuro? Perderai TUTTI i progressi!')) {
        Save.reset();
        this.toast('Salvataggio azzerato.');
        this.show('home');
      }
    });
    body.appendChild(rrow);
    body.insertAdjacentHTML('beforeend',
      `<div style="opacity:.5;font-size:12px;text-align:center;margin-top:14px">
        Nova Brawl v1.0 — Controlli: joystick a sinistra, attacco a destra.<br>
        Desktop: WASD + click, E = Super, Q = Gadget, H = Hypercharge, T = Emote.</div>`);
  },

  /* ---------- Avvio partita ---------- */
  startMatch() {
    if (!Save.isUnlocked(Save.state.selectedBrawler)) {
      this.toast('Questo brawler è bloccato!');
      return;
    }
    AudioSys.sfx('go');
    document.getElementById('ui-root').style.display = 'none';
    window.game = new Game(Save.state.selectedMode, document.getElementById('game-canvas'), window.hud);
    window.hud.relayout(window.innerWidth, window.innerHeight);
    /* Mini tutorial alla prima partita */
    if (!Save.state.tutorialDone) {
      Save.state.tutorialDone = true;
      Save.save();
      setTimeout(() => { if (window.game) window.game.announce('Joystick a sinistra · Attacca a destra ⚔️'); }, 3500);
      setTimeout(() => { if (window.game) window.game.announce('Trascina ⚔️ per mirare · ★ = Super!'); }, 6500);
    }
  },

  /* ---------- Risultati ---------- */
  showResults(game, result) {
    const p = game.player;
    const rewards = Save.applyMatchResult({
      win: !!result.win, draw: !!result.draw, rank: result.rank,
      kills: p.kills, deaths: p.deaths, damage: Math.round(p.dmgDealt),
      gems: game.matchGems || 0, supers: p.supersUsed,
      modeId: game.modeId, brawlerId: p.def.id
    });
    window.game = null;
    document.getElementById('ui-root').style.display = '';
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-results').classList.remove('hidden');

    const title = document.getElementById('res-title');
    if (result.rank !== undefined && !result.win) {
      title.textContent = `#${result.rank} POSTO`;
      title.style.color = result.rank <= 4 ? '#ffe14d' : '#ff6a6a';
    } else {
      title.textContent = result.win ? 'VITTORIA! 🏆' : result.draw ? 'PAREGGIO' : 'SCONFITTA';
      title.style.color = result.win ? '#ffe14d' : result.draw ? '#c8d0ff' : '#ff6a6a';
    }
    const sign = rewards.trophies >= 0 ? '+' : '';
    document.getElementById('res-rows').innerHTML = `
      <div class="res-row"><span>Trofei</span><b>${sign}${rewards.trophies} 🏆</b></div>
      <div class="res-row"><span>Monete</span><b>+${rewards.coins} 🪙</b></div>
      <div class="res-row"><span>Esperienza</span><b>+${rewards.xp} XP</b></div>
      <div class="res-row"><span>Eliminazioni</span><b>${p.kills}</b></div>
      <div class="res-row"><span>Danni inflitti</span><b>${Util.fmt(Math.round(p.dmgDealt))}</b></div>
      ${game.matchGems ? `<div class="res-row"><span>Gemme raccolte</span><b>${game.matchGems} 💎</b></div>` : ''}`;
    AudioSys.music('menu');
  }
};
