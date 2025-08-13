require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function runMigration() {
  console.log('🔧 データベースマイグレーション実行中...\n')
  
  try {
    // SQLファイルを読み込み
    const sqlPath = path.join(__dirname, 'add-tags-migration.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📝 実行SQL:')
    console.log(sqlContent)
    console.log('\n🚀 マイグレーション開始...')
    
    // マイグレーションを実行
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    })
    
    if (error) {
      // rpcが使えない場合は直接実行を試す
      console.log('⚠️  rpc方式で失敗、直接実行を試します...')
      
      // SQLを分割して実行
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement) {
          console.log(`📤 実行中 (${i + 1}/${statements.length}): ${statement.substring(0, 50)}...`)
          
          const { error: execError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(1)
            // この方法では実際にはSQLを実行できないので、警告を出力
          
          console.log(`⚠️  注意: Supabaseクライアントでは直接DDL文を実行できません`)
          console.log(`📋 以下のSQLをSupabase Dashboardで手動実行してください:\n`)
          console.log(statement + ';')
          console.log('')
        }
      }
      
      return
    }
    
    console.log('✅ マイグレーション完了!')
    console.log('結果:', data)
    
  } catch (error) {
    console.error('❌ マイグレーションエラー:', error)
    console.log('\n📋 手動実行が必要です:')
    console.log('1. Supabase Dashboard (https://supabase.com/dashboard) にアクセス')
    console.log('2. プロジェクトの SQL Editor を開く')
    console.log('3. 以下のSQLを実行:')
    console.log('\n' + fs.readFileSync(path.join(__dirname, 'add-tags-migration.sql'), 'utf8'))
  }
}

async function verifyMigration() {
  console.log('\n🔍 マイグレーション確認中...')
  
  try {
    // episodesテーブルの構造を確認
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ テーブル確認エラー:', error)
      return false
    }
    
    // tags列があるかチェック
    if (data && data.length > 0) {
      const hasTagsColumn = data[0].hasOwnProperty('tags')
      console.log(`📊 tags列の存在: ${hasTagsColumn ? '✅ あり' : '❌ なし'}`)
      return hasTagsColumn
    }
    
    console.log('⚠️  データが見つかりませんが、テーブルは存在します')
    return true
    
  } catch (error) {
    console.error('❌ 確認エラー:', error)
    return false
  }
}

async function main() {
  await runMigration()
  await verifyMigration()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { runMigration, verifyMigration }