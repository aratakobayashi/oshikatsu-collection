import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkCategories() {
  console.log('🔍 カテゴリテーブルを確認中...')

  try {
    // article_categoriesテーブルの確認
    const { data: categories, error } = await supabase
      .from('article_categories')
      .select('*')

    if (error) {
      console.error('❌ カテゴリ取得エラー:', error)
      return
    }

    console.log(`📊 article_categoriesの件数: ${categories?.length || 0}`)

    if (categories && categories.length > 0) {
      console.log('\n📂 既存カテゴリ:')
      categories.forEach((category, index) => {
        console.log(`${index + 1}. ID: ${category.id}`)
        console.log(`   Name: ${category.name || category.title || 'unnamed'}`)
        console.log(`   Created: ${category.created_at}`)
        console.log('---')
      })
    } else {
      console.log('\n📂 カテゴリが存在しません。デフォルトカテゴリを作成しましょう。')
    }

  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

checkCategories()