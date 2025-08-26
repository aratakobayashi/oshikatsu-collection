#!/usr/bin/env npx tsx

/**
 * 拡張候補直接検索
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function findExpansionCandidates() {
  console.log('🔍 拡張候補直接検索')
  
  try {
    // 1. 基本統計
    const { count: totalCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
    
    console.log('全ロケーション数:', totalCount)
    
    // 2. アフィリエイト設定済み数
    const { data: withAffiliate } = await supabase
      .from('locations')
      .select('id, name, tabelog_url')
      .not('tabelog_url', 'is', null)
    
    console.log('アフィリエイト設定済み:', withAffiliate?.length)
    
    // 3. アフィリエイト未設定のサンプルを取得
    const { data: withoutAffiliate, error } = await supabase
      .from('locations')
      .select('id, name, address, tabelog_url')
      .is('tabelog_url', null)
      .limit(10)
    
    if (error) {
      console.error('エラー:', error)
      return
    }
    
    console.log('アフィリエイト未設定サンプル:', withoutAffiliate?.length)
    
    if (withoutAffiliate && withoutAffiliate.length > 0) {
      console.log('\n候補:')
      for (let i = 0; i < Math.min(5, withoutAffiliate.length); i++) {
        const candidate = withoutAffiliate[i]
        console.log(`${i + 1}. ${candidate.name}`)
        console.log(`   ID: ${candidate.id}`)
        console.log(`   住所: ${candidate.address || '未設定'}`)
        
        // このロケーションがエピソードに紐付いているか確認
        const { data: episodeLink } = await supabase
          .from('episode_locations')
          .select('episode_id, episodes(title, celebrities(name))')
          .eq('location_id', candidate.id)
          .limit(1)
        
        if (episodeLink && episodeLink.length > 0) {
          const episode = episodeLink[0].episodes
          console.log(`   ✅ エピソード: ${episode?.title}`)
          console.log(`   ✅ 芸能人: ${episode?.celebrities?.name}`)
        } else {
          console.log(`   ❌ エピソード紐付きなし`)
        }
        console.log('')
      }
    }
    
  } catch (error) {
    console.error('❌ 検索エラー:', error)
  }
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  findExpansionCandidates()
}