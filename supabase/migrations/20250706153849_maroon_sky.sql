/*
  # Create dummy data for UI testing

  1. Dummy Data Creation
    - celebrities (30+ records)
    - brands (30+ records) 
    - episodes (30+ records)
    - items (30+ records)
    
  2. Foreign Key Relationships
    - All foreign keys properly linked
    - Realistic data relationships
    
  3. Data Variety
    - Different categories, prices, platforms
    - Japanese celebrity names and realistic content
*/

-- Insert celebrities
INSERT INTO celebrities (name, slug, image_url, youtube_url, bio, nationality) VALUES
('二宮和也', 'ninomiya-kazunari', 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg', 'https://youtube.com/@arashi', '嵐のメンバー、俳優としても活躍', '日本'),
('橋本涼', 'hashimoto-ryo', 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg', 'https://youtube.com/@yonino', 'よにののメンバー、ファッションリーダー', '日本'),
('田中美咲', 'tanaka-misaki', 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg', 'https://youtube.com/@misakichannel', '人気YouTuber、美容系インフルエンサー', '日本'),
('佐藤健太', 'sato-kenta', 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg', 'https://youtube.com/@kentasato', 'ファッション系YouTuber', '日本'),
('山田花子', 'yamada-hanako', 'https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg', 'https://youtube.com/@hanakochannel', 'ライフスタイル系インフルエンサー', '日本'),
('鈴木一郎', 'suzuki-ichiro', 'https://images.pexels.com/photos/1040882/pexels-photo-1040882.jpeg', 'https://youtube.com/@ichiro', 'お笑い芸人、バラエティタレント', '日本'),
('高橋美穂', 'takahashi-miho', 'https://images.pexels.com/photos/1065085/pexels-photo-1065085.jpeg', 'https://youtube.com/@mihochannel', 'モデル、ファッションアイコン', '日本'),
('伊藤大輔', 'ito-daisuke', 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg', 'https://youtube.com/@daisuke', 'ゲーム実況者、エンタメ系', '日本'),
('渡辺さくら', 'watanabe-sakura', 'https://images.pexels.com/photos/1040883/pexels-photo-1040883.jpeg', 'https://youtube.com/@sakurachannel', 'アイドル、歌手', '日本'),
('中村翔太', 'nakamura-shota', 'https://images.pexels.com/photos/1065086/pexels-photo-1065086.jpeg', 'https://youtube.com/@shota', 'ダンサー、振付師', '日本'),
('小林愛', 'kobayashi-ai', 'https://images.pexels.com/photos/1043475/pexels-photo-1043475.jpeg', 'https://youtube.com/@aichannel', 'グルメ系YouTuber', '日本'),
('加藤雄大', 'kato-yudai', 'https://images.pexels.com/photos/1040884/pexels-photo-1040884.jpeg', 'https://youtube.com/@yudai', 'スポーツ系インフルエンサー', '日本'),
('松本麗奈', 'matsumoto-reina', 'https://images.pexels.com/photos/1065087/pexels-photo-1065087.jpeg', 'https://youtube.com/@reina', 'コスメ系YouTuber', '日本'),
('森田拓也', 'morita-takuya', 'https://images.pexels.com/photos/1043476/pexels-photo-1043476.jpeg', 'https://youtube.com/@takuya', 'トラベル系YouTuber', '日本'),
('清水美優', 'shimizu-miyu', 'https://images.pexels.com/photos/1040885/pexels-photo-1040885.jpeg', 'https://youtube.com/@miyuchannel', 'ペット系YouTuber', '日本'),
('藤田和也', 'fujita-kazuya', 'https://images.pexels.com/photos/1065088/pexels-photo-1065088.jpeg', 'https://youtube.com/@kazuya', 'テック系YouTuber', '日本'),
('岡田真理', 'okada-mari', 'https://images.pexels.com/photos/1043477/pexels-photo-1043477.jpeg', 'https://youtube.com/@marichannel', 'DIY系YouTuber', '日本'),
('石川大樹', 'ishikawa-daiki', 'https://images.pexels.com/photos/1040886/pexels-photo-1040886.jpeg', 'https://youtube.com/@daiki', 'アウトドア系YouTuber', '日本'),
('村上彩香', 'murakami-ayaka', 'https://images.pexels.com/photos/1065089/pexels-photo-1065089.jpeg', 'https://youtube.com/@ayaka', 'ヨガ・フィットネス系', '日本'),
('長谷川純', 'hasegawa-jun', 'https://images.pexels.com/photos/1043478/pexels-photo-1043478.jpeg', 'https://youtube.com/@jun', 'ビジネス系YouTuber', '日本'),
('野口千夏', 'noguchi-chinatsu', 'https://images.pexels.com/photos/1040887/pexels-photo-1040887.jpeg', 'https://youtube.com/@chinatsu', 'アート系YouTuber', '日本'),
('三浦健', 'miura-ken', 'https://images.pexels.com/photos/1065090/pexels-photo-1065090.jpeg', 'https://youtube.com/@ken', 'ミュージシャン、シンガー', '日本'),
('安田美咲', 'yasuda-misaki', 'https://images.pexels.com/photos/1043479/pexels-photo-1043479.jpeg', 'https://youtube.com/@misakiyasuda', 'ダンス系YouTuber', '日本'),
('池田隆', 'ikeda-takashi', 'https://images.pexels.com/photos/1040888/pexels-photo-1040888.jpeg', 'https://youtube.com/@takashi', 'カメラ・写真系YouTuber', '日本'),
('西村優子', 'nishimura-yuko', 'https://images.pexels.com/photos/1065091/pexels-photo-1065091.jpeg', 'https://youtube.com/@yuko', '料理系YouTuber', '日本'),
('大野智也', 'ohno-tomoya', 'https://images.pexels.com/photos/1043480/pexels-photo-1043480.jpeg', 'https://youtube.com/@tomoya', 'エンタメ系YouTuber', '日本'),
('平田麻衣', 'hirata-mai', 'https://images.pexels.com/photos/1040889/pexels-photo-1040889.jpeg', 'https://youtube.com/@mai', 'ファッション系YouTuber', '日本'),
('坂本直樹', 'sakamoto-naoki', 'https://images.pexels.com/photos/1065092/pexels-photo-1065092.jpeg', 'https://youtube.com/@naoki', 'ゲーム系YouTuber', '日本'),
('内田沙織', 'uchida-saori', 'https://images.pexels.com/photos/1043481/pexels-photo-1043481.jpeg', 'https://youtube.com/@saori', 'ライフスタイル系YouTuber', '日本'),
('吉田浩二', 'yoshida-koji', 'https://images.pexels.com/photos/1040890/pexels-photo-1040890.jpeg', 'https://youtube.com/@koji', 'ビジネス・投資系YouTuber', '日本'),
('河野美穂', 'kono-miho', 'https://images.pexels.com/photos/1065093/pexels-photo-1065093.jpeg', 'https://youtube.com/@mihokono', 'トラベル系YouTuber', '日本'),
('木村拓哉', 'kimura-takuya', 'https://images.pexels.com/photos/1043482/pexels-photo-1043482.jpeg', 'https://youtube.com/@takuya', 'エンタメ系タレント', '日本'),
('斉藤愛美', 'saito-manami', 'https://images.pexels.com/photos/1040891/pexels-photo-1040891.jpeg', 'https://youtube.com/@manami', 'コスメ・美容系YouTuber', '日本');

-- Insert brands
INSERT INTO brands (name, slug, logo_url, official_site, description, country, founded_year) VALUES
('GUCCI', 'gucci', 'https://images.pexels.com/photos/1040892/pexels-photo-1040892.jpeg', 'https://www.gucci.com', 'イタリアの高級ファッションブランド', 'イタリア', 1921),
('UNIQLO', 'uniqlo', 'https://images.pexels.com/photos/1065094/pexels-photo-1065094.jpeg', 'https://www.uniqlo.com', '日本発のファストファッションブランド', '日本', 1984),
('ZARA', 'zara', 'https://images.pexels.com/photos/1043483/pexels-photo-1043483.jpeg', 'https://www.zara.com', 'スペインのファストファッションブランド', 'スペイン', 1975),
('Supreme', 'supreme', 'https://images.pexels.com/photos/1040893/pexels-photo-1040893.jpeg', 'https://www.supremenewyork.com', 'アメリカのストリートウェアブランド', 'アメリカ', 1994),
('Nike', 'nike', 'https://images.pexels.com/photos/1065095/pexels-photo-1065095.jpeg', 'https://www.nike.com', 'アメリカのスポーツウェアブランド', 'アメリカ', 1971),
('Adidas', 'adidas', 'https://images.pexels.com/photos/1043484/pexels-photo-1043484.jpeg', 'https://www.adidas.com', 'ドイツのスポーツウェアブランド', 'ドイツ', 1949),
('H&M', 'hm', 'https://images.pexels.com/photos/1040894/pexels-photo-1040894.jpeg', 'https://www.hm.com', 'スウェーデンのファストファッション', 'スウェーデン', 1947),
('Louis Vuitton', 'louis-vuitton', 'https://images.pexels.com/photos/1065096/pexels-photo-1065096.jpeg', 'https://www.louisvuitton.com', 'フランスの高級ファッションブランド', 'フランス', 1854),
('Chanel', 'chanel', 'https://images.pexels.com/photos/1043485/pexels-photo-1043485.jpeg', 'https://www.chanel.com', 'フランスの高級ファッションブランド', 'フランス', 1910),
('Prada', 'prada', 'https://images.pexels.com/photos/1040895/pexels-photo-1040895.jpeg', 'https://www.prada.com', 'イタリアの高級ファッションブランド', 'イタリア', 1913),
('Hermès', 'hermes', 'https://images.pexels.com/photos/1065097/pexels-photo-1065097.jpeg', 'https://www.hermes.com', 'フランスの高級ファッションブランド', 'フランス', 1837),
('Dior', 'dior', 'https://images.pexels.com/photos/1043486/pexels-photo-1043486.jpeg', 'https://www.dior.com', 'フランスの高級ファッションブランド', 'フランス', 1946),
('Balenciaga', 'balenciaga', 'https://images.pexels.com/photos/1040896/pexels-photo-1040896.jpeg', 'https://www.balenciaga.com', 'スペイン発の高級ファッションブランド', 'スペイン', 1919),
('Off-White', 'off-white', 'https://images.pexels.com/photos/1065098/pexels-photo-1065098.jpeg', 'https://www.off---white.com', 'イタリアのストリートウェアブランド', 'イタリア', 2013),
('Stone Island', 'stone-island', 'https://images.pexels.com/photos/1043487/pexels-photo-1043487.jpeg', 'https://www.stoneisland.com', 'イタリアのカジュアルウェアブランド', 'イタリア', 1982),
('Comme des Garçons', 'comme-des-garcons', 'https://images.pexels.com/photos/1040897/pexels-photo-1040897.jpeg', 'https://www.comme-des-garcons.com', '日本のアバンギャルドファッションブランド', '日本', 1969),
('Issey Miyake', 'issey-miyake', 'https://images.pexels.com/photos/1065099/pexels-photo-1065099.jpeg', 'https://www.isseymiyake.com', '日本のファッションブランド', '日本', 1970),
('Yohji Yamamoto', 'yohji-yamamoto', 'https://images.pexels.com/photos/1043488/pexels-photo-1043488.jpeg', 'https://www.yohjiyamamoto.co.jp', '日本のファッションブランド', '日本', 1981),
('Kenzo', 'kenzo', 'https://images.pexels.com/photos/1040898/pexels-photo-1040898.jpeg', 'https://www.kenzo.com', 'フランスのファッションブランド', 'フランス', 1970),
('Maison Margiela', 'maison-margiela', 'https://images.pexels.com/photos/1065100/pexels-photo-1065100.jpeg', 'https://www.maisonmargiela.com', 'ベルギーのファッションブランド', 'ベルギー', 1988),
('Vetements', 'vetements', 'https://images.pexels.com/photos/1043489/pexels-photo-1043489.jpeg', 'https://www.vetements.com', 'スイスのファッションブランド', 'スイス', 2014),
('Fear of God', 'fear-of-god', 'https://images.pexels.com/photos/1040899/pexels-photo-1040899.jpeg', 'https://www.fearofgod.com', 'アメリカのストリートウェアブランド', 'アメリカ', 2013),
('Stussy', 'stussy', 'https://images.pexels.com/photos/1065101/pexels-photo-1065101.jpeg', 'https://www.stussy.com', 'アメリカのストリートウェアブランド', 'アメリカ', 1980),
('A Bathing Ape', 'a-bathing-ape', 'https://images.pexels.com/photos/1043490/pexels-photo-1043490.jpeg', 'https://www.bape.com', '日本のストリートウェアブランド', '日本', 1993),
('Undercover', 'undercover', 'https://images.pexels.com/photos/1040900/pexels-photo-1040900.jpeg', 'https://www.undercoverism.com', '日本のファッションブランド', '日本', 1990),
('Neighborhood', 'neighborhood', 'https://images.pexels.com/photos/1065102/pexels-photo-1065102.jpeg', 'https://www.neighborhood.jp', '日本のストリートウェアブランド', '日本', 1994),
('Visvim', 'visvim', 'https://images.pexels.com/photos/1043491/pexels-photo-1043491.jpeg', 'https://www.visvim.tv', '日本のファッションブランド', '日本', 2001),
('Sacai', 'sacai', 'https://images.pexels.com/photos/1040901/pexels-photo-1040901.jpeg', 'https://www.sacai.jp', '日本のファッションブランド', '日本', 1999),
('Ambush', 'ambush', 'https://images.pexels.com/photos/1065103/pexels-photo-1065103.jpeg', 'https://www.ambushdesign.com', '日本のファッションブランド', '日本', 2008),
('Mastermind Japan', 'mastermind-japan', 'https://images.pexels.com/photos/1043492/pexels-photo-1043492.jpeg', 'https://www.mastermind-japan.com', '日本のストリートウェアブランド', '日本', 1997),
('Fragment Design', 'fragment-design', 'https://images.pexels.com/photos/1040902/pexels-photo-1040902.jpeg', 'https://www.fragment.jp', '日本のデザインブランド', '日本', 2003),
('Kapital', 'kapital', 'https://images.pexels.com/photos/1065104/pexels-photo-1065104.jpeg', 'https://www.kapital.jp', '日本のファッションブランド', '日本', 1984),
('Needles', 'needles', 'https://images.pexels.com/photos/1043493/pexels-photo-1043493.jpeg', 'https://www.needles.jp', '日本のファッションブランド', '日本', 1997);

-- Insert episodes (using celebrity IDs from above)
INSERT INTO episodes (celebrity_id, title, date, description, video_url, thumbnail_url, platform, duration_minutes, view_count) VALUES
((SELECT id FROM celebrities WHERE slug = 'ninomiya-kazunari'), 'よにの朝ごはん#1', '2024-01-15', '二宮和也の朝食ルーティンを紹介', 'https://youtube.com/watch?v=abc123', 'https://images.pexels.com/photos/1040903/pexels-photo-1040903.jpeg', 'youtube', 15, 250000),
((SELECT id FROM celebrities WHERE slug = 'hashimoto-ryo'), 'VS嵐#33', '2024-01-20', '橋本涼がゲスト出演したバラエティ番組', 'https://youtube.com/watch?v=def456', 'https://images.pexels.com/photos/1065105/pexels-photo-1065105.jpeg', 'tv', 60, 1200000),
((SELECT id FROM celebrities WHERE slug = 'tanaka-misaki'), '美咲の美容ルーティン', '2024-01-25', '田中美咲のスキンケア・メイクアップ', 'https://youtube.com/watch?v=ghi789', 'https://images.pexels.com/photos/1043494/pexels-photo-1043494.jpeg', 'youtube', 20, 180000),
((SELECT id FROM celebrities WHERE slug = 'sato-kenta'), 'ケンタのファッションチェック', '2024-02-01', '佐藤健太の今季おすすめコーディネート', 'https://youtube.com/watch?v=jkl012', 'https://images.pexels.com/photos/1040904/pexels-photo-1040904.jpeg', 'youtube', 25, 320000),
((SELECT id FROM celebrities WHERE slug = 'yamada-hanako'), '花子の一日密着', '2024-02-05', '山田花子のライフスタイル密着動画', 'https://youtube.com/watch?v=mno345', 'https://images.pexels.com/photos/1065106/pexels-photo-1065106.jpeg', 'youtube', 30, 450000),
((SELECT id FROM celebrities WHERE slug = 'suzuki-ichiro'), '一郎のお笑いライブ', '2024-02-10', '鈴木一郎の単独ライブの様子', 'https://youtube.com/watch?v=pqr678', 'https://images.pexels.com/photos/1043495/pexels-photo-1043495.jpeg', 'youtube', 45, 280000),
((SELECT id FROM celebrities WHERE slug = 'takahashi-miho'), '美穂のファッションウィーク', '2024-02-15', '高橋美穂のパリファッションウィーク', 'https://youtube.com/watch?v=stu901', 'https://images.pexels.com/photos/1040905/pexels-photo-1040905.jpeg', 'youtube', 35, 520000),
((SELECT id FROM celebrities WHERE slug = 'ito-daisuke'), '大輔のゲーム実況', '2024-02-20', '伊藤大輔の最新ゲーム実況', 'https://youtube.com/watch?v=vwx234', 'https://images.pexels.com/photos/1065107/pexels-photo-1065107.jpeg', 'youtube', 90, 680000),
((SELECT id FROM celebrities WHERE slug = 'watanabe-sakura'), 'さくらの歌ってみた', '2024-02-25', '渡辺さくらの人気楽曲カバー', 'https://youtube.com/watch?v=yza567', 'https://images.pexels.com/photos/1043496/pexels-photo-1043496.jpeg', 'youtube', 5, 920000),
((SELECT id FROM celebrities WHERE slug = 'nakamura-shota'), '翔太のダンスレッスン', '2024-03-01', '中村翔太のダンス基礎講座', 'https://youtube.com/watch?v=bcd890', 'https://images.pexels.com/photos/1040906/pexels-photo-1040906.jpeg', 'youtube', 40, 380000),
((SELECT id FROM celebrities WHERE slug = 'kobayashi-ai'), '愛のグルメ探訪', '2024-03-05', '小林愛の東京グルメ巡り', 'https://youtube.com/watch?v=efg123', 'https://images.pexels.com/photos/1065108/pexels-photo-1065108.jpeg', 'youtube', 25, 420000),
((SELECT id FROM celebrities WHERE slug = 'kato-yudai'), '雄大のトレーニング', '2024-03-10', '加藤雄大の筋トレルーティン', 'https://youtube.com/watch?v=hij456', 'https://images.pexels.com/photos/1043497/pexels-photo-1043497.jpeg', 'youtube', 30, 350000),
((SELECT id FROM celebrities WHERE slug = 'matsumoto-reina'), '麗奈のコスメレビュー', '2024-03-15', '松本麗奈の新作コスメレビュー', 'https://youtube.com/watch?v=klm789', 'https://images.pexels.com/photos/1040907/pexels-photo-1040907.jpeg', 'youtube', 20, 480000),
((SELECT id FROM celebrities WHERE slug = 'morita-takuya'), '拓也の沖縄旅行', '2024-03-20', '森田拓也の沖縄旅行記', 'https://youtube.com/watch?v=nop012', 'https://images.pexels.com/photos/1065109/pexels-photo-1065109.jpeg', 'youtube', 50, 620000),
((SELECT id FROM celebrities WHERE slug = 'shimizu-miyu'), '美優のペット紹介', '2024-03-25', '清水美優の愛犬紹介動画', 'https://youtube.com/watch?v=qrs345', 'https://images.pexels.com/photos/1043498/pexels-photo-1043498.jpeg', 'youtube', 15, 290000),
((SELECT id FROM celebrities WHERE slug = 'fujita-kazuya'), '和也のガジェット紹介', '2024-03-30', '藤田和也の最新ガジェットレビュー', 'https://youtube.com/watch?v=tuv678', 'https://images.pexels.com/photos/1040908/pexels-photo-1040908.jpeg', 'youtube', 35, 410000),
((SELECT id FROM celebrities WHERE slug = 'okada-mari'), '真理のDIY講座', '2024-04-01', '岡田真理の簡単DIY講座', 'https://youtube.com/watch?v=wxy901', 'https://images.pexels.com/photos/1065110/pexels-photo-1065110.jpeg', 'youtube', 45, 320000),
((SELECT id FROM celebrities WHERE slug = 'ishikawa-daiki'), '大樹のキャンプ', '2024-04-05', '石川大樹のソロキャンプ動画', 'https://youtube.com/watch?v=zab234', 'https://images.pexels.com/photos/1043499/pexels-photo-1043499.jpeg', 'youtube', 60, 580000),
((SELECT id FROM celebrities WHERE slug = 'murakami-ayaka'), '彩香のヨガレッスン', '2024-04-10', '村上彩香の朝ヨガルーティン', 'https://youtube.com/watch?v=cde567', 'https://images.pexels.com/photos/1040909/pexels-photo-1040909.jpeg', 'youtube', 30, 380000),
((SELECT id FROM celebrities WHERE slug = 'hasegawa-jun'), '純のビジネス講座', '2024-04-15', '長谷川純の起業ノウハウ', 'https://youtube.com/watch?v=fgh890', 'https://images.pexels.com/photos/1065111/pexels-photo-1065111.jpeg', 'youtube', 40, 220000),
((SELECT id FROM celebrities WHERE slug = 'noguchi-chinatsu'), '千夏のアート制作', '2024-04-20', '野口千夏の絵画制作過程', 'https://youtube.com/watch?v=ijk123', 'https://images.pexels.com/photos/1043500/pexels-photo-1043500.jpeg', 'youtube', 55, 180000),
((SELECT id FROM celebrities WHERE slug = 'miura-ken'), '健の音楽制作', '2024-04-25', '三浦健の楽曲制作の裏側', 'https://youtube.com/watch?v=lmn456', 'https://images.pexels.com/photos/1040910/pexels-photo-1040910.jpeg', 'youtube', 35, 450000),
((SELECT id FROM celebrities WHERE slug = 'yasuda-misaki'), '美咲のダンス練習', '2024-04-30', '安田美咲のダンス練習風景', 'https://youtube.com/watch?v=opq789', 'https://images.pexels.com/photos/1065112/pexels-photo-1065112.jpeg', 'youtube', 25, 320000),
((SELECT id FROM celebrities WHERE slug = 'ikeda-takashi'), '隆の写真撮影', '2024-05-01', '池田隆の街角スナップ撮影', 'https://youtube.com/watch?v=rst012', 'https://images.pexels.com/photos/1043501/pexels-photo-1043501.jpeg', 'youtube', 40, 280000),
((SELECT id FROM celebrities WHERE slug = 'nishimura-yuko'), '優子の料理教室', '2024-05-05', '西村優子の家庭料理レシピ', 'https://youtube.com/watch?v=uvw345', 'https://images.pexels.com/photos/1040911/pexels-photo-1040911.jpeg', 'youtube', 30, 520000),
((SELECT id FROM celebrities WHERE slug = 'ohno-tomoya'), '智也のエンタメ情報', '2024-05-10', '大野智也の最新エンタメニュース', 'https://youtube.com/watch?v=xyz678', 'https://images.pexels.com/photos/1065113/pexels-photo-1065113.jpeg', 'youtube', 20, 380000),
((SELECT id FROM celebrities WHERE slug = 'hirata-mai'), '麻衣のコーデ紹介', '2024-05-15', '平田麻衣の春夏コーディネート', 'https://youtube.com/watch?v=abc901', 'https://images.pexels.com/photos/1043502/pexels-photo-1043502.jpeg', 'youtube', 25, 420000),
((SELECT id FROM celebrities WHERE slug = 'sakamoto-naoki'), '直樹のゲーム攻略', '2024-05-20', '坂本直樹の人気ゲーム攻略法', 'https://youtube.com/watch?v=def234', 'https://images.pexels.com/photos/1040912/pexels-photo-1040912.jpeg', 'youtube', 50, 680000),
((SELECT id FROM celebrities WHERE slug = 'uchida-saori'), '沙織のライフハック', '2024-05-25', '内田沙織の生活の知恵', 'https://youtube.com/watch?v=ghi567', 'https://images.pexels.com/photos/1065114/pexels-photo-1065114.jpeg', 'youtube', 15, 290000),
((SELECT id FROM celebrities WHERE slug = 'yoshida-koji'), '浩二の投資講座', '2024-05-30', '吉田浩二の投資入門講座', 'https://youtube.com/watch?v=jkl890', 'https://images.pexels.com/photos/1043503/pexels-photo-1043503.jpeg', 'youtube', 45, 350000),
((SELECT id FROM celebrities WHERE slug = 'kono-miho'), '美穂の海外旅行', '2024-06-01', '河野美穂のヨーロッパ旅行記', 'https://youtube.com/watch?v=mno123', 'https://images.pexels.com/photos/1040913/pexels-photo-1040913.jpeg', 'youtube', 60, 720000),
((SELECT id FROM celebrities WHERE slug = 'kimura-takuya'), '拓哉のトーク番組', '2024-06-05', '木村拓哉のゲスト出演番組', 'https://youtube.com/watch?v=pqr456', 'https://images.pexels.com/photos/1065115/pexels-photo-1065115.jpeg', 'tv', 90, 1500000),
((SELECT id FROM celebrities WHERE slug = 'saito-manami'), '愛美のメイク講座', '2024-06-10', '斉藤愛美のプロメイク技術', 'https://youtube.com/watch?v=stu789', 'https://images.pexels.com/photos/1043504/pexels-photo-1043504.jpeg', 'youtube', 35, 480000);

-- Insert items (using celebrity, brand, and episode IDs from above)
INSERT INTO items (episode_id, name, brand_id, affiliate_url, image_url, price, category, subcategory, currency, description, color, size, material, is_available) VALUES
((SELECT id FROM episodes WHERE title = 'よにの朝ごはん#1'), 'オーバーサイズTシャツ', (SELECT id FROM brands WHERE slug = 'gucci'), 'https://amazon.co.jp/dp/B08ABCD123', 'https://images.pexels.com/photos/1040914/pexels-photo-1040914.jpeg', 45000, 'clothing', 'トップス', 'JPY', 'GUCCIのロゴ入りオーバーサイズTシャツ', 'ブラック', 'M', 'コットン100%', true),
((SELECT id FROM episodes WHERE title = 'VS嵐#33'), 'デニムジャケット', (SELECT id FROM brands WHERE slug = 'supreme'), 'https://amazon.co.jp/dp/B08EFGH456', 'https://images.pexels.com/photos/1065116/pexels-photo-1065116.jpeg', 32000, 'clothing', 'アウター', 'JPY', 'Supremeのヴィンテージデニムジャケット', 'インディゴ', 'L', 'デニム', true),
((SELECT id FROM episodes WHERE title = '美咲の美容ルーティン'), 'リップスティック', (SELECT id FROM brands WHERE slug = 'chanel'), 'https://amazon.co.jp/dp/B08IJKL789', 'https://images.pexels.com/photos/1043505/pexels-photo-1043505.jpeg', 4800, 'cosmetics', 'リップ', 'JPY', 'CHANELの人気リップスティック', 'レッド', '', '', true),
((SELECT id FROM episodes WHERE title = 'ケンタのファッションチェック'), 'スニーカー', (SELECT id FROM brands WHERE slug = 'nike'), 'https://amazon.co.jp/dp/B08MNO012', 'https://images.pexels.com/photos/1040915/pexels-photo-1040915.jpeg', 18000, 'shoes', 'スニーカー', 'JPY', 'Nike Air Force 1 限定カラー', 'ホワイト', '27.0cm', 'レザー', true),
((SELECT id FROM episodes WHERE title = '花子の一日密着'), 'トートバッグ', (SELECT id FROM brands WHERE slug = 'louis-vuitton'), 'https://amazon.co.jp/dp/B08PQR345', 'https://images.pexels.com/photos/1065117/pexels-photo-1065117.jpeg', 180000, 'bag', 'トートバッグ', 'JPY', 'Louis Vuittonのモノグラムトートバッグ', 'ブラウン', '', 'レザー', true),
((SELECT id FROM episodes WHERE title = '一郎のお笑いライブ'), 'カジュアルシャツ', (SELECT id FROM brands WHERE slug = 'uniqlo'), 'https://amazon.co.jp/dp/B08STU678', 'https://images.pexels.com/photos/1043506/pexels-photo-1043506.jpeg', 3990, 'clothing', 'シャツ', 'JPY', 'UNIQLOのリネンブレンドシャツ', 'ネイビー', 'L', 'リネン混', true),
((SELECT id FROM episodes WHERE title = '美穂のファッションウィーク'), 'ハイヒール', (SELECT id FROM brands WHERE slug = 'prada'), 'https://amazon.co.jp/dp/B08VWX901', 'https://images.pexels.com/photos/1040916/pexels-photo-1040916.jpeg', 95000, 'shoes', 'ハイヒール', 'JPY', 'Pradaのポインテッドトゥパンプス', 'ブラック', '24.0cm', 'レザー', true),
((SELECT id FROM episodes WHERE title = '大輔のゲーム実況'), 'ゲーミングヘッドセット', (SELECT id FROM brands WHERE slug = 'nike'), 'https://amazon.co.jp/dp/B08YZA234', 'https://images.pexels.com/photos/1065118/pexels-photo-1065118.jpeg', 25000, 'accessory', 'ヘッドセット', 'JPY', '高音質ゲーミングヘッドセット', 'ブラック', '', 'プラスチック', true),
((SELECT id FROM episodes WHERE title = 'さくらの歌ってみた'), 'ワンピース', (SELECT id FROM brands WHERE slug = 'zara'), 'https://amazon.co.jp/dp/B08BCD567', 'https://images.pexels.com/photos/1043507/pexels-photo-1043507.jpeg', 8990, 'clothing', 'ワンピース', 'JPY', 'ZARAのフローラルワンピース', 'ピンク', 'S', 'ポリエステル', true),
((SELECT id FROM episodes WHERE title = '翔太のダンスレッスン'), 'ダンスシューズ', (SELECT id FROM brands WHERE slug = 'adidas'), 'https://amazon.co.jp/dp/B08EFG890', 'https://images.pexels.com/photos/1040917/pexels-photo-1040917.jpeg', 12000, 'shoes', 'ダンスシューズ', 'JPY', 'adidasのダンス専用シューズ', 'ホワイト', '26.5cm', 'メッシュ', true),
((SELECT id FROM episodes WHERE title = '愛のグルメ探訪'), 'エプロン', (SELECT id FROM brands WHERE slug = 'hm'), 'https://amazon.co.jp/dp/B08HIJ123', 'https://images.pexels.com/photos/1065119/pexels-photo-1065119.jpeg', 2990, 'accessory', 'エプロン', 'JPY', 'H&Mのおしゃれなキッチンエプロン', 'ベージュ', '', 'コットン', true),
((SELECT id FROM episodes WHERE title = '雄大のトレーニング'), 'トレーニングウェア', (SELECT id FROM brands WHERE slug = 'nike'), 'https://amazon.co.jp/dp/B08KLM456', 'https://images.pexels.com/photos/1043508/pexels-photo-1043508.jpeg', 8500, 'clothing', 'スポーツウェア', 'JPY', 'Nike Dri-FITトレーニングシャツ', 'グレー', 'M', 'ポリエステル', true),
((SELECT id FROM episodes WHERE title = '麗奈のコスメレビュー'), 'アイシャドウパレット', (SELECT id FROM brands WHERE slug = 'dior'), 'https://amazon.co.jp/dp/B08NOP789', 'https://images.pexels.com/photos/1040918/pexels-photo-1040918.jpeg', 7200, 'cosmetics', 'アイメイク', 'JPY', 'Diorの5色アイシャドウパレット', 'ブラウン系', '', '', true),
((SELECT id FROM episodes WHERE title = '拓也の沖縄旅行'), 'サングラス', (SELECT id FROM brands WHERE slug = 'gucci'), 'https://amazon.co.jp/dp/B08QRS012', 'https://images.pexels.com/photos/1065120/pexels-photo-1065120.jpeg', 38000, 'accessory', 'サングラス', 'JPY', 'GUCCIのアビエーターサングラス', 'ゴールド', '', 'メタル', true),
((SELECT id FROM episodes WHERE title = '美優のペット紹介'), 'ペット用品', (SELECT id FROM brands WHERE slug = 'uniqlo'), 'https://amazon.co.jp/dp/B08TUV345', 'https://images.pexels.com/photos/1043509/pexels-photo-1043509.jpeg', 1500, 'other', 'ペット用品', 'JPY', '犬用おもちゃ', 'レッド', '', 'ゴム', true),
((SELECT id FROM episodes WHERE title = '和也のガジェット紹介'), 'スマートウォッチ', (SELECT id FROM brands WHERE slug = 'nike'), 'https://amazon.co.jp/dp/B08WXY678', 'https://images.pexels.com/photos/1040919/pexels-photo-1040919.jpeg', 45000, 'accessory', 'スマートウォッチ', 'JPY', '最新スマートウォッチ', 'ブラック', '', 'アルミニウム', true),
((SELECT id FROM episodes WHERE title = '真理のDIY講座'), 'ワークエプロン', (SELECT id FROM brands WHERE slug = 'uniqlo'), 'https://amazon.co.jp/dp/B08ZAB901', 'https://images.pexels.com/photos/1065121/pexels-photo-1065121.jpeg', 2490, 'accessory', 'エプロン', 'JPY', 'UNIQLOのワーク用エプロン', 'カーキ', '', 'デニム', true),
((SELECT id FROM episodes WHERE title = '大樹のキャンプ'), 'アウトドアジャケット', (SELECT id FROM brands WHERE slug = 'stone-island'), 'https://amazon.co.jp/dp/B08CDE234', 'https://images.pexels.com/photos/1043510/pexels-photo-1043510.jpeg', 65000, 'clothing', 'アウター', 'JPY', 'Stone Islandの防水ジャケット', 'オリーブ', 'L', 'ナイロン', true),
((SELECT id FROM episodes WHERE title = '彩香のヨガレッスン'), 'ヨガウェア', (SELECT id FROM brands WHERE slug = 'adidas'), 'https://amazon.co.jp/dp/B08FGH567', 'https://images.pexels.com/photos/1040920/pexels-photo-1040920.jpeg', 6800, 'clothing', 'スポーツウェア', 'JPY', 'adidasのヨガレギンス', 'ブラック', 'M', 'ストレッチ素材', true),
((SELECT id FROM episodes WHERE title = '純のビジネス講座'), 'ビジネススーツ', (SELECT id FROM brands WHERE slug = 'zara'), 'https://amazon.co.jp/dp/B08IJK890', 'https://images.pexels.com/photos/1065122/pexels-photo-1065122.jpeg', 29900, 'clothing', 'スーツ', 'JPY', 'ZARAのスリムフィットスーツ', 'ネイビー', 'M', 'ウール混', true),
((SELECT id FROM episodes WHERE title = '千夏のアート制作'), 'アーティストエプロン', (SELECT id FROM brands WHERE slug = 'comme-des-garcons'), 'https://amazon.co.jp/dp/B08LMN123', 'https://images.pexels.com/photos/1043511/pexels-photo-1043511.jpeg', 15000, 'accessory', 'エプロン', 'JPY', 'Comme des Garçonsのアートエプロン', 'ブラック', '', 'キャンバス', true),
((SELECT id FROM episodes WHERE title = '健の音楽制作'), 'ヘッドフォン', (SELECT id FROM brands WHERE slug = 'nike'), 'https://amazon.co.jp/dp/B08OPQ456', 'https://images.pexels.com/photos/1040921/pexels-photo-1040921.jpeg', 35000, 'accessory', 'ヘッドフォン', 'JPY', 'プロ仕様モニターヘッドフォン', 'ブラック', '', 'プラスチック', true),
((SELECT id FROM episodes WHERE title = '美咲のダンス練習'), 'ダンス用トップス', (SELECT id FROM brands WHERE slug = 'nike'), 'https://amazon.co.jp/dp/B08RST789', 'https://images.pexels.com/photos/1065123/pexels-photo-1065123.jpeg', 4500, 'clothing', 'トップス', 'JPY', 'Nike Dri-FITダンス用トップス', 'ピンク', 'S', 'ポリエステル', true),
((SELECT id FROM episodes WHERE title = '隆の写真撮影'), 'カメラストラップ', (SELECT id FROM brands WHERE slug = 'louis-vuitton'), 'https://amazon.co.jp/dp/B08UVW012', 'https://images.pexels.com/photos/1043512/pexels-photo-1043512.jpeg', 25000, 'accessory', 'カメラアクセサリー', 'JPY', 'Louis Vuittonのレザーカメラストラップ', 'ブラウン', '', 'レザー', true),
((SELECT id FROM episodes WHERE title = '優子の料理教室'), '料理用エプロン', (SELECT id FROM brands WHERE slug = 'hermes'), 'https://amazon.co.jp/dp/B08XYZ345', 'https://images.pexels.com/photos/1040922/pexels-photo-1040922.jpeg', 45000, 'accessory', 'エプロン', 'JPY', 'Hermèsの高級料理用エプロン', 'ホワイト', '', 'リネン', true),
((SELECT id FROM episodes WHERE title = '智也のエンタメ情報'), 'カジュアルジャケット', (SELECT id FROM brands WHERE slug = 'balenciaga'), 'https://amazon.co.jp/dp/B08ABC678', 'https://images.pexels.com/photos/1065124/pexels-photo-1065124.jpeg', 120000, 'clothing', 'アウター', 'JPY', 'Balenciagaのオーバーサイズジャケット', 'ブラック', 'L', 'ウール', true),
((SELECT id FROM episodes WHERE title = '麻衣のコーデ紹介'), 'スカート', (SELECT id FROM brands WHERE slug = 'prada'), 'https://amazon.co.jp/dp/B08DEF901', 'https://images.pexels.com/photos/1043513/pexels-photo-1043513.jpeg', 85000, 'clothing', 'ボトムス', 'JPY', 'Pradaのプリーツスカート', 'ベージュ', 'S', 'シルク', true),
((SELECT id FROM episodes WHERE title = '直樹のゲーム攻略'), 'ゲーミングキーボード', (SELECT id FROM brands WHERE slug = 'nike'), 'https://amazon.co.jp/dp/B08GHI234', 'https://images.pexels.com/photos/1040923/pexels-photo-1040923.jpeg', 18000, 'accessory', 'ゲーミング機器', 'JPY', 'メカニカルゲーミングキーボード', 'ブラック', '', 'プラスチック', true),
((SELECT id FROM episodes WHERE title = '沙織のライフハック'), 'オーガナイザーバッグ', (SELECT id FROM brands WHERE slug = 'uniqlo'), 'https://amazon.co.jp/dp/B08JKL567', 'https://images.pexels.com/photos/1065125/pexels-photo-1065125.jpeg', 3990, 'bag', 'ハンドバッグ', 'JPY', 'UNIQLOの多機能オーガナイザーバッグ', 'グレー', '', 'ナイロン', true),
((SELECT id FROM episodes WHERE title = '浩二の投資講座'), 'ビジネスシャツ', (SELECT id FROM brands WHERE slug = 'zara'), 'https://amazon.co.jp/dp/B08MNO890', 'https://images.pexels.com/photos/1043514/pexels-photo-1043514.jpeg', 5990, 'clothing', 'シャツ', 'JPY', 'ZARAのノンアイロンシャツ', 'ホワイト', 'M', 'コットン混', true),
((SELECT id FROM episodes WHERE title = '美穂の海外旅行'), 'トラベルバッグ', (SELECT id FROM brands WHERE slug = 'louis-vuitton'), 'https://amazon.co.jp/dp/B08PQR123', 'https://images.pexels.com/photos/1040924/pexels-photo-1040924.jpeg', 220000, 'bag', 'トラベルバッグ', 'JPY', 'Louis Vuittonのキャリーオンバッグ', 'ブラウン', '', 'レザー', true),
((SELECT id FROM episodes WHERE title = '拓哉のトーク番組'), 'ドレスシューズ', (SELECT id FROM brands WHERE slug = 'gucci'), 'https://amazon.co.jp/dp/B08STU456', 'https://images.pexels.com/photos/1065126/pexels-photo-1065126.jpeg', 95000, 'shoes', 'ドレスシューズ', 'JPY', 'GUCCIのレザードレスシューズ', 'ブラック', '26.0cm', 'レザー', true),
((SELECT id FROM episodes WHERE title = '愛美のメイク講座'), 'ファンデーション', (SELECT id FROM brands WHERE slug = 'chanel'), 'https://amazon.co.jp/dp/B08VWX789', 'https://images.pexels.com/photos/1043515/pexels-photo-1043515.jpeg', 6800, 'cosmetics', 'ベースメイク', 'JPY', 'CHANELのリキッドファンデーション', 'ベージュ', '', '', true);