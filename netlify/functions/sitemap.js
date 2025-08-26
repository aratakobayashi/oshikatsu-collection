/**
 * Netlify Functions - sitemap.xml の動的生成
 * サーバーサイドでリアルタイムにサイトマップを生成
 */

const { createClient } = require('@supabase/supabase-js')

const SITE_URL = process.env.VITE_APP_URL || 'https://collection.oshikatsu-guide.com'

exports.handler = async (event, context) => {
  try {
    // Supabaseクライアント初期化
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('📍 動的サイトマップ生成開始...')
    
    const urls = []
    const today = new Date().toISOString().split('T')[0]
    
    // 1. 静的ページ
    const staticPages = [
      { path: '', priority: '1.0', changefreq: 'daily' },
      { path: '/celebrities', priority: '0.9', changefreq: 'weekly' },
      { path: '/episodes', priority: '0.9', changefreq: 'daily' },
      { path: '/locations', priority: '0.9', changefreq: 'daily' },
      { path: '/items', priority: '0.8', changefreq: 'weekly' }
    ]

    staticPages.forEach(page => {
      urls.push({
        loc: `${SITE_URL}${page.path}`,
        lastmod: today,
        changefreq: page.changefreq,
        priority: page.priority
      })
    })

    // 2. よにのちゃんねる専用ページ（SEO重点）
    urls.push({
      loc: `${SITE_URL}/celebrities/よにのちゃんねる`,
      lastmod: today,
      changefreq: 'daily',
      priority: '1.0'
    })

    // 3. データベースから動的コンテンツを取得
    try {
      // セレブリティ
      const { data: celebrities } = await supabase
        .from('celebrities')
        .select('slug, updated_at')
        .limit(100)

      if (celebrities) {
        celebrities.forEach(celebrity => {
          urls.push({
            loc: `${SITE_URL}/celebrities/${celebrity.slug}`,
            lastmod: celebrity.updated_at?.split('T')[0] || today,
            changefreq: 'weekly',
            priority: celebrity.slug === 'よにのちゃんねる' ? '1.0' : '0.8'
          })
        })
      }

      // ロケーション（聖地巡礼ページ - SEO重点）
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name, updated_at')
        .order('updated_at', { ascending: false })
        .limit(200)

      if (locations) {
        locations.forEach(location => {
          urls.push({
            loc: `${SITE_URL}/locations/${location.id}`,
            lastmod: location.updated_at?.split('T')[0] || today,
            changefreq: 'weekly',
            priority: '0.9'
          })
        })
      }

      // エピソード
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id, updated_at')
        .order('updated_at', { ascending: false })
        .limit(150)

      if (episodes) {
        episodes.forEach(episode => {
          urls.push({
            loc: `${SITE_URL}/episodes/${episode.id}`,
            lastmod: episode.updated_at?.split('T')[0] || today,
            changefreq: 'monthly',
            priority: '0.7'
          })
        })
      }

    } catch (dbError) {
      console.warn('データベース取得エラー:', dbError)
      // データベースエラーでも静的ページは返す
    }

    // XML生成
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
`

    // URLソート（優先度、最終更新日順）
    urls.sort((a, b) => {
      const priorityDiff = parseFloat(b.priority) - parseFloat(a.priority)
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime()
    })

    urls.forEach(url => {
      sitemap += `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>
`
    })

    sitemap += `</urlset>`

    console.log(`✅ サイトマップ生成完了: ${urls.length} URLs`)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // 1時間キャッシュ
        'Access-Control-Allow-Origin': '*'
      },
      body: sitemap
    }

  } catch (error) {
    console.error('❌ サイトマップ生成エラー:', error)
    
    // エラー時は最小限のサイトマップを返す
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/celebrities/よにのちゃんねる</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300' // 5分キャッシュ
      },
      body: fallbackSitemap
    }
  }
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}