import { TerrainState, Weather } from './common';

export interface WaveSpawn {
  zombieId: string;
  lane: number;
  /** Ritardo in secondi dall'inizio dell'ondata. */
  delaySeconds: number;
}

export interface WaveDefinition {
  index: number;
  isFinalWave: boolean;
  spawns: WaveSpawn[];
}

export interface WeatherWindow {
  weather: Weather;
  startSecond: number;
  endSecond?: number; // undefined = fino a fine livello
}

export interface TerrainOverride {
  lane: number;
  column: number;
  state: TerrainState;
}

export interface LevelDefinition {
  id: string;
  world: number;
  name: string;
  waves: WaveDefinition[];
  weatherTimeline: WeatherWindow[];
  terrainOverrides: TerrainOverride[];
  /** Numero di Semi di Riserva concessi (doc 03). */
  reserveSeeds: number;
  objective: string;
}
