# バリューコマース食べログアフィリエイト統合ガイド

## プログラム情報
- **プログラム名**: 食べログ 飲食店ネット予約プログラム
- **プログラムID**: 2147651
- **提携状況**: 提携済み ✅
- **経由**: バリューコマース

## 実装完了項目

### ✅ データベース拡張
- `locations`テーブルに`tabelog_url`および`affiliate_info`フィールド追加
- マイグレーションファイル作成済み

### ✅ UI実装
- `LocationDetail`コンポーネントに食べログ予約ボタン追加
- クリックトラッキング機能実装

### ✅ 自動化ツール群
1. **データ分析ツール** (`scripts/analyze-locations-for-tabelog.ts`)
2. **バリューコマース変換ツール** (`src/scripts/valuecommerce-tabelog-converter.ts`)
3. **食べログ検索自動化ツール** (`src/scripts/tabelog-search-automation.ts`)
4. **統合管理ツール** (`src/scripts/tabelog-affiliate-manager.ts`)

## 運用フロー

### Phase 1: データベース準備
```bash
# 1. 本番環境でマイグレーション実行
# Supabaseダッシュボードで以下のSQLを実行:
```sql
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS tabelog_url TEXT,
ADD COLUMN IF NOT EXISTS affiliate_info JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_locations_tabelog_url ON public.locations(tabelog_url) WHERE tabelog_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_locations_affiliate_info ON public.locations USING GIN(affiliate_info);
```

### Phase 2: 対象店舗分析
```bash
# 2. 現在の状況を分析してCSVを生成
npx tsx scripts/analyze-locations-for-tabelog.ts

# 結果: 792件中190件(24%)が飲食店として検出
# 186件がアフィリエイトリンク設定の対象候補
```

### Phase 3: 食べログURL調査（3つの方法）

#### 方法A: 自動検索（推奨）
```bash
# 3A. Google検索APIを使用した自動URL発見
# .env.productionにGoogle APIキーを追加:
# GOOGLE_SEARCH_API_KEY=your_api_key
# GOOGLE_SEARCH_ENGINE_ID=your_engine_id

npx tsx src/scripts/tabelog-search-automation.ts --action search
```

#### 方法B: 手動調査
```bash
# 3B. CSVファイルを開いて手動でURLを調査
# tabelog-candidates.csvを確認し、各店舗の食べログURLを調査
```

#### 方法C: 既存URLからの抽出
```bash
# 3C. 既存のwebsite_urlに食べログURLがないかチェック
# （既に4件の食べログURLが登録済み）
```

### Phase 4: バリューコマースリンク生成

#### 重要: アフィリエイトリンク設定
バリューコマースの管理画面で以下を取得:
1. **サイトID (SID)**: あなたのサイト固有のID
2. **広告主コード (PID)**: 2147651（食べログプログラム）

#### リンク変換ツール設定
```typescript
// src/scripts/valuecommerce-tabelog-converter.ts の設定を更新
const sid = 'YOUR_ACTUAL_SID' // バリューコマースから取得したSIDに置き換え
const pid = '2147651' // 食べログプログラムID（固定）
```

### Phase 5: アフィリエイトリンク登録

#### サンプルデータでテスト
```bash
# 5A. テスト実行（SID設定後）
npx tsx src/scripts/valuecommerce-tabelog-converter.ts --action sample
```

#### CSVファイル形式でバルク登録
```bash
# 5B. affiliate-links.csvを作成してバルク登録
npx tsx src/scripts/valuecommerce-tabelog-converter.ts --action csv affiliate-links.csv
```

#### CSVファイル形式例:
```csv
location_id,location_name,tabelog_original_url,valuecommerce_affiliate_url,restaurant_id,notes
ff64c19e-e7d9-440a-88f7-0c97c358a8fb,"400℃ Pizza Tokyo 神楽坂店","https://tabelog.com/tokyo/A1309/A130905/13123456/","https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=YOUR_SID&pid=2147651&vc_url=https%3A//tabelog.com/tokyo/A1309/A130905/13123456/","13123456","人気のピザ店"
```

## 期待される成果

### 収益最適化
- **186店舗 × 平均クリック率3% × 平均成約率2% × 平均単価500円 = 月額約56,000円の収益機会**
- 実際の成果は店舗の人気度やエピソード視聴数により変動

### ユーザー体験向上
- 推し活スポット発見からそのまま予約まで一貫したUX
- ファンの行動促進による満足度向上

## モニタリングと最適化

### 1. パフォーマンス追跡
```bash
# アフィリエイトリンク一覧と設定状況確認
npx tsx src/scripts/tabelog-affiliate-manager.ts --action list

# クリック分析（将来実装）
npx tsx src/scripts/tabelog-affiliate-manager.ts --action analyze
```

### 2. A/Bテストの可能性
- ボタンデザインの最適化
- 配置位置の調整
- CTA文言の改善

### 3. 拡張計画
- 他の予約サイト（ぐるなび、ホットペッパー）への対応
- 宿泊施設のアフィリエイト（一休.com、じゃらん等）
- グッズ販売サイトのアフィリエイト

## 注意事項

### 法的コンプライアンス
- アフィリエイトリンクには必ず`rel="sponsored"`属性を付与
- 広告表示の義務に準拠
- プライバシーポリシーにアフィリエイトに関する記載を追加

### 技術的考慮事項
- リンク切れの定期チェック
- 店舗閉店時の対応
- バリューコマースの規約変更への対応

### API制限と費用
- Google検索API: 1日100クエリまで無料
- 大量検索時は有料プラン検討
- バリューコマース: 成果報酬のみ

## 次のアクションプラン

### 即座に実行可能（今日〜明日）
1. ✅ データベースマイグレーション実行
2. ✅ バリューコマースでSIDを確認・設定
3. ✅ テストデータでの動作確認

### 短期目標（1週間以内）
4. 🔄 Google検索APIキー取得と設定
5. 🔄 自動検索による食べログURL発見
6. 🔄 上位20-30店舗のアフィリエイトリンク設定

### 中期目標（1ヶ月以内）
7. 📋 全186店舗のアフィリエイトリンク設定完了
8. 📋 トラッキング機能の改善
9. 📋 成果測定とレポート機能

### 長期目標（3ヶ月以内）
10. 🚀 他アフィリエイトプログラムの検討・追加
11. 🚀 UI/UXの最適化
12. 🚀 自動化のさらなる改善

## サポートとトラブルシューティング

### よくある問題
1. **SIDが見つからない**: バリューコマースの「ツール」→「LinkSwitch」で確認
2. **リンクが動作しない**: URLエンコーディングの確認
3. **検索結果の精度が低い**: 検索クエリのチューニング

### 連絡先
- バリューコマースサポート: support@valuecommerce.co.jp
- 食べログ事業者向けサポート: 公式サイト参照

---

**🎯 目標: 月額5万円以上のアフィリエイト収益達成**
**📅 目標期限: 2025年9月末**