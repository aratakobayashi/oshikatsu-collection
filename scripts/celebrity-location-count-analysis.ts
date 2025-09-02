#!/usr/bin/env node

/**
 * タレント別ロケーション数の実態調査
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeCelebrityLocationCounts() {
  console.log('📊 タレント別ロケーション数の実態調査')
  console.log('='.repeat(50))

  // セレブリティ別のロケーション数を調査
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select(`
      id, name, slug,
      episode_locations(
        location_id,
        locations(id, name, address)
      )
    `)

  if (!celebrities) return

  const locationCounts = celebrities
    .map(celeb => {
      const uniqueLocations = new Set()
      
      celeb.episode_locations?.forEach(el => {
        if (el.locations) {
          uniqueLocations.add(el.location_id)
        }
      })
      
      return {
        name: celeb.name,
        slug: celeb.slug,
        location_count: uniqueLocations.size,
        total_episodes: celeb.episode_locations?.length || 0
      }
    })
    .filter(celeb => celeb.location_count > 0)
    .sort((a, b) => b.location_count - a.location_count)

  console.log('\n🏆 【TOP20】ロケーション数ランキング:')
  console.log('='.repeat(40))
  
  locationCounts.slice(0, 20).forEach((celeb, index) => {
    const over6 = celeb.location_count > 6 ? '⚠️ 6件超過' : '✅'
    console.log(`${index + 1}. ${celeb.name}: ${celeb.location_count}箇所 ${over6}`)
  })

  // 6件超過の詳細分析
  const over6Celebrities = locationCounts.filter(c => c.location_count > 6)
  
  console.log(`\n⚠️  【6件超過の問題】`)
  console.log(`6件超過のタレント: ${over6Celebrities.length}人`)
  console.log(`全体の割合: ${Math.round((over6Celebrities.length / locationCounts.length) * 100)}%`)
  
  if (over6Celebrities.length > 0) {
    console.log('\n詳細:')
    over6Celebrities.slice(0, 10).forEach(celeb => {
      const hidden = celeb.location_count - 6
      console.log(`  ${celeb.name}: ${celeb.location_count}箇所 (${hidden}箇所が非表示)`)
    })
  }

  // 松重豊の具体例調査
  const matshige = locationCounts.find(c => c.name.includes('松重'))
  if (matshige) {
    console.log(`\n🔍 【松重豊の実態】`)
    console.log(`  ロケーション数: ${matshige.location_count}箇所`)
    console.log(`  現在の制限: ${matshige.location_count > 6 ? '6件制限で問題あり' : '6件制限で十分'}`)
  }

  return {
    total_celebrities: locationCounts.length,
    over_6_count: over6Celebrities.length,
    top_locations: locationCounts.slice(0, 10)
  }
}

// 実行
analyzeCelebrityLocationCounts()
  .then(results => {
    if (results) {
      console.log(`\n✅ 調査完了!`)
      console.log(`   対象タレント: ${results.total_celebrities}人`)
      console.log(`   6件超過: ${results.over_6_count}人`)
    }
  })
  .catch(error => {
    console.error('❌ エラー:', error)
  })
