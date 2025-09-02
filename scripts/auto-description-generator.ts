#!/usr/bin/env node

/**
 * ロケーション詳細説明自動生成システム
 * データ駆動型でSEO効果的な説明文を生成
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 店舗タイプ別のテンプレート
const storeTypeTemplates = {
  restaurant: {
    keywords: ['レストラン', '食堂', 'グルメ', 'ダイニング'],
    template: (name: string, celebs: string[], episodes: number, location: string) => 
      `${name}は${location}にある${celebs.join('・')}がロケで訪れたレストランです。${episodes}回のエピソードで紹介され、${celebs[0]}の聖地巡礼スポットとしても人気。グルメ好きなファンには特におすすめの店舗です。`
  },
  cafe: {
    keywords: ['カフェ', '喫茶', 'コーヒー', 'ティー'],
    template: (name: string, celebs: string[], episodes: number, location: string) =>
      `${name}は${location}のカフェで、${celebs.join('・')}が${episodes}回のロケで利用。落ち着いた雰囲気で${celebs[0]}ファンの聖地巡礼にも最適。コーヒーやスイーツを楽しみながら、憧れのセレブと同じ空間を体験できます。`
  },
  bar: {
    keywords: ['バー', '居酒屋', '酒場', 'パブ'],
    template: (name: string, celebs: string[], episodes: number, location: string) =>
      `${name}は${location}にあるバー・居酒屋で、${celebs.join('・')}のロケ地として${episodes}回登場。大人の雰囲気を楽しめる${celebs[0]}聖地巡礼スポット。お酒を飲みながらセレブの足跡を辿る特別な体験ができます。`
  },
  ramen: {
    keywords: ['ラーメン', '麺類', 'うどん', 'そば'],
    template: (name: string, celebs: string[], episodes: number, location: string) =>
      `${name}は${location}の麺類店で、${celebs.join('・')}が${episodes}回のロケで訪問。${celebs[0]}お気に入りのラーメン・麺類が味わえる聖地巡礼必須スポット。ファンなら一度は食べてみたい名店です。`
  },
  specialty: {
    keywords: ['専門店', '名店', '老舗', '有名'],
    template: (name: string, celebs: string[], episodes: number, location: string) =>
      `${name}は${location}にある専門店・名店で、${celebs.join('・')}のロケ地として${episodes}回紹介。${celebs[0]}が実際に体験した特別な味やサービスを楽しめる聖地巡礼スポットです。`
  },
  entertainment: {
    keywords: ['エンターテイメント', '体験', 'アクティビティ', '施設'],
    template: (name: string, celebs: string[], episodes: number, location: string) =>
      `${name}は${location}のエンターテイメント施設で、${celebs.join('・')}が${episodes}回のロケで利用。${celebs[0]}と同じ体験ができる人気の聖地巡礼スポット。ファンには特別な思い出になること間違いなしです。`
  }
}

function detectStoreType(name: string, tags: string[], description: string): string {
  const text = `${name} ${tags?.join(' ') || ''} ${description || ''}`.toLowerCase()
  
  for (const [type, config] of Object.entries(storeTypeTemplates)) {
    if (config.keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      return type
    }
  }
  
  return 'specialty' // デフォルト
}

function extractLocationFromAddress(address: string): string {
  if (!address) return '都内'
  
  // 地域抽出パターン
  const patterns = [
    /東京都([^区市町村]+[区市町村])/,
    /東京都(\w+区)/,
    /東京都(\w+市)/,
    /(神奈川県[^市区町村]+[市区町村])/,
    /(埼玉県[^市区町村]+[市区町村])/,
    /(千葉県[^市区町村]+[市区町村])/,
    /(大阪[府市][^区市町村]*[区市]?)/,
    /(京都[府市])/,
    /(神戸市)/,
    /(横浜市)/,
    /(名古屋市)/
  ]
  
  for (const pattern of patterns) {
    const match = address.match(pattern)
    if (match) return match[1]
  }
  
  return '都内'
}

function generateEnhancedDescription(location: any): string {
  const name = location.name
  const address = location.address || ''
  const tags = location.tags || []
  const episodes = location.episode_locations || []
  const currentDesc = location.description || ''
  
  // 基本情報抽出
  const episodeCount = episodes.length
  const celebrities = [...new Set(episodes.map(ep => 
    ep.episodes?.celebrities?.name).filter(Boolean))]
  
  if (celebrities.length === 0) {
    return currentDesc || `${name}の詳細情報。ロケ地・聖地巡礼スポットとして注目されています。`
  }
  
  // 店舗タイプ検出
  const storeType = detectStoreType(name, tags, currentDesc)
  const template = storeTypeTemplates[storeType] || storeTypeTemplates.specialty
  
  // 所在地抽出
  const locationArea = extractLocationFromAddress(address)
  
  // 基本説明生成
  let description = template.template(name, celebrities, episodeCount, locationArea)
  
  // 追加情報の付加
  const additions = []
  
  // タベログURL情報
  if (location.tabelog_url) {
    additions.push('食べログでも高評価を獲得している人気店')
  }
  
  // 営業時間・電話番号情報
  if (location.phone || location.opening_hours) {
    additions.push('事前の確認・予約がおすすめ')
  }
  
  // 特別なタグ情報
  if (tags.includes('老舗')) {
    additions.push('長年愛される老舗の味を堪能できます')
  }
  
  if (tags.includes('孤独のグルメ')) {
    additions.push('孤独のグルメファンにも必見のスポット')
  }
  
  // シーズン情報
  const seasonTags = tags.filter(tag => tag.includes('Season'))
  if (seasonTags.length > 0) {
    additions.push(`${seasonTags.join('・')}での撮影地`)
  }
  
  // 追加情報を結合
  if (additions.length > 0) {
    description += ` ${additions.join('。')}。`
  }
  
  // SEO効果的な締めくくり
  description += ` ${name}で${celebrities[0]}と同じ体験をしてみませんか？`
  
  return description
}

async function generateDescriptionsForAllLocations() {
  console.log('📝 ロケーション詳細説明自動生成')
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
  
  // 説明が不十分なものを優先
  const needsDescription = locations.filter(loc => 
    !loc.description || loc.description.length < 50
  )
  
  console.log(`🎯 説明強化対象: ${needsDescription.length}件`)
  
  const generatedDescriptions = []
  
  // 各ロケーションの説明生成（サンプル表示）
  console.log('\n📝 【生成された説明文サンプル】')
  console.log('='.repeat(50))
  
  needsDescription.slice(0, 10).forEach((loc, i) => {
    const generated = generateEnhancedDescription(loc)
    generatedDescriptions.push({
      id: loc.id,
      name: loc.name,
      original: loc.description || '',
      generated: generated
    })
    
    console.log(`${i+1}. ${loc.name}`)
    console.log(`   元の説明: ${loc.description || 'なし'}`)
    console.log(`   新しい説明: ${generated}`)
    console.log(`   文字数: ${loc.description?.length || 0} → ${generated.length}`)
    console.log('')
  })
  
  // バックアップ用JSONファイル作成
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = `generated-descriptions-${timestamp}.json`
  
  const allGenerated = locations.map(loc => ({
    id: loc.id,
    name: loc.name,
    original: loc.description || '',
    generated: generateEnhancedDescription(loc),
    needsUpdate: !loc.description || loc.description.length < 50
  }))
  
  fs.writeFileSync(backupFile, JSON.stringify(allGenerated, null, 2))
  console.log(`💾 生成結果保存: ${backupFile}`)
  
  console.log('\n📊 【生成統計】')
  console.log('='.repeat(30))
  console.log(`総処理数: ${locations.length}件`)
  console.log(`新規生成: ${needsDescription.length}件`)
  console.log(`平均文字数向上: ${Math.round(allGenerated.filter(g => g.needsUpdate).reduce((sum, g) => sum + (g.generated.length - g.original.length), 0) / needsDescription.length)}文字`)
  
  return {
    totalLocations: locations.length,
    needsUpdate: needsDescription.length,
    generatedDescriptions: allGenerated,
    backupFile
  }
}

// 実行
generateDescriptionsForAllLocations()
  .then(result => {
    console.log(`\n✅ 説明文自動生成完了!`)
    console.log(`   処理: ${result.totalLocations}件`)
    console.log(`   強化対象: ${result.needsUpdate}件`)
    console.log(`   バックアップ: ${result.backupFile}`)
    console.log('\n🚀 次ステップ: データベース更新スクリプトの実行準備完了')
  })
  .catch(error => {
    console.error('❌ 生成エラー:', error)
  })