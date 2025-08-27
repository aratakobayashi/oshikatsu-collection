/**
 * TMDB APIキー取得とセットアップのガイド
 */

async function showTMDBSetupGuide() {
  console.log('🔑 TMDB APIキー取得・セットアップガイド')
  console.log('='.repeat(60))

  console.log('\n📋 手順:')
  console.log('1. TMDB アカウント作成')
  console.log('   → https://www.themoviedb.org/signup')
  console.log()

  console.log('2. API設定ページでキー取得')
  console.log('   → https://www.themoviedb.org/settings/api')
  console.log('   → 「Request an API Key」をクリック')
  console.log('   → 「Developer」を選択')
  console.log('   → 必要事項を入力（個人利用でOK）')
  console.log()

  console.log('3. 環境変数設定')
  console.log('   → .env.production ファイルに追加:')
  console.log('   TMDB_API_KEY=your_api_key_here')
  console.log()

  console.log('4. APIキー確認')
  console.log('   → 以下のURLでテスト:')
  console.log('   https://api.themoviedb.org/3/tv/55582?api_key=YOUR_KEY&language=ja-JP')
  console.log()

  console.log('🎯 取得予定データ:')
  console.log('📺 孤独のグルメ全エピソード (130+話)')
  console.log('🖼️ 高品質エピソード画像')
  console.log('📅 正確な放送日・あらすじ')
  console.log('⭐ 評価・投票数')
  console.log()

  console.log('💡 APIの利点:')
  console.log('✅ 無料で使用可能')
  console.log('✅ 高品質な公式データ')
  console.log('✅ 日本語対応')
  console.log('✅ レート制限: 40req/10sec (十分)')
  console.log()

  console.log('⚠️ 注意事項:')
  console.log('- APIキーは秘密情報として管理')
  console.log('- 商用利用時は利用規約を確認')
  console.log('- データ取得には数分かかる場合あり')
  console.log()

  console.log('🚀 次のステップ:')
  console.log('1. APIキーを取得')
  console.log('2. 環境変数に設定')
  console.log('3. npx tsx scripts/fetch-kodoku-tmdb-data.ts を実行')
  console.log('4. 全130+エピソード自動取得完了！')
  console.log()

  // 環境変数チェック
  const apiKey = process.env.TMDB_API_KEY
  if (apiKey) {
    console.log('✅ TMDB_API_KEY が設定されています!')
    console.log(`   キー: ${apiKey.substring(0, 8)}...（秘匿）`)
    console.log('   🚀 fetch-kodoku-tmdb-data.ts を実行可能です!')
  } else {
    console.log('⚠️ TMDB_API_KEY が設定されていません')
    console.log('   上記手順に従ってAPIキーを取得・設定してください')
  }

  console.log('\n🎉 設定完了後の期待される結果:')
  console.log('- エピソード数: 12件 → 130+件')
  console.log('- 画像品質: 手動 → 高品質公式画像')
  console.log('- データ精度: 推測 → 正確なメタデータ')
  console.log('- 収益機会: 12店舗 → 130+店舗の可能性')
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  showTMDBSetupGuide().catch(console.error)
}

export { showTMDBSetupGuide }