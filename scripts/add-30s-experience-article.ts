import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function addOshikatsuCategory() {
  console.log('🎭 推し活カテゴリを作成中...')

  try {
    // 推し活用のカテゴリを作成
    const { data, error } = await supabase
      .from('article_categories')
      .insert([
        {
          id: 'a1111111-1111-1111-1111-111111111111',
          name: '推し活・ファン活動',
          slug: 'oshi-katsu',
          description: 'アイドルやアーティストの応援活動に関する記事',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('❌ カテゴリ作成エラー:', error)
      return false
    }

    console.log('✅ 推し活カテゴリ作成成功:', data)
    return true

  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
    return false
  }
}

addOshikatsuCategory()