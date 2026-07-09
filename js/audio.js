/* ============================================================
   audio.js — Sistema audio completo basato su WebAudio.
   Nessun file esterno: effetti sonori e musica sono
   sintetizzati proceduralmente (zero download, zero licenze).
   ============================================================ */
'use strict';

const AudioSys = {
  ctx: null,
  master: null,
  musicGain: null,
  sfxGain: null,
  musicTimer: null,
  currentTrack: null,
  step: 0,

  /* L'AudioContext può partire solo dopo un gesto utente:
     init() viene richiamata al primo tocco. */
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.35;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.8;
    this.sfxGain.connect(this.master);
    this.applySettings();
  },

  applySettings() {
    if (!this.ctx) return;
    const s = Save.state.settings;
    this.musicGain.gain.value = s.music ? 0.32 : 0;
    this.sfxGain.gain.value = s.sfx ? 0.8 : 0;
  },

  /* ---------- Sintesi di un singolo suono ---------- */
  tone(opts) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = opts.type || 'square';
    o.frequency.setValueAtTime(opts.f0 || 440, t);
    if (opts.f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.f1), t + (opts.dur || 0.15));
    g.gain.setValueAtTime(opts.vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (opts.dur || 0.15));
    o.connect(g); g.connect(opts.music ? this.musicGain : this.sfxGain);
    o.start(t); o.stop(t + (opts.dur || 0.15) + 0.02);
  },

  /* Rumore bianco filtrato: esplosioni, passi, hit */
  noise(opts) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const dur = opts.dur || 0.2;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = opts.filter || 'lowpass';
    filt.frequency.setValueAtTime(opts.f0 || 1000, t);
    if (opts.f1) filt.frequency.exponentialRampToValueAtTime(Math.max(40, opts.f1), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(opts.vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filt); filt.connect(g); g.connect(this.sfxGain);
    src.start(t);
  },

  /* ---------- Libreria effetti sonori ---------- */
  sfx(name) {
    if (!this.ctx || !Save.state.settings.sfx) return;
    switch (name) {
      case 'shoot':   this.tone({ type: 'square', f0: 700, f1: 240, dur: 0.09, vol: 0.16 }); break;
      case 'shoot2':  this.tone({ type: 'sawtooth', f0: 420, f1: 160, dur: 0.12, vol: 0.15 }); break;
      case 'lob':     this.tone({ type: 'sine', f0: 300, f1: 640, dur: 0.2, vol: 0.2 }); break;
      case 'melee':   this.noise({ f0: 2400, f1: 500, dur: 0.09, vol: 0.25, filter: 'bandpass' }); break;
      case 'hit':     this.tone({ type: 'triangle', f0: 220, f1: 90, dur: 0.08, vol: 0.3 }); break;
      case 'explode': this.noise({ f0: 900, f1: 80, dur: 0.4, vol: 0.5 });
                      this.tone({ type: 'sine', f0: 120, f1: 40, dur: 0.35, vol: 0.4 }); break;
      case 'super':   this.tone({ type: 'sawtooth', f0: 180, f1: 900, dur: 0.35, vol: 0.35 });
                      this.noise({ f0: 3000, f1: 400, dur: 0.3, vol: 0.2 }); break;
      case 'death':   this.tone({ type: 'square', f0: 400, f1: 60, dur: 0.5, vol: 0.3 }); break;
      case 'respawn': this.tone({ type: 'sine', f0: 300, f1: 900, dur: 0.3, vol: 0.25 }); break;
      case 'heal':    this.tone({ type: 'sine', f0: 520, f1: 880, dur: 0.18, vol: 0.2 }); break;
      case 'gem':     this.tone({ type: 'sine', f0: 900, f1: 1400, dur: 0.12, vol: 0.25 }); break;
      case 'cube':    this.tone({ type: 'triangle', f0: 500, f1: 1000, dur: 0.15, vol: 0.25 }); break;
      case 'wall':    this.noise({ f0: 600, f1: 120, dur: 0.25, vol: 0.35 }); break;
      case 'jump':    this.tone({ type: 'sine', f0: 260, f1: 780, dur: 0.25, vol: 0.3 }); break;
      case 'tele':    this.tone({ type: 'sawtooth', f0: 1200, f1: 200, dur: 0.25, vol: 0.2 }); break;
      case 'shield':  this.tone({ type: 'triangle', f0: 340, f1: 620, dur: 0.2, vol: 0.25 }); break;
      case 'freeze':  this.tone({ type: 'sine', f0: 1600, f1: 640, dur: 0.25, vol: 0.2 }); break;
      case 'gadget':  this.tone({ type: 'square', f0: 620, f1: 980, dur: 0.14, vol: 0.25 }); break;
      case 'hyper':   this.tone({ type: 'sawtooth', f0: 100, f1: 1400, dur: 0.5, vol: 0.35 }); break;
      case 'goal':    this.tone({ type: 'square', f0: 523, dur: 0.14, vol: 0.3 });
                      setTimeout(() => this.tone({ type: 'square', f0: 659, dur: 0.14, vol: 0.3 }), 130);
                      setTimeout(() => this.tone({ type: 'square', f0: 784, dur: 0.25, vol: 0.3 }), 260); break;
      case 'kick':    this.noise({ f0: 1800, f1: 300, dur: 0.12, vol: 0.35, filter: 'bandpass' }); break;
      case 'ui':      this.tone({ type: 'square', f0: 660, f1: 880, dur: 0.06, vol: 0.15 }); break;
      case 'buy':     this.tone({ type: 'sine', f0: 700, f1: 1100, dur: 0.12, vol: 0.25 });
                      setTimeout(() => this.tone({ type: 'sine', f0: 1100, f1: 1500, dur: 0.15, vol: 0.25 }), 100); break;
      case 'win':     [523, 659, 784, 1046].forEach((f, i) =>
                        setTimeout(() => this.tone({ type: 'square', f0: f, dur: 0.22, vol: 0.28 }), i * 160)); break;
      case 'lose':    [392, 330, 262, 196].forEach((f, i) =>
                        setTimeout(() => this.tone({ type: 'sawtooth', f0: f, dur: 0.25, vol: 0.22 }), i * 180)); break;
      case 'count':   this.tone({ type: 'square', f0: 440, dur: 0.1, vol: 0.3 }); break;
      case 'go':      this.tone({ type: 'square', f0: 880, dur: 0.3, vol: 0.35 }); break;
    }
  },

  /* ---------- Musica procedurale ----------
     Sequencer a 8 step: basso + arpeggio + hi-hat.
     Due tracce: 'menu' (rilassata) e 'battle' (incalzante). */
  music(track) {
    if (this.currentTrack === track) return;
    this.currentTrack = track;
    this.stopMusic();
    if (!this.ctx || track === null) return;
    this.step = 0;

    const patterns = {
      menu: {
        bpm: 96,
        bass: [55, 0, 65.4, 0, 49, 0, 58.3, 0],
        arp:  [220, 261.6, 329.6, 261.6, 196, 246.9, 293.7, 246.9],
        hat: [0, 1, 0, 1, 0, 1, 0, 1]
      },
      battle: {
        bpm: 148,
        bass: [55, 55, 0, 55, 73.4, 0, 55, 65.4],
        arp:  [440, 523.3, 659.3, 880, 659.3, 523.3, 440, 349.2],
        hat: [1, 1, 1, 1, 1, 1, 1, 1]
      }
    };
    const p = patterns[track];
    if (!p) return;
    const interval = 60000 / p.bpm / 2; // ottavi

    this.musicTimer = setInterval(() => {
      if (!Save.state.settings.music) return;
      const i = this.step % 8;
      const t = this.ctx.currentTime;
      // Basso
      if (p.bass[i]) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'triangle'; o.frequency.value = p.bass[i];
        g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + 0.3);
      }
      // Arpeggio (solo su step alternati nel menu per respiro)
      if (p.arp[i] && (track === 'battle' || i % 2 === 0)) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'square'; o.frequency.value = p.arp[i];
        g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + 0.2);
      }
      // Hi-hat (rumore breve)
      if (p.hat[i] && this.ctx) {
        const len = Math.floor(this.ctx.sampleRate * 0.04);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let j = 0; j < len; j++) d[j] = (Math.random() * 2 - 1) * (1 - j / len);
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
        const g = this.ctx.createGain(); g.gain.value = 0.1;
        src.connect(f); f.connect(g); g.connect(this.musicGain); src.start(t);
      }
      this.step++;
    }, interval);
  },

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }
};
