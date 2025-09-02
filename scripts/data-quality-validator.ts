#!/usr/bin/env node

/**
 * データ品質検証システム
 * 新規データ追加時や既存データ更新時に自動でチェック
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  score: number // 0-100
}

interface LocationData {
  name: string
  address: string
  tabelog_url?: string
  description?: string
  episode_title?: string
}

class DataQualityValidator {
  
  /**
   * 食べログURLの有効性を検証
   */
  async validateTabelogUrl(url: string): Promise<{ valid: boolean, error?: string }> {
    if (!url) return { valid: false, error: '食べログURLが設定されていません' }
    
    // 基本的なフォーマットチェック
    if (!url.startsWith('https://tabelog.com/')) {
      return { valid: false, error: '食べログURLの形式が正しくありません' }
    }
    
    // URLパターンチェック（基本的なパスの検証）
    const urlPattern = /^https:\/\/tabelog\.com\/[^/]+\/[^/]+\/[^/]+\/\d+\/$/
    if (!urlPattern.test(url)) {
      return { valid: false, error: '食べログURLのパスが正しくありません' }
    }
    
    try {
      // 実際のHTTPアクセス確認（ヘッドリクエスト）
      const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      if (response.status === 404) {
        return { valid: false, error: '食べログページが見つかりません（404）' }
      }
      if (response.status >= 400) {
        return { valid: false, error: `食べログページにアクセスできません（HTTP ${response.status}）` }
      }
      return { valid: true }
    } catch (error) {
      return { valid: false, error: `食べログURLへのアクセスに失敗: ${error}` }
    }
  }
  
  /**
   * 住所とエピソード地域の一致を検証
   */
  validateLocationConsistency(address: string, episodeTitle: string): { valid: boolean, error?: string } {
    if (!address || !episodeTitle) {
      return { valid: false, error: '住所またはエピソードタイトルが不足' }
    }
    
    // エピソードタイトルから地域を抽出
    const regionMatches = episodeTitle.match(/(東京都|神奈川県|千葉県|埼玉県|茨城県|群馬県|栃木県|山梨県|静岡県|長野県|新潟県|北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|愛知県|岐阜県|三重県|大阪府|京都府|兵庫県|奈良県|和歌山県|滋賀県|広島県|岡山県|山口県|島根県|鳥取県|香川県|徳島県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県|豊島区|文京区|江東区|武蔵野市|中野区|世田谷区|杉並区|目黒区|渋谷区|新宿区|千代田区|中央区|港区|台東区|墨田区|品川区|大田区|練馬区|板橋区|北区|荒川区|足立区|葛飾区|江戸川区)/)
    
    if (regionMatches) {
      const episodeRegion = regionMatches[1]
      if (!address.includes(episodeRegion)) {
        // 特例チェック：武蔵野市は東京都なので許可
        if (episodeRegion === '武蔵野市' && address.includes('東京都')) {
          return { valid: true }
        }
        return { 
          valid: false, 
          error: `住所不一致: エピソード地域「${episodeRegion}」vs 実際の住所「${address}」` 
        }
      }
    }
    
    return { valid: true }
  }
  
  /**
   * 店名と提供料理の整合性を検証
   */
  validateNameDishConsistency(restaurantName: string, episodeTitle: string): { valid: boolean, warnings: string[] } {
    const warnings: string[] = []
    
    // 料理タイプの抽出
    const dishTypes = {
      '中華': ['担々麺', '餃子', '焼売', 'チャーハン', '中華'],
      '和食': ['煮魚', '定食', '丼', 'うどん', 'そば'],
      '洋食': ['ナポリタン', 'ハンバーグ', 'パスタ', 'オムライス'],
      'とんかつ': ['とんかつ', 'カツ'],
      '焼肉': ['焼肉', 'カルビ', 'ホルモン'],
      'お好み焼き': ['お好み焼き'],
      '沖縄料理': ['ソーキそば', 'ちゃんぷる'],
      '喫茶店': ['ナポリタン', 'コーヒー', '喫茶'],
      '居酒屋': ['カレー', '特辛']
    }
    
    for (const [category, dishes] of Object.entries(dishTypes)) {
      const hasDish = dishes.some(dish => episodeTitle.includes(dish))
      const hasRestaurantType = restaurantName.includes(category) || 
                                (category === '喫茶店' && (restaurantName.includes('カフェ') || restaurantName.includes('喫茶'))) ||
                                (category === '居酒屋' && restaurantName.includes('すみれ'))
      
      if (hasDish && !hasRestaurantType) {
        warnings.push(`料理「${dishes.find(d => episodeTitle.includes(d))}」と店名「${restaurantName}」の整合性を確認してください`)
      }
    }
    
    return { valid: warnings.length === 0, warnings }
  }
  
  /**
   * LinkSwitch設定の検証
   */
  validateLinkSwitchSetup(affiliateInfo: any): { valid: boolean, error?: string } {
    if (!affiliateInfo || !affiliateInfo.linkswitch) {
      return { valid: false, error: 'LinkSwitch設定が見つかりません' }
    }
    
    const linkswitch = affiliateInfo.linkswitch
    if (linkswitch.status !== 'active') {
      return { valid: false, error: 'LinkSwitchが非アクティブです' }
    }
    
    if (!linkswitch.original_url) {
      return { valid: false, error: 'LinkSwitchの元URLが設定されていません' }
    }
    
    return { valid: true }
  }
  
  /**
   * 総合的なロケーションデータ検証
   */
  async validateLocationData(data: LocationData): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      score: 100
    }
    
    // 必須項目チェック
    if (!data.name) {
      result.errors.push('店名が設定されていません')
      result.score -= 30
    }
    
    if (!data.address) {
      result.errors.push('住所が設定されていません')
      result.score -= 30
    }
    
    // 食べログURL検証
    if (data.tabelog_url) {
      const urlValidation = await this.validateTabelogUrl(data.tabelog_url)
      if (!urlValidation.valid) {
        result.errors.push(`食べログURL: ${urlValidation.error}`)
        result.score -= 25
      }
    } else {
      result.warnings.push('食べログURLが設定されていません（収益化不可）')
      result.score -= 10
    }
    
    // 住所とエピソードの一致性検証
    if (data.episode_title && data.address) {
      const locationValidation = this.validateLocationConsistency(data.address, data.episode_title)
      if (!locationValidation.valid) {
        result.errors.push(locationValidation.error!)
        result.score -= 20
      }
    }
    
    // 店名と料理の整合性検証
    if (data.name && data.episode_title) {
      const consistencyValidation = this.validateNameDishConsistency(data.name, data.episode_title)
      result.warnings.push(...consistencyValidation.warnings)
      if (consistencyValidation.warnings.length > 0) {
        result.score -= 5 * consistencyValidation.warnings.length
      }
    }
    
    result.isValid = result.errors.length === 0
    result.score = Math.max(0, result.score)
    
    return result
  }
  
  /**
   * データベース内の既存データを一括検証
   */
  async validateExistingData(celebritySlug: string) {
    console.log(`🔍 ${celebritySlug} のデータ検証開始...\n`)
    
    // セレブリティIDを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', celebritySlug)
      .single()
    
    if (!celebrity) {
      console.error(`❌ ${celebritySlug} のデータが見つかりません`)
      return
    }
    
    // エピソードとロケーションデータを取得
    const { data: episodes } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        episode_locations(
          location_id,
          locations(
            id,
            name,
            address,
            tabelog_url,
            description,
            affiliate_info
          )
        )
      `)
      .eq('celebrity_id', celebrity.id)
      .like('title', '%Season1%')
    
    if (!episodes) return
    
    console.log('📊 検証結果:\n')
    
    let totalScore = 0
    let validCount = 0
    let totalCount = 0
    
    for (const episode of episodes) {
      const location = episode.episode_locations?.[0]?.locations
      if (!location) continue
      
      totalCount++
      const episodeNumber = episode.title.match(/第(\d+)話/)?.[1] || '不明'
      
      const validation = await this.validateLocationData({
        name: location.name,
        address: location.address,
        tabelog_url: location.tabelog_url,
        description: location.description,
        episode_title: episode.title
      })
      
      console.log(`第${episodeNumber}話: ${location.name}`)
      console.log(`   スコア: ${validation.score}/100`)
      
      if (validation.isValid) {
        console.log(`   ✅ 検証通過`)
        validCount++
      } else {
        console.log(`   ❌ 問題あり`)
        validation.errors.forEach(error => {
          console.log(`      エラー: ${error}`)
        })
      }
      
      validation.warnings.forEach(warning => {
        console.log(`      警告: ${warning}`)
      })
      
      // LinkSwitch検証
      const linkSwitchValidation = this.validateLinkSwitchSetup(location.affiliate_info)
      if (!linkSwitchValidation.valid) {
        console.log(`      LinkSwitch: ${linkSwitchValidation.error}`)
      } else {
        console.log(`      LinkSwitch: ✅`)
      }
      
      console.log('')
      totalScore += validation.score
    }
    
    const averageScore = totalCount > 0 ? totalScore / totalCount : 0
    console.log('=' .repeat(60))
    console.log(`📈 総合結果:`)
    console.log(`   検証対象: ${totalCount}エピソード`)
    console.log(`   合格: ${validCount}エピソード`)
    console.log(`   合格率: ${Math.round(validCount / totalCount * 100)}%`)
    console.log(`   平均スコア: ${averageScore.toFixed(1)}/100`)
    
    if (averageScore >= 80) {
      console.log(`   🎉 優秀 (80点以上)`)
    } else if (averageScore >= 60) {
      console.log(`   ⚠️ 要改善 (60-79点)`)
    } else {
      console.log(`   🚨 要緊急対応 (60点未満)`)
    }
  }
}

// 実行例
async function main() {
  const validator = new DataQualityValidator()
  await validator.validateExistingData('matsushige-yutaka')
}

// 実行
if (require.main === module) {
  main().catch(console.error)
}

export { DataQualityValidator }