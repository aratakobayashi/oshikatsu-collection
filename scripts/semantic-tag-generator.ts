#!/usr/bin/env node

/**
 * セマンティックタグ付けシステム
 * SEO効果的なタグを自動生成・分類
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// セマンティックタグ分類システム
const tagCategories = {
  // 店舗カテゴリー
  restaurant_type: {
    patterns: [
      { keywords: ['ラーメン', '麺'], tags: ['ラーメン', '麺類', '人気ラーメン店'] },
      { keywords: ['寿司'], tags: ['寿司', '和食', '江戸前寿司'] },
      { keywords: ['焼肉'], tags: ['焼肉', '韓国料理', 'BBQ'] },
      { keywords: ['中華'], tags: ['中華料理', 'アジアン', '中国料理'] },
      { keywords: ['イタリアン', 'ピザ', 'パスタ'], tags: ['イタリアン', '洋食', 'ピザ'] },
      { keywords: ['フレンチ'], tags: ['フレンチ', '洋食', '高級料理'] },
      { keywords: ['カフェ', 'コーヒー'], tags: ['カフェ', 'コーヒー', '喫茶店'] },
      { keywords: ['バー', '居酒屋'], tags: ['バー', '居酒屋', 'お酒'] },
      { keywords: ['定食', '食堂'], tags: ['定食', '食堂', '家庭料理'] },
      { keywords: ['そば', 'うどん'], tags: ['麺類', '和食', 'そば・うどん'] }
    ]
  },
  
  // 地域カテゴリー
  location: {
    patterns: [
      { keywords: ['銀座'], tags: ['銀座', '東京', '高級エリア'] },
      { keywords: ['渋谷'], tags: ['渋谷', '東京', '若者の街'] },
      { keywords: ['新宿'], tags: ['新宿', '東京', '繁華街'] },
      { keywords: ['池袋'], tags: ['池袋', '東京', 'サンシャインシティ'] },
      { keywords: ['原宿', '表参道'], tags: ['原宿・表参道', '東京', 'ファッション'] },
      { keywords: ['六本木'], tags: ['六本木', '東京', 'ナイトライフ'] },
      { keywords: ['麻布'], tags: ['麻布', '東京', '高級住宅街'] },
      { keywords: ['築地'], tags: ['築地', '東京', '市場グルメ'] },
      { keywords: ['浅草'], tags: ['浅草', '東京', '下町'] },
      { keywords: ['吉祥寺'], tags: ['吉祥寺', '東京', '住みたい街'] },
      { keywords: ['横浜'], tags: ['横浜', '神奈川', 'みなとみらい'] },
      { keywords: ['大阪'], tags: ['大阪', '関西', 'グルメの街'] }
    ]
  },
  
  // セレブリティカテゴリー
  celebrity: {
    patterns: [
      { keywords: ['松重豊'], tags: ['松重豊', '孤独のグルメ', 'グルメロケ'] },
      { keywords: ['SixTONES'], tags: ['SixTONES', 'ジャニーズ', 'アイドル'] },
      { keywords: ['Snow Man'], tags: ['Snow Man', 'ジャニーズ', 'アイドル'] },
      { keywords: ['≠ME'], tags: ['≠ME', '女性アイドル', '指原莉乃プロデュース'] },
      { keywords: ['よにのちゃんねる'], tags: ['よにのちゃんねる', 'YouTuber', 'エンターテイメント'] },
      { keywords: ['亀梨和也'], tags: ['亀梨和也', 'KAT-TUN', 'ジャニーズ'] },
      { keywords: ['二宮和也'], tags: ['二宮和也', '嵐', 'ジャニーズ'] },
      { keywords: ['=LOVE'], tags: ['=LOVE', '女性アイドル', '指原莉乃プロデュース'] }
    ]
  },
  
  // 特徴カテゴリー
  characteristics: {
    patterns: [
      { keywords: ['老舗'], tags: ['老舗', '伝統', '歴史ある店'] },
      { keywords: ['有名', '人気'], tags: ['人気店', '有名店', '話題'] },
      { keywords: ['高級', 'ミシュラン'], tags: ['高級店', 'ミシュラン', '特別な日'] },
      { keywords: ['隠れ家'], tags: ['隠れ家', '穴場', '知る人ぞ知る'] },
      { keywords: ['夜景', '景色'], tags: ['夜景', '絶景', 'デート'] },
      { keywords: ['食べ放題', 'バイキング'], tags: ['食べ放題', 'バイキング', 'ボリューム満点'] },
      { keywords: ['テイクアウト'], tags: ['テイクアウト', 'お持ち帰り', 'デリバリー'] }
    ]
  },
  
  // 体験カテゴリー
  experience: {
    patterns: [
      { keywords: ['聖地巡礼'], tags: ['聖地巡礼', 'ロケ地', 'ファン必見'] },
      { keywords: ['デート'], tags: ['デート', 'カップル', 'ロマンチック'] },
      { keywords: ['一人飯', '一人'], tags: ['一人飯', 'ソロ活', 'おひとりさま'] },
      { keywords: ['女子会'], tags: ['女子会', '友達', 'インスタ映え'] },
      { keywords: ['家族'], tags: ['ファミリー', '家族連れ', '子連れOK'] }
    ]
  }
}

function generateSemanticTags(location: any): string[] {
  const name = location.name || ''
  const description = location.description || ''
  const address = location.address || ''
  const currentTags = location.tags || []
  const episodes = location.episode_locations || []
  
  // セレブリティ情報
  const celebrities = [...new Set(episodes.map(ep => 
    ep.episodes?.celebrities?.name).filter(Boolean))]
  
  // 検索対象テキスト
  const searchText = `${name} ${description} ${address} ${currentTags.join(' ')} ${celebrities.join(' ')}`.toLowerCase()
  
  const generatedTags = new Set(currentTags) // 既存タグを保持
  
  // 各カテゴリーでタグ生成
  for (const [category, config] of Object.entries(tagCategories)) {
    for (const pattern of config.patterns) {
      if (pattern.keywords.some(keyword => searchText.includes(keyword.toLowerCase()))) {
        pattern.tags.forEach(tag => generatedTags.add(tag))
      }
    }
  }
  
  // セレブリティ固有タグ
  celebrities.forEach(celeb => {
    generatedTags.add(celeb)
    generatedTags.add(`${celeb}ロケ地`)
    generatedTags.add('聖地巡礼')
  })
  
  // エピソード数によるタグ
  const episodeCount = episodes.length
  if (episodeCount > 1) {
    generatedTags.add('人気ロケ地')
    generatedTags.add('複数回登場')
  }
  
  // タベログURLがある場合
  if (location.tabelog_url) {
    generatedTags.add('食べログ掲載')
    generatedTags.add('人気店')
  }
  
  // 住所ベースの地域タグ
  if (address) {
    if (address.includes('東京')) generatedTags.add('東京')
    if (address.includes('神奈川')) generatedTags.add('神奈川')
    if (address.includes('大阪')) generatedTags.add('大阪')
    if (address.includes('京都')) generatedTags.add('京都')
  }
  
  return Array.from(generatedTags).slice(0, 15) // 上限15個
}

async function generateTagsForAllLocations() {
  console.log('🏷️ セマンティックタグ生成システム')
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
  
  console.log(`📊 処理対象: ${locations.length}件`)
  
  // タグが不足しているものを優先
  const needsTags = locations.filter(loc => 
    !loc.tags || loc.tags.length < 5
  )
  
  console.log(`🎯 タグ強化対象: ${needsTags.length}件`)
  
  // タグ生成結果
  const tagResults = []
  
  console.log('\n🏷️ 【生成されたタグサンプル】')
  console.log('='.repeat(50))
  
  needsTags.slice(0, 10).forEach((loc, i) => {
    const originalTags = loc.tags || []
    const generatedTags = generateSemanticTags(loc)
    const newTags = generatedTags.filter(tag => !originalTags.includes(tag))
    
    tagResults.push({
      id: loc.id,
      name: loc.name,
      originalTags,
      generatedTags,
      newTags
    })
    
    console.log(`${i+1}. ${loc.name}`)
    console.log(`   元のタグ (${originalTags.length}): ${originalTags.slice(0, 3).join(', ')}${originalTags.length > 3 ? '...' : ''}`)
    console.log(`   新しいタグ (${generatedTags.length}): ${generatedTags.slice(0, 5).join(', ')}${generatedTags.length > 5 ? '...' : ''}`)
    console.log(`   追加タグ数: ${newTags.length}`)
    console.log('')
  })
  
  // 全データのタグ生成
  const allTagResults = locations.map(loc => ({
    id: loc.id,
    name: loc.name,
    originalTags: loc.tags || [],
    generatedTags: generateSemanticTags(loc),
    needsUpdate: !loc.tags || loc.tags.length < 5
  }))
  
  // バックアップファイル作成
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = `generated-tags-${timestamp}.json`
  
  fs.writeFileSync(backupFile, JSON.stringify(allTagResults, null, 2))
  console.log(`💾 タグ生成結果保存: ${backupFile}`)
  
  // タグ統計分析
  const allNewTags = new Map()
  allTagResults.forEach(result => {
    result.generatedTags.forEach(tag => {
      allNewTags.set(tag, (allNewTags.get(tag) || 0) + 1)
    })
  })
  
  const topNewTags = Array.from(allNewTags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
  
  console.log('\n📊 【生成されたタグ統計 TOP20】')
  console.log('='.repeat(40))
  topNewTags.forEach(([tag, count], i) => {
    console.log(`${i+1}. "${tag}": ${count}件`)
  })
  
  console.log('\n📊 【タグ生成統計】')
  console.log('='.repeat(30))
  console.log(`総処理数: ${locations.length}件`)
  console.log(`強化対象: ${needsTags.length}件`)
  console.log(`平均タグ数向上: ${Math.round(allTagResults.filter(r => r.needsUpdate).reduce((sum, r) => sum + (r.generatedTags.length - r.originalTags.length), 0) / needsTags.length)}個`)
  console.log(`新規タグ種類: ${allNewTags.size}種類`)
  
  return {
    totalLocations: locations.length,
    needsUpdate: needsTags.length,
    tagResults: allTagResults,
    backupFile,
    newTagTypes: allNewTags.size
  }
}

// 実行
generateTagsForAllLocations()
  .then(result => {
    console.log(`\n✅ セマンティックタグ生成完了!`)
    console.log(`   処理: ${result.totalLocations}件`)
    console.log(`   強化対象: ${result.needsUpdate}件`)
    console.log(`   新規タグ種類: ${result.newTagTypes}種類`)
    console.log(`   バックアップ: ${result.backupFile}`)
    console.log('\n🚀 次ステップ: タグデータベース更新の準備完了')
  })
  .catch(error => {
    console.error('❌ タグ生成エラー:', error)
  })