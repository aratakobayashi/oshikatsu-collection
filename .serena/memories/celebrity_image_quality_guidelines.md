# セレブリティ画像品質維持ガイドライン

## 背景
2025年9月16日に画像未設定の14人（183エピソード含む）を削除し、画像有効率を89%からほぼ100%に改善。
今後の品質維持のための必須ルール。

## 必須実践項目

### 1. 新規追加時は画像必須
- **ルール**: 画像URLが設定されていないセレブリティは追加禁止
- **実装**: 追加スクリプトで画像URL必須チェック機能を組み込む
- **例外**: なし（必ず有効な画像URLを設定してから追加）

### 2. YouTube Data API/TMDB APIを活用
- **YouTuber/YouTube Channel**: YouTube Data APIでチャンネル画像自動取得
- **俳優/女優**: TMDB APIでプロフィール画像自動取得
- **その他**: 手動設定または信頼できる公式ソースから取得

**API活用例:**
```bash
# YouTuber画像取得
npx tsx scripts/fix-youtuber-images.ts

# 俳優画像取得（TMDB）
npx tsx scripts/fix-actor-images-with-tmdb.ts
```

### 3. 定期的な画像URLチェック
- **頻度**: 月1回実行
- **ツール**: `src/scripts/debug-celebrity-images.ts`を使用
- **対応**: 破損画像は即座に修正または削除

**定期チェック手順:**
```bash
# 画像状況調査
npx tsx src/scripts/debug-celebrity-images.ts

# 問題発見時の対応
npx tsx src/scripts/cleanup-celebrities-without-images.ts
```

## 品質基準
- **画像有効率**: 100%維持
- **画像未設定**: 0人維持
- **破損画像**: 即座に修正

## 削除実績（参考）
- **削除日**: 2025年9月16日
- **削除数**: 14人（アーティスト5人、モデル3人、タレント3人、その他3人）
- **関連エピソード削除**: 183件
- **結果**: 132人→118人、画像有効率89%→ほぼ100%

## 今後の方針
画像なし = 即削除の原則を維持し、推し活コレクションの品質を保つ。