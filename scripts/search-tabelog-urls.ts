/**
 * 131件の抽出飲食店の食べログURLを自動検索・収集するスクリプト
 * Google検索APIを使用して各店舗の食べログページを検索
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Google Custom Search API設定
const GOOGLE_API_KEY = process.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY!
const SEARCH_ENGINE_ID = process.env.VITE_GOOGLE_CUSTOM_SEARCH_ENGINE_ID!
const GOOGLE_SEARCH_URL = 'https://www.googleapis.com/customsearch/v1'

interface Location {
  id: string
  name: string
  address: string | null
  description: string | null
}

interface SearchResult {
  title: string
  link: string
  snippet: string
  displayLink: string
}

class TabelogUrlSearcher {
  private locations: Location[] = []
  private stats = {
    totalLocations: 0,
    searchedUrls: 0,
    foundUrls: 0,
    errors: 0,
    tabelogMatches: 0
  }

  // Google Custom Searchを実行
  async searchGoogle(query: string): Promise<SearchResult[]> {
    const url = new URL(GOOGLE_SEARCH_URL)
    url.searchParams.set('key', GOOGLE_API_KEY)
    url.searchParams.set('cx', SEARCH_ENGINE_ID)
    url.searchParams.set('q', query)
    url.searchParams.set('num', '5') // 上位5件を取得

    try {
      console.log(`🔍 検索中: ${query}`)
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error(`❌ 検索エラー:`, error)
      this.stats.errors++
      return []
    }
  }

  // 食べログURLを抽出
  findTabelogUrls(results: SearchResult[]): string[] {
    return results
      .map(result => result.link)
      .filter(url => url.includes('tabelog.com'))
      .filter(url => !url.includes('/rstLst/')) // 一覧ページを除外
      .filter(url => url.match(/\/\d+\/$/)) // 店舗詳細ページのみ
  }

  // 検索クエリを生成（地域＋料理＋食べログ）
  generateSearchQuery(location: Location): string[] {
    const { name, address, description } = location
    
    // 住所から地域を抽出
    let area = ''
    if (address) {
      const areaMatch = address.match(/(東京都|神奈川県|千葉県|埼玉県|群馬県|栃木県|茨城県|静岡県|山梨県|長野県|新潟県|福島県|宮城県|岩手県|青森県|北海道|大阪府|京都府|奈良県|和歌山県|兵庫県|滋賀県|三重県|愛知県|岐阜県|富山県|石川県|福井県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)(.+?)(区|市|町|村)/)
      if (areaMatch) {
        area = areaMatch[1] + areaMatch[2] + areaMatch[3]
      }
    }

    // 料理ジャンルを抽出
    let cuisine = ''
    if (description) {
      const genreMatch = description.match(/名物は「(.+?)」/)
      if (genreMatch) {
        cuisine = genreMatch[1]
      }
    }

    // 複数の検索パターンを生成
    const queries = []
    
    if (area && cuisine) {
      queries.push(`${area} ${cuisine} 食べログ`)
      queries.push(`${name} ${area} 食べログ`)
    }
    
    if (area) {
      queries.push(`${area} ${name} 食べログ`)
    }

    // フォールバック検索
    queries.push(`${name} 食べログ`)
    
    return queries.slice(0, 2) // 最大2パターンで検索
  }

  // データベースから対象ロケーションを取得
  async loadKodokuLocations(): Promise<void> {
    console.log('📍 孤独のグルメのロケーション一覧を取得中...')
    
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, address, description')
      .like('description', '%「孤独のグルメ%')
      .order('name')

    if (error) {
      throw new Error(`データベースエラー: ${error.message}`)
    }

    if (!locations || locations.length === 0) {
      throw new Error('孤独のグルメのロケーションが見つかりません')
    }

    this.locations = locations
    this.stats.totalLocations = locations.length
    console.log(`✅ ${locations.length}件のロケーションを読み込み完了`)
  }

  // 各ロケーションの食べログURLを検索
  async searchAllTabelogUrls(): Promise<void> {
    console.log('\n🔍 食べログURL検索を開始...')
    
    for (let i = 0; i < this.locations.length; i++) {
      const location = this.locations[i]
      console.log(`\n[${i + 1}/${this.locations.length}] ${location.name}`)
      
      try {
        // 検索クエリを生成
        const queries = this.generateSearchQuery(location)
        let foundUrl = ''
        
        for (const query of queries) {
          if (foundUrl) break
          
          // Google検索実行
          const results = await this.searchGoogle(query)
          this.stats.searchedUrls++
          
          if (results.length > 0) {
            // 食べログURLを検索
            const tabelogUrls = this.findTabelogUrls(results)
            
            if (tabelogUrls.length > 0) {
              foundUrl = tabelogUrls[0] // 最初のURLを採用
              this.stats.tabelogMatches++
              console.log(`   ✅ 見つかりました: ${foundUrl}`)
              break
            }
          }
          
          // API制限対策（1秒間隔）
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        if (foundUrl) {
          // データベースに保存
          await this.saveTabelogUrl(location.id, foundUrl)
          this.stats.foundUrls++
        } else {
          console.log(`   ⚠️ 食べログURLが見つかりませんでした`)
        }
        
      } catch (error) {
        console.error(`   ❌ エラー: ${error}`)
        this.stats.errors++
      }
      
      // 大きな間隔でAPI制限回避
      if (i % 10 === 0 && i > 0) {
        console.log('   ⏱️ API制限回避のため5秒待機...')
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
  }

  // 食べログURLをデータベースに保存
  async saveTabelogUrl(locationId: string, tabelogUrl: string): Promise<void> {
    // locations.image_urlsに食べログURLを追加
    const { data: location } = await supabase
      .from('locations')
      .select('image_urls')
      .eq('id', locationId)
      .single()

    const currentUrls = location?.image_urls || []
    const updatedUrls = [...currentUrls, tabelogUrl]

    const { error } = await supabase
      .from('locations')
      .update({ 
        image_urls: updatedUrls,
        updated_at: new Date().toISOString()
      })
      .eq('id', locationId)

    if (error) {
      throw new Error(`URL保存エラー: ${error.message}`)
    }
  }

  // 結果レポート生成
  async generateReport(): Promise<void> {
    console.log('\n🎉 食べログURL検索完了!')
    console.log('='.repeat(50))
    console.log(`📍 対象ロケーション: ${this.stats.totalLocations}件`)
    console.log(`🔍 実行検索数: ${this.stats.searchedUrls}件`)
    console.log(`🎯 食べログURL発見: ${this.stats.foundUrls}件`)
    console.log(`📊 マッチング率: ${Math.round((this.stats.foundUrls / this.stats.totalLocations) * 100)}%`)
    console.log(`❌ エラー: ${this.stats.errors}件`)

    // 成功した店舗の一覧表示
    const { data: successLocations } = await supabase
      .from('locations')
      .select('name, image_urls')
      .like('description', '%「孤独のグルメ%')
      .not('image_urls', 'is', null)

    if (successLocations && successLocations.length > 0) {
      console.log('\n✅ 食べログURL取得成功店舗:')
      successLocations.slice(0, 10).forEach((loc, index) => {
        const tabelogUrl = loc.image_urls?.find((url: string) => url.includes('tabelog.com'))
        console.log(`   ${index + 1}. ${loc.name}: ${tabelogUrl}`)
      })
      
      if (successLocations.length > 10) {
        console.log(`   ... 他${successLocations.length - 10}件`)
      }
    }

    console.log('\n💰 収益化準備完了度:')
    console.log(`🎯 アフィリエイト変換対象: ${this.stats.foundUrls}件`)
    console.log(`💵 想定収益化店舗: ${this.stats.foundUrls} × 平均予約単価`)
    console.log(`📈 SEO対象キーワード: ${this.stats.foundUrls} × 聖地巡礼検索`)
    
    console.log('\n🚀 次のステップ:')
    console.log('1. ValueCommerceアフィリエイトリンクに変換')
    console.log('2. 食べログから店舗画像を収集')
    console.log('3. メニュー情報の追加')
  }

  // メイン処理実行
  async executeSearch(): Promise<void> {
    try {
      await this.loadKodokuLocations()
      await this.searchAllTabelogUrls()
      await this.generateReport()
    } catch (error) {
      console.error('❌ 検索処理でエラーが発生しました:', error)
      console.log('\n🔧 トラブルシューティング:')
      console.log('1. Google Custom Search APIキーとEngine IDが正しく設定されているか確認')
      console.log('2. APIクオータが残っているか確認（1日100回制限）')
      console.log('3. インターネット接続を確認')
    }
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const searcher = new TabelogUrlSearcher()
  searcher.executeSearch().catch(console.error)
}

export { TabelogUrlSearcher }