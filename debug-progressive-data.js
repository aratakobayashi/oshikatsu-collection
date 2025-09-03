// 🔍 ProgressiveContentの実際のデータフローを確認
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
)

async function debugProgressiveData() {
  console.log('🔍 Progressive Data Flow Debug')
  console.log('============================')
  
  try {
    // 1. useProgressiveHomeDataと全く同じクエリを実行
    console.log('\n📺 Progressive Episodes Query (HomeBalanced.tsx line 242):')
    console.log('==========================================================')
    
    const episodeQuery = supabase
      .from('episodes')
      .select('id, title, description, thumbnail_url, celebrity:celebrities(name, slug)')
      .order('created_at', { ascending: false })
      .limit(4)
    
    const { data: progressiveEpisodes, error } = await episodeQuery
    
    if (error) {
      console.error('❌ Progressive Episodes Error:', error)
      return
    }
    
    console.log(`✅ データ取得成功: ${progressiveEpisodes?.length || 0}件`)
    
    progressiveEpisodes?.forEach((episode, index) => {
      console.log(`\n${index + 1}. ${episode.title}`)
      console.log(`   📷 thumbnail_url: ${episode.thumbnail_url || 'NULL ❌'}`)
      console.log(`   🎭 celebrity: ${episode.celebrity?.name || 'No celebrity'}`)
      console.log(`   💾 データ構造チェック:`)
      console.log(`      - id: ${typeof episode.id}`)
      console.log(`      - title: ${typeof episode.title}`)
      console.log(`      - thumbnail_url: ${typeof episode.thumbnail_url}`)
      
      if (episode.thumbnail_url) {
        console.log(`   ✅ サムネイル URL有効`)
        
        // URL の有効性を簡易チェック
        if (episode.thumbnail_url.startsWith('https://')) {
          console.log(`   ✅ HTTPS URL`)
        } else {
          console.log(`   ⚠️ 非HTTPS URL: ${episode.thumbnail_url}`)
        }
        
        if (episode.thumbnail_url.includes('image.tmdb.org') || 
            episode.thumbnail_url.includes('i.ytimg.com') ||
            episode.thumbnail_url.includes('img.youtube.com')) {
          console.log(`   ✅ 認識されたサムネイルプロバイダー`)
        } else {
          console.log(`   ⚠️ 不明なサムネイルプロバイダー`)
        }
      } else {
        console.log(`   ❌ サムネイル URL なし`)
      }
    })
    
    // 2. HomeBalanced.tsxのレンダリングロジックをシミュレート
    console.log('\n🖼️ Rendering Logic Simulation:')
    console.log('===============================')
    
    const episodesWithThumbnails = progressiveEpisodes?.filter(ep => ep.thumbnail_url) || []
    const episodesWithoutThumbnails = progressiveEpisodes?.filter(ep => !ep.thumbnail_url) || []
    
    console.log(`✅ サムネイル有り: ${episodesWithThumbnails.length}件`)
    console.log(`❌ サムネイル無し: ${episodesWithoutThumbnails.length}件`)
    
    if (episodesWithThumbnails.length === 0) {
      console.log('🚨 CRITICAL: すべてのエピソードがサムネイル無し！')
      console.log('   → img要素は表示されないはず')
    } else {
      console.log('✅ 少なくとも一部のエピソードにサムネイル有り')
      console.log('   → img要素が表示されるはず')
    }
    
    // 3. HomeBalanced.tsx の条件分岐をシミュレート
    console.log('\n🔄 Component Rendering Simulation:')
    console.log('===================================')
    
    progressiveEpisodes?.slice(0, 4).forEach((episode, index) => {
      console.log(`\n${index + 1}. ${episode.title}`)
      
      // HomeBalanced.tsx: {episode.thumbnail_url ? ( の部分
      if (episode.thumbnail_url) {
        console.log('   ✅ 条件: episode.thumbnail_url は truthy')
        console.log('   → <img> 要素が描画されるはず')
        console.log(`   → src="${episode.thumbnail_url}"`)
        console.log(`   → alt="${episode.title}"`)
      } else {
        console.log('   ❌ 条件: episode.thumbnail_url は falsy')
        console.log('   → <img> 要素はスキップ')
        console.log('   → fallback Play アイコンのみ表示')
      }
    })
    
  } catch (error) {
    console.error('💥 Debug Error:', error)
  }
}

debugProgressiveData().then(() => {
  console.log('\n🏁 Progressive Data Debug Complete')
  process.exit(0)
}).catch(error => {
  console.error('❌ Debug Failed:', error)
  process.exit(1)
})