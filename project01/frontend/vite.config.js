// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 외부 접속 허용
    port: 3000,      // 프론트 포트
    proxy: {
      '/fast': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // ✅ 추가: /api → 백엔드(3001)로 프록시
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        // rewrite는 불필요(서버가 /api 경로로 마운트되어 있다면 그대로 보냄)
        // rewrite: (path) => path, 
      },
    },
  },
});
