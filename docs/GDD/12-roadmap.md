# Capitolo 12 — Roadmap Completa di Sviluppo

**Team target:** 14 persone — 1 game director, 1 producer, 3 gameplay/systems engineer, 1 graphics engineer, 1 backend/platform engineer, 1 technical artist, 2 3D artist, 1 animatore senior + 1 animatore, 1 UI/UX designer, 1 sound designer (+ compositore in outsourcing), QA in scaling.

**Durata totale: 20 mesi** dal kickoff al lancio globale.

## Fase 0 — Pre-produzione (Mesi 1–3)

- Style bible completa (palette biomi, lookdev capibara, 3 concept "wallpaper" per bioma).
- **Vertical slice tecnica:** 1 bioma (Riva del Lago), 3 capibara con AI/emozioni/fisica secondaria complete, acqua finale, ciclo giorno/notte, carezza perfetta.
- Prototipi di rischio: motion matching lite su mobile, shell fur budget, GI time-lapse blending, RT interazione acqua/erba.
- Architettura core (DI, save, event bus, Addressables), CI/CD e device farm attivi.
- **Gate M3:** la vertical slice supera il wallpaper test e gira a 60 FPS su fascia media. *Kill criteria espliciti se fur o acqua non stanno nel budget → piani B già definiti (texture fur / acqua semplificata).*

## Fase 1 — Fondamenta (Mesi 4–7)

- Sistemi: bisogni/emozioni/utility AI completi, 16 archetipi, costruzione + Armonia, economia v1, missioni, tutorial.
- Contenuti: biomi 1–3, 30 capibara (set animazioni condiviso completo: ~60 clip), 150 decorazioni.
- Photo Mode v1 (camera + filtri + export), meteo v1 (pioggia, vento), UI design system implementato.
- Audio: pipeline FMOD, 3 temi adattivi, versi capibara v1.
- **Gate M7: "First Playable"** — core loop completo giocabile 7 giorni senza contenuti mancanti.

## Fase 2 — Espansione (Mesi 8–12)

- Biomi 4–8, capibara a 60 (rari/epici con animazioni esclusive), decorazioni a 400.
- Meteo completo (neve, temporali, arcobaleno, nebbia), eventi giornalieri, Zen Mode + virtual cameraman, Modalità Creativa, blueprint.
- Social: account/cloud save, amici, visite asincrone, regali, classifiche gentili, condivisione con deep link.
- Achievement, Capy-Dex completo, collezione/attrazione rarità con indizi.
- Ottimizzazione pass 1 (tier system, streaming, batteria).
- **Gate M12: "Content Complete Alpha"** — tutte le feature presenti, contenuti al 70%.

## Fase 3 — Rifinitura (Mesi 13–15)

- Biomi 9–12, capibara a 80+ (leggendari con cinematiche), decorazioni a 600.
- **Polish sprint dedicati:** 6 settimane SOLO su animazioni/VFX/transizioni (motion review su tutto il gioco), 2 settimane solo su "primi 10 minuti".
- Primo evento stagionale costruito end-to-end (pipeline LiveOps provata).
- Localizzazione 9 lingue, accessibilità completa, audio mix finale.
- Ottimizzazione pass 2 (profiling per-device, memoria, cold start).
- **Gate M15: Beta** — feature/content complete, crash-free ≥ 99.5%.

## Fase 4 — Soft Launch (Mesi 16–18)

- Rilascio in 3–4 mercati (es. Canada, Filippine, Nuova Zelanda, Italia).
- Focus: retention D1/D7/D30, funnel tutorial, economia (earn/spend reali), performance sul parco device reale, prova del Paradise Pass.
- 2 cicli di iterazione da 4 settimane su dati; contenuto evento live per testare LiveOps sotto carico.
- Preparazione store: ASO, screenshot/video (girati in-engine col Photo Mode!), pagina pre-registrazione, press kit, campagna social capycore (i capibara si vendono da soli).
- **Gate M18: Go/No-Go lancio** — KPI Cap. 00 §7 raggiunti.

## Fase 5 — Lancio Globale (Mesi 19–20)

- Rollout scaglionato (10% → 50% → 100%), war room 2 settimane, hotfix pipeline pronta.
- Featuring pitch ad Apple/Google (il profilo "grafica spettacolare + benessere + etica" è ideale per featuring editoriale).
- Evento di lancio in-game (capibara celebrativo gratuito per tutti).

## Post-lancio (Anno 1)

- Stagioni ogni 8 settimane (Cap. 11), 1 bioma nuovo/trimestre, 8–10 capibara/stagione.
- Richieste della community votabili in-game.
- Estensioni valutate: widget wallpaper animato companion, versione tablet ottimizzata, Apple Vision/desktop port dello Zen Mode.

## Rischi Principali e Mitigazioni

| Rischio | Prob. | Mitigazione |
|---------|-------|-------------|
| Fur/acqua fuori budget su low-end | Media | Piani B per-tier definiti in pre-produzione; golden device test continuo |
| L'AI dei capibara risulta ripetitiva | Media | Shuffle bag, routine per archetipo, delight animation ogni sprint, playtest osservazionali mensili |
| Economia troppo generosa/avara | Media | Simulatore economico + soft launch a 2 cicli |
| Scope creep sui 12 biomi | Alta | Content gate rigidi; biomi 10–12 declassabili a post-lancio senza toccare il lancio |
| Monetizzazione etica sotto target | Media | Supporter Pack + espansioni estetiche; leva su UA organica; costi team contenuti |
