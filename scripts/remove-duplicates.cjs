// Node 18+ has built-in fetch

const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

async function removeDuplicates() {
  console.log('🧹 重複エピソードの除去を開始...\n')

  try {
    // 1. 全エピソードを取得
    const response = await fetch(`${SUPABASE_URL}/rest/v1/episodes?select=*&order=created_at.asc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })

    const episodes = await response.json()
    console.log(`📊 現在のエピソード数: ${episodes.length}件`)

    // 2. 重複を特定 (titleベースで判定)
    const seen = new Set()
    const toDelete = []
    const uniqueEpisodes = []

    for (const episode of episodes) {
      const key = episode.title
      
      if (seen.has(key)) {
        // 重複発見
        toDelete.push(episode.id)
        console.log(`   ❌ 重複: "${episode.title.substring(0, 50)}..."`)
      } else {
        // ユニーク
        seen.add(key)
        uniqueEpisodes.push(episode)
      }
    }

    console.log(`\n📋 分析結果:`)
    console.log(`   ✅ ユニークエピソード: ${uniqueEpisodes.size || uniqueEpisodes.length}件`)
    console.log(`   ❌ 重複エピソード: ${toDelete.length}件\n`)

    // 3. 重複を削除
    if (toDelete.length > 0) {
      console.log('🗑️  重複データを削除中...')
      
      // バッチで削除（10件ずつ）
      for (let i = 0; i < toDelete.length; i += 10) {
        const batch = toDelete.slice(i, i + 10)
        
        const deleteResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/episodes?id=in.(${batch.join(',')})`,
          {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (deleteResponse.ok) {
          console.log(`   ✅ ${batch.length}件削除`)
        } else {
          console.log(`   ⚠️  削除失敗: ${await deleteResponse.text()}`)
        }
      }

      console.log(`\n✨ ${toDelete.length}件の重複を削除しました！`)
    } else {
      console.log('✨ 重複データはありませんでした！')
    }

    // 4. 最終確認
    const finalResponse = await fetch(`${SUPABASE_URL}/rest/v1/episodes?select=id,title&order=view_count.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })

    const finalEpisodes = await finalResponse.json()
    console.log(`\n🎯 クリーンアップ後のエピソード数: ${finalEpisodes.length}件`)
    
    if (finalEpisodes.length > 0) {
      console.log('\n📋 TOP 5 エピソード:')
      finalEpisodes.slice(0, 5).forEach((ep, index) => {
        console.log(`   ${index + 1}. ${ep.title.substring(0, 60)}...`)
      })
    }

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

// 実行
removeDuplicates()
  .then(() => {
    console.log('\n🎉 重複除去完了！')
    console.log('🌐 確認URL: https://develop--oshikatsu-collection.netlify.app')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ エラー:', error)
    process.exit(1)
  })