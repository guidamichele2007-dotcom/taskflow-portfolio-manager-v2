# 03 — Gameplay Core e Sistema di Combattimento

## Il loop di gioco (core loop)

```
Scegli livello → Prepara mazzo (piante + fusioni) → Entra in campo
   → Raccogli Linfa → Piazza piante → Difenditi dalle ondate di Marciti
   → Usa abilità attive / sfrutta meteo e terreno → Sopravvivi a tutte le ondate
   → Vittoria: ricompense (Semi d'Oro, Humus, XP, stelle) → Torna alla mappa
   → Sblocca nuove piante/livelli → Migliora il mazzo → Ripeti
```

Sessione tipo: 3–6 minuti per livello standard, 8–12 minuti per boss, 5–15 minuti (a scelta del
giocatore) per Sopravvivenza.

## La griglia di gioco

- **5 corsie × 9 colonne** (identica a PvZ per leggibilità immediata e per non disorientare i
  giocatori storici), ma ogni **tile è un oggetto con stato**, non solo una cella vuota:
  - `Stato Terreno`: Normale, Bruciato, Ghiacciato, Allagato, Radicato (fertilizzato), Spore
    (corrotto).
  - Ogni stato modifica: velocità di movimento dei Marciti su quel tile, possibilità di
    piazzamento (es. solo piante acquatiche su tile Allagato), danno passivo (Bruciato),
    rallentamento (Ghiacciato), o bonus di crescita (Radicato aumenta la produzione di Linfa
    delle piante sopra del +20%).
- Alcuni **livelli speciali** hanno griglie non rettangolari (isole spezzate con "buchi", ponti
  di radici da far crescere con piante apposite) per variare la lettura spaziale senza rompere la
  regola dei 5×9 logici.

## Risorse ed economia in-partita

| Risorsa | Ottenuta da | Uso |
|---|---|---|
| **Linfa** | Girasole Solare e piante Produttrici, gocce ambientali, meteo Pioggia (+drop rate) | Piazzare piante |
| **Humus** | Nemici speciali "Fertili", casse di livello, missioni giornaliere | Evolvere piante (fuori dal match, nella Serra) |
| **Carica Abilità** | Si ricarica nel tempo per ogni pianta con abilità attiva | Attivare l'abilità speciale di una pianta piazzata |

Non esiste un timer di energia globale né un costo "vita" per ritentare un livello: il
free-to-play di ROOTGUARD monetizza tempo/estetica, non tentativi (vedi doc 15).

## Piazzamento e gestione delle piante

- Tocco/click su una carta pianta nella barra in basso → tocco su una tile valida → piazzamento
  istantaneo se Linfa sufficiente e cooldown di piantumazione scaduto (ogni pianta ha un
  "recupero seme" individuale, tipicamente 5–30s, come in PvZ).
- **Rimozione/Ritrapianto**: tenendo premuto su una pianta piazzata si apre un mini-menu "Disseppellisci"
  (rimuove la pianta recuperando il 50% del costo in Linfa, con un breve cooldown) — introduce
  decisioni di ri-adattamento a metà livello, specialmente utile quando il meteo cambia.
- **Abilità attive**: le piante che ne possiedono mostrano un'icona di carica sopra lo sprite;
  toccando la pianta quando la carica è piena si attiva l'effetto (es. un'esplosione d'area, uno
  scudo temporaneo, un boost di attacco ai vicini).

## Meteo dinamico

Ogni livello dichiara un meteo (o sequenza di meteo) nel suo file di configurazione; alcuni
livelli cambiano meteo a metà partita per forzare un adattamento:

| Meteo | Effetto sul campo |
|---|---|
| **Sole Cocente** | +30% danno piante di fuoco, -20% efficacia piante di ghiaccio, i tile si seccano più in fretta (rischio incendio) |
| **Pioggia** | +25% Linfa raccolta da produttori, spegne i tile in fiamme, piante elettriche -15% danno (rischio corto circuito), piante acquatiche possono essere piazzate ovunque |
| **Nebbia di Spore** | -40% raggio di mira dei tiratori a distanza, Marciti "Furtivi" invisibili finché non sono a 2 caselle, buff veleno ai Marciti |
| **Gelo** | Tutte le unità (piante e Marciti) non di ghiaccio -15% velocità di attacco/movimento, i tile allagati diventano ghiacciati |
| **Vento** | Proiettili ad arco deviati lateralmente in modo prevedibile (pattern fisso, non casuale, per restare leggibile), piante volanti spinte fuori rotta se non ancorate |

Il meteo è sempre annunciato con un'icona persistente in alto e un breve stinger audio/visivo al
cambio, per non violare il pilastro "leggibilità prima di tutto".

## Terreno modificabile

Alcune piante e alcuni Marciti alterano permanentemente lo stato di una tile per la durata del
livello:
- La **Torcia di Brace** brucia il tile sotto di sé (danno passivo ai Marciti che lo attraversano).
- Il **Marcito Gelido** ghiaccia i tile che calpesta.
- La **Ninfea Radice** trasforma un tile in Allagato, permettendo piante acquatiche.
- Il **Fungo Radicato** fertilizza i tile adiacenti (Radicato), bonus produzione.

Questo introduce un sotto-strato di ottimizzazione spaziale: *dove* si combatte cambia *cosa*
conviene piantare lì.

## Sinergie — Radici Connesse

Piante della stessa "famiglia radicale" (indicata da un'icona colore comune sulla carta)
piazzate in caselle adiacenti (ortogonali, non diagonali) attivano un bonus passivo automatico,
es.:
- Due piante **Famiglia Spina** adiacenti: +10% danno reciproco.
- Una pianta **Famiglia Radice-Madre** adiacente a qualsiasi produttore: +15% Linfa da quel
  produttore.
- Tre o più piante **Famiglia Fungo** in griglia (non necessariamente adiacenti): tutti i Fungo
  ottengono immunità al primo stato alterato subito per livello.

Le sinergie sono sempre mostrate in un pannello "Radici Connesse" richiamabile con un tasto
dedicato durante il combattimento, per restare leggibili senza dover essere memorizzate a mente.

## Fusione di Semi (crafting di piante ibride)

Nella schermata **Serra** (fuori dal match), il giocatore può combinare due piante base + Humus
per sbloccare una **carta ibrida** permanente nella propria collezione (non un consumabile
usa-e-getta):
- Esempio: `Pepe Esplosivo` (attacco fuoco ad area) + `Fungo Gelo` (rallentamento) →
  `Pepe Glaciale`: proiettile che infligge danno e rallenta, colma il gap tattico tra le due
  piante originarie.
- Ogni ibrido ha una propria scheda statistiche indipendente (non è una somma meccanica dei
  genitori, ma un design bilanciato a parte — vedi doc 04 per il roster completo inclusi 6
  ibridi presenti al lancio).
- Le fusioni richiedono che **entrambe le piante genitrici siano al livello di evoluzione
  "Fiorita"** prima di poter essere fuse, creando un obiettivo di progressione a medio termine.

## Combattimento: risoluzione di un turno (tick)

Il gioco gira a **tick fissi da 100ms** (10 tick/secondo) per garantire determinismo (importante
per replay, anti-cheat lato server nel PvP, e per il replay delle Sfide — vedi doc 12/13). Ad
ogni tick:

1. Aggiornamento stato meteo/terreno (se in transizione).
2. Movimento dei Marciti (velocità base modificata da stato tile e stati alterati).
3. Risoluzione attacchi piante (portata, cooldown, targeting per corsia o area).
4. Risoluzione attacchi Marciti su piante/barriera finale.
5. Applicazione/decadimento stati alterati (veleno, gelo, fuoco, stordimento).
6. Controllo condizioni di vittoria/sconfitta (ondata finale sopravvissuta / Marcito raggiunge
   l'Arca Radice).
7. Spawn della prossima ondata secondo il "Direttore delle Ondate" (vedi doc 05 — IA e pacing).

Questo modello a tick è descritto in dettaglio implementativo in
`packages/game-core/src/combat/CombatEngine.ts`.

## Condizioni di vittoria/sconfitta

- **Vittoria**: sopravvivere a tutte le ondate configurate per il livello (incluso l'eventuale
  "ondata finale/huge wave" con musica e telegraph dedicati, come l'iconica ondata finale PvZ).
- **Sconfitta**: un Marcito raggiunge e supera la colonna 0 (l'Arca Radice) su una qualsiasi
  corsia priva di una barriera aperta. Ogni livello concede fino a 2 "Semi di Riserva"
  (equivalente delle noci in PvZ) che fungono da barriera d'emergenza automatica, consumabile
  una volta per corsia.
- **Valutazione a stelle (1–3)**: 1 stella per vittoria, 2 se nessun Seme di Riserva usato, 3 se
  completato entro un tempo bersaglio o senza subire danni all'Arca — determina i bonus di
  ricompensa (vedi doc 06).
