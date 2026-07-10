# Capitolo 10 — Ottimizzazione e Performance

## 1. Obiettivi

| Tier | Dispositivi riferimento | Target |
|------|------------------------|--------|
| Alto | iPhone 14+, ProMotion; flagship Android 2022+ | 60 FPS stabili; **120 FPS opzionale** (toggle, Zen/gameplay) |
| Medio | iPhone 11–13, fascia media 2021+ | 60 FPS stabili |
| Basso | iPhone SE2, entry-level 2020+ | 30 FPS stabili, estetica preservata |

Rilevazione tier automatica al primo avvio (GPU/RAM/benchmark 2s) + override utente per singolo effetto.

## 2. Budget per Frame (fascia media, 60 FPS = 16.6ms)

| Sistema | CPU budget | Note |
|---------|-----------|------|
| Rendering (main+render thread) | 7 ms | ≤ 250 draw call (SRP batcher + instancing), ≤ 350k tris a schermo |
| Animazione + IK + secondary motion | 2.5 ms | Jobs/Burst, LOD animazione (off-screen: no evaluate) |
| AI capibara (max 20 attivi) | 1 ms | scoring time-sliced, 10 Hz on-screen / 1 Hz off |
| VFX/particelle | 1.5 ms | pooling, tier LOD |
| Gameplay/UI/audio | 2 ms | UI su canvas separati (no rebuild del mondo) |
| Riserva/GC | 2.6 ms | zero alloc in steady state (pool, strutture riusate) |

GPU: overdraw ≤ 2.5×, bandwidth-first (ASTC, R11G11B10 HDR target, MSAA 4× solo tier alto o risoluzione dinamica in alternativa).

## 3. Tecniche Obbligatorie

- **LOD:** 4 livelli per capibara/prop hero, imposter per alberi lontani; LOD anche per shader (fur shells, acqua), animazione, AI, VFX e audio (voci lontane non processate).
- **Occlusion culling:** baked per bioma + portal manuali nel villaggio; distance culling per micro-prop.
- **GPU instancing / BatchRendererGroup:** erba, fiori, rocce, foglie — vegetazione = 3–5 draw call totali.
- **Object pooling:** VFX, audio one-shot, UI toast, fauna minore — nessuna Instantiate in gameplay steady-state.
- **Texture streaming:** mipmap streaming attivo con budget per tier (400/700/1200 MB pool totale asset residenti: 1.1 GB target build iniziale ≤ 1.4 GB, download post-install per biomi avanzati).
- **Addressables:** un bioma in memoria alla volta (+core); unload completo con verifica handle; contenuti stagionali via CDN.
- **Memory management:** budget RAM totale 1.2 GB (medio), tracking per categoria in build dev, hard cap con degradation path (scarico LOD alti) — zero OOM kill.
- **Risoluzione dinamica:** scala render 0.75–1.0 pilotata dal frame time (mai sotto 0.75; UI sempre nativa).

## 4. Batteria e Termica

- **Frame cap contestuale:** 60 in gameplay, 30 in Zen Mode (opzione), 30 nei menu a schermo pieno, pausa rendering totale quando l'app è in background.
- Ascolto throttling termico (iOS thermal state / Android thermal API): a livello "serious" scala automatica di risoluzione + tier VFX con toast gentile.
- Obiettivo: ≤ 12% batteria/ora in gameplay su fascia media, ≤ 6% in Zen 30 FPS.

## 5. Processo

- **Performance test in CI** su device farm (5 dispositivi ancore): scena benchmark per bioma, soglie bloccanti su frame time medio e 95° percentile, memoria di picco, tempo di caricamento (< 8s cold start medio).
- Profiling settimanale rituale (Instruments/Android GPU Inspector) con report; ogni feature nuova dichiara il proprio budget in design review.
- "Golden device" da fascia bassa sulla scrivania di ogni ingegnere: se non gira lì, non è finita.
