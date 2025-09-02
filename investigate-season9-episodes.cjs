const SUPABASE_URL = 'https://awaarykghpylggygkiyp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'

async function investigateSeason9Episodes() {
  console.log('🔍 Season9エピソード調査開始...\n')
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
  
  try {
    // 1. 全エピソードを取得してSeason9があるか確認
    console.log('📺 全エピソードの調査...')
    const allEpisodesResponse = await fetch(`${SUPABASE_URL}/rest/v1/episodes?select=*&order=date.desc`, { headers })
    const allEpisodes = await allEpisodesResponse.json()
    console.log(`   全エピソード数: ${allEpisodes.length}`)
    
    // Season9を含むタイトルを検索
    const season9Episodes = allEpisodes.filter(episode => 
      episode.title.toLowerCase().includes('season9') || 
      episode.title.toLowerCase().includes('season 9') ||
      episode.title.includes('シーズン9') ||
      episode.title.includes('第9シーズン')
    )
    
    console.log(`\n📈 Season9エピソード: ${season9Episodes.length}件`)
    season9Episodes.forEach((episode, index) => {
      console.log(`   ${index + 1}. ${episode.title}`)
      console.log(`      ID: ${episode.id}`)
      console.log(`      日付: ${episode.date}`)
      console.log(`      説明: ${episode.description || 'なし'}`)
      console.log('')
    })
    
    // 2. Season7-8のパターンを分析
    console.log('\n🔍 Season7-8のパターン分析...')
    const season7Episodes = allEpisodes.filter(episode => 
      episode.title.toLowerCase().includes('season7') || 
      episode.title.toLowerCase().includes('season 7')
    )
    const season8Episodes = allEpisodes.filter(episode => 
      episode.title.toLowerCase().includes('season8') || 
      episode.title.toLowerCase().includes('season 8')
    )
    
    console.log(`   Season7エピソード: ${season7Episodes.length}件`)
    console.log(`   Season8エピソード: ${season8Episodes.length}件`)
    
    // Season7のサンプルを表示
    if (season7Episodes.length > 0) {
      console.log('\n📊 Season7エピソードサンプル:')
      season7Episodes.slice(0, 3).forEach((episode, index) => {
        console.log(`   ${index + 1}. ${episode.title}`)
        console.log(`      ID: ${episode.id}`)
        console.log(`      日付: ${episode.date}`)
      })
    }
    
    // Season8のサンプルを表示
    if (season8Episodes.length > 0) {
      console.log('\n📊 Season8エピソードサンプル:')
      season8Episodes.slice(0, 3).forEach((episode, index) => {
        console.log(`   ${index + 1}. ${episode.title}`)
        console.log(`      ID: ${episode.id}`)
        console.log(`      日付: ${episode.date}`)
      })
    }
    
    // 3. 最新エピソードをチェック（Season9の可能性）
    console.log('\n📅 最新エピソード（直近20件）:')
    const recentEpisodes = allEpisodes.slice(0, 20)
    recentEpisodes.forEach((episode, index) => {
      console.log(`   ${index + 1}. ${episode.title}`)
      console.log(`      日付: ${episode.date}`)
      console.log(`      ID: ${episode.id}`)
      console.log('')
    })
    
    // 4. 孤独のグルメ関連エピソードの分析
    console.log('\n🍜 孤独のグルメ関連エピソード:')
    const kodokuEpisodes = allEpisodes.filter(episode => 
      episode.title.includes('孤独のグルメ') ||
      episode.title.includes('孤独') ||
      episode.title.toLowerCase().includes('kodoku')
    )
    
    console.log(`   孤独のグルメ関連: ${kodokuEpisodes.length}件`)
    kodokuEpisodes.slice(0, 10).forEach((episode, index) => {
      console.log(`   ${index + 1}. ${episode.title}`)
    })
    
    // 5. Celebrity情報を確認
    console.log('\n👤 Celebrity情報確認...')
    const celebritiesResponse = await fetch(`${SUPABASE_URL}/rest/v1/celebrities?select=*`, { headers })
    const celebrities = await celebritiesResponse.json()
    console.log(`   Celebrity数: ${celebrities.length}`)
    
    celebrities.forEach(celebrity => {
      console.log(`   - ${celebrity.name} (${celebrity.slug})`)
      console.log(`     ID: ${celebrity.id}`)
    })
    
    // 6. Season9作成の提案
    if (season9Episodes.length === 0) {
      console.log('\n💡 Season9エピソード作成提案:')
      console.log('   Season9のエピソードが見つかりませんでした。')
      console.log('   以下の手順でSeason9エピソードを作成することをお勧めします:')
      console.log('')
      console.log('   1. 孤独のグルメSeason9の実際のエピソード情報を収集')
      console.log('   2. Season7-8と同じフォーマットでエピソードデータを作成')
      console.log('   3. 各エピソードに対応するロケーション情報を追加')
      console.log('   4. Episode-Locationリレーションを構築')
      console.log('')
      
      // Season7-8のタイトル形式を分析して、Season9の推奨フォーマットを提案
      if (season8Episodes.length > 0) {
        const sampleSeason8 = season8Episodes[0]
        console.log('   📝 推奨タイトルフォーマット (Season8基準):')
        console.log(`   例: "${sampleSeason8.title.replace('Season8', 'Season9')}"`)
        console.log('')
      }
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

investigateSeason9Episodes()