# Capitolo 08 — Audio

## 1. Direzione

**"Lo-fi naturale":** strumenti acustici morbidi (piano feltrato, chitarra nylon, marimba, koto, archi soffusi), field recording reali di natura, versi dei capibara autentici ma caratterizzati. L'audio deve rendere il gioco usabile come **app di relax** anche a schermo spento in tasca (Zen Mode audio-only).

## 2. Musica Adattiva (FMOD)

- **Sistema a layer verticali:** ogni tema di bioma è composto da 4–6 stem (base armonica, melodia, percussioni soft, ornamenti, pad notturno) mixati in tempo reale da parametri: fascia oraria, meteo, densità di capibara felici a schermo, modalità (build/photo/zen).
- **Transizioni orizzontali:** cambi di fascia oraria/bioma su punti di quantizzazione musicale (mai tagli), con cadenze di passaggio composte ad hoc per il tramonto e l'alba.
- **Brani:** 12 temi bioma + 6 varianti stagionali + 4 brani evento + 1 tema leggendario per capibara leggendario + ninnananna notturna condivisa. Colonna sonora sbloccabile in un "grammofono" in-game (e playlist su piattaforme streaming per marketing).
- **RhythmSync:** FMOD callback di beat esposto al gameplay (danze, lanterne, Cap. 05).

## 3. Ambience

- **Bed per bioma** (loop 3–5 min, crossfade) + **spot sounds 3D** randomizzati (uccello specifico su quell'albero, tonfo di pesce, campanella).
- Parametrizzata da: ora (coro alba → cicale → grilli), meteo (pioggia con intensità continua + gocciolio sotto le chiome, LPF globale nella nebbia), interni/rifugi (occlusione).
- **Acqua:** loop multipli per tipo (ruscello, cascata lontana/vicina, lago) con missaggio per distanza dalla camera — la cascata è udibile prima di essere visibile (guida esplorativa).

## 4. Suoni dei Capibara

- Set per emozione × personalità: squeak di saluto, brontolio di piacere durante le carezze (loop modulato dalla velocità del dito!), sgranocchiare (per tipo di cibo), sospiro onsen, versi di gioco, russare morbido (ogni capibara ha il suo pattern), starnuto, "eep" di sorpresa.
- Pitch/formant shift per taglia e personalità (La Nonna più grave e lenta).
- Regola: mai fastidiosi in loop — tutti i versi hanno cooldown e round-robin ×5 varianti.

## 5. SFX di Mondo e UI

- Interazioni: splash (12 varianti per massa/velocità), passi su 8 superfici (erba, sabbia, neve, legno...), costruzione (pop di crescita + campanella di conferma), ricompense (glissando di marimba + acqua).
- UI: famiglia bambù/acqua/legno (tap = goccia, conferma = nota di koto, errore = suono morbido mai punitivo, apertura pannello = fruscio).
- **Haptic-audio sync:** ogni suono UI ha il suo pattern aptico gemello.

## 6. Mix e Tecnica

- Bus: Music / Ambience / Capybara / SFX / UI, ducking gentile (i versi abbassano leggermente la musica).
- Loudness target -16 LUFS mobile, headroom per cuffie; mix testato su speaker telefono, cuffie, e in silenziosa (haptics compensano).
- 3D: attenuazione custom per curve dolci, reverb zone per bioma (valle montana = eco lunga), HRTF opzionale in cuffia.
- Budget: ~350 asset audio al lancio, streaming per musica, banchi FMOD per bioma caricati con Addressables; memoria audio ≤ 60 MB.
- Opzioni utente: volumi separati, "solo natura" (musica off), timer sleep (fade-out in 20 min per chi si addormenta col gioco).
