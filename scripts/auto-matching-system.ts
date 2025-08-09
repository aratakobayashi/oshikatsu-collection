/**
 * 自動マッチングシステム - エピソードのタイトル・説明文から店舗・アイテムを自動検出
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface MatchSuggestion {
  type: 'location' | 'item'
  entity_id: string
  entity_name: string
  confidence: number
  match_reason: string
  matched_text: string
}

interface AutoMatchResult {
  episode_id: string
  episode_title: string
  location_suggestions: MatchSuggestion[]
  item_suggestions: MatchSuggestion[]
  total_suggestions: number
}

export class AutoMatchingSystem {
  
  // エピソードから店舗候補を検出
  async findLocationMatches(episodeText: string, availableLocations: any[]): Promise<MatchSuggestion[]> {
    const suggestions: MatchSuggestion[] = []
    const text = episodeText.toLowerCase()
    
    for (const location of availableLocations) {
      let confidence = 0
      let matchReason = ''
      let matchedText = ''
      
      // 店舗名での直接マッチ
      if (text.includes(location.name.toLowerCase())) {
        confidence += 0.9
        matchReason += '店舗名完全一致, '
        matchedText = location.name
      }
      
      // 店舗名の一部マッチ（3文字以上）
      if (location.name.length >= 3) {
        const nameWords = location.name.split(/[\s　]/).filter(word => word.length >= 2)
        for (const word of nameWords) {
          if (text.includes(word.toLowerCase()) && word.length >= 2) {
            confidence += 0.6
            matchReason += `店舗名部分一致(${word}), `
            matchedText = word
          }
        }
      }
      
      // 住所での検索
      if (location.address) {
        const addressWords = location.address.split(/[\s　、]/).filter(word => word.length >= 2)
        for (const word of addressWords) {
          if (text.includes(word)) {
            confidence += 0.4
            matchReason += `住所一致(${word}), `
            matchedText += ` ${word}`
          }
        }
      }
      
      // 説明文での検索
      if (location.description) {
        const descWords = location.description.split(/[\s　、。]/).filter(word => word.length >= 2)
        for (const word of descWords) {
          if (text.includes(word.toLowerCase())) {
            confidence += 0.2
            matchReason += `説明文一致(${word}), `
          }
        }
      }
      
      // タグでの検索
      if (location.tags && location.tags.length > 0) {
        for (const tag of location.tags) {
          if (text.includes(tag.toLowerCase())) {
            confidence += 0.3
            matchReason += `タグ一致(${tag}), `
            matchedText += ` ${tag}`
          }
        }
      }
      
      // カフェ・レストラン関連キーワード
      const locationKeywords = [
        'カフェ', 'cafe', 'コーヒー', 'coffee', 
        'レストラン', 'restaurant', 'お店', '店舗',
        'ホテル', 'hotel', '宿泊', '泊まり'
      ]
      
      for (const keyword of locationKeywords) {
        if (text.includes(keyword)) {
          confidence += 0.1
          matchReason += `関連キーワード(${keyword}), `
        }
      }
      
      // 最小信頼度を満たす場合のみ提案
      if (confidence >= 0.3) {
        suggestions.push({
          type: 'location',
          entity_id: location.id,
          entity_name: location.name,
          confidence: Math.min(confidence, 1.0),
          match_reason: matchReason.replace(/, $/, ''),
          matched_text: matchedText.trim() || location.name
        })
      }
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }
  
  // エピソードからアイテム候補を検出
  async findItemMatches(episodeText: string, availableItems: any[]): Promise<MatchSuggestion[]> {
    const suggestions: MatchSuggestion[] = []
    const text = episodeText.toLowerCase()
    
    for (const item of availableItems) {
      let confidence = 0
      let matchReason = ''
      let matchedText = ''
      
      // アイテム名での直接マッチ
      if (text.includes(item.name.toLowerCase())) {
        confidence += 0.9
        matchReason += 'アイテム名完全一致, '
        matchedText = item.name
      }
      
      // ブランド名でのマッチ
      if (item.brand && text.includes(item.brand.toLowerCase())) {
        confidence += 0.8
        matchReason += `ブランド一致(${item.brand}), `
        matchedText = item.brand
      }
      
      // カテゴリでのマッチ
      if (item.category && text.includes(item.category.toLowerCase())) {
        confidence += 0.5
        matchReason += `カテゴリ一致(${item.category}), `
        matchedText += ` ${item.category}`
      }
      
      // 説明文での検索
      if (item.description) {
        const descWords = item.description.split(/[\s　、。]/).filter(word => word.length >= 2)
        for (const word of descWords) {
          if (text.includes(word.toLowerCase())) {
            confidence += 0.2
            matchReason += `説明文一致(${word}), `
          }
        }
      }
      
      // タグでの検索
      if (item.tags && item.tags.length > 0) {
        for (const tag of item.tags) {
          if (text.includes(tag.toLowerCase())) {
            confidence += 0.3
            matchReason += `タグ一致(${tag}), `
            matchedText += ` ${tag}`
          }
        }
      }
      
      // ファッション関連キーワード
      const fashionKeywords = [
        '服', '着用', '着てた', '着ていた', 'ファッション', 'コーデ',
        'バッグ', 'カバン', '持ってた', '持っている',
        'アクセサリー', 'ネックレス', 'ピアス', 'リング',
        '靴', 'シューズ', 'スニーカー', 'パンプス',
        'ワンピース', 'ジャケット', 'パンツ', 'スカート', 
        'ニット', 'セーター', 'コート', 'ダウン'
      ]
      
      for (const keyword of fashionKeywords) {
        if (text.includes(keyword)) {
          confidence += 0.1
          matchReason += `関連キーワード(${keyword}), `
        }
      }
      
      // 最小信頼度を満たす場合のみ提案
      if (confidence >= 0.3) {
        suggestions.push({
          type: 'item',
          entity_id: item.id,
          entity_name: item.name,
          confidence: Math.min(confidence, 1.0),
          match_reason: matchReason.replace(/, $/, ''),
          matched_text: matchedText.trim() || item.name
        })
      }
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }
  
  // 特定のエピソードに対する自動マッチング実行
  async analyzeEpisode(episodeId: string): Promise<AutoMatchResult | null> {
    try {
      // エピソード取得
      const { data: episode, error: episodeError } = await supabase
        .from('episodes')
        .select('*')
        .eq('id', episodeId)
        .single()
      
      if (episodeError || !episode) {
        console.error('エピソード取得エラー:', episodeError)
        return null
      }
      
      // 分析対象テキスト
      const episodeText = [
        episode.title || '',
        episode.description || ''
      ].join(' ')
      
      console.log(`📝 分析対象エピソード: ${episode.title}`)
      console.log(`📄 分析テキスト: ${episodeText.substring(0, 100)}...`)
      
      // そのセレブの店舗・アイテム取得
      if (!episode.celebrity_id) {
        console.warn('セレブIDが設定されていません')
        return null
      }
      
      const [locationsData, itemsData] = await Promise.all([
        supabase.from('locations').select('*').eq('celebrity_id', episode.celebrity_id),
        supabase.from('items').select('*').eq('celebrity_id', episode.celebrity_id)
      ])
      
      const locations = locationsData.data || []
      const items = itemsData.data || []
      
      console.log(`🏪 分析対象店舗: ${locations.length}件`)
      console.log(`🛍️ 分析対象アイテム: ${items.length}件`)
      
      // マッチング実行
      const [locationSuggestions, itemSuggestions] = await Promise.all([
        this.findLocationMatches(episodeText, locations),
        this.findItemMatches(episodeText, items)
      ])
      
      return {
        episode_id: episodeId,
        episode_title: episode.title,
        location_suggestions: locationSuggestions.slice(0, 5), // 上位5件
        item_suggestions: itemSuggestions.slice(0, 5), // 上位5件
        total_suggestions: locationSuggestions.length + itemSuggestions.length
      }
      
    } catch (error) {
      console.error('分析エラー:', error)
      return null
    }
  }
  
  // 全エピソードに対する一括分析
  async analyzeAllEpisodes(celebrityId?: string): Promise<AutoMatchResult[]> {
    try {
      console.log('🤖 全エピソード自動マッチング開始')
      
      let query = supabase.from('episodes').select('*')
      if (celebrityId) {
        query = query.eq('celebrity_id', celebrityId)
      }
      
      const { data: episodes, error } = await query
      
      if (error) {
        console.error('エピソード取得エラー:', error)
        return []
      }
      
      console.log(`📊 分析対象エピソード: ${episodes?.length || 0}件`)
      
      const results: AutoMatchResult[] = []
      
      for (const episode of episodes || []) {
        console.log(`\\n🔍 分析中: ${episode.title}`)
        
        const result = await this.analyzeEpisode(episode.id)
        if (result && result.total_suggestions > 0) {
          results.push(result)
          console.log(`✅ 提案数: 店舗${result.location_suggestions.length}件, アイテム${result.item_suggestions.length}件`)
        } else {
          console.log('⏭️  提案なし')
        }
        
        // API制限対策
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      console.log(`\\n🎉 分析完了: ${results.length}件のエピソードに提案あり`)
      return results
      
    } catch (error) {
      console.error('一括分析エラー:', error)
      return []
    }
  }
}

// 実行関数
export async function runAutoMatching(celebrityId?: string) {
  const system = new AutoMatchingSystem()
  
  if (celebrityId) {
    console.log(`🎯 対象セレブ: ${celebrityId}`)
    const results = await system.analyzeAllEpisodes(celebrityId)
    
    // 結果表示
    for (const result of results) {
      console.log(`\\n📺 ${result.episode_title}`)
      
      if (result.location_suggestions.length > 0) {
        console.log('🏪 店舗提案:')
        for (const suggestion of result.location_suggestions) {
          console.log(`  - ${suggestion.entity_name} (信頼度: ${(suggestion.confidence * 100).toFixed(0)}%)`)
          console.log(`    理由: ${suggestion.match_reason}`)
        }
      }
      
      if (result.item_suggestions.length > 0) {
        console.log('🛍️ アイテム提案:')
        for (const suggestion of result.item_suggestions) {
          console.log(`  - ${suggestion.entity_name} (信頼度: ${(suggestion.confidence * 100).toFixed(0)}%)`)
          console.log(`    理由: ${suggestion.match_reason}`)
        }
      }
    }
    
    return results
  } else {
    return await system.analyzeAllEpisodes()
  }
}

// コマンドライン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const celebrityId = process.argv[2] || 'UC2alHD2WkakOiTxCxF-uMAg' // よにのチャンネル
  runAutoMatching(celebrityId).catch(console.error)
}