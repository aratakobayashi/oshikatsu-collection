#!/usr/bin/env npx tsx

/**
 * 食べログアフィリエイト対象店舗の分析スクリプト
 * バリューコマース プログラムID: 2147651
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 本番環境の設定を読み込み
dotenv.config({ path: resolve(__dirname, '../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Location {
  id: string
  name: string
  address: string | null
  website_url: string | null
  tags: string[] | null
  description: string | null
  phone: string | null
  tabelog_url: string | null
}

async function analyzeLocations() {
  try {
    console.log('🔍 本番環境のロケーションデータを分析中...')
    console.log('Supabase URL:', supabaseUrl)
    console.log('')
    
    // 全ロケーションを取得（tabelog_urlはまだ本番にないので除外）
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, address, website_url, tags, description, phone')
      .order('name')
    
    if (error) {
      console.error('❌ エラー:', error)
      return
    }
    
    if (!locations || locations.length === 0) {
      console.log('⚠️ ロケーションデータが見つかりません')
      return
    }
    
    console.log('📊 ロケーション分析結果')
    console.log('=' .repeat(70))
    console.log(`総ロケーション数: ${locations.length}件`)
    
    // 飲食店キーワードリスト
    const restaurantKeywords = [
      'レストラン', 'カフェ', '料理', '食堂', 'ラーメン', '寿司', '鮨',
      '焼肉', '焼き肉', '居酒屋', 'バー', 'ベーカリー', 'パン屋',
      'ビストロ', 'トラットリア', 'ダイニング', 'グリル', 'キッチン',
      '茶', 'コーヒー', 'スイーツ', 'ケーキ', 'デザート', '和食', '洋食',
      '中華', 'イタリアン', 'フレンチ', '韓国料理', 'そば', 'うどん',
      'カレー', 'ハンバーガー', 'ピザ', 'パスタ', '定食', '弁当'
    ]
    
    // 飲食店を検出
    const restaurants = locations.filter((loc: Location) => {
      const searchText = [
        loc.name || '',
        loc.description || '',
        (loc.tags || []).join(' '),
        loc.address || ''
      ].join(' ').toLowerCase()
      
      return restaurantKeywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      )
    })
    
    console.log(`飲食店と思われる数: ${restaurants.length}件 (${Math.round(restaurants.length / locations.length * 100)}%)`)
    
    // 既存のURL状況を分析
    const withWebsite = locations.filter((loc: Location) => loc.website_url)
    const withTabelog = locations.filter((loc: Location) => 
      loc.website_url?.includes('tabelog.com')
    )
    const withPhone = locations.filter((loc: Location) => loc.phone)
    
    console.log(``)
    console.log(`📱 データ充実度:`)
    console.log(`  - Website URLあり: ${withWebsite.length}件`)
    console.log(`  - 電話番号あり: ${withPhone.length}件`)
    console.log(`  - 既に食べログURL: ${withTabelog.length}件`)
    
    // 住所から地域を分析
    console.log('')
    console.log('📍 地域分布:')
    const regions: { [key: string]: number } = {}
    locations.forEach((loc: Location) => {
      if (loc.address) {
        const prefecture = loc.address.match(/^(東京都|大阪府|京都府|.{2,3}県)/)?.[0]
        if (prefecture) {
          regions[prefecture] = (regions[prefecture] || 0) + 1
        }
      }
    })
    
    Object.entries(regions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([region, count]) => {
        console.log(`  - ${region}: ${count}件`)
      })
    
    // アフィリエイト対象候補をリストアップ
    console.log('')
    console.log('🎯 食べログアフィリエイト対象候補（飲食店で食べログURLが未設定）:')
    console.log('-' .repeat(70))
    
    const candidates = restaurants.filter((loc: Location) => 
      !loc.website_url?.includes('tabelog.com')
    )
    
    console.log(`対象候補数: ${candidates.length}件`)
    console.log('')
    
    // 最初の20件を詳細表示
    console.log('📝 候補リスト（最初の20件）:')
    console.log('-' .repeat(70))
    
    candidates.slice(0, 20).forEach((loc: Location, i: number) => {
      console.log(`${i + 1}. ${loc.name}`)
      console.log(`   ID: ${loc.id}`)
      if (loc.address) console.log(`   住所: ${loc.address}`)
      if (loc.phone) console.log(`   電話: ${loc.phone}`)
      if (loc.website_url) console.log(`   現在のURL: ${loc.website_url}`)
      console.log('')
    })
    
    // CSVエクスポート用のデータを準備
    console.log('💾 CSVエクスポート用データを生成中...')
    const csvData = candidates.map((loc: Location) => ({
      id: loc.id,
      name: loc.name,
      address: loc.address || '',
      phone: loc.phone || '',
      current_url: loc.website_url || ''
    }))
    
    // CSVファイルに保存
    const csv = [
      'ID,店舗名,住所,電話番号,現在のURL',
      ...csvData.map(row => 
        `"${row.id}","${row.name}","${row.address}","${row.phone}","${row.current_url}"`
      )
    ].join('\n')
    
    const fs = await import('fs')
    const outputPath = resolve(__dirname, '../tabelog-candidates.csv')
    fs.writeFileSync(outputPath, csv, 'utf-8')
    
    console.log(`✅ CSVファイルを保存しました: ${outputPath}`)
    console.log('')
    console.log('🚀 次のステップ:')
    console.log('1. CSVファイルを確認して食べログURLを調査')
    console.log('2. バリューコマースのアフィリエイトリンクを生成')
    console.log('3. tabelog-affiliate-manager.tsで一括登録')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
analyzeLocations()