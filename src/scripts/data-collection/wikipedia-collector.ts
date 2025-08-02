// src/scripts/data-collection/wikipedia-collector.ts

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 環境変数読み込み
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!

// デバッグ用（環境変数チェック）
console.log('🔍 Environment Check:')
console.log(`SUPABASE_URL: ${SUPABASE_URL ? '✅ SET' : '❌ NOT SET'}`)
console.log(`SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET'}`)
console.log('---')

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 型定義
interface WikipediaSummaryData {
  title: string
  extract?: string
  description?: string
  thumbnail?: {
    source: string
    width: number
    height: number
  }
  originalimage?: {
    source: string
    width: number
    height: number
  }
  content_urls?: {
    desktop: { page: string }
    mobile: { page: string }
  }
  pageid: number
  lang: string
  timestamp: string
  coordinates?: {
    lat: number
    lon: number
  }
}

interface WikipediaInfoboxData {
  birth_date?: string
  birth_place?: string
  nationality?: string
  agency?: string
  debut_date?: string
  years_active?: string
  height?: string
  blood_type?: string
  genre?: string
  associated_acts?: string
  full_name_ja?: string
  romanized_name?: string
  [key: string]: string | undefined
}

interface CelebrityData {
  name: string
  slug: string
  bio: string
  image_url: string
  birth_date?: Date | null
  place_of_birth?: string | null
  nationality: string
  gender?: number | null
  height_cm?: number | null
  blood_type?: string | null
  debut_date?: Date | null
  years_active?: string | null
  agency?: string | null
  group_name?: string | null
  also_known_as?: string | null
  known_for_department?: string | null
  wikipedia_url?: string | null
  wikipedia_page_id?: number | null
  wikipedia_last_modified?: Date | null
  social_media_urls: Record<string, string>
  career_highlights: Array<{ year: number; achievement: string; type?: string }>
  associated_groups: Array<{ name: string; role?: string; period?: string }>
  data_sources: string[]
  data_completeness_score: number
  last_verified_at: Date
}

interface CollectionResult {
  success: boolean
  celebrity_id?: string
  name: string
  error?: string
  data_completeness_score: number
  wikipedia_found: boolean
  processing_time: number
}

// **Wikipedia データ抽出・変換クラス**
export class WikipediaDataExtractor {
  
  // 基本情報の抽出
  private extractBasicInfo(summaryData: WikipediaSummaryData) {
    return {
      name: summaryData.title,
      bio: summaryData.extract || '',
      image_url: summaryData.thumbnail?.source || summaryData.originalimage?.source || '',
      wikipedia_url: summaryData.content_urls?.desktop?.page || '',
      wikipedia_page_id: summaryData.pageid,
      wikipedia_last_modified: summaryData.timestamp ? new Date(summaryData.timestamp) : null,
      slug: this.generateSlug(summaryData.title)
    }
  }

  // Infoboxからの詳細情報抽出
  private async extractDetailedInfo(pageTitle: string): Promise<WikipediaInfoboxData> {
    try {
      console.log(`📄 Infobox情報を取得中: ${pageTitle}`)
      
      interface WikipediaQueryResponse {
        query?: {
          pages: Record<string, {
            revisions?: Array<{ '*': string }>
          }>
        }
      }

      const response = await fetch(
        `https://ja.wikipedia.org/w/api.php?` + 
        `action=query&format=json&origin=*` +
        `&prop=revisions&rvprop=content&rvlimit=1` +
        `&titles=${encodeURIComponent(pageTitle)}`
      )
      
      const data: WikipediaQueryResponse = await response.json()
      const pages = data.query?.pages
      
      if (!pages) return {}
      
      const page = Object.values(pages)[0]
      const content = page?.revisions?.[0]?.['*']
      
      if (!content) return {}
      
      // Infoboxからデータを抽出
      const infobox = this.parseInfobox(content)
      
      return {
        birth_date: infobox.birth_date || infobox['生年月日'] || infobox['誕生日'],
        birth_place: infobox.birth_place || infobox['出身地'] || infobox['出生地'],
        nationality: infobox.nationality || infobox['国籍'] || '日本',
        agency: infobox.agency || infobox.label || infobox['事務所'] || infobox['レーベル'],
        debut_date: infobox.debut || infobox['デビュー'] || infobox['活動開始'],
        years_active: infobox.years_active || infobox['活動期間'] || infobox['活動年'],
        height: infobox.height || infobox['身長'],
        blood_type: infobox.blood_type || infobox['血液型'],
        genre: infobox.genre || infobox['ジャンル'],
        associated_acts: infobox.associated_acts || infobox['関連グループ'] || infobox['関連アーティスト'],
        full_name_ja: infobox.full_name || infobox['本名'] || infobox['氏名'],
        romanized_name: infobox.romanized || infobox['ローマ字']
      }
    } catch (error) {
      console.error('Infobox抽出エラー:', error)
      return {}
    }
  }

  // Infoboxの解析
  private parseInfobox(content: string): Record<string, string> {
    const infobox: Record<string, string> = {}
    
    try {
      // Infoboxの正規表現パターン（より厳密に）
      const infoboxPattern = /\{\{[Ii]nfobox[^}]*?\|([^}]*?)\}\}/s
      const match = content.match(infoboxPattern)
      
      if (match) {
        const infoboxContent = match[1]
        
        // フィールドの抽出（改善版）
        const fieldPattern = /\|\s*([^=|]+?)\s*=\s*([^|\n]*?)(?=\s*\||\s*\}\})/g
        let fieldMatch
        
        while ((fieldMatch = fieldPattern.exec(infoboxContent)) !== null) {
          const key = fieldMatch[1].trim()
          let value = fieldMatch[2].trim()
          
          // Wikiリンクの除去 [[リンク|表示]] → 表示
          value = value.replace(/\[\[([^|]+)(\|([^\]]+))?\]\]/g, (_fullMatch, link, _pipeMatch, display) => {
            return display || link
          })
          
          // HTMLタグの除去
          value = value.replace(/<[^>]*>/g, '')
          
          // 参照の除去
          value = value.replace(/\{\{[^}]*\}\}/g, '')
          
          if (value && value !== '') {
            infobox[key] = value
          }
        }
      }
    } catch (error) {
      console.error('Infobox解析エラー:', error)
    }
    
    return infobox
  }

  // 各種パーサー
  private parseDate(dateStr?: string): Date | null {
    if (!dateStr) return null
    
    const patterns = [
      /(\d{4})年(\d{1,2})月(\d{1,2})日/,  // 1983年6月17日
      /(\d{4})-(\d{1,2})-(\d{1,2})/,      // 1983-6-17
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,    // 6/17/1983
      /(\d{4})年(\d{1,2})月/,             // 1983年6月
      /(\d{4})年/,                        // 1983年
    ]
    
    for (const pattern of patterns) {
      const match = dateStr.match(pattern)
      if (match) {
        const year = parseInt(match[1] || match[3])
        const month = parseInt(match[2] || '1') 
        const day = parseInt(match[3] || match[1] || '1')
        
        if (year >= 1900 && year <= new Date().getFullYear() + 10) {
          return new Date(year, month - 1, day)
        }
      }
    }
    
    return null
  }

  private parseHeight(heightStr?: string): number | null {
    if (!heightStr) return null
    
    const match = heightStr.match(/(\d+(?:\.\d+)?)\s*(?:cm|センチ|センチメートル)/i)
    if (match) {
      const height = parseFloat(match[1])
      return (height >= 100 && height <= 250) ? height : null
    }
    
    return null
  }

  private parseArray(str?: string): string[] {
    if (!str) return []
    
    return str.split(/[,、;・\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0 && item.length <= 50)
      .slice(0, 10) // 最大10件
  }

  private generateSlug(name: string): string {
    return name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-ぁ-んァ-ヶー一-龯]/g, '')
      .substring(0, 100)
  }

  // 性別の推定
  private detectGender(extract: string, infobox: WikipediaInfoboxData): number | null {
    const text = `${extract} ${Object.values(infobox).join(' ')}`
    
    const femaleKeywords = ['女性', '女優', '女子', '彼女', 'actress', 'girl']
    const maleKeywords = ['男性', '俳優', '男子', '彼', 'actor', 'boy']
    
    const femaleScore = femaleKeywords.reduce((score, keyword) => 
      score + (text.toLowerCase().includes(keyword) ? 1 : 0), 0)
    const maleScore = maleKeywords.reduce((score, keyword) => 
      score + (text.toLowerCase().includes(keyword) ? 1 : 0), 0)
    
    if (femaleScore > maleScore) return 1
    if (maleScore > femaleScore) return 2
    return null
  }

  // グループ名の推定
  private detectGroupName(extract: string, infobox: WikipediaInfoboxData): string | null {
    const groupKeywords = [
      '嵐', 'King & Prince', 'キンプリ', 'SixTONES', 'Snow Man',
      '乃木坂46', '櫻坂46', '日向坂46', 'AKB48', 'SKE48', 'NMB48', 'HKT48',
      'TWICE', 'BLACKPINK', 'NewJeans', 'IVE', 'aespa', 'ITZY'
    ]
    
    const text = `${extract} ${Object.values(infobox).join(' ')}`
    
    for (const group of groupKeywords) {
      if (text.includes(group)) {
        return group
      }
    }
    
    // Infoboxから直接取得
    if (infobox.associated_acts) {
      return infobox.associated_acts.split(/[,、]/).map(s => s.trim())[0] || null
    }
    
    return null
  }

  // 完全性スコア計算
  private calculateCompletenessScore(data: Partial<CelebrityData>): number {
    let score = 0
    
    // 必須フィールド（基本60%）
    if (data.name && data.name.length > 0) score += 0.20
    if (data.bio && data.bio.length > 50) score += 0.20
    if (data.image_url && data.image_url.length > 0) score += 0.20
    
    // 重要フィールド（30%）
    if (data.birth_date) score += 0.10
    if (data.agency && data.agency.length > 0) score += 0.10
    if (data.group_name && data.group_name.length > 0) score += 0.10
    
    // 追加フィールド（10%）
    if (data.place_of_birth && data.place_of_birth.length > 0) score += 0.02
    if (data.debut_date) score += 0.03
    if (data.height_cm && data.height_cm > 0) score += 0.02
    if (data.wikipedia_url && data.wikipedia_url.length > 0) score += 0.03
    
    return Math.min(score, 1.0)
  }

  // メイン抽出処理
  public async extractCelebrityData(name: string): Promise<CelebrityData> {
    console.log(`🔍 Wikipedia情報抽出開始: ${name}`)
    
    // Step 1: 基本情報取得
    const summaryResponse = await fetch(
      `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
    )
    
    if (!summaryResponse.ok) {
      throw new Error(`Wikipedia API Error: ${summaryResponse.status}`)
    }
    
    const summaryData: WikipediaSummaryData = await summaryResponse.json()
    
    // Step 2: 基本情報抽出
    const basicInfo = this.extractBasicInfo(summaryData)
    
    // Step 3: 詳細情報抽出
    const detailedInfo = await this.extractDetailedInfo(name)
    
    // Step 4: データ統合・変換
    const celebrityData: CelebrityData = {
      ...basicInfo,
      birth_date: this.parseDate(detailedInfo.birth_date),
      place_of_birth: detailedInfo.birth_place || null,
      nationality: detailedInfo.nationality || '日本',
      gender: this.detectGender(basicInfo.bio, detailedInfo),
      height_cm: this.parseHeight(detailedInfo.height),
      blood_type: detailedInfo.blood_type || null,
      debut_date: this.parseDate(detailedInfo.debut_date),
      years_active: detailedInfo.years_active || null,
      agency: detailedInfo.agency || null,
      group_name: this.detectGroupName(basicInfo.bio, detailedInfo),
      also_known_as: detailedInfo.full_name_ja || null,
      known_for_department: detailedInfo.genre || 'エンターテインメント',
      social_media_urls: {},
      career_highlights: [],
      associated_groups: detailedInfo.associated_acts ? 
        this.parseArray(detailedInfo.associated_acts).map(name => ({ name })) : [],
      data_sources: ['wikipedia'],
      data_completeness_score: 0, // 後で計算
      last_verified_at: new Date()
    }
    
    // Step 5: 完全性スコア計算
    celebrityData.data_completeness_score = this.calculateCompletenessScore(celebrityData)
    
    console.log(`✅ 抽出完了: ${name} (完全性: ${Math.round(celebrityData.data_completeness_score * 100)}%)`)
    
    return celebrityData
  }
}

// **Supabase保存クラス**
export class CelebrityDataSaver {
  private supabase = supabase

  public async saveCelebrity(celebrityData: CelebrityData): Promise<string> {
    console.log(`💾 Supabase保存開始: ${celebrityData.name}`)
    
    try {
      const { data, error } = await this.supabase
        .from('celebrities_new')
        .upsert({
          ...celebrityData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'slug',
          ignoreDuplicates: false
        })
        .select('id')
        .single()
      
      if (error) {
        throw error
      }
      
      console.log(`✅ 保存完了: ${celebrityData.name} (ID: ${data.id})`)
      return data.id
      
    } catch (error) {
      console.error(`❌ 保存エラー: ${celebrityData.name}`, error)
      throw error
    }
  }
}

// **メイン収集クラス**
export class WikipediaCelebrityCollector {
  private extractor = new WikipediaDataExtractor()
  private saver = new CelebrityDataSaver()

  // 単一Celebrity収集
  public async collectSingleCelebrity(name: string): Promise<CollectionResult> {
    const startTime = Date.now()
    
    try {
      console.log(`\n🚀 Celebrity収集開始: ${name}`)
      
      // Wikipedia情報抽出
      const celebrityData = await this.extractCelebrityData(name)
      
      // Supabase保存
      const celebrityId = await this.saver.saveCelebrity(celebrityData)
      
      const processingTime = Date.now() - startTime
      
      const result: CollectionResult = {
        success: true,
        celebrity_id: celebrityId,
        name: celebrityData.name,
        data_completeness_score: celebrityData.data_completeness_score,
        wikipedia_found: true,
        processing_time: processingTime
      }
      
      console.log(`🎉 収集完了: ${name} (${processingTime}ms)`)
      return result
      
    } catch (error) {
      const processingTime = Date.now() - startTime
      
      console.error(`❌ 収集失敗: ${name}`, error)
      
      return {
        success: false,
        name: name,
        error: error instanceof Error ? error.message : String(error),
        data_completeness_score: 0,
        wikipedia_found: false,
        processing_time: processingTime
      }
    }
  }

  // 複数Celebrity一括収集
  public async collectMultipleCelebrities(names: string[]): Promise<CollectionResult[]> {
    console.log(`🚀 一括収集開始: ${names.length}名`)
    
    const results: CollectionResult[] = []
    
    for (const [index, name] of names.entries()) {
      console.log(`\n--- [${index + 1}/${names.length}] ---`)
      
      const result = await this.collectSingleCelebrity(name)
      results.push(result)
      
      // プログレス表示
      const successCount = results.filter(r => r.success).length
      const avgScore = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.data_completeness_score, 0) / Math.max(successCount, 1)
      
      console.log(`📊 進捗: ${index + 1}/${names.length} (成功: ${successCount}, 平均品質: ${Math.round(avgScore * 100)}%)`)
      
      // API制限対策: 1秒待機
      if (index < names.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.log(`\n🎉 一括収集完了!`)
    console.log(`✅ 成功: ${results.filter(r => r.success).length}/${names.length}`)
    console.log(`❌ 失敗: ${results.filter(r => !r.success).length}/${names.length}`)
    
    return results
  }

  // 便利メソッド（既存メソッドのラッパー）
  private async extractCelebrityData(name: string): Promise<CelebrityData> {
    return this.extractor.extractCelebrityData(name)
  }
}

// **プリセット Celebrity リスト**
export const PRESET_CELEBRITIES = {
  // ジャニーズ系
  johnnys: [
    '二宮和也', '櫻井翔', '相葉雅紀', '松本潤', '大野智', // 嵐
    '平野紫耀', '永瀬廉', '高橋海人', '岸優太', '神宮寺勇太', '岩橋玄樹', // King & Prince
    '松村北斗', '京本大我', '田中樹', '森本慎太郎', '髙地優吾', 'ジェシー', // SixTONES
    '岩本照', '深澤辰哉', '佐久間大介', '阿部亮平', '宮舘涼太', '向井康二', '目黒蓮', '渡辺翔太', 'ラウール', // Snow Man
  ],
  
  // 坂道系
  sakamichi: [
    '白石麻衣', '齋藤飛鳥', '生田絵梨花', '松村沙友理', '高山一実', // 乃木坂46
    '森田ひかる', '山﨑天', '藤吉夏鈴', '田村保乃', '井上梨名', // 櫻坂46
    '小坂菜緒', '加藤史帆', '佐々木久美', '齊藤京子', '高瀬愛奈', // 日向坂46
  ],
  
  // AKB48系
  akb: [
    '指原莉乃', '山本彩', '宮脇咲良', '松井珠理奈', '横山由依',
    '峯岸みなみ', '柏木由紀', '込山榛香', '向井地美音', '岡田奈々'
  ],
  
  // 女優・俳優
  actors: [
    '新垣結衣', '石原さとみ', '長澤まさみ', '綾瀬はるか', '吉高由里子',
    '福山雅治', '木村拓哉', '佐藤健', '菅田将暉', '山田涼介'
  ],
  
  // K-POP (日本で人気)
  kpop: [
    'IU', 'TWICE', 'BLACKPINK', 'NewJeans', 'IVE', 'aespa', 'ITZY',
    'BTS', 'SEVENTEEN', 'STRAY KIDS', 'TOMORROW X TOGETHER', 'NCT'
  ]
}

// **テスト・実行関数**
export const testWikipediaCollection = async (): Promise<void> => {
  console.log('🧪 Wikipedia収集テスト開始...')
  
  const collector = new WikipediaCelebrityCollector()
  
  // 単一テスト
  console.log('\n=== 単一Celebrity テスト ===')
  const singleResult = await collector.collectSingleCelebrity('新垣結衣')
  
  if (singleResult.success) {
    console.log(`✅ テスト成功: ${singleResult.name}`)
    console.log(`📊 完全性スコア: ${Math.round(singleResult.data_completeness_score * 100)}%`)
    console.log(`⏱️  処理時間: ${singleResult.processing_time}ms`)
  } else {
    console.log(`❌ テスト失敗: ${singleResult.error}`)
  }
  
  // 小規模バッチテスト
  console.log('\n=== 小規模バッチテスト ===')
  const testCelebrities = ['二宮和也', '齋藤飛鳥', '指原莉乃']
  const batchResults = await collector.collectMultipleCelebrities(testCelebrities)
  
  // 結果サマリー
  const successResults = batchResults.filter(r => r.success)
  const avgScore = successResults.reduce((sum, r) => sum + r.data_completeness_score, 0) / Math.max(successResults.length, 1)
  const avgTime = batchResults.reduce((sum, r) => sum + r.processing_time, 0) / batchResults.length
  
  console.log('\n📊 テスト結果サマリー:')
  console.log(`✅ 成功率: ${successResults.length}/${batchResults.length} (${Math.round(successResults.length/batchResults.length*100)}%)`)
  console.log(`📈 平均品質: ${Math.round(avgScore * 100)}%`)
  console.log(`⏱️  平均処理時間: ${Math.round(avgTime)}ms`)
  
  // 高品質データの表示
  const highQualityResults = successResults.filter(r => r.data_completeness_score >= 0.7)
  if (highQualityResults.length > 0) {
    console.log(`\n⭐ 高品質データ (70%以上): ${highQualityResults.length}件`)
    highQualityResults.forEach(r => {
      console.log(`  - ${r.name}: ${Math.round(r.data_completeness_score * 100)}%`)
    })
  }
}

// **本格収集実行関数**
export const runFullWikipediaCollection = async (categoryKey: keyof typeof PRESET_CELEBRITIES = 'johnnys'): Promise<void> => {
  console.log(`🚀 本格Wikipedia収集開始: ${categoryKey}`)
  
  const collector = new WikipediaCelebrityCollector()
  const celebrities = PRESET_CELEBRITIES[categoryKey]
  
  console.log(`📋 対象: ${celebrities.length}名`)
  console.log(`📂 カテゴリ: ${categoryKey}`)
  
  const results = await collector.collectMultipleCelebrities(celebrities)
  
  // 結果保存
  const fileName = `wikipedia-collection-${categoryKey}-${new Date().toISOString().split('T')[0]}.json`
  const jsonData = JSON.stringify(results, null, 2)
  
  if (typeof window === 'undefined') {
    const fs = await import('fs')
    fs.writeFileSync(`./data/${fileName}`, jsonData)
    console.log(`💾 結果保存: ./data/${fileName}`)
  }
  
  console.log('\n🎉 本格収集完了!')
}

// **Node.js環境での実行**
const main = async () => {
  console.log('🚀 Wikipedia Celebrity Collector 実行開始...\n')
  
  try {
    // テスト実行
    await testWikipediaCollection()
    
    console.log('\n' + '='.repeat(50))
    console.log('次のステップ:')
    console.log('1. テスト結果を確認')
    console.log('2. 本格収集: await runFullWikipediaCollection("johnnys")')
    console.log('3. 他カテゴリ: await runFullWikipediaCollection("actors")')
    console.log('4. 全カテゴリ: 各カテゴリを順次実行')
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// Node.js環境での実行
if (typeof window === 'undefined') {
  main()
}

/*
使用例:

// 単一Celebrity
const collector = new WikipediaCelebrityCollector()
const result = await collector.collectSingleCelebrity('新垣結衣')

// バッチ処理
const results = await collector.collectMultipleCelebrities(['二宮和也', '齋藤飛鳥'])

// プリセット使用
await runFullWikipediaCollection('johnnys')  // ジャニーズ系
await runFullWikipediaCollection('actors')   // 俳優系
await runFullWikipediaCollection('sakamichi') // 坂道系

// テスト実行
await testWikipediaCollection()
*/