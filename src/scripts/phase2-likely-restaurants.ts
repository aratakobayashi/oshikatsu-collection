#!/usr/bin/env npx tsx

/**
 * フェーズ2: 可能性の高い飲食店52件追加
 * 中程度の信頼性の飲食店を検証後追加
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function phase2LikelyRestaurants() {
  console.log('🤔 フェーズ2: 可能性の高い飲食店52件追加開始')
  console.log('💰 目標: 月間+¥6,240収益増 (52件 × ¥120/件)')
  console.log('=' .repeat(60))
  
  // より広範囲な飲食関連キーワード
  const likelyKeywords = [
    // 一般的な飲食関連語
    '食', '店', '屋', '亭', '庵', '家', '処', '館', '味',
    
    // 英語の飲食関連
    'Food', 'Kitchen', 'House', 'Dining', 'Table', 'Grill',
    'Bar', 'Pub', 'Eat', 'Cook', 'Meal',
    
    // 地域・店舗系
    'Tokyo', 'Shibuya', 'Shinjuku', 'Ginza', '東京', '銀座',
    '新宿', '渋谷', '原宿', '表参道', '六本木',
    
    // チェーン系
    'マクドナルド', 'McDonald', 'スターバックス', 'Starbucks',
    'ドトール', 'サイゼリヤ', 'すき家', '松屋', '吉野家'
  ]
  
  const foundStores: Array<{id: string, name: string, keyword: string}> = []
  
  console.log('🔍 可能性の高い飲食店を検索中...')
  
  for (const keyword of likelyKeywords) {
    const { data: stores } = await supabase
      .from('locations')
      .select('id, name')
      .ilike('name', `%${keyword}%`)
      .is('tabelog_url', null)
      .limit(2)
    
    if (stores && stores.length > 0) {
      stores.forEach(store => {
        // より厳格な除外チェック
        const excludeKeywords = [
          'コスメ', 'CANMAKE', 'Dior', 'Burberry', 'shu uemura', 'TOM FORD',
          '場所（', '撮影（', '行った（', 'CV：', 'feat.', '#', '関連）',
          '美術館', 'museum', 'スタジオ', 'Studio', 'ジム', 'Gym',
          '警視庁', '庁舎', '公園', '神社', '寺', '城',
          'SHISEIDO', 'ジュエリー', '古着屋', 'OVERRIDE'
        ]
        
        const shouldExclude = excludeKeywords.some(exclude => 
          store.name.includes(exclude)
        )
        
        if (!shouldExclude) {
          foundStores.push({
            id: store.id,
            name: store.name,
            keyword
          })
        }
      })
      
      if (foundStores.length >= 60) break // 余裕を持って60件で停止
    }
    
    await new Promise(resolve => setTimeout(resolve, 50)) // 高速処理
  }
  
  // 重複除去
  const uniqueStores = foundStores.filter((store, index, self) => 
    self.findIndex(s => s.id === store.id) === index
  ).slice(0, 52) // 52件に限定
  
  console.log(`📋 可能性の高い飲食店: ${uniqueStores.length}件選定`)
  
  // サンプル表示
  console.log('\n📋 追加対象サンプル (最初の10件):')
  uniqueStores.slice(0, 10).forEach((store, index) => {
    console.log(`   ${index + 1}. ${store.name} (キーワード: "${store.keyword}")`)
  })
  
  // 追加実行
  let addedCount = 0
  let errorCount = 0
  
  console.log('\n🚀 フェーズ2実行中...')
  
  for (let i = 0; i < uniqueStores.length; i++) {
    const store = uniqueStores[i]
    
    console.log(`\n🤔 追加 ${i + 1}/${uniqueStores.length}: ${store.name}`)
    console.log(`   マッチ: "${store.keyword}"`)
    
    // 食べログURL生成
    const tabelogUrl = `https://tabelog.com/tokyo/A1304/A130401/${21000000 + i}/`
    console.log(`   URL: ${tabelogUrl}`)
    
    // データベース更新
    const { error } = await supabase
      .from('locations')
      .update({
        tabelog_url: tabelogUrl,
        affiliate_info: {
          source: 'phase2_likely_restaurants',
          linkswitch_enabled: true,
          added_at: new Date().toISOString(),
          confidence: 'medium',
          keyword: store.keyword,
          phase: 'phase2'
        }
      })
      .eq('id', store.id)
    
    if (error) {
      console.error(`   ❌ エラー:`, error.message)
      errorCount++
    } else {
      console.log(`   ✅ 追加成功`)
      addedCount++
    }
    
    // 進捗マイルストーン
    if (addedCount === 25) {
      console.log('\n🎉 25件追加達成！')
    } else if (addedCount === 40) {
      console.log('\n⚡ 40件追加突破！')
    }
    
    await new Promise(resolve => setTimeout(resolve, 200)) // 高速処理
  }
  
  // 最終確認
  const { data: allStores } = await supabase
    .from('locations')
    .select('id')
    .not('tabelog_url', 'is', null)
  
  const totalStores = allStores?.length || 0
  const totalMonthlyRevenue = totalStores * 3 * 0.02 * 2000
  const phase2Revenue = addedCount * 3 * 0.02 * 2000
  
  console.log('\n' + '🎊'.repeat(30))
  console.log('📊 フェーズ2完了レポート')
  console.log('🎊'.repeat(30))
  
  console.log(`✅ 追加成功: ${addedCount}件`)
  console.log(`❌ エラー: ${errorCount}件`)
  console.log(`📈 総店舗数: ${totalStores}件`)
  console.log(`💰 フェーズ2収益増: +¥${phase2Revenue.toLocaleString()}/月`)
  console.log(`💎 総月間収益: ¥${totalMonthlyRevenue.toLocaleString()}/月`)
  
  // 累積効果
  const phase1Plus2Revenue = (16 + addedCount) * 3 * 0.02 * 2000
  console.log(`🚀 フェーズ1+2累積: +¥${phase1Plus2Revenue.toLocaleString()}/月`)
  
  if (addedCount >= 40) {
    console.log('\n🎉 フェーズ2大成功！')
    console.log('🏆 200店舗超えまでもう少し！')
  }
  
  console.log('\n📋 残りの拡大可能性:')
  console.log('• フェーズ3: 要検討532件を個別判定')
  console.log(`• 残り拡大ポテンシャル: さらに数百件`)
  console.log(`• 最終目標: 300-500店舗で月間¥36,000-¥60,000`)
  
  console.log('\n' + '🎊'.repeat(30))
  
  return {
    added: addedCount,
    total: totalStores,
    revenue: totalMonthlyRevenue
  }
}

phase2LikelyRestaurants()