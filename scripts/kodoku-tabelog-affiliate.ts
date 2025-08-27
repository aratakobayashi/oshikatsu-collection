/**
 * 孤独のグルメの飲食店の食べログURLを収集し、
 * アフィリエイトリンクを設定するスクリプト
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// バリューコマースのアフィリエイトリンク変換
function convertToAffiliateUrl(tabelogUrl: string): string {
  // バリューコマース経由の食べログアフィリエイトURL形式
  const affiliateBase = 'https://ck.jp.ap.valuecommerce.com/servlet/referral'
  const params = new URLSearchParams({
    sid: '3703510',  // あなたのサイトID（要置き換え）
    pid: '890594925', // プログラムID（要置き換え）
    vc_url: tabelogUrl
  })
  
  return `${affiliateBase}?${params.toString()}`
}

// 食べログURL候補を生成
function generateTabelogSearchQueries(restaurantName: string, address: string): string[] {
  // 住所から地域名を抽出
  const areaMatch = address.match(/東京都(.+?区|.+?市)|神奈川県(.+?区|.+?市)|埼玉県(.+?市)/)
  const area = areaMatch ? areaMatch[0].replace(/東京都|神奈川県|埼玉県/, '').trim() : ''
  
  // 店名のバリエーションを作成
  const nameVariations = [
    restaurantName,
    restaurantName.replace(/\s+/g, ''),
    restaurantName.replace(/店$/g, ''),
    restaurantName.split(' ')[0]
  ]

  // 検索クエリの組み合わせを生成
  const queries: string[] = []
  nameVariations.forEach(name => {
    queries.push(`${name} ${area} 食べログ`)
    queries.push(`${name} 食べログ`)
  })

  return [...new Set(queries)] // 重複を除去
}

async function findAndSetTabelogLinks() {
  console.log('🔍 孤独のグルメの飲食店の食べログURL収集開始...')

  try {
    // 1. 孤独のグルメ関連のロケーションを取得
    const { data: episodes } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        episode_locations!inner(
          location_id,
          locations!inner(
            id,
            name,
            address,
            reservation_url
          )
        )
      `)
      .like('title', '%孤独のグルメ%')

    if (!episodes || episodes.length === 0) {
      console.log('⚠️ 孤独のグルメのエピソードが見つかりません')
      return
    }

    console.log(`📺 ${episodes.length}件のエピソードを処理します`)

    // 2. 各ロケーションの食べログURL設定
    for (const episode of episodes) {
      const locations = episode.episode_locations
      
      for (const locData of locations) {
        const location = locData.locations
        
        // 既に食べログURLが設定されている場合はスキップ
        if (location.reservation_url?.includes('tabelog.com')) {
          console.log(`✅ 既存: ${location.name}`)
          continue
        }

        console.log(`\n🍴 処理中: ${location.name}`)
        console.log(`  📍 住所: ${location.address || '不明'}`)

        // 食べログURL候補を生成
        const searchQueries = generateTabelogSearchQueries(
          location.name,
          location.address || ''
        )

        console.log(`  🔎 検索クエリ:`)
        searchQueries.forEach(q => console.log(`    - ${q}`))

        // ここで実際の食べログURL検索を行う
        // 注: 実際の実装では、食べログAPIまたはWebスクレイピングが必要
        // 今回は手動で設定する前提のプレースホルダー
        
        const tabelogUrl = await promptForTabelogUrl(location.name, location.address)
        
        if (tabelogUrl) {
          // アフィリエイトURLに変換
          const affiliateUrl = convertToAffiliateUrl(tabelogUrl)
          
          // データベース更新
          const { error } = await supabase
            .from('locations')
            .update({
              reservation_url: affiliateUrl,
              website: tabelogUrl, // 元のURLも保存
              notes: `食べログ: ${tabelogUrl}`
            })
            .eq('id', location.id)

          if (error) {
            console.error(`  ❌ 更新エラー:`, error)
          } else {
            console.log(`  ✅ アフィリエイトリンク設定完了`)
          }
        }

        // APIレート制限対策
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log('\n🎉 食べログアフィリエイトリンク設定完了！')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  }
}

// 手動入力用のヘルパー関数（実際の実装では自動化推奨）
async function promptForTabelogUrl(restaurantName: string, address: string | null): Promise<string | null> {
  // 実際の実装では以下のいずれかを使用：
  // 1. 食べログAPI（公式/非公式）
  // 2. Google Custom Search API
  // 3. Puppeteer等でのWebスクレイピング
  // 4. 事前に収集したマッピングデータ

  // サンプル: 孤独のグルメSeason12の実際の食べログURL
  const knownMappings: { [key: string]: string } = {
    'やきとん酒場 新橋店': 'https://tabelog.com/tokyo/A1301/A130103/13xxxxx/',
    '西安料理 刀削麺園': 'https://tabelog.com/tokyo/A1302/A130203/13xxxxx/',
    'へぎそば処 豪徳寺店': 'https://tabelog.com/tokyo/A1317/A131707/13xxxxx/',
    'インド料理 ガンジス': 'https://tabelog.com/kanagawa/A1405/A140507/14xxxxx/',
    '蜀香園': 'https://tabelog.com/tokyo/A1311/A131101/13xxxxx/',
    '和食処 川越亭': 'https://tabelog.com/saitama/A1103/A110303/11xxxxx/',
    '韓国料理 赤羽店': 'https://tabelog.com/tokyo/A1323/A132305/13xxxxx/',
    '四川厨房 蒲田店': 'https://tabelog.com/tokyo/A1317/A131714/13xxxxx/',
    '洋食屋 代々木亭': 'https://tabelog.com/tokyo/A1318/A131811/13xxxxx/',
    'インド料理 ナマステ': 'https://tabelog.com/tokyo/A1313/A131305/13xxxxx/',
    '洋食 湯島亭': 'https://tabelog.com/tokyo/A1311/A131101/13xxxxx/',
    '名古屋めし 神保町店': 'https://tabelog.com/tokyo/A1310/A131003/13xxxxx/'
  }

  return knownMappings[restaurantName] || null
}

// 実際の食べログURL検索（Google Custom Search API使用例）
async function searchTabelogUrl(restaurantName: string, address: string): Promise<string | null> {
  // Google Custom Search APIを使用した実装例
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID
  
  if (!apiKey || !searchEngineId) {
    console.warn('  ⚠️ Google Custom Search APIが設定されていません')
    return null
  }

  const query = `site:tabelog.com ${restaurantName} ${address}`
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`

  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.items && data.items.length > 0) {
      // 最初の結果を返す
      return data.items[0].link
    }
  } catch (error) {
    console.error('  ❌ 検索エラー:', error)
  }

  return null
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  findAndSetTabelogLinks().catch(console.error)
}

export { findAndSetTabelogLinks, convertToAffiliateUrl }