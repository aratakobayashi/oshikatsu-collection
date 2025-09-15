/**
 * 新しく追加されたメンバー確認
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkNewMembers() {
  console.log('📊 新しく追加されたメンバー確認')
  console.log('===============================\n')

  const groups = ['timeless', '新しい学校のリーダーズ', '櫻坂46', '日向坂46', 'BE:FIRST']

  let totalNewMembers = 0
  let totalNewEpisodes = 0

  for (const group of groups) {
    const { data: members } = await supabase
      .from('celebrities')
      .select('name, group_name, id')
      .eq('group_name', group)
      .order('name')

    console.log(`👥 ${group}: ${members?.length || 0}人`)
    if (members) {
      totalNewMembers += members.length

      for (const member of members) {
        const { data: episodes } = await supabase
          .from('episodes')
          .select('id')
          .eq('celebrity_id', member.id)

        const episodeCount = episodes?.length || 0
        console.log(`  - ${member.name}: ${episodeCount}エピソード`)
        totalNewEpisodes += episodeCount
      }
    }
    console.log('')
  }

  // 今日追加されたタレント数
  const today = new Date().toISOString().split('T')[0]
  const { data: todayAdded } = await supabase
    .from('celebrities')
    .select('name, type, group_name')
    .gte('created_at', today)
    .order('created_at', { ascending: false })

  console.log('='.repeat(40))
  console.log('🎉 追加完了統計')
  console.log('='.repeat(40))
  console.log(`📈 グループメンバー総数: ${totalNewMembers}人`)
  console.log(`📺 追加エピソード総数: ${totalNewEpisodes}本`)
  console.log(`⏰ 今日追加されたタレント: ${todayAdded?.length || 0}人`)

  if (todayAdded && todayAdded.length > 0) {
    console.log('\n📋 今日追加されたタレント一覧:')
    todayAdded.forEach((talent, index) => {
      const groupInfo = talent.group_name ? ` (${talent.group_name})` : ''
      console.log(`  ${index + 1}. ${talent.name}${groupInfo} - ${talent.type}`)
    })
  }

  console.log('\n💡 確認方法:')
  console.log('• タレント一覧ページでグループ名検索')
  console.log('• 各メンバーのプロフィールページ確認')
  console.log('• ブラウザでハードリフレッシュ推奨')
}

// 実行
checkNewMembers().catch(console.error)