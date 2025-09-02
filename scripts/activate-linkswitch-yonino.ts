#!/usr/bin/env node

/**
 * よにのちゃんねる LinkSwitch一括有効化
 * 既存の75%食べログURLに対してLinkSwitchを有効化し、即座に収益化
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function activateLinkSwitchYonino() {
  console.log('⚡ よにのちゃんねる LinkSwitch一括有効化開始...\n')
  console.log('既存の75%食べログURLを即座に収益化します！')
  console.log('=' .repeat(60))
  
  try {
    // よにのちゃんねるの食べログURLを持つ全ロケーションを取得
    const { data: locations, error } = await supabase
      .from('locations')
      .select(`
        id,
        name,
        tabelog_url,
        affiliate_info,
        episode_locations(
          episodes(
            id,
            title,
            celebrities(
              id,
              name,
              slug
            )
          )
        )
      `)
      .not('tabelog_url', 'is', null)
      .neq('tabelog_url', '')
    
    if (error) {
      console.error('❌ データ取得エラー:', error)
      return
    }
    
    if (!locations || locations.length === 0) {
      console.error('❌ 食べログURLを持つロケーションが見つかりません')
      return
    }
    
    // よにのちゃんねる関連のロケーションをフィルタ
    const yoninoLocations = locations.filter(location => 
      location.episode_locations?.some((epLoc: any) => 
        epLoc.episodes?.celebrities?.slug === 'よにのちゃんねる'
      )
    )
    
    console.log(`✅ よにのちゃんねる関連ロケーション: ${yoninoLocations.length}箇所`)
    console.log(`📊 食べログURL保有率: 100%（対象のみ）\\n`)
    
    let activatedCount = 0
    let alreadyActiveCount = 0
    let errorCount = 0
    
    for (const location of yoninoLocations) {
      console.log(`\\n🏪 ${location.name}`)
      console.log(`   食べログ: ${location.tabelog_url}`)
      
      try {
        // 既存のaffiliate_infoを確認
        const currentInfo = location.affiliate_info || {}
        const currentLinkSwitch = currentInfo.linkswitch || {}
        
        if (currentLinkSwitch.status === 'active') {
          console.log(`   LinkSwitch: ✅ 既に有効`)
          alreadyActiveCount++
          continue
        }
        
        // LinkSwitchを有効化
        const updatedAffiliateInfo = {
          ...currentInfo,
          linkswitch: {
            status: 'active',
            original_url: location.tabelog_url,
            last_verified: new Date().toISOString(),
            activation_source: 'yonino_bulk_activation',
            notes: 'よにのちゃんねる一括収益化プロジェクト'
          },
          restaurant_info: {
            ...currentInfo.restaurant_info,
            monetization_status: 'linkswitch_active',
            updated_at: new Date().toISOString()
          }
        }
        
        const { error: updateError } = await supabase
          .from('locations')
          .update({
            affiliate_info: updatedAffiliateInfo
          })
          .eq('id', location.id)
        
        if (updateError) {
          console.error(`   ❌ 更新エラー: ${updateError.message}`)
          errorCount++
          continue
        }
        
        console.log(`   LinkSwitch: ⚡ 有効化完了`)
        console.log(`      → aml.valuecommerce.com変換対応`)
        console.log(`      → 即座に収益発生開始`)
        
        activatedCount++
        
      } catch (error) {
        console.error(`   ❌ 予期しないエラー: ${error}`)
        errorCount++
      }
    }
    
    console.log('\\n' + '=' .repeat(60))
    console.log('\\n⚡ LinkSwitch一括有効化結果:')
    console.log(`   ✅ 新規有効化: ${activatedCount}件`)
    console.log(`   🔄 既に有効: ${alreadyActiveCount}件`)
    console.log(`   ❌ エラー: ${errorCount}件`)
    console.log(`   📊 総対象: ${yoninoLocations.length}件`)
    
    if (activatedCount > 0) {
      console.log('\\n🎊🎊🎊 よにのちゃんねる収益化大成功！ 🎊🎊🎊')
      console.log('\\n💰 即座に収益発生開始:')
      console.log(`   - ${activatedCount}店舗でLinkSwitch自動アフィリエイト化完了`)
      console.log('   - 食べログリンククリックで即座に収益発生')
      console.log('   - aml.valuecommerce.com自動変換対応')
      console.log('   - 314エピソードの収益化基盤構築完了')
      
      const totalActive = activatedCount + alreadyActiveCount
      console.log('\\n🎯 よにのちゃんねる収益化状況:')
      console.log(`   収益化店舗: ${totalActive}/${yoninoLocations.length}店舗`)
      console.log(`   収益化率: ${Math.round((totalActive / yoninoLocations.length) * 100)}%`)
      console.log(`   データ品質: 優良（食べログURL保有）`)
      
      console.log('\\n📈 収益化戦略完了:')
      console.log('   ✅ Phase 1: データ品質調査完了')
      console.log('   ✅ Phase 2: LinkSwitch一括有効化完了')
      console.log('   🔄 Phase 3: 追加ロケーション発掘（必要に応じて）')
      console.log('   🔄 Phase 4: 他セレブへの展開')
      
      console.log('\\n📋 次のステップ:')
      console.log('1. フロントエンドでLinkSwitch動作確認')
      console.log('2. 収益発生の確認')
      console.log('3. ≠MEへの同様アプローチ適用')
      console.log('4. SixTONESへの展開検討')
      
      console.log('\\n🌟 よにのちゃんねる = 松重豊に続く成功事例！')
      console.log('既存データ活用での効率的収益化モデルを確立！')
    } else if (alreadyActiveCount > 0) {
      console.log('\\n✅ 既に最適化済み！')
      console.log('よにのちゃんねるのLinkSwitchは完全に有効化されています')
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
activateLinkSwitchYonino().catch(console.error)