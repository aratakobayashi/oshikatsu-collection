import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 環境変数を読み込み（.env.production を開発時に使用）
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    // 開発時は本番環境の設定を使用
    envDir: '.',
    envPrefix: ['VITE_'],
  };
});
