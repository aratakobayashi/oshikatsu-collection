/*
  # 国内アイドル検索サイト - サンプルデータ投入

  1. Snow Man（グループ）
  2. 目黒蓮（Snow Manメンバー）
  3. よにのチャンネル（YouTubeチャンネル）
  4. 関連する動画・訪問場所データ
*/

-- Insert Snow Man (Group)
INSERT INTO celebrities (
  name, slug, type, agency, debut_date, member_count, status, official_color, fandom_name,
  bio, image_url, youtube_url
) VALUES (
  'Snow Man',
  'snow-man',
  'group',
  'ジャニーズ事務所',
  '2020-01-22',
  9,
  'active',
  '#87CEEB',
  'Snow Family',
  '9人組男性アイドルグループ。2020年1月22日にCDデビュー。バラエティに富んだメンバーの個性と高いパフォーマンス力で人気を博している。',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  'https://www.youtube.com/@SnowManOfficial'
) ON CONFLICT (slug) DO NOTHING;

-- Insert 目黒蓮 (Individual member)
INSERT INTO celebrities (
  name, slug, type, agency, debut_date, status, parent_group_id,
  bio, image_url, birth_date, place_of_birth
) VALUES (
  '目黒蓮',
  'meguro-ren',
  'individual',
  'ジャニーズ事務所',
  '2020-01-22',
  'active',
  (SELECT id FROM celebrities WHERE slug = 'snow-man'),
  'Snow Manのメンバー。俳優としても活動し、ドラマや映画に多数出演。クールな外見と意外なギャップが人気。',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  '1997-02-16',
  '東京都'
) ON CONFLICT (slug) DO NOTHING;

-- Insert よにのチャンネル (YouTube Channel)
INSERT INTO celebrities (
  name, slug, type, subscriber_count, status, debut_date,
  bio, image_url, youtube_url
) VALUES (
  'よにのチャンネル',
  'yonino-channel',
  'youtube_channel',
  500000,
  'active',
  '2019-04-01',
  '日本の人気YouTubeチャンネル。グルメ、旅行、ライフスタイルを中心とした動画を配信。親しみやすいキャラクターで幅広い層に支持されている。',
  'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
  'https://www.youtube.com/@yoninochannnel'
) ON CONFLICT (slug) DO NOTHING;

-- Insert celebrity_groups relationship for 目黒蓮
INSERT INTO celebrity_groups (
  celebrity_id, group_id, role, position, joined_date, is_active, member_color
) VALUES (
  (SELECT id FROM celebrities WHERE slug = 'meguro-ren'),
  (SELECT id FROM celebrities WHERE slug = 'snow-man'),
  'member',
  'Main Visual',
  '2012-08-01',
  true,
  '#FF69B4'
) ON CONFLICT (celebrity_id, group_id) DO NOTHING;

-- Create work entries for sample content
INSERT INTO works (title, slug, type, description, release_date) VALUES 
('Snow Man LIVE 2024', 'snow-man-live-2024', 'variety', 'Snow Manのライブパフォーマンス映像', '2024-03-15'),
('目黒蓮 ドラマ出演', 'meguro-ren-drama', 'drama', '目黒蓮が主演を務めるドラマ', '2024-01-10'),
('よにの東京グルメ巡り', 'yonino-tokyo-gourmet', 'youtube_series', 'よにのチャンネルの東京グルメシリーズ', '2024-02-01')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample episodes/videos
INSERT INTO episodes (
  celebrity_id, work_id, title, date, description, video_url, thumbnail_url, platform, duration_minutes, view_count
) VALUES
-- Snow Man content
(
  (SELECT id FROM celebrities WHERE slug = 'snow-man'),
  (SELECT id FROM works WHERE slug = 'snow-man-live-2024'),
  'Snow Man「Grandeur」ミュージックビデオ',
  '2024-03-15',
  'Snow Manの最新シングル「Grandeur」のミュージックビデオ。メンバー全員のソロパートも見どころ。',
  'https://www.youtube.com/watch?v=sample1',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  'YouTube',
  4,
  2500000
),
-- 目黒蓮 content
(
  (SELECT id FROM celebrities WHERE slug = 'meguro-ren'),
  (SELECT id FROM works WHERE slug = 'meguro-ren-drama'),
  '目黒蓮主演ドラマ「Silent」最終回',
  '2024-01-10',
  '目黒蓮が主演を務める感動的なラブストーリー。最終回では涙なしには見られない名演技を披露。',
  'https://www.youtube.com/watch?v=sample2',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  'TBS',
  60,
  1200000
),
-- よにのチャンネル content
(
  (SELECT id FROM celebrities WHERE slug = 'yonino-channel'),
  (SELECT id FROM works WHERE slug = 'yonino-tokyo-gourmet'),
  '【絶品グルメ】原宿で話題のクレープ屋さんに行ってきた！',
  '2024-02-01',
  '原宿で話題の新しいクレープ店を訪問。インスタ映えする見た目と絶品の味をレポート！',
  'https://www.youtube.com/watch?v=sample3',
  'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
  'YouTube',
  12,
  850000
),
(
  (SELECT id FROM celebrities WHERE slug = 'yonino-channel'),
  (SELECT id FROM works WHERE slug = 'yonino-tokyo-gourmet'),
  '【高級寿司】銀座の老舗寿司店で贅沢ランチ',
  '2024-02-15',
  '銀座の老舗寿司店で特別なランチコースをいただきました。職人の技と新鮮な魚の美味しさをお届け！',
  'https://www.youtube.com/watch?v=sample4',
  'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
  'YouTube',
  15,
  920000
);

-- Insert sample locations (visited places)
INSERT INTO locations (
  episode_id, name, address, latitude, longitude, category, phone, website, description,
  image_urls, menu_example, price_range
) VALUES
-- よにのチャンネル - クレープ店
(
  (SELECT id FROM episodes WHERE title LIKE '%クレープ屋さん%' LIMIT 1),
  'RAINBOW PANCAKE 原宿店',
  '東京都渋谷区神宮前1-19-11',
  35.6702,
  139.7021,
  'スイーツ・カフェ',
  '03-1234-5678',
  'https://rainbow-pancake.example.com',
  '原宿で人気のクレープ専門店。インスタ映えする見た目と美味しさで若い女性を中心に大人気。',
  ARRAY[
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400'
  ],
  ARRAY['ストロベリークリーム クレープ', 'チョコバナナ クレープ', 'マンゴー クレープ'],
  '¥800-¥1,500'
),
-- よにのチャンネル - 寿司店
(
  (SELECT id FROM episodes WHERE title LIKE '%高級寿司%' LIMIT 1),
  '鮨 銀座 やま中',
  '東京都中央区銀座8-7-6 銀座グランドホテル1F',
  35.6711,
  139.7669,
  '寿司・和食',
  '03-9876-5432',
  'https://yamanaka-sushi.example.com',
  '銀座の老舗寿司店。厳選された新鮮な魚と職人の技が光る名店。完全予約制。',
  ARRAY[
    'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
    'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400'
  ],
  ARRAY['おまかせコース', '特上握り', '季節の一品'],
  '¥15,000-¥30,000'
);

-- Insert sample items (products/merchandise)
INSERT INTO items (
  episode_id, name, brand, category, price, currency, affiliate_url, image_url, description
) VALUES
-- Snow Man merchandise
(
  (SELECT id FROM episodes WHERE title LIKE '%Grandeur%' LIMIT 1),
  'Snow Man「Grandeur」CD+DVD',
  'ジャニーズ',
  'CD・DVD',
  1500,
  'JPY',
  'https://amazon.jp/snow-man-grandeur',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  'Snow Manの最新シングル「Grandeur」のCD+DVD盤。ミュージックビデオとメイキング映像を収録。'
),
-- よにのチャンネル - クレープ店で紹介されたアイテム
(
  (SELECT id FROM episodes WHERE title LIKE '%クレープ屋さん%' LIMIT 1),
  'RAINBOW PANCAKEオリジナル エコバッグ',
  'RAINBOW PANCAKE',
  'ファッション小物',
  800,
  'JPY',
  'https://rainbow-pancake-shop.example.com/ecobag',
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
  'RAINBOW PANCAKEのオリジナルデザインエコバッグ。可愛いクレープのイラスト入り。'
);