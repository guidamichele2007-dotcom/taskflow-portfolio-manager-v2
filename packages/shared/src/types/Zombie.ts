export type ZombieCategory =
  | 'Camminatore'
  | 'Corazzato'
  | 'Mobilita'
  | 'Speciale'
  | 'AntiPianta'
  | 'ADistanza'
  | 'Acquatico'
  | 'Supporto'
  | 'Esplosivo'
  | 'Furto'
  | 'Stealth'
  | 'Mini'
  | 'MiniBoss'
  | 'Erratico'
  | 'Divisione'
  | 'Rapido';

/** Stati della macchina a stati condivisa (doc 05). */
export type ZombieAIState =
  | 'Spawn'
  | 'Avanzata'
  | 'Attacco'
  | 'Fuga'
  | 'ChiamataRinforzi'
  | 'Scavo'
  | 'Volo'
  | 'Decesso';

export interface ZombieDefinition {
  id: string;
  name: string;
  category: ZombieCategory;
  hp: number;
  /** 1.0 = velocità Normale; scala relativa (doc 05). */
  speedMultiplier: number;
  damagePerHit: number;
  behaviorSummary: string;
  counterplay: string;
  /** Stati FSM aggiuntivi oltre al set base, se presenti. */
  extraStates?: ZombieAIState[];
}

export interface BossPhase {
  name: string;
  hpRangePercent: [number, number];
  description: string;
  vulnerable?: boolean;
}

export interface BossDefinition {
  id: string;
  name: string;
  world: number;
  hp: number;
  phases: BossPhase[];
}
