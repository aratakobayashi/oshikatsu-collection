/**
 * Netlify Functions - robots.txt の動的生成
 * 環境に応じて適切なrobot.txtを返す
 */

exports.handler = async (event, context) => {
  const appEnv = process.env.APP_ENV || process.env.VITE_ENVIRONMENT || 'development'
  const siteUrl = process.env.VITE_APP_URL || 'https://collection.oshikatsu-guide.com'
  
  let robotsContent = ''
  
  if (appEnv === 'production') {
    // 本番環境：正常な運用
    robotsContent = `# Robots.txt for oshikatsu-collection
# Environment: ${appEnv}
# Generated: ${new Date().toISOString()}

User-agent: *
Allow: /

# よにのちゃんねる関連コンテンツ
Allow: /celebrities/よにのちゃんねる
Allow: /episodes/*
Allow: /items/*
Allow: /locations/*

# 管理画面は除外
Disallow: /admin/
Disallow: /api/

# サイトマップ
Sitemap: ${siteUrl}/sitemap.xml

# 推奨されるクロール間隔
Crawl-delay: 1`
  } else {
    // staging/preview環境：インデックスを防ぐ
    robotsContent = `# Robots.txt for oshikatsu-collection
# Environment: ${appEnv}
# Generated: ${new Date().toISOString()}

User-agent: *
Disallow: /

# This is a ${appEnv} environment
# Please do not index this site.`
  }
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // 24時間キャッシュ
    },
    body: robotsContent
  }
}