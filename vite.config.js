import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        voxie: resolve(__dirname, 'voxie-tactics.html'),
        survivor: resolve(__dirname, 'voxie-survivor.html'),
        hyperflora: resolve(__dirname, 'hyperflora.html'),
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/tmp-screens/**', '**/public/work/**', '**/Source Material/**'],
    },
  },
})
