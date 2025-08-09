/**
 * 開発環境用テストデータ作成
 * 安全にAPIテストを行うための最小限のテストデータ
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function createTestData() {
  console.log('🎭 開発環境用テストデータ作成')
  console.log('='.repeat(50))
  
  try {
    // 1. テスト用セレブリティ作成
    console.log('👤 テスト用セレブリティ作成中...')
    
    const { data: celebrity, error: celebError } = await supabase
      .from('celebrities')
      .insert({
        name: 'よにのちゃんねる（開発用）',
        slug: 'よにのちゃんねる-dev',
        bio: '開発環境用テストデータ',
        type: 'youtube_channel',
        status: 'active'
      })
      .select()
      .single()
      
    if (celebError) {
      console.log('❌ セレブリティ作成エラー:', celebError.message)
      return
    }
    
    console.log('✅ セレブリティ作成完了:', celebrity.name, `(${celebrity.id})`)
    
    // 2. テスト用エピソード作成
    console.log('\n📺 テスト用エピソード作成中...')
    
    const testEpisodes = [
      {
        id: 'TEST001',
        title: '【テスト】開発環境用サンプルエピソード 1',
        description: 'APIテスト用のサンプルエピソードです',
        date: new Date().toISOString(),
        video_url: 'https://example.com/test1',
        celebrity_id: celebrity.id
      },
      {
        id: 'TEST002', 
        title: '【テスト】開発環境用サンプルエピソード 2',
        description: 'APIテスト用のサンプルエピソードです',
        date: new Date().toISOString(),
        video_url: 'https://example.com/test2',
        celebrity_id: celebrity.id
      }
    ]
    
    const { data: episodes, error: episodeError } = await supabase
      .from('episodes')
      .insert(testEpisodes)
      .select()
      
    if (episodeError) {
      console.log('❌ エピソード作成エラー:', episodeError.message)
      return
    }
    
    console.log('✅ エピソード作成完了:', episodes.length, '件')
    
    // 3. テスト用ロケーション作成
    console.log('\n🏪 テスト用ロケーション作成中...')
    
    const testLocations = [
      {
        name: 'テストカフェ（開発用）',
        slug: 'test-cafe-dev',
        description: 'APIテスト用のサンプルカフェです',
        address: '東京都テスト区テスト町1-2-3',
        celebrity_id: celebrity.id,
        tags: ['カフェ', 'テスト']
      },
      {
        name: 'テストレストラン（開発用）',
        slug: 'test-restaurant-dev', 
        description: 'APIテスト用のサンプルレストランです',
        address: '東京都テスト区テスト町4-5-6',
        celebrity_id: celebrity.id,
        tags: ['レストラン', 'テスト']
      }
    ]
    
    const { data: locations, error: locationError } = await supabase
      .from('locations')
      .insert(testLocations)
      .select()
      
    if (locationError) {
      console.log('❌ ロケーション作成エラー:', locationError.message)
      return
    }
    
    console.log('✅ ロケーション作成完了:', locations.length, '件')
    
    // 4. テスト用アイテム作成
    console.log('\n👕 テスト用アイテム作成中...')
    
    const testItems = [
      {
        name: 'テストTシャツ（開発用）',
        slug: 'test-tshirt-dev',
        description: 'APIテスト用のサンプルTシャツです',
        price: 2980.00,
        brand: 'テストブランド',
        category: 'トップス',
        celebrity_id: celebrity.id,
        tags: ['Tシャツ', 'テスト']
      },
      {
        name: 'テストスニーカー（開発用）',
        slug: 'test-sneaker-dev',
        description: 'APIテスト用のサンプルスニーカーです', 
        price: 12800.00,
        brand: 'テストブランド',
        category: 'シューズ',
        celebrity_id: celebrity.id,
        tags: ['スニーカー', 'テスト']
      }
    ]
    
    const { data: items, error: itemError } = await supabase
      .from('items')
      .insert(testItems)
      .select()
      
    if (itemError) {
      console.log('❌ アイテム作成エラー:', itemError.message)
      return
    }
    
    console.log('✅ アイテム作成完了:', items.length, '件')
    
    // 5. エピソード-ロケーション リンク作成
    console.log('\n🔗 エピソード-ロケーション リンク作成中...')
    
    const episodeLocationLinks = [
      { episode_id: episodes[0].id, location_id: locations[0].id },
      { episode_id: episodes[1].id, location_id: locations[1].id }
    ]
    
    const { error: linkLocationError } = await supabase
      .from('episode_locations')
      .insert(episodeLocationLinks)
      
    if (linkLocationError) {
      console.log('❌ エピソード-ロケーション リンクエラー:', linkLocationError.message)
      return
    }
    
    console.log('✅ エピソード-ロケーション リンク作成完了')
    
    // 6. エピソード-アイテム リンク作成
    console.log('\n🔗 エピソード-アイテム リンク作成中...')
    
    const episodeItemLinks = [
      { episode_id: episodes[0].id, item_id: items[0].id },
      { episode_id: episodes[1].id, item_id: items[1].id }
    ]
    
    const { error: linkItemError } = await supabase
      .from('episode_items')
      .insert(episodeItemLinks)
      
    if (linkItemError) {
      console.log('❌ エピソード-アイテム リンクエラー:', linkItemError.message)
      return
    }
    
    console.log('✅ エピソード-アイテム リンク作成完了')
    
    // 7. 最終確認
    console.log('\n📊 テストデータ作成完了サマリー:')
    console.log('   セレブリティ: 1件')
    console.log('   エピソード: 2件')
    console.log('   ロケーション: 2件')  
    console.log('   アイテム: 2件')
    console.log('   エピソード-ロケーション リンク: 2件')
    console.log('   エピソード-アイテム リンク: 2件')
    
    console.log('\n🎉 開発環境の準備完了！')
    console.log('🚀 これでAPIテストを安全に実行できます')
    
  } catch (error: any) {
    console.error('❌ テストデータ作成失敗:', error.message)
  }
}

// Run test data creation
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestData().catch(console.error)
}