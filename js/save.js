/* ============================================================
   save.js — Sistema di salvataggio persistente (localStorage).
   Gestisce profilo, valute, progressi brawler, missioni,
   battle pass, impostazioni e statistiche.
   ============================================================ */
'use strict';

const SAVE_KEY = 'novabrawl_save_v1';

const Save = {
  state: null,

  /* Stato di default per un nuovo giocatore */
  defaults() {
    return {
      name: 'Giocatore' + Util.irand(100, 999),
      xp: 0,
      level: 1,
      coins: 200,
      gems: 50,
      pp: 0,                       // punti potere
      selectedBrawler: 'bolt',
      selectedMode: 'gemgrab',
      tutorialDone: false,
      /* Stato per-brawler: trofei, livello, punti potere spesi, skin */
      brawlers: { bolt: { trophies: 0, level: 1, skin: 'def', skins: ['def'] } },
      /* Missioni giornaliere/settimanali generate + progresso */
      quests: [],
      questsDay: 0,                // giorno di generazione (per il reset)
      questsWeek: 0,
      passPoints: 0,
      passClaimed: [],             // tier già riscattati
      shopDaily: 0,                // ultimo giorno del reclamo gemme gratis
      shopBought: [],              // acquisti one-shot del giorno
      stats: { matches: 0, wins: 0, kills: 0, deaths: 0, damage: 0, gems: 0, supers: 0, bestTrophies: 0 },
      settings: { music: true, sfx: true, vibration: true, autoFire: false, showFps: false, quality: 'alta' }
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      this.state = raw ? Object.assign(this.defaults(), JSON.parse(raw)) : this.defaults();
      /* merge profondo di settings/stats per retro-compatibilità */
      this.state.settings = Object.assign(this.defaults().settings, this.state.settings);
      this.state.stats = Object.assign(this.defaults().stats, this.state.stats);
    } catch (e) {
      console.warn('Salvataggio corrotto, reset:', e);
      this.state = this.defaults();
    }
    this.refreshQuests();
    this.save();
  },

  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); }
    catch (e) { console.warn('Impossibile salvare:', e); }
  },

  reset() {
    this.state = this.defaults();
    this.save();
  },

  /* ---------- Valute ---------- */
  addCoins(n) { this.state.coins += n; this.save(); },
  addGems(n) { this.state.gems += n; this.save(); },
  addPP(n) { this.state.pp += n; this.save(); },

  spendCoins(n) { if (this.state.coins < n) return false; this.state.coins -= n; this.save(); return true; },
  spendGems(n) { if (this.state.gems < n) return false; this.state.gems -= n; this.save(); return true; },

  /* ---------- Esperienza giocatore ---------- */
  xpForLevel(lv) { return 100 + (lv - 1) * 60; },
  addXp(n) {
    this.state.xp += n;
    while (this.state.xp >= this.xpForLevel(this.state.level)) {
      this.state.xp -= this.xpForLevel(this.state.level);
      this.state.level++;
      this.addCoins(50);           // bonus di livello
    }
    this.save();
  },

  /* ---------- Brawler ---------- */
  brawlerState(id) {
    if (!this.state.brawlers[id]) {
      this.state.brawlers[id] = { trophies: 0, level: 1, skin: 'def', skins: ['def'] };
    }
    return this.state.brawlers[id];
  },

  totalTrophies() {
    let t = 0;
    for (const id in this.state.brawlers) t += this.state.brawlers[id].trophies;
    return t;
  },

  /* Un brawler è sbloccato se i trofei totali superano la sua soglia */
  isUnlocked(id) {
    const def = BRAWLER_BY_ID[id];
    if (this.state.brawlers[id] && this.state.brawlers[id].unlockedByShop) return true;
    return this.totalTrophies() >= def.unlockTrophies;
  },

  addTrophies(brawlerId, n) {
    const b = this.brawlerState(brawlerId);
    b.trophies = Math.max(0, b.trophies + n);
    const tot = this.totalTrophies();
    if (tot > this.state.stats.bestTrophies) this.state.stats.bestTrophies = tot;
    this.save();
  },

  /* Potenzia un brawler se ci sono risorse sufficienti */
  upgradeBrawler(id) {
    const b = this.brawlerState(id);
    if (b.level >= 11) return { ok: false, msg: 'Livello massimo!' };
    const cost = UPGRADE_COST[b.level];
    if (this.state.pp < cost) return { ok: false, msg: `Servono ${cost} punti potere` };
    if (this.state.coins < cost) return { ok: false, msg: `Servono ${cost} monete` };
    this.state.pp -= cost;
    this.state.coins -= cost;
    b.level++;
    this.save();
    return { ok: true, msg: `${BRAWLER_BY_ID[id].name} è ora livello ${b.level}!` };
  },

  buySkin(brawlerId, skinId) {
    const def = BRAWLER_BY_ID[brawlerId];
    const skin = def.skins.find(s => s.id === skinId);
    const b = this.brawlerState(brawlerId);
    if (b.skins.includes(skinId)) { b.skin = skinId; this.save(); return { ok: true, msg: 'Skin equipaggiata!' }; }
    if (!this.spendCoins(skin.price)) return { ok: false, msg: `Servono ${skin.price} monete` };
    b.skins.push(skinId);
    b.skin = skinId;
    this.save();
    return { ok: true, msg: `Skin ${skin.name} acquistata!` };
  },

  /* ---------- Missioni ----------
     Rigenerate a mezzanotte (giornaliere) e ogni lunedì (settimanali). */
  refreshQuests() {
    const now = new Date();
    const day = Math.floor(now.getTime() / 86400000);
    const week = Math.floor((day + 3) / 7);   // epoch giovedì -> lunedì
    let changed = false;

    if (this.state.questsDay !== day) {
      this.state.quests = this.state.quests.filter(q => q.weekly);
      const picks = Util.shuffle(QUEST_TEMPLATES.slice()).slice(0, 4);
      for (const t of picks) {
        this.state.quests.push({
          tid: t.id, weekly: false, target: t.daily, progress: 0, claimed: false,
          name: t.name.replace('{n}', Util.fmt(t.daily)), icon: t.icon, stat: t.stat, reward: t.reward
        });
      }
      this.state.questsDay = day;
      this.state.shopDaily = this.state.shopDaily === day ? day : 0; // reset gemme gratis
      this.state.shopBought = [];
      changed = true;
    }
    if (this.state.questsWeek !== week) {
      this.state.quests = this.state.quests.filter(q => !q.weekly);
      const picks = Util.shuffle(QUEST_TEMPLATES.slice()).slice(0, 3);
      for (const t of picks) {
        this.state.quests.push({
          tid: t.id, weekly: true, target: t.weekly, progress: 0, claimed: false,
          name: t.name.replace('{n}', Util.fmt(t.weekly)), icon: t.icon, stat: t.stat, reward: t.reward * 3
        });
      }
      this.state.questsWeek = week;
      changed = true;
    }
    if (changed) this.save();
  },

  /* Registra progresso su tutte le missioni con quella statistica */
  questProgress(stat, amount) {
    for (const q of this.state.quests) {
      if (q.stat === stat && !q.claimed) q.progress = Math.min(q.target, q.progress + amount);
    }
    this.save();
  },

  claimQuest(index) {
    const q = this.state.quests[index];
    if (!q || q.claimed || q.progress < q.target) return false;
    q.claimed = true;
    this.state.passPoints += q.reward;
    this.addCoins(Math.floor(q.reward / 2));
    this.save();
    return true;
  },

  /* ---------- Battle Pass ---------- */
  passTier() { return Math.min(30, Math.floor(this.state.passPoints / PASS_POINTS_PER_TIER)); },

  claimPassTier(tier) {
    if (this.state.passClaimed.includes(tier) || this.passTier() < tier) return null;
    const r = PASS_TIERS[tier - 1];
    this.state.passClaimed.push(tier);
    if (r.coins) this.addCoins(r.coins);
    if (r.gems) this.addGems(r.gems);
    if (r.pp) this.addPP(r.pp);
    if (r.skinToken) {
      /* la skin esclusiva del pass: dorata per il brawler selezionato */
      const b = this.brawlerState(this.state.selectedBrawler);
      if (!b.skins.includes('oro')) b.skins.push('oro');
    }
    this.save();
    return r;
  },

  /* ---------- Fine partita: applica ricompense ----------
     result: { win, rank, kills, damage, gems, supers, modeId, brawlerId } */
  applyMatchResult(r) {
    const s = this.state.stats;
    s.matches++;
    if (r.win) s.wins++;
    s.kills += r.kills;
    s.deaths += r.deaths || 0;
    s.damage += r.damage;
    s.gems += r.gems || 0;
    s.supers += r.supers || 0;

    /* Trofei: vittoria +8, pareggio +2, sconfitta -4 (showdown: per piazzamento) */
    let dt;
    if (r.rank !== undefined) dt = Math.max(-6, 8 - r.rank * 1.6) | 0;
    else dt = r.win ? 8 : (r.draw ? 2 : -4);
    this.addTrophies(r.brawlerId, dt);

    /* Valute ed esperienza */
    const coins = r.win ? 25 : 10;
    const xp = r.win ? 30 : 12;
    this.addCoins(coins);
    this.addXp(xp);
    this.state.passPoints += r.win ? 12 : 5;

    /* Progresso missioni */
    this.questProgress('matches', 1);
    if (r.win) this.questProgress('wins', 1);
    this.questProgress('kills', r.kills);
    this.questProgress('damage', r.damage);
    this.questProgress('gems', r.gems || 0);
    this.questProgress('supers', r.supers || 0);

    this.save();
    return { trophies: dt, coins, xp };
  }
};
