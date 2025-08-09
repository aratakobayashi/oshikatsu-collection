// ブラウザのConsoleで実行するデバッグスクリプト

console.log('🔧 店舗・アイテム表示デバッグ開始');

// React DevTools から状態確認
try {
  // locations state確認
  const locationsElements = document.querySelectorAll('[data-testid="locations"], .locations, [class*="location"]');
  console.log('🏪 Locations要素数:', locationsElements.length);
  
  // items state確認  
  const itemsElements = document.querySelectorAll('[data-testid="items"], .items, [class*="item"]');
  console.log('🛍️ Items要素数:', itemsElements.length);
  
  // 聖地巡礼マップセクション確認
  const mapSection = document.querySelector('[class*="聖地巡礼"], [class*="map"]');
  console.log('🗺️ 聖地巡礼マップセクション:', mapSection ? '存在' : '不存在');
  
  // ファッション検索セクション確認
  const fashionSection = document.querySelector('[class*="ファッション"], [class*="fashion"]');
  console.log('👗 ファッション検索セクション:', fashionSection ? '存在' : '不存在');
  
  // 表示テキスト確認
  const pageText = document.body.innerText;
  const hasLocationText = pageText.includes('聖地巡礼') || pageText.includes('店舗');
  const hasItemText = pageText.includes('ファッション') || pageText.includes('アイテム');
  
  console.log('📝 ページ内テキスト確認:');
  console.log('   聖地巡礼/店舗:', hasLocationText ? '✅ 存在' : '❌ 不存在');
  console.log('   ファッション/アイテム:', hasItemText ? '✅ 存在' : '❌ 不存在');
  
} catch (error) {
  console.error('❌ デバッグエラー:', error);
}

// 状態確認用関数
console.log('🔧 以下をConsoleで実行して状態確認:');
console.log('React.$r.state // React状態確認');
console.log('React.$r.props // React props確認');