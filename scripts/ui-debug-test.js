// ブラウザConsoleで実行: celebrityページでlocations/itemsセクション表示確認スクリプト

console.log('🔧 UI要素表示デバッグ開始');

// 聖地・店舗情報セクション確認
const locationsSection = document.querySelector('[data-section="locations"], h2:contains("聖地・店舗情報")');
console.log('🏪 聖地・店舗情報セクション:', locationsSection ? '存在' : '不存在');

// ファッション・アイテムセクション確認
const itemsSection = document.querySelector('[data-section="items"], h2:contains("ファッション・アイテム")');
console.log('🛍️ ファッション・アイテムセクション:', itemsSection ? '存在' : '不存在');

// テキスト内容確認
const pageText = document.body.innerText;
const hasLocationsText = pageText.includes('聖地・店舗情報') || pageText.includes('店舗情報');
const hasItemsText = pageText.includes('ファッション・アイテム') || pageText.includes('アイテム情報');

console.log('📝 ページ内テキスト確認:');
console.log('   聖地・店舗情報テキスト:', hasLocationsText ? '✅ 存在' : '❌ 不存在');
console.log('   ファッション・アイテムテキスト:', hasItemsText ? '✅ 存在' : '❌ 不存在');

// セクション個数カウント
const locationsCards = document.querySelectorAll('[href*="/locations/"]');
const itemsCards = document.querySelectorAll('[href*="/items/"]');
console.log('🏪 店舗カード数:', locationsCards.length);
console.log('🛍️ アイテムカード数:', itemsCards.length);

// Reactコンポーネント状態確認（可能な場合）
if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
  try {
    console.log('⚛️ React状態確認可能');
  } catch (e) {
    console.log('⚛️ React状態確認不可');
  }
}

// データ表示のテキスト確認
const noDataTexts = [
  '店舗情報がありません',
  'アイテム情報がありません', 
  '店舗情報はまだありません',
  'アイテム情報はまだありません'
];

noDataTexts.forEach(text => {
  if (pageText.includes(text)) {
    console.log(`📭 "${text}" メッセージ発見`);
  }
});

// 聖地巡礼マップセクション確認
const pilgrimageSection = pageText.includes('聖地巡礼マップ');
console.log('🗺️ 聖地巡礼マップセクション:', pilgrimageSection ? '存在' : '不存在');

console.log('🔧 UI要素表示デバッグ完了');