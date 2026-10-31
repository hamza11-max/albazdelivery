import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Renderer only. Served to Electron over the app:// protocol (see src/main/protocol.ts).
export default defineConfig({
  root: 'src/renderer',
  base: './',
  plugins: [react()],
  resolve: {
    // pos-core is bundled from its TypeScript source (pure functions, no Node APIs),
    // so the Sell screen shows totals with exactly the rules main applies.
    alias: { '@albaz/pos-core': fileURLToPath(new URL('../../packages/pos-core/src/index.ts', import.meta.url)) },
  },
  // Inline (empty) PostCSS config so Vite does not pick up the monorepo root's Tailwind setup.
  css: { postcss: {} },
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    // No inline polyfill script, so the page CSP can stay script-src 'self'.
    modulePreload: { polyfill: false },
    target: 'chrome130',
  },
})
