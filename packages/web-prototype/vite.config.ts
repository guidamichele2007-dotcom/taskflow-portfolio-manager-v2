import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@rootguard/shared': new URL('../shared/src/index.ts', import.meta.url).pathname,
      '@rootguard/game-core': new URL('../game-core/src/combat/CombatEngine.ts', import.meta.url).pathname,
    },
  },
  server: {
    host: true,
  },
});
