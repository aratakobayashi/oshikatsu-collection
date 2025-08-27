# 推し活コンテンツクラスター戦略

## 🎯 基本戦略: 2サイト連携によるSEOドミナンス

### サイト役割分担
**oshikatsu-guide.com (既存WordPress)**
- ハウツー・ガイド記事 (入り口)
- 推し活体験談・ノウハウ
- ターゲットKW: 「推し活 始め方」「聖地巡礼 コツ」等

**collection.oshikatsu-guide.com (Reactアプリ)**  
- 具体的データベース (目的達成)
- ロケ地・アイテム・推し情報
- ターゲットKW: 「[推し名] ロケ地」「[作品名] 撮影場所」等

## 📊 推奨コンテンツクラスター構成

### Cluster 1: 聖地巡礼マスタークラスター
**ピラーページ**: `oshikatsu-guide.com/pilgrimage-complete-guide`
```
🏛️ 聖地巡礼完全ガイド (4000-6000字)
├─ 📍 初心者向け聖地巡礼の始め方
├─ 🚃 効率的な巡礼ルートの作り方  
├─ 📷 聖地での撮影マナー・コツ
├─ 💰 聖地巡礼の予算管理術
├─ 📱 おすすめ聖地巡礼アプリ・ツール
└─ 🎯 collection.oshikatsu-guide.com/locations (実際の場所データ)
```

### Cluster 2: 私服特定マスタークラスター  
**ピラーページ**: `oshikatsu-guide.com/fashion-tracking-guide`
```
🏛️ 推しの私服特定完全ガイド
├─ 👗 私服特定の基本テクニック
├─ 🔍 ブランド特定のコツ・ツール
├─ 💳 推し服の賢い購入方法
├─ 📸 着用写真の分析方法
└─ 🎯 collection.oshikatsu-guide.com/items (実際のアイテムDB)
```

### Cluster 3: 推し活情報収集クラスター
**ピラーページ**: `oshikatsu-guide.com/oshi-info-collection`
```
🏛️ 推し活情報収集の極意
├─ 📱 SNS情報収集テクニック
├─ 📺 出演情報の効率的な追い方
├─ 🎪 イベント情報の見逃さない方法
├─ 📰 メディア出演チェック術
└─ 🎯 collection.oshikatsu-guide.com/celebrities (推しデータベース)
```

## 🔗 内部リンク戦略

### WordPressブログ → Reactアプリ
```html
<!-- 記事内での自然なリンク挿入例 -->
<p>聖地巡礼のコツを覚えたら、実際に
<a href="https://collection.oshikatsu-guide.com/locations?search=カフェ">
推しが訪れたカフェ一覧</a>をチェックしてみましょう。</p>

<p>私服特定で見つけたアイテムは
<a href="https://collection.oshikatsu-guide.com/items">
推し活コレクション</a>で同じものを探している人と情報交換できます。</p>
```

### Reactアプリ → WordPressブログ  
```typescript
// 関連記事として表示
const relatedGuideLinks = [
  {
    title: "聖地巡礼初心者ガイド", 
    url: "https://oshikatsu-guide.com/beginner-pilgrimage-guide",
    description: "初めての聖地巡礼で知っておくべき基本マナー"
  },
  {
    title: "私服特定テクニック集",
    url: "https://oshikatsu-guide.com/fashion-identification-tips", 
    description: "推しの服をより正確に特定するための実践的コツ"
  }
]
```

## 📈 SEO効果測定指標

### 流入経路の最適化
1. **検索流入** → WordPressブログ (ハウツー記事)
2. **目的達成** → Reactアプリ (具体的データ)
3. **深い学習** → WordPressブログ (詳細ガイド)
4. **実行・実践** → Reactアプリ (実際の場所・アイテム)

### KPI設定例
- **WordPressブログ**: セッション時間、回遊率、コレクションへの送客数
- **Reactアプリ**: データベース利用率、ブログへの参照数、ユーザー定着率

## 🚀 実装優先順位

### Phase 1: 基本リンク設置 (1週間)
- [ ] WordPress記事内にコレクションへのリンク追加
- [ ] コレクション内にガイド記事への導線設置
- [ ] 関連コンテンツウィジェット作成

### Phase 2: コンテンツ拡充 (2-4週間)  
- [ ] 聖地巡礼ガイド記事作成・最適化
- [ ] 私服特定ガイド記事作成・最適化
- [ ] 各クラスターページの内部リンク網整備

### Phase 3: 高度化 (1-2ヶ月)
- [ ] 動的コンテンツ推薦システム
- [ ] ユーザー行動に基づく最適化
- [ ] A/Bテストによるコンバージョン改善

## 💡 収益化との連携

### アフィリエイト戦略統合
**WordPressブログ**: 推し活グッズ・旅行関連の商品紹介
**Reactアプリ**: 具体的アイテムの購入導線 (既にValueCommerce実装済み)

この戦略により、検索順位とユーザー体験の両方を同時に向上させ、
推し活業界でのオーソリティを確立できます。