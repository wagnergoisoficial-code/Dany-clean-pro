import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import {HERO_COVER} from './src/generated/heroCover';

/**
 * Puts the baked cover photo's path into index.html's preload script
 * (scripts/bake-hero.mjs writes it before every build).
 */
function heroCoverPreload(): Plugin {
  return {
    name: 'hero-cover-preload',
    transformIndexHtml: (html) => html.replace(/%HERO_COVER_FILE%/g, HERO_COVER.file),
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', 'VITE_');
  
  // Build safe defines map for only VITE_ prefixed environment variables
  const envDefines: Record<string, string> = {};
  
  // Map from env files loaded
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('VITE_')) {
      envDefines[`import.meta.env.${key}`] = JSON.stringify(value);
    }
  }
  
  // Map from system environment (process.env) to capture Secrets
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('VITE_') && value !== undefined) {
      envDefines[`import.meta.env.${key}`] = JSON.stringify(value);
    }
  }

  return {
    plugins: [react(), tailwindcss(), heroCoverPreload()],
    define: envDefines,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
