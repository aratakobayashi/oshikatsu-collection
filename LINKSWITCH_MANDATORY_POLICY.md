# 🚀 LinkSwitch必須対応ポリシー

## 📋 ポリシー概要

2025年以降、推し活コレクションのすべてのロケーションデータでLinkSwitchの活用を必須とします。

### 🎯 導入背景

#### 現状の課題
- **低い活用率**: 全796件中113件（14%）のみLinkSwitch対応
- **複雑な管理**: MyLinkによる手動リンク作成の工数
- **保守の困難**: アフィリエイトURLの複雑化

#### LinkSwitch導入効果
- **作業効率**: 77%の工数削減（15.5時間 → 3.6時間）
- **保守性向上**: シンプルな直接URL管理
- **収益最大化**: 自動変換による取りこぼし防止

## 🛠️ 実装済み技術基盤

### LinkSwitch設定済み
```html
<!-- index.html 29-33行目に設置済み -->
<script type="text/javascript" language="javascript">
    var vc_pid = "891908080";
</script>
<script type="text/javascript" src="//aml.valuecommerce.com/vcdal.js" async></script>
```

### 提携プログラム
- **食べログ 飲食店ネット予約プログラム**
- **プログラムID**: 2147651
- **ステータス**: 提携承認済み

## 📝 データ登録・更新ルール

### ✅ 必須対応

#### 新規データ登録時
```typescript
// 正しい設定例
const newLocation = {
  name: "庄助",
  tabelog_url: "https://tabelog.com/tokyo/A1313/A131303/13065350/", // 直接URL
  affiliate_info: {
    linkswitch: {
      status: 'active',
      last_verified: new Date().toISOString(),
      original_url: "https://tabelog.com/tokyo/A1313/A131303/13065350/"
    }
  }
}
```

#### 既存データ更新時
```bash
# 必須実行スクリプト
npx tsx scripts/convert-complex-urls-to-direct.ts
npx tsx scripts/analyze-linkswitch-compatibility.ts
```

### ❌ 禁止事項

#### 複雑なアフィリエイトURL
```typescript
// 禁止例：servlet/referral形式
tabelog_url: "https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=..."

// 禁止例：MyLink形式
tabelog_url: "https://dal.valuecommerce.com/..."

// 禁止例：手動生成アフィリエイト
tabelog_url: "https://linkswitch.valuecommerce.com/..."
```

## 🔍 品質管理・検証

### データ品質チェック項目

#### 必須チェック
- [ ] 食べログ直接URLを使用している
- [ ] `tabelog.com`ドメインを含んでいる
- [ ] valuecommerce系のパラメータを含んでいない
- [ ] 実在する店舗のページである

#### 自動検証スクリプト
```bash
# 品質チェック
npx tsx scripts/validate-linkswitch-urls.ts

# 活用状況分析
npx tsx scripts/analyze-linkswitch-compatibility.ts
```

### 成果測定

#### 技術的確認
1. **マウスオーバー確認**: URL変換の動作確認
2. **開発者ツール確認**: `vcdal.js`の読み込み確認
3. **リアルタイムレポート確認**: バリューコマース管理画面

#### 効果指標
- LinkSwitch活用率: **目標74%以上**（478/796件）
- 作業工数削減: **77%削減維持**
- 収益向上: **自動変換による機会損失ゼロ**

## 🚨 違反時の対応

### 警告対象
- 複雑なアフィリエイトURLの新規登録
- 手動MyLinkの使用
- LinkSwitch無視したURL設定

### 是正措置
1. **即座の修正**: 直接URLへの変換
2. **再教育**: ドキュメント再確認
3. **プロセス改善**: チェックフロー強化

## 📊 移行スケジュール

### Phase 1: 完了済み（2025年1月）
- [x] LinkSwitch技術基盤の構築
- [x] 1件の複雑URL変換実施
- [x] ポリシー文書作成

### Phase 2: 推奨実施（2025年2-3月）
- [ ] 孤独のグルメ残り9店舗の正確な情報調査
- [ ] 682件の無効データ（「・他」等）クリーンアップ
- [ ] 実在店舗の食べログURL調査・追加

### Phase 3: 全面適用（2025年4月以降）
- [ ] 新規登録時のLinkSwitchチェック自動化
- [ ] 定期的な品質監査実施
- [ ] 収益レポートの定期作成

## 💡 運用ガイドライン

### 推奨ワークフロー

#### 新規店舗追加時
1. **実店舗の確認**: Googleマップ等で実在性確認
2. **食べログ検索**: 該当店舗の食べログページ検索
3. **直接URL設定**: 食べログの直接URLを設定
4. **動作確認**: フロントエンドでLinkSwitch動作確認

#### 定期メンテナンス（月次）
1. **活用状況分析**: `analyze-linkswitch-compatibility.ts`実行
2. **リンク切れチェック**: 404エラーがないか確認
3. **収益レポート**: バリューコマース成果確認

### トラブルシューティング

#### LinkSwitchが動作しない場合
1. **JSタグ確認**: `window.vc_pid`の値確認
2. **提携状況確認**: バリューコマース管理画面で提携確認
3. **ブラウザ確認**: 拡張機能無効化での動作確認

## 📚 関連リソース

### ドキュメント
- [データ作成要件ドキュメント](./docs/data-creation-requirements.md) - 3.4項
- [LinkSwitch自動化ガイド](./LINKSWITCH_AUTOMATION_GUIDE.md)
- [LinkSwitchトラッキング検証](./LINKSWITCH_TRACKING_VERIFICATION.md)

### 実行スクリプト
- `scripts/analyze-linkswitch-compatibility.ts` - 活用状況分析
- `scripts/convert-complex-urls-to-direct.ts` - URL変換
- `scripts/validate-linkswitch-urls.ts` - 品質チェック

---

**このポリシーにより、推し活コレクションのアフィリエイト収益化が効率的で持続可能なものとなります。**