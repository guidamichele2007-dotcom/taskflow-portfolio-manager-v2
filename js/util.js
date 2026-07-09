/* ============================================================
   util.js — Funzioni matematiche, vettori, RNG, pooling.
   Tutto il progetto usa questi helper condivisi.
   ============================================================ */
'use strict';

const TAU = Math.PI * 2;

const Util = {
  /* Limita v nell'intervallo [a, b] */
  clamp(v, a, b) { return v < a ? a : (v > b ? b : v); },

  /* Interpolazione lineare */
  lerp(a, b, t) { return a + (b - a) * t; },

  /* Distanza euclidea */
  dist(x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx * dx + dy * dy); },
  dist2(x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return dx * dx + dy * dy; },

  /* Angolo da (x1,y1) verso (x2,y2) */
  angTo(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); },

  /* Interpolazione angolare (percorso più corto) */
  lerpAng(a, b, t) {
    let d = (b - a) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return a + d * t;
  },

  /* Random float in [a, b) */
  rand(a, b) { return a + Math.random() * (b - a); },

  /* Random intero in [a, b] inclusi */
  irand(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },

  /* Elemento casuale di un array */
  choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  /* Mescola un array in place (Fisher-Yates) */
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  /* RNG deterministico (mulberry32) — usato per generare mappe ripetibili */
  seededRng(seed) {
    let s = seed >>> 0;
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  /* Formatta numeri grandi: 12500 -> "12.5K" */
  fmt(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K';
    return String(Math.floor(n));
  },

  /* Schiarisce/scurisce un colore hex di una quantità [-1, 1] */
  shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  },

  /* Easing */
  easeOut(t) { return 1 - (1 - t) * (1 - t); },
  easeIn(t) { return t * t; },

  /* Vibrazione (dove supportata: Android Chrome, wrapper Capacitor) */
  vibrate(ms) {
    try { if (navigator.vibrate && Save.state.settings.vibration) navigator.vibrate(ms); } catch (e) { /* no-op */ }
  }
};

/* ------------------------------------------------------------
   Pool di oggetti generico: riduce la pressione sul GC durante
   la partita (proiettili e particelle vengono riciclati).
   ------------------------------------------------------------ */
class Pool {
  constructor(factory) {
    this.factory = factory;
    this.items = [];       // oggetti liberi pronti al riuso
  }
  get() { return this.items.pop() || this.factory(); }
  release(obj) { if (this.items.length < 512) this.items.push(obj); }
}
