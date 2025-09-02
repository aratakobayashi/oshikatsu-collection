
# 🚀 Lighthouse Performance Report
**Date**: 2025/9/2 22:41:16
**Environment**: Production

## 📊 Overall Scores

| Page | Performance Score | Status |
|------|------------------|--------|
| home | 0/100 🔴 | Poor |
| celebrities | 0/100 🔴 | Poor |
| celebrity-profile | 0/100 🔴 | Poor |
| locations | 0/100 🔴 | Poor |
| items | 0/100 🔴 | Poor |

## 📈 Core Web Vitals & Key Metrics

| Page | FCP | LCP | CLS | TBT | SI | TTI |
|------|-----|-----|-----|-----|-----|-----|
| home | Error | Error | Error | Error | Error | Error |
| celebrities | Error | Error | Error | Error | Error | Error |
| celebrity-profile | Error | Error | Error | Error | Error | Error |
| locations | Error | Error | Error | Error | Error | Error |
| items | Error | Error | Error | Error | Error | Error |

## 📖 Metrics Legend
- **FCP (First Contentful Paint)**: 最初のコンテンツ描画時間
- **LCP (Largest Contentful Paint)**: 最大コンテンツ描画時間 ⭐ Core Web Vital
- **CLS (Cumulative Layout Shift)**: 累積レイアウトシフト ⭐ Core Web Vital
- **TBT (Total Blocking Time)**: 合計ブロック時間
- **SI (Speed Index)**: スピードインデックス
- **TTI (Time to Interactive)**: 操作可能になるまでの時間

## 🎯 Target Scores for Good Performance
- **FCP**: < 1.8s
- **LCP**: < 2.5s ⭐
- **CLS**: < 0.1 ⭐
- **TBT**: < 200ms
- **SI**: < 3.4s
- **TTI**: < 3.8s

## 💡 Quick Wins for Performance
1. **画像最適化**: WebP/AVIF形式の使用、適切なサイズ設定
2. **JavaScriptバンドル削減**: コード分割、Tree Shaking
3. **リソースの優先度設定**: Critical CSSのインライン化
4. **キャッシュ戦略**: 静的リソースの長期キャッシュ
5. **遅延読み込み**: 画像とコンポーネントの遅延読み込み