#!/usr/bin/env node

/**
 * LinkSwitch収益化設定の確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLinkSwitchStatus() {
  console.log('🔍 LinkSwitch収益化設定確認...\n')
  console.log('=' .repeat(70))
  
  // タベログURL付きロケーション数を確認
  const { data: locationsWithTabelog, count: tabelogCount } = await supabase
    .from('locations')
    .select('id, name, tabelog_url, affiliate_info', { count: 'exact' })
    .not('tabelog_url', 'is', null)
    .neq('tabelog_url', '')
    .order('name')
  
  console.log(`📊 タベログURL設定済み店舗: ${tabelogCount}件\n`)
  
  if (locationsWithTabelog && locationsWithTabelog.length > 0) {
    // URL形式チェック
    const validUrls = locationsWithTabelog.filter(loc => 
      loc.tabelog_url && loc.tabelog_url.startsWith('https://tabelog.com/')
    )
    
    console.log(`✅ 有効なタベログURL: ${validUrls.length}/${tabelogCount}`)
    
    // Season10のURL確認
    console.log('\n📝 Season10のタベログURL確認:')
    const { data: season10Episodes } = await supabase
      .from('episodes')
      .select(`
        title,
        episode_locations(
          location:locations(
            name,
            tabelog_url
          )
        )
      `)
      .like('title', '%Season10%')
      .order('title')
    
    season10Episodes?.forEach(ep => {
      const episodeNum = ep.title.match(/第(\d+)話/)?.[1] || '?'
      const location = ep.episode_locations?.[0]?.location
      if (location) {
        const status = location.tabelog_url && location.tabelog_url.includes('tabelog.com') ? '✅' : '❌'
        console.log(`  ${status} 第${episodeNum}話: ${location.name}`)
      }
    })
  }
  
  console.log('\n' + '=' .repeat(70))
  console.log('🔧 LinkSwitch仕組み説明:')
  console.log('1. タベログURLはValueCommerceのLinkSwitchで自動アフィリエイト化')
  console.log('2. ユーザーがクリック→LinkSwitchが自動変換→収益発生')
  console.log('3. 設定確認項目:')
  console.log('   - ValueCommerceアカウントでLinkSwitch有効化')
  console.log('   - タベログが提携承認済み')
  console.log('   - サイトドメインが登録済み')
  
  console.log('\n💰 収益化状況:')
  console.log('- タベログ.com ドメインのリンクは自動でアフィリエイト化')
  console.log('- rel="sponsored" 属性でSEO対応済み')
  console.log('- 新しいタブで開くため離脱率低下')
  console.log('=' .repeat(70))
}

checkLinkSwitchStatus()
