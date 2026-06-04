import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Set BASE_PATH env var (e.g. "/raffle-spinner/") when deploying under a sub-path
// such as GitHub Pages project sites. Defaults to "/" for root deployments.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
