# 04 — Roster delle Piante

## Framework comune a tutte le piante

- **Famiglie radicali** (determinano le sinergie "Radici Connesse", doc 03): 🟡 **Radice-Madre**
  (economia/supporto), 🟢 **Baccello** (attacco a proiettile), 🟩 **Foglia** (difesa/muro),
  🟣 **Fungo** (controllo/status, molti attivi solo di notte o con bonus notturno), 🔵 **Cristallo**
  (ghiaccio/elettrico), 🔴 **Brace** (fuoco), 🟤 **Spina** (danno da contatto/melee), 🌸 **Fiore**
  (utility/controllo speciale).
- **Rarità**: Comune → Non Comune → Raro → Epico → Leggendario → *Mitico* (esclusivo eventi
  stagionali, vedi doc 08). La rarità determina il costo di sblocco in Semi d'Oro e il tetto
  massimo di potenziamento, **non** un vantaggio nascosto: una Comune ben evoluta resta
  competitiva fino a fine gioco (principio anti pay-to-win).
- **Evoluzione** in 3 stadi, sempre eseguita nella schermata **Serra** fuori dal match:
  1. **Seme** (forma base, dal primo sblocco)
  2. **Fiorita** (richiede Livello Profilo minimo + Humus; +25% statistiche base, sblocca/potenzia
     l'abilità attiva se presente, nuova palette cromatica più vivida)
  3. **Ancestrale** (richiede materiale raro di bioma + Humus alto; +60% statistiche base rispetto
     al Seme, aggiunge un effetto secondario unico, nuovo modello con dettagli dorati/luminescenti)
- **Ricarica del seme**: tempo di attesa prima di poter ripiazzare la stessa carta (colonna
  "Ricarica" in tabella).
- **Portata**: `Melee` (1 tile adiacente), `Corsia` (tutta la corsia davanti), `Area` (raggio in
  tile attorno al bersaglio/sé stessa), `Globale` (intero campo).

## Tabella statistiche (valori a stadio Seme, bilanciati per Mondo 1–2; scalano vedi doc 06)

| # | Nome | Famiglia | Ruolo | Rarità | Costo Linfa | Ricarica | HP | Danno/colpo | Portata |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Girasole Solare | 🟡 | Produttore | Comune | 50 | 6s | 120 | — | — |
| 2 | Baccello Tiratore | 🟢 | Attaccante | Comune | 100 | 6s | 150 | 20 | Corsia |
| 3 | Muro di Corteccia | 🟩 | Muro | Comune | 75 | 25s | 1200 | 5 (contatto) | Melee |
| 4 | Patata Detonante | 🟢 | Trappola | Comune | 50 | 20s | 100 | 400 (area) | Area 1 |
| 5 | Baccello di Gelo | 🔵 | Attaccante/CC | Comune | 150 | 6s | 150 | 18 (+rallenta 30%) | Corsia |
| 6 | Vite Spinata | 🟤 | Terreno | Comune | 75 | 8s | 200 | 15 (passivo/tick) | Melee |
| 7 | Ninfea Radice | 🟡 | Utility | Comune | 50 | 8s | 100 | — | — |
| 8 | Fungo Lunare | 🟣 | Attaccante (notte) | Comune | 75 | 6s | 130 | 22 | Corsia |
| 9 | Baccello Gemello | 🟢 | Attaccante | Non Comune | 175 | 7s | 160 | 16×2 | Corsia |
| 10 | Muro Spinato | 🟩 | Muro | Non Comune | 125 | 25s | 1400 | 30 (contrattacco) | Melee |
| 11 | Fungo Gelo | 🟣 | Controllo | Non Comune | 125 | 30s | 100 | 10 (area, rallenta 50%) | Area 2 |
| 12 | Ciliegia Detonante | 🟢 | Istantanea | Non Comune | 150 | 25s | 100 | 550 (area) | Area 2 |
| 13 | Torcia di Brace | 🔴 | Utility | Non Comune | 175 | 8s | 200 | +proiettili infuocati (+50% dmg) | Melee (buff corsia) |
| 14 | Cactus Tiratore | 🟤 | Attaccante | Non Comune | 125 | 6s | 180 | 24 (terra+aria) | Corsia |
| 15 | Fungo Radicato | 🟣 | Utility | Non Comune | 100 | 10s | 120 | — (fertilizza) | Area 1 |
| 16 | Bulbo di Radice Madre | 🟡 | Produttore | Raro | 200 | 10s | 200 | — | — |
| 17 | Fungo Sonnifero | 🟣 | Controllo | Raro | 125 | 15s | 100 | — (addormenta) | Area 1 |
| 18 | Noce di Ghiaccio | 🔵 | Muro/CC | Raro | 175 | 25s | 1800 | 10 (aura rallenta) | Melee/Aura |
| 19 | Pepe Esplosivo | 🔴 | Istantanea | Raro | 175 | 30s | 100 | 500 (corsia intera) | Corsia |
| 20 | Rovo Strangolatore | 🟤 | Attaccante speciale | Raro | 225 | 35s | 350 | Ingoia (elimina 1 bersaglio) | Melee |
| 21 | Fiore Specchiante | 🌸 | Utility | Raro | 150 | 12s | 150 | Riflette 1 proiettile/8s | Corsia |
| 22 | Vento di Semi | 🌸 | Attaccante perforante | Raro | 175 | 7s | 140 | 26 (perfora tutti) | Corsia |
| 23 | Fungo Esplosivo | 🟣 | Istantanea AoE | Epico | 275 | 45s | 100 | 1200 (area grande) | Area 3 |
| 24 | Fiore Ipnotico | 🌸 | Controllo | Epico | 250 | 30s | 150 | Converte 1 nemico per 15s | Melee |
| 25 | Alga Elettrica | 🔵 | Attaccante area | Epico | 250 | 8s | 180 | 20 (fulmine a catena, 3 bersagli) | Corsia+Adiacenti |
| 26 | Guardiano di Corteccia Ancestrale | 🟩 | Muro definitivo | Epico | 250 | 40s | 3000 | 15 (contatto, blocca salti) | Melee |
| 27 | Girasole Aurora | 🟡 | Produttore/Cura | Leggendario | 200 | 8s | 250 | Cura 5%HP piante adiacenti/ciclo | — |
| 28 | Rovo del Crepuscolo | 🟤 | Attaccante speciale | Leggendario | 300 | 30s | 500 | 60 (+stordisce 2s) | Melee |
| 29 | Albero della Memoria | 🟡 | Utility globale | Leggendario | 350 | 60s | 400 | Pulsa +20% danno globale/10s ogni 30s | Globale |
| 30 | Corona di Spine Ancestrale | 🟤 | Muro/contrattacco | Leggendario | 275 | 35s | 2200 | 45 (contrattacco ad area) | Melee/Area 1 |

## Schede dettagliate

### 🟡 Famiglia Radice-Madre — Economia e supporto

**1. Girasole Solare** — *Il cuore pulsante di ogni giardino.*
- Passiva: produce 25 Linfa ogni ciclo di ricarica, oscillando dolcemente e rilasciando un
  piccolo bagliore dorato.
- Evoluzione Fiorita: produzione +25% (31 Linfa), petali che brillano al ritmo della musica.
- Evoluzione Ancestrale: rilascia anche 1 Humus ogni 5 cicli; corona di petali dorati animata.
- Punti di forza: nessuno, è la base dell'intera economia — sempre prioritaria nel primo
  piazzamento.
- Debolezze: 0 danno, muore in 2 colpi da nemici corpo a corpo se non protetta.
- Sinergie: adiacente a Fungo Radicato produce +15% Linfa; base di ogni sinergia "Radice-Madre".
- Animazione: dondolio idle a 2s di ciclo, "starnuto" di polline quando colpita ma non uccisa.
- VFX: particellare dorato ellittico al momento della produzione, con piccolo "cin" luminoso.

**7. Ninfea Radice** — Trasforma il tile sottostante in Allagato, permettendo il piazzamento di
piante acquatiche anche fuori dai livelli-palude; può essere piazzata anche su tile normali per
preparare il terreno in anticipo.
- Punti di forza: abilita build acquatiche fuori contesto, ottima con Alga Elettrica.
- Debolezze: 0 danno e 0 produzione diretta, investimento "di setup".
- Sinergie: obbligatoria per schierare Alga Elettrica fuori dai livelli-palude.
- Animazione: foglie che si aprono a raggiera quando piazzata; increspature d'acqua costanti.

**16. Bulbo di Radice Madre** — Versione avanzata: produce Linfa in un raggio (Area 1, nutre
anche eventuali produttori adiacenti +10%) invece che a se stessa soltanto.
- Sinergie: 2+ Bulbi adiacenti = bonus "Rete di Linfa" (+10% produzione globale del livello).

**27. Girasole Aurora (Leggendario)** — Oltre a produrre Linfa, cura il 5% HP massimo delle
piante adiacenti a ogni ciclo: trasforma l'economia in un ibrido supporto/sostentamento per
build difensive prolungate (Sopravvivenza, PvP).
- VFX: aura pulsante rosa-oro che si espande alle piante vicine ad ogni cura.

**29. Albero della Memoria (Leggendario)** — Non produce Linfa: ogni 30s pulsa un buff globale
"+20% danno a tutte le piante" per 10s, con telegraph audio-visivo chiaro (radici luminose che
attraversano tutta la griglia) per permettere di sincronizzare gli attacchi con la finestra di
buff.
- Debolezze: nessun danno/produzione diretta, costoso, ricarica lunga: pianta da build
  "ultimate", non da early game.

### 🟢 Famiglia Baccello — Attacco a proiettile

**2. Baccello Tiratore** — Lo shooter di base: spara un seme a distanza lungo la corsia.
- Evoluzione Fiorita: +25% danno, proiettile con scia luminosa verde.
- Evoluzione Ancestrale: 10% possibilità di colpo critico doppio danno.
- Debolezze: portata a corsia singola, nessuna copertura aerea (serve Cactus Tiratore).
- Sinergie: Torcia di Brace davanti nella stessa corsia infiamma i suoi proiettili (+50% danno).
- Animazione: masticazione/rigurgito del seme ogni colpo, foglia che si piega all'indietro nel
  "rinculo".

**4. Patata Detonante** — Trappola instabile: si arma dopo 8s dal piazzamento (segnalata da
un'icona "occhio aperto" sopra la pianta) ed esplode al primo contatto nemico, infliggendo
grande danno in area.
- Debolezze: inutile se un nemico la calpesta prima dell'armamento (viene semplicemente distrutta
  senza danno) — richiede tempismo di piazzamento.

**9. Baccello Gemello** — Spara due semi per colpo, utile contro bersagli con armatura a strati
(vedi Marciti Corazzati, doc 05).

**12. Ciliegia Detonante** — Istantanea ad area medio-grande, danno alto, nessuna difesa propria
dopo l'esplosione (si consuma).

**19. Pepe Esplosivo** — Istantanea che incendia l'intera corsia bersaglio per 3s (danno passivo
ai nemici che la attraversano nel frattempo), ottima contro orde numerose in singola corsia.

### 🟩 Famiglia Foglia — Difesa

**3. Muro di Corteccia** — Il tank base: altissimo HP, danno da contatto trascurabile, unico
scopo è assorbire colpi e guadagnare tempo.
- Evoluzione Ancestrale: rigenera 2% HP max/ciclo se non attaccato per 5s consecutivi.

**10. Muro Spinato** — Come il Muro di Corteccia ma restituisce danno da contrattacco a ogni
colpo subito (30 danno), ottimo contro Marciti a basso HP che si accumulano.

**26. Guardiano di Corteccia Ancestrale (Epico)** — Muro definitivo: unico in grado di **bloccare
i Marciti "Saltatori"** che normalmente scavalcano un muro normale (meccanica equivalente al
Tall-nut contro i pole-vault zombie, vedi doc 05).

### 🟣 Famiglia Fungo — Controllo e status (bonus notturno)

**8. Fungo Lunare** — Attaccante base della famiglia Fungo: di giorno costa il doppio di Linfa
per essere piazzato (150 invece di 75) per bilanciare il fatto che di notte ha +20% danno e
ricarica -20%; introduce la meccanica giorno/notte già dal Mondo 1 in versione soft, pienamente
sviluppata nel Mondo 3.

**11. Fungo Gelo** — Rallenta tutti i nemici in un'area 2 tile del 50% per 4s: fulcro difensivo
per creare "colli di bottiglia" prima di un muro.

**15. Fungo Radicato** — Trasforma le tile adiacenti in stato "Radicato" (+20% produzione Linfa
dei produttori sopra), è la pianta-chiave per ottimizzare l'economia mid-game.

**17. Fungo Sonnifero** — Addormenta il primo nemico che entra nell'area per 6s (nessun danno,
nessuna interazione finché dorme); si "sveglia" istantaneamente se subisce danno — sinergia
naturale con qualunque burst damage per garantire un'uccisione gratuita.

**23. Fungo Esplosivo (Epico)** — Il "nuke" del roster: area 3×3 enorme, danno che spazza quasi
ogni nemico non-boss presente, ma **lascia un cratere Bruciato temporaneo** sul terreno (nessuna
pianta piazzabile lì per 10s) — trade-off rischio/ricompensa deliberato.

### 🔵 Famiglia Cristallo — Ghiaccio ed elettrico

**5. Baccello di Gelo** — Come il Baccello Tiratore ma ogni colpo rallenta il bersaglio del 30%
per 2s: la spina dorsale del kiting difensivo.

**18. Noce di Ghiaccio (Raro)** — Muro con aura: tutti i nemici adiacenti sono rallentati del 20%
finché il Noce è in vita; combina ruolo muro e controllo in un unico slot.

**25. Alga Elettrica (Epico)** — Deve stare su tile Allagato (serve Ninfea Radice o meteo
Pioggia): attacca con un fulmine che salta a catena su fino a 3 nemici in corsie adiacenti,
l'unica pianta base con danno multi-corsia nativo.

### 🔴 Famiglia Brace — Fuoco

**13. Torcia di Brace** — Non attacca direttamente: potenzia +50% danno e aggiunge "brucia nel
tempo" a qualsiasi proiettile che attraversa la sua tile prima di lei nella stessa corsia (va
piazzata **dietro** uno sparatore, non davanti).

**19. Pepe Esplosivo** — vedi sopra (famiglia Baccello/Brace incrociata a livello di lore ma
classificata Brace per le sinergie: bonus +10% danno se adiacente a Torcia di Brace).

### 🟤 Famiglia Spina — Melee e danno da contatto

**6. Vite Spinata** — Danno passivo continuo (15/tick) a ogni nemico terrestre che la calpesta;
inutile contro nemici volanti — a differenza dell'originale "spikeweed" è **visibile e
rimovibile** dai Marciti Operai (vedi doc 05), introducendo un contro-gioco leggibile.

**14. Cactus Tiratore** — Unica pianta comune/non comune capace di colpire nemici **volanti**
(Marciti Aerostato) oltre che terrestri, fondamentale contro le ondate aeree del Mondo 5.

**20. Rovo Strangolatore (Raro)** — Ingoia ed elimina istantaneamente un singolo nemico non-boss
(ricarica lunga 35s); contro i boss infligge invece un grosso danno fisso senza eliminarlo.

**28. Rovo del Crepuscolo (Leggendario)** — Come sopra ma con danno ad area ridotta attorno al
bersaglio e stordimento 2s ai nemici colpiti di striscio: trasforma l'eliminazione mirata in una
mini-interruzione d'ondata.

**30. Corona di Spine Ancestrale (Leggendario)** — Muro con contrattacco ad area (colpisce tutti
i nemici adiacenti, non solo l'attaccante diretto): l'evoluzione definitiva della linea
difensiva melee.

### 🌸 Famiglia Fiore — Utility e controllo speciale

**21. Fiore Specchiante (Raro)** — Ogni 8s può riflettere il prossimo proiettile a distanza
subito da una pianta nella stessa corsia, colpendo il nemico che lo ha sparato: counter dedicato
ai Marciti Tiratori (doc 05).

**22. Vento di Semi (Raro)** — Proiettile perforante che attraversa l'intera corsia colpendo
*tutti* i nemici in linea, ideale contro orde compatte ma con danno singolo più basso di
Baccello Tiratore per bilanciare l'area.

**24. Fiore Ipnotico (Epico)** — Converte un nemico non-boss alla propria causa per 15 secondi
(combatte per il giocatore, poi torna ostile e viene rimosso dal campo in un piccolo lampo):
counter definitivo contro un singolo nemico pericoloso (es. un Marcito Corazzato) che diventa
temporaneamente un alleato.

## Fusioni di Semi disponibili al lancio (Famiglia Ibrida ⭐)

Ricette di **Fusione** craftabili in Serra una volta che entrambe le piante genitrici hanno
raggiunto lo stadio Fiorita (vedi doc 03). Ogni ibrido occupa un proprio slot di collezione con
statistiche indipendenti:

| Ibrido | Genitori | Concept |
|---|---|---|
| **Pepe Glaciale** | Pepe Esplosivo + Fungo Gelo | Proiettile che infligge danno medio e rallenta 40% per 3s, sostituisce il "tutto o niente" del Pepe con un'opzione sostenibile ricaricabile (10s) |
| **Baccello Corazzato** | Baccello Gemello + Muro Spinato | Sparatore con HP triplicato rispetto al Baccello base, ibrido attacco/tank per corsie di prima linea |
| **Fungo Fulminante** | Fungo Radicato + Alga Elettrica | Fertilizza il terreno e in più incatena un fulmine debole ogni 6s, unica pianta a fondere economia e danno |
| **Rovo di Brace** | Rovo Strangolatore + Torcia di Brace | Il morso lascia il bersaglio "in fiamme" (danno nel tempo) oltre al danno diretto, utile contro bersagli che il Rovo base non elimina (boss) |
| **Girasole Cristallino** | Girasole Solare + Noce di Ghiaccio | Produce Linfa e genera un piccolo scudo rigenerante (100 HP) attorno a sé: economia che si autodifende |
| **Vento Ipnotico** | Vento di Semi + Fiore Ipnotico | Proiettile perforante che ha 20% possibilità di "confondere" (dimezza danno per 4s) ogni nemico colpito, invece della conversione totale — versione ad area del controllo del Fiore Ipnotico |
