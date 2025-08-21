# 食べログアフィリエイトリンク設定ガイド

## 概要
推し活コレクションに食べログアフィリエイトリンク機能を実装しました。
これにより、ロケーションページから食べログの予約ページへ誘導し、アフィリエイト収益を得ることができます。

## 実装内容

### 1. データベース変更
`locations`テーブルに以下のフィールドを追加しました：

- `tabelog_url` (TEXT): 食べログのアフィリエイトリンクURL
- `affiliate_info` (JSONB): アフィリエイト関連の詳細情報を格納

### 2. UI実装
`LocationDetail`コンポーネントに食べログ予約ボタンを追加：

- オレンジから赤のグラデーションボタン
- ホバー時のアニメーション効果
- クリック時のトラッキング（コンソールログ）

### 3. 管理ツール
`tabelog-affiliate-manager.ts`スクリプトで以下の操作が可能：

```bash
# アフィリエイトリンクの一覧表示
npx tsx src/scripts/tabelog-affiliate-manager.ts --action list

# サンプルデータの追加
npx tsx src/scripts/tabelog-affiliate-manager.ts --action add-sample

# 個別のリンク追加
npx tsx src/scripts/tabelog-affiliate-manager.ts --action add-single \
  --location-id <UUID> \
  --url <食べログURL> \
  --restaurant-id <店舗ID> \
  --tracking-code <トラッキングコード>
```

## セットアップ手順

### 1. データベースマイグレーション

#### プロダクション環境の場合：
Supabaseダッシュボードから以下のSQLを実行：

```sql
-- 食べログアフィリエイトリンクを格納するフィールドをlocationsテーブルに追加
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS tabelog_url TEXT,
ADD COLUMN IF NOT EXISTS affiliate_info JSONB DEFAULT '{}';

-- インデックスを追加（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_locations_tabelog_url ON public.locations(tabelog_url) WHERE tabelog_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_locations_affiliate_info ON public.locations USING GIN(affiliate_info);

-- コメントを追加
COMMENT ON COLUMN public.locations.tabelog_url IS '食べログのアフィリエイトリンクURL';
COMMENT ON COLUMN public.locations.affiliate_info IS 'アフィリエイト関連情報を格納するJSONフィールド';
```

### 2. アフィリエイトリンクの設定

#### 方法1: 管理スクリプトを使用
```bash
# 1. スクリプトファイルを編集してアフィリエイトデータを追加
# src/scripts/tabelog-affiliate-manager.ts のSAMPLE_AFFILIATE_DATAを編集

# 2. スクリプトを実行
npx tsx src/scripts/tabelog-affiliate-manager.ts --action add-sample
```

#### 方法2: Supabaseダッシュボードから直接更新
```sql
-- 例: 特定のロケーションにアフィリエイトリンクを設定
UPDATE public.locations
SET 
  tabelog_url = 'https://tabelog.com/tokyo/A1307/A130703/13123456/?cid=your_affiliate_id',
  affiliate_info = jsonb_build_object(
    'tabelog', jsonb_build_object(
      'url', 'https://tabelog.com/tokyo/A1307/A130703/13123456/?cid=your_affiliate_id',
      'restaurant_id', '13123456',
      'tracking_code', 'oshikatsu_location_001',
      'last_updated', now()
    )
  )
WHERE name = 'トリュフベーカリー 広尾店';
```

### 3. アフィリエイトIDの取得と設定

1. 食べログ飲食店ネット予約プログラムに登録
2. 提携審査通過後、アフィリエイトIDを取得
3. URLのcidパラメータにアフィリエイトIDを設定

例：
```
https://tabelog.com/tokyo/A1307/A130703/13123456/?cid=YOUR_AFFILIATE_ID
```

## 運用ガイド

### アフィリエイトリンクの追加手順

1. **対象店舗の確認**
   - 食べログで店舗を検索
   - ネット予約対応店舗か確認

2. **URLの生成**
   - 食べログの店舗URLを取得
   - cidパラメータにアフィリエイトIDを追加

3. **データベースへの登録**
   - 管理スクリプトまたはSQLで登録
   - 複数のエピソードで同じ店舗が出る場合は、全てに設定

### トラッキングとレポート

現在の実装：
- クリック時にコンソールログに記録
- location_id, location_name, tabelog_urlを出力

将来の拡張案：
- 専用のトラッキングテーブル作成
- クリック数、コンバージョン率の測定
- レポート機能の実装

## 注意事項

1. **アフィリエイトリンクのガイドライン遵守**
   - rel="sponsored"属性を必ず付与
   - 広告であることを明示

2. **ユーザー体験の維持**
   - 押し付けがましくないデザイン
   - 必要な情報提供を優先

3. **データの整合性**
   - 同じ店舗の重複登録に注意
   - 定期的なリンク切れチェック

## トラブルシューティング

### アフィリエイトリンクが表示されない
1. データベースにtabelog_urlが設定されているか確認
2. LocationDetailコンポーネントが最新版か確認
3. ブラウザのキャッシュをクリア

### マイグレーションエラー
1. Supabaseの権限を確認
2. SQLシンタックスエラーがないか確認
3. 既存のインデックスとの競合を確認

## 今後の改善案

1. **管理画面の強化**
   - アフィリエイトリンク専用の管理ページ
   - 一括インポート機能
   - リンクチェッカー

2. **トラッキングの高度化**
   - Google Analytics連携
   - コンバージョン追跡
   - A/Bテスト機能

3. **他のアフィリエイトプログラム対応**
   - ぐるなび
   - ホットペッパー
   - 一休.com

## サポート

問題が発生した場合は、GitHubのIssueを作成するか、開発チームまでご連絡ください。