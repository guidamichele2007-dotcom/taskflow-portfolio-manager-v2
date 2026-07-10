# Capitolo 01 — Gameplay

## 1. Gameplay Loop

### 1.1 Core Loop (30–90 secondi)

```
Osserva il mondo → Interagisci (accarezza / nutri / gioca) → Soddisfa un bisogno
      ↑                                                              ↓
Ricevi ricompensa visiva + valuta ← Il capibara reagisce (emozione, animazione)
```

### 1.2 Meta Loop (sessione, 3–10 minuti)

```
Raccogli valute passive → Completa missioni → Costruisci/decora habitat
        ↑                                            ↓
Nuovi capibara arrivano ← L'habitat migliorato attira capibara più rari
```

### 1.3 Macro Loop (giorni/settimane)

```
Sblocca nuovi biomi → Completa la collezione → Eventi stagionali → Condivisione social
```

Ogni loop alimenta il successivo: l'interazione produce valuta, la valuta produce bellezza (decorazioni/habitat), la bellezza attira capibara, i capibara producono nuove interazioni e contenuto fotografabile/condivisibile.

## 2. Tutorial

- **Filosofia:** "show, don't tell". Nessun muro di testo; il tutorial è un'alba giocata.
- **Struttura (primi 10 minuti):**
  1. **Cinematica interattiva:** alba, un capibara solitario. Prompt: tocca per accarezzare.
  2. **Primo bisogno:** icona fame delicata (fumetto pensiero con yuzu). Drag del cibo → animazione di masticazione felice → prima valuta.
  3. **Prima costruzione:** posiziona una sorgente termale prefabbricata (ghost placement con grid-snap morbido). Il capibara ci entra subito → momento "wow" (vapore, riflessi, occhi socchiusi).
  4. **Arrivo del secondo capibara:** nuota dal fiume, si presenta con card di collezione.
  5. **Photo Mode guidato:** una missione chiede di scattare la prima foto → ricompensa.
  6. Da qui il gioco è aperto; i sistemi avanzati (eventi, amici, creativa) si sbloccano progressivamente per livello con tooltip contestuali una-tantum.
- **Tecnica:** `TutorialService` a step dichiarativi (ScriptableObject `TutorialStepSO`: condizione di attivazione, target UI highlight, testo, condizione di completamento). Skippabile dopo il primo habitat. Ogni step loggato in analytics per funnel.

## 3. Progressione e Sistema Livelli

### 3.1 Livello Paradiso (account level)

- XP guadagnata da: interazioni (piccola), missioni (media), costruzione (media), foto (piccola), eventi (grande).
- Curva: `XP(n) = 100 * n^1.6` — dolce all'inizio, mai punitiva; livello cap 120 al lancio.
- Ogni livello sblocca **una cosa concreta e visibile** (mai solo numeri): nuova decorazione, nuovo terreno, nuova specie ospite, slot habitat, filtro fotocamera, brano musicale.

### 3.2 Legame con i capibara (Bond Level)

- Ogni capibara ha un livello di legame 1–20, cresciuto con cura quotidiana.
- Sblocca: nuove animazioni idle, emote, pose per il Photo Mode, accessori indossabili, e al livello 10 il "momento speciale" (mini-cinematica unica per personalità).

### 3.3 Livello habitat

- Ogni bioma ha un punteggio **Armonia** (0–5 stelle) calcolato da: varietà decorazioni, copertura vegetale, acqua, comfort (fonti termali, cuscini), pulizia. L'Armonia determina rarità e frequenza dei visitatori.

## 4. Economia e Valute

| Valuta | Nome | Fonte | Uso | Note |
|--------|------|-------|-----|------|
| Soft | **Foglie di Ninfea** 🍃 | Interazioni, missioni, produzione passiva degli habitat | Decorazioni base, cibo, espansioni terreno | Generosa; nessun cap frustrante |
| Media | **Yuzu d'Oro** 🍊 | Achievement, eventi, login, Bond level | Decorazioni pregiate, accessori, ricette speciali | Ottenibile SOLO giocando |
| Hard | **Stelle di Sorgente** ⭐ | IAP + quantità significativa gratuita (eventi, battle pass gratuito, achievement) | Cosmetici premium, espansioni tematiche | Mai richiesta per progredire |
| Evento | Token stagionali | Attività evento | Negozio evento a prezzi fissi (no gacha) | Convertiti in Foglie a fine evento |

**Regole economiche:**
- Nessun oggetto gameplay-rilevante acquistabile solo con valuta hard.
- Sink principali: decorazioni (60%), espansioni (25%), cibo/consumabili (15%).
- Faucet bilanciati per ~30 min di gioco/giorno; simulazione economica in foglio bilanciamento (`/Design/Economy/economy_model.xlsx`) con curva di earn/spend per giorno 1–90.
- Prezzi con "pity ceiling": tutto ciò che è a rotazione ritorna entro 60 giorni.

## 5. Missioni

- **Giornaliere (3/giorno, reroll gratuito 1/giorno):** "Accarezza 5 capibara", "Scatta una foto al tramonto", "Fai il bagno termale a Momo". Ricompense: Foglie + XP + 1 Yuzu.
- **Settimanali (5/settimana):** obiettivi più ampi ("Raggiungi Armonia 3★ nella Foresta"). Ricompense: Yuzu + materiale decorativo raro.
- **Storia dell'isola (capitoli):** quest narrative leggere che introducono biomi e NPC (la Gru Custode, la Lontra Postina). Nessun timer.
- **Missioni dei capibara:** generate dalla personalità (un capibara "Esploratore" chiede di visitare la cascata). Rafforzano la caratterizzazione.
- **Architettura:** `QuestService` con `QuestSO` (id, tipo, trigger, contatore, ricompense, condizioni meteo/ora opzionali). Progressi tracciati da un event bus (`GameEvents.OnPet`, `OnPhotoTaken`, `OnBuildPlaced`...). Serializzati nel save.

## 6. Achievement

- ~120 achievement in categorie: Collezione, Costruzione, Fotografia, Cura, Esplorazione, Eventi, Segreti.
- Esempi: "Zen Master — osserva il mondo per 10 minuti senza toccare nulla", "Paparazzo — 100 foto", "Onsen Party — 8 capibara nella stessa sorgente termale", "Yuzu Sommelier — servi ogni tipo di frutto".
- Tier bronzo/argento/oro con ricompense in Yuzu e cornici profilo. Sincronizzati con Game Center / Google Play Games.

## 7. Collezione Capibara e Sistema Rarità

### 7.1 Rarità

| Rarità | Colore | % popolazione | Caratteristiche |
|--------|--------|---------------|-----------------|
| Comune | Verde | 55% | Manti naturali, personalità base |
| Non comune | Azzurro | 25% | Varianti di manto, 1 tratto speciale |
| Raro | Viola | 13% | Pattern unici (macchie a cuore, ciuffo), animazione idle esclusiva |
| Epico | Ambra | 6% | Tema visivo (Sakura, Muschio, Tramonto), VFX passivo leggero (petali, lucciole) |
| Leggendario | Iridescente | 1% | Design narrativo (il Capibara della Luna, il Guardiano dell'Onsen), cinematica di arrivo, brano musicale dedicato |

### 7.2 Acquisizione — niente gacha

I capibara **non si comprano e non si estraggono**: **arrivano** quando le condizioni dell'habitat li attraggono (Armonia, decorazioni tematiche, cibo preferito, meteo/ora). Il Capy-Dex mostra indizi ("Ama le notti di pioggia e le lanterne blu..."), trasformando la collezione in un puzzle gentile di deduzione. I leggendari richiedono catene di condizioni scoperte tramite la storia o la community.

### 7.3 Capy-Dex

Enciclopedia animata: modello 3D live ruotabile, bio, personalità, preferenze, animazioni sbloccate, foto scattate a quel capibara, progresso legame. Silhouette per i non scoperti con indizio.

## 8. Costruzione Habitat, Decorazioni, Personalizzazione

- **Modalità Costruzione:** vista rialzata (tilt-shift leggero per effetto diorama), grid-snap morbido con free placement opzionale, rotazione a 45°/libera, undo/redo illimitato, copia-stile, salvataggio di **blueprint** riutilizzabili e condivisibili via codice.
- **Categorie decorazioni (600+ al lancio):** Natura (piante, rocce, tronchi), Acqua (stagni modulari, cascate, ruscelli con flow map auto-generata), Comfort (onsen, amache, cuscini), Giapponese (torii, lanterne, ponti), Luci (lucine, lanterne galleggianti), Stagionali, Futuristiche (bioma city), Terreni e sentieri (painting diretto sul terreno con blending).
- **Decorazioni funzionali:** ogni oggetto Comfort/Acqua/Cibo genera *slot di interazione* che i capibara usano davvero (l'amaca ha un'animazione dedicata di dondolio con fisica).
- **Personalizzazione capibara:** accessori cosmetici (cappellini, sciarpe, fiori sull'orecchio, occhialini da onsen, zainetti) con physics propria; niente cambi di stat — solo estetica e amore.
- **Personalizzazione giocatore:** nome isola, cornice profilo, biglietto da visita animato mostrato agli amici.

## 9. Fotocamera, Screenshot Mode e Photo Mode

Il Photo Mode è un pilastro di prodotto (motore social).

- **Fotocamera libera:** orbita/pan/zoom, drone mode su spline, altezza erba regolabile.
- **Controlli fotografici reali:** focale (15–135mm), apertura → Depth of Field fisico, esposizione, bilanciamento bianco, tempo (motion blur dell'acqua!).
- **Regia della scena:** pausa del tempo o slow-motion 0.1×–1×, cambio ora del giorno e meteo *solo dentro il Photo Mode*, chiamata pose ("guarda in camera", emote sbloccate col legame).
- **Post: filtri** curati (Ghibli Soft, Onsen Film, Polaroid, Acquerello — via LUT), grana, vignettatura, cornici, sticker.
- **Screenshot mode:** un tap nasconde tutta la UI e scatta in risoluzione nativa; export anche in **Live Photo / video 5s loop** per wallpaper animati reali.
- **Galleria in-game** con album per capibara; le foto migliori appaiono nelle cornici decorative degli habitat.

## 10. Modalità Rilassante e Modalità Creativa

- **Modalità Rilassante (Zen Mode):** UI completamente nascosta, camera cinematica automatica che vaga tra composizioni curate (sistema di *virtual cameraman*: punti di interesse pesati per evento — capibara che entra nell'onsen, tramonto, pioggia), musica adattiva in primo piano, opzionale timer respirazione/pomodoro. Utilizzabile in portrait come "acquario da comodino"; luminosità ridotta e frame cap 30 FPS per batteria.
- **Modalità Creativa:** sandbox separata con tutte le decorazioni sbloccate per costruire liberamente (senza costi), test di diorami e set fotografici. I blueprint creati qui sono esportabili ma costruirli nel mondo vivo richiede le risorse normali.

## 11. Eventi Giornalieri e Stagionali

- **Giornalieri:** micro-eventi ambientali a rotazione (Pioggia di petali alle 17:00, Visita dell'Airone, Mercatino galleggiante della Lontra) — durano 15–30 min di orologio di gioco, notificati con gentilezza.
- **Settimanali:** weekend a tema (Onsen Festival: tutti i capibara gravitano verso le terme, sconti decorazioni acqua).
- **Stagionali (4/anno + festività):** Hanami (primavera), Festival delle Lanterne (estate), Foliage & Funghi (autunno), Yuzu-Yu invernale (la vera tradizione dei capibara negli onsen col yuzu!). Ogni stagione porta: bioma ridecorato, capibara evento, decorazioni, brano musicale, pass cosmetico. Contenuti scaricati via Addressables/CDN, attivati da Remote Config.
- **Ricompense:** sempre a negozio evento con prezzi fissi in token — il giocatore sceglie cosa prendere, zero loot box.

## 12. Login, Salvataggio Cloud, Identità

- **Login:** guest immediato (device id) → upgrade a Apple/Google Sign-In per cloud e social. Nessuna registrazione obbligatoria prima di giocare.
- **Ricompense login:** calendario mensile morbido (nessuna perdita per giorni saltati: il calendario avanza quando entri, non per data).
- **Salvataggio cloud:** save autoritativo locale con sync cloud (dettagli tecnici e risoluzione conflitti in Cap. 09). Cross-device iOS↔Android via account.

## 13. Classifiche, Multiplayer Asincrono, Visite, Social

- **Classifiche gentili:** niente ladder competitive globali su potenza; classifiche settimanali su **Armonia**, **Foto più apprezzate** (like della community, moderati), **Collezione**. Reset stagionale con ricompense cosmetiche per fasce ampie (top 50%, ecc.).
- **Visita habitat amici (asincrono):** l'habitat dell'amico viene ricostruito localmente dal suo save-snapshot (layout + popolazione + meteo del momento dello snapshot). Il visitatore può: accarezzare i capibara (genera un "biglietto di ringraziamento" per l'ospite), lasciare un regalo giornaliero, mettere like, fotografare.
- **Interazioni asincrone:** scambio regali giornaliero, richieste di aiuto per eventi ("annaffia il mio giardino"), cartoline generate dal Photo Mode inviabili in-game.
- **Condivisione social:** export nativo foto/video con watermark elegante opzionale, hashtag suggeriti, deep link che apre il gioco sull'habitat del creatore (referral tracciato). Codici blueprint condivisibili come testo/QR.
- **Sicurezza:** nessuna chat libera (solo emote e messaggi predefiniti), moderazione automatica su nomi/foto pubbliche, conforme COPPA/GDPR-K.
