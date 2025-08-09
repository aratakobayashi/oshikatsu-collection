/**
 * データベーススキーマとデータ確認
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('🔍 データベーススキーマとデータの確認')
  console.log('='.repeat(60))
  
  try {
    // 利用可能なテーブル一覧を取得
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')
    
    if (tablesError) {
      console.error('❌ テーブル一覧取得エラー:', tablesError.message)
    } else {
      console.log('📋 利用可能なテーブル:')
      tables?.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table.table_name}`)
      })
    }
    
    console.log('\n' + '='.repeat(60))
    
    // locationsテーブルの構造確認
    console.log('🏪 locationsテーブル確認:')
    try {
      const { data: locationsCols, error: locColsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'locations')
        .eq('table_schema', 'public')
        .order('ordinal_position')
      
      if (locColsError) {
        console.log('❌ locationsテーブル構造取得エラー:', locColsError.message)
      } else {
        console.log('  カラム構造:')
        locationsCols?.forEach(col => {
          console.log(`    - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`)
        })
      }
      
      // データ件数確認
      const { count: locationsCount, error: locCountError } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
      
      if (locCountError) {
        console.log('❌ locationsデータ件数取得エラー:', locCountError.message)
      } else {
        console.log(`  データ件数: ${locationsCount}件`)
        
        // サンプルデータ表示
        if (locationsCount && locationsCount > 0) {
          const { data: sampleLocations } = await supabase
            .from('locations')
            .select('id, name')
            .limit(3)
          
          console.log('  サンプルデータ:')
          sampleLocations?.forEach((loc, index) => {
            console.log(`    ${index + 1}. ${loc.name}`)
          })
        }
      }
    } catch (error: any) {
      console.log('❌ locationsテーブルアクセスエラー:', error.message)
    }
    
    console.log('\n' + '-'.repeat(40))
    
    // itemsテーブルの構造確認
    console.log('🛍️ itemsテーブル確認:')
    try {
      const { data: itemsCols, error: itemColsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'items')
        .eq('table_schema', 'public')
        .order('ordinal_position')
      
      if (itemColsError) {
        console.log('❌ itemsテーブル構造取得エラー:', itemColsError.message)
      } else {
        console.log('  カラム構造:')
        itemsCols?.forEach(col => {
          console.log(`    - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`)
        })
      }
      
      // データ件数確認
      const { count: itemsCount, error: itemCountError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
      
      if (itemCountError) {
        console.log('❌ itemsデータ件数取得エラー:', itemCountError.message)
      } else {
        console.log(`  データ件数: ${itemsCount}件`)
        
        // サンプルデータ表示
        if (itemsCount && itemsCount > 0) {
          const { data: sampleItems } = await supabase
            .from('items')
            .select('id, name')
            .limit(3)
          
          console.log('  サンプルデータ:')
          sampleItems?.forEach((item, index) => {
            console.log(`    ${index + 1}. ${item.name}`)
          })
        }
      }
    } catch (error: any) {
      console.log('❌ itemsテーブルアクセスエラー:', error.message)
    }
    
    console.log('\n' + '-'.repeat(40))
    
    // episodesテーブルの確認
    console.log('📺 episodesテーブル確認:')
    try {
      const { count: episodesCount } = await supabase
        .from('episodes')
        .select('*', { count: 'exact', head: true })
      
      console.log(`  データ件数: ${episodesCount}件`)
      
      if (episodesCount && episodesCount > 0) {
        const { data: sampleEpisodes } = await supabase
          .from('episodes')
          .select('id, title, celebrity_id')
          .limit(3)
        
        console.log('  サンプルデータ:')
        sampleEpisodes?.forEach((ep, index) => {
          console.log(`    ${index + 1}. ${ep.title}`)
        })
      }
    } catch (error: any) {
      console.log('❌ episodesテーブルアクセスエラー:', error.message)
    }
    
    console.log('\n' + '-'.repeat(40))
    
    // celebritiesテーブルの確認
    console.log('🌟 celebritiesテーブル確認:')
    try {
      const { count: celebritiesCount } = await supabase
        .from('celebrities')
        .select('*', { count: 'exact', head: true })
      
      console.log(`  データ件数: ${celebritiesCount}件`)
      
      if (celebritiesCount && celebritiesCount > 0) {
        const { data: sampleCelebrities } = await supabase
          .from('celebrities')
          .select('id, name')
          .limit(3)
        
        console.log('  サンプルデータ:')
        sampleCelebrities?.forEach((celeb, index) => {
          console.log(`    ${index + 1}. ${celeb.name}`)
        })
      }
    } catch (error: any) {
      console.log('❌ celebritiesテーブルアクセスエラー:', error.message)
    }
    
  } catch (error: any) {
    console.error('❌ スキーマ確認エラー:', error.message)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  checkSchema().catch(console.error)
}