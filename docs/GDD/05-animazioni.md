# Capitolo 05 — Animazioni

L'animazione è il punto principale del progetto: **niente nel gioco è statico**.

## 1. I 10 Comandamenti dell'Animazione (obbligatori in review)

Ogni animazione — dal capibara al pulsante UI — deve dimostrare:

1. **Anticipation** — ogni azione è preceduta da un movimento contrario (il salto parte da un accovacciamento; il pulsante si comprime prima del release).
2. **Follow-through** — le parti morbide (orecchie, pancia, tessuti, pannelli UI) continuano dopo lo stop del corpo principale.
3. **Ease-in / Ease-out** — nessuna curva lineare: standard `cubic-bezier` catalogate nel design system (Gentle, Bouncy, Snappy, Lazy).
4. **Secondary motion** — ogni azione primaria genera motion secondario (una carezza muove pelo + orecchie + palpebre).
5. **Squash & stretch** — volumi vivi: atterraggi, masticazione, UI elastica (sempre volume-preserving, max 15% sui capibara per restare credibili).
6. **Overlapping animation** — le parti partono sfalsate (testa → collo → corpo → coda; liste UI a cascata 30ms).
7. **Arcs** — traiettorie curve, mai rette.
8. **Timing asimmetrico** — out veloce, settle lento.
9. **Idle mai morto** — respirazione + micro-motion su qualsiasi cosa "ferma".
10. **Interruptibilità** — ogni animazione è interrompibile con blend pulito (il giocatore non aspetta mai).

## 2. Architettura Runtime (Unity Playables / Animancer)

```
AnimGraph capibara:
Locomotion Layer (motion matching / blend space 2D)
 + Action Layer (attività: mangiare, onsen, gioco…)  [override parziale, avatar mask]
 + Emotion Additive Layer (postura per emozione)
 + Breathing Additive Layer (procedurale, sempre attivo)
 + Look-At/Head IK Layer (procedurale)
 + Secondary Motion (Jobs: orecchie/guance/pancia — post-anim)
 + Foot IK / Terrain Adaptation (post-anim, full-body lean)
Facial: ExpressionController → blend shapes (indipendente, LateUpdate)
```

- **Motion matching "lite":** database di clip di locomozione taggate (velocità, curvatura, start/stop/turn) con selezione a costo minimo su feature ridotte (posizione/velocità piedi + traiettoria futura). Costo CPU contenuto, risultato: transizioni di locomozione senza foot-sliding. Fallback fascia bassa: blend tree classico con eventi di sync dei passi.
- **Inverse Kinematics:** two-bone IK zampe (piede aderente al terreno con raycast cache + pelvis adjust su pendii), head/eye look-at a catena con pesi (occhi 100%, testa 60%, collo 30%) e delay a cascata, snout IK per mangiare/annusare al punto esatto, "hand" IK per tenere cibo/oggetti.
- **Animazione procedurale:** respirazione, saccadi, blink, ear physics, weight shift, adattamento pendenza, scrollone d'acqua (curve procedurali su spine + noise), dondolio amaca (pendolo fisico), galleggiamento in acqua (buoyancy sinusoidale + roll).
- **RhythmSync:** servizio che espone beat/BPM della musica corrente; danze e festeggiamenti si sincronizzano (anche le lanterne pulsano leggermente a tempo in modalità festa).

## 3. Pipeline di Produzione Animazioni

```
Reference video capibara reali (repository interno taggato)
→ Blocking in Blender (rig di controllo condiviso)
→ Spline/polish + fisica secondaria di prova
→ Review con "10 Comandamenti" checklist
→ Export FBX (root motion dove serve) → Import preset Unity
→ Tag nel database motion matching / registrazione in ActivitySO
→ Test in-game con tool "AnimGym" (scena con tutti i terreni/pendenze/acqua)
```

- Naming: `CAPY_Category_Action_Variant` (`CAPY_Idle_EarTwitch_L`, `CAPY_Swim_Surface_Loop`).
- Budget: ~180 clip capibara al lancio (60 condivise, 120 tra archetipi/rarità), 30 fps di authoring, interpolazione runtime.
- **Ogni sprint d'arte include almeno 1 "delight animation"** non richiesta dal gameplay (es. capibara che starnutisce e si spaventa del proprio starnuto).

## 4. Animazione del Mondo

| Elemento | Tecnica |
|----------|---------|
| Alberi/erba/fiori | Vertex shader wind (Cap. 04) + eventi (scrollata quando un uccello si posa) |
| Acqua | Shader + RT interazione + Gerstner |
| Nuvole | Scroll + morph noise |
| Fuoco/lanterne | Flipbook + distorsione heat haze + luce flicker (curva fisica, non random) |
| Oggetti interattivi | Ogni decorazione ha stato idle animato (mulino che gira, campanella al vento, bandierine) |
| NPC/animali | Set ridotti con stesso rigore (uccelli: hop, becchetta, vola; pesci: boids + salto) |
| Fotocamera | Movimenti su curve smoothed-damped, mai lineari; shake solo additivo e minimo; virtual cameraman in Zen Mode con composizione a terzi automatica |
| Transizioni di scena | Mai fade nero secco: iris con foglia di ninfea, oppure la camera si tuffa nell'acqua e riemerge nel nuovo bioma |

## 5. Animazione UI (dettaglio nel Cap. 07)

- **Pulsanti:** hover/press = scala 0.96 con squash, release = overshoot 1.04 → settle (spring damping 0.7), glow che pulsa sul CTA primario.
- **Menu/pannelli:** entrata a scivolo con overshoot elastico + fade + blur del fondo che monta in 150ms; elementi interni a cascata (stagger 25–40ms).
- **Carte (collezione):** flip 3D con luce che scorre sulla superficie, parallax interno multilivello (sfondo/capibara/cornice a profondità diverse col giroscopio), rarità epic+ con particelle nella card.
- **Inventario:** oggetti che "respirano" (scale 1±0.5% lento), drag con inclinazione fisica verso la direzione del movimento, drop con squash.
- **Contatori valuta:** count-up con easing + coin-burst che vola in arco verso il contatore (arcs!).
- Tutte le animazioni UI via tween engine (PrimeTween/DOTween) con **preset centralizzati** (`UIMotionPresetsSO`) — nessun valore magico sparso.

## 6. Quality Gate

- Ogni feature con animazione passa una **Motion Review** settimanale (video capture side-by-side con reference).
- Metriche automatiche in CI: nessuna clip con curve lineari pure; foot-sliding < soglia (tool di misura in AnimGym); frame time del sistema animazione entro budget (Cap. 10).
