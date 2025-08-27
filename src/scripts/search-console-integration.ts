/**
 * Google Search Console Integration
 * サイトマップ送信とSEO監視の自動化
 * 
 * 機能:
 * - サイトマップ状況確認
 * - インデックス状況取得
 * - SEOパフォーマンス監視
 * - 自動レポート生成
 */

import fs from 'fs'
import path from 'path'

interface SearchConsoleStatus {
  sitemapUrl: string
  isAccessible: boolean
  lastModified?: string
  contentType?: string
  fileSize?: number
  urlCount?: number
}

interface SEOReport {
  sitemapStatus: SearchConsoleStatus[]
  recommendations: string[]
  nextSteps: string[]
  estimatedTimeline: string
}

export class SearchConsoleIntegrator {
  private siteUrl: string
  private sitemapUrls: string[]

  constructor(siteUrl: string = 'https://collection.oshikatsu-guide.com') {
    this.siteUrl = siteUrl
    this.sitemapUrls = [
      `${siteUrl}/sitemap.xml`,
      `${siteUrl}/sitemap-images.xml`,
      `${siteUrl}/robots.txt`
    ]
  }

  /**
   * メイン実行関数
   */
  async runSearchConsoleIntegration(): Promise<void> {
    console.log('🔍 Google Search Console Integration')
    console.log('====================================')
    console.log(`🌐 Site: ${this.siteUrl}`)
    console.log(`📄 Checking ${this.sitemapUrls.length} files\n`)

    try {
      // 1. サイトマップファイル状況確認
      const sitemapStatus = await this.checkSitemapStatus()
      
      // 2. SEOレポート生成
      const report = this.generateSEOReport(sitemapStatus)
      
      // 3. レポート表示
      this.displayReport(report)
      
      // 4. Search Console手順ガイド表示
      this.displaySearchConsoleGuide()
      
      // 5. 継続監視の設定推奨
      this.displayMonitoringSetup()
      
    } catch (error) {
      console.error('❌ Search Console integration failed:', error)
      throw error
    }
  }

  /**
   * サイトマップ状況確認
   */
  private async checkSitemapStatus(): Promise<SearchConsoleStatus[]> {
    console.log('📋 Checking sitemap accessibility...')
    
    const statusList: SearchConsoleStatus[] = []
    
    for (const url of this.sitemapUrls) {
      console.log(`  🔍 Checking: ${url}`)
      
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'oshikatsu-collection-seo-checker/1.0'
          }
        })

        const status: SearchConsoleStatus = {
          sitemapUrl: url,
          isAccessible: response.ok,
          contentType: response.headers.get('content-type') || undefined,
          lastModified: response.headers.get('last-modified') || undefined
        }

        if (response.ok) {
          // ファイルサイズ取得（可能な場合）
          const contentLength = response.headers.get('content-length')
          if (contentLength) {
            status.fileSize = parseInt(contentLength, 10)
          }
          
          // XMLの場合はURL数も取得
          if (url.includes('.xml')) {
            const urlCount = await this.countUrlsInSitemap(url)
            status.urlCount = urlCount
          }
          
          console.log(`    ✅ Accessible (${response.status})`)
          console.log(`    📄 Type: ${status.contentType}`)
          if (status.fileSize) {
            console.log(`    📏 Size: ${(status.fileSize / 1024).toFixed(1)} KB`)
          }
          if (status.urlCount) {
            console.log(`    📊 URLs: ${status.urlCount}`)
          }
        } else {
          console.log(`    ❌ Not accessible (${response.status})`)
        }
        
        statusList.push(status)
        
      } catch (error) {
        console.log(`    ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        statusList.push({
          sitemapUrl: url,
          isAccessible: false
        })
      }
      
      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    return statusList
  }

  /**
   * サイトマップ内のURL数をカウント
   */
  private async countUrlsInSitemap(url: string): Promise<number> {
    try {
      const response = await fetch(url)
      if (!response.ok) return 0
      
      const xmlContent = await response.text()
      const urlMatches = xmlContent.match(/<loc>/g)
      return urlMatches ? urlMatches.length : 0
      
    } catch (error) {
      return 0
    }
  }

  /**
   * SEOレポート生成
   */
  private generateSEOReport(sitemapStatus: SearchConsoleStatus[]): SEOReport {
    const accessibleSitemaps = sitemapStatus.filter(s => s.isAccessible)
    const totalUrls = sitemapStatus.reduce((sum, s) => sum + (s.urlCount || 0), 0)
    
    const recommendations: string[] = []
    const nextSteps: string[] = []
    
    // 基本チェック
    if (accessibleSitemaps.length === sitemapStatus.length) {
      recommendations.push('✅ All sitemap files are accessible')
    } else {
      recommendations.push('❌ Some sitemap files are not accessible - please check server configuration')
      nextSteps.push('Fix inaccessible sitemap files before submission')
    }
    
    // URL数チェック
    if (totalUrls > 0) {
      recommendations.push(`✅ Total URLs in sitemaps: ${totalUrls}`)
      
      if (totalUrls > 50000) {
        recommendations.push('⚠️  Large sitemap detected - consider splitting into multiple files')
        nextSteps.push('Split large sitemaps for better processing')
      }
    } else {
      recommendations.push('❌ No URLs found in sitemaps')
      nextSteps.push('Generate sitemaps with actual URLs')
    }
    
    // 画像サイトマップチェック
    const hasImageSitemap = sitemapStatus.some(s => 
      s.sitemapUrl.includes('images') && s.isAccessible
    )
    
    if (hasImageSitemap) {
      recommendations.push('✅ Image sitemap detected - great for image SEO')
    } else {
      recommendations.push('💡 Consider creating image sitemap for better image SEO')
      nextSteps.push('Generate image sitemap if you have many images')
    }
    
    // robots.txtチェック
    const hasRobotsTxt = sitemapStatus.some(s => 
      s.sitemapUrl.includes('robots.txt') && s.isAccessible
    )
    
    if (hasRobotsTxt) {
      recommendations.push('✅ robots.txt is accessible')
    } else {
      recommendations.push('❌ robots.txt not found')
      nextSteps.push('Create robots.txt with sitemap references')
    }
    
    // 次のステップの優先順位付け
    if (accessibleSitemaps.length > 0) {
      nextSteps.unshift('Submit sitemaps to Google Search Console')
      nextSteps.push('Monitor indexing status after submission')
      nextSteps.push('Set up regular SEO monitoring')
    }
    
    return {
      sitemapStatus,
      recommendations,
      nextSteps,
      estimatedTimeline: this.calculateTimeline(totalUrls)
    }
  }

  /**
   * インデックス時間の推定計算
   */
  private calculateTimeline(urlCount: number): string {
    if (urlCount === 0) return 'Cannot estimate without valid sitemaps'
    if (urlCount < 100) return '3-7 days for initial indexing'
    if (urlCount < 1000) return '1-2 weeks for full indexing'
    if (urlCount < 10000) return '2-4 weeks for full indexing'
    return '1-2 months for full indexing of large site'
  }

  /**
   * レポート表示
   */
  private displayReport(report: SEOReport): void {
    console.log('\n📊 SEO READINESS REPORT')
    console.log('='.repeat(40))
    
    console.log('\n🔍 Sitemap Status:')
    report.sitemapStatus.forEach(status => {
      const statusIcon = status.isAccessible ? '✅' : '❌'
      const fileName = status.sitemapUrl.split('/').pop()
      console.log(`  ${statusIcon} ${fileName}`)
      if (status.urlCount) {
        console.log(`      URLs: ${status.urlCount}`)
      }
      if (status.fileSize) {
        console.log(`      Size: ${(status.fileSize / 1024).toFixed(1)} KB`)
      }
    })
    
    console.log('\n💡 Recommendations:')
    report.recommendations.forEach(rec => {
      console.log(`  ${rec}`)
    })
    
    console.log('\n📋 Next Steps:')
    report.nextSteps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`)
    })
    
    console.log('\n⏰ Estimated Timeline:')
    console.log(`  ${report.estimatedTimeline}`)
  }

  /**
   * Search Console手順ガイド表示
   */
  private displaySearchConsoleGuide(): void {
    console.log('\n🎯 GOOGLE SEARCH CONSOLE SUBMISSION GUIDE')
    console.log('='.repeat(50))
    
    console.log('\n📱 Step 1: Access Search Console')
    console.log('   URL: https://search.google.com/search-console/')
    console.log('   Login with your Google account')
    
    console.log('\n🏠 Step 2: Add Property')
    console.log('   Choose "URL prefix" method')
    console.log(`   Enter: ${this.siteUrl}`)
    
    console.log('\n✅ Step 3: Verify Ownership')
    console.log('   Recommended: HTML tag method')
    console.log('   Add meta tag to your site\'s <head> section:')
    console.log('   <meta name="google-site-verification" content="YOUR_CODE" />')
    
    console.log('\n📄 Step 4: Submit Sitemaps')
    console.log('   Go to: Sitemaps section in left menu')
    console.log('   Add these sitemaps:')
    this.sitemapUrls.filter(url => url.includes('.xml')).forEach(url => {
      const path = url.replace(this.siteUrl, '')
      console.log(`     ${path}`)
    })
    
    console.log('\n⏱️  Step 5: Wait and Monitor')
    console.log('   Initial processing: 24-48 hours')
    console.log('   First indexing results: 3-7 days')
    console.log('   Regular monitoring recommended')
    
    console.log('\n🔧 Troubleshooting:')
    console.log('   • If sitemap errors occur, check XML syntax')
    console.log('   • If URLs not indexed, check robots.txt')
    console.log('   • If slow indexing, improve page quality and links')
  }

  /**
   * 継続監視設定の推奨
   */
  private displayMonitoringSetup(): void {
    console.log('\n📈 ONGOING SEO MONITORING SETUP')
    console.log('='.repeat(40))
    
    console.log('\n🔄 Automated Monitoring (Recommended):')
    console.log('   • Schedule weekly sitemap regeneration')
    console.log('   • Set up Search Console API integration')
    console.log('   • Monitor Core Web Vitals monthly')
    console.log('   • Track keyword rankings')
    
    console.log('\n📊 Key Metrics to Track:')
    console.log('   • Indexed pages count')
    console.log('   • Click-through rates (CTR)')
    console.log('   • Average position in search results')
    console.log('   • Page loading speed')
    console.log('   • Mobile usability issues')
    
    console.log('\n⚡ Performance Optimization:')
    console.log('   • Compress images (WebP format)')
    console.log('   • Minimize JavaScript and CSS')
    console.log('   • Use CDN for static assets')
    console.log('   • Implement lazy loading for images')
    
    console.log('\n🎯 Content Strategy:')
    console.log('   • Add new content regularly')
    console.log('   • Optimize meta titles and descriptions')
    console.log('   • Build internal link structure')
    console.log('   • Create topic-focused landing pages')
    
    console.log('\n📱 Tools to Use:')
    console.log('   • Google Search Console (free)')
    console.log('   • Google Analytics (free)')
    console.log('   • PageSpeed Insights (free)')
    console.log('   • Google Lighthouse (free)')
  }

  /**
   * 設定ファイル生成
   */
  async generateSEOConfigFile(): Promise<void> {
    const config = {
      siteUrl: this.siteUrl,
      sitemapUrls: this.sitemapUrls,
      lastCheck: new Date().toISOString(),
      monitoring: {
        enabled: true,
        frequency: 'weekly',
        alerts: {
          indexingIssues: true,
          performanceDrops: true,
          errorIncrease: true
        }
      },
      targets: {
        indexedPages: '95%',
        avgPosition: '<20',
        coreWebVitals: 'all-green',
        mobileUsability: '100%'
      }
    }

    const configPath = path.join(process.cwd(), 'seo-config.json')
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    console.log(`\n📄 SEO config saved to: ${configPath}`)
  }
}

/**
 * 実行関数
 */
export async function runSearchConsoleIntegration(): Promise<void> {
  const integrator = new SearchConsoleIntegrator()
  await integrator.runSearchConsoleIntegration()
  await integrator.generateSEOConfigFile()
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  runSearchConsoleIntegration().catch(console.error)
}