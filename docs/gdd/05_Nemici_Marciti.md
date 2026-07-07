# 05 — Nemici: I Marciti

## Concept e regole di leggibilità

I Marciti sono involucri di legno, paglia, muschio e spore animati dalla Piaga Cinerea: **niente
sangue, niente carne**, morte sempre comica (si sgretolano in foglie secche e un piccolo sbuffo
di polvere). Ogni Marcito segue la regola **"forma = funzione"**: la sua silhouette comunica
immediatamente il suo comportamento (un Marcito corazzato è tozzo e metallico, un Marcito volante
ha un pallone di spore rigonfio, un Marcito veloce ha un profilo affusolato in avanti).

## Architettura IA: Direttore delle Ondate + Macchina a Stati

### Direttore delle Ondate (Wave Director)
Sistema server-authoritative/lato-client deterministico che decide **quando e cosa** spawnare,
non solo da uno script fisso ma con una componente adattiva:
- Ogni livello ha una **sequenza base** di ondate (autore del livello) che garantisce la
  progressione narrativa/di difficoltà voluta.
- Il Direttore osserva in tempo reale: Linfa disponibile del giocatore, numero di piante vive,
  danni subiti dall'Arca nelle ultime ondate → applica un moltiplicatore di pacing (±15% max, mai
  invisibile: un giocatore in enorme difficoltà vede le ondate diradarsi leggermente, mai il
  contrario) per evitare frustrazione senza eliminare la sfida (equivalente filosofico del "Rubber
  banding" di Mario Kart, applicato con moderazione e trasparenza in un indicatore "Intensità
  Ondata" a schermo).
- L'**ondata finale** di ogni livello è sempre annunciata (bandiera + stinger musicale) e non è
  mai soggetta ad attenuazione: deve restare il climax leggibile e prevedibile della run.

### Macchina a stati per singolo Marcito
Ogni Marcito individuale gira su una FSM (Finite State Machine) condivisa, specializzata per
archetipo:

```
Spawn → Avanzata (movimento in corsia)
   → [se raggio d'attacco di una pianta] → Attacco (loop attacca/avanza se pianta muore)
   → [se HP < soglia individuale, solo su varianti "Vigliacche"] → Fuga (indietreggia, poi riprende Avanzata)
   → [se possiede abilità Chiamata] → Chiamata Rinforzi (una tantum, poi torna Avanzata)
   → [su morte] → Decesso (animazione + eventuale effetto post-mortem: esplosione, sciame, spore)
```

Le varianti "speciali" aggiungono stati propri (es. `Scavo` per il Marcito Scavatore, `Volo` per
l'Aerostato) descritti nella scheda del singolo nemico.

## Tabella statistiche (valori base Mondo 1–2, scalano vedi doc 06)

| # | Nome | Categoria | HP | Velocità | Danno/colpo | Comportamento chiave |
|---|---|---|---|---|---|---|
| 1 | Marcito Comune | Camminatore | 200 | Normale | 15 | Nessuna specialità: il "metro" di bilanciamento |
| 2 | Marcito Cappello di Paglia | Corazzato L1 | 380 | Normale | 15 | 1 strato d'armatura (si stacca con effetto visivo) |
| 3 | Marcito Elmo di Latta | Corazzato L2 | 650 | Normale | 18 | 2 strati d'armatura |
| 4 | Marcito Corazza Piena | Corazzato L3 | 1000 | Lenta | 25 | 3 strati, immune a rallentamenti finché corazzato |
| 5 | Marcito Saltatore | Mobilità | 300 | Rapida | 15 | Salta il primo Muro incontrato (non il Guardiano Ancestrale) |
| 6 | Marcito Scavatore | Mobilità | 250 | Normale | 20 | Sparisce sottoterra, riemerge 2-4 colonne avanti |
| 7 | Marcito Aerostato | Mobilità | 200 | Lenta (volo) | 15 | Vola sopra le piante terrestri, ignora terreno |
| 8 | Marcito Rampicante | Mobilità | 220 | — (cala dall'alto) | Rapisce 1 pianta | Cala su una colonna a caso, ruba una pianta e risale |
| 9 | Marcito Gelido | Speciale | 1400 | Molto lenta | 30 | Lascia scia Ghiacciata dietro di sé |
| 10 | Marcito Slittino | Speciale | 300 | Molto rapida | 20 (x fino a 3 corsie) | Scivola dritto attraversando più corsie sulla scia Ghiacciata |
| 11 | Marcito Operaio | Anti-pianta | 260 | Normale | 15 | Rimuove Vite Spinata / disinnesca trappole in 2s di contatto |
| 12 | Marcito Scudato | Corazzato | 500 (scudo 250 + corpo 250) | Normale | 15 | Scudo frontale blocca proiettili finché non si rompe |
| 13 | Marcito Lettore | Corazzato | 400 | Normale (Rapida se scudo rotto) | 15 (25 se in rabbia) | Ignora danno da un lato finché il "giornale" non si rompe, poi accelera e infuria |
| 14 | Marcito Tiratore | A distanza | 220 | Normale | 12 (a distanza, ranged) | Attacca le piante da lontano prima di raggiungerle |
| 15 | Marcito Nuotatore | Acquatico | 240 | Normale (in acqua) | 15 | Attivo solo su tile Allagate/livelli palude |
| 16 | Marcito Danzante | Supporto | 350 | Normale | 15 | "Incanta" 1 pianta (smette di attaccare 4s), evoca 2 Marciti Ballerini deboli/ondata |
| 17 | Marcito Scoppiettante | Esplosivo | 150 | Rapida | 300 (area, suicida) | Corre verso la pianta più vicina ed esplode a contatto |
| 18 | Marcito Nebbioso | Supporto | 300 | Normale | 15 | Genera una nube che -30% raggio di mira delle piante vicine |
| 19 | Marcito Velenoso | Corpo a corpo | 280 | Normale | 10 + veleno (10/tick × 5) | Il suo attacco applica Avvelenamento (danno nel tempo) |
| 20 | Marcito Ladro | Furto | 260 | Rapida | 15 | Ruba il 50% Linfa prodotta dal produttore adiacente finché in vita |
| 21 | Marcito Furtivo | Stealth | 240 | Normale | 15 | Invisibile finché non è a 2 caselle da una pianta o sotto Nebbia di Spore |
| 22 | Marcito Rampollo | Mini | 120 | Rapida | 20 | Lanciato dal Marcito Colossale, kamikaze rapido |
| 23 | Marcito Colossale | Mini-boss | 3500 | Lenta | 120 (schianto, distrugge 1 pianta in un colpo) | Ogni 15s lancia un Marcito Rampollo 3 colonne avanti |
| 24 | Marcito Reginetta | Supporto | 500 | Normale | 15 | Evoca 1 Marcito Comune ogni 12s finché in vita |
| 25 | Marcito Corazza Reattiva | Corazzato | 450 | Normale | 15 | Ogni colpo melee subito infligge danno di ritorno al mittente |
| 26 | Marcito Ubriaco | Erratico | 260 | Variabile | 15 | Cambia corsia ogni 3-5s con pattern telegrafato (freccia a schermo) |
| 27 | Marcito Sciame | Divisione | 300 | Normale | 12 | Alla morte si divide in 3 Marciti Sciame Minori da 60 HP ciascuno |
| 28 | Marcito Blindato Ruotato | Rapido | 180 | Altissima | 20 (travolge, danneggia tutte le piante attraversate) | Prima ondata "rompi-ghiaccio": ignora la prima pianta incontrata |
| 29 | Marcito Spora Madre | Esplosivo | 320 | Normale | 15 | Alla morte rilascia nube velenosa area 2 tile per 6s |
| 30 | Marcito Cristallizzato | Corazzato | 600 | Normale | 18 | Immune a rallentamenti; alla morte lascia schegge di ghiaccio (danno passivo terreno per 8s) |

## Sinergie tra Marciti (l'IA "gioca in squadra")

Il Direttore delle Ondate compone deliberatamente combinazioni con sinergie offensive, sempre
telegrafate da un'icona "ondata combinata" prima dello spawn:
- **Scudato + Tiratore**: lo Scudato assorbe i proiettili delle piante mentre il Tiratore colpisce
  da dietro, indisturbato.
- **Nebbioso + Furtivo**: la nebbia nasconde il Furtivo ben oltre il suo raggio stealth naturale.
- **Ladro + Danzante**: il Danzante incanta la pianta produttrice, il Ladro ne drena la Linfa
  residua.
- **Colossale + Sciame**: il tank assorbe l'attenzione mentre gli sciami saturano le corsie
  laterali.

## I 6 Boss — gli Araldi della Piaga

Ogni boss ha **3 fasi** con pattern leggibili (telegraph da 1.5s prima di ogni attacco speciale,
sempre con colore/audio distintivo) e una fase di vulnerabilità in cui il danno delle piante è
amplificato (+50%), per dare ritmo di "burst window" simile ai boss action moderni ma restando
in un contesto tower-defense (il giocatore non controlla un personaggio, ma ottimizza il campo
per superare ogni fase).

### Araldo della Ruggine (Mondo 1, tutorial boss)
- **Fase 1 (100–70% HP)**: avanza lentamente, evoca Marciti Comuni ogni 10s.
- **Fase 2 (70–30% HP)**: si copre di rottami (+50% armatura), martella una colonna a caso
  distruggendo tile (diventano Bruciato) — il giocatore deve evitare di piazzare piante pesanti lì.
- **Fase 3 (30–0%, "Vulnerabile")**: perde l'armatura, si muove più rapido ma -50% HP max
  residuo: finestra di burst finale.

### Araldo delle Spore (Mondo 2)
- Fase 1: genera Nebbia di Spore permanente sull'intera griglia.
- Fase 2: evoca coppie Marcito Velenoso/Marcito Spora Madre.
- Fase 3 (Vulnerabile): esplode in nubi velenose periodiche telegrafate, ma il suo attacco
  diretto si ferma (deve "ricaricare" lo sputo, finestra di burst).

### Araldo delle Braci (Mondo 3)
- Fase 1: alterna cicli giorno/notte accelerati (ogni 20s invece che per livello).
- Fase 2: incendia 3 tile a caso ogni 15s (Bruciato).
- Fase 3 (Vulnerabile): "consuma" la propria armatura di braci come ultimo attacco ad area enorme
  telegrafato 3s prima — il giocatore deve avere un muro Ancestrale pronto o subire danno diretto
  all'Arca.

### Araldo del Gelo (Mondo 4)
- Fase 1: ghiaccia 1 corsia intera ogni 12s (rallenta tutte le piante lì presenti).
- Fase 2: evoca Marciti Slittino a raffica.
- Fase 3 (Vulnerabile): si blocca in un blocco di ghiaccio autoinflitto per 4s (immune ma
  inoffensivo) prima di rompersi e tornare aggressivo — finestra per riorganizzare le difese.

### Araldo delle Tempeste (Mondo 5)
- Fase 1: vento costante che devia i proiettili ad arco (vedi doc 03).
- Fase 2: fulmini casuali (ma telegrafati con un cerchio a terra 2s prima) su tile a caso,
  distruggono piante non protette.
- Fase 3 (Vulnerabile): vola più in alto (colpibile solo da piante anti-aereo tipo Cactus
  Tiratore) mentre scarica un attacco continuo sull'Arca.

### Re Marcio, il Cuore Cinereo (finale, Mondo 6)
Boss narrativo a 3 fasi legate al **Rito della Rifioritura** (doc 02):
- **Fase 1 — Radici Corrotte**: attacca con tentacoli di radice da entrambi i lati della griglia,
  il giocatore deve mantenere in vita due linee difensive parallele.
- **Fase 2 — Cuore Esposto**: dopo aver piantato il primo Seme Ancestrale nel punto designato,
  il Re Marcio invoca ondate massicce di tutte le categorie di Marciti viste finora (un "greatest
  hits" del roster) per proteggere il proprio nucleo.
- **Fase 3 — Rifioritura**: piantati tutti e 3 i Semi Ancestrali, il combattimento diventa una
  "difesa della guarigione" a tempo (90s) in cui ondate finali di Marciti tentano disperatamente
  di corrompere di nuovo i Semi appena piantati: sopravvivere = epilogo (doc 02).

## Contro-gioco (counterplay) — leggibilità delle debolezze

Ogni Marcito ha almeno **una debolezza chiaramente sfruttabile** con piante già disponibili nel
mondo in cui appare, mai una debolezza "segreta": es. il Marcito Aerostato viene sempre
introdotto nello stesso livello in cui si sblocca/ricorda al giocatore il Cactus Tiratore; il
Marcito Scudato è sempre affiancato in tutorial-ondata da un prompt UI che suggerisce "colpisci
da un altro angolo" per chi possiede Alga Elettrica o Vento di Semi (perforante, ignora lo scudo
frontale — regola esplicita: i proiettili perforanti bypassano il valore scudo ma non
l'armatura a strati).
