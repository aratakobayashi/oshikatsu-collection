import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 環境変数を読み込み
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: '/', // SPAのベースパスを明示的にルートに設定
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
    
    // 🚀 依存関係最適化（強化版）
    optimizeDeps: {
      include: [
        'react',
        'react-dom', 
        'react-router-dom',
        '@supabase/supabase-js',
        'lucide-react',
        'uuid',
        'web-vitals'
      ],
      exclude: [
        // 大きなライブラリは必要に応じて読み込み
        '@supabase/storage-js'
      ],
      // 開発時のキャッシュ最適化
      force: false,
      // ESビルド最適化
      esbuildOptions: {
        target: 'es2020',
        // Tree shakingを強化
        treeShaking: true
      }
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
          // 🎯 更に細かいコード分割戦略
          manualChunks: (id) => {
            // Vendor chunks - 最も重要
            if (id.includes('node_modules')) {
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-core'
              }
              if (id.includes('react-router-dom')) {
                return 'react-router'  
              }
              
              // External services
              if (id.includes('@supabase')) {
                return 'supabase'
              }
              
              // UI libraries  
              if (id.includes('lucide-react')) {
                return 'ui-libs'
              }
              
              // Utilities
              if (id.includes('lodash') || id.includes('uuid')) {
                return 'utils'
              }
              
              // Performance monitoring
              if (id.includes('web-vitals')) {
                return 'web-vitals'
              }
              
              // Other vendor code
              return 'vendor'
            }
            
            // App chunks - feature-based splitting
            if (id.includes('pages/public')) {
              if (id.includes('Home')) return 'home-page'
              if (id.includes('Celebrities')) return 'celebrities-page'  
              if (id.includes('Items')) return 'items-page'
              if (id.includes('Locations')) return 'locations-page'
              if (id.includes('Episodes')) return 'episodes-page'
              return 'other-pages'
            }
            
            if (id.includes('pages/admin')) {
              return 'admin-pages'
            }
            
            // Component chunks
            if (id.includes('components/SEO')) {
              return 'seo-components'
            }
            
            if (id.includes('components') && (
              id.includes('Search') || 
              id.includes('Carousel') || 
              id.includes('Hero')
            )) {
              return 'ui-components'
            }
            
            // Utils and libs
            if (id.includes('utils') || id.includes('lib')) {
              return 'app-utils'
            }
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
      chunkSizeWarningLimit: 300, // より厳しい制限でバンドルサイズを管理
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
      cssMinify: 'esbuild' // lightningcssの代わりにesbuildを使用
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