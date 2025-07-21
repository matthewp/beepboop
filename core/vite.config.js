import { defineConfig } from 'vite';

export default defineConfig({
  root: 'test',
  server: {
    port: 3001,
    open: '/test.html'
  },
  build: {
    outDir: '../dist-test'
  }
});