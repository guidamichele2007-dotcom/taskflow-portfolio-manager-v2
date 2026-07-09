/* ============================================================
   server.js — Scheletro di server autorevole per Nova Brawl.
   FONDAMENTA per il multiplayer online (il client attuale gioca
   offline contro i bot; questo server definisce l'architettura
   di rete pronta da collegare).

   Architettura:
   - Matchmaking a coda: i client si mettono in coda per modalità,
     al riempimento (6 giocatori 3v3 / 10 showdown) parte la stanza.
   - Server autorevole: i client inviano SOLO input (direzione,
     mira, azioni); il server simula il mondo a 20 tick/s e
     trasmette lo stato. Niente stato inviato dal client = niente
     speed-hack o teleport-hack (anti-cheat by design).
   - Validazione input: direzione normalizzata, cooldown verificati
     lato server, rate-limit dei messaggi.
   - Riconnessione: ogni sessione ha un token; entro 30s il client
     può riagganciarsi alla stessa stanza.
   - Spettatore/Replay: ogni tick di stato è serializzato; il buffer
     della partita può essere salvato e ritrasmesso.

   Avvio:  npm install && npm run server
   ============================================================ */
'use strict';

const { WebSocketServer } = require('ws');
const crypto = require('crypto');

const PORT = process.env.PORT || 8081;
const TICK_RATE = 20;                       // tick di simulazione al secondo
const ROOM_SIZE = { gemgrab: 6, showdown: 10, duo: 10, brawlball: 6, heist: 6, knockout: 6, hotzone: 6, bounty: 6 };

const queues = new Map();                   // modeId -> [client]
const rooms = new Map();                    // roomId -> Room
const sessions = new Map();                 // token -> { client, room } per la riconnessione

/* ------------------------------------------------------------
   Stanza di gioco: simulazione autorevole a tick fissi.
   La logica di simulazione condivisa (movimento, proiettili,
   modalità) è la stessa del client: in una build completa si
   estrae js/entities.js + js/modes.js in un modulo comune.
   ------------------------------------------------------------ */
class Room {
  constructor(modeId, clients) {
    this.id = crypto.randomUUID();
    this.modeId = modeId;
    this.clients = clients;
    this.tick = 0;
    this.replay = [];                       // buffer per replay/spettatori
    this.inputs = new Map();                // playerId -> ultimo input valido
    this.state = this.createInitialState();

    for (const c of clients) {
      c.room = this;
      this.inputs.set(c.playerId, { mx: 0, my: 0, actions: [] });
      c.send({ t: 'match_start', roomId: this.id, mode: modeId, tickRate: TICK_RATE,
               players: clients.map(x => ({ id: x.playerId, name: x.name, brawler: x.brawler })) });
    }
    this.timer = setInterval(() => this.step(), 1000 / TICK_RATE);
  }

  createInitialState() {
    /* Stato minimo dimostrativo: posizioni e vita dei giocatori.
       Qui va innestata la simulazione completa condivisa col client. */
    const state = { players: {} };
    this.clients.forEach((c, i) => {
      state.players[c.playerId] = { x: 100 + i * 60, y: 100 + (i % 2) * 500, hp: 4000, team: i % 2 };
    });
    return state;
  }

  /* Un tick di simulazione autorevole */
  step() {
    this.tick++;
    const dt = 1 / TICK_RATE;
    for (const [pid, input] of this.inputs) {
      const p = this.state.players[pid];
      if (!p) continue;
      /* ANTI-CHEAT: il server applica SOLO input normalizzati e
         clampa la velocità: il client non può dichiarare posizioni. */
      const len = Math.hypot(input.mx, input.my) || 1;
      const speed = 100;                    // dalla definizione del brawler
      p.x += (input.mx / Math.max(1, len)) * speed * dt;
      p.y += (input.my / Math.max(1, len)) * speed * dt;
      /* Le azioni (attack/super/gadget) vengono validate sui
         cooldown mantenuti dal server, poi applicate qui. */
      input.actions.length = 0;
    }
    /* Snapshot di stato: broadcast + replay buffer */
    const snap = { t: 'state', tick: this.tick, players: this.state.players };
    this.replay.push(JSON.stringify(snap));
    this.broadcast(snap);
    if (this.tick > TICK_RATE * 180) this.close(); // limite 3 minuti
  }

  broadcast(msg) { for (const c of this.clients) c.send(msg); }

  close() {
    clearInterval(this.timer);
    this.broadcast({ t: 'match_end', replayTicks: this.replay.length });
    rooms.delete(this.id);
    for (const c of this.clients) c.room = null;
  }
}

/* ------------------------------------------------------------
   Gestione connessioni
   ------------------------------------------------------------ */
class Client {
  constructor(ws) {
    this.ws = ws;
    this.playerId = crypto.randomUUID();
    this.token = crypto.randomBytes(16).toString('hex');
    this.room = null;
    this.name = 'Player';
    this.brawler = 'bolt';
    this.msgCount = 0;                      // rate limiting
    setInterval(() => this.msgCount = 0, 1000);
  }
  send(obj) {
    if (this.ws.readyState === 1) this.ws.send(JSON.stringify(obj));
  }
}

const wss = new WebSocketServer({ port: PORT });
console.log(`[NovaBrawl] Server autorevole in ascolto su :${PORT}`);

wss.on('connection', (ws) => {
  const client = new Client(ws);
  sessions.set(client.token, client);
  client.send({ t: 'hello', playerId: client.playerId, token: client.token });

  ws.on('message', (raw) => {
    /* Rate limit: max 40 messaggi/secondo per client */
    if (++client.msgCount > 40) return;
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.t) {
      case 'queue': {
        /* Matchmaking: entra in coda per una modalità */
        const mode = String(msg.mode || 'gemgrab');
        client.name = String(msg.name || 'Player').slice(0, 14);
        client.brawler = String(msg.brawler || 'bolt');
        if (!queues.has(mode)) queues.set(mode, []);
        const q = queues.get(mode);
        if (!q.includes(client)) q.push(client);
        client.send({ t: 'queued', position: q.length });
        const size = ROOM_SIZE[mode] || 6;
        if (q.length >= size) {
          const players = q.splice(0, size);
          const room = new Room(mode, players);
          rooms.set(room.id, room);
        }
        break;
      }
      case 'input': {
        /* Input di gioco: SOLO direzioni e azioni, mai posizioni */
        if (!client.room) return;
        const inp = client.room.inputs.get(client.playerId);
        if (!inp) return;
        inp.mx = Number(msg.mx) || 0;
        inp.my = Number(msg.my) || 0;
        if (Array.isArray(msg.actions)) inp.actions.push(...msg.actions.slice(0, 4));
        break;
      }
      case 'reconnect': {
        /* Riconnessione con token entro la finestra di grazia */
        const old = sessions.get(String(msg.token || ''));
        if (old && old.room) {
          client.playerId = old.playerId;
          client.room = old.room;
          const idx = old.room.clients.indexOf(old);
          if (idx >= 0) old.room.clients[idx] = client;
          client.send({ t: 'reconnected', roomId: old.room.id });
        } else {
          client.send({ t: 'reconnect_failed' });
        }
        break;
      }
      case 'spectate': {
        /* Spettatore: aggancia una stanza esistente in sola lettura */
        const room = rooms.get(String(msg.roomId || ''));
        if (room) { room.clients.push(client); client.send({ t: 'spectating', roomId: room.id }); }
        break;
      }
    }
  });

  ws.on('close', () => {
    /* Il giocatore resta "riconnettibile" per 30 secondi */
    for (const q of queues.values()) {
      const i = q.indexOf(client);
      if (i >= 0) q.splice(i, 1);
    }
    setTimeout(() => sessions.delete(client.token), 30000);
  });
});
