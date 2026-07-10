# Capitolo 03 — Il Mondo Vivo

## 1. Struttura del Mondo

Il mondo è un **arcipelago**: isole-bioma collegate da traghetti di ninfee (loading mascherati da viaggio contemplativo). Ogni bioma è una scena Addressable indipendente (streaming, memoria sotto controllo).

### 1.1 Biomi (ordine di sblocco)

| # | Bioma | Identità visiva | Elementi unici |
|---|-------|-----------------|----------------|
| 1 | **Riva del Lago** (start) | Prato dorato, lago specchio, salici | Tutorial, moli di legno |
| 2 | **Sorgenti Termali** | Onsen rocciosi, vapore volumetrico, aceri | Yuzu galleggianti, macaco ospite |
| 3 | **Giardino Giapponese** | Ghiaia rastrellata, koi, torii, sakura | Cerimonia del tè per capibara |
| 4 | **Foresta & Bosco** | Sequoie, god rays, felci, funghi bioluminescenti di notte | Cervi, gufi |
| 5 | **Fiume & Cascate** | Rapide dolci, cascata scenica con arcobaleno fisso al mattino | Tubing dei capibara sulle foglie giganti |
| 6 | **Prateria** | Colline a onde di vento (grass wind waves) | Corse di gruppo |
| 7 | **Spiaggia & Isole** | Sabbia bagnata riflettente, palme, tramonto tropicale | Granchi, castelli di sabbia |
| 8 | **Villaggio & Tempio** | Case di legno, lanterne, mercato, tempio sul monte | NPC animali artigiani |
| 9 | **Montagna** | Pini, nebbia di valle, ponti sospesi | Aquile, eco dei versi |
| 10 | **Deserto Fiorito** | Dune, oasi, cactus in fiore, notti stellate assolute | Volpi fennec, miraggi |
| 11 | **Zona Innevata** | Neve deformabile, onsen fumanti nel gelo (scena iconica) | Pupazzi, aurora boreale |
| 12 | **Città Futuristica** | Neon soft, giardini verticali, capsule onsen hi-tech, acqua e vetro | Droni-lucciola, tram sospeso |

### 1.2 Ogni bioma contiene (checklist di produzione)

- **Vegetazione dinamica:** erba instanziata GPU (interattiva: si piega al passaggio), alberi con vento gerarchico (tronco/rami/foglie), fiori con bloom giornaliero (si aprono all'alba).
- **Vento:** campo di vento globale (direzione, intensità, raffiche Perlin) letto da shader vegetazione, particelle, orecchie/pelo dei capibara, superficie acqua, bandiere/lanterne.
- **Acqua realistica:** shader dedicato (Cap. 04) con profondità colorata, foam sulle rive, caustiche, riflessi, flow map sui fiumi, interazione (ripples da tocchi e capibara).
- **Nebbia volumetrica:** height fog + volumi locali (valli, onsen, alba) con scattering della luce.
- **Nuvole animate:** skybox dinamica con nuvole procedurali 2.5D (billboard volumetrici) che proiettano ombre in movimento sul terreno.
- **Illuminazione dinamica:** sole/luna direzionali animati, GI baked-blended per fascia oraria, luci locali (lanterne) accese di notte.
- **Riflessi:** planar reflection sul corpo d'acqua principale (mezza risoluzione), reflection probes per il resto, SSR solo su fascia alta.
- **Particelle ambientali:** pollini, foglie, petali, neve, polvere dorata nei god rays, vapore, lucciole.
- **Fauna minore:** insetti (farfalle con flight path a spirale, libellule sull'acqua), pesci (banchi con boids semplificato, salti occasionali), uccelli (si posano, becchettano, volano via se un capibara corre — reattività!), animali amici per bioma (tartaruga, gatto del villaggio, koi, granchi, volpi...).

## 2. Ciclo Giorno/Notte

Durata: **1 giornata di gioco = 2 ore reali** (configurabile in Zen Mode; nel Photo Mode l'ora è libera).

| Fase | Luce & atmosfera | Musica | Comportamenti | Eventi/suoni |
|------|------------------|--------|---------------|--------------|
| **Alba (5–7)** | Cielo rosa-lavanda, nebbia bassa che si dirada, ombre lunghissime, rugiada scintillante sull'erba | Piano solo, note rade | I capibara si svegliano uno a uno (sequenza a catena di sbadigli), fiori che si aprono | Coro uccelli crescente, primo verso di capibara |
| **Mattina (7–11)** | Luce dorata pulita, cielo azzurro, nuvole bianche | Tema principale, chitarra+archi | Colazione, giochi, esplorazione, massima energia | Api, brezza, acqua vivace |
| **Mezzogiorno (11–14)** | Luce alta neutra, ombre corte, heat shimmer leggero d'estate | Arrangiamento rarefatto, marimba | Pisolini all'ombra, bagni per rinfrescarsi | Cicale, tuffi |
| **Pomeriggio (14–17)** | Luce che scalda gradualmente, nuvole che si allungano | Tema in tonalità calda | Onsen time, socialità, grooming | Vento nelle fronde |
| **Tramonto (17–19)** | **Golden hour spettacolare**: cielo a gradiente arancio-viola, controluce con rim light sul pelo, riflessi infuocati sull'acqua | Versione emotiva del tema, violoncello | Tutti gravitano verso i punti panoramici (vignette di gruppo fotografabili) | Campana del tempio, gabbiani |
| **Notte (19–5)** | Blu profondo, stelle e via lattea, luna con fasi reali, lanterne accese, lucciole, funghi bioluminescenti | Ninnananna ambient, carillon | Pile di capibara addormentati, i notturni (rari!) escono | Grilli, gufi, crepitio lanterne |

**Transizioni:** il `TimeOfDayService` interpola set di parametri (`SkyProfileSO` per keyframe orari): colore/intensità sole, gradiente cielo, fog, esposizione, LUT color grading, intensità lanterne, mix audio. Interpolazione continua — mai scatti.

## 3. Meteo

`WeatherService` con catene di Markov per bioma/stagione (il deserto quasi mai pioggia; la montagna neve frequente). Ogni meteo modifica **davvero** gameplay e mondo:

| Meteo | Effetti visivi | Effetti gameplay |
|-------|----------------|------------------|
| **Pioggia** | Shader pioggia (streaks screen-space + splash su superfici), pozzanghere che si formano con riflessi, wet shading (albedo scurito, smoothness alzata), gocciolio dalle foglie | I capibara AMANO la pioggia leggera (giocano), alcuni rari appaiono solo con pioggia; produzione ninfee +20%; ombrellini decorativi usati davvero |
| **Temporale** | Nuvoloni scuri, fulmini con lampo globale (fino a 2s di luce), pioggia intensa | Capibara al riparo/nell'onsen; spaventi teneri col tuono (si consolano a vicenda); dopo il temporale: funghi rari da raccogliere |
| **Arcobaleno** | Post-temporale con sole: arcobaleno volumetrico posizionato rispetto al sole | Evento fotografico (missioni dedicate); i capibara si fermano a guardarlo (davvero) |
| **Neve** | Accumulo dinamico su superfici (shader top-snow), neve deformabile al passaggio, fiato visibile | Sblocca giochi neve; onsen affollatissimi (scena iconica); impronte tracciabili |
| **Nebbia** | Fog volumetrica densa, silhouette, suoni attutiti (LPF audio) | Atmosfera mistica; il Capibara della Luna appare solo nella nebbia notturna |
| **Vento forte** | Erba a onde, foglie/petali a vortice, orecchie di tutti al vento (adorabile) | Aquiloni decorativi si alzano; semi speciali portati dal vento |
| **Foglie (autunno)** | Pioggia di foglie con fisica a spirale | Mucchi di foglie in cui i capibara si tuffano |
| **Petali (primavera)** | Petali di sakura ovunque, sull'acqua formano scie | Petali raccoglibili (valuta evento Hanami) |

## 4. Il Mondo che Reagisce

Regola di design: **tutto ciò che si vede deve poter reagire ad almeno una cosa.** Erba → passi. Acqua → tocchi. Uccelli → rumori. Lanterne → vento. Capibara → tutto. Questa densità di reattività è ciò che trasforma un diorama in un luogo vivo.
