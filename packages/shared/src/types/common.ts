export type Rarity =
  | 'Comune'
  | 'NonComune'
  | 'Raro'
  | 'Epico'
  | 'Leggendario'
  | 'Mitico';

export type PlantFamily =
  | 'RadiceMadre'
  | 'Baccello'
  | 'Foglia'
  | 'Fungo'
  | 'Cristallo'
  | 'Brace'
  | 'Spina'
  | 'Fiore'
  | 'Ibrida';

export type PlantRole =
  | 'Produttore'
  | 'Attaccante'
  | 'Muro'
  | 'Controllo'
  | 'Istantanea'
  | 'Utility'
  | 'AttaccantePerforante'
  | 'AttaccanteArea'
  | 'AttaccanteSpeciale';

export type Range = 'Melee' | 'Corsia' | 'Area' | 'Globale' | 'Nessuna';

export type TerrainState =
  | 'Normale'
  | 'Bruciato'
  | 'Ghiacciato'
  | 'Allagato'
  | 'Radicato'
  | 'Spore';

export type Weather =
  | 'Nessuno'
  | 'SoleCocente'
  | 'Pioggia'
  | 'NebbiaSpore'
  | 'Gelo'
  | 'Vento';

export type StatusEffect =
  | 'Rallentato'
  | 'Avvelenato'
  | 'Bruciato'
  | 'Stordito'
  | 'Ipnotizzato'
  | 'Addormentato'
  | 'Invisibile';

export interface GridCoord {
  lane: number; // 0-4 (5 corsie)
  column: number; // 0-8 (9 colonne)
}

/** Tick fisso di simulazione, vedi docs/gdd/03 e 12. */
export const SIMULATION_TICK_MS = 100;

export const GRID_LANES = 5;
export const GRID_COLUMNS = 9;
