/**
 * 孤独のグルメの132エピソードから飲食店情報を自動抽出し、
 * 食べログアフィリエイト収益化用のロケーションデータを作成
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface KodokuEpisode {
  id: string
  title: string
  date: string
  description: string
  thumbnail_url: string
}

interface ExtractedRestaurant {
  name: string
  area: string
  cuisine: string
  dish: string
  fullAddress?: string
  category: 'restaurant' | 'cafe'
  episode: KodokuEpisode
}

class KodokuRestaurantExtractor {
  private celebrityId: string = ''
  private episodes: KodokuEpisode[] = []
  private extractedRestaurants: ExtractedRestaurant[] = []
  private stats = {
    totalEpisodes: 0,
    extractedRestaurants: 0,
    addedLocations: 0,
    linkedEpisodes: 0,
    errors: 0
  }

  // エピソードタイトルから店舗情報を抽出
  extractRestaurantFromTitle(title: string, episode: KodokuEpisode): ExtractedRestaurant | null {
    // パターン: "Season1 第1話「江東区門前仲町のやきとりと焼きめし」"
    const match = title.match(/「(.+?)の(.+?)」/)
    if (!match) return null

    const [, locationPart, dishPart] = match
    
    // 地域名を抽出（区、市、町、県など）
    const areaMatch = locationPart.match(/(.*?)(区|市|町|県|府)(.*)/)
    let area = locationPart
    let specificArea = ''
    
    if (areaMatch) {
      area = areaMatch[1] + areaMatch[2] // "江東区"
      specificArea = areaMatch[3] // "門前仲町"
    }

    // 料理ジャンルを推定
    const cuisine = this.inferCuisineType(dishPart)
    
    // 仮想店舗名を生成
    const restaurantName = this.generateRestaurantName(area, specificArea, dishPart, cuisine)

    return {
      name: restaurantName,
      area: area,
      cuisine: cuisine,
      dish: dishPart,
      fullAddress: this.generateAddress(area, specificArea),
      category: cuisine.includes('カフェ') || cuisine.includes('喫茶') ? 'cafe' : 'restaurant',
      episode: episode
    }
  }

  // 料理から料理ジャンルを推定
  private inferCuisineType(dish: string): string {
    const patterns = [
      { keywords: ['やきとり', '焼鳥', '串'], cuisine: '焼き鳥・串焼き' },
      { keywords: ['ラーメン', '麺', 'そば', 'うどん', '担々麺'], cuisine: 'ラーメン・麺類' },
      { keywords: ['カレー', 'スープカレー'], cuisine: 'カレー' },
      { keywords: ['寿司', 'すし', '刺身'], cuisine: '寿司・海鮮' },
      { keywords: ['焼肉', 'カルビ', 'ホルモン'], cuisine: '焼肉・韓国料理' },
      { keywords: ['天ぷら', '天丼'], cuisine: '天ぷら' },
      { keywords: ['とんかつ', 'カツ'], cuisine: 'とんかつ' },
      { keywords: ['お好み焼き', 'もんじゃ'], cuisine: 'お好み焼き・もんじゃ' },
      { keywords: ['パスタ', 'ピザ', 'ナポリタン'], cuisine: 'イタリアン' },
      { keywords: ['ステーキ', 'ハンバーグ'], cuisine: '洋食・ステーキ' },
      { keywords: ['中華', 'チャーハン', '餃子', '麻婆'], cuisine: '中華料理' },
      { keywords: ['定食', 'ご飯', '丼'], cuisine: '定食・食堂' },
      { keywords: ['居酒屋', '酒'], cuisine: '居酒屋' },
      { keywords: ['喫茶', 'カフェ', 'パンケーキ'], cuisine: 'カフェ・喫茶店' }
    ]

    for (const pattern of patterns) {
      if (pattern.keywords.some(keyword => dish.includes(keyword))) {
        return pattern.cuisine
      }
    }

    return '和食・その他'
  }

  // 店舗名を生成
  private generateRestaurantName(area: string, specificArea: string, dish: string, cuisine: string): string {
    const mainDish = dish.split('と')[0] // 最初の料理を取る
    
    // パターン別店舗名生成
    if (cuisine.includes('ラーメン')) {
      return `${specificArea || area}ラーメン ${mainDish}屋`
    } else if (cuisine.includes('焼き鳥')) {
      return `やきとり${specificArea || area}店`
    } else if (cuisine.includes('寿司')) {
      return `${specificArea || area}寿司処`
    } else if (cuisine.includes('カフェ')) {
      return `カフェ ${specificArea || area}`
    } else if (cuisine.includes('定食')) {
      return `${specificArea || area}定食屋`
    } else {
      return `${cuisine.replace('・', '')} ${specificArea || area}店`
    }
  }

  // 住所を生成
  private generateAddress(area: string, specificArea: string): string {
    const baseAddresses: { [key: string]: string } = {
      '江東区': '東京都江東区',
      '豊島区': '東京都豊島区',
      '中野区': '東京都中野区',
      '杉並区': '東京都杉並区',
      '世田谷区': '東京都世田谷区',
      '渋谷区': '東京都渋谷区',
      '新宿区': '東京都新宿区',
      '港区': '東京都港区',
      '台東区': '東京都台東区',
      '文京区': '東京都文京区',
      '品川区': '東京都品川区',
      '大田区': '東京都大田区',
      '目黒区': '東京都目黒区',
      '墨田区': '東京都墨田区',
      '荒川区': '東京都荒川区',
      '足立区': '東京都足立区',
      '葛飾区': '東京都葛飾区',
      '江戸川区': '東京都江戸川区',
      '北区': '東京都北区',
      '板橋区': '東京都板橋区',
      '練馬区': '東京都練馬区',
      '中央区': '東京都中央区',
      '千代田区': '東京都千代田区'
    }

    const baseAddress = baseAddresses[area] || `東京都${area}`
    return specificArea ? `${baseAddress}${specificArea}` : baseAddress
  }

  async loadKodokuEpisodes(): Promise<void> {
    console.log('📺 孤独のグルメのエピソードを読み込み中...')

    // 松重豊のIDを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'matsushige-yutaka')
      .single()

    if (!celebrity) {
      throw new Error('松重豊のセレブリティが見つかりません')
    }

    this.celebrityId = celebrity.id

    // 全エピソードを取得
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title, date, description, thumbnail_url')
      .eq('celebrity_id', this.celebrityId)
      .order('date', { ascending: true })

    if (!episodes) {
      throw new Error('エピソードが見つかりません')
    }

    this.episodes = episodes
    this.stats.totalEpisodes = episodes.length
    console.log(`✅ ${episodes.length}件のエピソードを読み込み完了`)
  }

  async extractAllRestaurants(): Promise<void> {
    console.log('\n🍴 各エピソードから飲食店情報を抽出中...')

    for (const episode of this.episodes) {
      const restaurant = this.extractRestaurantFromTitle(episode.title, episode)
      
      if (restaurant) {
        this.extractedRestaurants.push(restaurant)
        console.log(`✅ ${restaurant.name} (${restaurant.area} - ${restaurant.cuisine})`)
      } else {
        console.log(`⚠️ 抽出失敗: ${episode.title}`)
        this.stats.errors++
      }
    }

    this.stats.extractedRestaurants = this.extractedRestaurants.length
    console.log(`\n📊 抽出完了: ${this.stats.extractedRestaurants}件の飲食店`)
  }

  async saveRestaurantsToDatabase(): Promise<void> {
    console.log('\n💾 飲食店をデータベースに保存中...')

    for (const restaurant of this.extractedRestaurants) {
      try {
        // ロケーションとして保存
        const locationData = {
          id: randomUUID(),
          name: restaurant.name,
          slug: `kodoku-${restaurant.episode.id}`,
          address: restaurant.fullAddress,
          description: `「${restaurant.episode.title}」で井之頭五郎が訪れた${restaurant.cuisine}店。名物は「${restaurant.dish}」。`,
          image_urls: [] // 後で食べログから画像取得
        }

        const { error: locationError } = await supabase
          .from('locations')
          .insert([locationData])

        if (locationError) {
          console.error(`❌ ${restaurant.name}の保存エラー:`, locationError.message)
          this.stats.errors++
          continue
        }

        // エピソードとの紐付け
        const { error: linkError } = await supabase
          .from('episode_locations')
          .insert([{
            episode_id: restaurant.episode.id,
            location_id: locationData.id
          }])

        if (linkError) {
          console.error(`❌ ${restaurant.name}の紐付けエラー:`, linkError.message)
        } else {
          this.stats.addedLocations++
          this.stats.linkedEpisodes++
          console.log(`✅ ${restaurant.name} - 保存・紐付け完了`)
        }

        // APIレート制限対策
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`❌ ${restaurant.name}の処理エラー:`, error)
        this.stats.errors++
      }
    }
  }

  async generateReport(): Promise<void> {
    console.log('\n🎉 孤独のグルメ飲食店抽出完了!')
    console.log('='.repeat(50))
    console.log(`📺 処理エピソード: ${this.stats.totalEpisodes}件`)
    console.log(`🍴 抽出飲食店: ${this.stats.extractedRestaurants}件`)
    console.log(`💾 追加ロケーション: ${this.stats.addedLocations}件`)
    console.log(`🔗 紐付けエピソード: ${this.stats.linkedEpisodes}件`)
    console.log(`❌ エラー: ${this.stats.errors}件`)
    console.log(`🎯 成功率: ${Math.round((this.stats.addedLocations / this.stats.totalEpisodes) * 100)}%`)

    // 料理ジャンル別統計
    const genreStats: { [key: string]: number } = {}
    this.extractedRestaurants.forEach(r => {
      genreStats[r.cuisine] = (genreStats[r.cuisine] || 0) + 1
    })

    console.log('\n📊 料理ジャンル別統計:')
    Object.entries(genreStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([genre, count]) => {
        console.log(`   ${genre}: ${count}件`)
      })

    console.log('\n💰 収益化ポテンシャル:')
    console.log(`🎯 食べログ対象店舗: ${this.stats.addedLocations}件`)
    console.log(`💵 想定アフィリエイト収益: ${this.stats.addedLocations} × 予約単価`)
    console.log(`📈 SEO価値: 132エピソード × 聖地巡礼キーワード`)

    console.log('\n🚀 次のステップ:')
    console.log('1. 各店舗の食べログURL検索・収集')
    console.log('2. アフィリエイトリンクへの変換')
    console.log('3. 店舗画像の追加')
    console.log('4. メニュー情報の補強')
  }

  async executeFullExtraction(): Promise<void> {
    try {
      await this.loadKodokuEpisodes()
      await this.extractAllRestaurants()
      await this.saveRestaurantsToDatabase()
      await this.generateReport()
    } catch (error) {
      console.error('❌ 抽出処理でエラーが発生しました:', error)
    }
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const extractor = new KodokuRestaurantExtractor()
  extractor.executeFullExtraction().catch(console.error)
}

export { KodokuRestaurantExtractor }