# ⚡ Nova Brawl

**MOBA arena top-down ispirato a Brawl Stars** — HTML5/Canvas puro, zero dipendenze runtime,
giocabile subito nel browser su **Android, iOS e desktop**. Grafica vettoriale procedurale,
audio sintetizzato via WebAudio (nessun asset da scaricare), salvataggio persistente in locale.

![Modalità](https://img.shields.io/badge/modalit%C3%A0-9-blue) ![Brawler](https://img.shields.io/badge/brawler-12-orange) ![Engine](https://img.shields.io/badge/engine-Canvas%202D-green)

---

## ▶️ Avvio rapido

```bash
# Opzione 1: apri direttamente index.html nel browser (funziona da file://)
# Opzione 2: server locale
npm start          # http://localhost:8080
```

Su smartphone: apri l'URL nel browser e **"Aggiungi a schermata Home"** per il fullscreen.

### Controlli
| Touch | Desktop |
|---|---|
| Joystick dinamico (metà sinistra) | `WASD` / frecce |
| Tap ⚔️ = attacco con mira automatica | Click |
| Trascina ⚔️ / ★ = mira manuale | mouse |
| ★ Super · 🔧 Gadget · ⚡ Hypercharge · 💬 Emote | `E` · `Q` · `H` · `T` |

---

## 🎮 Contenuti

**9 modalità:** Gem Grab, Showdown Solo, Showdown Duo (respawn col compagno vivo),
Brawl Ball, Rapina, Knockout (al meglio di 3 round), Zona Calda, Taglia, Boss Fight.

**12 brawler originali** in 7 classi (Danno, Tank, Cecchino, Supporto, Assassino,
Lanciatore, Controllo), ognuno con attacco, Super, Gadget, **Hypercharge**, skin,
emote e statistiche bilanciate in `js/data.js`.

**Gameplay:** distruzione ambientale, cespugli con vero sistema di visione, acqua,
jump pad, teletrasporti, proiettili a parabola/perforanti/a catena/boomerang,
danni ad area, effetti di stato (rallentamento, stordimento, radicamento, bruciatura,
veleno), cure, scudi, rigenerazione passiva, respawn con invulnerabilità, power cube,
gas velenoso in Showdown.

**Progressione:** trofei per brawler con sblocco a soglie, livello account con XP,
potenziamento brawler (livelli 1-11), missioni giornaliere e settimanali, **Nova Pass**
a 30 tier, negozio con valute (monete/gemme/punti potere), skin acquistabili,
classifica, profilo con statistiche. Tutto salvato in `localStorage`.

**IA:** bot con pathfinding A*, kiting, fuga a vita bassa, raccolta obiettivi di
modalità, uso contestuale di super e gadget, difficoltà che scala con i tuoi trofei.

---

## 🏗 Architettura

```
index.html              Shell + schermate DOM dei menu
css/style.css           UI (tema scuro, safe-area, responsive)
js/
  util.js               Matematica, RNG deterministico, object pooling
  audio.js              SFX + musica procedurale (WebAudio, zero file)
  data.js               DATABASE: brawler, modalità, missioni, negozio, pass
  save.js               Salvataggio/progressione (localStorage)
  particles.js          Sistema particellare con pooling + testi fluttuanti
  map.js                Tilemap, collisioni, distruzione, A*, line-of-sight
  entities.js           Brawler, proiettili, zone, pickup, super/gadget/hyper
  ai.js                 Cervello dei bot (stati + pathfinding)
  modes.js              Le 9 modalità di gioco
  hud.js                Joystick dinamico + pulsanti touch + mira
  game.js               Orchestratore partita, camera, rendering
  menus.js              UI DOM: home, negozio, missioni, pass, opzioni
  main.js               Game loop (simulazione 60 Hz fissa, render a refresh nativo)
server/server.js        Scheletro server AUTOREVOLE (WebSocket) per l'online
```

### Prestazioni
- Simulazione a **timestep fisso 60 Hz**, rendering a refresh nativo dello schermo
  (90/120/144 Hz supportati via `requestAnimationFrame`).
- **Object pooling** per proiettili e particelle (zero pressione GC in partita).
- Culling dei tile fuori schermo, DPR limitato in qualità "bassa", pausa audio in background.
- Vibrazione aptica sugli eventi (dove supportata).

---

## 📱 Build nativa Android / iOS (Capacitor)

```bash
npm install
npx cap add android   # richiede Android Studio
npx cap add ios       # richiede Xcode (macOS)
npm run android       # sync + apri il progetto nativo
npm run ios
```

`capacitor.config.json` è già configurato (`com.novabrawl.game`).

---

## 🌐 Multiplayer online — stato e roadmap

Il gioco attuale è **completo offline**: le partite si giocano contro bot con IA
(la struttura a squadre, il matchmaking simulato e tutte le regole sono già quelle
del multiplayer). Per l'online è incluso `server/server.js`, uno scheletro di
**server autorevole** WebSocket già funzionante che implementa:

- coda di matchmaking per modalità e creazione stanze;
- tick di simulazione server-side a 20 Hz con broadcast dello stato;
- **anti-cheat by design**: i client inviano solo input (mai posizioni), il server
  clampa velocità e valida i cooldown;
- **riconnessione** con token entro 30 secondi;
- buffer di **replay** per tick e modalità **spettatore**.

Passi successivi documentati nel file: estrarre `entities.js`/`modes.js` in un modulo
condiviso client/server e sostituire l'input dei bot con gli input remoti.

```bash
npm run server   # avvia il server su :8081
```

---

## ⚖️ Note

Progetto originale a scopo didattico ispirato alle meccaniche del genere
"arena brawler". Nessun asset, nome o contenuto di Brawl Stars (Supercell) è utilizzato.
Licenza MIT.
