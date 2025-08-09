/**
 * Twitter検索システム - よにのチャンネル関連情報収集
 * 店舗情報・着用アイテム情報を自動収集
 */

import { config } from 'dotenv'

// 環境変数を読み込み
config({ path: '.env.production' })

interface TwitterSearchResult {
  text: string
  id: string
  author_id: string
  created_at: string
  public_metrics: {
    retweet_count: number
    like_count: number
    reply_count: number
  }
}

interface ExtractedInfo {
  type: 'location' | 'item'
  name: string
  category: string
  description: string
  source_tweet: string
  confidence: number
}

export class TwitterSearchSystem {
  private bearerToken: string
  private baseUrl = 'https://api.twitter.com/2'
  
  constructor(bearerToken: string) {
    this.bearerToken = bearerToken
  }

  // よにのチャンネル関連のツイート検索
  async searchYoniChannelTweets(query: string, maxResults: number = 50): Promise<TwitterSearchResult[]> {
    console.log(`🔍 Twitter検索: "${query}"`)
    
    try {
      const searchQuery = encodeURIComponent(`よにのちゃんねる ${query} -is:retweet`)
      const url = `${this.baseUrl}/tweets/search/recent?query=${searchQuery}&max_results=${maxResults}&tweet.fields=author_id,created_at,public_metrics`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Twitter API Error: ${response.status} - ${JSON.stringify(error)}`)
      }
      
      const data = await response.json()
      
      if (!data.data) {
        console.log('🔍 検索結果なし')
        return []
      }
      
      console.log(`✅ ${data.data.length}件のツイートを取得`)
      return data.data
      
    } catch (error: any) {
      console.error('❌ Twitter検索エラー:', error.message)
      throw error
    }
  }

  // 店舗情報の検索
  async searchLocationInfo(): Promise<TwitterSearchResult[]> {
    const locationQueries = [
      '行った カフェ',
      '行った レストラン', 
      '訪問 店舗',
      'お店 どこ',
      'カフェ 場所',
      'ホテル 泊まった',
      '聖地巡礼'
    ]
    
    const allResults: TwitterSearchResult[] = []
    
    for (const query of locationQueries) {
      console.log(`📍 店舗検索: ${query}`)
      const results = await this.searchYoniChannelTweets(query, 20)
      allResults.push(...results)
      
      // API制限対策: 1秒待機
      await this.delay(1000)
    }
    
    return this.removeDuplicates(allResults)
  }

  // アイテム情報の検索
  async searchItemInfo(): Promise<TwitterSearchResult[]> {
    const itemQueries = [
      '着てた 服',
      '持ってた バッグ',
      'アイテム どこの',
      'ファッション ブランド',
      '私服 かわいい',
      'コーデ 真似したい',
      'アクセサリー'
    ]
    
    const allResults: TwitterSearchResult[] = []
    
    for (const query of itemQueries) {
      console.log(`👗 アイテム検索: ${query}`)
      const results = await this.searchYoniChannelTweets(query, 20)
      allResults.push(...results)
      
      // API制限対策: 1秒待機
      await this.delay(1000)
    }
    
    return this.removeDuplicates(allResults)
  }

  // ツイート内容から情報抽出（簡易版）
  extractLocationInfo(tweets: TwitterSearchResult[]): ExtractedInfo[] {
    const extracted: ExtractedInfo[] = []
    
    for (const tweet of tweets) {
      const text = tweet.text.toLowerCase()
      
      // カフェ・レストラン検索
      const cafeMatch = text.match(/(カフェ|cafe)[「」]?([^\s「」]{2,10})[「」]?/)
      if (cafeMatch) {
        extracted.push({
          type: 'location',
          name: cafeMatch[2],
          category: 'cafe',
          description: tweet.text,
          source_tweet: tweet.id,
          confidence: 0.7
        })
      }
      
      // レストラン検索
      const restaurantMatch = text.match(/(レストラン|お店|店)[「」]?([^\s「」]{2,10})[「」]?/)
      if (restaurantMatch) {
        extracted.push({
          type: 'location',
          name: restaurantMatch[2],
          category: 'restaurant',
          description: tweet.text,
          source_tweet: tweet.id,
          confidence: 0.6
        })
      }
    }
    
    return extracted
  }

  // アイテム情報抽出（簡易版）
  extractItemInfo(tweets: TwitterSearchResult[]): ExtractedInfo[] {
    const extracted: ExtractedInfo[] = []
    
    for (const tweet of tweets) {
      const text = tweet.text.toLowerCase()
      
      // ブランド名検索（一般的なブランド）
      const brands = ['zara', 'uniqlo', 'gu', 'nike', 'adidas', 'gucci', 'prada', 'しまむら', 'ユニクロ']
      for (const brand of brands) {
        if (text.includes(brand)) {
          extracted.push({
            type: 'item',
            name: `${brand}のアイテム`,
            category: 'fashion',
            description: tweet.text,
            source_tweet: tweet.id,
            confidence: 0.8
          })
        }
      }
      
      // 服・アクセサリー系
      const fashionMatch = text.match(/(服|バッグ|靴|アクセサリー)[「」]?([^\s「」]{2,15})[「」]?/)
      if (fashionMatch) {
        extracted.push({
          type: 'item',
          name: fashionMatch[2],
          category: 'fashion',
          description: tweet.text,
          source_tweet: tweet.id,
          confidence: 0.6
        })
      }
    }
    
    return extracted
  }

  // 重複削除
  private removeDuplicates(tweets: TwitterSearchResult[]): TwitterSearchResult[] {
    const seen = new Set()
    return tweets.filter(tweet => {
      if (seen.has(tweet.id)) {
        return false
      }
      seen.add(tweet.id)
      return true
    })
  }

  // 待機
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 実行関数
export async function searchYoniChannelInfo() {
  console.log('🐦 Twitter検索システム開始')
  
  const bearerToken = process.env.VITE_TWITTER_BEARER_TOKEN
  if (!bearerToken) {
    throw new Error('Twitter Bearer Token が設定されていません')
  }
  
  const searcher = new TwitterSearchSystem(bearerToken)
  
  try {
    // 1. 店舗情報検索
    console.log('\n📍 === 店舗・聖地情報検索 ===')
    const locationTweets = await searcher.searchLocationInfo()
    const locationInfo = searcher.extractLocationInfo(locationTweets)
    
    console.log(`📍 検索結果: ${locationTweets.length}件のツイート`)
    console.log(`📍 抽出結果: ${locationInfo.length}件の店舗情報`)
    
    // 2. アイテム情報検索
    console.log('\n👗 === アイテム・ファッション情報検索 ===')
    const itemTweets = await searcher.searchItemInfo()
    const itemInfo = searcher.extractItemInfo(itemTweets)
    
    console.log(`👗 検索結果: ${itemTweets.length}件のツイート`)
    console.log(`👗 抽出結果: ${itemInfo.length}件のアイテム情報`)
    
    // 3. 結果表示
    console.log('\n🏪 === 抽出された店舗情報 ===')
    locationInfo.slice(0, 5).forEach((info, i) => {
      console.log(`${i + 1}. ${info.name} (${info.category}) - 信頼度: ${info.confidence}`)
      console.log(`   "${info.description.substring(0, 50)}..."`)
    })
    
    console.log('\n🛍️ === 抽出されたアイテム情報 ===')
    itemInfo.slice(0, 5).forEach((info, i) => {
      console.log(`${i + 1}. ${info.name} (${info.category}) - 信頼度: ${info.confidence}`)
      console.log(`   "${info.description.substring(0, 50)}..."`)
    })
    
    return {
      locations: locationInfo,
      items: itemInfo,
      totalTweets: locationTweets.length + itemTweets.length
    }
    
  } catch (error: any) {
    console.error('❌ 検索システムエラー:', error.message)
    throw error
  }
}

// 実行用のコマンド
if (require.main === module) {
  searchYoniChannelInfo()
}