// 🔍 Debug: Celebrities Query Test
// 推し一覧ページの無限ローディング問題を特定するためのデバッグスクリプト

import { createClient } from '@supabase/supabase-js'

// Supabaseクライアント設定（環境変数から読み込み）
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  console.log('VITE_SUPABASE_URL:', !!supabaseUrl)
  console.log('VITE_SUPABASE_ANON_KEY:', !!supabaseKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCelebritiesQuery() {
  console.log('🔍 Celebrities Table Structure Test')
  console.log('=====================================')

  try {
    // 1. テーブル存在確認
    console.log('\n1️⃣ テーブル存在確認...')
    const { data: tables, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'celebrities')
      .limit(1)

    if (schemaError) {
      console.log('⚠️ スキーマ情報取得エラー（正常な場合もあります）:', schemaError.message)
    }

    // 2. 基本データ取得テスト
    console.log('\n2️⃣ 基本データ取得テスト...')
    const { data: basicData, error: basicError } = await supabase
      .from('celebrities')
      .select('*')
      .limit(1)

    if (basicError) {
      console.error('❌ 基本データ取得エラー:', basicError)
      return
    }

    console.log('✅ 基本データ取得成功')
    console.log('サンプルレコード:', basicData[0])

    // 3. カラム構造確認
    if (basicData && basicData.length > 0) {
      console.log('\n3️⃣ カラム構造:')
      const columns = Object.keys(basicData[0])
      columns.forEach(col => console.log(`  - ${col}`))

      // 必要なカラムの存在確認
      const requiredColumns = ['id', 'name', 'slug', 'profile_image_url', 'view_count']
      const missingColumns = requiredColumns.filter(col => !columns.includes(col))
      
      if (missingColumns.length > 0) {
        console.log('\n⚠️ 不足しているカラム:', missingColumns)
      } else {
        console.log('\n✅ 必要なカラムは全て存在')
      }
    }

    // 4. 実際のクエリテスト（Phase 4で使用しているもの）
    console.log('\n4️⃣ Phase 4クエリテスト...')
    const { data: phase4Data, error: phase4Error, count } = await supabase
      .from('celebrities')
      .select('id, name, slug, description, profile_image_url, tags, view_count', { count: 'exact' })
      .order('view_count', { ascending: false })
      .range(0, 11) // First 12 items (0-11)

    if (phase4Error) {
      console.error('❌ Phase 4クエリエラー:', phase4Error)
      return
    }

    console.log('✅ Phase 4クエリ成功')
    console.log(`データ数: ${phase4Data?.length || 0}`)
    console.log(`総カウント: ${count}`)
    console.log('最初の3件のサンプル:')
    phase4Data?.slice(0, 3).forEach((celeb, idx) => {
      console.log(`  ${idx + 1}. ${celeb.name} (view_count: ${celeb.view_count || 'null'})`)
    })

    // 5. カウント専用クエリテスト
    console.log('\n5️⃣ カウント専用クエリテスト...')
    const { count: totalCount, error: countError } = await supabase
      .from('celebrities')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ カウントクエリエラー:', countError)
    } else {
      console.log('✅ カウントクエリ成功')
      console.log(`総レコード数: ${totalCount}`)
    }

    // 6. ページネーション動作テスト
    console.log('\n6️⃣ ページネーション動作テスト...')
    const limit = 12
    const offset = 0

    const { data: paginatedData, error: paginatedError, count: paginatedCount } = await supabase
      .from('celebrities')
      .select('id, name, slug', { count: 'exact' })
      .order('view_count', { ascending: false })
      .range(offset, offset + limit - 1)

    if (paginatedError) {
      console.error('❌ ページネーションクエリエラー:', paginatedError)
    } else {
      console.log('✅ ページネーションクエリ成功')
      console.log(`取得データ数: ${paginatedData?.length || 0}`)
      console.log(`総カウント: ${paginatedCount}`)
      const hasMore = paginatedCount ? (offset + limit) < paginatedCount : false
      console.log(`HasMore: ${hasMore}`)
    }

  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

// テスト実行
testCelebritiesQuery().then(() => {
  console.log('\n🎯 デバッグ完了')
  process.exit(0)
}).catch(error => {
  console.error('❌ デバッグ中にエラーが発生:', error)
  process.exit(1)
})