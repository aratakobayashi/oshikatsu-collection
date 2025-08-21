# 🔍 LinkSwitchトラッキング検証ガイド

## 🎯 クリック計測の確認方法

### 1. リンク変換の技術的確認

#### ブラウザ開発者ツールでの確認
1. **F12キーで開発者ツールを開く**
2. **Networkタブを選択**
3. **食べログボタンをクリック**
4. **以下のリクエストが発生しているか確認：**
   - `aml.valuecommerce.com` へのリクエスト
   - `vcdal.js` のロード
   - トラッキングピクセルの送信

#### マウスオーバーでの確認
- ボタンにマウスを置く
- ブラウザ左下に表示されるURL
- **正しい変換例**: `https://aml.valuecommerce.com/redirect/xxx...`

### 2. バリューコマース管理画面での確認

#### すぐに確認できる項目：
```
管理画面 > レポート > リアルタイムレポート
- 本日のクリック数
- 本日のインプレッション数
- プログラム別の詳細
```

#### 詳細分析（翌日以降）：
```
管理画面 > レポート > 成果レポート
- 食べログプログラム（PID: 2147651）の実績
- 日別・時間別のクリック数
- コンバージョン率
```

## 🛠️ より精密なトラッキングの設定

### 1. Google Analytics連携
```html
<!-- Google Analytics 4 連携コード -->
<script>
gtag('event', 'click', {
  event_category: 'affiliate',
  event_label: 'tabelog_linkswitch',
  custom_parameter_1: location.name
});
</script>
```

### 2. 独自トラッキングの強化
```typescript
// src/utils/tracking.ts
export const trackAffiliateClick = (data: {
  locationId: string
  locationName: string
  url: string
  source: 'linkswitch' | 'direct'
}) => {
  // 1. コンソールログ
  console.log('🔗 Affiliate click tracked:', data)
  
  // 2. 独自データベースに保存（オプション）
  // trackingService.recordClick(data)
  
  // 3. Google Analytics送信
  if (typeof gtag !== 'undefined') {
    gtag('event', 'affiliate_click', {
      custom_parameters: data
    })
  }
}
```

## 📈 成果確認のタイムライン

### 即座に確認（0-10分）
- [x] ✅ リンクの正常遷移
- [x] ✅ 技術的な変換動作
- [ ] 🔄 バリューコマース管理画面のクリック数

### 短期確認（1-24時間）
- [ ] 📊 詳細なクリック統計
- [ ] 📊 インプレッション数
- [ ] 📊 プログラム別パフォーマンス

### 長期確認（1週間-1ヶ月）
- [ ] 💰 実際の成果（予約・来店）
- [ ] 💰 報酬の発生
- [ ] 📈 コンバージョン率の測定

## ⚡ 緊急時の対処法

### トラッキングが記録されない場合
1. **JSタグの確認**
   ```bash
   # ブラウザコンソールで確認
   console.log(window.vc_pid) // "891908080" が表示されるか
   ```

2. **食べログプログラムの提携状況再確認**
   - 管理画面で「提携中」になっているか
   - LinkSwitch対応プログラムか確認

3. **キャッシュクリア**
   - ブラウザキャッシュをクリア
   - CDN(Netlify)のキャッシュクリア

### 代替トラッキング手法
LinkSwitchでトラッキングできない場合：
- MyLinkでの手動リンク作成に戻す
- 直接APIを使用したトラッキング実装

## 🎯 次のアクション

### 現在の優先度
1. **バリューコマース管理画面でクリック数確認**（今すぐ）
2. **技術的な変換動作の再確認**（今すぐ）
3. **残り184店舗の一括設定**（トラッキング確認後）

### 成功指標
- ✅ クリック数がカウントされる
- ✅ 正しい食べログページへの遷移
- ✅ エラーページが表示されない
- ✅ ユーザー体験が向上

これらが確認できれば、LinkSwitchは完璧に動作しており、
大規模展開の準備が整います！