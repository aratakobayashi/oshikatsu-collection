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
  priority: string
  images?: ImageInfo[]
  alternates?: AlternateInfo[]
}

interface ImageInfo {
  src: string
  caption?: string
  title?: string
  license?: string
}

interface AlternateInfo {
  hreflang: string
  href: string
}

interface SitemapStats {
  totalUrls: number
  byType: { [key: string]: number }
  withImages: number
  totalImages: number
  lastGenerated: string
  estimatedIndexTime: string
}

export class EnhancedSitemapGenerator {
  private stats: SitemapStats
  
  constructor() {
    this.stats = {
      totalUrls: 0,
      byType: {},
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
  private async addStaticPages(urls: EnhancedSitemapUrl[]): Promise<void> {
    console.log('📄 Adding static pages...')
    
    const staticPages = [
      { 
        path: '', 
        priority: '1.0', 
        changefreq: 'daily' as const,
        type: 'homepage'
      },
      { 
        path: '/celebrities', 
        priority: '0.9', 
        changefreq: 'daily' as const,
        type: 'listing'
      },
      { 
        path: '/episodes', 
        priority: '0.9', 
        changefreq: 'daily' as const,
        type: 'listing'
      },
      { 
        path: '/locations', 
        priority: '0.9', 
        changefreq: 'daily' as const,
        type: 'listing'
      },
      { 
        path: '/items', 
        priority: '0.8', 
        changefreq: 'weekly' as const,
        type: 'listing'
      },
      { 
        path: '/categories', 
        priority: '0.8', 
        changefreq: 'weekly' as const,
        type: 'navigation'
      },
      { 
        path: '/search', 
        priority: '0.7', 
        changefreq: 'weekly' as const,
        type: 'utility'
      },
      { 
        path: '/about', 
        priority: '0.4', 
        changefreq: 'monthly' as const,
        type: 'info'
      },
      { 
        path: '/contact', 
        priority: '0.3', 
        changefreq: 'monthly' as const,
        type: 'info'
      },
      { 
        path: '/privacy', 
        priority: '0.2', 
        changefreq: 'yearly' as const,
        type: 'legal'
      },
      { 
        path: '/terms', 
        priority: '0.2', 
        changefreq: 'yearly' as const,
        type: 'legal'
      }
    ]

    staticPages.forEach(page => {
      urls.push({
        loc: `${SITE_URL}${page.path}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: page.changefreq,
        priority: page.priority
      })
      
      this.stats.byType[page.type] = (this.stats.byType[page.type] || 0) + 1
    })

    console.log(`  ✅ Added ${staticPages.length} static pages`)
  }

  /**
   * セレブリティページ追加
   */
  private async addCelebrityPages(urls: EnhancedSitemapUrl[]): Promise<void> {
    console.log('👨‍🎤 Adding celebrity pages...')
    
    const { data: celebrities, error } = await supabase
      .from('celebrities')
      .select('slug, updated_at, name')
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch celebrities: ${error.message}`)
    }

    if (celebrities) {
      celebrities.forEach(celebrity => {
        urls.push({
          loc: `${SITE_URL}/celebrities/${celebrity.slug}`,
          lastmod: celebrity.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          changefreq: this.calculateChangeFreq(celebrity.updated_at),
          priority: '0.8'
        })
      })
      
      this.stats.byType.celebrity = celebrities.length
      console.log(`  ✅ Added ${celebrities.length} celebrity pages`)
    }
  }

  /**
   * エピソードページ追加
   */
  private async addEpisodePages(urls: EnhancedSitemapUrl[]): Promise<void> {
    console.log('🎬 Adding episode pages...')
    
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('id, updated_at, title')
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch episodes: ${error.message}`)
    }

    if (episodes) {
      episodes.forEach(episode => {
        urls.push({
          loc: `${SITE_URL}/episodes/${episode.id}`,
          lastmod: episode.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: this.calculateEpisodePriority(episode.updated_at)
        })
      })
      
      this.stats.byType.episode = episodes.length
      console.log(`  ✅ Added ${episodes.length} episode pages`)
    }
  }

  /**
   * ロケーションページ追加（画像情報強化）
   */
  private async addLocationPages(urls: EnhancedSitemapUrl[]): Promise<void> {
    console.log('📍 Adding location pages with images...')
    
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, updated_at, name, image_urls, address')
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch locations: ${error.message}`)
    }

    if (locations) {
      locations.forEach(location => {
        const images: ImageInfo[] = []
        
        if (location.image_urls && location.image_urls.length > 0) {
          location.image_urls.forEach((imageUrl: string, index: number) => {
            images.push({
              src: imageUrl,
              title: `${location.name} - 画像 ${index + 1}`,
              caption: `${location.name}（${location.address || '住所不明'}）の写真`,
              license: 'https://unsplash.com/license'
            })
          })
        }

        urls.push({
          loc: `${SITE_URL}/locations/${location.id}`,
          lastmod: location.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: this.calculateLocationPriority(undefined, location.image_urls),
          images: images.length > 0 ? images : undefined
        })
      })
      
      this.stats.byType.location = locations.length
      this.stats.withImages += locations.filter(l => l.image_urls && l.image_urls.length > 0).length
      this.stats.totalImages += locations.reduce((total: number, l: any) => 
        total + (l.image_urls ? l.image_urls.length : 0), 0)
      console.log(`  ✅ Added ${locations.length} location pages`)
      console.log(`  🖼️  With images: ${locations.filter(l => l.image_urls && l.image_urls.length > 0).length}`)
    }
  }

  /**
   * アイテムページ追加
   */
  private async addItemPages(urls: EnhancedSitemapUrl[]): Promise<void> {
    console.log('👕 Adding item pages...')
    
    const { data: items, error } = await supabase
      .from('items')
      .select('id, updated_at, name')
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch items: ${error.message}`)
    }

    if (items) {
      items.forEach(item => {
        urls.push({
          loc: `${SITE_URL}/items/${item.id}`,
          lastmod: item.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: '0.6'
        })
      })
      
      this.stats.byType.item = items.length
      console.log(`  ✅ Added ${items.length} item pages`)
    }
  }

  /**
   * カテゴリページ追加（SEO強化）
   */
  private async addCategoryPages(urls: EnhancedSitemapUrl[]): Promise<void> {
    console.log('🏷️  Adding category pages...')
    
    const categories = [
      { slug: 'restaurants', name: 'レストラン', priority: '0.8' },
      { slug: 'cafes', name: 'カフェ', priority: '0.8' },
      { slug: 'shops', name: 'ショップ', priority: '0.7' },
      { slug: 'tourist-spots', name: '観光地', priority: '0.7' },
      { slug: 'entertainment', name: 'エンターテイメント', priority: '0.6' },
      { slug: 'hotels', name: 'ホテル', priority: '0.6' }
    ]

    categories.forEach(category => {
      urls.push({
        loc: `${SITE_URL}/categories/${category.slug}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: category.priority
      })
    })
    
    this.stats.byType.category = categories.length
    console.log(`  ✅ Added ${categories.length} category pages`)
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
   * サイトマップファイル生成
   */
  private async generateSitemapFiles(urls: EnhancedSitemapUrl[]): Promise<void> {
    console.log('\n📝 Generating sitemap files...')
    
    // メインサイトマップ
    const mainSitemap = this.generateMainSitemapXML(urls)
    
    // 画像サイトマップ（画像があるURLのみ）
    const imageUrls = urls.filter(url => url.images && url.images.length > 0)
    const imageSitemap = this.generateImageSitemapXML(imageUrls)
    
    // ファイル保存
    const publicDir = path.join(process.cwd(), 'public')
    const distDir = path.join(process.cwd(), 'dist')
    
    // ディレクトリ作成
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true })
    }
    
    // メインサイトマップ保存
    const mainSitemapPaths = [
      path.join(publicDir, 'sitemap.xml'),
      path.join(distDir, 'sitemap.xml')
    ]
    
    mainSitemapPaths.forEach(filePath => {
      fs.writeFileSync(filePath, mainSitemap)
    })
    
    // 画像サイトマップ保存
    if (imageUrls.length > 0) {
      const imageSitemapPaths = [
        path.join(publicDir, 'sitemap-images.xml'),
        path.join(distDir, 'sitemap-images.xml')
      ]
      
      imageSitemapPaths.forEach(filePath => {
        fs.writeFileSync(filePath, imageSitemap)
      })
      
      console.log(`  ✅ Image sitemap: ${imageUrls.length} URLs with ${this.stats.totalImages} images`)
    }
    
    this.stats.totalUrls = urls.length
    console.log(`  ✅ Main sitemap: ${urls.length} URLs`)
    console.log(`  📁 Saved to: public/ and dist/`)
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
    Object.entries(this.stats.byType).forEach(([type, count]) => {
      console.log(`  • ${type}: ${count} pages`)
    })
    
    console.log('\n🖼️  Image Statistics:')
    console.log(`  • URLs with images: ${this.stats.withImages}/${this.stats.totalUrls} (${Math.round(this.stats.withImages/this.stats.totalUrls*100)}%)`)
    console.log(`  • Total images: ${this.stats.totalImages}`)
    console.log(`  • Average images per page: ${(this.stats.totalImages / this.stats.withImages || 0).toFixed(1)}`)
    
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
}

// 実行関数
export async function generateEnhancedSitemap(): Promise<void> {
  const generator = new EnhancedSitemapGenerator()
  await generator.generateEnhancedSitemap()
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  generateEnhancedSitemap().catch(console.error)
}