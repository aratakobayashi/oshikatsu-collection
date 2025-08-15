const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const crypto = require('crypto');

// 設定
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

// TMDB API設定
const tmdbApiKey = '4573ec6c37323f6f89002cb24c690875';
const tmdbBaseUrl = 'https://api.themoviedb.org/3';
const tmdbImageBaseUrl = 'https://image.tmdb.org/t/p';

const supabase = createClient(supabaseUrl, supabaseKey);

// TMDB API呼び出し
async function tmdbApiCall(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${tmdbBaseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${tmdbApiKey}&language=ja`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// ジャンルIDから名前を取得
const genreMap = {
  28: 'アクション', 35: 'コメディ', 18: 'ドラマ', 10749: 'ロマンス',
  9648: 'ミステリー', 80: '犯罪', 878: 'SF', 53: 'スリラー',
  10751: 'ファミリー', 14: 'ファンタジー', 27: 'ホラー', 36: '歴史',
  10402: '音楽', 10770: 'テレビ映画', 10752: '戦争', 37: '西部劇',
  16: 'アニメーション', 99: 'ドキュメンタリー', 12: 'アドベンチャー'
};

// メンバー情報
const members = [
  { slug: 'ninomiya-kazunari', name: '二宮和也', tmdb_id: 33515 },
  { slug: 'nakamaru-yuichi', name: '中丸雄一', tmdb_id: 1257365 },
  { slug: 'yamada-ryosuke', name: '山田涼介', tmdb_id: 1247874 },
  { slug: 'kikuchi-fuma', name: '菊池風磨', tmdb_id: 1564446 }
];

async function addMemberWorks(member) {
  console.log(`\n📌 ${member.name}の作品を処理中...`);
  
  // セレブリティ情報を取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('slug', member.slug)
    .single();
  
  if (!celebrity) {
    console.error(`❌ ${member.name}のセレブリティ情報が見つかりません`);
    return { added: 0, skipped: 0 };
  }
  
  // TMDB出演作品を取得
  const credits = await tmdbApiCall(`/person/${member.tmdb_id}/combined_credits`);
  const allWorks = credits.cast || [];
  
  // 作品を公開日順にソート（新しい順）
  const sortedWorks = allWorks.sort((a, b) => {
    const dateA = a.release_date || a.first_air_date || '';
    const dateB = b.release_date || b.first_air_date || '';
    return dateB.localeCompare(dateA);
  });
  
  let addedCount = 0;
  let skippedCount = 0;
  
  for (const work of sortedWorks) {
    const isMovie = work.media_type === 'movie';
    const title = work.title || work.name;
    const releaseDate = work.release_date || work.first_air_date;
    
    if (!title) continue;
    
    // 既存チェック（タイトルと公開日で判定）
    const { data: existing } = await supabase
      .from('episodes')
      .select('id')
      .eq('title', title)
      .eq('celebrity_id', celebrity.id)
      .single();
    
    if (existing) {
      skippedCount++;
      continue;
    }
    
    // ジャンル情報を取得
    const genres = work.genre_ids
      ? work.genre_ids.map(id => genreMap[id]).filter(Boolean).join('、')
      : '';
    
    // ポスター画像URL（高解像度）
    const posterUrl = work.poster_path
      ? `${tmdbImageBaseUrl}/w780${work.poster_path}`
      : null;
    
    // 詳細説明を作成
    let description = work.overview || '';
    if (work.character) {
      description += `\n\n【役名】${work.character}`;
    }
    if (genres) {
      description += `\n【ジャンル】${genres}`;
    }
    if (work.vote_average > 0) {
      description += `\n【評価】⭐${work.vote_average}/10`;
    }
    if (!isMovie && work.episode_count) {
      description += `\n【出演話数】${work.episode_count}話`;
    }
    
    // エピソードデータを作成
    const episodeData = {
      id: crypto.randomUUID(),
      title: title,
      description: description.trim(),
      date: releaseDate ? new Date(releaseDate).toISOString() : null,
      thumbnail_url: posterUrl,
      video_url: `https://www.themoviedb.org/${isMovie ? 'movie' : 'tv'}/${work.id}`,
      celebrity_id: celebrity.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // データベースに保存
    const { error } = await supabase
      .from('episodes')
      .insert(episodeData);
    
    if (!error) {
      addedCount++;
      console.log(`   ✅ ${title} (${releaseDate ? releaseDate.split('-')[0] : '年不明'})`);
    } else {
      console.error(`   ❌ ${title}: ${error.message}`);
    }
    
    // API制限対策
    if (addedCount % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return { added: addedCount, skipped: skippedCount, total: allWorks.length };
}

async function main() {
  console.log('🎬 TMDB映画・ドラマエピソードの一括追加を開始！');
  console.log('=' .repeat(60));
  
  const results = [];
  let totalAdded = 0;
  let totalWorks = 0;
  
  for (const member of members) {
    const result = await addMemberWorks(member);
    results.push({ ...member, ...result });
    totalAdded += result.added;
    totalWorks += result.total;
    
    // API制限対策
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎉 TMDB作品追加完了！\n');
  
  console.log('📊 結果サマリー:');
  results.forEach(r => {
    console.log(`   ${r.name}: ${r.added}作品追加 (全${r.total}作品中、${r.skipped}件スキップ)`);
  });
  
  console.log(`\n📈 総計:`);
  console.log(`   追加作品数: ${totalAdded}作品`);
  console.log(`   全作品数: ${totalWorks}作品`);
  
  console.log('\n🌐 確認URL:');
  members.forEach(m => {
    console.log(`   ${m.name}: https://oshikatsu-collection.netlify.app/celebrities/${m.slug}`);
  });
  
  console.log('\n💡 追加された情報:');
  console.log('• 映画・ドラマのポスター画像（高解像度）');
  console.log('• 詳細なあらすじ（日本語）');
  console.log('• 役名・キャラクター情報');
  console.log('• ジャンル分類');
  console.log('• 評価スコア（10点満点）');
  console.log('• TMDB詳細ページへのリンク');
}

main().catch(console.error);