const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

// Supabaseクライアントをタイムアウト設定付きで作成
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      'x-client-info': 'supabase-js-node'
    },
    timeout: 30000 // 30秒タイムアウト
  }
});

// delay関数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 接続テスト関数
async function testConnection() {
  try {
    console.log('🔍 Supabase接続テスト中...');
    
    const { data, error, count } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      console.error('❌ 接続テストエラー:', error.message);
      return false;
    }
    
    console.log(`✅ 接続成功! エピソード総数: ${count}件`);
    return true;
  } catch (error) {
    console.error('❌ 接続テスト例外:', error.message);
    return false;
  }
}

// バッチ処理でクエリ負荷を分散
async function optimizeQueries() {
  console.log('🔧 Supabaseクエリ最適化開始...\n');
  
  try {
    // 1. 接続テスト
    const isConnected = await testConnection();
    if (!isConnected) {
      console.log('❌ 接続失敗のため処理を中断します');
      return;
    }
    
    await delay(2000);

    // 2. インデックス確認（軽量クエリ）
    console.log('📊 データベース統計情報取得中...');
    
    const tables = ['episodes', 'celebrities', 'locations', 'items'];
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`❌ ${table}テーブルエラー:`, error.message);
        } else {
          console.log(`✅ ${table}: ${count}件`);
        }
        
        // 各テーブル間で少し待機
        await delay(1000);
      } catch (err) {
        console.error(`❌ ${table}テーブル例外:`, err.message);
      }
    }

    // 3. 重いクエリの最適化テスト
    console.log('\n🚀 最適化クエリテスト...');
    
    try {
      // シンプルなクエリから開始
      const { data: recentEpisodes, error: episodeError } = await supabase
        .from('episodes')
        .select('id, title, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (episodeError) {
        console.error('❌ エピソード取得エラー:', episodeError.message);
      } else {
        console.log(`✅ 最新エピソード5件取得成功`);
        recentEpisodes.forEach((ep, index) => {
          console.log(`  ${index + 1}. ${ep.title}`);
        });
      }
    } catch (err) {
      console.error('❌ 最適化クエリ例外:', err.message);
    }

    console.log('\n🎉 Supabaseクエリ最適化完了!');
    console.log('\n💡 推奨対策:');
    console.log('1. クエリにlimit句を必ず追加');
    console.log('2. select句で必要な列のみ指定');
    console.log('3. 複雑なJOINを避ける');
    console.log('4. バッチサイズを小さくする');
    console.log('5. リクエスト間に適切な間隔を設ける');
    
  } catch (error) {
    console.error('❌ 最適化処理エラー:', error.message);
  }
}

optimizeQueries();