#!/usr/bin/env node

/**
 * locationsテーブルのスキーマを確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLocationsSchema() {
  console.log('🔍 locationsテーブルのスキーマ確認\n')
  console.log('=' .repeat(60))
  
  try {
    // サンプルデータを1件取得してカラムを確認
    const { data: sampleLocation, error } = await supabase
      .from('locations')
      .select('*')
      .limit(1)
      .single()
    
    if (error) {
      console.error('❌ エラー:', error.message)
      return
    }
    
    if (sampleLocation) {
      console.log('\n📊 利用可能なカラム:\n')
      Object.keys(sampleLocation).forEach(key => {
        const value = sampleLocation[key]
        const type = typeof value
        let displayValue = 'null'
        
        if (value !== null) {
          if (type === 'object') {
            displayValue = JSON.stringify(value).substring(0, 50) + '...'
          } else {
            displayValue = String(value).substring(0, 50)
          }
        }
        
        console.log(`  ${key}:`)
        console.log(`    - 型: ${type}`)
        console.log(`    - サンプル値: ${displayValue}`)
      })
      
      console.log('\n' + '=' .repeat(60))
      console.log('\n💡 食べログ関連のカラム:')
      
      // 食べログ関連のカラムを特定
      const tabelogRelatedColumns = Object.keys(sampleLocation).filter(key => 
        key.toLowerCase().includes('tabelog') || 
        key.toLowerCase().includes('url') ||
        key.toLowerCase().includes('affiliate') ||
        key.toLowerCase().includes('reservation')
      )
      
      if (tabelogRelatedColumns.length > 0) {
        tabelogRelatedColumns.forEach(col => {
          console.log(`  ✅ ${col}`)
        })
      } else {
        console.log('  ⚠️ 食べログ関連のカラムが見つかりません')
      }
      
      // 既存の食べログURLを持つロケーションを確認
      console.log('\n📌 食べログURL設定済みのロケーション:')
      const { data: locationsWithTabelog, error: tabelogError } = await supabase
        .from('locations')
        .select('id, name, tabelog_url')
        .not('tabelog_url', 'is', null)
        .limit(5)
      
      if (locationsWithTabelog && locationsWithTabelog.length > 0) {
        locationsWithTabelog.forEach(loc => {
          console.log(`  - ${loc.name}: ${loc.tabelog_url?.substring(0, 50)}...`)
        })
      } else {
        console.log('  ⚠️ 食べログURL設定済みのロケーションがありません')
      }
    }
    
  } catch (error) {
    console.error('予期しないエラー:', error)
  }
}

checkLocationsSchema().catch(console.error)