import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'util', 'stream'],
      globals: {
        Buffer: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      // Force resolve rxjs to the ESM build
      'rxjs': path.resolve(__dirname, 'node_modules/rxjs/dist/esm/index.js'),
    }
  },
  optimizeDeps: {
    include: ['rxjs', '@stellar/stellar-sdk', '@creit.tech/stellar-wallets-kit'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
})
