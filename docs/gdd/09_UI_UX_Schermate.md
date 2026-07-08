# 09 — UI/UX: Schermate del Gioco

## Principi UX trasversali

- **Regola dei 3 tocchi**: qualunque azione ricorrente (giocare un livello, ritirare ricompense,
  cambiare mazzo) deve essere raggiungibile in massimo 3 tocchi dalla home.
- **Feedback immediato**: ogni bottone ha stato hover/press entro 1 frame, ogni azione con costo
  (Semi d'Oro, Cristalli) mostra sempre un riepilogo di conferma con il nuovo saldo previsto
  *prima* della conferma finale.
- **Coerenza cromatica**: header verde-oro (tema "vita") in tutte le schermate meta, header
  grigio-cenere (tema "minaccia") solo nelle schermate di combattimento/sconfitta, per rinforzare
  subconsciamente lo stato del giocatore.
- **Accessibilità**: scalabilità testo 100-150%, modalità daltonismo (ridisegna le icone di
  stato con simboli oltre al colore), supporto screen reader su tutti i menu (non nel campo di
  gioco in tempo reale, per limiti tecnici), navigazione 100% a controller su console.

## 1. Menu Principale

**Layout**: scena 3D "viva" in background (l'Arca Radice ancorata su un'isola, con Norun visibile
in un angolo che reagisce se toccato — easter egg/battuta casuale). HUD minimale sovrapposto:
- **In alto a sinistra**: Card Profilo compatta (avatar, Livello, barra XP).
- **In alto a destra**: contatori valute (Semi d'Oro, Cristalli di Rugiada) sempre visibili, con
  "+" cliccabile per il Negozio.
- **In alto centro**: badge Cassetta delle Ricompense (se ci sono ricompense pendenti, pulsa).
- **Centro-basso**: bottone primario grande "GIOCA" (porta a Selezione Livelli, contestuale:
  mostra il prossimo livello di campagna non completato).
- **Barra di navigazione inferiore** (5 icone sempre visibili): Campagna, Modalità (sottomenu
  Sopravvivenza/Sfide/PvP/Co-op), Collezione, Serra, Negozio.
- **Icona Impostazioni** (ingranaggio, angolo in alto a destra) ed **Eventi** (icona a tema,
  con countdown, appare solo se un evento è attivo) sempre accessibili.
- Transizione: swipe laterale o tocco icona → cross-fade 300ms verso la schermata scelta.

## 2. Selezione Livelli (Mappa del Mondo)

- **Mappa 2.5D a scorrimento** per ciascun Mondo (uno scenario illustrato continuo, non una
  griglia astratta): i livelli sono nodi lungo un sentiero, con l'icona del bioma che cambia
  gradualmente attraversando la mappa (transizione visiva coerente con l'avanzamento narrativo).
- Ogni nodo livello mostra: numero, stelle ottenute (0-3, contorno grigio se non ancora
  tentato), icona speciale se livello "Memoria" o "Speciale", lucchetto se non sbloccato.
- Nodo Boss: più grande, con silhouette dell'Araldo visibile anche a distanza.
- **Selettore Mondo** in alto: tab orizzontali scorrevoli con thumbnail bioma; i mondi non
  sbloccati sono visibili ma "velati" di cenere (motivazione a proseguire).
- Tocco su un nodo → **pannello Pre-Livello** (vedi sotto) invece di entrare direttamente, per
  permettere la revisione del mazzo.

## 3. Pannello Pre-Livello (overlay su Selezione Livelli)

- Anteprima meteo del livello (icona + tooltip), obiettivo (default: "sopravvivi a tutte le
  ondate" o obiettivo speciale testuale), difficoltà stimata (1-5 semi pieni).
- **Editor mazzo rapido**: griglia orizzontale scorrevole di carte piante possedute, drag-and-drop
  (o doppio tocco su mobile) per comporre il mazzo attivo; le piante nuove introdotte da questo
  livello sono evidenziate con un bordo pulsante "NUOVO".
- Bottone "Consiglio di Norun" (opzionale, non invasivo): suggerisce 1-2 piante utili contro le
  meccaniche del livello, per giocatori che vogliono aiuto senza obbligare nessuno a leggerlo.
- Bottone primario "PIANTA!" avvia il livello con fade-to-black + breve caricamento (target
  <2s su hardware di fascia media).

## 4. Inventario / Collezione Piante (Codex)

- **Griglia a schede** filtrabile per Famiglia, Rarità, Stato (posseduta/da sbloccare),
  ordinabile per potenza/data sblocco.
- Tocco su una carta → **Scheda Dettaglio** a schermo intero: modello 3D ruotabile con dito/mouse,
  statistiche complete (attuali + prossimo stadio evoluzione in confronto diretto "prima/dopo"),
  lore Codex, elenco sinergie note, bottone "Evolvi" (porta a Serra se i requisiti non sono
  soddisfatti, mostra cosa manca in rosso).
- Le carte non ancora sbloccate mostrano una **silhouette a icona indovinello** più il livello in
  cui compariranno per la prima volta (mai un semplice punto interrogativo vuoto: rispetta la
  curiosità ma dà un obiettivo concreto).

## 5. Serra (Evoluzione e Fusione)

- Ambientazione: interno stilizzato dell'Arca Radice, banco da lavoro con vasi.
- **Tab Evoluzione**: seleziona una pianta posseduta → mostra i requisiti (Semi d'Oro, Humus,
  Materiale Bioma) con progress bar per ciascuna risorsa mancante e bottone "Conferma" attivo
  solo a requisiti soddisfatti; animazione di crescita accelerata (2s) alla conferma.
- **Tab Fusione**: selezione dei due "genitori" da due slot drag-in, il gioco mostra subito se la
  combinazione corrisponde a una ricetta nota (anteprima carta ibrida) o se è "sconosciuta"
  (incoraggia la sperimentazione: alcune ricette non sono documentate nel Codex finché non
  scoperte almeno una volta, poi restano permanentemente visibili).
- Feedback sonoro/VFX ricco (vedi doc 10/11) per rendere la Serra una destinazione desiderabile,
  non un menu arido.

## 6. Negozio

- **Tab Cosmetici**: skin per piante/Marciti(PvP)/Arca, acquistabili in Cristalli di Rugiada;
  ogni skin ha un'anteprima animata a schermo intero prima dell'acquisto.
- **Tab Battle Pass**: barra dei livelli stagionali con doppia fila ricompense (gratuita/premium),
  bottone upgrade a premium ben visibile ma non invasivo (nessun popup a comparsa non richiesto).
- **Tab Offerte**: bundle a tempo (solo cosmetici/acceleratori, mai vantaggi statistici),
  countdown chiaro, mai più di 3 offerte simultanee per non affaticare la scelta.
- **Tab Valute**: acquisto diretto Cristalli di Rugiada con prezzi reali localizzati.

## 7. Profilo

- Header con avatar/cornice/titolo equipaggiati, bottone "Modifica" → selezione tra i cosmetici
  posseduti.
- Sezione Achievement (griglia con filtro completati/in corso/percentuale).
- Sezione Stagione Ranked corrente (rank PvP, progressi verso il prossimo tier).
- Bottone "Statistiche complete" → schermata dedicata (vedi sotto).

## 8. Statistiche

- Dashboard a schede scorrevoli: Generali (ore di gioco, livelli completati), Combattimento
  (Marciti sconfitti per categoria, con grafico a barre), Economia (Linfa totale raccolta, Semi
  d'Oro guadagnati/spesi), PvP (win-rate, streak, MMR storico a grafico a linee), Collezione
  (percentuale completamento Codex).
- Tutti i grafici hanno versione tabellare accessibile per screen reader.

## 9. Impostazioni

- Sezioni: Audio (slider indipendenti Musica/SFX/Voci/UI), Video (qualità grafica, framerate
  target, HDR se supportato), Controlli (rebind completo su PC/console, sensibilità touch su
  mobile), Accessibilità (vedi principi trasversali), Account (login, cloud save, logout,
  eliminazione account con doppia conferma), Notifiche (toggle per categoria: eventi, energia
  sociale/co-op, missioni), Lingua, Info Legali/Privacy.

## 10. Matchmaking (PvP)

- Schermata di ricerca con animazione "radici che si intrecciano" (evita la noia dell'attesa,
  target <20s di ricerca media); mostra il proprio rank/MMR e una barra di espansione progressiva
  del range di ricerca (trasparenza: "Espando la ricerca..." dopo 15s).
- **Schermata Ban/Pick mazzo** pre-partita (15s a testa, con timer visibile) per selezionare le 8
  piante/8 Marciti dal proprio roster PvP.
- **Schermata "Chi sei"**: countdown 3-2-1 con reveal del ruolo assegnato (Custode o Araldo per
  quella manche) e anteprima della griglia condivisa.

## 11. Schermata Vittoria

- Sequenza: freeze-frame dell'ultimo Marcito sconfitto → esplosione di petali/coriandoli →
  conteggio stelle (1-3) con animazione una alla volta e SFX crescente → riepilogo ricompense
  (Semi d'Oro, Humus, XP con barra che si riempie in tempo reale, eventuale level-up profilo
  con overlay dedicato) → bottoni "Prossimo Livello" (primario), "Ripeti" e "Torna alla Mappa"
  (secondari).
- Se è stata scoperta una nuova pianta/Fusione/achievement in quella run, un banner dedicato
  precede il riepilogo economico per dare risalto alla scoperta.

## 12. Schermata Sconfitta

- Tono deliberatamente leggero (coerente col pilastro "umorismo caldo"): l'Arca Radice viene
  "solleticata" dai Marciti invece di essere distrutta in modo drammatico, Norun commenta con
  una battuta diversa ogni volta (pool di 40+ battute per evitare ripetizione).
- Mostra comunque un riepilogo parziale (Linfa raccolta, Marciti sconfitti) e **ricompense
  ridotte ma non nulle** (principio anti-frustrazione: si guadagna sempre qualcosa, anche
  perdendo).
- Bottoni: "Riprova" (primario, riapre il Pannello Pre-Livello con lo stesso mazzo pre-caricato),
  "Modifica Mazzo", "Torna alla Mappa". Nessun invito diretto all'acquisto qui (evitare la
  percezione "pay to not lose", scelta etica esplicita).

## 13. HUD in-partita (riferimento trasversale)

- Barra Linfa in alto a sinistra con contatore numerico grande.
- Barra carte piante in basso, scrollabile orizzontalmente se >6 piante nel mazzo, con overlay
  di ricarica (radiale) e costo Linfa (rosso se non affordabile in quel momento).
- Indicatore meteo persistente in alto a destra con tooltip on-hover/press-and-hold.
- Indicatore "Intensità Ondata" (doc 05) sottile, non invasivo, in alto al centro.
- Pulsante pausa (angolo, apre overlay con Riprova/Impostazioni rapide/Torna alla Mappa, il gioco
  si mette in pausa reale solo in PvE; in PvP apre solo le opzioni audio/video senza pausare la
  partita in corso).
