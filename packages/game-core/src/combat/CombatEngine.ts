/**
 * Simulation Core di riferimento per ROOTGUARD (vedi docs/gdd/03 e docs/gdd/12).
 *
 * Questo motore NON è codice di produzione: è un prototipo deterministico che
 * dimostra l'architettura a tick fissi descritta nel GDD (movimento -> attacchi
 * piante -> attacchi nemici -> stati alterati -> spawn ondata successiva) in modo
 * testabile e privo di dipendenze da un motore grafico. Il team engine dovrebbe
 * portare questa stessa struttura in C# puro (SimulationCore, doc 12), mantenendo
 * l'ordine delle fasi per tick per garantire lo stesso comportamento validato qui.
 */

import {
  GRID_LANES,
  GRID_COLUMNS,
  GridCoord,
  PlantDefinition,
  ZombieDefinition,
  LevelDefinition,
  TerrainState,
  Weather,
  StatusEffect,
} from '@rootguard/shared';

// ---------------------------------------------------------------------------
// RNG deterministico (mulberry32) — necessario per replay e validazione server
// (doc 13): stesso seed + stessa sequenza di intent => stesso risultato.
// ---------------------------------------------------------------------------
export function createDeterministicRng(seed: number): () => number {
  let a = seed >>> 0;
  return function mulberry32() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TileState {
  terrain: TerrainState;
}

export interface StatusInstance {
  effect: StatusEffect;
  remainingTicks: number;
  /** Es. percentuale di rallentamento, danno per tick del veleno, ecc. */
  magnitude: number;
}

export interface PlantInstance {
  instanceId: string;
  definitionId: string;
  coord: GridCoord;
  currentHp: number;
  maxHp: number;
  attackCooldownTicks: number;
  abilityCooldownTicks: number;
}

export interface ZombieInstance {
  instanceId: string;
  definitionId: string;
  lane: number;
  /** Posizione frazionaria: parte da GRID_COLUMNS e scende verso 0 (l'Arca Radice). */
  position: number;
  currentHp: number;
  attackCooldownTicks: number;
  statuses: StatusInstance[];
}

export type MatchOutcome = 'InProgress' | 'Victory' | 'Defeat';

export interface CombatSnapshot {
  tick: number;
  elapsedMs: number;
  sap: number;
  reserveSeedsLeft: number;
  currentWeather: Weather;
  outcome: MatchOutcome;
  plants: PlantInstance[];
  zombies: ZombieInstance[];
  tiles: TileState[][];
}

const TICKS_PER_SECOND = 10; // SIMULATION_TICK_MS = 100ms (doc 03/12)

function ticksFromSeconds(seconds: number): number {
  return Math.round(seconds * TICKS_PER_SECOND);
}

function initGrid(overrides: LevelDefinition['terrainOverrides']): TileState[][] {
  const tiles: TileState[][] = Array.from({ length: GRID_LANES }, () =>
    Array.from({ length: GRID_COLUMNS }, () => ({ terrain: 'Normale' as TerrainState })),
  );
  for (const o of overrides) {
    tiles[o.lane][o.column] = { terrain: o.state };
  }
  return tiles;
}

/** Moltiplicatore di velocità di movimento applicato a un nemico in un dato tick. */
function speedMultiplierFor(
  zombie: ZombieInstance,
  def: ZombieDefinition,
  tile: TileState,
  weather: Weather,
): number {
  let multiplier = def.speedMultiplier;

  if (tile.terrain === 'Ghiacciato') multiplier *= 0.6;
  if (tile.terrain === 'Radicato') multiplier *= 1.0; // solo bonus economico, non movimento

  if (weather === 'Gelo' && def.category !== 'Corazzato') multiplier *= 0.85;

  const slow = zombie.statuses.find((s) => s.effect === 'Rallentato');
  if (slow) multiplier *= 1 - slow.magnitude;

  if (zombie.statuses.some((s) => s.effect === 'Stordito' || s.effect === 'Addormentato')) {
    multiplier = 0;
  }

  return multiplier;
}

export class CombatEngine {
  private tick = 0;
  private elapsedMs = 0;
  private tiles: TileState[][];
  private plants: PlantInstance[] = [];
  private zombies: ZombieInstance[] = [];
  private sap = 0;
  private reserveSeedsLeft: number;
  private currentWeather: Weather = 'Nessuno';
  private outcome: MatchOutcome = 'InProgress';
  private rng: () => number;
  private nextInstanceId = 1;
  private pendingSpawns: Array<{ atTick: number; zombieId: string; lane: number }> = [];
  /** Ricarica del seme (doc 03): tick oltre il quale una carta può essere ripiazzata. */
  private cardRechargeUntilTick = new Map<string, number>();

  constructor(
    private readonly level: LevelDefinition,
    private readonly plantDefs: Map<string, PlantDefinition>,
    private readonly zombieDefs: Map<string, ZombieDefinition>,
    seed = 1,
    initialSap = 0,
  ) {
    this.tiles = initGrid(level.terrainOverrides);
    this.reserveSeedsLeft = level.reserveSeeds;
    this.rng = createDeterministicRng(seed);
    this.sap = initialSap;
    this.scheduleWaves();
  }

  private scheduleWaves(): void {
    // Nota: in questo prototipo tutte le ondate sono già pianificate all'avvio in base
    // ai delay dichiarati nel LevelDefinition. Il Direttore delle Ondate (doc 05), che
    // osserva la performance del giocatore e regola il pacing di ±15%, è delegato al
    // layer superiore (non a questo motore) tramite un moltiplicatore sui delaySeconds
    // passato a `applyWaveDirectorPacing`.
    let waveStartTick = 0;
    for (const wave of this.level.waves) {
      for (const spawn of wave.spawns) {
        this.pendingSpawns.push({
          atTick: waveStartTick + ticksFromSeconds(spawn.delaySeconds),
          zombieId: spawn.zombieId,
          lane: spawn.lane,
        });
      }
      // Spaziatura minima fissa tra ondate in questo prototipo (10s); un'implementazione
      // di produzione la ricaverebbe dalla durata reale dell'ondata precedente.
      waveStartTick += ticksFromSeconds(10);
    }
  }

  getSnapshot(): CombatSnapshot {
    return {
      tick: this.tick,
      elapsedMs: this.elapsedMs,
      sap: this.sap,
      reserveSeedsLeft: this.reserveSeedsLeft,
      currentWeather: this.currentWeather,
      outcome: this.outcome,
      plants: this.plants.map((p) => ({ ...p })),
      zombies: this.zombies.map((z) => ({ ...z, statuses: z.statuses.map((s) => ({ ...s })) })),
      tiles: this.tiles.map((lane) => lane.map((t) => ({ ...t }))),
    };
  }

  /** Piazza una pianta se ci sono Linfa sufficienti, la carta non è in ricarica e la tile è libera. */
  placePlant(definitionId: string, coord: GridCoord): PlantInstance | null {
    const def = this.plantDefs.get(definitionId);
    if (!def) throw new Error(`Pianta sconosciuta: ${definitionId}`);
    if (this.sap < def.cost) return null;
    if (this.tick < (this.cardRechargeUntilTick.get(definitionId) ?? 0)) return null;
    if (this.plants.some((p) => p.coord.lane === coord.lane && p.coord.column === coord.column)) {
      return null;
    }

    this.sap -= def.cost;
    this.cardRechargeUntilTick.set(definitionId, this.tick + ticksFromSeconds(def.rechargeSeconds));
    const instance: PlantInstance = {
      instanceId: `plant-${this.nextInstanceId++}`,
      definitionId,
      coord,
      currentHp: def.hp,
      maxHp: def.hp,
      attackCooldownTicks: 0,
      abilityCooldownTicks: def.activeAbility ? ticksFromSeconds(def.activeAbility.cooldownSeconds) : 0,
    };
    this.plants.push(instance);
    return instance;
  }

  /** Rimuove una pianta recuperando il 50% del costo in Linfa (doc 03). */
  removePlant(instanceId: string): void {
    const idx = this.plants.findIndex((p) => p.instanceId === instanceId);
    if (idx === -1) return;
    const def = this.plantDefs.get(this.plants[idx].definitionId);
    if (def) this.sap += Math.floor(def.cost * 0.5);
    this.plants.splice(idx, 1);
  }

  /** Secondi rimanenti prima che una carta possa essere ripiazzata (0 se già pronta). */
  getCardRechargeRemainingSeconds(definitionId: string): number {
    const until = this.cardRechargeUntilTick.get(definitionId) ?? 0;
    return Math.max(0, (until - this.tick) / TICKS_PER_SECOND);
  }

  setWeather(weather: Weather): void {
    this.currentWeather = weather;
  }

  /** Esegue un singolo tick di simulazione (100ms, doc 03). */
  step(): CombatSnapshot {
    if (this.outcome === 'InProgress') {
      this.tick++;
      this.elapsedMs += 100;

      this.updateWeatherFromTimeline();
      this.spawnDueZombies();
      this.moveZombies();
      this.resolvePlantAttacks();
      this.resolveZombieAttacks();
      this.resolveProducers();
      this.decayStatuses();
      this.checkOutcome();
    }
    return this.getSnapshot();
  }

  private updateWeatherFromTimeline(): void {
    const elapsedSeconds = this.elapsedMs / 1000;
    for (const window of this.level.weatherTimeline) {
      const inWindow =
        elapsedSeconds >= window.startSecond &&
        (window.endSecond === undefined || elapsedSeconds < window.endSecond);
      if (inWindow) {
        this.currentWeather = window.weather;
      }
    }
  }

  private spawnDueZombies(): void {
    const due = this.pendingSpawns.filter((s) => s.atTick === this.tick);
    for (const spawn of due) {
      const def = this.zombieDefs.get(spawn.zombieId);
      if (!def) continue;
      this.zombies.push({
        instanceId: `zombie-${this.nextInstanceId++}`,
        definitionId: spawn.zombieId,
        lane: spawn.lane,
        position: GRID_COLUMNS,
        currentHp: def.hp,
        attackCooldownTicks: 0,
        statuses: [],
      });
    }
    this.pendingSpawns = this.pendingSpawns.filter((s) => s.atTick !== this.tick);
  }

  private moveZombies(): void {
    const BASE_COLUMNS_PER_SECOND = 0.3; // ritmo di riferimento (~3s per colonna, doc 06 TTK)
    for (const zombie of this.zombies) {
      if (zombie.currentHp <= 0) continue;
      const def = this.zombieDefs.get(zombie.definitionId)!;
      const blocked = this.plants.some(
        (p) => p.coord.lane === zombie.lane && Math.abs(p.coord.column - Math.floor(zombie.position)) < 1,
      );
      if (blocked) continue; // impegnato in Attacco, vedi resolveZombieAttacks

      const column = Math.max(0, Math.min(GRID_COLUMNS - 1, Math.floor(zombie.position)));
      const tile = this.tiles[zombie.lane][column];
      const multiplier = speedMultiplierFor(zombie, def, tile, this.currentWeather);
      zombie.position -= (BASE_COLUMNS_PER_SECOND * multiplier) / TICKS_PER_SECOND;
    }
  }

  private resolvePlantAttacks(): void {
    for (const plant of this.plants) {
      if (plant.currentHp <= 0) continue;
      const def = this.plantDefs.get(plant.definitionId)!;
      if (def.damage <= 0) continue; // produttori/utility gestiti altrove

      if (plant.attackCooldownTicks > 0) {
        plant.attackCooldownTicks--;
        continue;
      }

      const targets = this.findTargetsInRange(plant, def);
      if (targets.length === 0) continue;

      for (const target of targets) {
        target.currentHp -= def.damage;
      }
      plant.attackCooldownTicks = ticksFromSeconds(def.rechargeSeconds > 0 ? 1 : 1);
    }
    this.zombies = this.zombies.filter((z) => z.currentHp > 0);
  }

  private findTargetsInRange(plant: PlantInstance, def: PlantDefinition): ZombieInstance[] {
    // Un Marcito è "in gittata" finché non ha ancora superato la colonna della pianta
    // (posizione >= colonna): la pianta spara in avanti verso i nemici in avvicinamento,
    // mai all'indietro verso caselle già oltrepassate.
    const sameLane = this.zombies.filter(
      (z) => z.lane === plant.coord.lane && z.position >= plant.coord.column,
    );
    if (sameLane.length === 0) return [];

    sameLane.sort((a, b) => a.position - b.position);

    switch (def.range) {
      case 'Melee':
        return sameLane.slice(0, 1);
      case 'Corsia':
        return sameLane.slice(0, 1); // singolo bersaglio più vicino; piante perforanti sovrascrivono altrove
      case 'Area':
        return sameLane.slice(0, 3);
      case 'Globale':
        return this.zombies.slice(0, 5);
      default:
        return [];
    }
  }

  private resolveZombieAttacks(): void {
    for (const zombie of this.zombies) {
      const column = Math.floor(zombie.position);
      const attackingPlant = this.plants.find(
        (p) => p.coord.lane === zombie.lane && p.coord.column === column && p.currentHp > 0,
      );
      if (!attackingPlant) continue;

      const def = this.zombieDefs.get(zombie.definitionId)!;
      if (zombie.attackCooldownTicks > 0) {
        zombie.attackCooldownTicks--;
        continue;
      }
      attackingPlant.currentHp -= def.damagePerHit;
      zombie.attackCooldownTicks = ticksFromSeconds(1);
    }
    this.plants = this.plants.filter((p) => p.currentHp > 0);
  }

  private resolveProducers(): void {
    for (const plant of this.plants) {
      const def = this.plantDefs.get(plant.definitionId)!;
      if (def.role !== 'Produttore') continue;
      if (plant.attackCooldownTicks > 0) {
        plant.attackCooldownTicks--;
        continue;
      }
      this.sap += 25;
      plant.attackCooldownTicks = ticksFromSeconds(def.rechargeSeconds);
    }
  }

  private decayStatuses(): void {
    for (const zombie of this.zombies) {
      for (const status of zombie.statuses) {
        if (status.effect === 'Avvelenato') {
          zombie.currentHp -= status.magnitude;
        }
        status.remainingTicks--;
      }
      zombie.statuses = zombie.statuses.filter((s) => s.remainingTicks > 0);
    }
    this.zombies = this.zombies.filter((z) => z.currentHp > 0);
  }

  private checkOutcome(): void {
    const breached = this.zombies.some((z) => z.position <= 0);
    if (breached) {
      if (this.reserveSeedsLeft > 0) {
        this.reserveSeedsLeft--;
        this.zombies = this.zombies.filter((z) => z.position > 0);
      } else {
        this.outcome = 'Defeat';
        return;
      }
    }

    const allWavesSpawned = this.pendingSpawns.length === 0;
    const noZombiesLeft = this.zombies.length === 0;
    if (allWavesSpawned && noZombiesLeft && this.tick > 0) {
      this.outcome = 'Victory';
    }
  }

  applyStatus(zombieInstanceId: string, effect: StatusEffect, durationSeconds: number, magnitude: number): void {
    const zombie = this.zombies.find((z) => z.instanceId === zombieInstanceId);
    if (!zombie) return;
    zombie.statuses.push({ effect, remainingTicks: ticksFromSeconds(durationSeconds), magnitude });
  }
}
