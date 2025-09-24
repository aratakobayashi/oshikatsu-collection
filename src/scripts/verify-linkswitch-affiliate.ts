import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLinkswitchAffiliate() {
  console.log('🔗 LinkSwitch アフィリエイト収益化確認開始');
  console.log('='.repeat(60));

  // Batch 1で追加したタベログ対応ロケーションを取得
  const { data: locations, error } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      tabelog_url,
      affiliate_info,
      tags,
      episode_locations (
        episode_id,
        episodes (
          title
        )
      )
    `)
    .contains('tags', ['batch1'])
    .not('tabelog_url', 'is', null);

  if (error || !locations) {
    console.error('❌ ロケーション取得エラー:', error);
    return;
  }

  console.log(`📊 LinkSwitch対応ロケーション: ${locations.length}件`);
  console.log('');

  const results = [];

  for (let i = 0; i < locations.length; i++) {
    const location = locations[i];
    console.log(`🍽️ ${i + 1}. ${location.name}`);

    // 関連エピソード情報
    const episodeInfo = (location.episode_locations as any)[0];
    if (episodeInfo && episodeInfo.episodes) {
      console.log(`   📺 エピソード: ${episodeInfo.episodes.title}`);
    }

    // タベログURL検証
    console.log(`   🏪 タベログURL: ${location.tabelog_url}`);

    // LinkSwitchアフィリエイトURL検証
    const affiliateInfo = location.affiliate_info as any;
    if (affiliateInfo && affiliateInfo.linkswitch_url) {
      console.log(`   💰 LinkSwitchURL: ${affiliateInfo.linkswitch_url}`);

      // LinkSwitchURLの構造確認
      const linkswitchUrl = affiliateInfo.linkswitch_url;
      const hasCorrectBase = linkswitchUrl.includes('ck.jp.ap.valuecommerce.com');
      const hasCorrectSid = linkswitchUrl.includes('sid=3666910');
      const hasCorrectPid = linkswitchUrl.includes('pid=890348770');
      const hasEncodedUrl = linkswitchUrl.includes(encodeURIComponent(location.tabelog_url));

      console.log(`   ✅ 基本URL: ${hasCorrectBase ? '正常' : 'エラー'}`);
      console.log(`   ✅ サイトID: ${hasCorrectSid ? '正常' : 'エラー'}`);
      console.log(`   ✅ 広告枠ID: ${hasCorrectPid ? '正常' : 'エラー'}`);
      console.log(`   ✅ 元URL埋込: ${hasEncodedUrl ? '正常' : 'エラー'}`);

      const allValid = hasCorrectBase && hasCorrectSid && hasCorrectPid && hasEncodedUrl;

      results.push({
        name: location.name,
        tabelog_url: location.tabelog_url,
        linkswitch_url: linkswitchUrl,
        valid: allValid,
        quality_score: affiliateInfo.quality_score || 0
      });

      console.log(`   🎯 収益化対応: ${allValid ? '✅ 完全対応' : '❌ 要修正'}`);

    } else {
      console.log(`   ❌ LinkSwitchURL未設定`);
      results.push({
        name: location.name,
        tabelog_url: location.tabelog_url,
        linkswitch_url: null,
        valid: false,
        quality_score: 0
      });
    }

    console.log('   ' + '-'.repeat(50));
  }

  // 収益化確認サマリー
  console.log('\n📈 収益化確認サマリー');
  console.log('='.repeat(60));

  const validCount = results.filter(r => r.valid).length;
  const totalRevenue = results.filter(r => r.valid).length;

  console.log(`✅ 完全対応: ${validCount}/${locations.length}件 (${Math.round(validCount/locations.length*100)}%)`);
  console.log(`💰 収益見込み: ${totalRevenue}件のタベログ店舗`);

  if (validCount > 0) {
    console.log('\n🎯 収益化成功事例:');
    console.log('='.repeat(60));

    results.filter(r => r.valid).forEach((result, index) => {
      console.log(`${index + 1}. ${result.name}`);
      console.log(`   品質スコア: ${result.quality_score}/100`);
      console.log(`   タベログ: ${result.tabelog_url}`);
      console.log(`   アフィリエイト: 対応済み`);
      console.log('');
    });
  }

  // 推奨アクション
  console.log('💡 推奨アクション');
  console.log('='.repeat(60));

  if (validCount === locations.length) {
    console.log('🎉 全てのロケーションで収益化対応完了！');
    console.log('   1. UI上でのLinkSwitchリンク動作確認');
    console.log('   2. ValueCommerce管理画面での成果確認');
    console.log('   3. Batch 2実装の準備');
  } else {
    console.log('⚠️ 一部ロケーションで収益化対応が不完全');
    console.log('   1. LinkSwitchURL生成ロジックの確認');
    console.log('   2. 未対応ロケーションの修正');
    console.log('   3. 修正後の再確認');
  }

  console.log('\n='.repeat(60));
  console.log('🔗 LinkSwitch収益化確認完了');

  return results;
}

// メイン実行
verifyLinkswitchAffiliate().catch(console.error);

export { verifyLinkswitchAffiliate };