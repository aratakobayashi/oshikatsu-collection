// 🔍 エピソードのサムネイル調査スクリプト
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
)

async function investigateEpisodeThumbnails() {
  console.log('🔍 Episode Thumbnail Investigation')
  console.log('=================================')
  
  try {
    // 1. 全エピソード数確認
    const { count: totalCount } = await supabase
      .from('episodes')
      .select('id', { count: 'exact', head: true })
    
    console.log(`📺 Total episodes: ${totalCount}`)
    
    // 2. thumbnail_urlがあるエピソード数確認
    const { count: withThumbnails } = await supabase
      .from('episodes')
      .select('id', { count: 'exact', head: true })
      .not('thumbnail_url', 'is', null)
    
    console.log(`🖼️ Episodes with thumbnails: ${withThumbnails}`)
    console.log(`📊 Percentage: ${withThumbnails ? Math.round((withThumbnails/totalCount) * 100) : 0}%`)
    
    // 3. HomeページのProgressiveDataと同じクエリを実行
    const { data: homeEpisodes, error } = await supabase
      .from('episodes')
      .select('id, title, description, thumbnail_url, celebrity:celebrities(name, slug)')
      .order('created_at', { ascending: false })
      .limit(4)
    
    if (error) {
      console.error('❌ Query Error:', error)
      return
    }
    
    console.log('\n🏠 Home Page Episodes (same query as useProgressiveHomeData):')
    console.log('============================================================')
    
    homeEpisodes.forEach((episode, index) => {
      console.log(`\n${index + 1}. ${episode.title}`)
      console.log(`   ID: ${episode.id}`)
      console.log(`   thumbnail_url: ${episode.thumbnail_url || 'NULL'}`)
      console.log(`   Celebrity: ${episode.celebrity?.name || 'No celebrity'}`)
      
      if (episode.thumbnail_url) {
        console.log(`   ✅ HAS THUMBNAIL`)
      } else {
        console.log(`   ❌ NO THUMBNAIL`)
      }
    })
    
    // 4. thumbnail_urlがあるエピソードの例を表示
    const { data: examplesWithThumbnails } = await supabase
      .from('episodes')
      .select('id, title, thumbnail_url')
      .not('thumbnail_url', 'is', null)
      .limit(3)
    
    if (examplesWithThumbnails && examplesWithThumbnails.length > 0) {
      console.log('\n🖼️ Examples with thumbnails:')
      console.log('============================')
      examplesWithThumbnails.forEach(episode => {
        console.log(`- ${episode.title}`)
        console.log(`  URL: ${episode.thumbnail_url}`)
      })
    }
    
  } catch (error) {
    console.error('💥 Error:', error)
  }
}

investigateEpisodeThumbnails()