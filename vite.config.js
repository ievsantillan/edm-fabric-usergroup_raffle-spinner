import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Set BASE_PATH env var (e.g. "/raffle-spinner/") when deploying under a sub-path
// such as GitHub Pages project sites. Defaults to "/" for root deployments.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split heavy third-party libs into their own chunks so they cache
        // independently across deploys (only the entry chunk has to be
        // re-downloaded when app code changes).
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('framer-motion')) return 'framer-motion';
          if (id.includes('canvas-confetti')) return 'confetti';
          if (id.includes('papaparse') || id.includes('read-excel-file')) {
            // fileParser dynamic-imports these, so Vite already produces a
            // separate fileParser chunk for them. Returning undefined keeps
            // that split intact.
            return undefined;
          }
          if (id.includes('react-dom') || id.includes('node_modules/react/') || id.includes('scheduler')) {
            return 'react-vendor';
          }
          return undefined;
        },
      },
    },
  },
})
