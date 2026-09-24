import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Cargar el catálogo 25 (3,3 MB) tarda en las máquinas lentas del CI.
    testTimeout: 20_000,
  },
})
