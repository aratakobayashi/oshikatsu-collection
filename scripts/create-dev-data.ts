/**
 * 完全なユーザージャーニー用テストデータ作成スクリプト
 * 実在の人物・企業情報は使用せず、仮名データのみ使用
 * 
 * ユーザージャーニー：
 * チャンネル検索 → 動画エピソード → 関連アイテム → 店舗 → 購買導線
 */

import { db } from '../src/lib/supabase'

// 環境チェック - ローカル開発環境でのみ実行
const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'development'
const isLocalEnvironment = import.meta.env.VITE_SUPABASE_URL?.includes('localhost')

export const canCreateTestData = () => {
  return isDevelopment && (isLocalEnvironment || import.meta.env.VITE_SUPABASE_URL?.includes('127.0.0.1'))
}

// 安全なテストデータ
export const testYouTuberChannels = [
  {
    name: "配信者テスト01",
    slug: "test-streamer-01", 
    type: "youtube_channel" as const,
    bio: "テスト用のYouTuberチャンネルです。実在の人物ではありません。",
    subscriber_count: 50000,
    agency: "テスト配信事務所A",
    debut_date: "2020-01-01",
    official_color: "#FF6B6B",
    fandom_name: "テストファン01",
    image_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop",
    status: "active" as const
  },
  {
    name: "配信者テスト02",
    slug: "test-streamer-02",
    type: "youtube_channel" as const, 
    bio: "ゲーム実況専門のテスト配信者。架空のキャラクターです。",
    subscriber_count: 150000,
    agency: "テスト配信事務所B",
    debut_date: "2019-06-15", 
    official_color: "#4ECDC4",
    fandom_name: "テストゲーマーズ",
    image_url: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop",
    status: "active" as const
  },
  {
    name: "配信者テスト03",
    slug: "test-streamer-03",
    type: "youtube_channel" as const,
    bio: "料理動画を中心とした配信者。テスト用データです。", 
    subscriber_count: 300000,
    agency: "フリー",
    debut_date: "2018-03-20",
    official_color: "#95E1D3",
    fandom_name: "クッキングファン",
    image_url: "https://images.unsplash.com/photo-1494790108755-2616b612b1d3?w=400&h=400&fit=crop",
    status: "active" as const
  }
]

export const testItems = [
  {
    name: "テスト配信用ヘッドセット",
    brand: "テストブランドA",
    category: "electronics", 
    description: "配信者テスト01が使用しているヘッドセット（架空商品）",
    price: 15000,
    affiliate_url: "#test-link-1",
    image_url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop"
  },
  {
    name: "テスト配信用マイク",
    brand: "テストブランドB", 
    category: "electronics",
    description: "配信者テスト02愛用のUSBマイク（テスト商品）",
    price: 25000,
    affiliate_url: "#test-link-2", 
    image_url: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=400&fit=crop"
  }
]

export const testLocations = [
  {
    name: "テスト配信スタジオカフェ",
    address: "東京都渋谷区テスト町1-1-1",
    description: "配信者がよく利用するカフェ（架空店舗）",
    location_type: "cafe" as const,
    latitude: 35.658584,
    longitude: 139.745438,
    image_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=400&fit=crop"
  }
]

/**
 * 完全なユーザージャーニー用テストデータの作成
 */
export const createCompleteUserJourney = async () => {
  // 安全性チェック
  if (!canCreateTestData()) {
    console.error('❌ テストデータは開発環境でのみ作成できます')
    console.log('現在の環境:')
    console.log(`- VITE_ENVIRONMENT: ${import.meta.env.VITE_ENVIRONMENT}`)
    console.log(`- VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL}`)
    return false
  }

  try {
    console.log('🚀 完全なユーザージャーニー用テストデータを作成中...')
    
    // 完全なデータセットをインポート
    const {
      mainTestChannel,
      testEpisodes,
      testItems,
      testLocations,
      testWorks,
      testPosts
    } = await import('./complete-user-journey-data.js')

    // 1. メインチャンネル「配信者テスト01」作成
    console.log('👤 メインチャンネル「配信者テスト01」を作成中...')
    const channel = await db.celebrities.create(mainTestChannel)
    console.log(`✅ チャンネル作成完了: ${channel.name}`)

    // 2. エピソード（動画）作成
    console.log('📺 動画エピソードを作成中...')
    const episodes = await Promise.all(
      testEpisodes.map(episode => db.episodes.create(episode))
    )
    console.log(`✅ ${episodes.length}個のエピソードを作成しました`)

    // 3. 関連アイテム作成
    console.log('🛍️ 関連アイテムを作成中...')
    const items = await Promise.all(
      testItems.map(item => db.items.create(item))
    )
    console.log(`✅ ${items.length}個のアイテムを作成しました`)

    // 4. 関連店舗・ロケ地作成
    console.log('🏪 関連店舗・ロケ地を作成中...')
    const locations = await Promise.all(
      testLocations.map(location => db.locations.create(location))
    )
    console.log(`✅ ${locations.length}個の店舗・ロケ地を作成しました`)

    // 5. 作品（ゲーム）作成
    console.log('🎮 関連作品を作成中...')
    const works = await Promise.all(
      testWorks.map(work => db.works.create(work))
    )
    console.log(`✅ ${works.length}個の作品を作成しました`)

    // 6. ユーザー投稿作成
    console.log('💬 ユーザー投稿を作成中...')
    const posts = await Promise.all(
      testPosts.map(post => db.posts.create(post))
    )
    console.log(`✅ ${posts.length}個の投稿を作成しました`)

    console.log('\n🎉 完全なユーザージャーニー用データの作成が完了しました！')
    console.log('📋 作成されたデータ:')
    console.log(`- チャンネル: ${channel.name} (${channel.subscriber_count}人登録)`)
    console.log(`- エピソード: ${episodes.length}本の動画`)
    console.log(`- アイテム: ${items.length}個の関連商品`)
    console.log(`- 店舗・ロケ地: ${locations.length}箇所`)
    console.log(`- 作品: ${works.length}作品`)
    console.log(`- ユーザー投稿: ${posts.length}件`)
    console.log('\n🔄 ユーザージャーニー:')
    console.log('1. 🔍 チャンネル検索で「配信者テスト01」を発見')
    console.log('2. 📺 エピソード一覧から興味のある動画を選択')
    console.log('3. 🛍️ 動画内で紹介されたアイテムをチェック')
    console.log('4. 🏪 訪問した店舗の詳細情報を確認')
    console.log('5. 🛒 購買導線で実際に購入')
    console.log('\n💡 すべて架空のデータなので安全に開発できます！')
    
    return {
      channel,
      episodes,
      items,
      locations,
      works,
      posts
    }
  } catch (error) {
    console.error('❌ テストデータ作成エラー:', error)
    console.error('エラー詳細:', error.message)
    return false
  }
}

/**
 * テストデータの削除（開発環境リセット時）
 */
export const cleanupTestData = async () => {
  if (!canCreateTestData()) {
    console.error('❌ テストデータの削除は開発環境でのみ実行できます')
    return false
  }

  try {
    console.log('🧹 テストデータを削除中...')
    
    // テストデータのslugパターンで削除
    await db.celebrities.deleteMany({ slug: { startsWith: 'test-' } })
    await db.items.deleteMany({ name: { startsWith: 'テスト' } })
    await db.locations.deleteMany({ name: { startsWith: 'テスト' } })
    
    console.log('✅ テストデータの削除が完了しました')
    return true
  } catch (error) {
    console.error('❌ テストデータ削除エラー:', error)
    return false
  }
}

// スクリプト直接実行時
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2]
  
  if (command === 'create') {
    createDevelopmentData()
  } else if (command === 'cleanup') {
    cleanupTestData() 
  } else {
    console.log('使用方法:')
    console.log('  npm run dev-data create   - テストデータ作成')
    console.log('  npm run dev-data cleanup  - テストデータ削除')
  }
}