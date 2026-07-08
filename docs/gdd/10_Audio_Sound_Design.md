# 10 — Audio e Sound Design

## Direzione musicale

- Compositore di riferimento (stile): orchestrale acustico leggero con strumenti "vivi"
  (ukulele, marimba, glockenspiel, fiati di legno) per il tema "vita/giardino", che si contamina
  progressivamente con elementi elettronici granulari e percussioni di legno marcio per il tema
  "Piaga Cinerea" — la musica stessa "si corrompe" man mano che una partita peggiora.
- **Musica dinamica a strati (vertical layering)**: ogni livello ha una traccia composta da 4-5
  stem sincronizzati che il motore audio attiva/disattiva in base allo stato di gioco:
  1. Strato base (ambiente/percussioni leggere) — sempre attivo.
  2. Strato melodico — attivo in condizioni normali.
  3. Strato tensione (archi/percussioni incalzanti) — attivato quando un Marcito è a meno di 2
     colonne dall'Arca su una qualunque corsia.
  4. Strato "ondata finale" — sostituisce gli strati precedenti con uno stinger dedicato
     all'annuncio dell'ondata finale (doc 03).
  5. Strato boss — tema dedicato per fase, con transizione orchestrale al cambio fase (non un
     taglio secco) per i 6 Araldi.
- Transizioni sempre **musicali** (mai un fade-out grezzo): crossfade sincronizzato al beat più
  vicino (beat-matched layering), gestito dal sistema audio middleware (Wwise, vedi doc 12).
- Tema del menu principale: variazione strumentale del tema principale, arrangiata in loop da
  90s con "respiro" (piccole variazioni ogni ripetizione per non stancare in sessioni lunghe).

## Effetti sonori (SFX)

- **Piante**: ogni famiglia ha una "firma timbrica" coerente (Baccello = schiocchi organici
  acuti, Foglia = suoni sordi/legnosi, Fungo = suoni ovattati/spore soffiate, Cristallo =
  campanelli/scricchiolii di ghiaccio, Brace = crepitii/sfrigolii, Spina = schiocchi secchi,
  Fiore = suoni eterei/campanelle armoniche) per rinforzare il riconoscimento uditivo anche a
  schermo affollato (accessibilità per ipovedenti).
- **Marciti**: versi comici non verbali (grugniti, scricchiolii, fruscii di paglia), mai
  minacciosi in senso horror; ogni categoria (doc 05) ha 3-4 varianti di verso per evitare
  ripetitività, randomizzate a spawn.
- **UI**: feedback sonoro per ogni tocco/conferma/errore (es. suono "negato" morbido se Linfa
  insufficiente, mai un buzzer aggressivo).
- **Ambientazione**: layer di suoni di bioma (vento tra le foglie, gorgoglio di palude, sabbia
  che scorre, vento gelido, tuoni distanti) mixati dinamicamente col meteo attivo (doc 03): la
  Pioggia aggiunge un layer di gocce, il Vento intensifica il layer eolico, ecc.

## Mixing e bus audio

- Bus principali: Musica, SFX Gameplay, SFX UI, Voci/Versi, Ambiente — ciascuno con slider
  indipendente in Impostazioni (doc 09).
- **Ducking dinamico**: la musica si abbassa automaticamente (-6dB, 200ms attack) quando suona
  uno stinger critico (es. Marcito che raggiunge l'Arca) per garantire leggibilità del segnale
  più importante in quel momento — principio "audio come canale d'informazione", non solo
  atmosfera.
- Loudness target: -16 LUFS integrato per piattaforme mobile (compatibilità con normalizzazione
  di sistema iOS/Android), -23 LUFS per build broadcast/streaming-friendly su PC/console.

## Feedback audio-visivo integrato

Ogni evento di gameplay rilevante ha una **tripletta di feedback sincronizzata** (regola di
design trasversale, richiamata anche in doc 11):
1. **Suono** distintivo e breve (<400ms per eventi frequenti, per non affaticare in ondate
   numerose).
2. **VFX** particellare o di scala (squash & stretch) coerente con l'elemento (doc 11).
3. **Feedback aptico** (mobile/controller): vibrazione breve e distinta per colpi critici,
   piazzamento riuscito, Marcito che raggiunge l'Arca (pattern diverso per ciascuno, per
   permettere riconoscimento "alla cieca" durante sessioni intense).

## Localizzazione audio

- Testo completamente localizzato in 16 lingue al lancio (doc 02).
- Nessun doppiaggio parlato pieno per contenere i costi: Norun e i personaggi usano "hum"
  musicali procedurali sincronizzati al testo (stile Animal Crossing/Banjo-Kazooie), universali e
  non richiedono ri-registrazione per lingua.
- I versi comici dei Marciti sono non verbali (grugniti/suoni), quindi language-agnostic per
  costruzione.
