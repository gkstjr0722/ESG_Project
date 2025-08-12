import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/fast': {               // ★ 프록시 추가
        target: 'http://localhost:3001', // 도커면 backend 서비스 주소
        changeOrigin: true
      }
    }
  }
});
