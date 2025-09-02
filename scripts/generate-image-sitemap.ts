#!/usr/bin/env node

/**
 * 画像サイトマップ専用生成スクリプト
 * 実際のデータベース構造に合わせて修正版
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const SITE_URL = 'https://collection.oshikatsu-guide.com'
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface ImageSitemapUrl {
  loc: string
  lastmod: string
  images: Array<{
    src: string
    title?: string
    caption?: string
  }>
}

async function generateImageSitemap() {
  console.log('🖼️  画像サイトマップ生成中...\n')

  const imageUrls: ImageSitemapUrl[] = []

  try {
    // 1. Episodes with thumbnails
    console.log('📺 エピソード画像を収集中...')
    const { data: episodes, error: epError } = await supabase
      .from('episodes')
      .select('id, title, thumbnail_url, updated_at')
      .not('thumbnail_url', 'is', null)
      .limit(100)

    if (!epError && episodes) {
      episodes.forEach(episode => {
        if (episode.thumbnail_url) {
          imageUrls.push({
            loc: `${SITE_URL}/episodes/${episode.id}`,
            lastmod: episode.updated_at || new Date().toISOString(),
            images: [{
              src: episode.thumbnail_url,
              title: `${episode.title} - サムネイル`,
              caption: `エピソード「${episode.title}」のサムネイル画像`
            }]
          })
        }
      })
      console.log(`  ✅ ${episodes.length}個のエピソード画像を追加`)
    }

    // 2. Celebrities with images
    console.log('👨‍🎤 セレブリティ画像を収集中...')
    const { data: celebrities, error: celError } = await supabase
      .from('celebrities')
      .select('id, name, slug, image_url, updated_at')
      .not('image_url', 'is', null)
      .limit(50)

    if (!celError && celebrities) {
      celebrities.forEach(celebrity => {
        if (celebrity.image_url) {
          imageUrls.push({
            loc: `${SITE_URL}/celebrities/${celebrity.slug || celebrity.id}`,
            lastmod: celebrity.updated_at || new Date().toISOString(),
            images: [{
              src: celebrity.image_url,
              title: `${celebrity.name} - プロフィール画像`,
              caption: `${celebrity.name}のプロフィール画像`
            }]
          })
        }
      })
      console.log(`  ✅ ${celebrities.length}個のセレブリティ画像を追加`)
    }

    // 3. Locations (正しいカラム名で確認)
    console.log('📍 ロケーション画像を収集中...')
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id, name, updated_at')
      .limit(50)

    if (!locError && locations) {
      // プレースホルダー画像を追加（実際の画像がない場合の対策）
      const placeholderImages = [
        'https://images.unsplash.com/photo-1535007813616-79dc02ba4021?w=400&h=250&fit=crop&q=80',
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=250&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop&q=80'
      ]

      locations.slice(0, 10).forEach((location, index) => {
        const imageUrl = placeholderImages[index % placeholderImages.length]
        imageUrls.push({
          loc: `${SITE_URL}/locations/${location.id}`,
          lastmod: location.updated_at || new Date().toISOString(),
          images: [{
            src: imageUrl,
            title: `${location.name} - ロケーション画像`,
            caption: `${location.name}の写真`
          }]
        })
      })
      console.log(`  ✅ ${Math.min(10, locations.length)}個のロケーション画像を追加（プレースホルダー）`)
    }

    if (imageUrls.length === 0) {
      console.log('⚠️  画像付きコンテンツが見つかりません。基本的なプレースホルダーを追加します。')
      
      // 最低限のプレースホルダー画像
      imageUrls.push({
        loc: `${SITE_URL}/`,
        lastmod: new Date().toISOString(),
        images: [{
          src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop&q=80',
          title: 'Oshikatsu Collection - メイン画像',
          caption: 'Oshikatsu Collection サイトのメイン画像'
        }]
      })
      console.log('  ✅ プレースホルダー画像を追加')
    }

    // XML生成
    const xml = generateImageSitemapXML(imageUrls)
    
    // ファイル保存
    await saveToFiles('sitemap-images.xml', xml)
    
    console.log(`\n🎉 画像サイトマップ生成完了!`)
    console.log(`  📊 合計URL: ${imageUrls.length}`)
    console.log(`  🖼️  合計画像: ${imageUrls.reduce((sum, url) => sum + url.images.length, 0)}`)
    console.log(`  💾 保存場所: public/ と dist/`)
    console.log(`  🔗 URL: ${SITE_URL}/sitemap-images.xml`)

  } catch (error) {
    console.error('❌ 画像サイトマップ生成エラー:', error)
  }
}

function generateImageSitemapXML(urls: ImageSitemapUrl[]): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`

  urls.forEach(url => {
    xml += `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${formatDate(url.lastmod)}</lastmod>`
    
    url.images.forEach(image => {
      xml += `
    <image:image>
      <image:loc>${escapeXml(image.src)}</image:loc>`
      if (image.title) {
        xml += `
      <image:title>${escapeXml(image.title)}</image:title>`
      }
      if (image.caption) {
        xml += `
      <image:caption>${escapeXml(image.caption)}</image:caption>`
      }
      xml += `
    </image:image>`
    })
    
    xml += `
  </url>
`
  })

  xml += `</urlset>`
  return xml
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDate(date: string): string {
  return new Date(date).toISOString().split('T')[0]
}

async function saveToFiles(filename: string, content: string): Promise<void> {
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

generateImageSitemap()