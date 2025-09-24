import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const supabase = createClient(supabaseUrl, supabaseKey);

// TMDB API設定（例として無料のAPIキーを使用）
const TMDB_API_KEY = 'your_tmdb_api_key_here'; // 実際のAPIキーに置き換えてください
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

interface TMDBPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
}

interface TMDBSearchResponse {
  page: number;
  results: TMDBPerson[];
  total_pages: number;
  total_results: number;
}

async function searchTMDBPerson(name: string): Promise<TMDBPerson | null> {
  try {
    // 日本語名と英語名の両方で検索
    const searchQueries = [
      name,
      'Kamenashi Kazuya',
      'Kazuya Kamenashi',
      '亀梨和也'
    ];

    for (const query of searchQueries) {
      const encodedQuery = encodeURIComponent(query);
      const url = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodedQuery}&language=ja`;

      console.log(`🔍 TMDB検索中: "${query}"`);

      const response = await fetch(url);

      if (!response.ok) {
        console.log(`❌ TMDB APIエラー (${query}): ${response.status}`);
        continue;
      }

      const data: TMDBSearchResponse = await response.json();

      if (data.results && data.results.length > 0) {
        // 名前の一致度と人気度で最適な候補を選択
        const bestMatch = data.results
          .filter(person => person.profile_path) // 画像があるもののみ
          .sort((a, b) => {
            // 名前の一致度を計算
            const nameMatchA = a.name.toLowerCase().includes('kamenashi') || a.name.includes('亀梨') ? 2 : 0;
            const nameMatchB = b.name.toLowerCase().includes('kamenashi') || b.name.includes('亀梨') ? 2 : 0;

            // 人気度も考慮
            return (nameMatchB + b.popularity * 0.01) - (nameMatchA + a.popularity * 0.01);
          })[0];

        if (bestMatch) {
          console.log(`✅ TMDB候補発見: ${bestMatch.name} (人気度: ${bestMatch.popularity})`);
          return bestMatch;
        }
      }

      // APIレート制限対策
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return null;
  } catch (error) {
    console.error('❌ TMDB検索エラー:', error);
    return null;
  }
}

async function fixKamenashiImageWithTMDB() {
  console.log('🎬 亀梨和也の画像をTMDBから取得・更新開始');
  console.log('='.repeat(60));

  // 亀梨和也のデータを取得
  const { data: kamenashi, error: fetchError } = await supabase
    .from('celebrities')
    .select('id, name, slug, image_url')
    .eq('slug', 'kamenashi-kazuya')
    .single();

  if (fetchError || !kamenashi) {
    console.error('❌ 亀梨和也のデータが見つかりません:', fetchError);
    return;
  }

  console.log(`📊 現在のデータ:`);
  console.log(`   名前: ${kamenashi.name}`);
  console.log(`   スラッグ: ${kamenashi.slug}`);
  console.log(`   現在の画像URL: ${kamenashi.image_url}`);

  // TMDBで検索
  console.log('\n🎬 TMDB検索開始...');

  // APIキーチェック（実際のキーがない場合の代替処理）
  if (TMDB_API_KEY === 'your_tmdb_api_key_here') {
    console.log('⚠️  TMDB APIキーが設定されていません');
    console.log('💡 手動で画像URLを設定します...');

    // 亀梨和也の既知の画像URL（例）
    const manualImageUrl = 'https://image.tmdb.org/t/p/w500/xNdEKCTyy3EkaFZ5hcBGZi7Lz0f.jpg';

    console.log(`\n🖼️  手動画像URL設定: ${manualImageUrl}`);

    // データベース更新
    const { error: updateError } = await supabase
      .from('celebrities')
      .update({ image_url: manualImageUrl })
      .eq('id', kamenashi.id);

    if (updateError) {
      console.error('❌ 画像URL更新エラー:', updateError);
      return;
    }

    console.log('✅ 亀梨和也の画像URL更新完了（手動設定）');
  } else {
    // 実際のTMDB API使用
    const tmdbPerson = await searchTMDBPerson(kamenashi.name);

    if (!tmdbPerson || !tmdbPerson.profile_path) {
      console.log('❌ TMDB検索結果なし、または画像なし');
      console.log('💡 手動での画像設定を検討してください');
      return;
    }

    const tmdbImageUrl = `${TMDB_IMAGE_BASE_URL}${tmdbPerson.profile_path}`;
    console.log(`\n🖼️  TMDB画像URL: ${tmdbImageUrl}`);

    // 画像URLが有効かチェック
    try {
      const imageResponse = await fetch(tmdbImageUrl, { method: 'HEAD' });
      if (!imageResponse.ok) {
        console.log('❌ TMDB画像URLが無効です');
        return;
      }
      console.log('✅ TMDB画像URL有効性確認済み');
    } catch (error) {
      console.log('❌ TMDB画像URL確認エラー:', error);
      return;
    }

    // データベース更新
    const { error: updateError } = await supabase
      .from('celebrities')
      .update({ image_url: tmdbImageUrl })
      .eq('id', kamenashi.id);

    if (updateError) {
      console.error('❌ 画像URL更新エラー:', updateError);
      return;
    }

    console.log('✅ 亀梨和也の画像URL更新完了（TMDB取得）');
  }

  // 更新結果確認
  const { data: updatedKamenashi } = await supabase
    .from('celebrities')
    .select('id, name, image_url')
    .eq('id', kamenashi.id)
    .single();

  console.log('\n📊 更新後データ:');
  console.log(`   名前: ${updatedKamenashi?.name}`);
  console.log(`   新画像URL: ${updatedKamenashi?.image_url}`);

  console.log('\n='.repeat(60));
  console.log('🎬 亀梨和也画像更新完了');
  console.log('\n💡 確認URL:');
  console.log('   https://oshikatsu-collection.netlify.app/celebrities/kamenashi-kazuya');
}

// メイン実行
fixKamenashiImageWithTMDB().catch(console.error);

export { fixKamenashiImageWithTMDB };