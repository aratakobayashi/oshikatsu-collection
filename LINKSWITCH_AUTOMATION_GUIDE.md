# 🚀 LinkSwitch自動化ガイド - 大量アフィリエイト対応

## 🎯 なぜLinkSwitchが最適か

### 従来の問題
- 186店舗 × 手動MyLink作成 = 膨大な作業時間
- 新規店舗追加の度に手動作業が発生
- リンク管理の複雑化

### LinkSwitchの解決策
- **1回の設定で全サイトに適用**
- **過去・未来のリンクも自動変換**
- **食べログURLを直接貼るだけでアフィリエイト化**

## 📋 設定手順

### ステップ1: バリューコマース側設定

1. **バリューコマース管理画面にログイン**
2. **「ツール」→「LinkSwitch」→「LinkSwitch設定」**
3. **「LinkSwitchを利用開始する」をクリック**
4. **JSタグをコピー（全3行）**

### ステップ2: サイト側実装

以下をReactアプリのpublic/index.htmlに追加：

```html
<!-- public/index.html のheadタグ内に追加 -->
<head>
  <!-- 既存のmeta要素など -->
  
  <!-- バリューコマース LinkSwitch -->
  <script language="javascript" src="//linkswitch.valuecommerce.ne.jp/valuecommerce_linkswitch.js?sid=3750604"></script>
  <noscript>
    <img src="//linkswitch.valuecommerce.ne.jp/?sid=3750604&pid=0&oid=1&noscript=1" width="1" height="1">
  </noscript>
</head>
```

### ステップ3: 食べログプログラムとの提携確認

1. **管理画面で「食べログ 飲食店ネット予約プログラム（ID: 2147651）」が「提携中」になっているか確認**
2. **LinkSwitch対応かを確認**
   - 「プログラム検索」→「詳細検索」
   - 「LinkSwitch利用可能」にチェック
   - 食べログがリストに含まれるか確認

### ステップ4: データベース構造の変更

従来の複雑なアフィリエイトURLを保存する必要がなくなります：

```typescript
// 従来: 複雑なアフィリエイトリンクを保存
tabelog_url: "https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3750604..."

// LinkSwitch後: シンプルな直接リンクを保存
tabelog_url: "https://tabelog.com/tokyo/A1307/A130701/13001896/"
```

### ステップ5: UI実装の簡略化

LocationDetailコンポーネントを簡素化：

```tsx
// src/pages/public/LocationDetail.tsx
{location.tabelog_url && (
  <div className="pt-4 border-t border-gray-200">
    <a
      href={location.tabelog_url} // 直接リンクでOK
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        // クリックトラッキング（簡潔になる）
        console.log('Tabelog direct link clicked:', {
          location_id: location.id,
          tabelog_url: location.tabelog_url
        })
      }}
      className="block"
    >
      <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
        <Utensils className="h-5 w-5 mr-2" />
        食べログで予約する
      </Button>
    </a>
    <p className="text-xs text-gray-500 mt-2 text-center">
      ※食べログへ移動します
    </p>
  </div>
)}
```

## 🛠️ 大量データ処理の自動化

### 既存データベースの更新スクリプト

```bash
# 1. 複雑なアフィリエイトリンクをシンプルな直接リンクに変換
npx tsx src/scripts/convert-to-direct-links.ts

# 2. 食べログURLがない186店舗に直接リンクを追加
npx tsx src/scripts/auto-add-tabelog-direct-links.ts

# 3. 動作確認
npx tsx src/scripts/test-linkswitch-conversion.ts
```

### LinkSwitch変換確認方法

サイト上でリンクにマウスオーバーしたときに：
- 変換前: `https://tabelog.com/tokyo/...`
- 変換後: `https://dalr.valuecommerce.com/...`

URLが変換されていればLinkSwitchが正常動作しています。

## 📊 期待される効果

### 作業効率の向上
- **従来**: 186店舗 × 5分/店舗 = 15.5時間
- **LinkSwitch後**: 初期設定30分 + 186店舗 × 1分/店舗 = 3.6時間
- **削減効果**: 約12時間（77%削減）

### 運用面の改善
- 新規店舗追加時：食べログURLを直接貼るだけ
- リンク切れ心配なし：提携解除時は直接リンクに戻る
- 過去記事も自動変換：既存のコンテンツも収益化

### 技術的メリット
- データベース構造の簡素化
- コードメンテナンスの簡素化
- スケーラビリティの向上

## ⚠️ 注意事項

### 必須条件
1. **食べログプログラムがLinkSwitch対応していること**
2. **JSタグが正しく設置されていること**
3. **提携状況が「承認」であること**

### 確認方法
1. **プログラム詳細で「LinkSwitch利用可能」のマークを確認**
2. **ブラウザ開発者ツールでJSタグの読み込みを確認**
3. **リンクのマウスオーバーで変換確認**

## 🚀 実装スケジュール

### Phase 1 (今日): 設定とテスト
1. LinkSwitch JSタグの設置
2. 2店舗での動作確認
3. 自動変換の検証

### Phase 2 (明日): データ変換
1. 既存の複雑なアフィリエイトリンクを直接リンクに変換
2. 残り184店舗に食べログ直接リンクを追加

### Phase 3 (今週中): 全体テスト
1. 全店舗でのLinkSwitch動作確認
2. クリック数・変換率の測定開始
3. 収益発生の確認

この方法により、大量のアフィリエイトリンク管理が劇的に簡素化されます。