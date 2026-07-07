# 13 — Backend, Multiplayer e Salvataggio

## Architettura di servizio (alto livello)

```
Client (Unity: PC/Android/iOS/Console)
   │
   ├── HTTPS/REST ── API Gateway ── Servizi applicativi (autenticazione, profilo, economia,
   │                                 missioni, negozio, leaderboard, matchmaking-request)
   │
   └── WebSocket/UDP (bassa latenza) ── Servizio Real-time (sessioni PvP/Co-op attive,
                                          scambio "intent" di gioco, validazione server)

Servizi applicativi ──► PostgreSQL (dati persistenti relazionali)
Servizi applicativi ──► Redis (cache, codo matchmaking, sessioni effimere, rate limiting)
Servizio Real-time  ──► Redis Pub/Sub (coordinamento tra istanze di gioco in scaling orizzontale)
Tutti i servizi     ──► Object Storage (S3-compatibile) per asset dinamici (skin evento, replay)
```

Stack consigliato: servizi in **Node.js/TypeScript** (coerente con lo scaffold dati condiviso di
questo repository, riuso diretto dei tipi in `packages/shared`) oppure Go per i servizi a più
alto throughput (matchmaking, real-time), containerizzati (Docker/Kubernetes) per scalare
orizzontalmente durante i picchi di eventi stagionali.

## Autenticazione e account

- Login **account unico** (email/password + OAuth Google/Apple/Steam) che funge da identità
  cross-platform per cloud save e cross-play.
- Sessioni con JWT a breve scadenza + refresh token, rotazione automatica, revoca lato server in
  caso di cambio password/logout remoto (schermata Impostazioni > Account, doc 09).
- Collegamento opzionale multi-piattaforma (es. account Steam + Apple ID collegati allo stesso
  profilo) con conferma esplicita a due fattori per evitare furti di account via merge accidentale.

## Database — schema concettuale principale (PostgreSQL)

| Tabella | Contenuto chiave |
|---|---|
| `players` | id, nome visualizzato, livello profilo, xp, valute (semi_oro, humus, cristalli), data creazione |
| `player_plants` | player_id, plant_id, stadio_evoluzione, data_sblocco |
| `player_progress` | player_id, level_id, stelle, miglior_tempo, tentativi |
| `player_missions` | player_id, mission_id, progresso, scadenza, stato |
| `player_achievements` | player_id, achievement_id, data_completamento |
| `transactions` | id, player_id, tipo (acquisto/guadagno/spesa), valuta, importo, timestamp, riferimento |
| `pvp_matches` | id, player_a_id, player_b_id, esito, delta_mmr, replay_ref, timestamp |
| `leaderboards` | tipo (survival_bioma, pvp_stagione), player_id, punteggio, stagione |
| `cloud_saves` | player_id, versione_schema, blob_stato (JSON), timestamp, checksum |

Tutte le tabelle economiche (`transactions`) sono **append-only** (mai update/delete diretti) per
audit e per poter ricostruire il saldo in caso di dispute/anti-cheat.

## Matchmaking PvP

- Rating **Glicko-2** (più robusto di Elo puro con partite non frequentissime, tipico di un
  matchmaking F2P) memorizzato per giocatore, con deviazione di rating che si allarga se il
  giocatore è inattivo (permette convergenza più rapida al rientro).
- Coda in Redis: il servizio matchmaking cerca il candidato più vicino per MMR, allargando la
  finestra di tolleranza ogni 5s di attesa (comunicato in UI, doc 09) fino a un tetto massimo
  dopo 30s (a quel punto accetta il miglior candidato disponibile per non far attendere
  indefinitamente).
- Code separate per Ranked/Amichevole/Co-op, e per Input Method nei primi 6 mesi (doc 12).

## Sincronizzazione partite online (PvP/Co-op)

- Il **Simulation Core deterministico a tick fissi** (doc 03/12) consente un modello a basso
  overhead: i client si scambiano solo eventi di intent (es. "tick 340: gioca Baccello Tiratore
  in colonna 3 corsia 2") tramite il Servizio Real-time via WebSocket (fallback UDP su piattaforme
  che lo supportano per ridurre latenza), non lo stato completo del mondo.
- Il server mantiene una copia "ombra" della simulazione (stesso Simulation Core, headless) per
  validare che ogni intent sia legale (Linfa sufficiente, cooldown rispettato, tile valida) prima
  di inoltrarlo all'altro client — se un client locale è stato manomesso, il server è comunque
  l'arbitro finale del risultato (anti-cheat strutturale, non solo euristico).
- **Riconnessione**: in caso di disconnessione <30s, il client può rientrare nella sessione
  richiedendo al server lo storico di intent mancanti e ri-simulando localmente fino al tick
  corrente (catch-up deterministico, nessuna richiesta di stato "pesante").
- **Replay**: ogni partita ranked salva la sequenza di intent (dati minuscoli, pochi KB) più il
  seed iniziale — il replay si ottiene ri-eseguendo il Simulation Core, non registrando video
  (storage estremamente efficiente).

## Salvataggio cloud (dettaglio tecnico, riferimento a doc 08)

- Il client mantiene sempre una copia locale (SQLite) autorevole per il gameplay offline; ad ogni
  evento significativo invia un **delta di stato** (non l'intero blob) al servizio cloud save.
- **Merge non distruttivo per campo** in caso di conflitto multi-device (doc 08): il servizio
  applica una policy per tipo di campo:
  - Valute: **somma** dei delta guadagnati offline su device diversi nello stesso intervallo
    (mai sottratta due volte la stessa spesa, grazie al log `transactions` append-only usato come
    fonte di verità per ricostruire il saldo, non un semplice campo `saldo_attuale` sovrascritto).
  - Progresso livelli/stelle: **massimo** tra i due valori.
  - Missioni/achievement: **unione** degli stati completati.
  - Mazzo attivo/preferenze cosmetiche: **timestamp più recente vince** (dato non critico
    economicamente, l'utente può sempre ri-modificarlo).
- Versionamento schema (`versione_schema` in tabella `cloud_saves`) con migrazioni automatiche
  lato server per garantire compatibilità quando il gioco riceve aggiornamenti (doc 15).

## Sicurezza e anti-cheat

- Validazione server-side di ogni transazione economica (nessun client può auto-assegnarsi Semi
  d'Oro: il client richiede, il server calcola e conferma).
- Rate limiting su tutte le API pubbliche (protezione da bot/farming automatizzato).
- Firma/hash dei replay per rilevare manomissioni post-hoc prima di mostrarli in leaderboard
  pubbliche.
- Monitoraggio anomalie (win-rate anomalo, pattern di intent impossibili dato il tick rate) con
  flag automatico per revisione umana prima di eventuali sanzioni (mai ban automatico
  istantaneo su euristiche singole, per evitare falsi positivi).
