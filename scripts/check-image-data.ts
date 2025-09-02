#!/usr/bin/env node

/**
 * 画像データの状況確認スクリプト
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkImageData() {
  console.log('🔍 画像データの状況を確認中...\n')

  try {
    // 1. locationsテーブルの画像状況
    console.log('📍 Locationsテーブル:')
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id, name, thumbnail_url, images')
      .limit(10)

    if (locError) {
      console.error('❌ Locations取得エラー:', locError)
    } else {
      console.log(`  総数: ${locations?.length || 0}`)
      const withImages = locations?.filter(loc => loc.images || loc.thumbnail_url) || []
      console.log(`  画像あり: ${withImages.length}`)
      
      if (withImages.length > 0) {
        console.log('  例:')
        withImages.slice(0, 3).forEach(loc => {
          console.log(`    - ${loc.name}: ${loc.thumbnail_url || 'images配列'}`)
        })
      }
    }

    // 2. episodesテーブルの画像状況
    console.log('\n🎬 Episodesテーブル:')
    const { data: episodes, error: epError } = await supabase
      .from('episodes')
      .select('id, title, thumbnail_url')
      .limit(10)

    if (epError) {
      console.error('❌ Episodes取得エラー:', epError)
    } else {
      console.log(`  総数: ${episodes?.length || 0}`)
      const withThumbnails = episodes?.filter(ep => ep.thumbnail_url) || []
      console.log(`  サムネイルあり: ${withThumbnails.length}`)
      
      if (withThumbnails.length > 0) {
        console.log('  例:')
        withThumbnails.slice(0, 3).forEach(ep => {
          console.log(`    - ${ep.title?.substring(0, 50)}...: ${ep.thumbnail_url}`)
        })
      }
    }

    // 3. celebritiesテーブルの画像状況
    console.log('\n👨‍🎤 Celebritiesテーブル:')
    const { data: celebrities, error: celError } = await supabase
      .from('celebrities')
      .select('id, name, image_url')
      .limit(10)

    if (celError) {
      console.error('❌ Celebrities取得エラー:', celError)
    } else {
      console.log(`  総数: ${celebrities?.length || 0}`)
      const withImages = celebrities?.filter(cel => cel.image_url) || []
      console.log(`  画像あり: ${withImages.length}`)
      
      if (withImages.length > 0) {
        console.log('  例:')
        withImages.slice(0, 3).forEach(cel => {
          console.log(`    - ${cel.name}: ${cel.image_url}`)
        })
      }
    }

    // 4. itemsテーブルの画像状況
    console.log('\n👕 Itemsテーブル:')
    const { data: items, error: itemError } = await supabase
      .from('items')
      .select('id, name, image_url, images')
      .limit(10)

    if (itemError) {
      console.error('❌ Items取得エラー:', itemError)
    } else {
      console.log(`  総数: ${items?.length || 0}`)
      const withImages = items?.filter(item => item.image_url || item.images) || []
      console.log(`  画像あり: ${withImages.length}`)
      
      if (withImages.length > 0) {
        console.log('  例:')
        withImages.slice(0, 3).forEach(item => {
          console.log(`    - ${item.name}: ${item.image_url || 'images配列'}`)
        })
      }
    }

    console.log('\n📊 サマリー:')
    const totalImages = (withImages?.length || 0) + (withThumbnails?.length || 0) + 
                       (withImages?.length || 0) + (withImages?.length || 0)
    console.log(`  合計画像付きレコード: ${totalImages}`)
    
    if (totalImages === 0) {
      console.log('\n⚠️  画像データが見つかりません！')
      console.log('💡 対策:')
      console.log('  1. Unsplash等のプレースホルダー画像を使用')
      console.log('  2. 実際の店舗・セレブ画像をアップロード')
      console.log('  3. 空のsitemap-images.xmlを除外')
    } else {
      console.log('\n✅ 画像データが存在します。sitemap-images.xml再生成が必要です。')
    }

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkImageData()