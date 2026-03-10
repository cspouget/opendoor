import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the OpenRoom project. The `base` option is set
// dynamically based on an environment variable so that GitHub Pages
// deployments work correctly. When deploying to GitHub Pages the base
// path should be `/<repository name>/`, otherwise `/` is used.

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];

export default defineConfig({
  base: repository ? `/${repository}/` : '/',
  plugins: [react()],
});
