/**
 * 購入リンク・予約リンクの品質向上システム
 * - URLの有効性チェック
 * - アフィリエイトタグの検証
 * - リンク切れ検出
 * - 品質スコア算出
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface LinkQualityReport {
  entity_type: 'location' | 'item'
  entity_id: string
  entity_name: string
  url: string
  quality_score: number
  issues: string[]
  recommendations: string[]
  status: 'excellent' | 'good' | 'poor' | 'broken'
}

interface QualitySummary {
  total_links: number
  excellent_links: number
  good_links: number
  poor_links: number
  broken_links: number
  average_quality: number
  top_issues: { issue: string; count: number }[]
}

export class LinkQualityImprover {
  
  // URLの基本検証
  validateUrlStructure(url: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = []
    
    if (!url) {
      issues.push('URL未設定')
      return { isValid: false, issues }
    }
    
    // 基本的なURL形式チェック
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      issues.push('不正なURLプロトコル')
    }
    
    // HTTPS推奨
    if (url.startsWith('http://')) {
      issues.push('HTTPSではなくHTTPを使用')
    }
    
    // 不審なドメインチェック
    const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'ow.ly']
    if (suspiciousDomains.some(domain => url.includes(domain))) {
      issues.push('短縮URLの使用')
    }
    
    return { isValid: issues.length === 0, issues }
  }
  
  // 店舗予約リンクの品質チェック
  checkLocationReservationLink(url: string): { score: number; issues: string[] } {
    const issues: string[] = []
    let score = 100
    
    // バリューコマース系アフィリエイトチェック
    const hasValuecommerce = url.includes('valuecommerce') || 
                             url.includes('vc.') ||
                             url.includes('af.moshimo')
    
    if (!hasValuecommerce) {
      issues.push('バリューコマースのアフィリエイトタグなし')
      score -= 30
    }
    
    // 信頼できる予約サイトかチェック
    const trustedReservationSites = [
      'tabelog.com', 'gurunavi.com', 'hotpepper.jp', 'ikyu.com',
      'booking.com', 'jalan.net', 'rakuten.co.jp', 'yelp.com'
    ]
    
    const isTrustedSite = trustedReservationSites.some(site => url.includes(site))
    if (!isTrustedSite) {
      issues.push('信頼できる予約サイトではない可能性')
      score -= 20
    }
    
    // 古いURLパターンの検出
    if (url.includes('/mobile/') || url.includes('?m=1')) {
      issues.push('モバイル専用URL（レスポンシブ推奨）')
      score -= 10
    }
    
    return { score: Math.max(0, score), issues }
  }
  
  // アイテム購入リンクの品質チェック
  checkItemPurchaseLink(url: string): { score: number; issues: string[] } {
    const issues: string[] = []
    let score = 100
    
    // Amazon アフィリエイトチェック
    if (url.includes('amazon')) {
      const hasAffiliateTag = url.includes('tag=') && url.includes('arata55507-22')
      if (!hasAffiliateTag) {
        issues.push('Amazonアフィリエイトタグなし')
        score -= 40
      }
      
      // Amazon URL の最適化チェック
      if (url.includes('/ref=')) {
        issues.push('不要なrefパラメータが含まれている')
        score -= 5
      }
    }
    
    // 楽天アフィリエイトチェック
    if (url.includes('rakuten.co.jp')) {
      const hasRakutenAffiliate = url.includes('ichiba.rakuten.co.jp') && 
                                  url.includes('?_RTcand=')
      if (!hasRakutenAffiliate) {
        issues.push('楽天アフィリエイトタグなし')
        score -= 40
      }
    }
    
    // 信頼できるECサイトかチェック
    const trustedEcommerceSites = [
      'amazon.co.jp', 'rakuten.co.jp', 'yahoo-shopping.jp',
      'zara.com', 'uniqlo.com', 'gu-global.com', 'muji.com'
    ]
    
    const isTrustedSite = trustedEcommerceSites.some(site => url.includes(site))
    if (!isTrustedSite) {
      issues.push('信頼できるECサイトではない可能性')
      score -= 15
    }
    
    return { score: Math.max(0, score), issues }
  }
  
  // リンク切れチェック（簡易版）
  async checkLinkAccessibility(url: string): Promise<{ accessible: boolean; statusCode?: number }> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)'
        }
      })
      
      return { 
        accessible: response.ok, 
        statusCode: response.status 
      }
    } catch (error) {
      console.error(`Link check failed for ${url}:`, error)
      return { accessible: false }
    }
  }
  
  // 全店舗の予約リンク品質チェック
  async analyzeLocationLinks(): Promise<LinkQualityReport[]> {
  const reports: LinkQualityReport[] = []
  
  // 実際のlocationsテーブルにはwebsiteとreservation_urlがない可能性があるため
  // 利用可能なカラムで取得
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, description, phone, address')
  
  if (error) {
    console.error('店舗データ取得エラー:', error)
    return reports
  }
  
  console.log(`🏪 店舗情報解析開始: ${locations?.length || 0}件`)
  console.log('ℹ️  現在のlocationsテーブルにはwebsite/reservation_urlカラムがありません')
  
  for (const location of locations || []) {
    // 現在のスキーマではリンク情報がないため、基本情報の品質をチェック
    const issues: string[] = []
    let score = 60 // ベーススコア
    
    if (!location.description || location.description.trim().length === 0) {
      issues.push('説明文が未設定')
      score -= 20
    }
    
    if (!location.phone || location.phone.trim().length === 0) {
      issues.push('電話番号が未設定')
      score -= 15
    }
    
    if (!location.address || location.address.trim().length === 0) {
      issues.push('住所が未設定')
      score -= 25
    }
    
    // 基本的な情報不備チェック
    issues.push('予約URLが未設定（テーブル構造の更新が必要）')
    issues.push('ウェブサイトURLが未設定（テーブル構造の更新が必要）')
    score -= 40
    
    const recommendations = [
      'データベーススキーマを更新してwebsite, reservation_urlカラムを追加',
      'バリューコマースなどのアフィリエイト予約リンクを設定',
      '店舗の基本情報（住所、電話番号、説明文）を充実'
    ]
    
    let status: LinkQualityReport['status']
    if (score >= 90) status = 'excellent'
    else if (score >= 70) status = 'good'
    else if (score >= 40) status = 'poor'
    else status = 'broken'
    
    reports.push({
      entity_type: 'location',
      entity_id: location.id,
      entity_name: location.name,
      url: '', // URLカラムが存在しない
      quality_score: Math.max(0, score),
      issues: issues,
      recommendations: recommendations,
      status: status
    })
  }
  
  return reports
}
  
  // 全アイテムの購入リンク品質チェック
  async analyzeItemLinks(): Promise<LinkQualityReport[]> {
  const reports: LinkQualityReport[] = []
  
  const { data: items, error } = await supabase
    .from('items')
    .select('id, name, purchase_url, brand, price, category')
  
  if (error) {
    console.error('アイテムデータ取得エラー:', error)
    return reports
  }
  
  console.log(`🛍️ アイテム購入リンク解析開始: ${items?.length || 0}件`)
  
  for (const item of items || []) {
    const url = item.purchase_url
    
    if (!url) {
      reports.push({
        entity_type: 'item',
        entity_id: item.id,
        entity_name: item.name,
        url: '',
        quality_score: 0,
        issues: ['購入URLが未設定'],
        recommendations: ['購入可能なECサイトのURLを設定してください'],
        status: 'broken'
      })
      continue
    }
    
    const { isValid, issues: structureIssues } = this.validateUrlStructure(url)
    const { score: baseScore, issues: qualityIssues } = this.checkItemPurchaseLink(url)
    let score = baseScore
    
    // 基本情報の品質もチェック
    if (!item.brand || item.brand.trim().length === 0) {
      qualityIssues.push('ブランド情報が未設定')
      score -= 10
    }
    
    if (!item.price || item.price <= 0) {
      qualityIssues.push('価格情報が未設定')
      score -= 10
    }
    
    if (!item.category || item.category.trim().length === 0) {
      qualityIssues.push('カテゴリが未設定')
      score -= 10
    }
    
    const allIssues = [...structureIssues, ...qualityIssues]
    const recommendations = this.generateRecommendations('item', allIssues)
    
    // ステータス判定
    let status: LinkQualityReport['status']
    if (score >= 90) status = 'excellent'
    else if (score >= 70) status = 'good'
    else if (score >= 40) status = 'poor'
    else status = 'broken'
    
    reports.push({
      entity_type: 'item',
      entity_id: item.id,
      entity_name: item.name,
      url: url,
      quality_score: Math.max(0, score),
      issues: allIssues,
      recommendations: recommendations,
      status: status
    })
  }
  
  return reports
}
  
  // 改善提案生成
  generateRecommendations(entityType: 'location' | 'item', issues: string[]): string[] {
    const recommendations: string[] = []
    
    for (const issue of issues) {
      switch (issue) {
        case 'URL未設定':
          recommendations.push(
            entityType === 'location' 
              ? '食べログ、ぐるなび、ホットペッパーなどの予約サイトURLを設定'
              : 'Amazon、楽天市場、公式ストアなどの購入URLを設定'
          )
          break
        case 'バリューコマースのアフィリエイトタグなし':
          recommendations.push('バリューコマース経由のアフィリエイトリンクに置き換え')
          break
        case 'Amazonアフィリエイトタグなし':
          recommendations.push('Amazonアソシエイトタグ（arata55507-22）を追加')
          break
        case '楽天アフィリエイトタグなし':
          recommendations.push('楽天アフィリエイトタグを追加')
          break
        case 'HTTPSではなくHTTPを使用':
          recommendations.push('HTTPSに変更してセキュリティを向上')
          break
        case '短縮URLの使用':
          recommendations.push('フルURLに変更してユーザーの信頼性を向上')
          break
        default:
          recommendations.push('URLの見直しと最適化を検討')
      }
    }
    
    return [...new Set(recommendations)] // 重複除去
  }
  
  // 品質サマリー生成
  generateQualitySummary(reports: LinkQualityReport[]): QualitySummary {
    const totalLinks = reports.length
    const excellentLinks = reports.filter(r => r.status === 'excellent').length
    const goodLinks = reports.filter(r => r.status === 'good').length
    const poorLinks = reports.filter(r => r.status === 'poor').length
    const brokenLinks = reports.filter(r => r.status === 'broken').length
    
    const averageQuality = reports.length > 0 
      ? reports.reduce((sum, r) => sum + r.quality_score, 0) / reports.length
      : 0
    
    // 頻出問題の集計
    const issueCount: Record<string, number> = {}
    reports.forEach(report => {
      report.issues.forEach(issue => {
        issueCount[issue] = (issueCount[issue] || 0) + 1
      })
    })
    
    const topIssues = Object.entries(issueCount)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    return {
      total_links: totalLinks,
      excellent_links: excellentLinks,
      good_links: goodLinks,
      poor_links: poorLinks,
      broken_links: brokenLinks,
      average_quality: Math.round(averageQuality * 10) / 10,
      top_issues: topIssues
    }
  }
  
  // 品質向上の自動修正実行
  async autoFixCommonIssues(): Promise<{ fixed: number; skipped: number }> {
  let fixedCount = 0
  let skippedCount = 0
  
  console.log('🔧 自動修正開始...')
  
  // HTTP → HTTPS 自動変換 (items)
  const { data: httpItems } = await supabase
    .from('items')
    .select('id, purchase_url')
    .like('purchase_url', 'http://%')
  
  for (const item of httpItems || []) {
    if (item.purchase_url) {
      const httpsUrl = item.purchase_url.replace('http://', 'https://')
      
      try {
        const { error } = await supabase
          .from('items')
          .update({ purchase_url: httpsUrl })
          .eq('id', item.id)
        
        if (!error) {
          console.log(`✅ HTTP→HTTPS変換 (items): ${item.id}`)
          fixedCount++
        } else {
          console.error(`❌ 修正失敗 (items): ${item.id}`, error)
          skippedCount++
        }
      } catch (error) {
        console.error(`❌ 修正失敗 (items): ${item.id}`, error)
        skippedCount++
      }
    }
  }
  
  console.log('ℹ️  locationsテーブルはURL関連カラムが存在しないため、自動修正対象外です')
  console.log('   データベーススキーマの更新が必要です：')
  console.log('   - ALTER TABLE locations ADD COLUMN website TEXT;')
  console.log('   - ALTER TABLE locations ADD COLUMN reservation_url TEXT;')
  
  return { fixed: fixedCount, skipped: skippedCount }
}
  
  // 完全な品質解析実行
  async runCompleteAnalysis(): Promise<{
    locationReports: LinkQualityReport[]
    itemReports: LinkQualityReport[]
    summary: QualitySummary
  }> {
    console.log('🚀 リンク品質解析開始')
    
    // 各種解析実行
    const [locationReports, itemReports] = await Promise.all([
      this.analyzeLocationLinks(),
      this.analyzeItemLinks()
    ])
    
    const allReports = [...locationReports, ...itemReports]
    const summary = this.generateQualitySummary(allReports)
    
    // 結果表示
    console.log('\n📊 品質解析結果')
    console.log('='.repeat(60))
    console.log(`総リンク数: ${summary.total_links}`)
    console.log(`優良リンク: ${summary.excellent_links} (${((summary.excellent_links/summary.total_links)*100).toFixed(1)}%)`)
    console.log(`良好リンク: ${summary.good_links} (${((summary.good_links/summary.total_links)*100).toFixed(1)}%)`)
    console.log(`要改善リンク: ${summary.poor_links} (${((summary.poor_links/summary.total_links)*100).toFixed(1)}%)`)
    console.log(`問題リンク: ${summary.broken_links} (${((summary.broken_links/summary.total_links)*100).toFixed(1)}%)`)
    console.log(`平均品質スコア: ${summary.average_quality}/100`)
    
    console.log('\n🔥 主要な問題:')
    summary.top_issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.issue}: ${issue.count}件`)
    })
    
    // 改善が必要なリンクの詳細表示
    const problemLinks = allReports.filter(r => r.status === 'poor' || r.status === 'broken')
    if (problemLinks.length > 0) {
      console.log('\n🚨 改善が必要なリンク（上位10件）:')
      problemLinks.slice(0, 10).forEach((report, index) => {
        console.log(`${index + 1}. ${report.entity_name} (${report.entity_type})`)
        console.log(`   スコア: ${report.quality_score}/100`)
        console.log(`   問題: ${report.issues.join(', ')}`)
        console.log(`   推奨: ${report.recommendations[0] || 'URLの見直し'}`)
        console.log('')
      })
    }
    
    return {
      locationReports,
      itemReports, 
      summary
    }
  }
}

// 実行関数
export async function improveLinkQuality() {
  const improver = new LinkQualityImprover()
  
  try {
    // 完全解析実行
    const analysis = await improver.runCompleteAnalysis()
    
    // 自動修正実行
    console.log('\n🔧 自動修正実行中...')
    const fixes = await improver.autoFixCommonIssues()
    console.log(`✅ ${fixes.fixed}件修正、${fixes.skipped}件スキップ`)
    
    return analysis
  } catch (error) {
    console.error('❌ リンク品質改善エラー:', error)
    throw error
  }
}

// コマンドライン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  improveLinkQuality().catch(console.error)
}