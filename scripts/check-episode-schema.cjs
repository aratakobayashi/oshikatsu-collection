require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkSchema() {
  try {
    // シンプルなクエリでエピソードを取得
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error:', error)
      return
    }
    
    if (episodes && episodes.length > 0) {
      console.log('📋 エピソードテーブルのカラム:')
      console.log(Object.keys(episodes[0]))
      console.log('\n📺 サンプルエピソード:')
      console.log('ID:', episodes[0].id)
      console.log('Title:', episodes[0].title)
      console.log('\n🔗 アクセスURL:')
      console.log(`Staging: https://develop--oshikatsu-collection.netlify.app/episodes/${episodes[0].id}`)
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkSchema()