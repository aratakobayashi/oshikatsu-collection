/**
 * 完全なユーザージャーニー用テストデータセット
 * 「配信者テスト01」を中心とした包括的なデータ作成
 * 
 * フロー：
 * 1. チャンネル検索 → 配信者テスト01を発見
 * 2. チャンネル詳細 → 動画エピソード一覧
 * 3. エピソード詳細 → 使用アイテム・訪問店舗
 * 4. アイテム詳細 → 購買導線（Amazon等）
 * 5. 店舗詳細 → 地図・営業情報
 */

// 🎯 メインチャンネル「配信者テスト01」
export const mainTestChannel = {
  id: '550e8400-e29b-41d4-a716-446655440001', // 固定UUID（他データとの関連付け用）
  name: "配信者テスト01",
  slug: "test-streamer-01",
  type: "youtube_channel" as const,
  bio: "ゲーム実況・グルメレビューを中心とした配信者です。実在の人物ではありません。開発テスト用データです。",
  subscriber_count: 125000,
  agency: "テスト配信事務所A",
  debut_date: "2020-03-15",
  official_color: "#FF6B6B",
  fandom_name: "テスター01ファミリー",
  image_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face",
  status: "active" as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// 📺 動画エピソード（配信者テスト01の動画）
export const testEpisodes = [
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    title: "【新作ゲーム】話題のインディーゲームを初見プレイ！",
    description: "最近話題のインディーゲーム『テストクエスト』を初見でプレイしてみました！予想以上に難しくて苦戦続き...皆さんならクリアできますか？",
    date: "2024-08-01",
    duration: 3600, // 60分
    view_count: 45000,
    thumbnail_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=640&h=360&fit=crop",
    video_url: "#test-video-1", // 実際の動画は存在しない
    celebrity_id: mainTestChannel.id,
    status: "published" as const,
    episode_type: "gaming" as const
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    title: "【グルメレビュー】渋谷の隠れ家カフェでモーニング！",
    description: "渋谷にあるテストカフェさんでモーニングセットをいただきました！雰囲気も最高で、パンケーキが絶品でした。場所など詳細は概要欄に！",
    date: "2024-07-28",
    duration: 1800, // 30分
    view_count: 32000,
    thumbnail_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=640&h=360&fit=crop",
    video_url: "#test-video-2",
    celebrity_id: mainTestChannel.id,
    status: "published" as const,
    episode_type: "food" as const
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    title: "【配信機材紹介】最近購入したゲーミング機材を紹介！",
    description: "最近新しく購入したゲーミングヘッドセットとマイクを紹介します！音質が格段にアップしました。購入リンクも貼っておきますね！",
    date: "2024-07-25",
    duration: 2400, // 40分
    view_count: 78000,
    thumbnail_url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=640&h=360&fit=crop",
    video_url: "#test-video-3",
    celebrity_id: mainTestChannel.id,
    status: "published" as const,
    episode_type: "review" as const
  }
]

// 🛍️ 関連アイテム（エピソードで紹介された商品）
export const testItems = [
  {
    id: '550e8400-e29b-41d4-a716-446655440021',
    name: "テストゲーミングヘッドセット Pro X1",
    brand: "テストオーディオ",
    category: "electronics",
    description: "配信者テスト01さんが機材紹介動画で絶賛していたゲーミングヘッドセット。7.1サラウンド対応で臨場感抜群！",
    price: 15800,
    affiliate_url: "https://example-store.com/gaming-headset-x1?ref=test",
    image_url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop",
    celebrity_id: mainTestChannel.id,
    episode_id: '550e8400-e29b-41d4-a716-446655440013', // 機材紹介動画
    is_featured: true,
    availability: "in_stock" as const,
    rating: 4.5,
    review_count: 234
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440022',
    name: "テストUSBコンデンサーマイク MC-2024",
    brand: "テストオーディオ",
    category: "electronics", 
    description: "配信者テスト01さん愛用の高音質USBマイク。ノイズキャンセリング機能付きで、クリアな音声を収録できます。",
    price: 22800,
    affiliate_url: "https://example-store.com/usb-mic-2024?ref=test",
    image_url: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=400&fit=crop",
    celebrity_id: mainTestChannel.id,
    episode_id: '550e8400-e29b-41d4-a716-446655440013', // 機材紹介動画
    is_featured: true,
    availability: "in_stock" as const,
    rating: 4.8,
    review_count: 156
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440023',
    name: "テストパンケーキミックス 極上バター風味",
    brand: "テストフーズ",
    category: "food",
    description: "配信者テスト01さんがカフェ動画で「家でも食べたい！」と絶賛していたパンケーキの味を再現した商品。",
    price: 680,
    affiliate_url: "https://example-store.com/pancake-mix?ref=test",
    image_url: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&h=400&fit=crop",
    celebrity_id: mainTestChannel.id,
    episode_id: '550e8400-e29b-41d4-a716-446655440012', // グルメレビュー動画
    is_featured: false,
    availability: "in_stock" as const,
    rating: 4.2,
    review_count: 89
  }
]

// 🏪 関連店舗・ロケ地
export const testLocations = [
  {
    id: '550e8400-e29b-41d4-a716-446655440031',
    name: "テストカフェ 渋谷隠れ家店",
    address: "東京都渋谷区テスト町2-3-4 テストビル1F",
    description: "配信者テスト01さんが動画で紹介した隠れ家的カフェ。手作りパンケーキとこだわりのコーヒーが自慢です。（架空の店舗）",
    location_type: "cafe" as const,
    latitude: 35.658584,
    longitude: 139.701744,
    image_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=400&fit=crop",
    phone: "03-0000-0000", // 架空の番号
    website: "https://test-cafe-shibuya.com",
    opening_hours: {
      "monday": "8:00-18:00",
      "tuesday": "8:00-18:00", 
      "wednesday": "8:00-18:00",
      "thursday": "8:00-18:00",
      "friday": "8:00-20:00",
      "saturday": "8:00-20:00",
      "sunday": "8:00-18:00"
    },
    celebrity_id: mainTestChannel.id,
    episode_id: '550e8400-e29b-41d4-a716-446655440012', // グルメレビュー動画
    is_featured: true,
    average_rating: 4.3,
    review_count: 127
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440032', 
    name: "テストゲームストア 秋葉原本店",
    address: "東京都千代田区テスト電気街1-1-1",
    description: "配信者テスト01さんがゲーム購入によく利用する専門店。レトロゲームからインディーゲームまで幅広く取り扱い。（架空の店舗）",
    location_type: "store" as const,
    latitude: 35.698353,
    longitude: 139.773114,
    image_url: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=400&fit=crop",
    phone: "03-0000-1111",
    website: "https://test-game-store.com",
    opening_hours: {
      "monday": "10:00-20:00",
      "tuesday": "10:00-20:00",
      "wednesday": "10:00-20:00", 
      "thursday": "10:00-20:00",
      "friday": "10:00-21:00",
      "saturday": "10:00-21:00",
      "sunday": "10:00-20:00"
    },
    celebrity_id: mainTestChannel.id,
    episode_id: '550e8400-e29b-41d4-a716-446655440011', // ゲーム実況動画
    is_featured: false,
    average_rating: 4.6,
    review_count: 89
  }
]

// 🎮 作品（ゲーム）
export const testWorks = [
  {
    id: '550e8400-e29b-41d4-a716-446655440041',
    title: "テストクエスト ～勇者の試練～",
    slug: "test-quest-hero-trial", 
    description: "配信者テスト01さんがプレイした話題のインディーRPG。美しいピクセルアートと心温まるストーリーが魅力。",
    genre: "RPG",
    release_date: "2024-07-15",
    platform: ["PC", "Nintendo Switch"],
    developer: "テストゲームスタジオ",
    publisher: "インディー・テスト・パブリッシャー",
    image_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop",
    official_website: "https://test-quest-game.com",
    steam_url: "https://store.steampowered.com/app/test-quest",
    average_rating: 4.4,
    review_count: 1256,
    price: 2980,
    status: "released" as const
  }
]

// 💬 ユーザー投稿（質問・コメント）
export const testPosts = [
  {
    id: '550e8400-e29b-41d4-a716-446655440051',
    title: "配信者テスト01さんのヘッドセット、実際の使用感は？",
    content: "配信者テスト01さんが紹介していたゲーミングヘッドセット、購入を検討しています。実際に使っている方がいたら使用感を教えてください！",
    category: "item_inquiry" as const,
    status: "open" as const,
    celebrity_id: mainTestChannel.id,
    item_id: '550e8400-e29b-41d4-a716-446655440021', // ヘッドセット
    author_name: "ユーザーA",
    view_count: 234,
    comment_count: 5,
    like_count: 8,
    created_at: "2024-07-29T10:30:00Z"
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440052',
    title: "テストカフェのパンケーキ、実際に食べに行ってきました！",
    content: "配信者テスト01さんの動画を見てテストカフェに行ってきました！本当に美味しかったです。雰囲気も素敵で、デートにもおすすめ。写真も撮ってきたので共有しますね。",
    category: "location_review" as const,
    status: "answered" as const,
    celebrity_id: mainTestChannel.id,
    location_id: '550e8400-e29b-41d4-a716-446655440031', // テストカフェ
    author_name: "グルメ好きB",
    view_count: 156,
    comment_count: 12,
    like_count: 23,
    created_at: "2024-07-30T15:45:00Z"
  }
]

// 🔗 データ関連性マッピング（ユーザージャーニー用）
export const dataRelationships = {
  // メインチャンネル → エピソード → アイテム・店舗の関連性
  channel_to_episodes: {
    [mainTestChannel.id]: testEpisodes.map(ep => ep.id)
  },
  episode_to_items: {
    '550e8400-e29b-41d4-a716-446655440013': ['550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440022'], // 機材紹介 → ヘッドセット, マイク
    '550e8400-e29b-41d4-a716-446655440012': ['550e8400-e29b-41d4-a716-446655440023'] // グルメ → パンケーキミックス
  },
  episode_to_locations: {
    '550e8400-e29b-41d4-a716-446655440012': ['550e8400-e29b-41d4-a716-446655440031'], // グルメ動画 → テストカフェ
    '550e8400-e29b-41d4-a716-446655440011': ['550e8400-e29b-41d4-a716-446655440032']  // ゲーム動画 → ゲームストア
  },
  episode_to_works: {
    '550e8400-e29b-41d4-a716-446655440011': ['550e8400-e29b-41d4-a716-446655440041'] // ゲーム動画 → テストクエスト
  }
}