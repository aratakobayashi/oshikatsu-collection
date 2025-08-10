const fs = require('fs')
const path = require('path')

const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

async function createRelationTables() {
  console.log('🚀 関連テーブル作成を開始...\n')

  try {
    // SQLファイルを読み込み
    const sqlPath = path.join(__dirname, 'create-relation-tables.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📋 以下のテーブルを作成します:')
    console.log('   - episode_items (エピソード↔アイテム)')
    console.log('   - episode_locations (エピソード↔ロケーション)\n')

    // Supabase SQL実行エンドポイントは直接使えないため、
    // Supabase Dashboardで実行することを推奨
    console.log('⚠️  重要: 以下の手順でテーブルを作成してください:\n')
    console.log('1. Supabase Dashboard にログイン')
    console.log('   https://app.supabase.com/project/ounloyykptsqzdpbsnpn/editor')
    console.log('')
    console.log('2. SQL Editor タブを開く')
    console.log('')
    console.log('3. 以下のSQLを貼り付けて実行:')
    console.log('   ファイル: scripts/create-relation-tables.sql')
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(sqlContent.substring(0, 500) + '...')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // テーブル存在確認（既存のテーブルを確認）
    console.log('📊 現在のテーブル状況を確認中...')
    
    const checkTables = async (tableName) => {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=0`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'count=exact'
          }
        }
      )
      
      if (response.ok) {
        const count = response.headers.get('content-range')
        console.log(`   ✅ ${tableName} テーブル: 存在します`)
        return true
      } else {
        console.log(`   ❌ ${tableName} テーブル: 存在しません`)
        return false
      }
    }

    // 既存テーブルの確認
    const episodesExists = await checkTables('episodes')
    const itemsExists = await checkTables('items')
    const locationsExists = await checkTables('locations')
    
    console.log('')
    
    // 関連テーブルの確認
    const episodeItemsExists = await checkTables('episode_items')
    const episodeLocationsExists = await checkTables('episode_locations')

    if (!episodeItemsExists || !episodeLocationsExists) {
      console.log('\n⚠️  関連テーブルがまだ作成されていません')
      console.log('上記の手順でSQLを実行してください\n')
      
      // サンプルデータ作成用のスクリプトも生成
      await createSampleDataScript()
    } else {
      console.log('\n✅ 関連テーブルは既に存在します！')
      console.log('次は scripts/add-sample-relations.cjs を実行してサンプルデータを追加してください')
    }

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

async function createSampleDataScript() {
  const sampleScript = `// サンプル関連データを追加するスクリプト
const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

async function addSampleRelations() {
  console.log('🎯 サンプル関連データを追加...')
  
  // 1. エピソード、アイテム、ロケーションのIDを取得
  // 2. episode_items, episode_locationsテーブルに関連を追加
  // 実装は次のステップで...
}

addSampleRelations()`

  fs.writeFileSync(
    path.join(__dirname, 'add-sample-relations.cjs'),
    sampleScript
  )
  
  console.log('📝 サンプルデータ追加用スクリプトを作成しました:')
  console.log('   scripts/add-sample-relations.cjs')
}

// 実行
createRelationTables()
  .then(() => {
    console.log('\n🎉 準備完了！')
    console.log('\n📋 次のステップ:')
    console.log('1. Supabase Dashboard でSQLを実行')
    console.log('2. node scripts/add-sample-relations.cjs でサンプルデータ追加')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ エラー:', error)
    process.exit(1)
  })