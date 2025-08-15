import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkSpecificEpisodes() {
  console.log('🔍 特定のエピソードを確認中...\n')
  
  // ユーザーが報告した2つのID
  const ids = [
    '7b98f022368ab29d1c36a39f2fc644a4',
    'f6fbdaf782086799e7e17afd6f9d14b7'
  ]
  
  for (const id of ids) {
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code === 'PGRST116') {
      console.log(`✅ ID: ${id}`)
      console.log('   状態: 削除済み\n')
    } else if (data) {
      console.log(`❌ ID: ${id}`)
      console.log(`   タイトル: ${data.title}`)
      console.log(`   動画URL: ${data.video_url}`)
      console.log(`   作成日: ${data.created_at}`)
      console.log('   状態: まだ存在している\n')
    }
  }
  
  // ブラウザでアクセスされているURLから推測
  console.log('📺 URLパターンで検索...')
  
  // よにのちゃんねるのエピソードをすべて取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (celebrity) {
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title, video_url')
      .eq('celebrity_id', celebrity.id)
      .order('created_at', { ascending: false })
    
    console.log(`\nよにのちゃんねるの全エピソード: ${episodes?.length || 0}件`)
    
    // ショートっぽいタイトルを探す
    const suspiciousEpisodes = episodes?.filter(ep => {
      const title = ep.title.toLowerCase()
      return title.includes('short') || 
             title.includes('ショート') ||
             title.length < 15 ||
             title.includes('#shorts')
    })
    
    if (suspiciousEpisodes?.length) {
      console.log('\n疑わしいエピソード:')
      suspiciousEpisodes.forEach(ep => {
        console.log(`  ID: ${ep.id}`)
        console.log(`  タイトル: ${ep.title}`)
        console.log(`  URL: ${ep.video_url}\n`)
      })
    }
  }
}

checkSpecificEpisodes().catch(console.error)