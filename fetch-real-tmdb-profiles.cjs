const { createClient } = require('@supabase/supabase-js');
const https = require('https');

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
          if (response.success === false) {
            reject(new Error(response.status_message || 'API Error'));
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// 日本の俳優名で検索
async function searchJapaneseActor(name) {
  console.log(`🔍 ${name}を検索中...`);
  
  try {
    // 人物検索
    const searchResults = await tmdbApiCall(`/search/person?query=${encodeURIComponent(name)}`);
    
    if (searchResults.results && searchResults.results.length > 0) {
      // 最初の結果を使用（通常最も関連性が高い）
      const person = searchResults.results[0];
      console.log(`✅ 発見: ${person.name} (ID: ${person.id})`);
      
      // 詳細情報を取得
      const details = await tmdbApiCall(`/person/${person.id}`);
      const images = await tmdbApiCall(`/person/${person.id}/images`);
      
      // 最適な画像を選択
      let bestImage = null;
      
      if (images.profiles && images.profiles.length > 0) {
        // 日本の画像を優先、なければ最初の画像
        const japaneseImage = images.profiles.find(p => p.iso_639_1 === 'ja');
        bestImage = japaneseImage || images.profiles[0];
      } else if (person.profile_path) {
        bestImage = { file_path: person.profile_path };
      }
      
      return {
        tmdb_id: person.id,
        name: person.name,
        known_for_department: person.known_for_department,
        profile_path: bestImage ? `${tmdbImageBaseUrl}/w500${bestImage.file_path}` : null,
        profile_path_original: bestImage ? `${tmdbImageBaseUrl}/original${bestImage.file_path}` : null,
        biography: details.biography || '',
        birthday: details.birthday,
        homepage: details.homepage,
        known_for: person.known_for || []
      };
    } else {
      console.log(`⚠️  ${name}は見つかりませんでした`);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${name}の検索エラー:`, error.message);
    return null;
  }
}

// よにのちゃんねるメンバーの情報
const members = [
  { slug: 'ninomiya-kazunari', name: '二宮和也', search_names: ['二宮和也', 'Kazunari Ninomiya'] },
  { slug: 'nakamaru-yuichi', name: '中丸雄一', search_names: ['中丸雄一', 'Yuichi Nakamaru'] },
  { slug: 'yamada-ryosuke', name: '山田涼介', search_names: ['山田涼介', 'Ryosuke Yamada'] },
  { slug: 'kikuchi-fuma', name: '菊池風磨', search_names: ['菊池風磨', 'Fuma Kikuchi'] }
];

async function updateCelebrityImages() {
  console.log('🎬 TMDB APIで実際の俳優プロフィール画像を取得開始！\n');
  
  const results = [];
  
  for (const member of members) {
    console.log(`\n--- ${member.name} ---`);
    
    let actorInfo = null;
    
    // 複数の検索名で試行
    for (const searchName of member.search_names) {
      actorInfo = await searchJapaneseActor(searchName);
      if (actorInfo) break;
      
      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (actorInfo && actorInfo.profile_path) {
      // データベース更新（image_urlのみ）
      const { error } = await supabase
        .from('celebrities')
        .update({
          image_url: actorInfo.profile_path
        })
        .eq('slug', member.slug);
      
      if (!error) {
        console.log(`✅ データベース更新成功`);
        console.log(`   画像: ${actorInfo.profile_path}`);
        console.log(`   TMDB ID: ${actorInfo.tmdb_id}`);
        
        results.push({
          name: member.name,
          success: true,
          tmdb_id: actorInfo.tmdb_id,
          image_url: actorInfo.profile_path,
          known_for: actorInfo.known_for.map(work => work.title || work.name).filter(Boolean).slice(0, 3)
        });
      } else {
        console.error(`❌ データベース更新失敗:`, error.message);
        results.push({ name: member.name, success: false, error: error.message });
      }
    } else {
      console.log(`⚠️  ${member.name}のプロフィール画像が取得できませんでした`);
      
      // YouTubeのまま維持
      results.push({
        name: member.name,
        success: false,
        note: 'TMDB未登録のため、YouTube画像を維持'
      });
    }
    
    // API制限対策
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 TMDB プロフィール画像取得完了！');
  console.log('\n📊 結果サマリー:');
  
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.name}:`);
      console.log(`   TMDB ID: ${result.tmdb_id}`);
      console.log(`   出演作品: ${result.known_for.join(', ') || 'なし'}`);
    } else {
      console.log(`⚠️  ${result.name}: ${result.note || result.error}`);
    }
  });
  
  console.log('\n🌐 確認方法:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities');
  console.log('→ 各推しの画像が高品質な俳優プロフィール画像に更新されているはず');
  
  console.log('\n💡 追加情報:');
  console.log('• 二宮和也: 嵐メンバー、俳優として多数作品出演');
  console.log('• 山田涼介: Hey! Say! JUMP、暗殺教室など映画主演');
  console.log('• 菊池風磨: Sexy Zone、ドラマ・映画出演');
  console.log('• 中丸雄一: KAT-TUN、バラエティ番組出演中心');
}

updateCelebrityImages();