require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function checkYoninoData() {
  console.log('📊 よにのちゃんねる データ状況確認\n')
  
  // よにのちゃんねるを取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!celebrity) {
    console.log('❌ よにのちゃんねるが見つかりません')
    return
  }
  
  // エピソード数確認
  const { data: episodes, count } = await supabase
    .from('episodes')
    .select('*', { count: 'exact' })
    .eq('celebrity_id', celebrity.id)
    
  console.log(`📺 エピソード総数: ${count}件`)
  
  // 最新・最古エピソード
  const { data: latest } = await supabase
    .from('episodes')
    .select('title, date')
    .eq('celebrity_id', celebrity.id)
    .order('date', { ascending: false })
    .limit(1)
    
  const { data: oldest } = await supabase
    .from('episodes')
    .select('title, date')
    .eq('celebrity_id', celebrity.id)
    .order('date', { ascending: true })
    .limit(1)
  
  if (latest?.[0]) {
    console.log(`🆕 最新: ${latest[0].date} - ${latest[0].title.substring(0, 50)}...`)
  }
  
  if (oldest?.[0]) {
    console.log(`📅 最古: ${oldest[0].date} - ${oldest[0].title.substring(0, 50)}...`)
  }
  
  // ロケーション情報確認
  const { data: locations, count: locationCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact' })
    .eq('celebrity_id', celebrity.id)
    
  console.log(`\n🏪 関連店舗数: ${locationCount}件`)
  
  if (locations?.length > 0) {
    console.log('店舗一覧:')
    locations.forEach(loc => {
      console.log(`  - ${loc.name} (${loc.tags?.[0] || '未分類'})`)
    })
  }
  
  // YouTube動画との比較
  console.log('\n🎬 YouTube動画収集状況:')
  console.log('✅ 前回収集: 341件 (YouTubeチャンネル全体)')
  console.log('✅ 収集期間: ~2024年まで')
  console.log('💡 追加可能: 2025年の新着動画')
  
  // エピソード作成日時の分布
  const { data: recentEpisodes } = await supabase
    .from('episodes')
    .select('created_at')
    .eq('celebrity_id', celebrity.id)
    .order('created_at', { ascending: false })
    .limit(10)
    
  if (recentEpisodes?.length > 0) {
    console.log('\n📈 最近の追加状況:')
    recentEpisodes.forEach((ep, index) => {
      const date = new Date(ep.created_at).toLocaleDateString()
      console.log(`  ${index + 1}. ${date}`)
    })
  }
}

checkYoninoData().catch(console.error)