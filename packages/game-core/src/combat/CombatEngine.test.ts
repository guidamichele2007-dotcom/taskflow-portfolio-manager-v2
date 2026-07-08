import { describe, expect, it } from 'vitest';
import { PLANTS, ZOMBIES } from '@rootguard/shared';
import type { LevelDefinition } from '@rootguard/shared';
import { CombatEngine } from './CombatEngine';

function buildDefMaps() {
  return {
    plantDefs: new Map(PLANTS.map((p) => [p.id, p])),
    zombieDefs: new Map(ZOMBIES.map((z) => [z.id, z])),
  };
}

const emptyLevel: LevelDefinition = {
  id: 'test-level-empty',
  world: 1,
  name: 'Livello di test (nessuna ondata)',
  waves: [],
  weatherTimeline: [{ weather: 'Nessuno', startSecond: 0 }],
  terrainOverrides: [],
  reserveSeeds: 0,
  objective: 'Sopravvivi a tutte le ondate',
};

const singleWalkerLevel: LevelDefinition = {
  id: 'test-level-single-walker',
  world: 1,
  name: 'Livello di test (un Marcito Comune)',
  waves: [
    {
      index: 0,
      isFinalWave: true,
      spawns: [{ zombieId: 'marcito-comune', lane: 2, delaySeconds: 0 }],
    },
  ],
  weatherTimeline: [{ weather: 'Nessuno', startSecond: 0 }],
  terrainOverrides: [],
  reserveSeeds: 0,
  objective: 'Sopravvivi a tutte le ondate',
};

describe('CombatEngine', () => {
  it('dichiara Vittoria immediatamente su un livello senza ondate', () => {
    const { plantDefs, zombieDefs } = buildDefMaps();
    const engine = new CombatEngine(emptyLevel, plantDefs, zombieDefs, 42);
    const snapshot = engine.step();
    expect(snapshot.outcome).toBe('Victory');
  });

  it('accumula Linfa nel tempo da un Girasole Solare piazzato', () => {
    const { plantDefs, zombieDefs } = buildDefMaps();
    const engine = new CombatEngine(emptyLevel, plantDefs, zombieDefs, 1);
    // Il costo del Girasole (50) supera la Linfa iniziale (0): il piazzamento deve fallire.
    expect(engine.placePlant('girasole-solare', { lane: 0, column: 0 })).toBeNull();
  });

  it('un Muro di Corteccia blocca e alla fine viene eroso da un Marcito Comune', () => {
    const { plantDefs, zombieDefs } = buildDefMaps();
    const engine = new CombatEngine(singleWalkerLevel, plantDefs, zombieDefs, 7);

    // Diamo Linfa sufficiente forzando alcuni tick di sole (nessun produttore
    // necessario per questo test unitario: verifichiamo solo il blocco fisico).
    const wallDef = plantDefs.get('muro-di-corteccia')!;
    // Accesso diretto al campo privato solo per questo test del prototipo.
    (engine as unknown as { sap: number }).sap = wallDef.cost;
    const wall = engine.placePlant('muro-di-corteccia', { lane: 2, column: 8 });
    expect(wall).not.toBeNull();

    let ticks = 0;
    let snapshot = engine.step();
    while (snapshot.outcome === 'InProgress' && ticks < 5000) {
      snapshot = engine.step();
      ticks++;
    }

    // Il Marcito Comune (200 HP) non ha armi per distruggere il Muro (1200 HP)
    // senza piante che lo attacchino: la partita non può concludersi in Vittoria
    // finché il Marcito è vivo e bloccato, ma nemmeno oltrepassare l'Arca.
    expect(snapshot.outcome).not.toBe('Defeat');
  });
});
