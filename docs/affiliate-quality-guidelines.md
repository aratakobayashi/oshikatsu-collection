# アフィリエイト品質ガイドライン

## 🚨 絶対禁止事項

### ❌ ダミーURL生成
```typescript
// 絶対にNG
const tabelogUrl = `https://tabelog.com/tokyo/A1304/A130401/${random_number}/`
```

### ❌ 自動URL生成
- 規則的なURL生成
- 推測によるURL作成
- 未確認URLの設定

## ✅ 必須プロセス

### 1. 手動検索
```typescript
// 正しいアプローチ
// 1. 実店舗名でTabelog.comを検索
// 2. 正確な店舗を特定
// 3. URLをコピー
// 4. 手動でURL確認
const tabelogUrl = 'https://tabelog.com/tokyo/A1301/A130103/13013161/' // 手動確認済み
```

### 2. 品質チェックリスト

#### 実装前確認
- [ ] 実店舗が実際に存在する
- [ ] TablogでWebSearch実行済み
- [ ] 正確なURL取得済み
- [ ] 営業状況確認済み

#### 実装時確認
- [ ] 店舗名が完全一致
- [ ] 住所情報が一致
- [ ] Tabelog URLが正確

#### 実装後確認
- [ ] 実際にリンクをクリック
- [ ] 正しい店舗ページに遷移
- [ ] ユーザー体験をテスト

### 3. 段階的実装

#### Phase 1: 最高品質
- 手動検証済み 2-5件
- 100%確実な有名チェーン店のみ

#### Phase 2: 高品質
- Phase 1成功後
- 同様のプロセスで追加

#### Phase 3以降: 継続品質
- 絶対に品質を下げない
- 量より質を維持

## 🔍 品質保証コード例

```typescript
// 推奨実装パターン
const verifiedRestaurants = [
  {
    name: '餃子の王将 新橋駅前店',
    tabelog_url: 'https://tabelog.com/tokyo/A1301/A130103/13013161/',
    verification_date: '2025-08-23',
    verification_method: 'manual_tabelog_search',
    operating_status: 'confirmed_operating'
  }
]

// 実装時の安全確認
async function safeImplementation(restaurant) {
  // 1. URL形式チェック
  if (!restaurant.tabelog_url.includes('tabelog.com')) {
    throw new Error('Invalid Tabelog URL')
  }
  
  // 2. 手動確認フラグ
  if (!restaurant.verification_date) {
    throw new Error('Manual verification required')
  }
  
  // 3. 実装実行
  return await updateDatabase(restaurant)
}
```

## 🎯 今後の拡大戦略

### 原則
1. **品質 > 量**: 絶対に妥協しない
2. **手動確認**: 全て人間が確認
3. **段階的**: 少数ずつ確実に
4. **ユーザー第一**: 混乱を絶対に避ける

### 拡大手順
1. 現在の2店舗でユーザー体験確認
2. 問題なければ次の2-3店舗を手動追加
3. 各段階で品質維持
4. 最終目標: 20-50店舗の高品質システム

## 🏆 成功指標
- ユーザー満足度: 100%
- URL正確性: 100%
- 営業店舗率: 100%
- システム信頼性: 最高レベル