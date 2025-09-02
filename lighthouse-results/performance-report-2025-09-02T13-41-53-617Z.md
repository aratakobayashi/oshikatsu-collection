
# 🚀 Lighthouse Performance Report
**Date**: 2025/9/2 22:44:33
**Environment**: Production

## 📊 Overall Scores

| Page | Performance Score | Status |
|------|------------------|--------|
| home | 38/100 🔴 | Poor |
| celebrities | 70/100 🟡 | Needs Improvement |
| celebrity-profile | 44/100 🔴 | Poor |
| locations | 70/100 🟡 | Needs Improvement |
| items | 83/100 🟡 | Needs Improvement |

## 📈 Core Web Vitals & Key Metrics

| Page | FCP | LCP | CLS | TBT | SI | TTI |
|------|-----|-----|-----|-----|-----|-----|
| home | 2.2 s | 17.8 s | 0.005 | 2,310 ms | 7.0 s | 18.9 s |
| celebrities | 3.0 s | 5.4 s | 0.005 | 150 ms | 4.7 s | 5.5 s |
| celebrity-profile | 2.2 s | 5.6 s | 0.005 | 1,330 ms | 8.3 s | 5.7 s |
| locations | 2.2 s | 5.9 s | 0.024 | 170 ms | 5.1 s | 5.9 s |
| items | 2.1 s | 3.9 s | 0.005 | 130 ms | 4.2 s | 3.9 s |

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