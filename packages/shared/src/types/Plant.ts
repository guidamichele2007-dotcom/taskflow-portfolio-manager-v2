import { PlantFamily, PlantRole, Range, Rarity } from './common';

export type EvolutionStageName = 'Seme' | 'Fiorita' | 'Ancestrale';

export interface EvolutionStage {
  stage: EvolutionStageName;
  /** Moltiplicatore applicato a HP e danno base rispetto allo stadio Seme. */
  statMultiplier: number;
  /** Costo in Semi d'Oro per raggiungere questo stadio (0 per Seme, già sbloccato). */
  goldSeedCost: number;
  /** Costo in Humus per raggiungere questo stadio. */
  humusCost: number;
  /** Materiale di bioma richiesto solo per Ancestrale (vedi doc 06). */
  biomeMaterial?: string;
  /** Effetto aggiuntivo sbloccato/potenziato a questo stadio, se presente. */
  extraEffect?: string;
}

export interface ActiveAbility {
  name: string;
  cooldownSeconds: number;
  description: string;
}

export interface PlantDefinition {
  id: string;
  name: string;
  family: PlantFamily;
  role: PlantRole;
  rarity: Rarity;
  /** Costo in Linfa per piazzare la pianta (stadio Seme). */
  cost: number;
  /** Ricarica del seme in secondi prima di poterla ripiazzare. */
  rechargeSeconds: number;
  hp: number;
  /** Danno per colpo, 0 per piante puramente di supporto/economia. */
  damage: number;
  range: Range;
  passiveAbility: string;
  activeAbility?: ActiveAbility;
  evolutions: EvolutionStage[];
  strengths: string[];
  weaknesses: string[];
  synergies: string[];
  animationNotes: string;
  vfxNotes: string;
  /** Per le piante Ibride: gli id delle due piante genitrici richieste per la Fusione. */
  fusionParents?: [string, string];
}
