import { createClient } from '@supabase/supabase-js';
import path from 'path';

// Supabase client setup
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Celebrity {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  type: string;
  status: string;
}

async function checkImageAvailability(url: string): Promise<boolean> {
  if (!url) return false;

  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function debugCelebrityImages() {
  console.log('🔍 セレブリティ画像状況調査開始');
  console.log('='.repeat(60));

  // 全セレブリティデータを取得
  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('id, name, slug, image_url, type, status')
    .order('name');

  if (error) {
    console.error('❌ データ取得エラー:', error);
    return;
  }

  if (!celebrities || celebrities.length === 0) {
    console.log('ℹ️  セレブリティデータが見つかりません');
    return;
  }

  console.log(`📊 総セレブリティ数: ${celebrities.length}人`);
  console.log('');

  const stats = {
    total: celebrities.length,
    withImageUrl: 0,
    withoutImageUrl: 0,
    workingImages: 0,
    brokenImages: 0,
    activeWithoutImage: 0,
    inactiveWithoutImage: 0
  };

  const problemCelebrities: Celebrity[] = [];
  const workingCelebrities: Celebrity[] = [];

  // 各セレブリティの画像をチェック
  for (const celebrity of celebrities) {
    const hasImageUrl = !!celebrity.image_url;

    if (hasImageUrl) {
      stats.withImageUrl++;

      // 画像URLが有効かチェック
      const isImageWorking = await checkImageAvailability(celebrity.image_url!);

      if (isImageWorking) {
        stats.workingImages++;
        workingCelebrities.push(celebrity);
      } else {
        stats.brokenImages++;
        problemCelebrities.push(celebrity);
      }

      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 200));
    } else {
      stats.withoutImageUrl++;
      problemCelebrities.push(celebrity);

      if (celebrity.status === 'active') {
        stats.activeWithoutImage++;
      } else {
        stats.inactiveWithoutImage++;
      }
    }

    console.log(`${hasImageUrl ? (await checkImageAvailability(celebrity.image_url!) ? '✅' : '❌') : '⚠️ '} ${celebrity.name} (${celebrity.type})`);
  }

  // 統計情報表示
  console.log('');
  console.log('📈 画像状況統計');
  console.log('='.repeat(60));
  console.log(`📊 総数: ${stats.total}人`);
  console.log(`✅ 画像URL有効: ${stats.workingImages}人 (${Math.round(stats.workingImages/stats.total*100)}%)`);
  console.log(`❌ 画像URL無効/破損: ${stats.brokenImages}人`);
  console.log(`⚠️  画像URL未設定: ${stats.withoutImageUrl}人`);
  console.log(`   └ アクティブ: ${stats.activeWithoutImage}人`);
  console.log(`   └ 非アクティブ: ${stats.inactiveWithoutImage}人`);

  // 問題のあるセレブリティをタイプ別に表示
  if (problemCelebrities.length > 0) {
    console.log('');
    console.log('⚠️  問題のあるセレブリティ詳細');
    console.log('='.repeat(60));

    const groupedByType = problemCelebrities.reduce((acc, celeb) => {
      if (!acc[celeb.type]) acc[celeb.type] = [];
      acc[celeb.type].push(celeb);
      return acc;
    }, {} as Record<string, Celebrity[]>);

    for (const [type, celebs] of Object.entries(groupedByType)) {
      console.log(`\n📱 ${type}タイプ (${celebs.length}人):`);
      celebs.forEach(celeb => {
        const hasUrl = !!celeb.image_url;
        const statusIcon = celeb.status === 'active' ? '🟢' : '🔴';
        console.log(`   ${statusIcon} ${celeb.name} (${celeb.slug})`);
        if (hasUrl) {
          console.log(`      URL: ${celeb.image_url}`);
        } else {
          console.log(`      ❌ 画像URL未設定`);
        }
      });
    }
  }

  // 推奨アクション
  console.log('');
  console.log('💡 推奨アクション');
  console.log('='.repeat(60));

  if (stats.activeWithoutImage > 0) {
    console.log(`1. アクティブで画像未設定の${stats.activeWithoutImage}人に画像を追加`);
    console.log('   - YouTuberタイプ: YouTube Data APIで取得');
    console.log('   - 俳優タイプ: TMDB APIで取得');
    console.log('   - その他: 手動設定または削除検討');
  }

  if (stats.brokenImages > 0) {
    console.log(`2. 破損画像${stats.brokenImages}件の修正`);
    console.log('   - 新しい画像URLに更新');
    console.log('   - または削除検討');
  }

  if (stats.inactiveWithoutImage > 0) {
    console.log(`3. 非アクティブ・画像未設定の${stats.inactiveWithoutImage}人の削除検討`);
  }

  console.log('');
  console.log('🛠️  修正用コマンド例:');
  console.log('# YouTube Data APIで画像取得');
  console.log('npx tsx scripts/fix-youtuber-images.ts');
  console.log('');
  console.log('# TMDB APIで俳優画像取得');
  console.log('npx tsx scripts/fix-actor-images-with-tmdb.ts');
  console.log('');
  console.log('# 問題データの削除');
  console.log('npx tsx scripts/cleanup-celebrities-without-images.ts');

  console.log('');
  console.log('='.repeat(60));
  console.log('🔍 画像状況調査完了');
}

// メイン実行
debugCelebrityImages().catch(console.error);

export { debugCelebrityImages };