# 🚀 アフィリエイト収益化 - 今すぐスタートガイド

## やることはたったの3つだけ！

### ✅ STEP 1: バリューコマースでSIDを確認（5分）
1. バリューコマースにログイン → https://www.valuecommerce.ne.jp/
2. 画面上部の「ツール」をクリック
3. 「LinkSwitch」または「サイト管理」を開く
4. **SID（サイトID）**の数字をメモ（例：3456789）

### ✅ STEP 2: データベース準備（5分）
1. Supabaseダッシュボードを開く
2. 左メニューの「SQL Editor」をクリック
3. この文をコピペして実行:

```sql
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS tabelog_url TEXT,
ADD COLUMN IF NOT EXISTS affiliate_info JSONB DEFAULT '{}';
```

### ✅ STEP 3: テスト実行（10分）

1. **SIDを設定**
   - `src/scripts/valuecommerce-tabelog-converter.ts`を開く
   - 25行目の`YOUR_SID`を実際のSIDに置き換え

2. **テスト実行**
```bash
cd /Users/aratakobayashi/development/oshikatsu-collection
npx tsx src/scripts/valuecommerce-tabelog-converter.ts --action sample
```

## 🎯 これだけで完了！

### 動作確認方法
1. 推し活コレクションサイトを開く
2. 適当なロケーションページを開く
3. 「食べログで予約する」ボタンが表示されればOK！

### 収益の仕組み
1. ユーザーがボタンをクリック
2. 食べログで予約完了
3. あなたに報酬が入る（通常1件500-1000円）

## ❓ わからないことがあったら

### SIDが見つからない場合
- バリューコマースのサポートに電話: 03-5728-3910
- または「お問い合わせ」から質問

### エラーが出た場合
- まずは1つの店舗だけでテスト
- うまくいったら他の店舗も追加

## 🚀 さらに収益を増やすには

### 今週中にやること
1. 人気店舗5-10店だけアフィリエイトリンク追加
2. 1週間様子を見る
3. クリックがあれば他の店舗も追加

### 来月の目標
- 月1万円の収益達成
- 人気エピソードの店舗を優先的に設定

---

**💡 ポイント: 最初は少数の人気店舗だけでOK！**
**📈 効果が出たら徐々に拡大していきましょう**