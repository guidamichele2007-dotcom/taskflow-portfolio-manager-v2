# Capitolo 06 — Effetti Visivi (VFX)

## 1. Filosofia

I VFX di Capybara Paradise sono **morbidi, diffusi, mai aggressivi**: niente esplosioni sature, solo luce, acqua, natura e magia gentile. Ogni effetto deve poter comparire in uno screenshot senza rovinarlo.

## 2. Tecnologia

- **GPU particles** (VFX Graph su fascia media/alta; Shuriken ottimizzato come fallback e per effetti con collisioni di gameplay).
- **Soft particles** ovunque (depth fade) — nessuna intersezione dura.
- **Texture:** atlas condivisi per categoria (1 atlas natura, 1 acqua, 1 magia, 1 UI) — 4 draw call totali per i VFX ambientali.
- **Object pooling obbligatorio** per tutti gli effetti one-shot (`VfxPoolService`, prewarm al load del bioma).
- **LOD dei VFX:** ogni sistema ha 3 tier (conteggio particelle ×1 / ×0.5 / ×0.25) legati al Quality Tier del dispositivo + scaling dinamico se il frame time sale (Cap. 10).

## 3. Catalogo VFX

### 3.1 Ambientali persistenti (budget per bioma: ~2000 particelle GPU attive fascia media)

| Effetto | Dettagli |
|---------|----------|
| Pollini/polvere dorata | Visibili solo nei god rays (moltiplicati dalla luce volumetrica), drift Perlin lentissimo |
| Foglie | Spawn dagli alberi col vento, spirale discendente (rotazione su 2 assi), atterrano e restano 10s su terreno/acqua (sull'acqua seguono il flow) |
| Petali sakura | Come foglie ma più leggeri, scia rosa sull'acqua |
| Lucciole | Notte: glow pulsante asincrono, flight path Lissajous, si allontanano dolcemente dal tocco |
| Insetti | Farfalle (2 piani flap + path fiore-fiore), libellule (dart & hover sull'acqua) |
| Vapore onsen | Volumetrico layered: billboard soft a scroll + distorsione heat haze + goccioline sul bordo vasca |
| Bolle | Nell'acqua termale, risalgono con wobble, pop in superficie con micro-splash |
| Neve | GPU, accumulo (Cap. 04), fiocchi grandi in primo piano con rotazione |
| Pioggia | GPU streaks + splash ring su superfici + drip dalle foglie (spawn sotto le chiome) |

### 3.2 Reattivi (gameplay)

| Trigger | Effetto |
|---------|---------|
| Carezza | Cuoricini soffusi che salgono ad arco + sparkle sul pelo + anello soft dal punto di contatto |
| Capibara in acqua | Splash direzionale a corona (scala con velocità d'ingresso), ripple RT, gocce con rifrazione |
| Scrollone post-bagno | Spirale di gocce full-body (mesh particle emission dalla superficie del modello) |
| Corsa | Polvere/erba/neve dai passi (surface-dependent), farfalle che si alzano dall'erba |
| Cibo | Briciole fisiche, sparkle "gnam", cuore finale |
| Level up legame | Aura dorata gentile + petali luminosi + onda di luce sul terreno (shader ring) |
| Arrivo raro/epico/leggendario | Sequenza dedicata: lucciole convergono → flash soffuso → particelle tematiche persistenti del capibara |
| Costruzione | Puff di polvere magica + foglioline, l'oggetto "cresce" da terra con squash & stretch |
| Regalo aperto | Nastro che svolazza via con fisica, coriandoli pastello a bassa gravità |

### 3.3 Luce e magia

- **God rays:** volumetrici (fascia alta) o billboard shader animati (media/bassa) tra le fronde al mattino.
- **Glow:** bloom controllato con soglia HDR; le emissive (lanterne, funghi, neon soft) sono la fonte primaria di magia notturna.
- **Scintille/brillii:** micro-sparkle su rugiada all'alba, neve al sole, occhi dei capibara felici (1 particella, timing perfetto).
- **Effetti magici:** riservati a eventi (aurora boreale shader, spiriti-lucciola del tempio, scie delle stelle cadenti — desiderio esprimibile 1/notte).

## 4. Pipeline VFX

```
Brief (design) → Mockup in AnimGym → Review estetica ("wallpaper test")
→ Ottimizzazione (overdraw heatmap, conteggio, fill rate) → Tier LOD ×3
→ Registrazione in VfxCatalogSO (id, pool size, tier) → Hook a GameEvents
```

Regole: overdraw massimo 2.5× su mobile view; nessuna particella con luce realtime (fake light via shader additivo sul terreno); tutte le texture VFX in un canale/atlas condiviso quando possibile.
