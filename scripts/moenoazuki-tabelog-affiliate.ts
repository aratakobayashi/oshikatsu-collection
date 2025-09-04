import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// ES Modules対応
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 環境変数読み込み
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

// もえのあずき特定店舗の食べログアフィリエイト情報
const MOENOAZUKI_RESTAURANTS = [
  {
    name: '一蘭ラーメン',
    episode_id: 'pm5IS8Whr5k',
    episode_title: '一蘭ラーメン替玉チャレンジ！！',
    tabelog_urls: [
      'https://tabelog.com/tokyo/A1305/A130501/13019994/', // 池袋店
      'https://tabelog.com/tokyo/A1301/A130103/13247284/', // 新橋店
      'https://tabelog.com/tokyo/A1311/A131102/13187455/', // 浅草店
      'https://tabelog.com/tokyo/A1303/A130301/13001762/'  // 渋谷店
    ],
    priority_location: '池袋店',
    confidence: 'high'
  },
  {
    name: '味仙',
    episode_id: 'FoGzMynYBnI', 
    episode_title: '味仙で激辛ラーメン大食いチャレンジ♡',
    tabelog_urls: [
      'https://tabelog.com/aichi/A2301/A230101/23058422/', // JR名古屋駅店
      'https://tabelog.com/aichi/A2301/A230103/23000017/'  // 本店候補
    ],
    priority_location: 'JR名古屋駅店',
    confidence: 'high'
  },
  {
    name: '赤から',
    episode_id: 'Fj6rao5WIMc',
    episode_title: '【大食い】赤から食べ放題&飲み放題☆10辛も挑戦☆食後のおなか大公開【もえあず】',
    tabelog_urls: [
      'https://tabelog.com/tokyo/A1303/A130301/13025933/', // 渋谷店
      'https://tabelog.com/tokyo/A1304/A130401/13175968/', // 新宿東口店候補
      'https://tabelog.com/tokyo/A1311/A131101/13186420/'  // 浅草店候補
    ],
    priority_location: '渋谷店',
    confidence: 'high'  
  }
]

// LinkSwitchアフィリエイトURL変換
function convertToLinkSwitchUrl(originalUrl: string): string {
  // LinkSwitchのURL形式: https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=XXXXX&pid=XXXXX&vc_url=エンコードされた元URL
  const encodedUrl = encodeURIComponent(originalUrl)
  const linkSwitchUrl = `https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3634676&pid=890293489&vc_url=${encodedUrl}`
  return linkSwitchUrl
}

// スラッグ生成関数
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 特殊文字を除去
    .replace(/\s+/g, '-')     // スペースをハイフンに
    .replace(/--+/g, '-')     // 連続ハイフンを1つに
    .trim()
}

async function setupMoenoazukiTabelogAffiliate() {
  console.log('🍎 もえのあずき食べログアフィリエイトリンク設定開始...\n')

  try {
    // 1. もえのあずきセレブリティ確認
    console.log('🔍 もえのあずきセレブリティ確認中...')
    const { data: celebrity, error: celebrityError } = await supabase
      .from('celebrities')
      .select('*')
      .eq('slug', 'moenoazuki')
      .single()

    if (celebrityError || !celebrity) {
      throw new Error(`もえのあずきが見つかりません: ${celebrityError?.message}`)
    }

    console.log(`✅ セレブリティ確認: ${celebrity.name}`)

    // 2. 各店舗について処理
    for (const restaurant of MOENOAZUKI_RESTAURANTS) {
      console.log(`\n🏪 処理中: ${restaurant.name}`)
      console.log(`   エピソード: ${restaurant.episode_title}`)
      console.log(`   優先店舗: ${restaurant.priority_location}`)

      // 2-1. エピソード確認
      const { data: episode, error: episodeError } = await supabase
        .from('episodes')
        .select('*')
        .eq('id', restaurant.episode_id)
        .single()

      if (episodeError || !episode) {
        console.log(`   ⚠️ エピソード未発見: ${restaurant.episode_id}`)
        continue
      }

      // 2-2. メインロケーション作成/確認
      const locationName = `${restaurant.name} ${restaurant.priority_location}`
      const locationData = {
        name: locationName,
        slug: generateSlug(locationName),
        address: '', // 住所は手動で後から追加
        description: `もえのあずきが「${restaurant.episode_title}」で訪問した${restaurant.name}`,
        tabelog_url: restaurant.tabelog_urls[0], // 優先店舗のURL
        affiliate_info: {
          provider: 'linkswitch',
          linkswitch_enabled: true,
          original_url: restaurant.tabelog_urls[0],
          affiliate_url: convertToLinkSwitchUrl(restaurant.tabelog_urls[0]),
          confidence: restaurant.confidence,
          generated_at: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 2-3. ロケーション挿入
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .insert(locationData)
        .select()
        .single()

      if (locationError) {
        if (locationError.code === '23505') {
          console.log(`   ⚠️ 既存ロケーション: ${restaurant.name}`)
          
          // 既存ロケーション取得してアフィリエイト更新
          const { data: existingLocation, error: fetchError } = await supabase
            .from('locations')
            .select('*')
            .eq('name', locationData.name)
            .single()

          if (!fetchError && existingLocation) {
            const { error: updateError } = await supabase
              .from('locations')
              .update({
                tabelog_url: locationData.tabelog_url,
                affiliate_info: locationData.affiliate_info,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingLocation.id)

            if (!updateError) {
              console.log(`   ✅ アフィリエイト情報更新: ${restaurant.name}`)
            }
          }
        } else {
          console.error(`   ❌ ロケーション作成エラー: ${locationError.message}`)
          continue
        }
      } else {
        console.log(`   ✅ ロケーション作成: ${restaurant.name}`)
      }

      // 2-4. エピソード-ロケーション関連付け
      const finalLocationId = location?.id || (await supabase
        .from('locations')
        .select('id')
        .eq('name', locationData.name)
        .single()).data?.id

      if (finalLocationId) {
        const { error: linkError } = await supabase
          .from('episode_locations')
          .insert({
            episode_id: restaurant.episode_id,
            location_id: finalLocationId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (linkError && linkError.code !== '23505') {
          console.error(`   ❌ エピソード関連付けエラー: ${linkError.message}`)
        } else {
          console.log(`   🔗 エピソード関連付け完了`)
        }
      }

      console.log(`   💰 LinkSwitchアフィリエイトURL: ${convertToLinkSwitchUrl(restaurant.tabelog_urls[0]).slice(0, 80)}...`)
    }

    console.log('\n🎉 もえのあずき食べログアフィリエイト設定完了!')
    console.log('')
    console.log('📊 設定結果:')
    console.log(`   対象店舗: ${MOENOAZUKI_RESTAURANTS.length}店舗`)
    console.log('   ✅ 一蘭ラーメン (池袋店) - LinkSwitch有効')
    console.log('   ✅ 味仙 (JR名古屋駅店) - LinkSwitch有効')  
    console.log('   ✅ 赤から (渋谷店) - LinkSwitch有効')
    console.log('')
    console.log('🚀 収益化効果:')
    console.log('   もえのあずき動画 → 食べログ誘導 → アフィリエイト収益')
    console.log('   視聴者の聖地巡礼サポート × 収益最適化完了')

  } catch (error: any) {
    console.error('❌ エラー:', error.message)
    throw error
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMoenoazukiTabelogAffiliate()
    .then(() => {
      console.log('\n✅ アフィリエイト設定完了!')
    })
    .catch((error) => {
      console.error('❌ 実行エラー:', error.message)
      process.exit(1)
    })
}

export { setupMoenoazukiTabelogAffiliate }