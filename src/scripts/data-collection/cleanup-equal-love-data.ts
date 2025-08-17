import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 環境変数読み込み
dotenv.config({ path: '.env.staging' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const EQUAL_LOVE_ID = '259e44a6-5a33-40cf-9d78-86cfbd9df2ac';

async function cleanupEqualLoveData() {
  console.log('🧹 =LOVE データクリーンアップ開始');
  console.log('='.repeat(60));
  
  try {
    // 1. 既存ロケーションデータを削除
    console.log('📍 ロケーションデータを削除中...');
    
    const { data: deletedLocations, error: locationError } = await supabase
      .from('locations')
      .delete()
      .eq('celebrity_id', EQUAL_LOVE_ID)
      .select();

    if (locationError) {
      console.error('❌ ロケーション削除エラー:', locationError);
      throw locationError;
    }

    console.log(`✅ ${deletedLocations?.length || 0}件のロケーションを削除完了`);

    // 2. 既存アイテムデータを削除
    console.log('👗 アイテムデータを削除中...');
    
    const { data: deletedItems, error: itemError } = await supabase
      .from('items')
      .delete()
      .eq('celebrity_id', EQUAL_LOVE_ID)
      .select();

    if (itemError) {
      console.error('❌ アイテム削除エラー:', itemError);
      throw itemError;
    }

    console.log(`✅ ${deletedItems?.length || 0}件のアイテムを削除完了`);

    // 3. 削除結果の確認
    console.log('\n📊 削除後の確認...');
    
    const { count: remainingLocations, error: countLocationError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', EQUAL_LOVE_ID);

    const { count: remainingItems, error: countItemError } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', EQUAL_LOVE_ID);

    if (countLocationError || countItemError) {
      console.error('❌ 確認エラー:', countLocationError || countItemError);
    } else {
      console.log(`📍 残存ロケーション: ${remainingLocations || 0}件`);
      console.log(`👗 残存アイテム: ${remainingItems || 0}件`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 =LOVE データクリーンアップ完了！');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ クリーンアップ中にエラーが発生:', error);
    process.exit(1);
  }
}

// 確認プロンプト付きで実行
async function main() {
  console.log('⚠️  =LOVE の全ロケーション・アイテムデータを削除します');
  console.log('この操作は取り消せません。');
  
  // 本番環境での安全確認
  if (process.env.NODE_ENV === 'production') {
    console.log('🛑 本番環境での実行が検出されました');
    console.log('続行する場合は FORCE_CLEANUP=true を設定してください');
    
    if (process.env.FORCE_CLEANUP !== 'true') {
      console.log('❌ 安全のため処理を中止します');
      process.exit(1);
    }
  }

  await cleanupEqualLoveData();
}

// ES moduleでの実行チェック
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}