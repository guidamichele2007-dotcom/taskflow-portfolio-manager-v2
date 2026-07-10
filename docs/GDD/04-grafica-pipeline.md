# Capitolo 04 — Grafica e Pipeline di Rendering

## 1. Direzione Artistica

**Stylized-realistico "Ghibli × Monument Valley × fotografia naturalistica":** forme morbide e leggibili, palette emozionali per fascia oraria, materiali fisicamente plausibili ma con albedo pittorici, luce come protagonista. Riferimenti: Alba (Ustwo), Tchia, LEGO Builder's Journey, film Ghibli per cielo/vegetazione.

- **Palette:** ogni bioma ha una palette master (5 colori chiave + accento) documentata nello style bible; le fasce orarie applicano LUT dedicate.
- **Silhouette-first:** capibara e decorazioni leggibili in pura silhouette (test in viewport nero).
- **Regola del 60-30-10** per composizione colore delle scene.

## 2. Pipeline di Rendering (Unity URP 14, Forward+)

```
Shadow pass (cascade 2, soft) 
→ Depth prepass (necessaria per DoF/SSAO/acqua)
→ Opaque pass (Forward+, GPU instancing, SRP batcher)
→ Skybox proceduale (cielo+nuvole+astri)
→ Planar reflection (mezza res, solo specchio d'acqua principale, LOD qualità)
→ Transparent pass (acqua, vapore, particelle — soft particles con depth)
→ Post-processing stack
→ UI (canvas separato, blur grab-pass per glassmorphism)
```

### 2.1 Post-processing per fascia dispositivo

| Effetto | Fascia bassa | Media | Alta (iPhone 14+, flagship) |
|---------|--------------|-------|------------------------------|
| HDR rendering | ✔ (R11G11B10) | ✔ | ✔ + output HDR display |
| Tonemapping ACES + LUT grading | ✔ | ✔ | ✔ |
| Bloom | 3 mip, soglia alta | 5 mip | 6 mip + lens dirt sottile |
| Ambient Occlusion | baked only | SSAO half-res | SSAO full + micro-shadowing |
| Screen Space Reflections | ✘ (probes) | ✘ (planar sull'acqua) | SSR selettivo su superfici bagnate |
| Volumetric Lighting | fake (billboard god rays) | froxel low (32³) | froxel med (64³) + local fog volumes |
| Depth of Field | solo Photo Mode, gaussian | bokeh semplificato | bokeh fisico (apertura/focale reali) |
| Motion Blur | ✘ | ✘ | per-object solo Photo Mode/video |
| Soft Shadows | PCF 2 tap | PCF 5 tap | PCSS-like (penombra variabile) |
| Vignette/grain/CA | LUT-baked | leggeri | leggeri |

**Global Illumination:** baked lightmaps + Light Probes per **8 keyframe orari**, con blending runtime tra i due set adiacenti (tecnica "GI time-lapse") → GI dinamica percepita a costo quasi zero. Oggetti dinamici via probe volumes. Fascia alta: aggiunta di un termine di bounce screen-space leggero.

## 3. Libreria Shader (HLSL / Shader Graph custom)

### 3.1 Acqua (lo shader più importante del gioco)

- Profondità → gradiente colore (shallow turchese → deep blu) via depth fade.
- Normali: 2 layer di normal map scrollanti + **Gerstner waves** vertex (ampiezza per bioma; lago quasi piatto, mare ondoso).
- **Flow map** per fiumi/cascate (autogenerata dal tool di painting dell'acqua in editor).
- Riflessi: planar (principale) o probe + fresnel; **caustiche** proiettate sul fondale (texture animata via light cookie).
- **Foam:** bordo (depth-edge) + creste + scie dietro i capibara che nuotano (trail render in RT di interazione).
- **RT di interazione** (256², top-down, segue la camera): capibara, tocchi e gocce scrivono impulsi → simulazione ripple (ping-pong blur) letta dallo shader per normali dinamiche. Le stesse RT piegano l'erba.
- Rifrazione: grab-pass distorto (media/alta), sottosuperficie fake per acqua termale lattiginosa + vapore.

### 3.2 Pelo capibara

- **Shell fur 8–16 gusci** (LOD: 16 vicino in Photo Mode, 8 gameplay, 0→flat fur texture da lontano) con noise di lunghezza, gravità, **direzione dinamica** (vento, carezze, bagnato: gusci compressi + smoothness alta + colore scuro), rim light "peach fuzz" in controluce (il tramonto accende il contorno del pelo — shot iconico).
- Fascia bassa: 4 shell solo su spalle/schiena + fur normal map.

### 3.3 Vegetazione

- **Erba:** mesh instanziata GPU (compute culling + frustum + distanza), vento a 2 ottave (onda grande + flutter), interazione da RT (si piega attorno a capibara/giocatore), colore che campiona una **tinta del terreno** per integrazione perfetta.
- **Foglie/alberi:** vento gerarchico (pivot painting: tronco→ramo→foglia), translucency fake (backlight), LOD imposter oltre 40m.
- **Fiori:** apertura mattutina via vertex anim parametrica (0–1 dal TimeOfDay).

### 3.4 Cielo e nuvole

- Skybox procedurale: gradiente 3-stop dinamico, sole/luna con dischi e alone, stelle (cubemap + twinkle), via lattea di notte, fasi lunari.
- Nuvole: 2.5D volumetric billboards (SDF-shaded per auto-ombreggiatura) + strato cirri scrolling; colorate dal sole (rosa al tramonto). Ombre delle nuvole: cookie texture scrolling sul direzionale.

### 3.5 Meteo

- **Pioggia:** particelle GPU + streaks su schermo (Photo Mode), **wetness globale** (parametro che scurisce albedo e alza smoothness su tutti i materiali via keyword), pozzanghere (maschera height-based con riflessi planari).
- **Neve:** top-coverage world-space (normale Y) con accumulo progressivo, sparkle (glitter noise), deformazione (RT di impronte come l'acqua).
- **Nebbia:** height fog esponenziale + volumi locali con scattering direzionale (sole nella nebbia = glow).

### 3.6 Altri

Terreno splat 4-layer con blending height-based; lanterne emissive con flicker fisico; hologrammi soft (bioma futuristico); shader UI glassmorphism (blur + tint + bordo luminoso).

## 4. Pipeline Asset Grafici

```
Concept (style bible) → Blocking 3D (Blender) → High poly → Retopo game-res
→ UV + bake (Marmoset) → Texturing PBR (Substance Painter, palette-constrained)
→ Export FBX/GLB → Import automatizzato Unity (preset per categoria)
→ Prefab con LOD + colliders + slot interazione → Addressable group per bioma
```

- **Budget poligoni:** capibara 12k tris (LOD0) → 6k → 2.5k → imposter; decoration hero 8k; prop medio 1.5k; vegetazione istanza 200–800.
- **Texture:** capibara 2048 atlas (albedo/normal/ORM/fur-params), prop 1024/512, ASTC 6×6 (UI 4×4), mipmap streaming attivo.
- **Naming convention:** `BIOME_Category_AssetName_LOD0` (`SPR_Deco_Lantern_Stone_LOD0`), materiali `M_`, texture `T_..._{ALB|NRM|ORM|EMI}`.
- **Review:** ogni asset passa il "wallpaper test" nella lightbox scene (8 fasce orarie automatiche, screenshot batch generati da tool editor).
