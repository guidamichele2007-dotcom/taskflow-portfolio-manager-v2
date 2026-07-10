# Capybara Paradise — Game Design Document

## Capitolo 00 — Visione Generale

---

## 1. Elevator Pitch

**Capybara Paradise** è un cozy sim-collection game 3D per iOS e Android in cui il giocatore costruisce e cura un paradiso naturale abitato da capibara, ognuno con personalità, emozioni e routine proprie. Ogni schermata è progettata per sembrare un wallpaper animato: il gioco punta tutto su qualità grafica AAA stylized, animazioni estremamente fluide e un'atmosfera profondamente rilassante.

> **Fantasia del giocatore:** "Ho creato un piccolo mondo perfetto, vivo, e posso semplicemente guardarlo respirare."

## 2. Pilastri di Design

| # | Pilastro | Descrizione | Test di verifica |
|---|----------|-------------|------------------|
| 1 | **Ogni frame è un wallpaper** | Illuminazione, composizione e colore di ogni scena devono reggere uno screenshot in qualsiasi momento. | Screenshot casuali in playtest devono ottenere >8/10 in valutazioni estetiche interne. |
| 2 | **Vita, non meccanica** | I capibara agiscono come esseri viventi (routine, emozioni, fisica secondaria), mai come sprite in idle. | Un osservatore per 5 minuti non deve mai vedere due sequenze identiche. |
| 3 | **Relax senza pressione** | Zero timer punitivi, zero fail state, zero energia che si esaurisce. Il gioco aspetta il giocatore. | Nessuna meccanica con perdita di progresso per assenza. |
| 4 | **Soddisfazione tattile** | Ogni tocco produce feedback visivo, sonoro e aptico curato (micro-animazioni, particelle, suoni morbidi). | Ogni elemento interattivo ha almeno 3 canali di feedback. |
| 5 | **Etica prima del revenue** | Monetizzazione solo cosmetica, trasparente, mai pay-to-win. | Nessun contenuto di gameplay bloccato dietro pagamento. |

## 3. Target e Posizionamento

- **Pubblico primario:** 16–40 anni, giocatori casual/cozy (Animal Crossing Pocket Camp, Cats & Soup, Neko Atsume, Alto's Odyssey).
- **Pubblico secondario:** appassionati di capibara e cultura "capycore" sui social; content creator (il Photo Mode è un motore di UGC virale).
- **Rating:** PEGI 3 / ESRB Everyone.
- **Piattaforme:** iOS 15+, Android 10+ (Vulkan/Metal). Target dispositivi: iPhone 11+ / fascia media Android 2021+ a 60 FPS; ProMotion e display 120 Hz supportati.
- **Sessione tipo:** 3–10 minuti attivi, con sessioni "contemplative" illimitate (Modalità Rilassante).
- **Orientamento:** landscape primario, portrait supportato in Modalità Rilassante e Photo Mode.

## 4. Engine e Stack Tecnologico

**Engine scelto: Unity 2022 LTS (URP)** — motivazioni: pipeline URP matura su mobile, Addressables, Burst/Jobs per fisica secondaria di massa (pelo, orecchie, vegetazione), ecosistema di profiling mobile, supporto Metal/Vulkan.

*Alternativa valutata:* Godot 4.x (Forward+ mobile) — eccellente per prototipazione, ma URP + DOTS-lite vince per GPU instancing di vegetazione, texture streaming e tooling di ottimizzazione console-grade su mobile. Il documento resta engine-agnostico dove possibile; le sezioni tecniche indicano l'implementazione Unity e, dove utile, l'equivalente Godot.

| Livello | Tecnologia |
|---------|-----------|
| Rendering | Unity URP 14, Forward+, shader HLSL/ShaderGraph custom |
| Animazione | Animancer/Playables API, Animation Rigging (IK), Motion Matching custom leggero |
| Fisica secondaria | Jobs + Burst (orecchie, pelo, vegetazione), Verlet chains |
| Asset delivery | Addressables + CDN (contenuti stagionali on-demand) |
| Salvataggio | Save locale binario + cloud (vedi Cap. 09) |
| Backend | Servizi cloud serverless (profili, classifiche, visite asincrone, eventi) |
| Audio | Middleware adattivo (FMOD) |
| Analytics/LiveOps | Eventi custom + Remote Config per eventi stagionali |

## 5. Struttura del Documento

| Capitolo | Contenuto |
|----------|-----------|
| 01 | Gameplay: loop, progressione, economia, missioni, eventi, social |
| 02 | Capibara: personalità, emozioni, bisogni, animazioni, AI |
| 03 | Mondo: biomi, ciclo giorno/notte, meteo, ecosistema |
| 04 | Grafica: direzione artistica, pipeline di rendering, shader |
| 05 | Animazioni: principi, pipeline, sistemi procedurali, IK, motion matching |
| 06 | Effetti visivi: sistemi particellari, VFX budget |
| 07 | UI/UX: design system, flussi, microanimazioni |
| 08 | Audio: musica adattiva, ambience, SFX, mix |
| 09 | Architettura tecnica: codice, cartelle, classi, database, salvataggi |
| 10 | Ottimizzazione: performance budget, LOD, memoria, batteria |
| 11 | Monetizzazione etica e LiveOps |
| 12 | Roadmap completa di sviluppo fino alla pubblicazione |

## 6. Esperienza a 30 secondi (Golden Path)

1. Il gioco apre su un **piano sequenza**: alba sul laghetto, nebbia volumetrica che si dirada, un capibara sbadiglia e si stiracchia (anticipation → stretch → follow-through), le orecchie vibrano.
2. Il giocatore tocca il capibara → il capibara chiude gli occhi, inclina la testa, il pelo si comprime sotto il dito (squash), partono particelle di cuoricini soffusi, suono morbido, haptic leggero.
3. Un'onda di soddisfazione: +Foglie di Ninfea (valuta soft) con animazione elastica verso il contatore.
4. Il mondo continua a vivere: libellule sull'acqua, riflessi che ondeggiano, un uccellino si posa su un masso.

Questo momento — **toccare un animale vivo in un mondo vivo** — è il cuore del gioco e va protetto in ogni decisione di sviluppo.

## 7. KPI di Riferimento (soft launch)

- D1 retention ≥ 45%, D7 ≥ 20%, D30 ≥ 10%
- Sessioni/giorno ≥ 3, durata media ≥ 6 min
- Condivisioni Photo Mode ≥ 8% dei DAU/settimana
- Crash-free sessions ≥ 99.6%
- FPS medio ≥ 58 su dispositivi target
