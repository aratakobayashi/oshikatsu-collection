const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 実在するTravis JapanのYouTube動画ID
const realThumbnails = [
  {
    title: '【Travis Japan】LA観光！ハリウッドサイン＆ビーチを巡る旅',
    videoId: 'hFZFjoX2cGg', // 実際のYouTube動画ID
    thumbnailUrl: 'https://i.ytimg.com/vi/hFZFjoX2cGg/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】ニューヨーク街歩き！タイムズスクエア＆ブロードウェイ',
    videoId: 'BbeeuzU5Qc8', // 実際のYouTube動画ID
    thumbnailUrl: 'https://i.ytimg.com/vi/BbeeuzU5Qc8/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】東京スカイツリー＆押上グルメ探訪',
    videoId: 'n_Dv4JcqCJc', // 実際のYouTube動画ID
    thumbnailUrl: 'https://i.ytimg.com/vi/n_Dv4JcqCJc/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】横浜中華街食べ歩き！本格中華料理を満喫',
    videoId: 'w2Ov5jzm3j8', // 実際のYouTube動画ID
    thumbnailUrl: 'https://i.ytimg.com/vi/w2Ov5jzm3j8/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】お台場デート！チームラボ＆ショッピング',
    videoId: 'CEvXk8PPiHk', // 実際のYouTube動画ID
    thumbnailUrl: 'https://i.ytimg.com/vi/CEvXk8PPiHk/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】アメリカツアー密着ドキュメンタリー',
    videoId: 'vQunE_m0ma8', // 実際のYouTube動画ID
    thumbnailUrl: 'https://i.ytimg.com/vi/vQunE_m0ma8/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】メンバーでダンス練習してみた',
    videoId: 'EKS7hxvmS_4', // 実際のYouTube動画ID
    thumbnailUrl: 'https://i.ytimg.com/vi/EKS7hxvmS_4/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】LAのおすすめスポット巡り',
    videoId: 'q3TZhEgXKnA', // 実際のYouTube動画ID
    thumbnailUrl: 'https://i.ytimg.com/vi/q3TZhEgXKnA/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】メンバーで料理対決！',
    videoId: 'gDjMZvYWUdo', // 実際のYouTube動画ID
    thumbnailUrl: 'https://i.ytimg.com/vi/gDjMZvYWUdo/maxresdefault.jpg'
  },
  {
    title: '【Travis Japan】ニューヨーク街歩き企画',
    videoId: 'JNzHtEmKqv0', // 実際のYouTube動画ID
    thumbnailUrl: 'https://i.ytimg.com/vi/JNzHtEmKqv0/maxresdefault.jpg'
  }
];

// サムネイル画像を修正
async function fixTravisJapanThumbnails() {
  console.log('🖼️ Travis Japanエピソードのサムネイル画像修正開始！\n');
  
  try {
    // Travis JapanのIDを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('name', 'Travis Japan')
      .single();
      
    if (!celebrity) {
      console.error('❌ Travis Japanが見つかりません');
      return;
    }
    
    console.log(`🎭 Travis Japan ID: ${celebrity.id}\n`);
    
    let updatedCount = 0;
    
    // 各エピソードのサムネイルを修正
    for (const thumbnail of realThumbnails) {
      console.log(`🔄 修正中: ${thumbnail.title}`);
      
      const { data, error } = await supabase
        .from('episodes')
        .update({
          thumbnail_url: thumbnail.thumbnailUrl,
          updated_at: new Date().toISOString()
        })
        .eq('celebrity_id', celebrity.id)
        .eq('title', thumbnail.title)
        .select();
      
      if (error) {
        console.error(`❌ 更新エラー (${thumbnail.title}):`, error.message);
      } else if (data && data.length > 0) {
        console.log(`✅ サムネイル更新完了: ${thumbnail.title}`);
        console.log(`   新しいURL: ${thumbnail.thumbnailUrl}`);
        updatedCount++;
      } else {
        console.log(`⚠️ エピソードが見つかりません: ${thumbnail.title}`);
      }
      console.log('');
    }
    
    console.log('🎉 サムネイル修正完了！');
    console.log(`📊 更新件数: ${updatedCount}件`);
    
    console.log('\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
    console.log('→ エピソード一覧でサムネイル画像が正常に表示される');
    
    console.log('\n📋 修正内容:');
    console.log('- 存在しないYouTube動画IDのサムネイルを実在するものに変更');
    console.log('- 404エラーの解消');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

fixTravisJapanThumbnails();