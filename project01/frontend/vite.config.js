// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 도커 내부에서 백엔드는 'backend:3001' 로 접근
const BACKEND = process.env.VITE_BACKEND_ORIGIN || 'http://backend:3001';
// 외부 접속용 HMR 고정 (프론트 서버 IP)
const PUBLIC_HOST = process.env.VITE_PUBLIC_HOST || '192.168.111.194';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,

    // HMR/WebSocket 외부 접속 고정
    hmr: { host: PUBLIC_HOST, clientPort: 3000, protocol: 'ws' },
    origin: `http://${PUBLIC_HOST}:3000`,

    proxy: {
      // ⚠️ 백엔드가 /api/fast 로 마운트돼 있다면 rewrite로 맞춥니다.
      '/fast': {
        target: BACKEND,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/fast/, '/api/fast'),
      },

      // ⚠️ KEPCO 라우터가 /api/proxy 인 경우 rewrite
      '/kepco': {
        target: BACKEND,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/kepco/, '/api/proxy'),
      },

      // 백엔드의 일반 API
      '/api': {
        target: BACKEND,
        changeOrigin: true,
      },
    },
  },
});
