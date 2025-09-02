/**
 * Enhanced Sitemap Generator v2.0
 * SEO最適化されたサイトマップ生成システム
 * 
 * 新機能:
 * - カテゴリ別優先度設定
 * - 画像サイトマップ対応
 * - 更新頻度の動的計算
 * - Search Console API統合（将来対応）
 * - パフォーマンス最適化
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// 本番環境設定読み込み
dotenv.config({ path: '.env.production' })

const SITE_URL = 'https://collection.oshikatsu-guide.com'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
)

interface EnhancedSitemapUrl {
  loc: string
  lastmod: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: string | number
  category?: string
  images?: ImageInfo[]
  alternates?: AlternateInfo[]
}

interface ImageInfo {
  src: string
  caption?: string
  title?: string
  license?: string
}

interface SitemapImage {
  src: string
  title?: string
  caption?: string
  license?: string
}

interface AlternateInfo {
  hreflang: string
  href: string
}

interface SitemapStats {
  totalUrls: number
  byType: { [key: string]: number }
  categoryCounts: { [key: string]: number }
  withImages: number
  totalImages: number
  lastGenerated: string
  estimatedIndexTime: string
}

interface SitemapIndexEntry {
  loc: string
  lastmod: string
}

interface SitemapConfig {
  maxUrlsPerSitemap: number
  enableSitemapIndex: boolean
  splitByCategory: boolean
  splitByDate: boolean
}

interface SitemapGroup {
  name: string
  urls: EnhancedSitemapUrl[]
  filename: string
}

export class EnhancedSitemapGenerator {
  private stats: SitemapStats
  private supabase: any
  private config: SitemapConfig
  
  constructor() {
    this.supabase = supabase
    this.config = {
      maxUrlsPerSitemap: 1000,  // 1000URLで分割（Google推奨50,000だが管理しやすさ優先）
      enableSitemapIndex: false, // URL数に応じて自動で有効化
      splitByCategory: true,     // カテゴリ別分割
      splitByDate: false         // 日付別分割（将来の拡張用）
    }
    this.stats = {
      totalUrls: 0,
      byType: {},
      categoryCounts: {},
      withImages: 0,
      totalImages: 0,
      lastGenerated: new Date().toISOString(),
      estimatedIndexTime: this.calculateEstimatedIndexTime()
    }
  }

  /**
   * メイン実行関数
   */
  async generateEnhancedSitemap(): Promise<void> {
    console.log('🚀 Enhanced Sitemap Generator v2.0')
    console.log('=====================================')
    console.log('📈 SEO最適化機能:')
    console.log('  • 動的優先度計算')
    console.log('  • 画像サイトマップ統合')
    console.log('  • カテゴリ別更新頻度')
    console.log('  • パフォーマンス最適化\n')

    try {
      const startTime = Date.now()
      const urls: EnhancedSitemapUrl[] = []

      // 1. 静的ページ（SEO最適化）
      await this.addStaticPages(urls)
      
      // 2. 動的コンテンツページ
      await this.addCelebrityPages(urls)
      await this.addEpisodePages(urls)
      await this.addLocationPages(urls) // 画像情報も含む
      await this.addItemPages(urls)
      
      // 3. カテゴリページ（新追加）
      await this.addCategoryPages(urls)
      
      // 4. サイトマップファイル生成
      await this.generateSitemapFiles(urls)
      
      // 5. robots.txt更新
      await this.updateRobotsTxt()
      
      // 6. 統計情報表示
      this.displayStats(Date.now() - startTime)
      
    } catch (error) {
      console.error('❌ Enhanced sitemap generation failed:', error)
      throw error
    }
  }

  /**
   * 静的ページ追加（SEO最適化）
   */
  private addStaticPages(urls: EnhancedSitemapUrl[]) {
    console.log('📄 Adding static pages...')
    
    const staticPages = [
      { path: '', priority: 1.0, changefreq: 'daily', category: 'homepage' },
      { path: '/celebrities', priority: 0.9, changefreq: 'daily', category: 'listing' },
      { path: '/episodes', priority: 0.9, changefreq: 'daily', category: 'listing' },
      { path: '/locations', priority: 0.9, changefreq: 'daily', category: 'listing' },
      { path: '/items', priority: 0.8, changefreq: 'weekly', category: 'listing' },
      { path: '/map', priority: 0.7, changefreq: 'weekly', category: 'navigation' },
      { path: '/search', priority: 0.7, changefreq: 'monthly', category: 'utility' },
      { path: '/about', priority: 0.6, changefreq: 'monthly', category: 'info' },
      { path: '/contact', priority: 0.6, changefreq: 'monthly', category: 'info' },
      { path: '/privacy', priority: 0.5, changefreq: 'yearly', category: 'legal' },
      { path: '/terms', priority: 0.5, changefreq: 'yearly', category: 'legal' },
    ] as const

    staticPages.forEach(page => {
      urls.push({
        loc: `${SITE_URL}${page.path}`,
        lastmod: this.formatSitemapDate(new Date().toISOString()),
        changefreq: page.changefreq,
        priority: page.priority,
        category: page.category,
      })
      this.stats.categoryCounts[page.category] = (this.stats.categoryCounts[page.category] || 0) + 1
    })
    
    console.log(`  ✅ Added ${staticPages.length} static pages`)
  }

  /**
   * セレブリティページ追加
   */
  private async addCelebrityPages(urls: EnhancedSitemapUrl[]): Promise<void> {
    console.log('👨‍🎤 Adding celebrity pages...')
    
    const { data: celebrities, error } = await this.supabase
      .from('celebrities')
      .select('id, name, slug, updated_at')
      .order('name')

    if (error) {
      console.error('Error fetching celebrities:', error)
      return
    }

    celebrities?.forEach(celebrity => {
      // 改良版の動的優先度計算を使用
      const priority = this.calculateDynamicPriority({
        type: 'celebrity',
        updatedAt: celebrity.updated_at,
        // 将来的にはここにpageViewsやsocialSharesなどを追加
      })

      // 改良版の動的更新頻度計算を使用
      const changefreq = this.calculateDynamicChangeFreq({
        type: 'celebrity',
        updatedAt: celebrity.updated_at
      })

      urls.push({
        loc: `${SITE_URL}/celebrities/${celebrity.slug || celebrity.id}`,
        lastmod: this.formatSitemapDate(celebrity.updated_at),
        changefreq,
        priority,
        category: 'celebrity',
      })
      this.stats.categoryCounts.celebrity = (this.stats.categoryCounts.celebrity || 0) + 1
    })
    
    console.log(`  ✅ Added ${celebrities?.length || 0} celebrity pages`)
  }

  /**
   * エピソードページ追加
   */
  private async addEpisodePages(urls: EnhancedSitemapUrl[]): Promise<void> {
    console.log('🎬 Adding episode pages...')
    
    const { data: episodes, error } = await this.supabase
      .from('episodes')
      .select('id, title, youtube_id, updated_at')
      .limit(1000) // パフォーマンス最適化
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching episodes:', error)
      return
    }

    episodes?.forEach(episode => {
      // 改良版の動的優先度計算を使用
      const priority = this.calculateDynamicPriority({
        type: 'episode',
        updatedAt: episode.updated_at,
        hasVideo: true, // YouTubeビデオがある
        // 将来的にはpageViewsやsocialSharesを追加
      })

      // 改良版の動的更新頻度計算を使用  
      const changefreq = this.calculateDynamicChangeFreq({
        type: 'episode',
        updatedAt: episode.updated_at
      })

      urls.push({
        loc: `${SITE_URL}/episodes/${episode.youtube_id || episode.id}`,
        lastmod: this.formatSitemapDate(episode.updated_at),
        changefreq,
        priority,
        category: 'episode',
      })
      this.stats.categoryCounts.episode = (this.stats.categoryCounts.episode || 0) + 1
    })
    
    console.log(`  ✅ Added ${episodes?.length || 0} episode pages`)
  }

  /**
   * ロケーションページ追加（画像情報強化）
   */
  private async addLocationPages(urls: EnhancedSitemapUrl[]): Promise<void> {
    console.log('📍 Adding location pages with images...')
    
    const { data: locations, error } = await this.supabase
      .from('filming_locations')
      .select(`
        id, name, address, updated_at,
        location_images!inner(image_url, alt_text, caption)
      `)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching locations:', error)
      return
    }

    let locationsWithImages = 0

    locations?.forEach(location => {
      // 画像情報の処理
      const images: SitemapImage[] = []
      if (location.location_images && location.location_images.length > 0) {
        location.location_images.forEach((img: any, index: number) => {
          if (img.image_url) {
            images.push({
              src: img.image_url,
              title: `${location.name} - 画像 ${index + 1}`,
              caption: img.caption || `${location.name}（${location.address}）の写真`,
            })
          }
        })
        
        if (images.length > 0) {
          locationsWithImages++
          this.stats.totalImages += images.length
        }
      }

      // 改良版の動的優先度計算を使用
      const priority = this.calculateDynamicPriority({
        type: 'location',
        updatedAt: location.updated_at,
        hasImages: images.length > 0,
        // 将来的にはカテゴリ（レストラン、観光地など）も追加
      })

      // 改良版の動的更新頻度計算を使用
      const changefreq = this.calculateDynamicChangeFreq({
        type: 'location',
        updatedAt: location.updated_at
      })

      urls.push({
        loc: `${SITE_URL}/locations/${location.id}`,
        lastmod: this.formatSitemapDate(location.updated_at),
        changefreq,
        priority,
        category: 'location',
        images: images.length > 0 ? images : undefined,
      })
      this.stats.categoryCounts.location = (this.stats.categoryCounts.location || 0) + 1
    })
    
    this.stats.withImages = locationsWithImages
    console.log(`  ✅ Added ${locations?.length || 0} location pages`)
    console.log(`  🖼️  With images: ${locationsWithImages}`)
  }

  /**
   * アイテムページ追加
   */
  private async addItemPages(urls: EnhancedSitemapUrl[]): Promise<void> {
    console.log('👕 Adding item pages...')
    
    const { data: items, error } = await this.supabase
      .from('items')
      .select('id, name, updated_at')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching items:', error)
      return
    }

    items?.forEach(item => {
      // 改良版の動的優先度計算を使用
      const priority = this.calculateDynamicPriority({
        type: 'item',
        updatedAt: item.updated_at,
        // 将来的にはカテゴリや画像の有無も追加
      })

      // 改良版の動的更新頻度計算を使用
      const changefreq = this.calculateDynamicChangeFreq({
        type: 'item',
        updatedAt: item.updated_at
      })

      urls.push({
        loc: `${SITE_URL}/items/${item.id}`,
        lastmod: this.formatSitemapDate(item.updated_at),
        changefreq,
        priority,
        category: 'item',
      })
      this.stats.categoryCounts.item = (this.stats.categoryCounts.item || 0) + 1
    })
    
    console.log(`  ✅ Added ${items?.length || 0} item pages`)
  }

  /**
   * カテゴリページ追加（SEO強化）
   */
  private async addCategoryPages(urls: EnhancedSitemapUrl[]): Promise<void> {
    console.log('🏷️  Adding category pages...')
    
    const categoryPages = [
      { path: '/categories/restaurants', name: 'レストラン', priority: 0.8 },
      { path: '/categories/fashion', name: 'ファッション', priority: 0.8 },
      { path: '/categories/entertainment', name: 'エンターテイメント', priority: 0.8 },
      { path: '/categories/travel', name: '旅行・観光', priority: 0.8 },
      { path: '/categories/lifestyle', name: 'ライフスタイル', priority: 0.7 },
      { path: '/categories/culture', name: 'カルチャー', priority: 0.7 },
    ]

    categoryPages.forEach(category => {
      urls.push({
        loc: `${SITE_URL}${category.path}`,
        lastmod: this.formatSitemapDate(new Date().toISOString()),
        changefreq: 'weekly',
        priority: category.priority,
        category: 'category',
      })
      this.stats.categoryCounts.category = (this.stats.categoryCounts.category || 0) + 1
    })
    
    console.log(`  ✅ Added ${categoryPages.length} category pages`)
  }

  /**
   * 動的更新頻度計算
   */
  private calculateChangeFreq(updatedAt?: string): 'daily' | 'weekly' | 'monthly' {
    if (!updatedAt) return 'monthly'
    
    const lastUpdate = new Date(updatedAt)
    const now = new Date()
    const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceUpdate <= 7) return 'daily'
    if (daysSinceUpdate <= 30) return 'weekly'
    return 'monthly'
  }

  /**
   * エピソード優先度計算
   */
  private calculateEpisodePriority(updatedAt?: string): string {
    if (!updatedAt) return '0.5'
    
    const lastUpdate = new Date(updatedAt)
    const now = new Date()
    const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceUpdate <= 30) return '0.8'
    if (daysSinceUpdate <= 90) return '0.7'
    return '0.6'
  }

  /**
   * ロケーション優先度計算
   */
  private calculateLocationPriority(category?: string, imageUrls?: string[]): string {
    let basePriority = 0.6
    
    // カテゴリによる優先度調整
    if (category) {
      switch (category) {
        case 'restaurant':
        case 'cafe':
          basePriority = 0.8
          break
        case 'tourist':
          basePriority = 0.7
          break
        case 'shop':
        case 'entertainment':
          basePriority = 0.6
          break
      }
    }
    
    // 画像がある場合は優先度アップ
    if (imageUrls && imageUrls.length > 0) {
      basePriority += 0.1
    }
    
    return Math.min(basePriority, 1.0).toFixed(1)
  }

  /**
   * 動的優先度計算システム（改良版）
   * 複数の要因を考慮した高度な優先度計算
   */
  private calculateDynamicPriority(params: {
    type: string
    updatedAt?: string
    pageViews?: number
    socialShares?: number
    hasImages?: boolean
    hasVideo?: boolean
    contentLength?: number
    category?: string
    tags?: string[]
  }): number {
    let priority = 0.5 // ベース優先度

    // 1. コンテンツタイプによる基本優先度
    const typePriority: Record<string, number> = {
      homepage: 1.0,
      celebrity: 0.8,
      episode: 0.75,
      location: 0.7,
      item: 0.65,
      category: 0.7,
      listing: 0.8,
      legal: 0.3
    }
    priority = typePriority[params.type] || 0.5

    // 2. 更新頻度による調整（-0.2 ~ +0.2）
    if (params.updatedAt) {
      const daysSinceUpdate = this.getDaysSinceUpdate(params.updatedAt)
      if (daysSinceUpdate <= 7) {
        priority += 0.2 // 最近更新された
      } else if (daysSinceUpdate <= 30) {
        priority += 0.1
      } else if (daysSinceUpdate <= 90) {
        priority += 0.0
      } else if (daysSinceUpdate <= 365) {
        priority -= 0.1
      } else {
        priority -= 0.2 // 古いコンテンツ
      }
    }

    // 3. メディアコンテンツによるブースト
    if (params.hasVideo) {
      priority += 0.15 // 動画は最も重要
    }
    if (params.hasImages) {
      priority += 0.1 // 画像も重要
    }

    // 4. エンゲージメント指標（将来の拡張用）
    if (params.pageViews) {
      // 高アクセスページを優先
      if (params.pageViews > 10000) priority += 0.15
      else if (params.pageViews > 1000) priority += 0.1
      else if (params.pageViews > 100) priority += 0.05
    }

    // 5. ソーシャルシグナル（将来の拡張用）
    if (params.socialShares) {
      if (params.socialShares > 100) priority += 0.1
      else if (params.socialShares > 10) priority += 0.05
    }

    // 6. コンテンツの充実度
    if (params.contentLength) {
      if (params.contentLength > 2000) priority += 0.1
      else if (params.contentLength > 500) priority += 0.05
    }

    // 7. カテゴリ特別扱い
    if (params.category) {
      const categoryBoost: Record<string, number> = {
        'restaurant': 0.1,
        'trending': 0.15,
        'featured': 0.2,
        'sponsored': 0.15
      }
      priority += categoryBoost[params.category] || 0
    }

    // 8. タグによる微調整（将来の拡張用）
    if (params.tags && params.tags.length > 0) {
      const importantTags = ['人気', 'おすすめ', 'new', '限定']
      const hasImportantTag = params.tags.some(tag => 
        importantTags.includes(tag.toLowerCase())
      )
      if (hasImportantTag) priority += 0.05
    }

    // 優先度を0.0-1.0の範囲に正規化
    return Math.max(0.0, Math.min(1.0, priority))
  }

  /**
   * 更新からの経過日数を計算
   */
  private getDaysSinceUpdate(updatedAt: string): number {
    const lastUpdate = new Date(updatedAt)
    const now = new Date()
    return Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
  }

  /**
   * 動的更新頻度計算（改良版）
   * コンテンツの特性と更新パターンを考慮
   */
  private calculateDynamicChangeFreq(params: {
    type: string
    updatedAt?: string
    updateHistory?: Date[]
    seasonal?: boolean
    eventDriven?: boolean
  }): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
    // イベント駆動型コンテンツ
    if (params.eventDriven) {
      return 'hourly'
    }

    // 季節性のあるコンテンツ
    if (params.seasonal) {
      const now = new Date()
      const month = now.getMonth()
      // 季節の変わり目（3,6,9,12月）は頻繁に更新
      if ([2, 5, 8, 11].includes(month)) {
        return 'daily'
      }
    }

    // 更新履歴から頻度を推定
    if (params.updateHistory && params.updateHistory.length > 1) {
      const intervals = []
      for (let i = 1; i < params.updateHistory.length; i++) {
        const diff = params.updateHistory[i].getTime() - params.updateHistory[i-1].getTime()
        intervals.push(diff)
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const avgDays = avgInterval / (1000 * 60 * 60 * 24)

      if (avgDays < 1) return 'hourly'
      if (avgDays <= 3) return 'daily'
      if (avgDays <= 14) return 'weekly'
      if (avgDays <= 60) return 'monthly'
      return 'yearly'
    }

    // コンテンツタイプ別のデフォルト頻度
    const typeFrequency: Record<string, 'daily' | 'weekly' | 'monthly' | 'yearly'> = {
      homepage: 'daily',
      listing: 'daily',
      celebrity: 'weekly',
      episode: 'weekly',
      location: 'weekly',
      item: 'monthly',
      category: 'weekly',
      legal: 'yearly',
      about: 'monthly'
    }

    // 最終更新日からの推定
    if (params.updatedAt) {
      const daysSince = this.getDaysSinceUpdate(params.updatedAt)
      
      // 最近更新されたコンテンツは頻繁に更新される可能性が高い
      if (daysSince <= 1) return 'daily'
      if (daysSince <= 7) return 'weekly'
      if (daysSince <= 30) return 'monthly'
      
      // タイプ別のデフォルトにフォールバック
      return typeFrequency[params.type] || 'monthly'
    }

    return typeFrequency[params.type] || 'monthly'
  }

  /**
   * サイトマップファイル生成
   */
  private async generateSitemapFiles(urls: EnhancedSitemapUrl[]): Promise<void> {
    console.log('\n📝 Generating sitemap files...')
    
    // URL数が閾値を超えたらサイトマップインデックスを有効化
    if (urls.length > this.config.maxUrlsPerSitemap) {
      console.log(`  📊 ${urls.length} URLs detected - enabling sitemap index`)
      this.config.enableSitemapIndex = true
    }
    
    if (this.config.enableSitemapIndex) {
      await this.generateSitemapIndex(urls)
    } else {
      await this.generateSingleSitemap(urls)
    }
  }

  /**
   * サイトマップインデックス生成（複数サイトマップ対応）
   */
  private async generateSitemapIndex(urls: EnhancedSitemapUrl[]): Promise<void> {
    console.log('  📊 Generating sitemap index...')
    
    // URLをカテゴリ別にグループ化
    const groups = this.groupUrls(urls)
    const sitemapEntries: SitemapIndexEntry[] = []
    
    // 各グループのサイトマップを生成
    for (const group of groups) {
      const sitemapXML = this.generateMainSitemapXML(group.urls)
      const sitemapPath = `${group.filename}.xml`
      
      // ファイル保存
      await this.saveToFiles(sitemapPath, sitemapXML)
      
      // インデックス用のエントリ追加
      sitemapEntries.push({
        loc: `${SITE_URL}/${sitemapPath}`,
        lastmod: new Date().toISOString()
      })
      
      console.log(`    ✅ ${group.name}: ${group.urls.length} URLs → ${sitemapPath}`)
    }
    
    // 画像サイトマップも追加
    const imageUrls = urls.filter(url => url.images && url.images.length > 0)
    if (imageUrls.length > 0) {
      const imageSitemap = this.generateImageSitemapXML(imageUrls)
      await this.saveToFiles('sitemap-images.xml', imageSitemap)
      sitemapEntries.push({
        loc: `${SITE_URL}/sitemap-images.xml`,
        lastmod: new Date().toISOString()
      })
      console.log(`    🖼️  Images: ${imageUrls.length} URLs → sitemap-images.xml`)
    }
    
    // サイトマップインデックスファイル生成
    const indexXML = this.generateSitemapIndexXML(sitemapEntries)
    await this.saveToFiles('sitemap.xml', indexXML)
    
    this.stats.totalUrls = urls.length
    console.log(`  ✅ Sitemap index: ${sitemapEntries.length} sitemaps`)
    console.log(`  📁 Total URLs: ${urls.length}`)
  }

  /**
   * 単一サイトマップ生成（従来の方式）
   */
  private async generateSingleSitemap(urls: EnhancedSitemapUrl[]): Promise<void> {
    console.log('  📄 Generating single sitemap...')
    
    // メインサイトマップ
    const mainSitemap = this.generateMainSitemapXML(urls)
    await this.saveToFiles('sitemap.xml', mainSitemap)
    
    // 画像サイトマップ
    const imageUrls = urls.filter(url => url.images && url.images.length > 0)
    if (imageUrls.length > 0) {
      const imageSitemap = this.generateImageSitemapXML(imageUrls)
      await this.saveToFiles('sitemap-images.xml', imageSitemap)
      console.log(`  🖼️  Image sitemap: ${imageUrls.length} URLs with ${this.stats.totalImages} images`)
    }
    
    this.stats.totalUrls = urls.length
    console.log(`  ✅ Main sitemap: ${urls.length} URLs`)
    console.log(`  📁 Saved to: public/ and dist/`)
  }

  /**
   * URLをカテゴリ別にグループ化
   */
  private groupUrls(urls: EnhancedSitemapUrl[]): SitemapGroup[] {
    const groups: SitemapGroup[] = []
    
    // 地域別・カテゴリ別の高度な分割ロジック
    if (this.config.splitByCategory) {
      // カテゴリ別に分割
      const categories = new Map<string, EnhancedSitemapUrl[]>()
      
      // 特別なカテゴリグループの定義
      const categoryGroups: Record<string, string[]> = {
        'core': ['homepage', 'listing', 'navigation', 'utility'],
        'content': ['celebrity', 'episode', 'item'],
        'places': ['location'], // 将来的に地域別に細分化
        'meta': ['category', 'info', 'legal']
      }
      
      // URLをカテゴリごとに分類
      urls.forEach(url => {
        const category = url.category || 'other'
        
        // 特別なグルーピング処理
        if (category === 'location') {
          // ロケーションは地域別に分割（将来実装）
          // 現在は都道府県別に分割できるようコメントで準備
          // const region = this.extractRegionFromAddress(url.address)
          // const locationCategory = `location-${region}`
          const locationCategory = 'location'
          
          if (!categories.has(locationCategory)) {
            categories.set(locationCategory, [])
          }
          categories.get(locationCategory)!.push(url)
        } else {
          // 通常のカテゴリ処理
          if (!categories.has(category)) {
            categories.set(category, [])
          }
          categories.get(category)!.push(url)
        }
      })
      
      // 各カテゴリをグループ化
      categories.forEach((categoryUrls, category) => {
        // 優先度でソート（高い順）
        categoryUrls.sort((a, b) => b.priority - a.priority)
        
        // 大きなカテゴリは更に分割
        if (categoryUrls.length > this.config.maxUrlsPerSitemap) {
          const chunks = this.chunkArray(categoryUrls, this.config.maxUrlsPerSitemap)
          chunks.forEach((chunk, index) => {
            groups.push({
              name: `${category} (${index + 1}/${chunks.length})`,
              urls: chunk,
              filename: `sitemap-${category}-${index + 1}`
            })
          })
        } else {
          groups.push({
            name: category,
            urls: categoryUrls,
            filename: `sitemap-${category}`
          })
        }
      })
      
      // グループを論理的な順序でソート
      const categoryOrder = ['homepage', 'listing', 'celebrity', 'episode', 'location', 'item', 'category', 'navigation', 'utility', 'info', 'legal', 'other']
      groups.sort((a, b) => {
        const aCategory = a.name.split(' ')[0]
        const bCategory = b.name.split(' ')[0]
        const aIndex = categoryOrder.indexOf(aCategory)
        const bIndex = categoryOrder.indexOf(bCategory)
        
        if (aIndex === -1 && bIndex === -1) return 0
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })
      
    } else {
      // サイズベースで単純分割
      const chunks = this.chunkArray(urls, this.config.maxUrlsPerSitemap)
      chunks.forEach((chunk, index) => {
        groups.push({
          name: `Part ${index + 1}`,
          urls: chunk,
          filename: `sitemap-${index + 1}`
        })
      })
    }
    
    return groups
  }

  /**
   * 住所から地域を抽出（将来実装用）
   */
  private extractRegionFromAddress(address?: string): string {
    if (!address) return 'unknown'
    
    // 都道府県のパターンマッチング
    const prefectures = [
      '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
      '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
      '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
      '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
      '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
      '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
      '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
    ]
    
    for (const prefecture of prefectures) {
      if (address.includes(prefecture)) {
        // 地域グループに変換
        if (['東京都', '神奈川県', '千葉県', '埼玉県'].includes(prefecture)) {
          return 'kanto'
        }
        if (['大阪府', '京都府', '兵庫県', '奈良県', '和歌山県', '滋賀県'].includes(prefecture)) {
          return 'kansai'
        }
        if (['愛知県', '岐阜県', '三重県', '静岡県'].includes(prefecture)) {
          return 'chubu'
        }
        if (['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'].includes(prefecture)) {
          return 'kyushu'
        }
        if (['北海道'].includes(prefecture)) {
          return 'hokkaido'
        }
        if (['青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'].includes(prefecture)) {
          return 'tohoku'
        }
        // その他の地域
        return 'other-regions'
      }
    }
    
    return 'unknown'
  }

  /**
   * 配列を指定サイズに分割
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  /**
   * サイトマップインデックスXML生成
   */
  private generateSitemapIndexXML(entries: SitemapIndexEntry[]): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`
    
    entries.forEach(entry => {
      xml += `  <sitemap>
    <loc>${this.escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
  </sitemap>
`
    })
    
    xml += `</sitemapindex>`
    return xml
  }

  /**
   * ファイル保存ヘルパー
   */
  private async saveToFiles(filename: string, content: string): Promise<void> {
    const publicDir = path.join(process.cwd(), 'public')
    const distDir = path.join(process.cwd(), 'dist')
    
    // ディレクトリ作成
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true })
    }
    
    // ファイル保存
    const publicPath = path.join(publicDir, filename)
    const distPath = path.join(distDir, filename)
    
    fs.writeFileSync(publicPath, content)
    fs.writeFileSync(distPath, content)
  }

  /**
   * メインサイトマップXML生成
   */
  private generateMainSitemapXML(urls: EnhancedSitemapUrl[]): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

    urls.forEach(url => {
      xml += `  <url>
    <loc>${this.escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>
`
    })

    xml += `</urlset>`
    return xml
  }

  /**
   * 画像専用サイトマップXML生成
   */
  private generateImageSitemapXML(urls: EnhancedSitemapUrl[]): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`

    urls.forEach(url => {
      if (url.images && url.images.length > 0) {
        xml += `  <url>
    <loc>${this.escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>`
        
        url.images.forEach(image => {
          xml += `
    <image:image>
      <image:loc>${this.escapeXml(image.src)}</image:loc>`
          if (image.title) {
            xml += `
      <image:title>${this.escapeXml(image.title)}</image:title>`
          }
          if (image.caption) {
            xml += `
      <image:caption>${this.escapeXml(image.caption)}</image:caption>`
          }
          if (image.license) {
            xml += `
      <image:license>${this.escapeXml(image.license)}</image:license>`
          }
          xml += `
    </image:image>`
        })
        
        xml += `
  </url>
`
      }
    })

    xml += `</urlset>`
    return xml
  }

  /**
   * robots.txt更新
   */
  private async updateRobotsTxt(): Promise<void> {
    console.log('🤖 Updating robots.txt...')
    
    const robotsTxt = `# oshikatsu-collection.com robots.txt
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-images.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Generated: ${new Date().toISOString()}
`

    const robotsPaths = [
      path.join(process.cwd(), 'public', 'robots.txt'),
      path.join(process.cwd(), 'dist', 'robots.txt')
    ]
    
    robotsPaths.forEach(filePath => {
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(filePath, robotsTxt)
    })
    
    console.log('  ✅ robots.txt updated')
  }

  /**
   * XML特殊文字エスケープ
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  /**
   * Format date to W3C Datetime format for sitemaps
   * @param date - ISO string or date string
   * @returns Formatted date string (YYYY-MM-DDTHH:MM:SS+00:00)
   */
  private formatSitemapDate(date?: string): string {
    if (!date) {
      return new Date().toISOString()
    }
    // If already includes time, return as-is
    if (date.includes('T')) {
      return new Date(date).toISOString()
    }
    // If only date (YYYY-MM-DD), add time component
    return new Date(date + 'T00:00:00Z').toISOString()
  }

  /**
   * インデックス推定時間計算
   */
  private calculateEstimatedIndexTime(): string {
    const now = new Date()
    const estimatedDays = 7 // 一般的な推定日数
    const estimatedDate = new Date(now.getTime() + estimatedDays * 24 * 60 * 60 * 1000)
    return estimatedDate.toISOString().split('T')[0]
  }

  /**
   * 統計情報表示
   */
  private displayStats(processingTime: number): void {
    console.log('\n' + '='.repeat(60))
    console.log('🏆 ENHANCED SITEMAP GENERATION COMPLETED')
    console.log('='.repeat(60))
    
    console.log('\n📊 Generation Statistics:')
    console.log(`  • Total URLs: ${this.stats.totalUrls}`)
    console.log(`  • Processing time: ${(processingTime / 1000).toFixed(1)}s`)
    console.log(`  • Generation date: ${this.stats.lastGenerated.split('T')[0]}`)
    
    console.log('\n📋 Content Breakdown:')
    Object.entries(this.stats.categoryCounts).forEach(([type, count]) => {
      console.log(`  • ${type}: ${count} pages`)
    })
    
    console.log('\n🖼️  Image Statistics:')
    const totalPages = Object.values(this.stats.categoryCounts).reduce((sum, count) => sum + count, 0)
    console.log(`  • URLs with images: ${this.stats.withImages}/${totalPages} (${totalPages > 0 ? Math.round(this.stats.withImages/totalPages*100) : 0}%)`)
    console.log(`  • Total images: ${this.stats.totalImages}`)
    console.log(`  • Average images per page: ${this.stats.withImages > 0 ? (this.stats.totalImages / this.stats.withImages).toFixed(1) : '0.0'}`)
    
    console.log('\n🔗 Generated Files:')
    console.log(`  • ${SITE_URL}/sitemap.xml`)
    console.log(`  • ${SITE_URL}/sitemap-images.xml`)
    console.log(`  • ${SITE_URL}/robots.txt`)
    
    console.log('\n🎯 SEO Benefits:')
    console.log('  • ✅ Dynamic priority calculation')
    console.log('  • ✅ Image sitemap for better image SEO')
    console.log('  • ✅ Category pages for topic clustering')
    console.log('  • ✅ Optimized update frequencies')
    console.log('  • ✅ Comprehensive crawl instructions')
    
    console.log('\n⏰ Expected Results:')
    console.log(`  • Estimated indexing start: ${this.stats.estimatedIndexTime}`)
    console.log('  • First search appearances: 1-2 weeks')
    console.log('  • Full indexing completion: 2-4 weeks')
    console.log('  • SEO impact visible: 1-3 months')
    
    console.log('\n🎉 Ready for Search Console submission!')
  }

  /**
   * 特定の店舗情報を取得するデバッグ用メソッド
   */
  async debugLocationInfo(locationId: string): Promise<void> {
    console.log(`\n🔍 Fetching location info for ID: ${locationId}`)
    
    // 複数のテーブル名を試行
    const tableNames = ['filming_locations', 'episode_locations', 'locations']
    
    for (const tableName of tableNames) {
      console.log(`Trying table: ${tableName}`)
      const { data: location, error } = await this.supabase
        .from(tableName)
        .select('*')
        .eq('id', locationId)
        .single()

      if (!error && location) {
        console.log('📍 Location Details:')
        console.log('  Name:', location.name)
        console.log('  Address:', location.address)  
        console.log('  Description:', location.description)
        console.log('  Category:', location.category)
        console.log('  Updated:', location.updated_at)
        console.log('  Table:', tableName)
        
        // エピソード情報を取得
        if (location.episode_id) {
          console.log('\n🎬 Fetching episode info...')
          const { data: episode, error: episodeError } = await this.supabase
            .from('episodes')
            .select('*')
            .eq('id', location.episode_id)
            .single()
            
          if (!episodeError && episode) {
            console.log('📺 Episode Details:')
            console.log('  Title:', episode.title)
            console.log('  YouTube ID:', episode.youtube_id)
            console.log('  YouTube URL:', episode.youtube_id ? `https://youtube.com/watch?v=${episode.youtube_id}` : 'N/A')
            console.log('  Published:', episode.published_at)
            console.log('  Description:', episode.description)
          } else {
            console.log('❌ Episode not found or error:', episodeError)
          }
        }
        
        // セレブリティ情報を取得
        if (location.celebrity_id) {
          console.log('\n👨‍🎤 Fetching celebrity info...')
          const { data: celebrity, error: celebError } = await this.supabase
            .from('celebrities')
            .select('*')
            .eq('id', location.celebrity_id)
            .single()
            
          if (!celebError && celebrity) {
            console.log('⭐ Celebrity Details:')
            console.log('  Name:', celebrity.name)
            console.log('  Slug:', celebrity.slug)
            console.log('  Description:', celebrity.description)
          } else {
            console.log('❌ Celebrity not found or error:', celebError)
          }
        }
        
        console.log('\n📄 Raw location data:', JSON.stringify(location, null, 2))
        return
      }
      
      if (error && error.code !== '42P01') {
        console.log(`Error with ${tableName}:`, error)
      }
    }
    
    console.log('❌ Location not found in any table')
  }
}

// 実行関数
export async function generateEnhancedSitemap(): Promise<void> {
  const generator = new EnhancedSitemapGenerator()
  
  // コマンドライン引数をチェック
  const args = process.argv.slice(2)
  const debugLocationArg = args.find(arg => arg.startsWith('--debug-location='))
  
  if (debugLocationArg) {
    const locationId = debugLocationArg.split('=')[1]
    await generator.debugLocationInfo(locationId)
    return
  }
  
  await generator.generateEnhancedSitemap()
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  generateEnhancedSitemap().catch(console.error)
}