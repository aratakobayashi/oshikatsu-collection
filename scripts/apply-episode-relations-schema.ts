/**
 * エピソード関連テーブル（episode_locations, episode_items）をSupabaseに作成
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function applySchema() {
  console.log('🗃️  エピソード関連テーブルを作成中...')
  
  try {
    // SQLファイルを読み込み
    const sqlPath = join(process.cwd(), 'scripts', 'create-episode-relations-tables.sql')
    const sqlContent = readFileSync(sqlPath, 'utf-8')
    
    console.log('📄 SQL読み込み完了')
    
    // SQLを分割して実行（複数のCREATE文があるため）
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    console.log(`📊 実行予定SQL文: ${statements.length}件`)
    
    for (const [index, statement] of statements.entries()) {
      console.log(`⚡ 実行中 (${index + 1}/${statements.length}): ${statement.substring(0, 50)}...`)
      
      try {
        // Supabase RPC経由でSQL実行は制限されるため、直接実行を試す
        const { error } = await supabase.rpc('exec_sql', {
          query: statement + ';'
        })
        
        if (error) {
          console.warn(`⚠️  RPC実行失敗: ${error.message}`)
          // RPC経由で実行できない場合は、スキップしてログ出力
          console.log('📝 手動実行が必要なSQL:')
          console.log(statement + ';')
        } else {
          console.log(`✅ 実行完了: ${statement.substring(0, 30)}...`)
        }
      } catch (statementError: any) {
        console.error(`❌ SQL実行エラー: ${statementError.message}`)
        console.log(`SQL: ${statement}`)
      }
    }
    
    console.log('\n🎉 スキーマ適用完了!')
    console.log('📱 次のステップ:')
    console.log('  1. Supabase管理画面でテーブル作成を確認')
    console.log('  2. 管理画面でエピソード詳細ページを確認')
    console.log('  3. 店舗・アイテムの紐付けをテスト')
    
    // テーブル存在確認
    console.log('\n🔍 テーブル存在確認...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['episode_locations', 'episode_items'])
    
    if (tablesError) {
      console.error('❌ テーブル確認エラー:', tablesError.message)
    } else {
      console.log('✅ 確認できたテーブル:', tables?.map(t => t.table_name))
    }
    
  } catch (error: any) {
    console.error('❌ スキーマ適用エラー:', error.message)
    throw error
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  applySchema().catch(console.error)
}