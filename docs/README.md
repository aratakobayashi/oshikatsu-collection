# 📚 推し活コレクション ドキュメント

## 概要
Season1-4の完全データベース化プロジェクトで得られた知見をまとめたドキュメント集です。今後Season5以降を追加する際の必須ガイドラインとツール集を提供します。

## 📁 ファイル構成

### 🏆 [data-quality-guidelines.md](./data-quality-guidelines.md)
新規エピソード追加時の**必須チェックリスト**とベストプラクティス

**内容:**
- ✅ 事前検証チェックリスト（必須）
- 🚨 過去の重大エラーパターンと対策
- ✅ データ追加の正しい手順
- 🛠️ 推奨ツールとスクリプト
- 🔍 信頼できる情報源
- 📊 品質指標とKPI

**使用タイミング:** Season5以降の新規エピソード追加作業前

### 🛠️ テンプレートスクリプト

#### [scripts/templates/add-season-episode-template.ts](../scripts/templates/add-season-episode-template.ts)
新規エピソード追加用のテンプレートスクリプト

**特徴:**
- 📋 事前検証チェックリスト内蔵
- 🚨 実行前強制検証
- ✅ データ品質保証機能
- 📝 詳細な入力項目説明

**使用方法:**
```bash
# 1. テンプレートをコピー
cp scripts/templates/add-season-episode-template.ts scripts/add-season5-episode1-restaurant-name.ts

# 2. 必要情報を正確に入力
# 3. PRE_VALIDATION_CHECKLISTを全てtrueに設定
# 4. 実行
npx tsx scripts/add-season5-episode1-restaurant-name.ts
```

#### [scripts/templates/verify-season-data-template.ts](../scripts/templates/verify-season-data-template.ts)
Season別データ品質検証用テンプレート

**特徴:**
- 📊 包括的品質チェック
- 🎯 Season1-4基準による評価
- 🔍 問題の重要度分析
- 📋 具体的修正提案

**使用方法:**
```bash
# 1. テンプレートをコピー
cp scripts/templates/verify-season-data-template.ts scripts/verify-season5-data.ts

# 2. SEASON_TO_VERIFYを設定
# 3. 実行
npx tsx scripts/verify-season5-data.ts
```

## 🚀 Season5以降追加の推奨ワークフロー

### Phase 1: 事前準備
1. **エピソードリスト作成**
   ```bash
   # Season5全エピソードの情報収集
   - 放送日
   - 正確なタイトル
   - エリア情報
   - 料理情報
   ```

2. **品質ガイドライン読了**
   ```bash
   # 必読ドキュメント
   - docs/data-quality-guidelines.md
   - Season1-4で発生した問題事例
   ```

### Phase 2: 段階的追加（推奨：5話ずつ）
```bash
# Episode 1-5追加
for i in {1..5}; do
  # 1. テンプレートコピー
  cp scripts/templates/add-season-episode-template.ts scripts/add-season5-episode$i-[restaurant].ts
  
  # 2. データ入力・検証
  # 3. 実行
  npx tsx scripts/add-season5-episode$i-[restaurant].ts
done

# 品質チェック
npx tsx scripts/verify-season5-data.ts
```

### Phase 3: 全体検証・最適化
```bash
# 全データ検証
npx tsx scripts/verify-season5-data.ts

# LinkSwitch最適化
npx tsx scripts/optimize-linkswitch-season5.ts

# 最終確認
npx tsx scripts/comprehensive-data-verification-season1-5.ts
```

## ⚠️ 重要な注意事項

### 🚨 絶対に避けるべきエラー

1. **エリア不一致** - Season1-4で最も多発した問題
   ```
   ❌ エピソード「渋谷区」→ 店舗住所「新宿区」
   ✅ 必ずエリア一致を確認
   ```

2. **料理ジャンル不一致** - 深刻な品質問題
   ```
   ❌ エピソード「寿司」→ 沖縄料理店
   ✅ 料理内容の完全一致確認
   ```

3. **間違ったタベログURL** - 収益に直接影響
   ```
   ❌ URLにアクセス確認せずに追加
   ✅ 実際にアクセスして店舗情報確認
   ```

### 💡 品質向上のコツ

1. **情報源の優先順位**
   ```
   1位: 実際の放送内容
   2位: 公式タベログページ
   3位: Googleマップ確認
   4位: 信頼できるファンサイト
   5位: SNS投稿（複数確認必要）
   ```

2. **疑問があれば追加しない**
   ```
   品質 > スピード
   間違ったデータの修正は追加の10倍の工数
   ```

3. **段階的アプローチ**
   ```
   5話ずつ追加 → 品質チェック → 修正 → 次の5話
   ```

## 📊 品質基準（Season1-4準拠）

### 必達目標
- **エリア一致率**: 100%
- **料理ジャンル一致率**: 100%  
- **タベログURL正確性**: 100%
- **LinkSwitch有効化率**: 営業中店舗100%

### 許容範囲
- **軽微な表記違い**: OK（例：「東京都渋谷区」vs「渋谷区」）
- **閉店店舗のLinkSwitch無効**: OK
- **タベログURL未設定**: 調査後設定（一時的にOK）

## 🏆 成功事例：Season1-4プロジェクト

### 修正実績
- **Season4**: 12エピソード全ての間違ったデータを正確な撮影場所に修正
- **Season3**: 4エピソードの重大エラーを修正
- **Season2**: 2エピソードの県レベル間違いを修正  
- **Season1**: 24件の誤分類エピソードを除去

### 達成した品質レベル
- **総ロケーション**: 45箇所の完璧なデータベース
- **収益化率**: 93%（営業中店舗100%）
- **データ正確性**: エリア・料理ジャンル・URL全て100%

## 🔗 関連リソース

### スクリプト
- `scripts/comprehensive-data-verification-season1-4.ts` - 全Season検証スクリプト
- `scripts/optimize-linkswitch-all-seasons.ts` - LinkSwitch最適化
- `scripts/fix-season*-episode*-*.ts` - 各種修正スクリプト（参考）

### データベース
- Supabaseの`episodes`, `locations`, `episode_locations`テーブル
- `affiliate_info`のJSON構造定義

## 📞 サポート・質問

新規Season追加作業で問題が発生した場合：

1. **ガイドライン再確認** - `docs/data-quality-guidelines.md`
2. **過去の修正事例参照** - `scripts/fix-season*`スクリプト
3. **検証スクリプト実行** - 問題の特定
4. **段階的修正** - 1つずつ確実に

---

**🏆 この資料により、Season5以降も高品質なデータベースを維持できます！**

*最終更新: 2025-08-30*  
*基準: Season1-4完全データベース化プロジェクト成果*