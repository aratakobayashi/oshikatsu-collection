/**
 * ファンサイトから孤独のグルメの実在店舗を抽出・登録
 * 具体的な店名が特定できている店舗のみ登録
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// ファンサイトから収集した実在店舗データ
interface RealRestaurant {
  name: string
  address: string
  season: number
  episode: number
  episodeTitle: string
  category: 'restaurant' | 'cafe'
  cuisine: string
  description: string
  status: 'open' | 'closed' | 'unknown'
  source: string
}

const REAL_RESTAURANTS: RealRestaurant[] = [
  // Season 1
  {
    name: 'やきとり 庄助',
    address: '東京都江東区門前仲町2-7-7',
    season: 1,
    episode: 1,
    episodeTitle: '江東区門前仲町のやきとりと焼きめし',
    category: 'restaurant',
    cuisine: '焼き鳥・串焼き',
    description: 'Season1第1話で五郎が訪れた老舗やきとり店。名物は焼きめしとやきとり。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: '中国家庭料理 楊 2号店',
    address: '東京都豊島区池袋2-23-2',
    season: 1,
    episode: 3,
    episodeTitle: '豊島区池袋の汁なし担々麺',
    category: 'restaurant',
    cuisine: '中華料理',
    description: 'Season1第3話で登場。汁なし担々麺が名物の中国家庭料理店。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: 'とんかつ みやこや',
    address: '東京都中野区鷺ノ宮3-19-3',
    season: 1,
    episode: 6,
    episodeTitle: '中野区鷺ノ宮のロースにんにく焼き',
    category: 'restaurant',
    cuisine: 'とんかつ',
    description: 'Season1第6話で登場したとんかつ店。現在は閉店。',
    status: 'closed',
    source: '8888-info.hatenablog.com'
  },
  {
    name: 'カヤシマ',
    address: '東京都武蔵野市吉祥寺本町2-24-6',
    season: 1,
    episode: 7,
    episodeTitle: '武蔵野市吉祥寺喫茶店のナポリタン',
    category: 'cafe',
    cuisine: 'カフェ・喫茶店',
    description: 'Season1第7話で登場した老舗喫茶店。ナポリタンが名物。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: 'お好み焼きひろき下北沢店',
    address: '東京都世田谷区北沢2-19-12',
    season: 1,
    episode: 9,
    episodeTitle: '世田谷区下北沢の広島風お好み焼',
    category: 'restaurant',
    cuisine: 'お好み焼き・もんじゃ',
    description: 'Season1第9話で登場。広島風お好み焼きの専門店。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: '季節料理 すみれ',
    address: '東京都文京区根津2-28-5',
    season: 1,
    episode: 11,
    episodeTitle: '文京区根津の呑み屋さんの特辛カレー',
    category: 'restaurant',
    cuisine: '居酒屋',
    description: 'Season1第11話で登場した居酒屋。特辛カレーが名物。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: '草花木果-SokaBokka-',
    address: '東京都目黒区上目黒3-2-1',
    season: 1,
    episode: 12,
    episodeTitle: '目黒区中目黒ソーキそばとアグー豚の天然塩焼き',
    category: 'restaurant',
    cuisine: '沖縄料理',
    description: 'Season1第12話で登場した沖縄料理店。ソーキそばとアグー豚が名物。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },

  // Season 2
  {
    name: '天ぷら 中山',
    address: '東京都中央区日本橋人形町1-10-8',
    season: 2,
    episode: 2,
    episodeTitle: '中央区日本橋人形町の黒天丼',
    category: 'restaurant',
    cuisine: '天ぷら',
    description: 'Season2第2話で登場した天ぷら専門店。黒天丼が名物。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: '焼肉 平和苑',
    address: '東京都中野区沼袋3-23-2',
    season: 2,
    episode: 3,
    episodeTitle: '中野区沼袋のわさびカルビと卵かけご飯',
    category: 'restaurant',
    cuisine: '焼肉・韓国料理',
    description: 'Season2第3話で登場した焼肉店。わさびカルビと卵かけご飯が名物。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: '四川家庭料理 珍珍',
    address: '東京都江戸川区西小岩4-9-20',
    season: 2,
    episode: 6,
    episodeTitle: '江戸川区京成小岩の激辛四川料理',
    category: 'restaurant',
    cuisine: '中華料理',
    description: 'Season2第6話で登場した四川料理店。激辛料理が名物。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: 'ちゃんこ割烹 大内',
    address: '東京都墨田区両国2-9-6',
    season: 2,
    episode: 8,
    episodeTitle: '墨田区両国の一人ちゃんこ鍋',
    category: 'restaurant',
    cuisine: 'ちゃんこ',
    description: 'Season2第8話で登場したちゃんこ専門店。一人ちゃんこ鍋が名物。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: '大衆割烹 田や',
    address: '東京都北区中十条2-22-2',
    season: 2,
    episode: 10,
    episodeTitle: '北区十条の鯖のくんせいと甘い玉子焼',
    category: 'restaurant',
    cuisine: '居酒屋',
    description: 'Season2第10話で登場した大衆割烹。鯖のくんせいと甘い玉子焼が名物。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: 'ライカノ',
    address: '東京都足立区千住2-62',
    season: 2,
    episode: 11,
    episodeTitle: '足立区北千住のタイカレーと鶏の汁無し麺',
    category: 'restaurant',
    cuisine: 'タイ料理',
    description: 'Season2第11話で登場したタイ料理店。タイカレーと汁無し麺が名物。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  }
]

class RealKodokuRestaurantCreator {
  private celebrityId: string = ''
  private stats = {
    totalRestaurants: 0,
    createdLocations: 0,
    linkedEpisodes: 0,
    skippedExisting: 0,
    errors: 0
  }

  async initialize(): Promise<void> {
    console.log('🎭 松重豊のセレブリティIDを取得中...')
    
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'matsushige-yutaka')
      .single()

    if (!celebrity) {
      throw new Error('松重豊のセレブリティが見つかりません')
    }

    this.celebrityId = celebrity.id
    console.log('✅ セレブリティID:', this.celebrityId)
  }

  // エピソードIDを取得
  async getEpisodeId(season: number, episode: number, locationKeyword: string): Promise<string | null> {
    // より柔軟なマッチング
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('celebrity_id', this.celebrityId)
      .like('title', `%Season${season}%第${episode}話%`)

    if (!episodes || episodes.length === 0) {
      console.log(`   ⚠️ Season${season} 第${episode}話が見つかりません`)
      return null
    }

    // 地域キーワードでマッチング確認
    const matchedEpisode = episodes.find(ep => 
      ep.title.includes(locationKeyword) || 
      ep.title.replace(/[のと・]/g, '').includes(locationKeyword.replace(/[のと・]/g, ''))
    )

    if (matchedEpisode) {
      console.log(`   ✅ マッチ: ${matchedEpisode.title}`)
      return matchedEpisode.id
    }

    console.log(`   ⚠️ 地域マッチなし: ${locationKeyword}`)
    return episodes[0]?.id || null
  }

  // 実在店舗をロケーションとして作成
  async createRealLocation(restaurant: RealRestaurant): Promise<string | null> {
    try {
      // 既存チェック
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('name', restaurant.name)
        .eq('address', restaurant.address)
        .single()

      if (existing) {
        console.log(`⏭️ 既存: ${restaurant.name}`)
        this.stats.skippedExisting++
        return existing.id
      }

      // 新規ロケーション作成
      const locationId = randomUUID()
      const locationData = {
        id: locationId,
        name: restaurant.name,
        slug: this.generateSlug(restaurant.name),
        address: restaurant.address,
        description: `${restaurant.description}\n\n【情報源】${restaurant.source} - Season${restaurant.season} Episode${restaurant.episode}`,
        image_urls: [] // 後で画像収集
      }

      const { error } = await supabase
        .from('locations')
        .insert([locationData])

      if (error) {
        throw new Error(`Location creation error: ${error.message}`)
      }

      console.log(`✅ 作成: ${restaurant.name}`)
      this.stats.createdLocations++
      return locationId

    } catch (error) {
      console.error(`❌ ${restaurant.name}: ${error}`)
      this.stats.errors++
      return null
    }
  }

  // エピソードとロケーションを紐付け
  async linkEpisodeLocation(episodeId: string, locationId: string): Promise<void> {
    try {
      // 既存の紐付けをチェック
      const { data: existing } = await supabase
        .from('episode_locations')
        .select('id')
        .eq('episode_id', episodeId)
        .eq('location_id', locationId)
        .single()

      if (existing) return

      // 新規紐付け作成
      const { error } = await supabase
        .from('episode_locations')
        .insert([{
          episode_id: episodeId,
          location_id: locationId
        }])

      if (!error) {
        this.stats.linkedEpisodes++
      }

    } catch (error) {
      console.error(`❌ 紐付けエラー:`, error)
    }
  }

  // スラッグ生成（重複回避）
  generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9ひらがなカタカナ漢字]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    // ランダムサフィックスを追加して重複を回避
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    return `${baseSlug}-${randomSuffix}`
  }

  // 実在店舗の一括処理
  async processAllRestaurants(): Promise<void> {
    console.log(`\n🍽️ ${REAL_RESTAURANTS.length}件の実在店舗を処理中...`)
    this.stats.totalRestaurants = REAL_RESTAURANTS.length

    for (const restaurant of REAL_RESTAURANTS) {
      console.log(`\n[Season${restaurant.season} 第${restaurant.episode}話] ${restaurant.name}`)

      try {
        // 1. エピソードID取得（地域キーワードでマッチング）
        const locationKeyword = restaurant.episodeTitle.split('の')[0] // '江東区門前仲町'
        const episodeId = await this.getEpisodeId(restaurant.season, restaurant.episode, locationKeyword)
        if (!episodeId) {
          console.log(`⚠️ 対応するエピソードが見つかりません`)
          continue
        }

        // 2. ロケーション作成
        const locationId = await this.createRealLocation(restaurant)
        if (!locationId) continue

        // 3. エピソードと紐付け
        await this.linkEpisodeLocation(episodeId, locationId)

        // API制限対策
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        console.error(`❌ 処理エラー: ${error}`)
        this.stats.errors++
      }
    }
  }

  // 結果レポート
  async generateReport(): Promise<void> {
    console.log('\n🎉 実在店舗登録完了!')
    console.log('='.repeat(50))
    console.log(`📍 処理対象: ${this.stats.totalRestaurants}件`)
    console.log(`✅ 新規作成: ${this.stats.createdLocations}件`)
    console.log(`🔗 紐付け完了: ${this.stats.linkedEpisodes}件`)
    console.log(`⏭️ 既存スキップ: ${this.stats.skippedExisting}件`)
    console.log(`❌ エラー: ${this.stats.errors}件`)

    // 登録された店舗一覧
    const { data: locations } = await supabase
      .from('locations')
      .select('name, address, description')
      .like('description', '%njoysolo%')
      .or('description.like.%8888-info%')
      .order('name')

    if (locations && locations.length > 0) {
      console.log('\n📋 登録済み実在店舗:')
      locations.forEach((loc, index) => {
        console.log(`   ${index + 1}. ${loc.name} (${loc.address})`)
      })
    }

    console.log('\n🚀 次のステップ:')
    console.log('1. 各店舗の食べログURLを検索・追加')
    console.log('2. 店舗画像の収集・追加')
    console.log('3. 残りのシーズンの店舗データ追加')
    console.log('4. アフィリエイトリンクの設定')
  }

  // メイン実行
  async execute(): Promise<void> {
    try {
      await this.initialize()
      await this.processAllRestaurants()
      await this.generateReport()
    } catch (error) {
      console.error('❌ 実行エラー:', error)
    }
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const creator = new RealKodokuRestaurantCreator()
  creator.execute().catch(console.error)
}

export { RealKodokuRestaurantCreator }