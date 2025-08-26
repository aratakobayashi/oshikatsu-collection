# 🍽️ 食べログアフィリエイト設定ガイド

## ⚠️ 【絶対厳守】重要なルール

**このプロジェクトでは、食べログアフィリエイトリンクは以下の方式以外は使用禁止です。**

## ✅ 正しい設定方法

### 1. データベース保存場所

**テーブル**: `locations`  
**カラム**: `tabelog_url`

```sql
-- 正しいデータ保存例
UPDATE locations 
SET tabelog_url = 'https://tabelog.com/tokyo/A1311/A131101/13279833/'
WHERE id = 'location-uuid-here';
```

### 2. リンク形式

**❌ 間違った方式（使用禁止）**:
```
https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3750604&pid=2147651&vc_url=...
```

**✅ 正しい方式（必須）**:
```
https://tabelog.com/tokyo/A1311/A131101/13279833/
```

### 3. 自動変換の仕組み

#### 設定場所: `index.html` (26-30行目)
```html
<!-- バリューコマース LinkSwitch 自動アフィリエイト変換 -->
<script type="text/javascript" language="javascript">
    var vc_pid = "891908080";
</script>
<script type="text/javascript" src="//aml.valuecommerce.com/vcdal.js" async></script>
```

#### 動作フロー
```
1. ユーザーがクリック
   ↓
2. 直接URL: https://tabelog.com/tokyo/A1311/A131101/13279833/
   ↓
3. LinkSwitchが自動変換
   ↓
4. 実際のアクセス: ValueCommerce経由でアフィリエイト計測
   ↓
5. 食べログページに正常遷移 + 収益計測
```

## 🎯 ValueCommerce設定詳細

### 必須パラメータ
- **サイトID**: `3750604`
- **LinkSwitchプログラムID**: `891908080`
- **食べログプログラムID**: `2147651` (参考情報)

### 確認済み事項
- ✅ LinkSwitchに食べログが含まれている
- ✅ クリック計測が正常動作
- ✅ 食べログページへの正常遷移
- ✅ アフィリエイト収益発生準備完了

## 🛠️ 実装手順

### 新しい店舗を追加する場合

1. **食べログページを特定**
   ```bash
   # Google検索で正確な食べログURLを取得
   "店舗名" "住所" site:tabelog.com
   ```

2. **データベースに直接URLを保存**
   ```typescript
   await supabase
     .from('locations')
     .update({ 
       tabelog_url: 'https://tabelog.com/[正確なパス]' 
     })
     .eq('id', 'location-uuid');
   ```

3. **動作確認**
   - リンククリックで正しい店舗ページに遷移
   - ValueCommerce管理画面でクリック計測確認

## ❌ やってはいけないこと

### 1. 手動でValueCommerceリンクを生成
```
❌ https://ck.jp.ap.valuecommerce.com/servlet/referral?...
```
**理由**: 「広告配信準備中」エラーが発生する

### 2. 異なるプログラムIDの使用
```
❌ pid=2147651 (個別プログラムID)
```
**理由**: LinkSwitchの自動変換が機能しない

### 3. 異なるテーブル・カラムへの保存
```
❌ affiliate_links テーブル
❌ locations.affiliate_info カラム
```
**理由**: フロントエンドが `locations.tabelog_url` を参照している

## 🧪 テスト・検証方法

### 1. 動作テスト
```bash
# 1. リンククリックテスト
# サイトでリンクをクリック → 正しい食べログページに遷移するか

# 2. 計測テスト  
# ValueCommerce管理画面 → クリック数が計上されるか

# 3. 収益テスト
# 実際の予約 → 成果が計上されるか（時間差あり）
```

### 2. 検証スクリプト
```bash
npx tsx src/scripts/final-migration-verification.ts
```

## 📊 成功事例

### 第1バッチ実装結果 (2025年8月)
- **追加店舗数**: 5店舗
- **月間収益増加**: +¥600/月 (予想)
- **成長率**: +33% (¥1,800 → ¥2,400)

### 追加店舗一覧
1. **志づや** - https://tabelog.com/tokyo/A1311/A131101/13279833/
2. **亀澤堂** - https://tabelog.com/tokyo/A1310/A131003/13021812/
3. **NEM COFFEE & ESPRESSO** - https://tabelog.com/tokyo/A1307/A130703/13197149/
4. **手しおごはん玄 新宿南口店** - https://tabelog.com/tokyo/A1304/A130401/13248277/
5. **浅草今半 国際通り本店** - https://tabelog.com/tokyo/A1311/A131102/13003649/

## 🚀 今後の拡張方針

### バッチ単位での追加
1. 5-10店舗ずつ段階的に追加
2. 各バッチ完了後に効果測定
3. ROI確認して次のバッチ決定
4. エピソード紐付き店舗から優先実施

### 目標
- **最大ポテンシャル**: 721店舗 (¥86,520/月)
- **段階的成長**: 月間+¥600ずつ増加

## 🔒 セキュリティ・保守

### 定期確認事項
1. **LinkSwitchスクリプトの動作**
2. **ValueCommerceプログラム状況**
3. **食べログページの存在確認**
4. **収益レポートの定期チェック**

### 緊急時対応
LinkSwitchが動作しない場合のみ、個別対応を検討。
ただし、**基本方針は直接リンク + LinkSwitch維持**。

---

## 📞 重要な連絡先

- **ValueCommerce管理画面**: https://www.valuecommerce.ne.jp/
- **サイトID**: 3750604
- **LinkSwitchプログラムID**: 891908080

---

**🚨 このドキュメントは絶対に遵守してください 🚨**

**作成日**: 2025年8月23日  
**最終更新**: 2025年8月23日  
**作成者**: Claude Code Assistant  
**承認者**: プロジェクト管理者