// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 외부 접속 허용
    port: 3000,      // 프론트 포트
    proxy: {
      // KEPCO 산업 평균 API
      '/kepco': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // 일반 API
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
