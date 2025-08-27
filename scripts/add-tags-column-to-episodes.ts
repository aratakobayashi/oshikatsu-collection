/**
 * episodesテーブルにtagsカラムを追加
 * エピソードの詳細情報をタグで分類可能にする
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function addTagsColumn() {
  console.log('🏷️ episodesテーブルにtagsカラムを追加中...')

  try {
    // tagsカラムを追加（配列型）
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE episodes ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';`
    })

    if (alterError) {
      console.log('⚠️ RPC経由での実行に失敗。直接SQLクエリを試行します...')
      console.error('RPC Error:', alterError)
      
      // 代替方法: 手動でSupabase管理画面でのSQL実行を提案
      console.log('\n📋 以下のSQLを Supabase管理画面で実行してください:')
      console.log('```sql')
      console.log('ALTER TABLE episodes ADD COLUMN IF NOT EXISTS tags text[] DEFAULT \'{}\';')
      console.log('```')
      console.log('\n📍 実行場所: https://supabase.com/dashboard/project/awaarykghpylggygkiyp/sql')
      
      return
    }

    console.log('✅ tagsカラムの追加が完了しました')

    // 松重豊のエピソードにサンプルタグを追加
    console.log('\n🍜 松重豊のエピソードにタグを追加中...')
    
    const { data: matsushige } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'matsushige-yutaka')
      .single()

    if (matsushige) {
      // いくつかのエピソードにサンプルタグを追加
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('celebrity_id', matsushige.id)
        .limit(10)

      if (episodes) {
        for (const episode of episodes) {
          // タイトルから自動でタグを生成
          const tags = generateTagsFromTitle(episode.title)
          
          const { error: updateError } = await supabase
            .from('episodes')
            .update({ tags })
            .eq('id', episode.id)

          if (updateError) {
            console.error(`❌ ${episode.title}のタグ更新エラー:`, updateError)
          } else {
            console.log(`✅ ${episode.title} → [${tags.join(', ')}]`)
          }
        }
      }
    }

    console.log('\n🎉 tagsカラム追加とサンプルデータ作成完了！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// タイトルからタグを自動生成
function generateTagsFromTitle(title: string): string[] {
  const tags: string[] = []
  
  // シーズン情報
  const seasonMatch = title.match(/Season(\d+)/)
  if (seasonMatch) {
    tags.push(`Season${seasonMatch[1]}`)
  }
  
  // 地域情報
  if (title.includes('区') || title.includes('市') || title.includes('町')) {
    tags.push('グルメ旅')
    tags.push('聖地巡礼')
  }
  
  // 料理系キーワード
  const foodKeywords = [
    'やきとり', 'ラーメン', 'カレー', 'とんかつ', 'すし', '寿司', 
    '定食', '中華', '天ぷら', 'パスタ', 'ステーキ', 'うどん', 'そば'
  ]
  
  for (const keyword of foodKeywords) {
    if (title.includes(keyword)) {
      tags.push('グルメ')
      tags.push(keyword)
      break
    }
  }
  
  // 地域別タグ
  if (title.includes('東京')) tags.push('東京')
  if (title.includes('大阪')) tags.push('大阪')
  if (title.includes('神奈川')) tags.push('神奈川')
  if (title.includes('千葉')) tags.push('千葉')
  
  // デフォルトタグ
  if (tags.length === 0) {
    tags.push('孤独のグルメ')
  }
  
  return [...new Set(tags)] // 重複除去
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  addTagsColumn().catch(console.error)
}

export { addTagsColumn }