/**
 * ブラウザでの環境変数テスト
 */

// ブラウザのコンソールで実行可能なテストコード
console.log('=== 環境変数テスト ===');
console.log('VITE_ENVIRONMENT:', import.meta.env.VITE_ENVIRONMENT);
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('NODE_ENV:', import.meta.env.NODE_ENV);
console.log('MODE:', import.meta.env.MODE);

// Supabase接続テスト
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  console.log('✅ Supabase設定OK');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // よにのちゃんねるデータ取得テスト
  supabase
    .from('celebrities')
    .select('*')
    .eq('slug', 'よにのちゃんねる')
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ よにのちゃんねる取得エラー:', error);
      } else {
        console.log('✅ よにのちゃんねる取得成功:', data);
      }
    });
} else {
  console.error('❌ Supabase設定が見つかりません');
}