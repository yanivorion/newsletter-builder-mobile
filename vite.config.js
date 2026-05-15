import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Allow JSX in .js files (matches the Next.js default the source uses).
export default defineConfig({
  base: '/newsletter-builder-mobile/',
  plugins: [
    react({
      include: /\.(jsx|js)$/,
    }),
  ],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Shim Next.js routing in the SPA — only useRouter() is used
      'next/navigation': path.resolve(__dirname, './src/lib/router-shim.js'),
    },
  },
});
