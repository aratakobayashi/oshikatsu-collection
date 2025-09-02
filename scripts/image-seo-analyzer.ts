#!/usr/bin/env node

/**
 * 画像SEO対応分析・最適化システム
 * alt属性、構造化データ、画像最適化の提案
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 画像SEO最適化用のalt属性生成
function generateOptimizedAltText(location: any): {
  locationImage: string,
  celebrityImage: string,
  episodeImage: string,
  mapImage: string
} {
  const name = location.name || ''
  const address = location.address || ''
  const celebrities = [...new Set(location.episode_locations?.map(ep => 
    ep.episodes?.celebrities?.name).filter(Boolean) || [])]
  const episodeCount = location.episode_locations?.length || 0
  
  // 地域抽出
  const locationArea = address.match(/東京都([^区市町村]+[区市町村])/) || 
                      address.match(/東京都(\w+区)/) ||
                      address.match(/(神奈川県[^市区町村]+[市区町村])/) ||
                      ['', '都内']
  const area = locationArea[1] || '都内'
  
  return {
    // メイン店舗画像
    locationImage: `${name}の外観写真。${area}にある${celebrities[0] || 'セレブリティ'}の聖地巡礼ロケ地として人気の店舗`,
    
    // セレブリティ関連画像  
    celebrityImage: celebrities.length > 0 
      ? `${celebrities[0]}が${name}を訪れた際の写真。${episodeCount}回のロケで使用された人気聖地巡礼スポット`
      : `${name}でのロケ撮影風景。人気の聖地巡礼スポットとして知られる`,
    
    // エピソード画像
    episodeImage: episodeCount > 0
      ? `${name}で撮影されたエピソードのシーン。${celebrities.join('・')}の${episodeCount}回登場ロケ地`
      : `${name}での撮影風景`,
    
    // 地図・アクセス画像
    mapImage: `${name}の場所を示すマップ。${area}のアクセス情報と周辺環境`
  }
}

// 構造化データ用の画像情報生成
function generateStructuredImageData(location: any, altTexts: any): any {
  const baseUrl = 'https://collection.oshikatsu-guide.com'
  const name = location.name || ''
  const celebrities = [...new Set(location.episode_locations?.map(ep => 
    ep.episodes?.celebrities?.name).filter(Boolean) || [])]
  
  return {
    '@type': 'ImageObject',
    contentUrl: `${baseUrl}/images/locations/${location.id}/main.jpg`,
    description: altTexts.locationImage,
    name: `${name}の店舗画像`,
    author: {
      '@type': 'Organization', 
      name: '推し活コレクション'
    },
    copyrightHolder: {
      '@type': 'Organization',
      name: '推し活コレクション'
    },
    keywords: [
      name,
      '聖地巡礼',
      'ロケ地',
      ...celebrities,
      'グルメ',
      'セレブリティスポット'
    ].join(', ')
  }
}

// ReactコンポーネントのImageコンポーネント最適化提案
function generateImageComponentOptimization(): string {
  return `
// 📷 推奨: 最適化されたImageコンポーネント
import React from 'react'
import Image from 'next/image'

interface OptimizedLocationImageProps {
  location: {
    id: string
    name: string
    address: string
    celebrities: string[]
    episodeCount: number
  }
  type: 'main' | 'celebrity' | 'episode' | 'map'
  className?: string
  priority?: boolean
}

export const OptimizedLocationImage: React.FC<OptimizedLocationImageProps> = ({
  location,
  type = 'main',
  className,
  priority = false
}) => {
  // alt属性の動的生成
  const generateAlt = () => {
    const area = location.address?.match(/東京都([^区市町村]+[区市町村])/)?.[1] || '都内'
    const celeb = location.celebrities[0] || 'セレブリティ'
    
    const altTexts = {
      main: \`\${location.name}の外観写真。\${area}にある\${celeb}の聖地巡礼ロケ地として人気の店舗\`,
      celebrity: \`\${celeb}が\${location.name}を訪れた際の写真。\${location.episodeCount}回のロケで使用された人気聖地巡礼スポット\`,
      episode: \`\${location.name}で撮影されたエピソードのシーン。\${location.celebrities.join('・')}の\${location.episodeCount}回登場ロケ地\`,
      map: \`\${location.name}の場所を示すマップ。\${area}のアクセス情報と周辺環境\`
    }
    
    return altTexts[type]
  }

  // 画像パスの生成
  const imagePath = \`/images/locations/\${location.id}/\${type}.jpg\`
  const fallbackPath = \`/images/default-\${type}.jpg\`

  return (
    <Image
      src={imagePath}
      alt={generateAlt()}
      className={className}
      width={type === 'main' ? 800 : 400}
      height={type === 'main' ? 600 : 300}
      priority={priority}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBxdWFsaXR5ID0gODAK/9sAQwAGBAUGBQQGBgUGBwcGCAoQCgoJCQoUDg0NDhQUFhsXGBYSFB0cHiocHikxLy4pNjVEQT1MSjRASWNKYEpEVlNP/9sAQwEHBwcKCAoTCgoTT0gHSE9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09P/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A3vAf/IV8V/8AX1B/6VGtPUNPlu/J+wW8jmNNqhO6kqnbNNoor6U+YP/Z"
      onError={() => {
        // フォールバック画像への切り替え
        (event.target as HTMLImageElement).src = fallbackPath
      }}
      style={{
        objectFit: 'cover',
        aspectRatio: type === 'main' ? '4/3' : '4/3'
      }}
    />
  )
}
`
}

async function analyzeImageSEOOpportunities() {
  console.log('📷 画像SEO対応分析')
  console.log('='.repeat(60))
  
  // 全データ取得
  const { data: locations, error } = await supabase
    .from('locations')
    .select(`
      id, name, address, description, tags,
      tabelog_url, website_url, phone, opening_hours,
      episode_locations(
        id, episode_id,
        episodes(id, title, celebrities(name))
      )
    `)
  
  if (error) {
    throw new Error(`データ取得エラー: ${error.message}`)
  }
  
  console.log(`📊 分析対象: ${locations.length}件`)
  
  // 画像SEO最適化データ生成
  const imageSEOData = locations.map(location => {
    const altTexts = generateOptimizedAltText(location)
    const structuredImageData = generateStructuredImageData(location, altTexts)
    
    return {
      locationId: location.id,
      locationName: location.name,
      altTexts,
      structuredImageData,
      celebrities: [...new Set(location.episode_locations?.map(ep => 
        ep.episodes?.celebrities?.name).filter(Boolean) || [])],
      episodeCount: location.episode_locations?.length || 0
    }
  })
  
  // 優先度の高いロケーション（複数エピソード）
  const highPriorityLocations = imageSEOData
    .filter(data => data.episodeCount > 1)
    .sort((a, b) => b.episodeCount - a.episodeCount)
  
  console.log('\n📷 【画像SEO最適化サンプル】')
  console.log('='.repeat(50))
  
  highPriorityLocations.slice(0, 5).forEach((data, i) => {
    console.log(`${i+1}. ${data.locationName} (${data.episodeCount}エピソード)`)
    console.log(`   セレブ: ${data.celebrities.join(', ')}`)
    console.log(`   メイン画像alt: ${data.altTexts.locationImage}`)
    console.log(`   セレブ画像alt: ${data.altTexts.celebrityImage}`)
    console.log('')
  })
  
  // バックアップファイル作成
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = `image-seo-optimization-${timestamp}.json`
  
  const imageOptimizationData = {
    generatedAt: new Date().toISOString(),
    totalLocations: locations.length,
    highPriorityCount: highPriorityLocations.length,
    imageSEOData,
    componentOptimization: generateImageComponentOptimization()
  }
  
  fs.writeFileSync(backupFile, JSON.stringify(imageOptimizationData, null, 2))
  console.log(`💾 画像SEO最適化データ保存: ${backupFile}`)
  
  // 実装提案
  console.log('\n💡 【画像SEO実装提案】')
  console.log('='.repeat(40))
  
  console.log('1. 【alt属性の動的生成】')
  console.log(`   - 全${locations.length}件のロケーションでSEO最適化alt属性`)
  console.log(`   - セレブリティ名、地域名、店舗特徴を含む記述的alt属性`)
  console.log(`   - 「聖地巡礼」「ロケ地」などSEOキーワード含有`)
  console.log('')
  
  console.log('2. 【構造化データ対応】')
  console.log(`   - ImageObject構造化データで検索エンジン対応`)
  console.log(`   - 著作権、キーワード、説明文の最適化`)
  console.log(`   - Google画像検索での表示向上`)
  console.log('')
  
  console.log('3. 【優先実装対象】')
  console.log(`   - 高優先度: ${highPriorityLocations.length}件（複数エピソード）`)
  console.log(`   - 松重豊関連: 約125件`)
  console.log(`   - ジャニーズ関連: 約50件`)
  console.log('')
  
  console.log('4. 【技術的実装】')
  console.log(`   - Next.js Imageコンポーネント最適化`)
  console.log(`   - レスポンシブ画像、遅延読み込み対応`)
  console.log(`   - WebP形式での軽量化`)
  
  return {
    totalLocations: locations.length,
    highPriorityCount: highPriorityLocations.length,
    imageSEOData,
    backupFile
  }
}

// 実行
analyzeImageSEOOpportunities()
  .then(result => {
    console.log(`\n✅ 画像SEO分析完了!`)
    console.log(`   対象ロケーション: ${result.totalLocations}件`)
    console.log(`   高優先度: ${result.highPriorityCount}件`)
    console.log(`   最適化データ: ${result.backupFile}`)
    console.log('\n🚀 画像SEO実装準備完了！')
  })
  .catch(error => {
    console.error('❌ 画像SEO分析エラー:', error)
  })