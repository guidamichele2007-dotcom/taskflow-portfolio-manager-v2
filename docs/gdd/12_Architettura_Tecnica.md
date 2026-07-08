# 12 — Architettura Tecnica

## Motore di gioco consigliato

**Unity (LTS più recente, pipeline URP — Universal Render Pipeline)**, per i seguenti motivi
rispetto alle alternative:

| Criterio | Unity + URP | Unreal Engine | Motore custom |
|---|---|---|---|
| Cross-platform mobile+PC+console | Eccellente, un solo progetto | Buono ma più pesante su mobile low-end | Costo/tempo altissimo |
| Stile cartoon stilizzato 2.5D | URP + Shader Graph copre bene il cel-shading richiesto | Richiede più lavoro custom (pensato per fotorealismo) | N/A |
| Performance con centinaia di unità simultanee (ondate) | DOTS/ECS (Entities package) disponibile per il layer di simulazione | Possibile ma meno maturo per questo genere | N/A |
| Team hiring/tooling LiveOps | Ampia disponibilità sviluppatori C#, asset store, Unity Gaming Services (Analytics, Remote Config, Cloud Save, Multiplay) pronti all'uso | Team più costosi/specializzati | N/A |
| Editor per level design (piazzamento ondate) | Tooling custom rapido da costruire su Editor Unity | Blueprint potente ma overkill per TD 2D/2.5D | N/A |

**Decisione**: Unity 6 LTS + URP per il client su tutte le piattaforme; layer di simulazione
gameplay scritto come **livello logico deterministico indipendente dal rendering** (vedi sotto),
per permettere in futuro anche un porting parziale ad altro motore senza riscrivere le regole di
gioco.

## Architettura software: separazione Simulazione / Presentazione

Principio cardine (necessario per multiplayer deterministico, replay, e testabilità):

```
┌─────────────────────────────────────────────┐
│  Presentation Layer (Unity MonoBehaviour)    │  ← rendering, input, VFX, audio, UI
├─────────────────────────────────────────────┤
│  Bridge / Event Bus                          │  ← traduce comandi input → intent di simulazione
│                                               │     e stato di simulazione → eventi di presentazione
├─────────────────────────────────────────────┤
│  Simulation Core (C# puro, no UnityEngine)   │  ← CombatEngine a tick fissi (doc 03), regole di
│                                               │     gioco, RNG deterministico seedato, FSM nemici
├─────────────────────────────────────────────┤
│  Data Layer (ScriptableObject + JSON)        │  ← definizioni piante/nemici/livelli (doc 04/05),
│                                               │     stesse fonti usate da packages/shared di questo repo
└─────────────────────────────────────────────┘
```

- Il **Simulation Core** è scritto come libreria C# indipendente da `UnityEngine` (nessun
  riferimento a `MonoBehaviour`, `Transform`, ecc.), compilabile e testabile anche in un progetto
  .NET separato (unit test in CI senza aprire l'Editor Unity, drasticamente più veloce).
  Il prototipo di riferimento in questo repository (`packages/game-core/src/combat/CombatEngine.ts`)
  è l'analogo concettuale in TypeScript, pensato per essere portato 1:1 in C# dal team engine.
- Ogni pianta/Marcito è definito da **dati** (ScriptableObject in Unity, JSON/TS in questo repo),
  mai da sotto-classi dedicate: il comportamento è composto da un piccolo set di componenti
  riusabili (`AttackBehaviour`, `ProducerBehaviour`, `StatusEffectApplier`, `MovementBehaviour`,
  `AbilityBehaviour`) assemblati per dato — pattern **Entity-Component + Data-Driven Design**,
  scelto per permettere al team design di creare nuove piante/nemici (specialmente per il live
  service, doc 15) senza intervento di un programmatore per ogni singola aggiunta.

## Struttura delle cartelle (progetto Unity di riferimento)

```
Assets/
├── _Project/
│   ├── Art/
│   │   ├── Plants/{FamilyName}/{PlantName}/  (model, textures, anim, vfx)
│   │   ├── Zombies/{Category}/{ZombieName}/
│   │   ├── Environments/{BiomeName}/
│   │   └── UI/
│   ├── Audio/
│   │   ├── Music/{BiomeName}/
│   │   ├── SFX/{Plants|Zombies|UI|Ambience}/
│   │   └── WwiseProject/ (o FMOD, vedi nota audio middleware)
│   ├── Data/
│   │   ├── Plants/*.asset          (ScriptableObject, 1:1 con packages/shared/src/data/plants.ts)
│   │   ├── Zombies/*.asset
│   │   ├── Levels/*.asset          (sequenze ondate, meteo, griglia)
│   │   └── BalanceConfig.asset     (moltiplicatori doc 06, editabili senza rebuild via Remote Config)
│   ├── Scripts/
│   │   ├── SimulationCore/         (no UnityEngine ref — porting diretto da packages/game-core)
│   │   ├── Presentation/           (MonoBehaviour: rendering, input, camera)
│   │   ├── UI/                    (schermate doc 09, un controller per schermata)
│   │   ├── Meta/                  (profilo, economia, missioni, achievement — doc 06/08)
│   │   ├── Networking/             (client PvP/co-op, matchmaking, replay)
│   │   └── Editor/                 (tool custom: Wave Editor, Level Editor, Balance Inspector)
│   └── Prefabs/
├── Plugins/                        (Unity Gaming Services, IAP, Analytics, Audio middleware)
└── Tests/
    ├── EditMode/                   (unit test SimulationCore, no Editor Unity necessario per CI)
    └── PlayMode/                   (integrazione, smoke test per livello)
```

## Database e persistenza

- **Client locale**: SQLite embedded (via plugin Unity) per cache offline di profilo, collezione,
  progressi — permette gameplay single-player completo anche offline, sync al primo online
  disponibile (doc 13).
- **Backend/server**: PostgreSQL come database primario (dati relazionali: profili, collezioni,
  transazioni economiche, leaderboard) + Redis per stato effimero ad alta frequenza
  (matchmaking queue, sessioni PvP attive, cache leaderboard) — dettagli completi in doc 13.

## Multiplayer e sincronizzazione online

Sintesi (dettaglio completo in doc 13):
- **PvE (Campagna/Sopravvivenza/Sfide)**: interamente client-authoritative, nessun server di
  gioco richiesto durante il match (solo per salvataggio/ricompense a fine sessione) — riduce
  drasticamente il costo server per la modalità più giocata.
- **PvP/Co-op online**: modello **client deterministico + server di validazione** (non full
  lockstep, non full server-authoritative rendering): entrambi i client simulano la stessa
  partita a partire dallo stesso seed e dagli stessi input scambiati in tempo reale (basso
  overhead di banda: si scambiano solo "intent" piazzamento/abilità, non stato completo), il
  server valida la legalità delle mosse e arbitra il risultato finale per prevenire cheat lato
  client — reso possibile proprio dal **Simulation Core deterministico a tick fissi** (doc 03).

## Performance e ottimizzazione

- **Target framerate**: 60 FPS su PC/console e su mobile di fascia medio-alta (2022+), 30 FPS
  garantiti come minimo su mobile di fascia bassa (opzione qualità "Base" in Impostazioni).
- **GPU instancing** per Marciti Comuni in ondate numerose (fino a 40+ unità simultanee a schermo
  nelle ondate finali, budget testato in doc 14 come milestone di performance).
- **Object pooling** obbligatorio per proiettili, VFX particellari, Marciti (nessun
  Instantiate/Destroy a runtime durante il combattimento).
- **LOD (Level of Detail)** a 3 livelli per modelli 3D, **culling** aggressivo per unità fuori
  griglia visibile (la telecamera è fissa per livello, quindi il culling è semplificato e molto
  efficace).
- **Profiling continuo in CI**: ogni build di livello passa un "wave stress test" automatico
  (spawna l'ondata più densa del livello e misura frame time) prima di poter essere mergiata
  (vedi doc 14 per pipeline CI/CD).

## Compatibilità piattaforme

| Piattaforma | Note tecniche specifiche |
|---|---|
| **PC (Windows/Mac via Steam)** | Input mouse+tastiera e controller, risoluzioni/aspect ratio multipli, Steam Cloud come layer aggiuntivo di sync oltre al cloud save proprietario |
| **Android** | Supporto da Android 8.0+, gestione fragmentation hardware tramite 3 tier di qualità grafica auto-rilevati al primo avvio (modificabili manualmente) |
| **iOS** | Supporto da iOS 15+, conformità linee guida App Store per IAP (doc 15), gestione ProMotion 120Hz opzionale |
| **Console (finestra 2, doc 14)** | Switch 2, PlayStation 5, Xbox Series: richiede pass di certificazione (TRC/XR/Microsoft cert), navigazione UI 100% a controller (già richiesto trasversalmente, doc 09), cross-save con le versioni PC/mobile tramite account unico |
| **Cross-play** | Abilitato di default per Co-op e PvP non-ranked; per il PvP ranked, matchmaking separato per "Input Method" (touch vs mouse/controller) nei primi 6 mesi per fairness percepita, poi valutazione dati reali per eventuale unificazione |

## Audio middleware

**Wwise** (alternativa valida: FMOD) per il sistema di vertical layering musicale e mixing
dinamico descritto in doc 10 — entrambi integrabili nativamente in Unity via plugin ufficiale.

## Note per il team che riprenderà questo progetto

- I file in `packages/shared/src/data/*.ts` e `packages/shared/src/types/*.ts` di questo
  repository sono pensati come **fonte di verità dati portabile**: un tool di build (non incluso
  in questa consegna, da sviluppare come primo task tecnico, vedi doc 14) dovrebbe generare i
  corrispondenti `ScriptableObject` Unity da questi stessi file JSON/TS, per evitare doppia
  manutenzione tra design doc e progetto Unity.
- `packages/game-core/src/combat/CombatEngine.ts` è un **riferimento di comportamento**, non il
  codice di produzione: la sua logica (tick, stati, risoluzione danni) va portata in C# puro nel
  `SimulationCore` sopra descritto, mantenendo la stessa struttura a fasi per tick per garantire
  che il comportamento resti identico a quello validato in fase di design/QA.
