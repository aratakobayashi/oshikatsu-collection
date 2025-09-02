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
      include: ['react', 'react-dom', 'react-router-dom']
    },
    // 開発時は本番環境の設定を使用
    envDir: '.',
    envPrefix: ['VITE_'],
    // Public assets configuration for correct MIME types
    publicDir: 'public',
    assetsInclude: ['**/*.xml'],
    
    // Core Web Vitals最適化
    build: {
      // Code Splitting設定
      rollupOptions: {
        output: {
          manualChunks: {
            // React関連を分離
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // UI ライブラリを分離
            'ui-vendor': ['lucide-react'],
            // Supabase関連を分離  
            'supabase-vendor': ['@supabase/supabase-js'],
            // ユーティリティライブラリを分離
            'utils-vendor': ['lodash']
          }
        }
      },
      // チャンクサイズ警告の閾値を上げる（一時的）
      chunkSizeWarningLimit: 1000,
      // ソースマップを本番では無効化
      sourcemap: mode === 'development',
      // 最小化設定
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production'
        }
      },
      // CSS Code Splitting
      cssCodeSplit: true
    },
    
    // 開発サーバー最適化
    server: {
      // プリロード設定
      preTransformRequests: true,
      // HMR最適化
      hmr: {
        overlay: false
      }
    }
  };
});
