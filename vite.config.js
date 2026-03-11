import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@managers': path.resolve(__dirname, './src/managers'),
      '@materials': path.resolve(__dirname, './src/materials'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@features': path.resolve(__dirname, './src/features')
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0', // ネットワークからアクセス可能にする
    open: true
  },
  optimizeDeps: {
    entries: ['index.html', 'singularity.html', 'future_2050.html']
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),

      }
    }
  }
});
