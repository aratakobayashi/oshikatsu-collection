/**
 * サイトマップ自動生成スクリプト
 * Supabaseからデータを取得してsitemap.xmlを生成
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const SITE_URL = 'https://collection.oshikatsu-guide.com'

// 環境変数の設定（本番用）
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'

const supabase = createClient(supabaseUrl, supabaseKey)

interface SitemapUrl {
  loc: string
  lastmod: string
  changefreq: string
  priority: string
}

async function generateSitemap() {
  try {
    console.log('📍 サイトマップ生成を開始...')
    
    const urls: SitemapUrl[] = []
    
    // 1. 静的ページ
    const staticPages = [
      { path: '', priority: '1.0', changefreq: 'daily' },
      { path: '/celebrities', priority: '0.9', changefreq: 'weekly' },
      { path: '/episodes', priority: '0.9', changefreq: 'daily' },
      { path: '/locations', priority: '0.9', changefreq: 'daily' },
      { path: '/items', priority: '0.8', changefreq: 'weekly' },
      { path: '/about', priority: '0.3', changefreq: 'monthly' },
      { path: '/contact', priority: '0.3', changefreq: 'monthly' },
      { path: '/privacy', priority: '0.2', changefreq: 'yearly' },
      { path: '/terms', priority: '0.2', changefreq: 'yearly' }
    ]

    staticPages.forEach(page => {
      urls.push({
        loc: `${SITE_URL}${page.path}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: page.changefreq,
        priority: page.priority
      })
    })

    // 2. セレブリティページ
    console.log('👨‍🎤 セレブリティページを取得中...')
    const { data: celebrities } = await supabase
      .from('celebrities')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false })

    if (celebrities) {
      celebrities.forEach(celebrity => {
        urls.push({
          loc: `${SITE_URL}/celebrities/${celebrity.slug}`,
          lastmod: celebrity.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.8'
        })
      })
      console.log(`✅ セレブリティページ: ${celebrities.length}件`)
    }

    // 3. エピソードページ
    console.log('🎬 エピソードページを取得中...')
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })

    if (episodes) {
      episodes.forEach(episode => {
        urls.push({
          loc: `${SITE_URL}/episodes/${episode.id}`,
          lastmod: episode.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: '0.7'
        })
      })
      console.log(`✅ エピソードページ: ${episodes.length}件`)
    }

    // 4. ロケーションページ
    console.log('📍 ロケーションページを取得中...')
    const { data: locations } = await supabase
      .from('locations')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })

    if (locations) {
      locations.forEach(location => {
        urls.push({
          loc: `${SITE_URL}/locations/${location.id}`,
          lastmod: location.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.8'
        })
      })
      console.log(`✅ ロケーションページ: ${locations.length}件`)
    }

    // 5. アイテムページ
    console.log('👕 アイテムページを取得中...')
    const { data: items } = await supabase
      .from('items')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })

    if (items) {
      items.forEach(item => {
        urls.push({
          loc: `${SITE_URL}/items/${item.id}`,
          lastmod: item.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: '0.6'
        })
      })
      console.log(`✅ アイテムページ: ${items.length}件`)
    }

    // 6. XML生成
    console.log('📝 sitemap.xmlを生成中...')
    const sitemap = generateXML(urls)
    
    // 7. ファイル保存（distフォルダとpublicフォルダの両方）
    const distPath = path.join(process.cwd(), 'dist', 'sitemap.xml')
    const publicPath = path.join(process.cwd(), 'public', 'sitemap.xml')
    
    // distフォルダが存在しない場合は作成
    const distDir = path.dirname(distPath)
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true })
    }
    
    // publicフォルダが存在しない場合は作成
    const publicDir = path.dirname(publicPath)
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }
    
    fs.writeFileSync(distPath, sitemap)
    fs.writeFileSync(publicPath, sitemap)
    
    console.log(`🎉 サイトマップ生成完了！`)
    console.log(`📄 総ページ数: ${urls.length}`)
    console.log(`📍 保存先: ${distPath}`)
    console.log(`📍 保存先: ${publicPath}`)
    console.log(`🔗 URL: ${SITE_URL}/sitemap.xml`)
    
  } catch (error) {
    console.error('❌ サイトマップ生成エラー:', error)
    process.exit(1)
  }
}

function generateXML(urls: SitemapUrl[]): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

  urls.forEach(url => {
    xml += `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>
`
  })

  xml += `</urlset>`
  return xml
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSitemap()
}

export { generateSitemap }