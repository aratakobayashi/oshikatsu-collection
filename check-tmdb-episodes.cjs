const https = require('https');

// TMDB API設定
const tmdbApiKey = '4573ec6c37323f6f89002cb24c690875';
const tmdbBaseUrl = 'https://api.themoviedb.org/3';

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

// メンバー情報
const members = [
  { name: '二宮和也', tmdb_id: 33515 },
  { name: '中丸雄一', tmdb_id: 1257365 },
  { name: '山田涼介', tmdb_id: 1247874 },
  { name: '菊池風磨', tmdb_id: 1564446 }
];

async function checkMemberWorks() {
  console.log('🎬 TMDB APIで収集可能なエピソード情報を調査\n');
  console.log('=' .repeat(60));
  
  for (const member of members) {
    console.log(`\n【${member.name}】TMDB ID: ${member.tmdb_id}`);
    console.log('-'.repeat(40));
    
    try {
      // 出演作品を取得
      const credits = await tmdbApiCall(`/person/${member.tmdb_id}/combined_credits`);
      
      // 映画とTVを分類
      const movies = credits.cast?.filter(c => c.media_type === 'movie') || [];
      const tvShows = credits.cast?.filter(c => c.media_type === 'tv') || [];
      
      console.log(`\n📊 出演作品数:`);
      console.log(`   🎬 映画: ${movies.length}作品`);
      console.log(`   📺 TVドラマ・番組: ${tvShows.length}作品`);
      console.log(`   📊 合計: ${movies.length + tvShows.length}作品`);
      
      // 主要映画作品を表示（最新3作品）
      if (movies.length > 0) {
        console.log(`\n🎬 主要映画作品（最新順）:`);
        const sortedMovies = movies
          .sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))
          .slice(0, 3);
        
        for (const movie of sortedMovies) {
          console.log(`\n   ■ ${movie.title} (${(movie.release_date || '').split('-')[0]}年)`);
          console.log(`      役名: ${movie.character || '不明'}`);
          console.log(`      評価: ⭐${movie.vote_average}/10`);
          if (movie.overview) {
            console.log(`      あらすじ: ${movie.overview.substring(0, 60)}...`);
          }
        }
      }
      
      // 主要TVドラマを表示（最新3作品）
      if (tvShows.length > 0) {
        console.log(`\n📺 主要TVドラマ（最新順）:`);
        const sortedTV = tvShows
          .sort((a, b) => (b.first_air_date || '').localeCompare(a.first_air_date || ''))
          .slice(0, 3);
        
        for (const tv of sortedTV) {
          console.log(`\n   ■ ${tv.name} (${(tv.first_air_date || '').split('-')[0]}年)`);
          console.log(`      役名: ${tv.character || '不明'}`);
          console.log(`      エピソード数: ${tv.episode_count || '不明'}話`);
          if (tv.overview) {
            console.log(`      あらすじ: ${tv.overview.substring(0, 60)}...`);
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ エラー: ${error.message}`);
    }
    
    // API制限対策
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 TMDBで収集可能な情報タイプ:');
  console.log('\n【基本情報】');
  console.log('✅ タイトル（日本語/英語）');
  console.log('✅ 公開日/放送日');
  console.log('✅ 役名・キャラクター名');
  console.log('✅ あらすじ（詳細な説明文）');
  console.log('✅ 評価スコア（10点満点）');
  console.log('✅ ジャンル（アクション、ドラマ、コメディ等）');
  
  console.log('\n【画像素材】');
  console.log('✅ ポスター画像（高解像度）');
  console.log('✅ バックドロップ画像（背景用）');
  console.log('✅ スチール写真');
  
  console.log('\n【詳細情報】');
  console.log('✅ 監督・プロデューサー情報');
  console.log('✅ 共演者リスト');
  console.log('✅ 制作会社');
  console.log('✅ 予算・興行収入');
  console.log('✅ 上映時間/エピソード時間');
  
  console.log('\n【TVドラマ特有】');
  console.log('✅ シーズン情報');
  console.log('✅ エピソードごとのタイトル・あらすじ');
  console.log('✅ 放送局情報');
  console.log('✅ 出演エピソード番号');
  
  console.log('\n💡 YouTubeとの違い・TMDBの価値:');
  console.log('• プロフェッショナルな作品情報（公式データ）');
  console.log('• 高品質なポスター・宣材画像');
  console.log('• 詳細な作品メタデータ（制作情報）');
  console.log('• 国際的な評価・レビュー');
  console.log('• 体系的な出演履歴管理');
}

checkMemberWorks();