# 06 — Progressione, Economia e Bilanciamento

## Sistema di livelli (struttura dei contenuti campagna)

- **6 Mondi** (biomi, doc 02) × **15–18 livelli** ciascuno = **~95 livelli di campagna** al
  lancio, numerati `M{mondo}-L{livello}` (es. `M3-L07`).
- Ogni Mondo si chiude con un **livello boss** (Araldo) e contiene:
  - 1 livello tutorial (solo nel Mondo 1, più livelli "introduzione meccanica" negli altri mondi
    alla prima apparizione di una meccanica nuova, es. primo Marcito Aerostato).
  - 2-3 **livelli speciali** (griglia non standard, obiettivo alternativo: es. "proteggi 3
    Girasoli invece dell'Arca", "sopravvivi con sola Linfa pre-piazzata, nessuna raccolta").
  - 1 **livello "Memoria"** con restrizioni narrative (mazzo precostituito, per i flashback,
    doc 02).
- **Sblocco progressivo**: un livello si apre completando il precedente con almeno 1 stella; le
  piante nuove si sbloccano alla prima apparizione della propria "scheda tutorial" in un livello
  dedicato (mai un drop a sorpresa non spiegato).

## Valuta e conversione (riepilogo, dettagli in doc 03)

| Valuta | Tipo | Fonte principale | Cap di accumulo |
|---|---|---|---|
| Linfa | In-match, non persistente | Produttori, meteo, casse in-livello | N/A (si azzera a fine match) |
| Semi d'Oro | Soft, persistente | Stelle livello, missioni, achievement, vendita duplicati | Nessuno |
| Humus | Soft, persistente (crafting) | Nemici "Fertili", missioni giornaliere, Sopravvivenza | Nessuno |
| Cristalli di Rugiada | Premium | Acquisto reale, Battle Pass, achievement rari (piccole quantità free) | Nessuno |

**Principio cardine**: Cristalli di Rugiada **non acquistano mai** piante nuove o potenziamenti
statistici — solo cosmetici (skin per pianta/Marcito/Arca), slot Battle Pass, e "acceleratori di
tempo" opzionali per l'evoluzione in Serra (mai obbligatori, sempre ottenibile gratis con
pazienza). Vedi doc 15 per il modello di monetizzazione completo.

## Curva di progressione del profilo

- **Livello Profilo** 1–60 al lancio (estendibile via live service, doc 15), XP guadagnata da:
  completamento livelli (base 50 XP + 25 per stella), missioni giornaliere (30 XP), achievement
  (variabile 50–500 XP).
- Curva XP: `XP_richiesta(n) = 100 × n^1.35` (arrotondata al centinaio), che produce una
  progressione rapida nelle prime 10 ore (per dare sblocchi frequenti early game) e un
  rallentamento naturale dopo il livello 40 dove il contenuto principale è già stato consumato e
  subentrano eventi stagionali/live service come motore di progressione.
- Ogni **Livello Profilo** assegna: +1 slot mazzo (fino a un massimo di 10 piante attive per
  livello, partendo da 6), oppure Semi d'Oro/Humus a rotazione, oppure sblocco di una schermata
  (es. Serra al livello 3, PvP al livello 12, Co-op al livello 8).

## Sblocco piante

- Ogni pianta ha un **prezzo in Semi d'Oro** legato alla rarità: Comune 500, Non Comune 1.200,
  Raro 3.000, Epico 7.500, Leggendario 18.000 — ma la **prima copia di ogni pianta della
  campagna principale si sblocca giocando** (mai a pagamento diretto): la prima apparizione di
  ogni pianta in un livello la aggiunge automaticamente alla collezione a fine livello (schema
  identico allo spirito dell'originale PvZ "prima ti viene data, poi la ripaghi per i
  potenziamenti"). I Semi d'Oro servono principalmente per l'**evoluzione** (Fiorita/Ancestrale)
  e per le **Fusioni**.
- Costo evoluzione: Fiorita = Semi d'Oro (pari al prezzo di rarità) + 20 Humus; Ancestrale =
  2× Semi d'Oro + 60 Humus + 1 "Materiale di Bioma" (drop specifico del mondo, es. "Cenere
  Pura" nel Mondo 3), per dare un obiettivo di farming mirato senza RNG puro.

## Bilanciamento della difficoltà

### Scaling per mondo (moltiplicatori applicati alle statistiche base doc 05)

| Mondo | Moltiplicatore HP Marciti | Moltiplicatore Danno Marciti | Densità ondate |
|---|---|---|---|
| 1 — Giardini Sospesi | ×1.0 | ×1.0 | Bassa |
| 2 — Palude Nebulosa | ×1.35 | ×1.15 | Media |
| 3 — Dune Infuocate | ×1.8 | ×1.3 | Media-Alta |
| 4 — Cime Glaciali | ×2.3 | ×1.45 | Alta |
| 5 — Abisso Cinereo | ×3.0 | ×1.6 | Molto Alta |
| 6 — Cuore del Mondo | ×3.5 (boss unico, non scalabile a moltiplicatore lineare) | ×1.75 | Scriptata (boss) |

Il Direttore delle Ondate (doc 05) applica inoltre un **moltiplicatore dinamico ±15%** sopra
questi valori base in funzione della performance del giocatore nelle ultime 2 ondate.

### Difficoltà selezionabile dal giocatore
- **Germoglio** (facile, -25% su tutti i moltiplicatori sopra, consigliata a nuovi giocatori/co-op
  familiare) — nessuna penalità di ricompensa oltre a un piccolo malus (-10% Semi d'Oro).
- **Standard** (bilanciamento di riferimento di questo documento).
- **Radice Amara** (difficile, +25%, sbloccata dopo aver finito il Mondo 3, ricompense +20%).
- **Cenere Eterna** (New Game+ dopo il finale, +50%, Marciti con IA "esperta": usano più spesso
  gli stati Fuga/Chiamata Rinforzi, ricompense +40% e cosmetici esclusivi).

### Principi di bilanciamento numerico
1. **Costo-efficienza (DPS/Linfa)**: ogni pianta d'attacco è calibrata su un rapporto
   danno-nel-tempo/costo di riferimento pari a `0.18 danno per Linfa per secondo` a stadio Seme;
   le varianti con utility aggiuntiva (CC, terreno) accettano un rapporto ridotto del 15-20%
   come "tassa" per l'utility.
2. **Regola del contro-esempio**: nessun Marcito deve essere "gestibile" da una singola pianta
   generalista — ogni ondata è pensata per richiedere almeno 2 famiglie di piante diverse.
3. **Tempo-alla-morte (TTK) target**: un Marcito Comune deve morire in 3-4 colpi di Baccello
   Tiratore base (≈ 4-5s), stabilendo il "metro" percepito di potenza con cui l'utente calibra
   intuitivamente tutte le altre piante.
4. **Curva di apprendimento**: la difficoltà percepita (non solo numerica) cresce introducendo
   **una sola meccanica nuova per livello tutorial**, mai due contemporaneamente, salvo i livelli
   boss che le combinano deliberatamente come esame finale del mondo.

## Sistema di ricompense (riepilogo — dettagli eventi/missioni in doc 08)

| Fonte | Ricompensa tipica |
|---|---|
| Completamento livello (1★/2★/3★) | Semi d'Oro scalari + Humus + XP profilo |
| Missione giornaliera (3/giorno) | Semi d'Oro, Humus, frammenti Battle Pass |
| Obiettivo settimanale (3/settimana) | Humus alto, Cristalli di Rugiada (piccola quantità free) |
| Achievement (permanenti, ~120 al lancio) | Semi d'Oro, cosmetici esclusivi, titoli profilo |
| Cassa di fine livello (RNG limitato, mai duplicati sprecati) | Humus, materiali bioma, skin comuni; i duplicati oltre soglia si convertono automaticamente in Semi d'Oro |
| Battle Pass stagionale (gratuito + premium, doc 15) | Skin, Cristalli di Rugiada, Humus, emote per il Codex |

Nessuna cassa contiene piante nuove a rarità casuale (niente gacha competitivo): le piante si
sbloccano sempre in modo deterministico tramite campagna o acquisto diretto con Semi d'Oro.
