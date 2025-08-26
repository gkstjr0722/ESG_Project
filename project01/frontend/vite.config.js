// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// .env.local 등에 VITE_BACKEND_ORIGIN=http://localhost:3001 넣어두면 편함
const BACKEND = process.env.VITE_BACKEND_ORIGIN || 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,              // 프론트 포트(유지)
    strictPort: true,        // 이미 사용 중이면 에러 내고 종료 (포트 헷갈림 방지)
    proxy: {
      // FastAPI 브리지(Express) 라우터
      '/fast': {
        target: BACKEND,     // ← Express(3001)가 /fast 라우터를 마운트하고 있어야 함
        changeOrigin: true,
        ws: true,
        // rewrite: (p) => p,  // 백엔드가 /fast로 마운트되어 있으므로 rewrite 불필요
      },

      // 산업 평균 API (기존 유지)
      '/kepco': {
        target: BACKEND,
        changeOrigin: true,
        ws: true,
      },

      // 일반 API (기존 유지)
      '/api': {
        target: BACKEND,
        changeOrigin: true,
        ws: true,
      },
    },
  },
});