# 14 — Roadmap, Milestone e Backlog

## Composizione del team consigliata (produzione core, ~18 mesi)

| Ruolo | FTE | Fase principale di impegno |
|---|---|---|
| Game Director / Creative Director | 1 | Tutta la produzione |
| Game Designer (sistemi/economia) | 2 | Pre-produzione → Beta |
| Level Designer | 2 | Produzione (picco), Live Ops dopo il lancio |
| Narrative Designer | 1 | Pre-produzione, Produzione (cutscene/Codex) |
| Programmatori gameplay/engine | 4 | Tutta la produzione |
| Programmatore AI | 1 | Produzione |
| Programmatore Backend/Multiplayer | 2 | Produzione → Live Ops |
| Full Stack (tools/live-ops dashboard) | 1 | Produzione → Live Ops |
| Art Director | 1 | Tutta la produzione |
| Artisti 3D/Concept/Animazione | 5 | Produzione (picco) |
| VFX Artist | 1 | Produzione |
| UI/UX Designer | 2 | Pre-produzione → Beta |
| Sound Designer / Composer | 1 (+ contrattista musica) | Produzione |
| QA Tester | 3 (scala a 6+ in Beta/certificazione) | Alpha → Lancio |
| Product Manager / Producer | 1 | Tutta la produzione |
| Community/Live-Ops Manager | 1 | Da Beta in poi |

## Fasi e milestone

### Fase 0 — Pre-produzione (2 mesi)
- Consolidamento GDD (questo documento e i precedenti), pilastri di design validati con playtest
  cartacei/prototipo carta del combattimento a corsie.
- Prototipo verticale digitale: 1 mondo giocabile (grezzo) con 8 piante, 6 Marciti, per validare
  il feel del combattimento e il sistema di meteo/terreno.
- **Milestone 0**: "Prototipo Verticale approvato" — go/no-go per la produzione piena.

### Fase 1 — Produzione Core (9 mesi)
- Mese 1-3: Simulation Core completo (motore combattimento, doc 03/12), pipeline dati
  piante/nemici, primi 2 mondi giocabili end-to-end (senza polish audio/vfx finale).
- Mese 4-6: Mondi 3-4, sistema Serra/Fusione, Sopravvivenza, prime Sfide, backend profilo/
  economia in versione alpha.
- Mese 7-9: Mondi 5-6 + boss finale, PvP online (prima versione interna), Co-op, sistema missioni/
  achievement, UI/UX completa per tutte le schermate doc 09.
- **Milestone 1**: "Alpha Feature-Complete" — tutti i sistemi presenti, bilanciamento e polish
  ancora da rifinire, contenuto narrativo completo in forma testuale/placeholder audio.

### Fase 2 — Alpha → Beta (4 mesi)
- Bilanciamento numerico completo (doc 06) su dati di playtest interni ed esterni (closed alpha).
- Polish audio/VFX finale (doc 10/11), integrazione middleware audio, mix finale.
- **Closed Beta** (2 milioni di sessioni target o 4-6 settimane, il primo dei due limiti che si
  raggiunge prima): stress test server, matchmaking PvP su scala reale, raccolta feedback UX.
- Hardening anti-cheat e sicurezza backend (doc 13), pass di certificazione preliminare console.
- **Milestone 2**: "Beta Candidate" — contenuto e sistemi bloccati (feature freeze), solo bug
  fixing e bilanciamento fine.

### Fase 3 — Lancio (2 mesi)
- Certificazione piattaforme (Steam, Google Play, App Store; console in finestra 2, vedi sotto).
- Localizzazione finale 16 lingue, marketing beat (trailer, key art, community seeding).
- **Soft launch** in 2-3 mercati selezionati (2-3 settimane) per validare KPI di retention/
  monetizzazione prima del lancio globale, con possibilità di iterare rapidamente su onboarding e
  prima ora di gioco (dato storicamente critico per la retention D1/D7).
- **Milestone 3**: "Lancio Globale" (PC + Android + iOS simultaneo).

### Fase 4 — Live Service anno 1 (continuo, vedi doc 15 per dettaglio contenuti)
- Cadenza aggiornamenti: patch minori ogni 2 settimane (bug fix, bilanciamento), evento
  stagionale ogni 6 settimane, contenuto maggiore (nuovo mondo/mini-espansione) ogni 3-4 mesi.
- **Finestra 2 (mese 6-9 post-lancio)**: porting e certificazione console (Switch 2, PS5, Xbox
  Series), cross-save/cross-play esteso.

## Priorità di sviluppo (ordine consigliato all'interno della Fase 1)

1. Simulation Core + formato dati piante/nemici (blocca tutto il resto).
2. Editor livelli/ondate interno (accelera tutta la produzione contenuti a seguire).
3. Mondo 1 completo end-to-end (verticale di qualità, funge da riferimento per gli altri mondi).
4. Sistemi economia/profilo/salvataggio (necessari per qualunque playtest con progressione).
5. Mondi 2-5 in parallelo tra i Level Designer, riusando pipeline validata al punto 3.
6. Serra/Fusione ed Evoluzione (dipende da roster piante sostanzialmente finalizzato).
7. PvP/Co-op (dipende dal Simulation Core deterministico e dal backend base).
8. Boss finale e Mondo 6 (narrativamente dipendente dal completamento degli Araldi 2-5).
9. Missioni/Achievement/Eventi stagionali infrastruttura (può iniziare in parallelo da metà Fase 1
   ma richiede economia stabile).
10. Polish audio/VFX/UI (Fase 2, ma con "day-1 pass" leggero già in Fase 1 per playtest credibili).

## Backlog (estratto strutturato, board-ready per Jira/Linear/Asana)

### Epic: Simulation Core
- [ ] Tick loop deterministico configurabile (100ms, doc 03)
- [ ] Sistema stati alterati (veleno, gelo, fuoco, stordimento, ipnosi)
- [ ] Sistema meteo dinamico con transizioni a runtime
- [ ] Sistema terreno modificabile (stati tile + regole di piazzamento)
- [ ] Direttore delle Ondate (pacing dinamico ±15%, doc 05)
- [ ] Serializzazione stato per replay/riconnessione

### Epic: Contenuto Piante
- [ ] Pipeline dati → ScriptableObject (build tool, doc 12)
- [ ] 30 piante base implementate e bilanciate (doc 04)
- [ ] Sistema evoluzione (Fiorita/Ancestrale)
- [ ] Sistema Fusione + 6 ricette al lancio
- [ ] Sinergie "Radici Connesse"

### Epic: Contenuto Nemici
- [ ] 30 Marciti + FSM comportamentale (doc 05)
- [ ] 6 boss multi-fase con telegraph
- [ ] Bilanciamento scaling per mondo/difficoltà (doc 06)

### Epic: Meta-game
- [ ] Profilo, XP, valute, transazioni (doc 06/13)
- [ ] Missioni giornaliere/settimanali, achievement (doc 08)
- [ ] Negozio, Battle Pass (doc 15)
- [ ] Cloud save cross-device (doc 13)

### Epic: Modalità
- [ ] Campagna (95 livelli)
- [ ] Sopravvivenza + leaderboard
- [ ] Sfide (puzzle)
- [ ] PvP online + matchmaking + ranked
- [ ] Co-op locale/online

### Epic: UI/UX
- [ ] 13 schermate complete (doc 09) con navigazione e stati vuoti/errore gestiti
- [ ] Accessibilità (daltonismo, screen reader, scalabilità testo, riduzione motion)

### Epic: Audio/VFX
- [ ] Integrazione middleware audio, vertical layering (doc 10)
- [ ] Libreria VFX per famiglia/stato (doc 11)

### Epic: Live Ops & Backend
- [ ] Matchmaking Glicko-2 (doc 13)
- [ ] Dashboard live-ops interna (Remote Config, gestione eventi senza rilascio client)
- [ ] Anti-cheat server-authoritative per PvP

## Criteri di uscita per milestone (Definition of Done)

- Nessun bug bloccante/critico aperto (P0/P1).
- Ogni livello supera il "wave stress test" a 60/30 FPS target (doc 12).
- Copertura test automatizzata del Simulation Core ≥ 80% (logica critica: danni, stati, economia).
- Ogni schermata UI passa un audit di accessibilità di base prima del lancio.
