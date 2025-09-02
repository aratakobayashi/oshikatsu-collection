#!/usr/bin/env node

/**
 * 孤独のグルメ Season1 第11話のロケーション調査
 * 香味徳が見つからない問題を解決
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function findEpisode11Location() {
  console.log('🔍 孤独のグルメ Season1 第11話のロケーション調査...\n')
  
  // 松重豊のIDを取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('slug', 'matsushige-yutaka')
    .single()
  
  if (!celebrity) {
    console.error('❌ 松重豊のデータが見つかりません')
    return
  }

  try {
    // Season1のエピソードをすべて取得
    console.log('📺 Season1の全エピソード:')
    const { data: allEpisodes } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        date,
        episode_locations(
          location_id,
          locations(
            id,
            name,
            address
          )
        )
      `)
      .eq('celebrity_id', celebrity.id)
      .like('title', '%Season1%')
      .order('title')
    
    if (allEpisodes) {
      allEpisodes.forEach((ep, index) => {
        console.log(`\n${index + 1}. ${ep.title}`)
        if (ep.episode_locations && ep.episode_locations.length > 0) {
          ep.episode_locations.forEach(loc => {
            if (loc.locations) {
              console.log(`   → ${loc.locations.name} (${loc.locations.address || '住所不明'})`)
            }
          })
        } else {
          console.log('   → ロケーション未登録')
        }
      })
    }
    
    // 第11話を具体的に検索
    console.log('\n🔍 第11話の詳細検索:')
    const possibleTitles = [
      '%Season1%第11話%',
      '%Season1%11話%',
      '%根津%',
      '%餃子%',
      '%焼売%'
    ]
    
    for (const titlePattern of possibleTitles) {
      console.log(`\n検索パターン: ${titlePattern}`)
      const { data: episodes } = await supabase
        .from('episodes')
        .select(`
          id,
          title,
          episode_locations(
            location_id,
            locations(
              id,
              name,
              address,
              tabelog_url
            )
          )
        `)
        .eq('celebrity_id', celebrity.id)
        .like('title', titlePattern)
      
      if (episodes && episodes.length > 0) {
        episodes.forEach(ep => {
          console.log(`  ✅ 見つかりました: ${ep.title}`)
          if (ep.episode_locations && ep.episode_locations.length > 0) {
            ep.episode_locations.forEach(loc => {
              if (loc.locations) {
                console.log(`     → ${loc.locations.name}`)
                console.log(`       住所: ${loc.locations.address || '不明'}`)
                console.log(`       食べログ: ${loc.locations.tabelog_url || 'なし'}`)
                console.log(`       Location ID: ${loc.locations.id}`)
              }
            })
          }
        })
      }
    }
    
    // 香味徳という名前のロケーションを直接検索
    console.log('\n🔍 「香味徳」名前検索:')
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name, address, tabelog_url')
      .or('name.ilike.%香味徳%,name.ilike.%根津%,name.ilike.%中華%')
    
    if (locations && locations.length > 0) {
      console.log('見つかったロケーション:')
      locations.forEach(loc => {
        console.log(`  - ${loc.name} (ID: ${loc.id})`)
        console.log(`    住所: ${loc.address || '不明'}`)
        console.log(`    食べログ: ${loc.tabelog_url || 'なし'}`)
      })
    } else {
      console.log('香味徳に関連するロケーションは見つかりませんでした')
    }
    
    console.log('\n💡 推奨対応:')
    console.log('1. 第11話のエピソードが存在するか確認')
    console.log('2. 存在する場合、正しいロケーションとの紐付けを修正')
    console.log('3. 存在しない場合、香味徳のロケーションを新規作成')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
findEpisode11Location().catch(console.error)