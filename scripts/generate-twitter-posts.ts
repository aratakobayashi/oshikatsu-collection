/**
 * Twitter投稿案自動生成スクリプト
 * エピソードに紐づくロケーション・アイテム情報からバズる投稿を作成
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import * as fs from 'fs'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

interface Episode {
  id: string
  title: string
  view_count: number
  date: string
  video_url: string
}

interface Location {
  id: string
  name: string
  address: string
  google_maps_url: string
  tabelog_url: string
  episode_id: string
}

interface Item {
  id: string
  name: string
  brand: string
  category: string
  price: number
  purchase_url: string
  episode_id: string
}

interface TwitterPost {
  type: 'location' | 'item' | 'ranking' | 'trivia'
  content: string
  hashtags: string[]
  url?: string
  serviceUrl?: string // サービスの詳細ページURL
}

const SERVICE_BASE_URL = 'https://collection.oshikatsu-guide.com'

/**
 * エピソード×ロケーション投稿を生成
 */
async function generateLocationPosts(): Promise<TwitterPost[]> {
  console.log('📍 ロケーション投稿を生成中...')

  // エピソードとロケーションを取得
  const { data: locations, error } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      address,
      website_url,
      tabelog_url,
      episode_id
    `)
    .not('episode_id', 'is', null)
    .limit(100)

  if (error || !locations) {
    console.error('❌ ロケーション取得エラー:', error)
    return []
  }

  console.log(`   ${locations.length}件のロケーションを取得`)

  // エピソード情報を取得
  const episodeIds = [...new Set(locations.map(l => l.episode_id))]
  console.log(`   ${episodeIds.length}件のエピソードIDを抽出`)

  const { data: episodes, error: epError } = await supabase
    .from('episodes')
    .select('id, title, view_count, video_url')
    .in('id', episodeIds)

  if (epError) {
    console.error('❌ エピソード取得エラー:', epError)
    return []
  }

  if (!episodes || episodes.length === 0) {
    console.log('   ⚠️ エピソード情報が取得できませんでした')
    return []
  }

  console.log(`   ${episodes.length}件のエピソード情報を取得`)

  const episodeMap = new Map(episodes.map(ep => [ep.id, ep]))
  const posts: TwitterPost[] = []

  // エピソードごとにロケーションをグループ化
  const locationsByEpisode = new Map<string, Location[]>()
  locations.forEach(loc => {
    if (!locationsByEpisode.has(loc.episode_id)) {
      locationsByEpisode.set(loc.episode_id, [])
    }
    locationsByEpisode.get(loc.episode_id)!.push(loc as Location)
  })

  // 投稿パターン1: 複数ロケーション紹介
  locationsByEpisode.forEach((locs, episodeId) => {
    const episode = episodeMap.get(episodeId)
    if (!episode || locs.length === 0) return

    if (locs.length >= 3) {
      // 3箇所以上の場合 - 最初のロケーションの詳細ページへ誘導
      const mainLocation = locs[0]
      const content = `🗺️【聖地巡礼スポット】

「${episode.title}」で訪れた場所✨

${locs.slice(0, 3).map((loc, i) => `${i + 1}. ${loc.name}`).join('\n')}

全${locs.length}箇所の詳細情報はこちら👇
住所・地図・アクセス情報📍`

      posts.push({
        type: 'location',
        content,
        hashtags: ['よにのちゃんねる', '聖地巡礼'],
        url: episode.video_url,
        serviceUrl: `${SERVICE_BASE_URL}/locations/${mainLocation.id}`
      })
    } else if (locs.length === 1) {
      // 1箇所の場合は詳しく紹介
      const loc = locs[0]
      const content = `📍【あのお店どこ?】

「${episode.title}」
で訪れたのは...

🏪 ${loc.name}
${loc.address ? `📮 ${loc.address}` : ''}

詳細情報・アクセス・口コミはこちら👇
${loc.tabelog_url ? '食べログ評価もチェックできます⭐️' : ''}`

      posts.push({
        type: 'location',
        content,
        hashtags: ['よにのちゃんねる', '推し活'],
        url: episode.video_url,
        serviceUrl: `${SERVICE_BASE_URL}/locations/${loc.id}`
      })
    }
  })

  console.log(`✅ ロケーション投稿 ${posts.length}件生成`)
  return posts
}

/**
 * エピソード×アイテム投稿を生成
 */
async function generateItemPosts(): Promise<TwitterPost[]> {
  console.log('👗 アイテム投稿を生成中...')

  // エピソードとアイテムを取得
  const { data: items, error } = await supabase
    .from('items')
    .select(`
      id,
      name,
      brand,
      category,
      price,
      purchase_url,
      episode_id
    `)
    .not('episode_id', 'is', null)
    .limit(100)

  if (error || !items) {
    console.error('❌ アイテム取得エラー:', error)
    return []
  }

  console.log(`   ${items.length}件のアイテムを取得`)

  // エピソード情報を取得
  const episodeIds = [...new Set(items.map(i => i.episode_id))]
  console.log(`   ${episodeIds.length}件のエピソードIDを抽出`)

  const { data: episodes, error: epError } = await supabase
    .from('episodes')
    .select('id, title, view_count, video_url')
    .in('id', episodeIds)

  if (epError) {
    console.error('❌ エピソード取得エラー:', epError)
    return []
  }

  if (!episodes || episodes.length === 0) {
    console.log('   ⚠️ エピソード情報が取得できませんでした')
    return []
  }

  console.log(`   ${episodes.length}件のエピソード情報を取得`)

  const episodeMap = new Map(episodes.map(ep => [ep.id, ep]))
  const posts: TwitterPost[] = []

  // エピソードごとにアイテムをグループ化
  const itemsByEpisode = new Map<string, Item[]>()
  items.forEach(item => {
    if (!itemsByEpisode.has(item.episode_id)) {
      itemsByEpisode.set(item.episode_id, [])
    }
    itemsByEpisode.get(item.episode_id)!.push(item as Item)
  })

  // 投稿パターン: アイテム紹介
  itemsByEpisode.forEach((itms, episodeId) => {
    const episode = episodeMap.get(episodeId)
    if (!episode || itms.length === 0) return

    if (itms.length >= 2) {
      // 複数アイテムの場合 - 最初のアイテムの詳細ページへ誘導
      const mainItem = itms[0]
      const content = `✨【着用アイテム情報】

「${episode.title}」で
着てたアイテムはこちら👇

${itms.slice(0, 3).map((item, i) => {
  const brandInfo = item.brand ? `${item.brand}の` : ''
  const priceInfo = item.price ? `(¥${item.price.toLocaleString()})` : ''
  return `${i + 1}. ${brandInfo}${item.name} ${priceInfo}`
}).join('\n')}

詳細・購入リンクはこちら🛍️`

      posts.push({
        type: 'item',
        content,
        hashtags: ['よにのちゃんねる', 'ファッション'],
        url: episode.video_url,
        serviceUrl: `${SERVICE_BASE_URL}/items/${mainItem.id}`
      })
    } else {
      // 単品アイテムの場合
      const item = itms[0]
      const brandInfo = item.brand ? `${item.brand}の` : ''
      const priceInfo = item.price ? `\n💰 ¥${item.price.toLocaleString()}` : ''

      const content = `🛍️【あの服どこの?】

「${episode.title}」
で着てたのは...

${brandInfo}${item.name}
${priceInfo}

詳細・購入リンクはこちら👇
${item.purchase_url ? '在庫状況もチェックできます🛒' : ''}`

      posts.push({
        type: 'item',
        content,
        hashtags: ['よにのちゃんねる', '推しの私服'],
        url: episode.video_url,
        serviceUrl: `${SERVICE_BASE_URL}/items/${item.id}`
      })
    }
  })

  console.log(`✅ アイテム投稿 ${posts.length}件生成`)
  return posts
}

/**
 * ランキング投稿を生成
 */
async function generateRankingPosts(): Promise<TwitterPost[]> {
  console.log('📊 ランキング投稿を生成中...')

  const posts: TwitterPost[] = []

  // 人気エピソードランキング
  const { data: popularEpisodes } = await supabase
    .from('episodes')
    .select('title, view_count')
    .order('view_count', { ascending: false })
    .limit(5)

  if (popularEpisodes && popularEpisodes.length > 0) {
    const content = `👑【再生回数ランキングTOP5】

${popularEpisodes.map((ep, i) =>
  `${i + 1}位: ${ep.title}\n   ${(ep.view_count || 0).toLocaleString()}回再生`
).join('\n\n')}

全4,000本以上のエピソードを
完全データベース化📊`

    posts.push({
      type: 'ranking',
      content,
      hashtags: ['よにのちゃんねる', 'ランキング']
    })
  }

  // ロケーション人気スポットランキング
  const { data: locationCounts } = await supabase
    .from('locations')
    .select('name')
    .limit(1000)

  if (locationCounts) {
    const nameCount = new Map<string, number>()
    locationCounts.forEach(loc => {
      nameCount.set(loc.name, (nameCount.get(loc.name) || 0) + 1)
    })

    const topLocations = Array.from(nameCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    if (topLocations.length > 0) {
      const content = `📍【よく訪れるスポットTOP5】

${topLocations.map(([name, count], i) =>
  `${i + 1}位: ${name}\n   登場回数: ${count}回`
).join('\n\n')}

聖地巡礼の参考にどうぞ🗺️`

      posts.push({
        type: 'ranking',
        content,
        hashtags: ['よにのちゃんねる', '聖地巡礼']
      })
    }
  }

  console.log(`✅ ランキング投稿 ${posts.length}件生成`)
  return posts
}

/**
 * トリビア投稿を生成
 */
async function generateTriviaPosts(): Promise<TwitterPost[]> {
  console.log('💡 トリビア投稿を生成中...')

  const posts: TwitterPost[] = []

  // 統計情報を取得
  const { count: episodeCount } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })

  const { count: locationCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })

  const { count: itemCount } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })

  // データベース統計投稿
  const content = `📊【推し活データベース】

🎬 エピソード数: ${(episodeCount || 0).toLocaleString()}本
📍 訪問スポット: ${(locationCount || 0).toLocaleString()}箇所
👗 着用アイテム: ${(itemCount || 0).toLocaleString()}点

全部データベース化✨
あなたの推しの情報、
きっと見つかります🔍`

  posts.push({
    type: 'trivia',
    content,
    hashtags: ['よにのちゃんねる', '推し活']
  })

  console.log(`✅ トリビア投稿 ${posts.length}件生成`)
  return posts
}

/**
 * メイン実行
 */
async function main() {
  console.log('🐦 Twitter投稿案生成スタート\n')

  try {
    // 各種投稿を生成
    const locationPosts = await generateLocationPosts()
    const itemPosts = await generateItemPosts()
    const rankingPosts = await generateRankingPosts()
    const triviaPosts = await generateTriviaPosts()

    // 全投稿をまとめる
    const allPosts = [
      ...locationPosts,
      ...itemPosts,
      ...rankingPosts,
      ...triviaPosts
    ]

    console.log(`\n📝 合計 ${allPosts.length}件の投稿案を生成しました\n`)

    // JSONファイルに保存
    const outputPath = 'twitter-post-ideas.json'
    fs.writeFileSync(outputPath, JSON.stringify(allPosts, null, 2), 'utf-8')
    console.log(`💾 ${outputPath} に保存しました`)

    // テキストファイルにも保存（コピペしやすい形式）
    const textOutput = allPosts.map((post, i) => {
      return `
━━━━━━━━━━━━━━━━━━━━━━━━
投稿案 #${i + 1} [${post.type}]
━━━━━━━━━━━━━━━━━━━━━━━━

${post.content}

${post.serviceUrl ? `🔗 詳細ページ: ${post.serviceUrl}\n` : ''}${post.url ? `📺 動画: ${post.url}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━
`
    }).join('\n')

    const textPath = 'twitter-post-ideas.txt'
    fs.writeFileSync(textPath, textOutput, 'utf-8')
    console.log(`💾 ${textPath} に保存しました`)

    // サンプルを表示
    console.log('\n📋 投稿サンプル（最初の3件）:\n')
    allPosts.slice(0, 3).forEach((post, i) => {
      console.log(`【投稿案 #${i + 1}】`)
      console.log(post.content)
      console.log('─'.repeat(50))
    })

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

main()
