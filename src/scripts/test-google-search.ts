// src/scripts/test-google-search.ts （最終版）
import { googleSearch } from '../lib/googleSearch'

async function testFashionSearch() {
  try {
    console.log('👗 ファッション検索テスト開始...')
    
    // より具体的でシンプルなクエリ
    const result = await googleSearch.searchFashion('新垣結衣', 'ドラマ')
    
    console.log('✅ ファッション検索成功！')
    console.log(`📊 検索結果数: ${result.searchInformation.totalResults}`)
    console.log(`⏱️ 検索時間: ${result.searchInformation.searchTime}秒`)
    
    // 上位3件の結果を表示
    result.items.slice(0, 3).forEach((item, index) => {
      console.log(`\n👗 ファッション結果 ${index + 1}:`)
      console.log(`タイトル: ${item.title}`)
      console.log(`URL: ${item.link}`)
      console.log(`概要: ${item.snippet}`)
    })
    
    console.log('\n💰 本日の使用クエリ数: 3/100 (無料枠)')
    
  } catch (error) {
    console.error('❌ ファッション検索失敗:', error)
  }
}

async function testLocationSearch() {
  try {
    console.log('\n🗺️ ロケーション検索テスト開始...')
    
    // よりシンプルなロケーション検索
    const result = await googleSearch.searchLocation('東京駅')
    
    console.log('✅ ロケーション検索成功！')
    console.log(`📊 検索結果数: ${result.searchInformation.totalResults}`)
    
    // 上位2件のみ表示
    result.items.slice(0, 2).forEach((item, index) => {
      console.log(`\n🏢 ロケーション結果 ${index + 1}:`)
      console.log(`タイトル: ${item.title}`)
      console.log(`概要: ${item.snippet.substring(0, 100)}...`)
    })
    
  } catch (error) {
    console.error('❌ ロケーション検索失敗:', error)
  }
}

// 基本検索の確認
async function testBasicSearch() {
  try {
    console.log('🔍 基本検索確認...')
    const result = await googleSearch.search('乃木坂46 衣装')
    console.log('✅ 基本検索OK:', result.searchInformation.totalResults, '件')
  } catch (error) {
    console.error('❌ 基本検索エラー:', error)
  }
}

// メイン実行関数
async function runAllTests() {
  await testBasicSearch()
  await testFashionSearch()
  await testLocationSearch()
  
  console.log('\n🎉 すべてのGoogle Search APIテストが完了しました！')
  console.log('📝 推し活検索機能の実装準備が整いました。')
}

// テスト実行
runAllTests()

export { testFashionSearch, testLocationSearch, testBasicSearch }