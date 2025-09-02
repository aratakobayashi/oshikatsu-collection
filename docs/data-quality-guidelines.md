# 🏆 推し活コレクション データ品質ガイドライン

## 概要
Season1-4の完全データベース化作業で学んだベストプラクティスをまとめたガイドライン。Season5以降の新規エピソード追加時に同じ過ちを繰り返さないための必須チェックリスト。

---

## 📋 新規エピソード追加時のチェックリスト

### 1. 事前検証（必須）
```bash
# エピソード情報の確認
- [ ] エピソードタイトルから正確なエリア情報を抽出
- [ ] エピソードタイトルから料理ジャンルを確認
- [ ] 実際の放送内容または信頼できる情報源で店舗名を確認
```

### 2. ロケ地データ検証（必須）
```bash
- [ ] 店舗名がエピソード内容と完全一致
- [ ] 住所がエピソードタイトルのエリアと完全一致
- [ ] 料理ジャンルがエピソード内容と一致
- [ ] タベログURLが実際にその店舗を指している
```

### 3. タベログURL検証（必須）
```bash
- [ ] URLにアクセスして店舗名を確認
- [ ] URLの住所がエピソードエリアと一致
- [ ] 料理ジャンルがエピソード内容と一致
- [ ] 営業状況（営業中/閉店/移転）を確認
```

---

## 🚨 過去の重大エラーパターンと対策

### エラーパターン1: 完全に違う店舗
**例**: Season4 Episode2「中央区銀座」→ 五反田みやこ食堂（品川区五反田）

**対策**:
- エピソードタイトルと店舗の場所を必ず照合
- 区レベル・市レベルでの不一致は即座に要調査
- 県レベルでの不一致は絶対NG

### エラーパターン2: 同名別店舗
**例**: Season2 Episode1「川崎市新丸子」→ だるま東陽店（江東区）

**対策**:
- 店舗名が一致していても住所を必ず確認
- チェーン店の場合は支店名まで正確に特定
- タベログURLで実際の場所を確認

### エラーパターン3: 料理ジャンル不一致
**例**: Season3 Episode12「いわしのユッケとにぎり寿司」→ 沖縄そば やんばる

**対策**:
- エピソードの料理内容と店舗ジャンルを照合
- 寿司エピソードに沖縄料理店は絶対NG
- 専門店の場合は特に注意深く確認

---

## ✅ データ追加の正しい手順

### Step 1: エピソード分析
```typescript
// 1. エピソード情報の抽出
const episodeInfo = {
  title: "孤独のグルメ Season5 第X話「○○区××の△△料理」",
  expectedArea: "○○区××", // タイトルから抽出
  expectedCuisine: "△△料理", // タイトルから抽出
  broadcastDate: "YYYY-MM-DD"
}
```

### Step 2: 店舗情報の調査
```typescript
// 2. 正確な店舗情報の取得
const restaurantInfo = {
  name: "正確な店舗名",
  address: "完全な住所（郵便番号含む）",
  area: "住所から抽出したエリア",
  cuisineType: "実際の料理ジャンル",
  tabelogUrl: "正しいタベログURL",
  businessStatus: "営業中|閉店|移転"
}
```

### Step 3: 一致性チェック
```typescript
// 3. 必須検証項目
const validationChecks = {
  areaMatch: episodeInfo.expectedArea === restaurantInfo.area, // 必須
  cuisineMatch: episodeInfo.expectedCuisine.includes(restaurantInfo.cuisineType), // 必須
  tabelogUrlValid: await verifyTabelogUrl(restaurantInfo.tabelogUrl), // 必須
  businessStatusConfirmed: restaurantInfo.businessStatus !== "unknown" // 推奨
}

// 全てtrueでない限り追加禁止
if (!Object.values(validationChecks).every(Boolean)) {
  throw new Error("Validation failed - further investigation required")
}
```

---

## 🛠️ 推奨ツールとスクリプト

### 新規エピソード追加スクリプトテンプレート
```bash
# scripts/add-season5-episodeX-[restaurant-name].ts を作成
npx tsx scripts/add-season5-episodeX-[restaurant-name].ts
```

### データ検証スクリプト
```bash
# 追加後の検証
npx tsx scripts/verify-season5-data-quality.ts
```

### LinkSwitch設定
```typescript
const affiliateInfo = {
  linkswitch: {
    status: 'active', // 営業中の場合
    original_url: correctTabelogUrl,
    last_verified: new Date().toISOString(),
    episode: 'Season5 EpisodeX',
    verification_method: 'manual_research_verified'
  },
  restaurant_info: {
    verification_status: 'verified_new_addition',
    data_source: 'accurate_manual_research',
    // ... 詳細情報
  }
}
```

---

## 🔍 信頼できる情報源

### 推奨情報源（優先順）
1. **公式放送内容** - 最も信頼できる
2. **タベログ実際のページ** - 店舗情報の確認
3. **Googleマップ/ストリートビュー** - 場所の確認
4. **専門サイト** - 孤独のグルメファンサイト等
5. **SNS投稿** - ロケ地巡礼の投稿（要複数確認）

### 避けるべき情報源
- **未検証のブログ記事** - 間違い情報が多い
- **自動生成サイト** - 不正確な場合が多い
- **古い情報** - 閉店・移転の可能性

---

## 📊 品質指標とKPI

### 必達目標
- **エリア一致率**: 100%（県・市・区レベル）
- **料理ジャンル一致率**: 100%
- **タベログURL正確性**: 100%
- **LinkSwitch有効化率**: 営業中店舗100%

### 品質チェック項目
```typescript
interface QualityMetrics {
  areaAccuracy: number;        // 100% 必須
  cuisineAccuracy: number;     // 100% 必須
  urlValidity: number;         // 100% 必須
  businessStatusAccuracy: number; // 95% 以上
  linkSwitchOptimization: number; // 営業中100%
}
```

---

## 🚀 Season5以降の追加プロセス

### Phase 1: 事前調査
1. 全エピソードリストの作成
2. 各エピソードの店舗情報調査
3. タベログURL確認とブックマーク

### Phase 2: データ追加
1. エピソードごとの個別スクリプト作成
2. 段階的な追加（5話ずつ推奨）
3. 各段階での品質チェック

### Phase 3: 検証・最適化
1. 全エピソードデータ検証
2. LinkSwitch最適化
3. 収益化率確認

---

## 🔄 継続的品質改善

### 月次チェック項目
- [ ] 新規追加データの品質確認
- [ ] 既存データの営業状況更新
- [ ] LinkSwitch有効性確認
- [ ] 収益化パフォーマンス分析

### 問題発見時の対応
1. **即座に修正スクリプト作成**
2. **影響範囲の調査**
3. **再発防止策の検討**
4. **ガイドライン更新**

---

## 📚 参考スクリプト例

### Season5 Episode1 追加例
```typescript
// scripts/add-season5-episode1-example.ts
const season5Episode1Data = {
  name: '実際の店舗名',
  slug: 'restaurant-name-season5-ep1',
  address: '正確な住所',
  description: 'エピソード内容と一致する説明文',
  tabelog_url: '検証済みタベログURL',
  affiliate_info: {
    linkswitch: {
      status: 'active',
      verification_method: 'guidelines_compliant'
    }
  }
}
```

---

## 🎯 まとめ

このガイドラインに従うことで：
- ✅ Season1-4で発生した問題の再発防止
- ✅ 高品質なデータベース維持
- ✅ 効率的な新規データ追加
- ✅ 継続的な収益最適化

**重要**: 疑問があれば追加を急がず、必ず再調査を行う。品質 > スピード。

---

*最終更新: 2025-08-30*  
*作成者: Claude Code Assistant*  
*基準: Season1-4完全データベース化プロジェクト*