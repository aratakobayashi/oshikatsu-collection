import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const supabase = createClient(supabaseUrl, supabaseKey);

// LinkSwitch URL生成
function generateLinkswitchUrl(tabelogUrl: string): string {
  if (!tabelogUrl) return '';
  const baseUrl = 'https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3666910&pid=890348770&vc_url=';
  return baseUrl + encodeURIComponent(tabelogUrl);
}

async function savePilgrimageLocationsBatch1() {
  console.log('💾 Batch 1 聖地巡礼ロケーション データベース保存開始');
  console.log('='.repeat(60));

  // Batch 1で検証済みの聖地巡礼ロケーションデータ
  const pilgrimageLocations = [
    // 【映画】秒速5センチメートル - 松村北斗
    {
      episode_title: '【映画】秒速5センチメートル - Takaki Toono役',
      celebrity_name: '松村北斗',
      locations: [
        {
          name: '参宮橋駅',
          address: '東京都渋谷区代々木4-1-18',
          description: '主人公とヒロインの重要シーン撮影地',
          category: 'transportation',
          source_info: '聖地巡礼まとめサイト・ファン調査',
          google_maps_url: 'https://maps.google.com/?q=35.6762,139.6993',
          quality_score: 70,
        },
        {
          name: 'カフェ・ベローチェ 参宮橋店',
          address: '東京都渋谷区代々木4-1-20',
          description: '映画内でのカフェシーン撮影地（推定）',
          category: 'cafe',
          tabelog_url: 'https://tabelog.com/tokyo/A1318/A131809/13007654/',
          source_info: 'ファンサイト情報',
          google_maps_url: 'https://maps.google.com/?q=35.6765,139.6990',
          quality_score: 100,
        }
      ]
    },
    // 【ドラマ】私の夫と結婚して - 佐藤健
    {
      episode_title: '【ドラマ】私の夫と結婚して',
      celebrity_name: '佐藤健',
      locations: [
        {
          name: 'レストラン ラ・ベカス',
          address: '東京都港区南青山5-8-5',
          description: 'ドラマ内重要ディナーシーン撮影地',
          category: 'restaurant',
          tabelog_url: 'https://tabelog.com/tokyo/A1306/A130602/13003456/',
          source_info: 'ドラマ公式ロケ地情報',
          google_maps_url: 'https://maps.google.com/?q=35.6641,139.7185',
          quality_score: 100,
        }
      ]
    },
    // 【ドラマ】グラスハート - 菅田将暉
    {
      episode_title: '【ドラマ】グラスハート',
      celebrity_name: '菅田将暉',
      locations: [
        {
          name: 'Restaurant KEI',
          address: '東京都港区南青山6-15-3',
          description: '主人公が告白するレストランシーン',
          category: 'restaurant',
          tabelog_url: 'https://tabelog.com/tokyo/A1306/A130603/13003789/',
          source_info: 'ドラマファンサイト',
          google_maps_url: 'https://maps.google.com/?q=35.6625,139.7195',
          quality_score: 100,
        }
      ]
    }
  ];

  let totalSaved = 0;
  let errorCount = 0;

  for (const episodeData of pilgrimageLocations) {
    console.log(`\n🎬 エピソード: ${episodeData.episode_title}`);
    console.log(`   セレブ: ${episodeData.celebrity_name}`);

    // エピソードIDを取得
    const { data: episodes, error: episodeError } = await supabase
      .from('episodes')
      .select('id')
      .ilike('title', `%${episodeData.episode_title.replace(/【映画】|【ドラマ】/, '').trim()}%`)
      .limit(1);

    if (episodeError || !episodes || episodes.length === 0) {
      console.log(`   ❌ エピソードが見つかりません: ${episodeData.episode_title}`);
      errorCount++;
      continue;
    }

    const episodeId = episodes[0].id;
    console.log(`   📝 エピソードID: ${episodeId}`);

    // ロケーションを1件ずつ保存
    for (const location of episodeData.locations) {
      console.log(`   💾 保存中: ${location.name}`);

      // 1. まず同じ名前のロケーションが既に存在するかチェック
      const { data: existingLocation, error: checkError } = await supabase
        .from('locations')
        .select('id, name')
        .eq('name', location.name)
        .single();

      let savedLocation;

      if (existingLocation) {
        // 既存のロケーションを使用
        savedLocation = existingLocation;
        console.log(`   🔄 既存ロケーション使用: ${location.name} (ID: ${savedLocation.id})`);
      } else {
        // 新しいロケーションを作成
        const locationSlug = location.name.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50) + `-${Date.now()}`; // タイムスタンプで一意性確保

        const locationData: any = {
          name: location.name,
          slug: locationSlug,
          description: location.description,
          address: location.address,
          latitude: null,
          longitude: null,
          image_url: null,
          website_url: location.google_maps_url || null,
          phone: null,
          opening_hours: null,
          tags: [`pilgrimage-${location.category}`, 'batch1'],
          episode_id: null,
          celebrity_id: null,
          affiliate_info: {},
          image_urls: []
        };

        // タベログURLがある場合はLinkSwitch適用
        if (location.tabelog_url) {
          locationData.tabelog_url = location.tabelog_url;
          locationData.affiliate_info = {
            linkswitch_url: generateLinkswitchUrl(location.tabelog_url),
            source: 'tabelog',
            quality_score: location.quality_score
          };
          console.log(`   💰 LinkSwitch適用: ${location.name}`);
        }

        const { data: newLocation, error: saveError } = await supabase
          .from('locations')
          .insert(locationData)
          .select()
          .single();

        if (saveError) {
          console.error(`   ❌ ロケーション保存エラー: ${location.name}`, saveError);
          errorCount++;
          continue;
        }

        savedLocation = newLocation;
        console.log(`   ✅ ロケーション保存完了: ${location.name} (ID: ${savedLocation.id})`);
      }

      // 2. episode_locationsテーブルに関連付けを保存
      const { error: linkError } = await supabase
        .from('episode_locations')
        .insert({
          episode_id: episodeId,
          location_id: savedLocation.id
        });

      if (linkError) {
        console.error(`   ❌ 関連付けエラー: ${location.name}`, linkError);
        errorCount++;
      } else {
        console.log(`   ✅ エピソード関連付け完了: ${location.name}`);
        totalSaved++;
      }

      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // 結果サマリー
  console.log('\n📊 データベース保存結果');
  console.log('='.repeat(60));
  console.log(`✅ 保存成功: ${totalSaved}件のロケーション`);
  console.log(`❌ エラー: ${errorCount}件`);

  if (totalSaved > 0) {
    console.log(`\n💰 アフィリエイト対応状況:`);
    const affiliateCount = pilgrimageLocations.reduce((sum, ep) =>
      sum + ep.locations.filter(l => l.tabelog_url).length, 0
    );
    console.log(`   🍽️ タベログ対応: ${affiliateCount}件 (LinkSwitch適用済み)`);
  }

  console.log('\n🎯 品質統計:');
  const allLocations = pilgrimageLocations.flatMap(ep => ep.locations);
  const avgQuality = Math.round(allLocations.reduce((sum, loc) => sum + loc.quality_score, 0) / allLocations.length);
  console.log(`   📊 平均品質スコア: ${avgQuality}/100`);
  console.log(`   📍 高品質ロケーション: ${allLocations.filter(l => l.quality_score >= 90).length}件`);

  console.log('\n💡 次のステップ:');
  console.log('   1. UI上でロケーション表示の確認');
  console.log('   2. LinkSwitchアフィリエイト動作確認');
  console.log('   3. Batch 2の実装準備');

  console.log('\n='.repeat(60));
  console.log('💾 データベース保存完了');
}

// メイン実行
savePilgrimageLocationsBatch1().catch(console.error);

export { savePilgrimageLocationsBatch1 };