# 08 — Eventi Stagionali, Missioni, Obiettivi, Achievement, Profilo

## Eventi stagionali

- Cadenza: **1 evento maggiore ogni 6 settimane** (allineato alla stagione Battle Pass, doc 15) +
  micro-eventi weekend (48h) tra un evento maggiore e l'altro.
- Struttura di un evento maggiore:
  1. **Tema narrativo** legato al calendario reale ma reinterpretato nella lore di Vridia (es.
     evento "Luna del Raccolto" in autunno, "Gelo Millenario" in inverno, "Fioritura di
     Primavera", "Solstizio delle Braci" in estate) — mai riferimenti diretti a festività reali
     per restare culturalmente neutri a livello globale, ma tono ed estetica coerenti.
  2. **Mini-campagna** di 5-8 livelli a tema, con 1-2 Marciti Mitici esclusivi e 1 pianta Mitica
     esclusiva sbloccabile solo completando l'evento (mai dietro paywall diretto).
  3. **Traguardi a punti evento**: si accumulano punti giocando qualunque modalità durante
     l'evento (bonus punti nei livelli a tema), sbloccando una scala di ricompense fissa (non
     RNG) fino a un tetto massimo.
  4. **Leaderboard evento** (opzionale, per la fascia competitiva) con cosmetici esclusivi per i
     primi percentili.
- Gli eventi passati tornano in **rotazione "Archivio delle Stagioni"** 2-3 volte l'anno in forma
  ridotta (senza la valuta a tempo limitato originale, ma con le stesse ricompense cosmetiche
  ancora ottenibili per chi le ha perse) per rispetto del giocatore che si unisce più tardi.

## Missioni giornaliere

- **3 missioni al giorno**, reset a mezzanotte fuso orario locale del dispositivo, sempre
  completabili in modalità qualsiasi (nessun obbligo di spendere valuta reale o energia):
  esempi: "Vinci 2 livelli qualsiasi", "Usa 5 volte un'abilità attiva", "Raccogli 500 Linfa",
  "Sconfiggi 20 Marciti Corazzati".
- **Streak giornaliera**: ricompensa crescente per giorni consecutivi di accesso (7 giorni =
  ricompensa maggiore, cap a 28 giorni poi loop), con un "salvagente" di 1 giorno di assenza
  perdonata a settimana per rispetto della vita reale del giocatore (feature pro-consumatore
  esplicita).

## Obiettivi settimanali

- 3 obiettivi più corposi a settimana (es. "Completa una run di Sopravvivenza fino all'ondata
  20", "Vinci 3 partite PvP", "Evolvi 2 piante a Fiorita"), ricompensa Humus/Cristalli di Rugiada
  gratuiti in piccola quantità.

## Achievement (permanenti, ~120 al lancio)

Categorie:
- **Progressione** (completa Mondo X, raggiungi Livello Profilo Y) — 20 achievement.
- **Collezione** (sblocca N piante, evolvi N piante ad Ancestrale, crea N Fusioni) — 25.
- **Maestria di combattimento** (vinci un livello senza Semi di Riserva, vinci senza subire
  danni, usa 10 famiglie diverse in un mazzo) — 30.
- **Modalità** (raggiungi ondata 50 in Sopravvivenza, vinci 50 partite PvP, completa 10 Sfide) — 25.
- **Segreti/curiosità** (scopri easter egg nel Codex, completa un livello con un mazzo di sole
  piante Comuni) — 20.
- Ricompense: Semi d'Oro, titoli visualizzabili sul profilo, cornici avatar, e per gli
  achievement più rari skin cosmetiche esclusive (mai piante o vantaggi statistici).

## Sistema di progressione del profilo

- **Card Profilo** pubblica: avatar (sbloccabile da achievement/eventi), cornice, titolo,
  Livello Profilo, pianta "vetrina" preferita (mostrata in matchmaking PvP), badge stagione
  ranked più alta raggiunta.
- **Statistiche permanenti** tracciate e visibili (vedi doc 09 schermata Statistiche): livelli
  completati, Marciti sconfitti per categoria, ore di gioco, pianta più utilizzata, win-rate PvP,
  record Sopravvivenza per bioma.
- **Codex del Giardino**: enciclopedia sbloccabile per ogni pianta/Marcito/boss incontrato, con
  lore, statistiche e (per le piante) un piccolo "diorama" 3D ruotabile — sistema di
  completamento parallelo che non influisce sul gameplay ma alimenta la fantasia
  collezionistica.

## Salvataggio cloud

- Salvataggio automatico **locale + cloud** ad ogni evento significativo (fine livello, acquisto,
  evoluzione, modifica mazzo) — nessun pulsante "salva" manuale richiesto.
- **Sincronizzazione cross-device**: login con account unico (doc 13) consente di continuare la
  partita su un altro dispositivo/piattaforma nello stesso punto esatto, incluso lo stato delle
  missioni giornaliere e il tempo restante degli eventi.
- **Risoluzione conflitti**: in caso di doppia sessione offline su due device, vince il
  salvataggio con timestamp più recente **per singolo campo** (merge non distruttivo: es. Semi
  d'Oro sommati se guadagnati offline su entrambi i device in sessioni isolate, progressi livello
  presi dal più avanzato) — dettagli tecnici in doc 13.

## Sistema di ricompense — riepilogo cross-funzionale

Tutte le fonti di ricompensa (doc 06 economico + eventi/missioni/achievement di questo
documento) confluiscono in un'unica **Cassetta delle Ricompense** in home screen: un badge
notifica accumula tutte le ricompense pendenti da ritirare con un singolo tocco "Ritira tutto",
per minimizzare la frizione UI (principio UX "mai far cercare al giocatore dove sono le sue
ricompense").
