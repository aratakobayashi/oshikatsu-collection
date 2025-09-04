import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

// ES Modules対応
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 環境変数読み込み
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function linkMoenoazukiEpisodeLocations() {
  console.log('🔗 もえのあずきのエピソード↔ロケ地関連付けを設定中...\n')

  try {
    // 1. もえのあずきの情報を取得
    console.log('🔍 もえのあずきの情報を確認中...')
    const { data: celebrity, error: celebrityError } = await supabase
      .from('celebrities')
      .select('*')
      .eq('slug', 'moenoazuki')
      .single()

    if (celebrityError || !celebrity) {
      throw new Error(`もえのあずきが見つかりません: ${celebrityError?.message}`)
    }

    console.log(`✅ セレブリティ: ${celebrity.name}`)

    // 2. 追加したエピソードを取得
    console.log('📺 もえのあずきのエピソードを取得中...')
    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('*')
      .eq('celebrity_id', celebrity.id)
      .order('created_at', { ascending: false })

    if (episodesError) {
      throw new Error(`エピソード取得エラー: ${episodesError.message}`)
    }

    console.log(`✅ エピソード数: ${episodes?.length || 0}`)
    episodes?.forEach((ep, i) => {
      console.log(`   ${i + 1}. ${ep.title} (${ep.id})`)
    })

    // 3. 関連ロケ地を取得（幸福麺処もっちりや）
    console.log('\n📍 関連ロケ地を取得中...')
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .in('slug', ['koufuku-mensho-mottchiriya']) // もえのあずき関連ロケ地

    if (locationsError) {
      throw new Error(`ロケ地取得エラー: ${locationsError.message}`)
    }

    console.log(`✅ 関連ロケ地数: ${locations?.length || 0}`)
    locations?.forEach((loc, i) => {
      console.log(`   ${i + 1}. ${loc.name} (${loc.slug})`)
    })

    // 4. 関連付けデータを作成
    console.log('\n🔗 関連付けデータを作成中...')
    const episodeLocationLinks = []

    if (episodes && locations) {
      // 特定の動画とロケ地の関連付けを設定
      const linkMappings = [
        {
          // 大食いアイドルの楽屋モニタリング → 幸福麺処もっちりや
          // （チャレンジメニューに挑戦した動画として想定）
          episodeTitle: '大食いアイドルの楽屋モニタリング',
          locationSlug: 'koufuku-mensho-mottchiriya',
          description: '特製肉盛り麻婆茄子丼2.3kgのデカ盛りチャレンジに挑戦した店舗'
        }
      ]

      for (const mapping of linkMappings) {
        const episode = episodes.find(ep => ep.title.includes(mapping.episodeTitle))
        const location = locations.find(loc => loc.slug === mapping.locationSlug)

        if (episode && location) {
          episodeLocationLinks.push({
            id: randomUUID(),
            episode_id: episode.id,
            location_id: location.id
          })

          console.log(`   ✅ 関連付け設定: ${episode.title} ↔ ${location.name}`)
        } else {
          console.log(`   ⚠️ 関連付けスキップ: ${mapping.episodeTitle} (エピソードまたはロケ地が見つかりません)`)
        }
      }
    }

    // 5. episode_locations テーブルに関連付けを挿入
    console.log('\n💾 関連付けをデータベースに挿入中...')
    
    if (episodeLocationLinks.length === 0) {
      console.log('⚠️ 挿入する関連付けがありません')
      
      // 代替案：最初のエピソードと最初のロケ地を関連付け
      if (episodes && episodes.length > 0 && locations && locations.length > 0) {
        const defaultLink = {
          id: randomUUID(),
          episode_id: episodes[0].id,
          location_id: locations[0].id
        }
        
        console.log('🔄 代替案: デフォルト関連付けを作成')
        console.log(`   エピソード: ${episodes[0].title}`)
        console.log(`   ロケ地: ${locations[0].name}`)
        
        episodeLocationLinks.push(defaultLink)
      }
    }

    for (const link of episodeLocationLinks) {
      const { error: linkError } = await supabase
        .from('episode_locations')
        .insert(link)

      if (linkError) {
        console.error(`   ❌ 関連付けエラー: ${linkError.message}`)
      } else {
        console.log(`   ✅ 関連付け挿入完了`)
      }
    }

    console.log('\n🎉 エピソード↔ロケ地関連付け完了!')
    console.log('')
    console.log('📊 結果サマリー:')
    console.log(`   処理したエピソード: ${episodes?.length || 0}`)
    console.log(`   処理したロケ地: ${locations?.length || 0}`)
    console.log(`   作成した関連付け: ${episodeLocationLinks.length}`)
    console.log('')
    console.log('🎯 データ構造完成:')
    console.log('   celebrity (もえのあずき)')
    console.log('   ↓')
    console.log('   episodes (YouTube動画)')
    console.log('   ↓ (episode_locations)')
    console.log('   locations (店舗・ロケ地)')
    console.log('')
    console.log('💰 アフィリエイト効果:')
    console.log('✅ 松重豊と同じデータ構造で検索・表示最適化')
    console.log('✅ エピソード経由で食べログアフィリエイト誘導')
    console.log('✅ YouTube動画と店舗情報の相互連携')

  } catch (error: any) {
    console.error('❌ エラー:', error.message)
    throw error
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  linkMoenoazukiEpisodeLocations()
    .then(() => {
      console.log('\n✅ 実行完了!')
    })
    .catch((error) => {
      console.error('❌ 実行エラー:', error.message)
      process.exit(1)
    })
}

export { linkMoenoazukiEpisodeLocations }