#!/usr/bin/env node

/**
 * サイトマップ分析・生成・Google Search Console送信準備
 * コンテンツSEO強化後の最適化サイトマップ生成
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const SITE_URL = 'https://collection.oshikatsu-guide.com'

// URL優先度計算
function calculateUrlPriority(data: any): number {
  let priority = 0.5 // ベース優先度
  
  // エピソード数による重み付け
  const episodeCount = data.episode_count || 0
  if (episodeCount >= 5) priority += 0.3
  else if (episodeCount >= 2) priority += 0.2
  else if (episodeCount >= 1) priority += 0.1
  
  // セレブリティ人気による重み付け  
  const celebrities = data.celebrities || []
  if (celebrities.includes('松重豊')) priority += 0.2
  if (celebrities.includes('SixTONES') || celebrities.includes('Snow Man')) priority += 0.15
  if (celebrities.includes('≠ME') || celebrities.includes('=LOVE')) priority += 0.1
  
  // タベログURL有無
  if (data.has_tabelog) priority += 0.1
  
  // 最新更新による重み付け
  if (data.recently_updated) priority += 0.05
  
  return Math.min(1.0, priority)
}

// 更新頻度計算
function calculateChangeFreq(data: any): string {
  const episodeCount = data.episode_count || 0
  const hasTabelog = data.has_tabelog || false
  
  if (episodeCount >= 3 || hasTabelog) return 'weekly'
  if (episodeCount >= 1) return 'monthly'
  return 'yearly'
}

async function analyzeCurrentSitemap() {
  console.log('🗺️ サイトマップ分析・最適化生成')
  console.log('='.repeat(60))
  
  // 現在のデータ取得
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select(`
      id, name, description, tags, updated_at,
      tabelog_url, phone, opening_hours,
      episode_locations(
        id, episode_id,
        episodes(id, title, celebrities(name))
      )
    `)
  
  const { data: celebrities, error: celError } = await supabase
    .from('celebrities')
    .select('id, name, updated_at')
  
  const { data: episodes, error: epError } = await supabase
    .from('episodes')
    .select('id, title, updated_at')
  
  if (locError || celError || epError) {
    console.error('データ取得エラー:', locError || celError || epError)
    return
  }
  
  console.log(`📊 現在のコンテンツ状況:`)
  console.log(`   ロケーション: ${locations.length}件`)
  console.log(`   セレブリティ: ${celebrities.length}件`)  
  console.log(`   エピソード: ${episodes.length}件`)
  
  // ロケーションページ用データ準備
  const locationPages = locations.map(loc => {
    const episodeCount = loc.episode_locations?.length || 0
    const celebs = [...new Set(loc.episode_locations?.map(el => 
      el.episodes?.celebrities?.name).filter(Boolean) || [])]
    
    return {
      url: `${SITE_URL}/locations/${loc.id}`,
      lastmod: loc.updated_at || new Date().toISOString(),
      priority: calculateUrlPriority({
        episode_count: episodeCount,
        celebrities: celebs,
        has_tabelog: !!loc.tabelog_url,
        recently_updated: new Date(loc.updated_at || 0) > new Date(Date.now() - 24*60*60*1000)
      }),
      changefreq: calculateChangeFreq({
        episode_count: episodeCount,
        has_tabelog: !!loc.tabelog_url
      }),
      type: 'location',
      name: loc.name,
      episodeCount,
      celebrities: celebs
    }
  })
  
  // セレブリティページ用データ準備
  const celebrityPages = celebrities.map(celeb => ({
    url: `${SITE_URL}/celebrities/${celeb.id}`,
    lastmod: celeb.updated_at || new Date().toISOString(),
    priority: 0.8, // セレブページは高優先度
    changefreq: 'weekly',
    type: 'celebrity',
    name: celeb.name
  }))
  
  // エピソードページ用データ準備
  const episodePages = episodes.map(episode => ({
    url: `${SITE_URL}/episodes/${episode.id}`,
    lastmod: episode.updated_at || new Date().toISOString(),
    priority: 0.6,
    changefreq: 'monthly',
    type: 'episode',
    name: episode.title
  }))
  
  // 静的ページ
  const staticPages = [
    {
      url: SITE_URL,
      lastmod: new Date().toISOString(),
      priority: 1.0,
      changefreq: 'daily',
      type: 'homepage'
    },
    {
      url: `${SITE_URL}/locations`,
      lastmod: new Date().toISOString(), 
      priority: 0.9,
      changefreq: 'daily',
      type: 'location-index'
    },
    {
      url: `${SITE_URL}/celebrities`,
      lastmod: new Date().toISOString(),
      priority: 0.9,
      changefreq: 'weekly',
      type: 'celebrity-index'
    },
    {
      url: `${SITE_URL}/episodes`,
      lastmod: new Date().toISOString(),
      priority: 0.8,
      changefreq: 'weekly',
      type: 'episode-index'
    }
  ]
  
  const allPages = [...staticPages, ...locationPages, ...celebrityPages, ...episodePages]
  
  console.log('\n📋 【サイトマップ構成】')
  console.log('='.repeat(40))
  console.log(`静的ページ: ${staticPages.length}件`)
  console.log(`ロケーションページ: ${locationPages.length}件`)
  console.log(`セレブリティページ: ${celebrityPages.length}件`)
  console.log(`エピソードページ: ${episodePages.length}件`)
  console.log(`総ページ数: ${allPages.length}件`)
  
  // 優先度別統計
  const highPriority = allPages.filter(p => p.priority >= 0.8).length
  const mediumPriority = allPages.filter(p => p.priority >= 0.6 && p.priority < 0.8).length
  const lowPriority = allPages.filter(p => p.priority < 0.6).length
  
  console.log(`\n📊 【優先度別統計】`)
  console.log(`高優先度 (0.8+): ${highPriority}件`)
  console.log(`中優先度 (0.6-0.79): ${mediumPriority}件`)
  console.log(`低優先度 (0.6未満): ${lowPriority}件`)
  
  // TOP優先度ページ
  console.log('\n🎯 【TOP10 高優先度ページ】')
  console.log('='.repeat(40))
  allPages
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10)
    .forEach((page, i) => {
      console.log(`${i+1}. ${page.name || page.type} (優先度: ${page.priority})`)
      console.log(`   URL: ${page.url}`)
      if (page.episodeCount) console.log(`   エピソード: ${page.episodeCount}件`)
      if (page.celebrities?.length) console.log(`   セレブ: ${page.celebrities.slice(0, 2).join(', ')}`)
      console.log('')
    })
  
  return {
    allPages,
    locationPages,
    celebrityPages,
    episodePages,
    staticPages,
    totalPages: allPages.length
  }
}

// XML サイトマップ生成
function generateXMLSitemap(pages: any[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod.split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
  </url>`).join('\n')}
</urlset>`
  
  return xml
}

// サイトマップインデックス生成（大規模サイト用）
function generateSitemapIndex(): string {
  const now = new Date().toISOString().split('T')[0]
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-main.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-locations.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-celebrities.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-episodes.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`
}

async function generateOptimizedSitemaps() {
  const data = await analyzeCurrentSitemap()
  if (!data) return
  
  console.log('\n📝 サイトマップファイル生成中...')
  
  // メインサイトマップ（統合版）
  const mainSitemap = generateXMLSitemap(data.allPages)
  fs.writeFileSync('sitemap.xml', mainSitemap)
  console.log('✅ sitemap.xml 生成完了')
  
  // 分割サイトマップ
  const locationSitemap = generateXMLSitemap([...data.staticPages, ...data.locationPages])
  fs.writeFileSync('sitemap-locations.xml', locationSitemap)
  console.log('✅ sitemap-locations.xml 生成完了')
  
  const celebritySitemap = generateXMLSitemap(data.celebrityPages)
  fs.writeFileSync('sitemap-celebrities.xml', celebritySitemap)
  console.log('✅ sitemap-celebrities.xml 生成完了')
  
  const episodeSitemap = generateXMLSitemap(data.episodePages)
  fs.writeFileSync('sitemap-episodes.xml', episodeSitemap)
  console.log('✅ sitemap-episodes.xml 生成完了')
  
  // サイトマップインデックス
  const sitemapIndex = generateSitemapIndex()
  fs.writeFileSync('sitemap-index.xml', sitemapIndex)
  console.log('✅ sitemap-index.xml 生成完了')
  
  // Google Search Console用レポート生成
  const gscReport = {
    timestamp: new Date().toISOString(),
    totalPages: data.totalPages,
    sitemaps: [
      { name: 'sitemap.xml', pages: data.allPages.length, description: 'メインサイトマップ（全ページ統合）' },
      { name: 'sitemap-locations.xml', pages: data.locationPages.length + data.staticPages.length, description: 'ロケーションページ専用' },
      { name: 'sitemap-celebrities.xml', pages: data.celebrityPages.length, description: 'セレブリティページ専用' },
      { name: 'sitemap-episodes.xml', pages: data.episodePages.length, description: 'エピソードページ専用' },
      { name: 'sitemap-index.xml', pages: 0, description: 'サイトマップインデックス（大規模サイト用）' }
    ],
    highPriorityPages: data.allPages.filter(p => p.priority >= 0.8).length,
    contentUpdateInfo: {
      locationsWithContent: data.locationPages.filter(p => p.episodeCount > 0).length,
      averagePagePriority: Math.round(data.allPages.reduce((sum, p) => sum + p.priority, 0) / data.allPages.length * 100) / 100
    }
  }
  
  fs.writeFileSync('google-search-console-report.json', JSON.stringify(gscReport, null, 2))
  console.log('✅ google-search-console-report.json 生成完了')
  
  console.log('\n🎯 【Google Search Console 送信手順】')
  console.log('='.repeat(50))
  console.log('1. 生成されたサイトマップファイルをWebサーバーにアップロード:')
  console.log(`   - sitemap.xml → ${SITE_URL}/sitemap.xml`)
  console.log(`   - sitemap-locations.xml → ${SITE_URL}/sitemap-locations.xml`)
  console.log(`   - sitemap-celebrities.xml → ${SITE_URL}/sitemap-celebrities.xml`)
  console.log(`   - sitemap-episodes.xml → ${SITE_URL}/sitemap-episodes.xml`)
  console.log('')
  console.log('2. Google Search Console での送信:')
  console.log('   a. https://search.google.com/search-console にアクセス')
  console.log('   b. プロパティ選択: collection.oshikatsu-guide.com')
  console.log('   c. サイドメニュー「サイトマップ」をクリック')
  console.log('   d. 「新しいサイトマップの追加」で以下を順次送信:')
  console.log('      - sitemap.xml')
  console.log('      - sitemap-locations.xml') 
  console.log('      - sitemap-celebrities.xml')
  console.log('      - sitemap-episodes.xml')
  console.log('')
  console.log('3. 推奨: メインサイトマップ (sitemap.xml) を最初に送信')
  console.log('')
  console.log('🚀 期待効果:')
  console.log(`   - ${data.totalPages}ページの迅速なインデックス`)
  console.log(`   - ${gscReport.highPriorityPages}件の高優先度ページの早期発見`)
  console.log('   - コンテンツSEO強化の検索エンジン反映促進')
  
  return gscReport
}

// 実行
generateOptimizedSitemaps()
  .then(report => {
    if (report) {
      console.log(`\n✅ サイトマップ最適化完了!`)
      console.log(`   総ページ数: ${report.totalPages}件`)
      console.log(`   高優先度ページ: ${report.highPriorityPages}件`)
      console.log(`   生成ファイル数: ${report.sitemaps.length}個`)
      console.log('\n🎯 次ステップ: Google Search Console での送信実行')
    }
  })
  .catch(error => {
    console.error('❌ サイトマップ生成エラー:', error)
  })