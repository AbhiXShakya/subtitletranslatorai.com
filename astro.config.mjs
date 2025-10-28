import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',

  server: {
    host: true, // Enable external access
  },

  vite: {
    server: {
      watch: {
        // Prevent watch mode from crashing on Windows
        usePolling: true,
      },
    },
  },

  adapter: cloudflare(),
});