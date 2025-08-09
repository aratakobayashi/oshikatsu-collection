/**
 * 開発環境用ユーザージャーニーテストスクリプト
 * モックデータベースを使用して安全にテストデータを作成
 */

import { mockDb } from '../src/lib/mock-database'
import {
  mainTestChannel,
  testEpisodes,
  testItems,
  testLocations,
  testWorks,
  testPosts
} from './complete-user-journey-data'

export async function createCompleteUserJourney() {
  console.log('🚀 開発環境でユーザージャーニー用テストデータを作成中...')
  
  try {
    // 既存データをクリア
    await mockDb.clearAll()
    
    // 1. メインチャンネル「配信者テスト01」作成
    console.log('👤 メインチャンネル「配信者テスト01」を作成中...')
    const channel = await mockDb.celebrities.create(mainTestChannel)
    console.log(`✅ チャンネル作成完了: ${channel.name} (${channel.subscriber_count}人登録)`)

    // 2. エピソード（動画）作成
    console.log('📺 動画エピソードを作成中...')
    const episodes = []
    for (const episodeData of testEpisodes) {
      const episode = await mockDb.episodes.create(episodeData)
      episodes.push(episode)
    }
    console.log(`✅ ${episodes.length}個のエピソードを作成しました`)

    // 3. 関連アイテム作成
    console.log('🛍️ 関連アイテムを作成中...')
    const items = []
    for (const itemData of testItems) {
      const item = await mockDb.items.create(itemData)
      items.push(item)
    }
    console.log(`✅ ${items.length}個のアイテムを作成しました`)

    // 4. 関連店舗・ロケ地作成
    console.log('🏪 関連店舗・ロケ地を作成中...')
    const locations = []
    for (const locationData of testLocations) {
      const location = await mockDb.locations.create(locationData)
      locations.push(location)
    }
    console.log(`✅ ${locations.length}個の店舗・ロケ地を作成しました`)

    // 5. 作品（ゲーム）作成
    console.log('🎮 関連作品を作成中...')
    const works = []
    for (const workData of testWorks) {
      const work = await mockDb.works.create(workData)
      works.push(work)
    }
    console.log(`✅ ${works.length}個の作品を作成しました`)

    // 6. ユーザー投稿作成
    console.log('💬 ユーザー投稿を作成中...')
    const posts = []
    for (const postData of testPosts) {
      const post = await mockDb.posts.create(postData)
      posts.push(post)
    }
    console.log(`✅ ${posts.length}個の投稿を作成しました`)

    // 統計情報表示
    const stats = await mockDb.getStats()

    console.log('\n🎉 完全なユーザージャーニー用データの作成が完了しました！')
    console.log('📋 作成されたデータ:')
    console.log(`- チャンネル: ${channel.name} (${channel.subscriber_count}人登録)`)
    console.log(`- エピソード: ${episodes.length}本の動画`)
    console.log(`- アイテム: ${items.length}個の関連商品`)
    console.log(`- 店舗・ロケ地: ${locations.length}箇所`)
    console.log(`- 作品: ${works.length}作品`)
    console.log(`- ユーザー投稿: ${posts.length}件`)
    console.log(`- 総データ数: ${stats.total}件`)
    
    console.log('\n🔄 ユーザージャーニー:')
    console.log('1. 🔍 チャンネル検索で「配信者テスト01」を発見')
    console.log('   → 統一検索で "配信者テスト01" または "ゲーム実況" で検索')
    console.log('2. 📺 エピソード一覧から興味のある動画を選択')
    console.log('   → 「機材紹介」「グルメレビュー」「ゲーム実況」の3本')
    console.log('3. 🛍️ 動画内で紹介されたアイテムをチェック')
    console.log('   → ゲーミングヘッドセット、USBマイク、パンケーキミックス')
    console.log('4. 🏪 訪問した店舗の詳細情報を確認')
    console.log('   → テストカフェ、ゲームストア')
    console.log('5. 🛒 購買導線で実際に購入')
    console.log('   → Amazonアフィリエイトリンク')
    
    console.log('\n💡 すべて架空のデータなので安全に開発できます！')
    console.log('🌐 データはローカルストレージに保存されています')
    
    return {
      channel,
      episodes,
      items,
      locations,
      works,
      posts,
      stats
    }
  } catch (error) {
    console.error('❌ テストデータ作成エラー:', error)
    console.error('エラー詳細:', error.message)
    return false
  }
}

// ユーザージャーニーテスト
export async function testUserJourney() {
  console.log('🧪 ユーザージャーニーのテスト開始...')
  
  try {
    // 1. チャンネル検索テスト
    console.log('\n1. 🔍 チャンネル検索テスト')
    const searchResults = await mockDb.celebrities.unifiedSearch('配信者テスト01')
    console.log(`検索結果: ${searchResults.length}件`)
    
    if (searchResults.length > 0) {
      const channel = searchResults[0]
      console.log(`✅ 発見: ${channel.name} (${channel.subscriber_count}人登録)`)
      
      // 2. エピソード一覧取得テスト
      console.log('\n2. 📺 エピソード一覧取得テスト')
      const episodes = await mockDb.episodes.getByCelebrityId(channel.id)
      console.log(`エピソード数: ${episodes.length}本`)
      
      if (episodes.length > 0) {
        const episode = episodes[0] // 最初のエピソード
        console.log(`✅ エピソード: ${episode.title}`)
        
        // 3. 関連アイテム取得テスト
        console.log('\n3. 🛍️ 関連アイテム取得テスト')
        const items = await mockDb.items.getByEpisodeId(episode.id)
        console.log(`関連アイテム: ${items.length}個`)
        items.forEach(item => {
          console.log(`  - ${item.name} (${item.price.toLocaleString()}円)`)
        })
        
        // 4. 関連店舗取得テスト
        console.log('\n4. 🏪 関連店舗取得テスト')
        const locations = await mockDb.locations.getByEpisodeId(episode.id)
        console.log(`関連店舗: ${locations.length}箇所`)
        locations.forEach(location => {
          console.log(`  - ${location.name} (${location.address})`)
        })
      }
    }
    
    console.log('\n🎉 ユーザージャーニーテスト完了！')
    return true
  } catch (error) {
    console.error('❌ ユーザージャーニーテストエラー:', error)
    return false
  }
}

// スクリプト直接実行時
if (typeof window !== 'undefined') {
  // ブラウザ環境での実行
  ;(window as any).createCompleteUserJourney = createCompleteUserJourney
  ;(window as any).testUserJourney = testUserJourney
  console.log('🔧 開発者コンソールで以下のコマンドが使用できます:')
  console.log('- createCompleteUserJourney() : テストデータ作成')
  console.log('- testUserJourney() : ユーザージャーニーテスト')
}