# Snow Man データインポート完了

## 概要
2025年8月19日、Snow Manのセレブリティデータとチャンネル動画のインポートを完了しました。

## インポート結果
- **セレブリティID**: 8920ac69-9eee-41e1-84e6-308f0e8bd90c
- **総エピソード数**: 949件
- **チャンネル登録者数**: 287万人
- **処理ページ数**: 19ページ（最大20ページ制限）

## 技術詳細
- **実装ファイル**: `src/scripts/data-collection/add-snowman.ts`
- **YouTube API**: プレイリストアイテムAPIを使用（UCをUUに変換）
- **データベース**: Supabase（celebrities, episodesテーブル）

## 確認URL
https://oshikatsu-collection.netlify.app/celebrities/snow-man

## 注意事項
- episodesテーブルにはtagsカラムとis_featuredカラムが存在しないため、基本情報のみ保存
- celebritiesテーブルはdescriptionではなくbioカラムを使用
- UUID生成を明示的に実装（データベースの自動生成が機能しない場合の対策）