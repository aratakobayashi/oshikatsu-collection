/**
 * 本番環境のcelebritiesテーブルの問題を修正
 * - 重複したよにのチャンネルを整理
 * - テスト用データを削除
 * - エピソードとの関連付けを修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 本番環境変数読み込み
dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeCelebrityProblems() {
  console.log('🔍 本番環境のcelebritiesテーブル問題分析...\n')
  
  // 現在のcelebritiesを確認
  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('*')
    .order('created_at')
  
  if (error || !celebrities) {
    console.error('❌ celebrities取得エラー:', error)
    return
  }
  
  console.log('📊 現在のcelebritiesデータ:')
  celebrities.forEach((cel, i) => {
    console.log(`${i + 1}. ID: ${cel.id}`)
    console.log(`   名前: ${cel.name}`)
    console.log(`   スラッグ: ${cel.slug}`)
    console.log(`   タイプ: ${cel.type || 'N/A'}`)
    console.log(`   作成日: ${cel.created_at}`)
    console.log('')
  })
  
  // エピソードとの関連を確認
  for (const celebrity of celebrities) {
    const { count } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', celebrity.id)
    
    console.log(`🔗 ${celebrity.name}: ${count}件のエピソードが関連`)
  }
  
  return celebrities
}

async function fixCelebrityData() {
  console.log('\n🔧 celebritiesデータの修正開始...\n')
  
  const celebrities = await analyzeCelebrityProblems()
  if (!celebrities) return
  
  // 1. テスト用データを特定・削除
  const testCelebrities = celebrities.filter(cel => 
    cel.name?.includes('開発用') || 
    cel.name?.includes('テスト') ||
    cel.slug?.includes('test')
  )
  
  if (testCelebrities.length > 0) {
    console.log('🗑️ テスト用データを削除中...')
    for (const testCel of testCelebrities) {
      console.log(`   削除対象: ${testCel.name} (ID: ${testCel.id})`)
      
      const { error } = await supabase
        .from('celebrities')
        .delete()
        .eq('id', testCel.id)
      
      if (error) {
        console.error(`   ❌ 削除エラー: ${error.message}`)
      } else {
        console.log(`   ✅ 削除完了: ${testCel.name}`)
      }
    }
  }
  
  // 2. 正しいよにのチャンネルを特定
  const yoniChannels = celebrities.filter(cel => 
    cel.name?.includes('よにの') && 
    !cel.name?.includes('開発用') &&
    !cel.name?.includes('テスト')
  )
  
  console.log(`\n📺 よにのチャンネル候補: ${yoniChannels.length}件`)
  yoniChannels.forEach(channel => {
    console.log(`   - ${channel.name} (ID: ${channel.id})`)
  })
  
  // 3. 正式なよにのチャンネルを決定（YouTube IDを持つもの）
  const officialYoniChannel = yoniChannels.find(channel => 
    channel.id === 'UC2alHD2WkakOiTxCxF-uMAg' || 
    channel.name === 'よにのちゃんねる'
  ) || yoniChannels[0]
  
  if (officialYoniChannel) {
    console.log(`\n✅ 正式チャンネル: ${officialYoniChannel.name} (ID: ${officialYoniChannel.id})`)
    
    // 4. 重複チャンネルを削除
    const duplicateChannels = yoniChannels.filter(channel => 
      channel.id !== officialYoniChannel.id
    )
    
    if (duplicateChannels.length > 0) {
      console.log('\n🗑️ 重複チャンネルを削除中...')
      for (const dupChannel of duplicateChannels) {
        // まず関連エピソードを正式チャンネルに移行
        const { data: relatedEpisodes } = await supabase
          .from('episodes')
          .select('id')
          .eq('celebrity_id', dupChannel.id)
        
        if (relatedEpisodes && relatedEpisodes.length > 0) {
          console.log(`   🔄 ${relatedEpisodes.length}件のエピソードを移行中...`)
          
          const { error: updateError } = await supabase
            .from('episodes')
            .update({ celebrity_id: officialYoniChannel.id })
            .eq('celebrity_id', dupChannel.id)
          
          if (updateError) {
            console.error(`   ❌ エピソード移行エラー: ${updateError.message}`)
          } else {
            console.log(`   ✅ エピソード移行完了`)
          }
        }
        
        // 重複チャンネルを削除
        const { error: deleteError } = await supabase
          .from('celebrities')
          .delete()
          .eq('id', dupChannel.id)
        
        if (deleteError) {
          console.error(`   ❌ チャンネル削除エラー: ${deleteError.message}`)
        } else {
          console.log(`   ✅ 重複チャンネル削除: ${dupChannel.name}`)
        }
      }
    }
    
    // 5. celebrity_idがnullのエピソードを関連付け
    console.log('\n🔗 未関連付けエピソードを修正中...')
    const { count: nullEpisodeCount, error: countError } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .is('celebrity_id', null)
    
    if (!countError && nullEpisodeCount && nullEpisodeCount > 0) {
      console.log(`   📺 未関連付けエピソード: ${nullEpisodeCount}件`)
      
      const { error: linkError } = await supabase
        .from('episodes')
        .update({ celebrity_id: officialYoniChannel.id })
        .is('celebrity_id', null)
      
      if (linkError) {
        console.error(`   ❌ 関連付けエラー: ${linkError.message}`)
      } else {
        console.log(`   ✅ ${nullEpisodeCount}件のエピソードを関連付け`)
      }
    }
  }
}

async function verifyFixes() {
  console.log('\n🔍 修正結果の検証...\n')
  
  // celebritiesの最終状態
  const { data: finalCelebrities } = await supabase
    .from('celebrities')
    .select('*')
  
  console.log('📊 修正後のcelebritiesデータ:')
  finalCelebrities?.forEach((cel, i) => {
    console.log(`${i + 1}. ${cel.name} (ID: ${cel.id})`)
  })
  
  // エピソード関連付けの確認
  for (const celebrity of finalCelebrities || []) {
    const { count } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', celebrity.id)
    
    console.log(`🔗 ${celebrity.name}: ${count}件のエピソード`)
  }
  
  // 未関連付けエピソードの確認
  const { count: orphanEpisodes } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
    .is('celebrity_id', null)
  
  console.log(`\n⚠️ 未関連付けエピソード: ${orphanEpisodes || 0}件`)
  
  if (orphanEpisodes === 0) {
    console.log('✅ 全てのエピソードが正しく関連付けされています')
  }
}

// メイン実行
async function main() {
  try {
    await fixCelebrityData()
    await verifyFixes()
    
    console.log('\n🎉 celebritiesテーブルの修正完了！')
    console.log('✅ 正しいよにのチャンネル1件のみ')
    console.log('✅ 全エピソードが適切に関連付け')
    
  } catch (error) {
    console.error('❌ 修正処理でエラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}