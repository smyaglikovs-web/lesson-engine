import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom Bundler Resolver: Intercepts and force-redirects youtube.js
const fixYoutubeUtilsPlugin = () => ({
  name: 'fix-youtube-utils-redirect',
  resolveId(source) {
    if (source.includes('youtube.js') || source.endsWith('utils/youtube.js')) {
      return { id: path.resolve(__dirname, './src/frontend/utils/youtube.js') };
    }
    return null;
  }
});

export default defineConfig({
  plugins: [
    react(),
    fixYoutubeUtilsPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@utils': path.resolve(__dirname, './src/frontend/utils'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
