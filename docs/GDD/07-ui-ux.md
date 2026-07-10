# Capitolo 07 — UI / UX

## 1. Principi

1. **La UI si toglie di mezzo:** il mondo è il protagonista. HUD minimale che sfuma dopo 5s di inattività (torna col tocco).
2. **Glassmorphism naturale:** pannelli in vetro smerigliato (blur del mondo dietro + tint della fascia oraria) — la UI riflette letteralmente il mondo.
3. **Tutto risponde:** ogni elemento interattivo ha feedback visivo (≤50ms), sonoro e aptico.
4. **Zero dark patterns:** niente badge rossi ansiogeni, niente countdown FOMO aggressivi, conferme chiare sugli acquisti.

## 2. Design System

- **Tipografia:** rounded sans (Nunito/Quicksand-like), 3 pesi; dimensioni fluide (safe area aware, min 16pt touch text).
- **Colori UI:** neutri caldi semi-trasparenti + accento dinamico per fascia oraria (il pulsante primario è dorato al tramonto, lavanda di notte).
- **Componenti (UI Toolkit/uGUI + libreria interna `ParadiseUI`):** GlassPanel, PillButton, IconButton, CurrencyCounter, ProgressLeaf (barra XP a forma di stelo che fiorisce), CapyCard, Toast, BottomSheet, RadialMenu (interazioni sul capibara), Tooltip una-tantum.
- **Microanimazioni:** catalogate in `UIMotionPresetsSO` (Cap. 05 §5): Gentle (300ms), Bouncy (450ms, spring), Snappy (150ms). Parallax multilivello nei pannelli via giroscopio (±3°). Blur montato in 150ms (mai istantaneo).
- **Haptics:** light impact (tocchi), soft (carezza, continuo modulato), success pattern (ricompense), mai su eventi ambientali. API unificata `HapticsService` (Core Haptics / Android VibrationEffect).
- **Suoni UI:** famiglia di suoni in legno/acqua/bambù (Cap. 08) — coerenti col mondo, non "beep digitali".

## 3. Flussi UI principali

### 3.1 Mappa dei flussi

```
Boot → Logo (skippabile) → Title (il mondo live come sfondo, "Tocca per entrare")
 └→ MONDO (stato default, HUD minimale)
     ├→ Radial menu capibara (tap su capibara): Accarezza | Nutri | Gioca | Foto | Profilo
     ├→ Modalità Costruzione (bottone martello): catalogo bottom-sheet → placement → conferma
     ├→ Photo Mode (bottone camera): controlli fotografici → scatto → editor → condividi/salva
     ├→ Zen Mode (bottone loto): UI scompare del tutto
     ├→ Capy-Dex / Collezione (bottone libro): griglia card → dettaglio 3D live
     ├→ Missioni & Pass (bottone pergamena): tab giornaliere/settimanali/storia/pass
     ├→ Social (bottone lanterna): amici → visita | regali | classifiche | codici blueprint
     ├→ Negozio (bottone bancarella): sezioni chiare, prezzi visibili, anteprima 3D nel mondo
     └→ Impostazioni: audio, grafica (tier + toggle singoli), accessibilità, account/cloud
```

### 3.2 HUD (stato mondo)

Angolo alto-sx: valute (contatori glass, count-up animato). Alto-dx: missioni pin (1 riga, espandibile). Basso: dock a 6 icone (Costruzione, Foto, Zen, Dex, Social, Negozio) che affonda quando inattivo. Notifiche: toast gentili in alto, mai modali non richieste.

### 3.3 Onboarding UX

Tutorial diegetico (Cap. 01 §2); ogni sistema avanzato introdotto da tooltip contestuale alla prima apertura, mai più di 1 concetto per volta.

## 4. Accessibilità

- Testi scalabili (fino a 140%), alto contrasto opzionale per la UI, daltonismo: rarità comunicate da icone-forma oltre che colore.
- Riduzione movimento (disattiva parallax/shake/overshoot), riduzione flash (fulmini attenuati).
- Gioco completo senza audio; sottotitoli descrittivi opzionali per gli eventi sonori ("[verso felice]").
- Touch: target ≥44pt, nessun gesto obbligatorio complesso (alternativa a due dita sempre presente), supporto controller e switch access.
- Localizzazione lancio: EN, IT, ES, FR, DE, PT-BR, JA, KO, ZH-Hans (pipeline chiavi → sheet → import automatico; pseudo-loc test in CI).
