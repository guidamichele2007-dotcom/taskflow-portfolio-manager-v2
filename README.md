# ROOTGUARD: L'Ultima Fioritura

**Un tower-defense strategico ispirato a Plants vs. Zombies, reinventato con identità propria.**

Questo repository contiene il **Game Design Document completo**, la **documentazione tecnica**,
i **dataset di gioco** (piante, nemici, livelli) e uno **scaffold di codice** pronti per essere
presi in carico da un team di sviluppo.

> Considera questo repository il "progetto zero" di ROOTGUARD: non un motore di gioco finito,
> ma la base di design + architettura + dati con cui un team (engine, gameplay, backend, art,
> audio) può iniziare la produzione senza dover prendere decisioni di design in sospeso.

## Indice della documentazione (`/docs/gdd`)

| # | Documento | Contenuto |
|---|---|---|
| 01 | [Concept e Visione](docs/gdd/01_Concept_e_Visione.md) | Pitch, pillar di design, target, USP vs PvZ |
| 02 | [Mondo e Storia](docs/gdd/02_Mondo_e_Storia.md) | Ambientazione, lore, personaggi, storia principale |
| 03 | [Gameplay Core e Combattimento](docs/gdd/03_Gameplay_Core_e_Combattimento.md) | Loop di gioco, meccaniche di combattimento, meteo, terreno |
| 04 | [Piante](docs/gdd/04_Piante.md) | Roster completo di 30 piante: statistiche, abilità, rarità, evoluzioni, sinergie |
| 05 | [Nemici — I Marciti](docs/gdd/05_Nemici_Marciti.md) | Roster completo di 30 nemici + varianti + 6 boss, IA e pattern |
| 06 | [Progressione, Economia, Bilanciamento](docs/gdd/06_Progressione_Economia_Bilanciamento.md) | Curve XP, valute, drop rate, difficulty scaling |
| 07 | [Modalità di Gioco](docs/gdd/07_Modalita_di_Gioco.md) | Campagna, Sopravvivenza, Sfide, PvP, Co-op |
| 08 | [Eventi, Missioni, Achievement](docs/gdd/08_Eventi_Missioni_Obiettivi_Achievement.md) | Eventi stagionali, missioni giornaliere, obiettivi, achievement, profilo |
| 09 | [UI/UX e Schermate](docs/gdd/09_UI_UX_Schermate.md) | Ogni schermata del gioco in dettaglio, flussi utente |
| 10 | [Audio e Sound Design](docs/gdd/10_Audio_Sound_Design.md) | Musica dinamica, SFX, mixing, feedback audio-visivo |
| 11 | [Art Direction e VFX](docs/gdd/11_Grafica_VFX_Art_Direction.md) | Stile cartoon 3D, pipeline VFX, illuminazione, animazione |
| 12 | [Architettura Tecnica](docs/gdd/12_Architettura_Tecnica.md) | Engine, struttura progetto, performance, piattaforme |
| 13 | [Backend, Multiplayer, Salvataggio](docs/gdd/13_Backend_Multiplayer_Salvataggio.md) | Netcode, matchmaking, database, cloud save |
| 14 | [Roadmap, Milestone, Backlog](docs/gdd/14_Roadmap_Milestone_Backlog.md) | Piano di sviluppo completo, team, priorità |
| 15 | [DLC, Espansioni, Live Service](docs/gdd/15_DLC_Espansioni_LiveService.md) | Contenuti post-lancio, stagioni, monetizzazione |

## Struttura del repository

```
├── docs/gdd/               # Game Design Document completo (15 documenti)
├── packages/
│   ├── shared/             # Tipi e dataset condivisi (TypeScript)
│   │   └── src/
│   │       ├── types/      # Interfacce: Plant, Zombie, Ability, Rarity, Level...
│   │       └── data/       # Dataset reali: 30 piante, 30 nemici + boss
│   └── game-core/          # Prototipo del motore di simulazione combattimento
│       └── src/combat/     # CombatEngine deterministico (lane, proiettili, danni, stati)
└── README.md
```

## Come usare questo repository

1. **Design**: parti da `docs/gdd/01_Concept_e_Visione.md` e leggi in ordine numerico.
2. **Dati di gioco**: i roster di piante/nemici in `docs/gdd/04` e `05` sono la fonte di verità
   narrativa; `packages/shared/src/data/*.ts` è la stessa fonte di verità in formato dati,
   già tipizzata e importabile da un engine (Unity/Unreal via bridge JSON, o un motore web/TS).
3. **Prototipo di combattimento**: `packages/game-core/src/combat/CombatEngine.ts` implementa
   la risoluzione di un turno di combattimento (piazzamento, movimento nemici, attacchi,
   stati alterati, meteo) in modo deterministico e testabile, come riferimento per il team
   engine per la porting nel motore scelto (vedi doc 12).
