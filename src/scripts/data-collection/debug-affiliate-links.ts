// src/scripts/data-collection/debug-affiliate-links.ts

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数読み込み
dotenv.config({ path: '.env.local' })

// 型定義
interface Step4Episode {
  episode_id: string
  enhanced_locations: EnhancedLocation[]
  affiliate_stats: {
    locations_processed: number
    affiliate_links_generated: number
    success_rate: number
  }
}

interface EnhancedLocation {
  name: string
  category: string
  affiliate_links: AffiliateLink[]
}

interface AffiliateLink {
  service_name: string
  affiliate_url: string
  display_text: string
  priority: number
}

interface Step2Episode {
  episode_id: string
  extracted_items: ExtractedItem[]
  extracted_locations: ExtractedLocation[]
  extraction_stats: {
    items_found: number
    locations_found: number
    extraction_accuracy: number
  }
}

interface ExtractedItem {
  name: string
  brand: string
  price: number
  confidence: string
  source_text: string
}

interface ExtractedLocation {
  name: string
  category: string
  confidence: string
  source_text: string
}

// Supabaseクライアント
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugAffiliateLinks() {
  console.log('🔍 アフィリエイトリンク診断開始...\n')
  
  try {
    // Step 4の結果ファイルを確認
    console.log('📂 Step 4結果ファイルの確認:')
    console.log('=' .repeat(80))
    
    if (typeof window === 'undefined') {
      const fs = await import('fs')
      const files = fs.readdirSync('./data/').filter(f => f.startsWith('step4-valuecommerce-results-'))
      
      if (files.length === 0) {
        console.log('❌ Step 4の結果ファイルが見つかりません')
        return
      }
      
      const latestFile = files.sort().reverse()[0]
      console.log(`📄 最新ファイル: ./data/${latestFile}`)
      
      const data = fs.readFileSync(`./data/${latestFile}`, 'utf8')
      const step4Results = JSON.parse(data) as Step4Episode[]
      
      console.log(`📊 Step 4データ: ${step4Results.length}エピソード\n`)
      
      // 各エピソードのアフィリエイトリンク詳細を確認
      step4Results.forEach((episode, index) => {
        console.log(`📋 [${index + 1}] エピソード: ${episode.episode_id}`)
        console.log(`ロケーション数: ${episode.enhanced_locations?.length || 0}件`)
        
        episode.enhanced_locations?.forEach((location, locIndex) => {
          console.log(`  ${locIndex + 1}. ${location.name}`)
          console.log(`     カテゴリ: ${location.category}`)
          console.log(`     アフィリエイトリンク数: ${location.affiliate_links?.length || 0}件`)
          
          location.affiliate_links?.forEach((link, linkIndex) => {
            console.log(`       ${linkIndex + 1}. ${link.service_name}: ${link.affiliate_url}`)
            console.log(`          表示テキスト: ${link.display_text}`)
            console.log(`          優先度: ${link.priority}`)
          })
          console.log('')
        })
        console.log('')
      })
    }
    
    // データベースのアフィリエイトリンクを確認
    console.log('\n💾 データベースのアフィリエイトリンク確認:')
    console.log('=' .repeat(80))
    
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, category, reservation_url, address, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('❌ データベース取得エラー:', error)
      return
    }
    
    locations?.forEach((location, index) => {
      console.log(`${index + 1}. ${location.name}`)
      console.log(`   カテゴリ: ${location.category}`)
      console.log(`   予約URL: ${location.reservation_url || '❌未設定'}`)
      
      // URLの妥当性チェック
      if (location.reservation_url) {
        const isValidUrl = location.reservation_url.startsWith('http')
        const hasValuecommerce = location.reservation_url.includes('valuecommerce') || 
                                 location.reservation_url.includes('vc.') ||
                                 location.reservation_url.includes('af.moshimo')
        
        console.log(`   URL形式: ${isValidUrl ? '✅正常' : '❌無効'}`)
        console.log(`   バリューコマース: ${hasValuecommerce ? '✅検出' : '❌未検出'}`)
        
        if (!isValidUrl || !hasValuecommerce) {
          console.log(`   🚨 問題のあるURL: ${location.reservation_url}`)
        }
      }
      console.log('')
    })
    
    // アイテムのアフィリエイトリンク確認
    console.log('\n🛍️ アイテムのアフィリエイトリンク確認:')
    console.log('=' .repeat(80))
    
    const { data: items, error: itemError } = await supabase
      .from('items')
      .select('id, name, brand, affiliate_url, price, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (itemError) {
      console.error('❌ アイテム取得エラー:', itemError)
      return
    }
    
    items?.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name}`)
      console.log(`   ブランド: ${item.brand || '未設定'}`)
      console.log(`   価格: ¥${item.price || '未設定'}`)
      console.log(`   アフィリエイトURL: ${item.affiliate_url || '❌未設定'}`)
      
      // Amazon URLの妥当性チェック
      if (item.affiliate_url) {
        const isAmazonUrl = item.affiliate_url.includes('amazon') || 
                           item.affiliate_url.includes('amzn.to')
        const hasAffiliateTag = item.affiliate_url.includes('tag=') ||
                               item.affiliate_url.includes('arata55507-22')
        
        console.log(`   Amazon URL: ${isAmazonUrl ? '✅検出' : '❌未検出'}`)
        console.log(`   アフィリエイトタグ: ${hasAffiliateTag ? '✅検出' : '❌未検出'}`)
        
        if (!isAmazonUrl || !hasAffiliateTag) {
          console.log(`   🚨 問題のあるURL: ${item.affiliate_url}`)
        }
      } else {
        console.log(`   🚨 アフィリエイトURLが未設定`)
      }
      console.log('')
    })
    
    // Step 2の結果も確認
    console.log('\n📂 Step 2結果ファイルの確認:')
    console.log('=' .repeat(80))
    
    if (typeof window === 'undefined') {
      const fs = await import('fs')
      const files = fs.readdirSync('./data/').filter(f => f.startsWith('step2-improved-results-'))
      
      if (files.length > 0) {
        const latestFile = files.sort().reverse()[0]
        console.log(`📄 最新ファイル: ./data/${latestFile}`)
        
        const data = fs.readFileSync(`./data/${latestFile}`, 'utf8')
        const step2Results = JSON.parse(data) as Step2Episode[]
        
        console.log(`📊 Step 2データ: ${step2Results.length}エピソード`)
        
        // 抽出品質の確認
        step2Results.forEach((episode, index) => {
          console.log(`\n📋 [${index + 1}] エピソード: ${episode.episode_id}`)
          console.log(`アイテム数: ${episode.extracted_items?.length || 0}件`)
          console.log(`ロケーション数: ${episode.extracted_locations?.length || 0}件`)
          console.log(`抽出精度: ${episode.extraction_stats?.extraction_accuracy || 'N/A'}`)
          
          // サンプルアイテム表示
          episode.extracted_items?.slice(0, 2).forEach((item, itemIndex) => {
            console.log(`  アイテム${itemIndex + 1}: ${item.name} (${item.brand}) - ¥${item.price}`)
            console.log(`    信頼度: ${item.confidence}, ソース: ${item.source_text.substring(0, 50)}...`)
          })
          
          // サンプルロケーション表示
          episode.extracted_locations?.slice(0, 2).forEach((location, locIndex) => {
            console.log(`  ロケーション${locIndex + 1}: ${location.name} (${location.category})`)
            console.log(`    信頼度: ${location.confidence}, ソース: ${location.source_text.substring(0, 50)}...`)
          })
        })
      }
    }
    
    // 統計情報
    console.log('\n📊 問題の統計:')
    console.log('=' .repeat(80))
    
    const { count: totalLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
    
    const { count: locationsWithUrl } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .not('reservation_url', 'eq', '')
      .not('reservation_url', 'is', null)
    
    const { count: totalItems } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
    
    const { count: itemsWithUrl } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .not('affiliate_url', 'eq', '')
      .not('affiliate_url', 'is', null)
    
    console.log(`ロケーション総数: ${totalLocations}件`)
    console.log(`アフィリエイトURL付きロケーション: ${locationsWithUrl}件 (${((locationsWithUrl! / totalLocations!) * 100).toFixed(1)}%)`)
    console.log(`アイテム総数: ${totalItems}件`)
    console.log(`アフィリエイトURL付きアイテム: ${itemsWithUrl}件 (${((itemsWithUrl! / totalItems!) * 100).toFixed(1)}%)`)
    
    // 問題の特定
    console.log('\n🚨 特定された問題:')
    console.log('=' .repeat(80))
    
    if ((locationsWithUrl! / totalLocations!) < 0.8) {
      console.log('❌ ロケーションのアフィリエイトURL設定率が低い (80%未満)')
      console.log('   → Step 4のバリューコマース連携に問題がある可能性')
    }
    
    if ((itemsWithUrl! / totalItems!) < 0.5) {
      console.log('❌ アイテムのアフィリエイトURL設定率が低い (50%未満)')
      console.log('   → Step 3のAmazon連携が未実装または問題がある')
    }
    
    console.log('\n📋 推奨修正アクション:')
    console.log('1. Step 4のバリューコマースAPI連携を再確認')
    console.log('2. Step 3のAmazonアフィリエイトURL生成を実装')
    console.log('3. データ抽出の精度向上（Step 2）')
    console.log('4. URL妥当性チェックの追加')
    
  } catch (error) {
    console.error('❌ 診断エラー:', error)
  }
}

// 実行
debugAffiliateLinks().then(() => {
  console.log('\n✅ アフィリエイトリンク診断完了')
}).catch(console.error)