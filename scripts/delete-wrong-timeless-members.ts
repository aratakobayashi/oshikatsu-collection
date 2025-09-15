/**
 * 間違ったtimelessメンバーデータの削除
 * 佐藤璃果、山口蘭、秋田汐梨、大沼心、菅沼ゆり は間違ったメンバーなので削除
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 間違ったtimelessメンバー（削除対象）
const WRONG_TIMELESS_MEMBERS = [
  '佐藤璃果',
  '山口蘭',
  '秋田汐梨',
  '大沼心',
  '菅沼ゆり'
]

async function deleteWrongTimelessMembers() {
  console.log('🗑️ 間違ったtimelessメンバーデータ削除開始')
  console.log('===========================================\n')

  let deletedMembers = 0
  let deletedEpisodes = 0

  for (const memberName of WRONG_TIMELESS_MEMBERS) {
    console.log(`👤 ${memberName} の削除処理中...`)

    // 1. メンバー情報を取得
    const { data: member } = await supabase
      .from('celebrities')
      .select('id, name, group_name')
      .eq('name', memberName)
      .single()

    if (!member) {
      console.log(`   ⚠️ ${memberName} が見つかりません（既に削除済み？）`)
      continue
    }

    if (member.group_name !== 'timeless') {
      console.log(`   ⚠️ ${memberName} のグループが timeless ではありません: ${member.group_name}`)
      continue
    }

    console.log(`   ✅ 削除対象確認: ${member.name} (ID: ${member.id})`)

    // 2. 関連エピソードを削除
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('celebrity_id', member.id)

    if (episodes && episodes.length > 0) {
      console.log(`   📺 関連エピソード ${episodes.length}本を削除中...`)

      const { error: episodeDeleteError } = await supabase
        .from('episodes')
        .delete()
        .eq('celebrity_id', member.id)

      if (episodeDeleteError) {
        console.log(`   ❌ エピソード削除エラー: ${episodeDeleteError.message}`)
        continue
      }

      console.log(`   ✅ エピソード ${episodes.length}本削除完了`)
      deletedEpisodes += episodes.length
    } else {
      console.log(`   📺 関連エピソードはありません`)
    }

    // 3. メンバー情報を削除
    const { error: memberDeleteError } = await supabase
      .from('celebrities')
      .delete()
      .eq('id', member.id)

    if (memberDeleteError) {
      console.log(`   ❌ メンバー削除エラー: ${memberDeleteError.message}`)
      continue
    }

    console.log(`   ✅ ${memberName} 削除完了`)
    deletedMembers++
    console.log('')

    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('='.repeat(50))
  console.log('🎉 間違ったtimelessメンバー削除完了！')
  console.log('='.repeat(50))
  console.log(`📊 削除結果:`)
  console.log(`  削除したメンバー: ${deletedMembers}人`)
  console.log(`  削除したエピソード: ${deletedEpisodes}本`)

  // 4. 削除後確認
  console.log('\n🔍 削除後確認:')
  const { data: remainingTimeless } = await supabase
    .from('celebrities')
    .select('name, group_name')
    .eq('group_name', 'timeless')

  if (remainingTimeless && remainingTimeless.length > 0) {
    console.log(`⚠️ まだtimelessメンバーが残っています: ${remainingTimeless.length}人`)
    remainingTimeless.forEach(member => {
      console.log(`  - ${member.name}`)
    })
  } else {
    console.log(`✅ timelessメンバーは全て削除されました`)
  }

  console.log('\n💡 次のステップ:')
  console.log('• 正しいtimelessメンバー情報を確認')
  console.log('• 正確なメンバー情報で再登録')
  console.log('• ブラウザでハードリフレッシュして確認')
}

// 実行
deleteWrongTimelessMembers().catch(console.error)