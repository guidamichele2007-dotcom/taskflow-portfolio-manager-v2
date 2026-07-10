# Capitolo 02 — I Capibara

I capibara sono il prodotto. Ogni sistema di questo capitolo esiste per far percepire **vita autentica**.

## 1. Modello di Personalità

Ogni capibara è generato (o autorato, per rari+) da un profilo di personalità a 5 assi (0–100):

| Asse | Basso | Alto |
|------|-------|------|
| **Energia** | Pigrone, dorme ovunque | Corre, salta, esplora |
| **Socialità** | Solitario contemplativo | Sempre in gruppo, avvia giochi |
| **Curiosità** | Abitudinario | Ispeziona ogni novità (decorazioni nuove!) |
| **Golosità** | Mangia con calma zen | Drammatico col cibo, ruba snack |
| **Coccolosità** | Tollerante | Cerca attivamente il giocatore, si struscia sulla camera |

Dai 5 assi derivano **16 archetipi** nominati (Il Filosofo, La Nonna, Il Combinaguai, La Sirena — ama l'acqua sopra ogni cosa, ecc.) che pilotano: pesi dell'utility AI, set di idle esclusive, voce (pitch/timbro dei versi), preferenze cibo/luoghi/orari, testi del Capy-Dex e missioni personali.

## 2. Emozioni

- **Modello:** stato emotivo continuo su 2 dimensioni (Valenza × Arousal) + emozione discreta corrente: Felice, Beato (onsen-state), Curioso, Sorpreso, Assonnato, Triste, Spaventato, Giocoso, Festante, Innamorato (verso il giocatore ad alto legame).
- **Espressione multi-canale:** l'emozione modula simultaneamente — blend shape facciali, postura (spine controller), velocità/ampiezza delle animazioni, orecchie (su/giù/vibranti), coda micro, sound set dei versi, particelle contestuali (cuoricini, goccia di sudore, zzz), e persino il passo (trotto felice vs ciondolare assonnato).
- **Transizioni:** mai a scatto — cross-fade emotivo 0.5–2s con curve ease-in-out; eventi forti (spavento da tuono) usano interrupt con anticipation (freeze 3 frame → orecchie dritte → balzo).
- **Implementazione:** `EmotionComponent` (valenza, arousal, emozione discreta, timer di decadimento verso il baseline di personalità). Scrive parametri sull'Animator/Playable graph e su un `ExpressionController` (blend shapes) via smoothing.

## 3. Bisogni

Bisogni gentili (mai barre rosse ansiogene — icone-pensiero soffuse):

| Bisogno | Decadimento | Soddisfatto da | Se ignorato |
|---------|-------------|----------------|-------------|
| Fame | lento | Cibo (erba alta, yuzu, anguria, insalata premium) | Il capibara pascola da solo (autosufficienza: niente punizioni) |
| Riposo | ciclico col giorno/notte | Nanna, amache, cuscini | Dorme dove capita (adorabile, non punitivo) |
| Socialità | per personalità | Vicinanza ad altri capibara, giochi di gruppo | Cerca compagnia da solo |
| Comfort/Calore | sale col freddo/pioggia | **Onsen**, rifugi, lampade | Si accoccola coi compagni |
| Affetto | per Coccolosità | Carezze, spazzola, regali | Guarda la camera con occhioni (richiamo dolce) |
| Gioco | per Energia | Palle, scivoli, corse | Inventa giochi (rotolarsi) |

I bisogni alimentano l'utility AI: soddisfarli genera valuta e legame, ma il mondo **non degrada mai** — l'assenza del giocatore produce solo capibara autonomi e vignette carine da ritrovare.

## 4. AI e Routine Giornaliera

### 4.1 Architettura

**Utility AI + GOAP leggero**, non behavior tree monolitico:

- Ogni possibile attività (`ActivitySO`: Mangiare, Nuotare, Onsen, Pisolino, Esplorare, Giocare con X, Osservare farfalla...) espone uno **score** = f(bisogni, personalità, ora, meteo, distanza, occupazione slot, social).
- Il **planner** sceglie l'attività a punteggio massimo con inerzia (evita ping-pong) e rumore (varietà).
- Le attività sono composte da step (GoTo → Align → PlayLoop → Exit) su slot di interazione delle decorazioni.
- **Social scheduling:** attività di gruppo (pile di capibara addormentati, onsen party, follow-the-leader) create da un `SocialCoordinator` che raggruppa richieste compatibili.
- **Budget CPU:** LOD dell'AI — capibara off-screen aggiornano lo score a 1 Hz e saltano l'animazione completa (posizione simulata); on-screen a 10 Hz.

### 4.2 Routine giornaliera (esempio archetipo "La Nonna")

| Fascia | Comportamento |
|--------|---------------|
| Alba | Si sveglia per prima, sbadiglio lungo, va al punto più alto a guardare l'alba (vignetta fotografabile) |
| Mattina | Colazione lenta, spazzola gli altri (grooming sociale) |
| Mezzogiorno | Pisolino all'ombra, orecchie che scacciano insetti |
| Pomeriggio | Onsen con gli anziani del gruppo |
| Tramonto | Raduna i piccoli vicino alle lanterne |
| Notte | Dorme al centro della pila di capibara |

Le routine sono **template per archetipo** deformati da personalità, meteo, eventi e decorazioni disponibili → nessun capibara vive due giorni identici.

### 4.3 Interazioni sociali

Grooming reciproco, naso-a-naso di saluto, code di attesa educata all'onsen, "adozione" dei nuovi arrivati (un veterano fa da guida — tutorial diegetico), giochi (rincorrersi, tuffi a catena), litigi comici per il cibo (mai violenti: sbuffo + broncio + riconciliazione).

## 5. Animazioni dei Capibara

### 5.1 Rig

- Scheletro ~62 bones: spine 4, collo 2, testa, mandibola, **orecchie 3 bones ciascuna (dynamic)**, zampe 4×3 + dita fuse, coda 2, **guance 2 (jiggle)**, pancia 1 (jiggle/respirazione).
- ~40 blend shapes facciali (visemi esclusi, non parlano): palpebre sup/inf, sopracciglia interne/esterne, narici, angoli bocca, guance, "occhi a mezzaluna felici", broncio, sorpresa.
- Rig di controllo in Blender/Maya con spazio per IK runtime (vedi Cap. 05).

### 5.2 Set animazioni (per capibara base; rari+ aggiungono esclusive)

**Locomozione (blend space 2D velocità×curvatura, motion-matched):** idle→walk→trot→run, salto (anticipation, volo, atterraggio con squash), nuoto (superficie e immersione con solo naso fuori — signature!), uscita dall'acqua con **scrollone dell'acqua full-body** (simulazione pelo + particelle a spirale).

**Ciclo vita:** mangiare (per tipo di cibo: sgranocchiare erba, addentare anguria a due mani, yuzu che rotola via e inseguimento), dormire (5 pose: pancia in su, ciambella, pila sociale, testa sull'amico, nell'amaca), stiracchiarsi (gatto-style, yoga "saluto al sole" comico), grattarsi (zampa posteriore, contro tronco con occhi beati), rotolarsi (erba/fango con schizzi), rilassarsi nell'onsen (occhi socchiusi, vapore, yuzu in equilibrio sulla testa — pose iconica).

**Reattive:** essere accarezzato (3 livelli: apprezza → si scioglie → si ribalta pancia in su), ricevere cibo (occhi che brillano, trotto felice), ricevere regali (annusa il pacco, lo apre col muso, festeggia), spavento (freeze → balzo → tuffo in acqua se vicino), ridere (sussulti + occhi a mezzaluna + orecchie che sfarfallano), piangere (raro, per storia: occhioni lucidi, orecchie flosce — mai per negligenza del giocatore), ballare (bounce ritmico sincronizzato al BPM della musica via `RhythmSync`), festeggiare (giro su se stesso + salto), esplorare (naso a terra, orecchie che ruotano tipo radar, alzarsi sulle zampe posteriori).

**Idle casuali (anti-ripetizione):** blink variabile (2–8s, doppio blink 20%), orecchio singolo che twitcha, annusare l'aria, guardare un uccellino che passa (head-tracking procedurale), sospiro con visibile gonfiarsi della pancia, cambio peso tra le zampe, sonnecchiare a testa che cade e si risveglia di colpo. Selezione con **shuffle bag** pesata per personalità: mai la stessa idle due volte di fila.

### 5.3 Fisica secondaria (sempre attiva, è la firma del gioco)

- **Orecchie:** catene Verlet a 3 nodi per orecchio con stiffness/damping per emozione (felice = più rimbalzo), influenzate da vento, corsa, scrollone, dito del giocatore.
- **Pelo:** shell fur (vedi Cap. 04) con parametro di piega direzionale dinamico — il pelo si appiattisce sotto la carezza e nella direzione del vento/acqua, si rizza nello spavento.
- **Guance/pancia jiggle:** spring bones con clamp, attivi in corsa/salto/atterraggio.
- **Respirazione:** additiva procedurale su spine+pancia, frequenza legata ad arousal (dormiente 0.2 Hz lento e profondo, spaventato 1.5 Hz), sempre visibile — un capibara che respira non è mai "fermo".
- **Occhi:** micro-saccadi procedurali, pupille che si adattano alla luce (dilatate di notte), look-at con limiti anatomici e ritardo naturale (occhi → testa → collo), riflesso speculare della skybox negli occhi (catchlight sempre presente: occhi vivi).

## 6. Struttura del Codice (runtime capibara)

```
CapybaraEntity (prefab)
├── CapybaraDefinitionSO      # specie/rarità/archetipo/preferenze (data)
├── CapybaraState             # istanza serializzabile: nome, bond, età, accessori
├── NeedsComponent            # bisogni + decadimento
├── EmotionComponent          # valenza/arousal/emozione
├── UtilityBrain              # scoring attività + planner
├── ActivityRunner            # esecuzione step, slot handshake
├── LocomotionController      # motion matching + steering + foot IK
├── ExpressionController      # blend shapes, occhi, saccadi
├── SecondaryMotionRig        # orecchie/guance/pancia (Jobs)
├── FurController             # parametri shader pelo
├── InteractionReceiver       # tocchi, carezze (pressione/velocità dito)
├── VoiceEmitter              # versi (pitch per personalità)
└── PhotoActor                # pose e look-at per Photo Mode
```

Tutte le definizioni sono **ScriptableObject data-driven**: i designer creano nuovi capibara senza codice.
