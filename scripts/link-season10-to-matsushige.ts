#!/usr/bin/env node

/**
 * Season10エピソードに松重豊のcelebrity_idを設定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function linkSeason10ToMatsushige() {
  console.log('🔗 Season10エピソードに松重豊を関連付け...\n')
  
  // 松重豊のIDを取得
  const { data: celebrityData } = await supabase
    .from('celebrities')
    .select('id, name')
    .eq('slug', 'matsushige-yutaka')
    .single()
  
  if (!celebrityData) {
    console.log('❌ 松重豊のデータが見つかりません')
    return
  }
  
  console.log(`👤 松重豊 ID: ${celebrityData.id}\n`)
  
  // Season10の全エピソードを更新
  const { data: updateData, error: updateError } = await supabase
    .from('episodes')
    .update({ 
      celebrity_id: celebrityData.id,
      updated_at: new Date().toISOString()
    })
    .like('title', '%Season10%')
    .select()
  
  if (updateError) {
    console.error('❌ 更新エラー:', updateError)
    return
  }
  
  console.log(`✅ ${updateData?.length || 0}エピソードを松重豊に関連付けました`)
  
  // 更新結果を確認
  const { data: verifyData } = await supabase
    .from('episodes')
    .select('title, celebrity_id')
    .like('title', '%Season10%')
    .order('title')
  
  console.log('\n📝 更新確認:')
  verifyData?.forEach(ep => {
    const episodeNum = ep.title.match(/第(\d+)話/)?.[1] || '?'
    const status = ep.celebrity_id === celebrityData.id ? '✅' : '❌'
    console.log(`${status} 第${episodeNum}話`)
  })
  
  console.log('\n🎉 関連付け完了！')
  console.log('📺 https://collection.oshikatsu-guide.com/celebrities/matsushige-yutaka')
  console.log('で Season10 が表示されるようになりました')
}

linkSeason10ToMatsushige()
