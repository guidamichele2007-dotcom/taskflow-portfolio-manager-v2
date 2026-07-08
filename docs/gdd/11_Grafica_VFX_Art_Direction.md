# 11 — Art Direction, Animazione e VFX

## Stile visivo

- **Cartoon 3D stilizzato** con shading a cel-shading morbido (non contorni neri duri: un
  gradiente di 2-3 toni per superficie + rim-light caldo), proporzioni "chibi" per i Marciti
  (teste grandi, corpi tozzi = comici e leggibili) e proporzioni più naturali/eleganti per le
  piante (design "botanico fantasy", non semplici piante con occhi appiccicati: ogni pianta ha
  una silhouette ispirata a un fiore/pianta reale reinterpretata in chiave guerriera/armatura
  organica).
- **Palette per bioma** (coerente con doc 02): Giardini Sospesi (verdi smeraldo/oro caldo), Palude
  Nebulosa (verdi muschio/viola tenue), Dune Infuocate (ambra/rosso mattone/blu notte per il
  ciclo giorno-notte), Cime Glaciali (azzurro ghiaccio/bianco/accenti magenta al tramonto),
  Abisso Cinereo (grigio cenere/nero/accenti verde-veleno fosforescente), Cuore del Mondo
  (dorato/bianco puro per il finale "guarigione").
- **Silhouette test**: ogni asset (pianta, Marcito, tile) deve essere riconoscibile in puro
  controluce nero, regola di produzione obbligatoria in fase di concept art per garantire
  leggibilità a distanza e su schermi piccoli (mobile).

## Illuminazione dinamica

- Motore a illuminazione globale in tempo reale (vedi doc 12 per scelta engine) con **ciclo
  giorno/notte** pienamente dinamico nel Mondo 3 (Dune Infuocate) e presente in forma ridotta
  (variazione cromatica ambientale, non gameplay) in tutti gli altri mondi per varietà visiva tra
  run ripetute dello stesso livello.
- Luci di accento dedicate per: proiettili (glow additivo colorato per famiglia pianta), tile
  alterati (bagliore rosso pulsante per Bruciato, blu cristallino per Ghiacciato, verde tenue per
  Radicato), boss (rim-light dedicato che si intensifica ad ogni cambio fase).
- Ombre in tempo reale soft (contact shadows) su tutte le unità principali, ombre a blob
  semplificate per Marciti minori/sciami su hardware mobile di fascia bassa (scalabilità, doc 12).

## Animazione

- Principi Disney applicati in chiave "botanica meccanica": squash & stretch marcato su
  piazzamento/attacco, anticipazione (windup) leggibile di almeno 0.3s prima di ogni attacco a
  danno alto o abilità attiva (fondamentale per il counterplay leggibile, doc 05).
- **Blend tree** per ogni unità: idle → windup → attacco → recupero, con transizioni sfumate
  (0.1-0.2s) per evitare "popping" tra stati anche a framerate variabile.
- Morte comica standardizzata per i Marciti: 3 varianti generiche (sgretolamento in foglie,
  "sgonfiamento" a fisarmonica, rotolamento fuori campo) assegnate per categoria di peso (leggeri/
  medi/pesanti), più 1 animazione di morte unica per ciascun boss.
- Idle "vive" per le piante (dondolio, respiro, sguardo che segue il Marcito più vicino entro
  raggio) per dare personalità anche in assenza di combattimento, contributo diretto al pilastro
  "umorismo caldo".

## VFX (effetti particellari)

- **Libreria VFX per famiglia pianta** (coerente con le firme sonore doc 10): particelle dorate
  ellittiche (Radice-Madre), scintille verdi a proiettile (Baccello), trucioli di corteccia
  (Foglia/impatti), spore viola fluttuanti (Fungo), cristalli di ghiaccio/scintille blu
  (Cristallo), faville arancioni/fumo (Brace), schegge marroni (Spina), petali rosa/glitter
  chiaro (Fiore).
- **VFX di stato** riutilizzabili su qualunque unità: icona/aura per Rallentato (spirali blu),
  Avvelenato (bolle verdi ascendenti), Bruciato (fiammelle intermittenti), Stordito (stelline
  rotanti sopra la testa, omaggio consapevole al linguaggio cartoon classico), Ipnotizzato/Confuso
  (aura rosa pulsante).
- **Ondata finale e boss**: VFX esclusivi a maggiore intensità (particellare denso, screen-space
  distortion leggera per le esplosioni più grandi) ma sempre con un "occlusion check" per non
  coprire mai le informazioni critiche di gioco (regola hard: nessun VFX può oscurare per più di
  0.5s la visuale di una corsia con Marciti attivi).

## Interfaccia (linee guida visive, complementari a doc 09)

- Iconografia a doppia codifica (colore + forma/simbolo) per accessibilità daltonismo.
- Font arrotondato "friendly" per UI generale, font leggermente più "organico/rustico" per testi
  narrativi/Codex, per differenziare tono sistemico da tono narrativo.
- Micro-animazioni UI (bounce leggero su conferma, shake leggero su errore) coerenti col
  linguaggio cartoon generale, sempre disattivabili in Impostazioni > Accessibilità per chi è
  sensibile al motion.

## Pipeline asset (riferimento per il team art)

1. Concept 2D (silhouette + palette) → validazione pilastro leggibilità.
2. Model 3D low-poly stilizzato (budget poligoni per LOD0 in doc 12).
3. Rigging condiviso per categoria (skeleton comune "Pianta Base", "Marcito Bipede", "Marcito
   Quadrupede/Speciale") per velocizzare l'animazione a runtime e permettere retarget rapido tra
   varianti della stessa categoria (es. tutti i Marciti Corazzati L1-L3 condividono rig).
4. Texture PBR stilizzate (albedo + un solo mappa "cartoon ramp" per il cel-shading, niente PBR
   fisicamente accurato completo, per restare nello stile e contenere il costo memoria mobile).
5. Integrazione VFX/audio in engine, pass di ottimizzazione (draw call batching, GPU instancing
   per Marciti comuni in ondate numerose).
