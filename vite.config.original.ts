import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 環境変数を読み込み
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react({
        // React最適化
        babel: {
          plugins: mode === 'production' ? [
            ['babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] }]
          ] : []
        }
      })
    ],
    
    // 依存関係最適化
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: [
        'react',
        'react-dom', 
        'react-router-dom',
        '@supabase/supabase-js'
      ],
      // 事前バンドル強制
      force: false
    },
    
    envDir: '.',
    envPrefix: ['VITE_'],
    publicDir: 'public',
    assetsInclude: ['**/*.xml', '**/*.webp', '**/*.avif'],
    
    // ビルド最適化（大幅強化）
    build: {
      target: 'es2020', // Modern browsers
      
      rollupOptions: {
        output: {
          // より細かいコード分割
          manualChunks: {
            // React関連（最も重要）
            'react-core': ['react', 'react-dom'],
            'react-router': ['react-router-dom'],
            
            // 外部サービス分離
            'supabase': ['@supabase/supabase-js'],
            
            // UIライブラリ分離
            'ui-libs': ['lucide-react'],
            
            // ユーティリティ分離
            'utils': ['lodash']
          },
          
          // ファイル名最適化（キャッシュ効率化）
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
              : 'chunk';
            return `js/${facadeModuleId}-[hash].js`;
          },
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            if (['css'].includes(ext)) {
              return `css/[name]-[hash].${ext}`;
            }
            if (['png', 'jpg', 'jpeg', 'webp', 'avif', 'svg'].includes(ext)) {
              return `images/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          }
        },
        
        // 外部依存関係最適化
        external: (id) => {
          // CDNから読み込む場合はexternalに
          return false; // 現在は全てバンドル
        }
      },
      
      // パフォーマンス設定
      chunkSizeWarningLimit: 500, // より厳しい制限
      reportCompressedSize: false, // ビルド高速化
      
      // ソースマップ最適化
      sourcemap: mode === 'development' ? true : false,
      
      // 圧縮最適化
      minify: 'terser',
      terserOptions: {
        compress: {
          // 本番環境での最適化
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
          pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
          // デッドコード削除
          dead_code: true,
          // 未使用変数削除
          unused: true
        },
        mangle: {
          // 変数名短縮化
          toplevel: true
        },
        format: {
          // コメント削除
          comments: false
        }
      },
      
      // CSS最適化
      cssCodeSplit: true,
      cssMinify: 'esbuild'
    },
    
    // 開発サーバー最適化
    server: {
      preTransformRequests: true,
      hmr: {
        overlay: false
      },
      // 静的ファイル圧縮
      middlewareMode: false
    },
    
    // プラグイン追加（画像最適化など）
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@pages': resolve(__dirname, 'src/pages'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@lib': resolve(__dirname, 'src/lib')
      }
    },
    
    // 実験的機能
    experimental: {
      renderBuiltUrl: (filename, { hostType }) => {
        // CDN URLに書き換える場合
        return filename;
      }
    }
  };
});