/**
 * 適切なテストデータ作成
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function createProperTestData() {
  console.log('🔧 適切なテストデータ作成開始')
  console.log('='.repeat(50))
  
  try {
    // よにのちゃんねる取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'よにのちゃんねる')
      .single()
      
    if (!celebrity) {
      console.log('❌ よにのちゃんねる見つからず')
      return
    }
    
    // エピソード取得
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('celebrity_id', celebrity.id)
      .limit(5)
      
    if (!episodes || episodes.length === 0) {
      console.log('❌ エピソード見つからず')
      return
    }
    
    console.log('📺 エピソード準備完了:', episodes.length, '件')
    
    // 1. 既存の不正データを削除
    console.log('\n🗑️ 既存データ削除中...')
    
    const episodeIds = episodes.map(ep => ep.id)
    
    await supabase.from('episode_locations').delete().in('episode_id', episodeIds)
    await supabase.from('episode_items').delete().in('episode_id', episodeIds)
    
    // 既存のlocations/itemsも削除（新しいものを作成するため）
    const { data: existingLocations } = await supabase
      .from('episode_locations')
      .select('location_id')
    
    const { data: existingItems } = await supabase
      .from('episode_items')
      .select('item_id')
      
    if (existingLocations && existingLocations.length === 0) {
      // 関連データがなければlocationsテーブルをクリア
      await supabase.from('locations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }
    
    if (existingItems && existingItems.length === 0) {
      // 関連データがなければitemsテーブルをクリア
      await supabase.from('items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }
    
    console.log('✅ 既存データ削除完了')
    
    // 2. 適切なlocationsデータ作成
    console.log('\n🏪 Locationsデータ作成中...')
    
    const properLocations = [
      {
        name: 'ポール・ボキューズ 西新宿店',
        slug: 'paul-bocuse-nishishinjuku',
        address: '東京都新宿区西新宿1-26-2 新宿野村ビル48階',
        description: 'よにのちゃんねるの撮影で訪れたフレンチレストラン。新宿の高層階からの眺望が美しく、特別な日の食事におすすめ。',
        website_url: 'https://www.bocuse.jp/',
        tags: ['フレンチ', '高級レストラン', '新宿', '眺望'],
        celebrity_id: celebrity.id
      },
      {
        name: 'Blue Seal アメリカンビレッジ店',
        slug: 'blue-seal-american-village',
        address: '沖縄県中頭郡北谷町美浜15-69',
        description: '沖縄の有名アイスクリーム店。よにのちゃんねるメンバーが沖縄ロケで訪問。紅芋やシークワーサーなど沖縄限定フレーバーが人気。',
        website_url: 'https://www.blueseal.co.jp/',
        tags: ['アイスクリーム', '沖縄', 'ご当地グルメ'],
        celebrity_id: celebrity.id
      },
      {
        name: 'スターバックス コーヒー 渋谷スカイ店',
        slug: 'starbucks-shibuya-sky',
        address: '東京都渋谷区渋谷2-24-12 渋谷スカイ14階',
        description: '渋谷の絶景を眺めながらコーヒーが楽しめる店舗。よにのちゃんねるの休憩シーンで登場。',
        website_url: 'https://www.starbucks.co.jp/',
        tags: ['コーヒー', '渋谷', '眺望', 'カフェ'],
        celebrity_id: celebrity.id
      },
      {
        name: '築地本願寺カフェ Tsumugi',
        slug: 'tsukiji-honganji-cafe-tsumugi',
        address: '東京都中央区築地3-15-1 築地本願寺内',
        description: '築地本願寺内にある和カフェ。よにのちゃんねるで和菓子とお茶を楽しむシーンが印象的だった。',
        website_url: 'https://cafe-tsumugi.jp/',
        tags: ['和カフェ', '築地', '和菓子', '抹茶'],
        celebrity_id: celebrity.id
      }
    ]
    
    const { data: insertedLocations, error: locInsertError } = await supabase
      .from('locations')
      .insert(properLocations)
      .select('id, name')
      
    if (locInsertError) {
      console.log('❌ Locations挿入エラー:', locInsertError.message)
      return
    }
    
    console.log('✅ Locations作成完了:', insertedLocations?.length, '件')
    
    // 3. 適切なitemsデータ作成
    console.log('\n🛍️ Itemsデータ作成中...')
    
    const properItems = [
      {
        name: 'ユニクロ ヒートテック クルーネックT（長袖）',
        slug: 'uniqlo-heattech-crew-neck-t-long-sleeve',
        brand: 'UNIQLO',
        category: 'fashion',
        price: 1500,
        description: '二宮和也さんがよく着用している定番のヒートテック。シンプルで使いやすいデザイン。',
        purchase_url: 'https://www.uniqlo.com/jp/ja/products/E422553-000/',
        image_url: 'https://im.uniqlo.com/global-cms/spa/res/media/catalog/product/4/2/422553_item_01_400.jpg',
        tags: ['インナー', 'ベーシック', '防寒'],
        celebrity_id: celebrity.id
      },
      {
        name: 'Supreme Box Logo Hooded Sweatshirt',
        slug: 'supreme-box-logo-hooded-sweatshirt',
        brand: 'Supreme',
        category: 'fashion',
        price: 89000,
        description: '山田涼介さん愛用のSupremeパーカー。ストリートファッションの定番アイテム。',
        purchase_url: 'https://www.supremenewyork.com/',
        tags: ['ストリート', 'パーカー', 'ハイブランド'],
        celebrity_id: celebrity.id
      },
      {
        name: 'PORTER TANKER ショルダーバッグ',
        slug: 'porter-tanker-shoulder-bag',
        brand: 'PORTER',
        category: 'fashion',
        price: 24200,
        description: '菊池風磨さんが使用していたポーターのショルダーバッグ。機能性とデザイン性を兼ね備えた逸品。',
        purchase_url: 'https://www.yoshidakaban.com/',
        tags: ['バッグ', '機能的', '日本製'],
        celebrity_id: celebrity.id
      },
      {
        name: 'New Balance 993',
        slug: 'new-balance-993',
        brand: 'New Balance',
        category: 'fashion',
        price: 35200,
        description: 'よにのちゃんねるメンバーがロケでよく履いているニューバランスのスニーカー。履き心地抜群。',
        purchase_url: 'https://shop.newbalance.jp/',
        tags: ['スニーカー', '履きやすい', 'アメリカ製'],
        celebrity_id: celebrity.id
      },
      {
        name: 'G-SHOCK DW-5600E',
        slug: 'g-shock-dw-5600e',
        brand: 'CASIO',
        category: 'fashion',
        price: 13200,
        description: 'ロケ中に着用していたG-SHOCKの定番モデル。耐久性に優れ、あらゆるシーンで活躍。',
        purchase_url: 'https://www.casio.com/jp/',
        tags: ['腕時計', '耐久性', 'スポーティ'],
        celebrity_id: celebrity.id
      }
    ]
    
    const { data: insertedItems, error: itemInsertError } = await supabase
      .from('items')
      .insert(properItems)
      .select('id, name')
      
    if (itemInsertError) {
      console.log('❌ Items挿入エラー:', itemInsertError.message)
      return
    }
    
    console.log('✅ Items作成完了:', insertedItems?.length, '件')
    
    // 4. Episode-Location リンク作成
    console.log('\n🔗 Episode-Location リンク作成中...')
    
    if (insertedLocations && insertedLocations.length >= 4) {
      const locationLinks = [
        { episode_id: episodes[0].id, location_id: insertedLocations[0].id },
        { episode_id: episodes[0].id, location_id: insertedLocations[1].id },
        { episode_id: episodes[1].id, location_id: insertedLocations[0].id },
        { episode_id: episodes[1].id, location_id: insertedLocations[2].id },
        { episode_id: episodes[2].id, location_id: insertedLocations[2].id },
        { episode_id: episodes[2].id, location_id: insertedLocations[3].id },
        { episode_id: episodes[3].id, location_id: insertedLocations[1].id },
        { episode_id: episodes[4].id, location_id: insertedLocations[3].id }
      ]
      
      const { error: locLinkError } = await supabase
        .from('episode_locations')
        .insert(locationLinks)
        
      if (locLinkError) {
        console.log('❌ Episode-Location リンクエラー:', locLinkError.message)
      } else {
        console.log('✅ Episode-Location リンク作成完了:', locationLinks.length, '件')
      }
    }
    
    // 5. Episode-Item リンク作成
    console.log('\n🔗 Episode-Item リンク作成中...')
    
    if (insertedItems && insertedItems.length >= 5) {
      const itemLinks = [
        { episode_id: episodes[0].id, item_id: insertedItems[0].id },
        { episode_id: episodes[0].id, item_id: insertedItems[1].id },
        { episode_id: episodes[0].id, item_id: insertedItems[2].id },
        { episode_id: episodes[1].id, item_id: insertedItems[1].id },
        { episode_id: episodes[1].id, item_id: insertedItems[3].id },
        { episode_id: episodes[2].id, item_id: insertedItems[2].id },
        { episode_id: episodes[2].id, item_id: insertedItems[4].id },
        { episode_id: episodes[3].id, item_id: insertedItems[0].id },
        { episode_id: episodes[3].id, item_id: insertedItems[3].id },
        { episode_id: episodes[4].id, item_id: insertedItems[4].id }
      ]
      
      const { error: itemLinkError } = await supabase
        .from('episode_items')
        .insert(itemLinks)
        
      if (itemLinkError) {
        console.log('❌ Episode-Item リンクエラー:', itemLinkError.message)
      } else {
        console.log('✅ Episode-Item リンク作成完了:', itemLinks.length, '件')
      }
    }
    
    console.log('\n🎉 適切なテストデータ作成完了！')
    console.log('👀 ブラウザでcelebrityページを確認してください:')
    console.log('   http://localhost:5173/celebrities/よにのちゃんねる')
    
  } catch (error: any) {
    console.error('❌ エラー:', error.message)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  createProperTestData().catch(console.error)
}