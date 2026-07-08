# 07 — Modalità di Gioco

## Campagna
Descritta in doc 02/06: 6 mondi, ~95 livelli, narrativa lineare con livelli speciali e
"Memoria". Unica modalità con progressione a stelle e sblocco piante deterministico. Salvataggio
di progresso automatico + cloud (doc 13).

## Sopravvivenza (Radici Infinite)

- Modalità endless per bioma: il giocatore sceglie un mondo già completato in campagna come
  "scenario" (eredita palette, meteo tipici, roster nemici di quel bioma) ed affronta ondate
  crescenti senza fine, con un moltiplicatore di difficoltà che sale ogni 3 ondate.
- **Regola chiave**: a differenza della campagna, in Sopravvivenza il giocatore sceglie il proprio
  mazzo **prima** di iniziare (10 piante) e non riceve piante extra a metà partita: pura prova di
  ottimizzazione del mazzo.
- Ogni 10 ondate: **checkpoint di scelta** — il giocatore sceglie 1 di 3 potenziamenti temporanei
  casuali ma **sempre dichiarati in anticipo** (mai a scatola chiusa) validi solo per quella run
  (es. "+20% danno famiglia Baccello", "Ricarica seme -15% globale", "Il prossimo Muro piazzato è
  gratuito"), sistema roguelite leggero che aumenta la rigiocabilità.
- Classifica leaderboard per bioma (ondata massima raggiunta, tempo), stagionale (reset ogni 6
  settimane, ricompense scalari a fascia di classifica).
- Ricompensa: Humus e Semi d'Oro proporzionali all'ondata raggiunta, con un bonus una-tantum al
  primo superamento di ogni soglia (10/25/50/100 ondate).

## Sfide (Puzzle del Giardino)

Livelli puzzle isolati, non lineari, con regole speciali fisse (nessuna dinamicità del Direttore
delle Ondate: sempre lo stesso layout, per essere confrontabili e "speedrunnabili"):
- **Mazzo Vincolato**: il gioco assegna un mazzo fisso di piante insolite, il giocatore deve
  vincere adattandosi.
- **Un solo colpo**: HP dell'Arca = 1, qualunque errore è game over immediato (test di
  precisione).
- **Vaso di Linfa**: Linfa iniziale fissa, nessuna produzione ulteriore permessa per tutto il
  livello (test di efficienza economica).
- **Specchio dei Marciti**: il giocatore controlla i Marciti contro un'ondata di piante IA
  difensive (introduce da un lato la fantasia PvP, usata anche come tutorial per la modalità PvP).
- Nuove Sfide settimanali curate dal team live-ops (doc 15), con leaderboard a tempo e
  ricompense cosmetiche esclusive.

## PvP Online — Radici in Conflitto

Modalità asimmetrica 1v1 online, ispirata concettualmente a Plants vs. Zombies: Garden Warfare ma
mantenuta 2D/2.5D lane-based per restare fedele al core loop:

- **Setup**: i due giocatori si alternano ruolo Custode (piante, difende) e Araldo (Marciti,
  attacca) in 2 manche su una griglia condivisa asincrona-simultanea (entrambi giocano in tempo
  reale sulla stessa griglia vista da prospettive opposte); vince chi, sommando le due manche,
  infligge/subisce meno danno netto all'Arca.
- **Economia PvP**: entrambi i giocatori ricevono Linfa (Custode) o "Spore" (risorsa equivalente
  per l'Araldo, usata per schierare Marciti) allo stesso tasso, garantendo parità.
- **Mazzo PvP**: 8 piante / 8 tipi di Marciti selezionati pre-partita da una collezione
  "bilanciata" separata dalla PvE (le statistiche PvP sono normalizzate lato server
  indipendentemente dal livello di evoluzione posseduto in campagna, per garantire un
  matchmaking basato su abilità e non su spesa/tempo investito).
- **Matchmaking**: basato su MMR (rating nascosto stile Glicko-2, dettagli in doc 13), stagioni
  ranked da 8 settimane con tier (Germoglio → Fiore → Radice d'Oro → Fioritura Leggendaria),
  reset soft a fine stagione, ricompense cosmetiche per tier raggiunto.
- **Modalità ranked e non ranked**: "Amichevole" (non modifica MMR, per provare mazzi nuovi) e
  "Competitiva" (ranked).
- **Spettatore/Replay**: ogni partita ranked è salvata come replay deterministico (grazie al
  modello a tick fisso, doc 03/12) e rivedibile dal profilo.

## Cooperativa

- **Co-op locale/online (2 giocatori)** su livelli di campagna dedicati "Co-op" (non gli stessi
  della campagna solitaria, per evitare di banalizzare la sfida): griglia condivisa 5×9 ma
  entrambi i giocatori piazzano piante dalla propria metà di mazzo, con Linfa condivisa in un
  pool comune per incentivare la comunicazione.
- **Ruoli asimmetrici opzionali**: un giocatore può scegliere il ruolo "Coltivatore" (focus
  economia/supporto, accesso prioritario a Radice-Madre/Fiore) e l'altro "Difensore" (focus
  attacco/muro), con un moltiplicatore di ricompensa +10% se i due ruoli sono scelti in modo
  complementare (incentivo, non obbligo).
- **Co-op Sopravvivenza**: le due modalità sopra si combinano anche in endless.
- Cross-play completo PC/mobile/console per il co-op (vedi doc 12/13).

## Riepilogo modalità e progressione condivisa

Tutte le modalità (Campagna, Sopravvivenza, Sfide, PvP, Co-op) alimentano lo **stesso profilo**:
XP, Semi d'Oro, Humus e achievement sono condivisi; solo il mazzo PvP è normalizzato per motivi
di fairness competitiva. Questo garantisce che ogni modalità sia "utile" a prescindere dalla
preferenza del giocatore, pilastro chiave di ritenzione a lungo termine.
