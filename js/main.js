/* ============================================================
   main.js — Bootstrap e game loop.
   Timestep fisso a 60 Hz per la simulazione + rendering a
   frequenza dello schermo (supporta 90/120/144 Hz nativamente
   tramite requestAnimationFrame). Canvas in scala DPR.
   ============================================================ */
'use strict';

(function () {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  let cssW = 0, cssH = 0;

  /* ---------- Resize con supporto Retina/alta densità ---------- */
  function resize() {
    cssW = window.innerWidth;
    cssH = window.innerHeight;
    /* In qualità bassa limitiamo il DPR per risparmiare GPU */
    const maxDpr = (Save.state && Save.state.settings.quality === 'bassa') ? 1 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (window.hud) window.hud.relayout(cssW, cssH);
  }

  /* ---------- Inizializzazione ---------- */
  Save.load();
  window.hud = new HUD(canvas);
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  Menus.init();

  /* Primo tocco/click: sblocca l'audio (richiesto da iOS/Android) */
  const unlock = () => { AudioSys.init(); AudioSys.music(Menus.current === 'home' ? 'menu' : AudioSys.currentTrack); };
  window.addEventListener('pointerdown', unlock, { once: true });

  /* Pausa quando l'app va in background (risparmio batteria) */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) AudioSys.stopMusic();
    else { const t = AudioSys.currentTrack; AudioSys.currentTrack = null; AudioSys.music(t); }
  });

  /* ---------- Game loop ---------- */
  const STEP = 1 / 60;          // timestep fisso della simulazione
  let last = performance.now();
  let acc = 0;
  let fpsTime = 0, fpsCount = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;   // evita "spiral of death" dopo una pausa

    /* Contatore FPS */
    fpsCount++;
    fpsTime += dt;
    if (fpsTime >= 0.5) {
      if (window.game) window.game.fps = fpsCount / fpsTime;
      fpsCount = 0; fpsTime = 0;
    }

    const g = window.game;
    if (!g) {
      /* Nei menu il canvas mostra uno sfondo animato leggero */
      drawMenuBackground(now / 1000);
      return;
    }

    /* Simulazione a passi fissi, rendering a ogni frame */
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 4) {
      g.update(STEP);
      acc -= STEP;
      steps++;
      if (!window.game) return;   // la partita può terminare dentro update()
    }
    g.render(ctx, cssW, cssH);
  }

  /* Sfondo animato dei menu: stelle che scorrono */
  const stars = [];
  for (let i = 0; i < 60; i++) {
    stars.push({ x: Math.random(), y: Math.random(), s: Math.random() * 2 + 0.5, v: Math.random() * 0.02 + 0.005 });
  }
  function drawMenuBackground(t) {
    ctx.fillStyle = '#0e1230';
    ctx.fillRect(0, 0, cssW, cssH);
    for (const st of stars) {
      st.y += st.v / 60;
      if (st.y > 1) st.y = 0;
      ctx.globalAlpha = 0.3 + 0.3 * Math.sin(t * 2 + st.x * 10);
      ctx.fillStyle = '#8892c9';
      ctx.fillRect(st.x * cssW, st.y * cssH, st.s, st.s);
    }
    ctx.globalAlpha = 1;
  }

  requestAnimationFrame(frame);
})();
