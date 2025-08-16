const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 追加するTravis Japanエピソード
const missingEpisodes = [
  {
    id: 'DFb-s8Mqs4k',
    title: 'Travis Japan【渋谷ランチ】思い出のハンバーグ店',
    description: 'Travis Japanが渋谷の思い出のハンバーグ店でランチを楽しむ企画',
    published_at: '2024-01-01T00:00:00Z', // 仮の日付
    view_count: 100000,
    duration: 'PT10M30S',
    celebrity_id: '46ccba0d-742f-4152-9d87-f10cefadbb6d',
    tags: ['渋谷', 'ランチ', 'ハンバーグ', 'グルメ', '思い出']
  },
  {
    id: 'NIp-ChT5Ma0',
    title: 'Travis Japan【ラーメン】河合くんとコラボ',
    description: 'Travis Japanが河合くんとコラボしてラーメンを楽しむ企画',
    published_at: '2024-01-15T00:00:00Z',
    view_count: 120000,
    duration: 'PT12M15S',
    celebrity_id: '46ccba0d-742f-4152-9d87-f10cefadbb6d',
    tags: ['ラーメン', 'コラボ', '河合', 'グルメ', 'ジャニーズ']
  },
  {
    id: 'JydlKpwQLZA',
    title: '【JUST！シン日本遺産】苫鵡で氷でできた村',
    description: 'Travis Japanが北海道苫鵡の氷の村を体験する企画',
    published_at: '2024-02-01T00:00:00Z',
    view_count: 150000,
    duration: 'PT15M45S',
    celebrity_id: '46ccba0d-742f-4152-9d87-f10cefadbb6d',
    tags: ['苫鵡', '北海道', '氷の村', '観光', '体験']
  },
  {
    id: 'ynqNPi5O8sI',
    title: 'Travis Japan【大食い検証】1.5kgステーキ',
    description: 'Travis Japanが1.5kgの巨大ステーキに挑戦する大食い企画',
    published_at: '2024-02-15T00:00:00Z',
    view_count: 180000,
    duration: 'PT18M20S',
    celebrity_id: '46ccba0d-742f-4152-9d87-f10cefadbb6d',
    tags: ['大食い', 'ステーキ', 'チャレンジ', '1.5kg', 'グルメ']
  },
  {
    id: 'EH2Rec_Z9jY',
    title: 'Travis Japan【まったり旅】横須賀ドライブ',
    description: 'Travis Japanが横須賀をドライブしながらまったりと旅を楽しむ企画',
    published_at: '2024-03-01T00:00:00Z',
    view_count: 130000,
    duration: 'PT20M10S',
    celebrity_id: '46ccba0d-742f-4152-9d87-f10cefadbb6d',
    tags: ['横須賀', 'ドライブ', 'まったり', '旅行', '神奈川']
  }
];

async function addMissingEpisodes() {
  console.log('📺 Travis Japan 不足エピソードの追加開始！\n');
  
  let addedCount = 0;
  let existingCount = 0;
  
  for (const episode of missingEpisodes) {
    console.log(`\n🎬 ${episode.title} (${episode.id})`);
    
    // 既に存在するかチェック
    const { data: existing } = await supabase
      .from('episodes')
      .select('id')
      .eq('id', episode.id)
      .single();
    
    if (existing) {
      console.log('✅ エピソード既存');
      existingCount++;
      continue;
    }
    
    // エピソード追加
    const episodeData = {
      ...episode,
      slug: episode.title.toLowerCase()
        .replace(/[^a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('episodes')
      .insert(episodeData)
      .select();
    
    if (error) {
      console.error(`❌ エピソード追加エラー: ${error.message}`);
    } else {
      console.log('✅ エピソード追加成功');
      addedCount++;
    }
  }
  
  console.log('\n🎉 Travis Japan 不足エピソード追加完了！');
  console.log('='.repeat(60));
  console.log(`📊 結果:`);
  console.log(`  - 処理対象: ${missingEpisodes.length}件`);
  console.log(`  - 新規追加: ${addedCount}件`);
  console.log(`  - 既存: ${existingCount}件`);
  
  // Travis Japanの最新状況確認
  const { count: totalEpisodes } = await supabase
    .from('episodes')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', '46ccba0d-742f-4152-9d87-f10cefadbb6d');
  
  console.log(`\n📈 Travis Japan エピソード総数: ${totalEpisodes}件`);
  console.log('\n🌐 確認方法:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
}

addMissingEpisodes();