# Capitolo 09 — Architettura Tecnica

## 1. Principi Architetturali

- **Composition over inheritance**, dati in ScriptableObject, logica in servizi plain-C# testabili.
- **Dependency Injection** leggera (VContainer): nessun singleton hard-coded; i servizi si risolvono per interfaccia.
- **Event bus tipizzato** (`GameEvents`) per il disaccoppiamento gameplay ↔ UI ↔ quest ↔ analytics.
- **Determinismo del save:** tutta la simulazione persistente deriva dallo stato serializzato + tempo; nessuno stato critico vive solo in scena.
- **Assembly definitions** per confini di modulo e tempi di compilazione.

## 2. Organizzazione delle Cartelle (Unity)

```
Assets/
├── _Project/
│   ├── Code/
│   │   ├── Core/            # bootstrap, DI, event bus, time, save, addressables
│   │   ├── Gameplay/
│   │   │   ├── Capybara/    # brain, needs, emotion, activities
│   │   │   ├── World/       # timeofday, weather, ecosystem, fauna
│   │   │   ├── Build/       # placement, blueprint, harmony
│   │   │   ├── Economy/     # wallet, shop, rewards
│   │   │   ├── Quests/      # quest, achievement, events (liveops)
│   │   │   └── Social/      # friends, visits, leaderboards, sharing
│   │   ├── Presentation/
│   │   │   ├── UI/          # screens, components, motion presets
│   │   │   ├── CameraSys/   # gameplay cam, photo mode, zen cameraman
│   │   │   ├── VFX/         # pool, catalog, hooks
│   │   │   └── Audio/       # fmod wrappers, rhythmsync
│   │   ├── Platform/        # iap, auth, cloud, haptics, notifications, analytics
│   │   └── EditorTools/     # AnimGym, lightbox, water painter, economy sim
│   ├── Content/
│   │   ├── Capybaras/       # prefab + SO per capibara
│   │   ├── Biomes/          # scene + SO ambiente (sky profiles, weather tables)
│   │   ├── Decorations/     # prefab + DecorationSO per categoria
│   │   ├── Quests/          # QuestSO, AchievementSO, EventSO
│   │   └── Balance/         # curve economiche, tabelle rarità
│   ├── Art/                 # models, textures, materials, shaders, animations
│   ├── AudioBanks/          # banchi FMOD
│   └── UIAssets/            # sprites, font, icone
├── AddressableGroups/       # per bioma + stagionali + core
└── Tests/
    ├── EditMode/            # unit test (economy, needs, utility scoring, save)
    └── PlayMode/            # smoke test flussi, performance test scene
```

## 3. Classi e Servizi Principali

```csharp
// Core
interface IClockService        // tempo di gioco, fase del giorno, eventi orari
interface ISaveService         // load/save/migrazioni/cloud sync
interface IAddressableService  // load biomi/eventi con handle tracking
interface IEventBus            // publish/subscribe tipizzato

// Gameplay
class CapybaraDefinitionSO : ScriptableObject   // dati specie/archetipo
class CapybaraState                             // stato serializzabile istanza
class UtilityBrain             // scoring ActivitySO, planner, LOD AI
class NeedsComponent           // decadimenti, soddisfazione, eventi
class EmotionComponent         // valenza/arousal → animazione/espressione
class SocialCoordinator       // attività di gruppo
class TimeOfDayService         // interpolazione SkyProfileSO, GI blending
class WeatherService           // markov meteo, parametri shader globali (wetness, snow)
class HabitatService           // griglia, placement, HarmonyScore, blueprint
class AttractionService        // valuta condizioni arrivo capibara (rarità)
class WalletService            // valute, transazioni atomiche, log anti-cheat
class QuestService / AchievementService / LiveOpsService (RemoteConfig)
class PhotoModeService         // stato camera, filtri LUT, export, gallery
class VisitService             // snapshot habitat, sandbox visita read-only

// Presentation
class UIRouter                 // stack schermate, transizioni
class ZenCameraman             // POI pesati, composizione automatica
class VfxPoolService, HapticsService, RhythmSync
```

## 4. Dati e "Database"

### 4.1 Contenuti statici (in-app)

Cataloghi ScriptableObject compilati in **tabelle Addressable** versionabili: `CapybaraCatalog`, `DecorationCatalog`, `QuestCatalog`, `EventCalendar`. Bilanciamento (prezzi, curve, tassi) come asset dati separati aggiornabili via Remote Config override (LiveOps senza patch).

### 4.2 Save locale

- Formato: **binario compresso (MessagePack + LZ4)** con header versione + checksum; scritture atomiche (temp file → rename), doppio slot A/B anti-corruzione.
- Contenuto: profilo, wallet, livelli, capibara posseduti (stato completo), layout habitat per bioma (lista `PlacedItem {itemId, pos, rot, variant}`), progressi quest/achievement, galleria (metadati; le foto come file JPEG separati), impostazioni.
- **Migrazioni:** pipeline di migrazione per versione (`ISaveMigration` v1→v2→...) testata in CI con corpus di save storici.
- Dimensione target < 512 KB (foto escluse).

### 4.3 Cloud (backend serverless)

| Servizio | Dati | Note |
|----------|------|------|
| Auth | Apple/Google/guest link | token corto + refresh |
| Cloud Save | blob del save + metadata (versione, timestamp, device) | conflitto: vince il più recente con conferma utente se divergenza > soglia (UI di scelta con anteprima "livello X, Y capibara") |
| Social | profili pubblici, amicizie, snapshot habitat (layout compresso), regali, like | snapshot rigenerato max 1/h |
| Leaderboards | punteggi settimanali firmati server-side | validazione anti-cheat basica (bound check) |
| LiveOps | calendario eventi, remote config, messaggi | CDN per contenuti Addressable stagionali |

Offline-first: **tutto il gioco single-player funziona senza rete**; le feature social degradano con messaggi gentili.

## 5. Flusso di Bootstrap

```
Boot scene → DI container → SaveService.Load → ClockService.Init(save time)
→ AddressableService.LoadBiome(lastBiome) → simulazione "welcome back"
   (avanza bisogni/attività dal last-seen: i capibara sono DOVE sarebbero davvero)
→ TimeOfDay sync con ora reale opzionale → fade-in sul mondo (mai su un menu)
```

## 6. Qualità del Codice e CI/CD

- CI: build iOS/Android per commit su main, edit/playmode test, budget check (dimensione build, conteggio draw call su scene benchmark, frame time su device farm).
- Convenzioni: C# standard MS, analyzer + formatter in pre-commit; PR review obbligatoria; feature flag per tutto ciò che tocca LiveOps.
- Branching: trunk-based con branch corti; release branch per submission store.
- Crash/ANR: simbolicazione automatica, alert su regressioni crash-free < 99.5%.
