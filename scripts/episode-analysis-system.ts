/**
 * Option A: 手動精査システム
 * エピソードタイトル分析 + Google Search API活用
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

interface AnalysisResult {
  episodeId: string
  title: string
  keywords: string[]
  suggestedLocations: string[]
  suggestedItems: string[]
  searchQueries: string[]
  confidence: number
}

class EpisodeAnalysisSystem {
  
  // タイトルからキーワード抽出
  extractKeywords(title: string): string[] {
    const keywords: string[] = []
    
    // よにのチャンネル特有のパターン分析
    const patterns = {
      // 食事系
      food: ['朝食', '昼食', '夕食', '肉', 'カフェ', 'ランチ', '食事', 'グルメ'],
      // 活動系  
      activity: ['ドライブ', '旅行', 'お出かけ', 'デート', '散歩', '買い物'],
      // 感情・テーマ系
      theme: ['青春', '恋愛', '友情', '仕事', '日常', '特別'],
      // 場所系
      location: ['東京', '渋谷', '新宿', '原宿', '表参道', '六本木', '銀座'],
      // アイテム系
      fashion: ['服', 'コーデ', 'ファッション', 'アクセサリー', 'バッグ', '靴']
    }
    
    // パターンマッチング
    for (const [category, words] of Object.entries(patterns)) {
      for (const word of words) {
        if (title.includes(word)) {
          keywords.push(word)
        }
      }
    }
    
    // 【】内の内容を抽出
    const bracketMatch = title.match(/【(.+?)】/)
    if (bracketMatch) {
      keywords.push(bracketMatch[1])
    }
    
    return [...new Set(keywords)] // 重複除去
  }
  
  // キーワードから候補ロケーション生成
  suggestLocations(keywords: string[]): string[] {
    const suggestions: string[] = []
    
    const locationMapping = {
      '朝食': ['カフェ', 'ホテル朝食', 'パンケーキ店', 'モーニング'],
      '肉': ['焼肉店', 'ステーキハウス', 'ハンバーガー店', 'BBQ'],
      'ドライブ': ['ドライブイン', 'サービスエリア', '道の駅', '観光地'],
      'カフェ': ['スターバックス', 'ドトール', 'おしゃれカフェ', 'チェーン店'],
      '青春': ['学校', '公園', '映画館', '書店'],
      '買い物': ['ショッピングモール', '百貨店', 'セレクトショップ', 'ブランド店']
    }
    
    for (const keyword of keywords) {
      if (locationMapping[keyword]) {
        suggestions.push(...locationMapping[keyword])
      }
    }
    
    return [...new Set(suggestions)]
  }
  
  // キーワードから候補アイテム生成
  suggestItems(keywords: string[]): string[] {
    const suggestions: string[] = []
    
    const itemMapping = {
      '朝食': ['マグカップ', 'トートバッグ', 'カジュアルウェア'],
      '肉': ['カジュアルシャツ', 'デニム', 'スニーカー'],
      'ドライブ': ['サングラス', 'キャップ', 'リュック', 'スニーカー'],
      '青春': ['制服風アイテム', 'スクールバッグ', 'スニーカー', 'カーディガン'],
      '買い物': ['ショッピングバッグ', 'おしゃれアイテム', 'アクセサリー']
    }
    
    for (const keyword of keywords) {
      if (itemMapping[keyword]) {
        suggestions.push(...itemMapping[keyword])
      }
    }
    
    return [...new Set(suggestions)]
  }
  
  // Google検索クエリ生成
  generateSearchQueries(title: string, keywords: string[]): string[] {
    const queries: string[] = []
    
    // 基本的なクエリ
    queries.push(`よにのちゃんねる "${title}" ロケ地`)
    queries.push(`よにのちゃんねる "${title}" 着用`)
    queries.push(`よにのちゃんねる "${title}" 使用アイテム`)
    
    // キーワード組み合わせクエリ
    for (const keyword of keywords.slice(0, 3)) { // 上位3つのキーワード
      queries.push(`よにのちゃんねる ${keyword} 店舗`)
      queries.push(`よにのちゃんねる ${keyword} アイテム`)
      queries.push(`よにのちゃんねる メンバー ${keyword}`)
    }
    
    return queries
  }
  
  // 信頼度スコア計算
  calculateConfidence(keywords: string[], suggestedLocations: string[], suggestedItems: string[]): number {
    let score = 0
    
    // キーワード数による基本スコア
    score += Math.min(keywords.length * 20, 60)
    
    // 具体的なキーワードにボーナス
    const specificKeywords = ['朝食', '肉', 'カフェ', 'ドライブ']
    const specificCount = keywords.filter(k => specificKeywords.includes(k)).length
    score += specificCount * 15
    
    // 候補数による調整
    score += Math.min(suggestedLocations.length * 5, 20)
    score += Math.min(suggestedItems.length * 5, 20)
    
    return Math.min(score, 100)
  }
  
  // エピソード分析実行
  async analyzeEpisode(episodeId: string, title: string): Promise<AnalysisResult> {
    const keywords = this.extractKeywords(title)
    const suggestedLocations = this.suggestLocations(keywords)
    const suggestedItems = this.suggestItems(keywords)
    const searchQueries = this.generateSearchQueries(title, keywords)
    const confidence = this.calculateConfidence(keywords, suggestedLocations, suggestedItems)
    
    return {
      episodeId,
      title,
      keywords,
      suggestedLocations,
      suggestedItems,
      searchQueries,
      confidence
    }
  }
}

async function testAnalysisSystem() {
  console.log('🔍 エピソード分析システムテスト')
  console.log('='.repeat(50))
  
  try {
    // 開発環境のテストエピソードを取得
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('id, title')
      .limit(2)
    
    if (error) {
      console.log('❌ エピソード取得エラー:', error.message)
      return
    }
    
    const analyzer = new EpisodeAnalysisSystem()
    
    // 実際のよにのチャンネルエピソードタイトルでテスト
    const testTitles = [
      '#446【朝食!!】肉肉肉肉肉肉肉日',
      '#445【ドライブ!!】タイトルをつける程でもない日', 
      '#444【青春!!】山田さんだけ知らなかった日'
    ]
    
    console.log('📺 よにのチャンネルエピソード分析結果:\n')
    
    for (let i = 0; i < testTitles.length; i++) {
      const title = testTitles[i]
      const result = await analyzer.analyzeEpisode(`TEST00${i + 1}`, title)
      
      console.log(`🎬 ${result.title}`)
      console.log(`   📊 信頼度: ${result.confidence}%`)
      console.log(`   🔑 キーワード: ${result.keywords.join(', ')}`)
      console.log(`   🏪 候補ロケーション: ${result.suggestedLocations.join(', ')}`)
      console.log(`   👕 候補アイテム: ${result.suggestedItems.join(', ')}`)
      console.log(`   🔍 検索クエリ例:`)
      result.searchQueries.slice(0, 3).forEach((query, idx) => {
        console.log(`      ${idx + 1}. "${query}"`)
      })
      console.log('')
    }
    
    // 開発環境のエピソードでもテスト
    if (episodes && episodes.length > 0) {
      console.log('🧪 開発環境エピソード分析結果:\n')
      
      for (const episode of episodes) {
        const result = await analyzer.analyzeEpisode(episode.id, episode.title)
        
        console.log(`🎬 ${result.title}`)
        console.log(`   📊 信頼度: ${result.confidence}%`)
        console.log(`   🔑 キーワード: ${result.keywords.join(', ') || '未検出'}`)
        console.log(`   🏪 候補ロケーション: ${result.suggestedLocations.join(', ') || '未検出'}`)
        console.log(`   👕 候補アイテム: ${result.suggestedItems.join(', ') || '未検出'}`)
        console.log('')
      }
    }
    
    console.log('✅ 分析システムテスト完了')
    console.log('🎯 次のステップ: Google Search API連携')
    
  } catch (error: any) {
    console.error('❌ テストエラー:', error.message)
  }
}

// Run test
if (import.meta.url === `file://${process.argv[1]}`) {
  testAnalysisSystem().catch(console.error)
}