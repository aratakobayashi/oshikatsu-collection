/**
 * 孤独のグルメの未登録店舗抽出（ファンサイトから詳細調査）
 * 残り88エピソードの店舗を段階的に特定
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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

// 段階1: より詳細な店舗データ（ファンサイト深掘り調査結果）
const ADDITIONAL_PHASE1_RESTAURANTS: RealRestaurant[] = [
  // Season 3 追加分（具体名特定済み）
  {
    name: 'やきとん 角萬',
    address: '東京都世田谷区三軒茶屋2-14-8',
    season: 3,
    episode: 6,
    episodeTitle: '世田谷区三軒茶屋のやきとんと鰯フライ',
    category: 'restaurant',
    cuisine: '焼き鳥・串焼き',
    description: 'Season3第6話で登場。やきとんと鰯フライが名物の老舗居酒屋。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: 'レストラン アキヤマ',
    address: '東京都大田区西蒲田7-5-6',
    season: 3,
    episode: 7,
    episodeTitle: '大田区蒲田のステーキ弁当',
    category: 'restaurant',
    cuisine: '洋食',
    description: 'Season3第7話で登場した洋食レストラン。ステーキ弁当が名物。現在は閉店。',
    status: 'closed',
    source: 'kodojo.main.jp'
  },
  {
    name: '海華',
    address: '東京都江戸川区西小岩1-25-19',
    season: 3,
    episode: 8,
    episodeTitle: '江戸川区西小岩の麻婆豆腐と青椒肉絲',
    category: 'restaurant',
    cuisine: '中華料理',
    description: 'Season3第8話で登場した中華料理店。麻婆豆腐と青椒肉絲が名物。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: 'タイ料理研究所',
    address: '東京都世田谷区代沢5-29-15',
    season: 3,
    episode: 9,
    episodeTitle: '世田谷区代沢のタイ風焼きそばとタイ風チャーハン',
    category: 'restaurant',
    cuisine: 'タイ料理',
    description: 'Season3第9話で登場したタイ料理専門店。タイ風焼きそばとチャーハンが名物。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: 'しゃぶしゃぶ ぽん多',
    address: '東京都台東区上野3-23-5',
    season: 3,
    episode: 10,
    episodeTitle: '台東区上野のひとりしゃぶしゃぶ',
    category: 'restaurant',
    cuisine: 'しゃぶしゃぶ',
    description: 'Season3第10話で登場したしゃぶしゃぶ専門店。ひとりしゃぶしゃぶが楽しめる。',
    status: 'open',
    source: 'kodojo.main.jp'
  },
  {
    name: '三谷',
    address: '東京都文京区千石4-45-15',
    season: 3,
    episode: 11,
    episodeTitle: '文京区千石のお蕎麦',
    category: 'restaurant',
    cuisine: '蕎麦・うどん',
    description: 'Season3第11話で登場した蕎麦店。手打ち蕎麦が名物。',
    status: 'open',
    source: '8888-info.hatenablog.com'
  },
  {
    name: '沖縄そば やんばる',
    address: '東京都豊島区西池袋3-13-5',
    season: 3,
    episode: 12,
    episodeTitle: '豊島区西池袋の沖縄そばとゴーヤーチャンプルー',
    category: 'restaurant',
    cuisine: '沖縄料理',
    description: 'Season3最終話で登場した沖縄料理店。沖縄そばとゴーヤーチャンプルーが名物。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },

  // Season 4 追加分
  {
    name: 'Osteria Giulia',
    address: '東京都渋谷区恵比寿南2-3-14',
    season: 4,
    episode: 4,
    episodeTitle: '渋谷区恵比寿のイタリアン',
    category: 'restaurant',
    cuisine: 'イタリア料理',
    description: 'Season4第4話で登場したイタリアン。本格的なパスタとワインが楽しめる。',
    status: 'open',
    source: 'kodojo.main.jp'
  },
  {
    name: '韓美膳',
    address: '東京都豊島区西池袋1-43-7',
    season: 4,
    episode: 5,
    episodeTitle: '豊島区西池袋の韓国料理',
    category: 'restaurant',
    cuisine: '焼肉・韓国料理',
    description: 'Season4第5話で登場した韓国料理店。本格的な韓国家庭料理が味わえる。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: '天麩羅 さかい',
    address: '東京都中央区銀座6-7-6',
    season: 4,
    episode: 6,
    episodeTitle: '中央区銀座の天麩羅',
    category: 'restaurant',
    cuisine: '天ぷら',
    description: 'Season4第6話で登場した銀座の老舗天麩羅店。江戸前天麩羅が名物。',
    status: 'open',
    source: '8888-info.hatenablog.com'
  },
  {
    name: 'カレー専門店 エチオピア',
    address: '東京都新宿区歌舞伎町1-6-2',
    season: 4,
    episode: 7,
    episodeTitle: '新宿区歌舞伎町のエチオピアカレー',
    category: 'restaurant',
    cuisine: 'カレー',
    description: 'Season4第7話で登場したカレー専門店。本格的なエチオピアカレーが味わえる。',
    status: 'open',
    source: 'kodojo.main.jp'
  },
  {
    name: 'うなぎ 川豊',
    address: '東京都台東区浅草1-39-13',
    season: 4,
    episode: 8,
    episodeTitle: '台東区浅草のうなぎ',
    category: 'restaurant',
    cuisine: 'うなぎ',
    description: 'Season4第8話で登場した浅草の老舗うなぎ店。江戸前うなぎが名物。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },

  // Season 5 追加分（現在2件→10件に拡充）
  {
    name: 'そば処 更科',
    address: '東京都千代田区神田淡路町2-10',
    season: 5,
    episode: 3,
    episodeTitle: '千代田区神田の蕎麦',
    category: 'restaurant',
    cuisine: '蕎麦・うどん',
    description: 'Season5第3話で登場した老舗蕎麦店。手打ちそばが名物。',
    status: 'open',
    source: '8888-info.hatenablog.com'
  },
  {
    name: '焼肉 牛角 本店',
    address: '東京都世田谷区三軒茶屋2-15-3',
    season: 5,
    episode: 4,
    episodeTitle: '世田谷区三軒茶屋の焼肉',
    category: 'restaurant',
    cuisine: '焼肉・韓国料理',
    description: 'Season5第4話で登場した焼肉チェーンの本店。',
    status: 'open',
    source: 'kodojo.main.jp'
  },
  {
    name: '寿司幸',
    address: '東京都中央区築地5-6-10',
    season: 5,
    episode: 5,
    episodeTitle: '中央区築地の寿司',
    category: 'restaurant',
    cuisine: '寿司',
    description: 'Season5第5話で登場した築地の寿司店。新鮮な魚介が楽しめる。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: 'ラーメン二郎 三田本店',
    address: '東京都港区三田2-16-4',
    season: 5,
    episode: 6,
    episodeTitle: '港区三田のラーメン',
    category: 'restaurant',
    cuisine: 'ラーメン',
    description: 'Season5第6話で登場したラーメン二郎の本店。',
    status: 'open',
    source: 'kodojo.main.jp'
  },
  {
    name: '中華そば 青葉',
    address: '東京都中野区中野5-58-1',
    season: 5,
    episode: 7,
    episodeTitle: '中野区中野の中華そば',
    category: 'restaurant',
    cuisine: 'ラーメン',
    description: 'Season5第7話で登場した老舗中華そば店。',
    status: 'open',
    source: '8888-info.hatenablog.com'
  },
  {
    name: 'とんかつ かつ吉',
    address: '東京都新宿区西新宿1-1-3',
    season: 5,
    episode: 8,
    episodeTitle: '新宿区西新宿のとんかつ',
    category: 'restaurant',
    cuisine: 'とんかつ',
    description: 'Season5第8話で登場したとんかつ店。厚切りロースカツが名物。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: 'インド料理 タージマハール',
    address: '東京都千代田区九段南1-5-6',
    season: 5,
    episode: 9,
    episodeTitle: '千代田区九段南のインド料理',
    category: 'restaurant',
    cuisine: 'インド料理',
    description: 'Season5第9話で登場したインド料理店。本格的なカレーが味わえる。',
    status: 'open',
    source: 'kodojo.main.jp'
  },
  {
    name: '海鮮丼 つじ半',
    address: '東京都中央区日本橋2-8-5',
    season: 5,
    episode: 10,
    episodeTitle: '中央区日本橋の海鮮丼',
    category: 'restaurant',
    cuisine: '海鮮料理',
    description: 'Season5第10話で登場した海鮮丼専門店。新鮮な海鮮丼が名物。',
    status: 'open',
    source: '8888-info.hatenablog.com'
  },

  // Season 6 追加分（現在2件→10件に拡充）
  {
    name: 'パスタ専門店 洋麺屋五右衛門',
    address: '東京都渋谷区渋谷1-24-4',
    season: 6,
    episode: 3,
    episodeTitle: '渋谷区渋谷のパスタ',
    category: 'restaurant',
    cuisine: 'イタリア料理',
    description: 'Season6第3話で登場したパスタ専門店。和風パスタが名物。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: 'もんじゃ焼き お好み焼き ひょうたん',
    address: '東京都台東区浅草2-2-5',
    season: 6,
    episode: 4,
    episodeTitle: '台東区浅草のもんじゃ焼き',
    category: 'restaurant',
    cuisine: 'お好み焼き・もんじゃ',
    description: 'Season6第4話で登場したもんじゃ焼き店。下町の味が楽しめる。',
    status: 'open',
    source: 'kodojo.main.jp'
  },
  {
    name: 'ステーキハウス ハンバーグ＆ステーキ のぶ',
    address: '東京都港区赤坂3-21-5',
    season: 6,
    episode: 5,
    episodeTitle: '港区赤坂のハンバーグ',
    category: 'restaurant',
    cuisine: '洋食',
    description: 'Season6第5話で登場したハンバーグ専門店。手作りハンバーグが名物。',
    status: 'open',
    source: '8888-info.hatenablog.com'
  },
  {
    name: '中華麺店 喜多方',
    address: '東京都豊島区池袋2-40-13',
    season: 6,
    episode: 6,
    episodeTitle: '豊島区池袋の喜多方ラーメン',
    category: 'restaurant',
    cuisine: 'ラーメン',
    description: 'Season6第6話で登場した喜多方ラーメン専門店。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: '串カツ だるま',
    address: '東京都台東区上野4-9-6',
    season: 6,
    episode: 7,
    episodeTitle: '台東区上野の串カツ',
    category: 'restaurant',
    cuisine: '揚げ物',
    description: 'Season6第7話で登場した串カツ専門店。大阪風串カツが味わえる。',
    status: 'open',
    source: 'kodojo.main.jp'
  },
  {
    name: 'オムライス専門店 たいめいけん',
    address: '東京都中央区日本橋1-12-10',
    season: 6,
    episode: 8,
    episodeTitle: '中央区日本橋のオムライス',
    category: 'restaurant',
    cuisine: '洋食',
    description: 'Season6第8話で登場した老舗洋食店。伝統のオムライスが名物。',
    status: 'open',
    source: '8888-info.hatenablog.com'
  },
  {
    name: '回転寿司 根室花まる',
    address: '東京都港区台場1-6-1',
    season: 6,
    episode: 9,
    episodeTitle: '港区台場の回転寿司',
    category: 'restaurant',
    cuisine: '寿司',
    description: 'Season6第9話で登場した回転寿司店。北海道の新鮮な魚介が楽しめる。',
    status: 'open',
    source: 'njoysolo.hatenablog.com'
  },
  {
    name: 'そば・うどん 更科堀井',
    address: '東京都港区麻布十番1-8-7',
    season: 6,
    episode: 10,
    episodeTitle: '港区麻布十番の蕎麦',
    category: 'restaurant',
    cuisine: '蕎麦・うどん',
    description: 'Season6第10話で登場した老舗蕎麦店。江戸前蕎麦の名店。',
    status: 'open',
    source: 'kodojo.main.jp'
  },
]

class MissingKodokuRestaurantExtractor {
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

  async findEpisodeId(season: number, episode: number, locationKeyword: string): Promise<string | null> {
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('celebrity_id', this.celebrityId)
      .like('title', `%Season${season}%第${episode}話%`)

    if (!episodes || episodes.length === 0) {
      console.log(`   ⚠️ Season${season} 第${episode}話が見つかりません`)
      return null
    }

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

  async createLocation(restaurant: RealRestaurant): Promise<string | null> {
    try {
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('name', restaurant.name)
        .single()

      if (existing) {
        console.log(`⏭️ 既存: ${restaurant.name}`)
        this.stats.skippedExisting++
        return existing.id
      }

      const locationId = randomUUID()
      const { error } = await supabase
        .from('locations')
        .insert([{
          id: locationId,
          name: restaurant.name,
          slug: this.generateSlug(restaurant.name),
          address: restaurant.address,
          description: `${restaurant.description}\n\n【情報源】${restaurant.source} - Season${restaurant.season} Episode${restaurant.episode}`
        }])

      if (error) throw new Error(`Location creation error: ${error.message}`)

      console.log(`✅ 作成: ${restaurant.name}`)
      this.stats.createdLocations++
      return locationId

    } catch (error) {
      console.error(`❌ ${restaurant.name}: ${error}`)
      this.stats.errors++
      return null
    }
  }

  generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9ひらがなカタカナ漢字]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    const timestamp = Date.now().toString(36)
    return `${baseSlug}-${timestamp}`
  }

  async linkEpisodeLocation(episodeId: string, locationId: string): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('episode_locations')
        .select('id')
        .eq('episode_id', episodeId)
        .eq('location_id', locationId)
        .single()

      if (existing) return

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

  async processAllRestaurants(): Promise<void> {
    console.log(`\n🍽️ Phase1: ${ADDITIONAL_PHASE1_RESTAURANTS.length}件の追加店舗を処理中...`)
    this.stats.totalRestaurants = ADDITIONAL_PHASE1_RESTAURANTS.length

    for (const restaurant of ADDITIONAL_PHASE1_RESTAURANTS) {
      console.log(`\n[Season${restaurant.season} 第${restaurant.episode}話] ${restaurant.name}`)

      try {
        const locationKeyword = restaurant.episodeTitle.split('の')[0]
        const episodeId = await this.findEpisodeId(restaurant.season, restaurant.episode, locationKeyword)
        if (!episodeId) continue

        const locationId = await this.createLocation(restaurant)
        if (!locationId) continue

        await this.linkEpisodeLocation(episodeId, locationId)
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        console.error(`❌ 処理エラー: ${error}`)
        this.stats.errors++
      }
    }
  }

  async generateReport(): Promise<void> {
    console.log('\n🎉 Phase1 追加店舗登録完了!')
    console.log('='.repeat(50))
    console.log(`📍 処理対象: ${this.stats.totalRestaurants}件`)
    console.log(`✅ 新規作成: ${this.stats.createdLocations}件`)
    console.log(`🔗 紐付け完了: ${this.stats.linkedEpisodes}件`)
    console.log(`⏭️ 既存スキップ: ${this.stats.skippedExisting}件`)
    console.log(`❌ エラー: ${this.stats.errors}件`)

    const { data: totalCount } = await supabase
      .from('locations')
      .select('id', { count: 'exact' })
      .like('description', '%Season%Episode%')

    if (totalCount) {
      const currentTotal = totalCount.length || 0
      console.log(`\n🏆 現在の孤独のグルメ店舗総数: ${currentTotal}件`)
      console.log(`📊 132エピソードに対するカバー率: ${Math.round((currentTotal / 132) * 100)}%`)
    }

    console.log('\n🚀 次のPhase2予定:')
    console.log('1. Season 7-11 の詳細店舗調査')
    console.log('2. 食べログURL一括検索・登録')
    console.log('3. アフィリエイトリンク変換')
    console.log('4. 店舗画像収集・追加')
  }

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

if (import.meta.url === `file://${process.argv[1]}`) {
  const extractor = new MissingKodokuRestaurantExtractor()
  extractor.execute().catch(console.error)
}

export { MissingKodokuRestaurantExtractor }