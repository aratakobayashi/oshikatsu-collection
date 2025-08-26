/**
 * インテリジェント検索ヘルパー
 * 検索クエリを解析して最適な検索タイプとページを判定
 */

export type SearchType = 'celebrity' | 'location' | 'item' | 'unknown'

// キーワード辞書
const CELEBRITY_KEYWORDS = [
  'よにの', 'ちゃんねる', '二宮', '和也', '中丸', '雄一', 
  '山田', '涼介', '菊池', '風磨', '森本', '慎太郎',
  'ジャニーズ', 'KAT-TUN', 'SixTONES', 'Snow Man', '嵐',
  'アイドル', '推し', 'タレント', '俳優', '歌手'
]

const LOCATION_KEYWORDS = [
  'カフェ', 'レストラン', '店', '店舗', 'ショップ',
  '銀座', '渋谷', '新宿', '原宿', '表参道', '青山',
  '聖地', '巡礼', 'ロケ地', '撮影', '訪問',
  'ティファニー', 'スタバ', 'スターバックス'
]

const ITEM_KEYWORDS = [
  'コスメ', 'ファッション', 'アクセサリー', 'バッグ',
  'GUCCI', 'Nike', 'Adidas', 'CHANEL', 'Dior',
  '服', '靴', 'アイテム', 'グッズ', '商品',
  'リップ', '香水', '時計', 'ネックレス'
]

/**
 * 検索クエリのタイプを自動判定
 */
export function detectSearchType(query: string): SearchType {
  const normalizedQuery = query.toLowerCase()
  
  // スコアリング方式で判定（複数マッチする場合の優先度決定）
  let celebrityScore = 0
  let locationScore = 0
  let itemScore = 0
  
  // 各キーワードとの一致度をチェック
  CELEBRITY_KEYWORDS.forEach(keyword => {
    if (normalizedQuery.includes(keyword.toLowerCase())) {
      celebrityScore += keyword.length // 長いキーワードほど重要
    }
  })
  
  LOCATION_KEYWORDS.forEach(keyword => {
    if (normalizedQuery.includes(keyword.toLowerCase())) {
      locationScore += keyword.length
    }
  })
  
  ITEM_KEYWORDS.forEach(keyword => {
    if (normalizedQuery.includes(keyword.toLowerCase())) {
      itemScore += keyword.length
    }
  })
  
  // 最高スコアのタイプを返す
  if (celebrityScore === 0 && locationScore === 0 && itemScore === 0) {
    return 'unknown'
  }
  
  const maxScore = Math.max(celebrityScore, locationScore, itemScore)
  
  if (celebrityScore === maxScore) return 'celebrity'
  if (locationScore === maxScore) return 'location'
  if (itemScore === maxScore) return 'item'
  
  return 'unknown'
}

/**
 * 検索タイプに応じた適切なパスを取得
 */
export function getSearchPath(query: string): string {
  const searchType = detectSearchType(query)
  const encodedQuery = encodeURIComponent(query)
  
  switch (searchType) {
    case 'celebrity':
      return `/celebrities?search=${encodedQuery}`
    case 'location':
      return `/locations?search=${encodedQuery}`
    case 'item':
      return `/items?search=${encodedQuery}`
    default:
      // 不明な場合は全体検索ページへ（将来実装）
      return `/search?q=${encodedQuery}`
  }
}

/**
 * サジェスト表示用の検索タイプラベル
 */
export function getSearchTypeLabel(type: SearchType): string {
  switch (type) {
    case 'celebrity':
      return '👥 推し・タレント'
    case 'location':
      return '📍 場所・店舗'
    case 'item':
      return '🛍️ アイテム・商品'
    default:
      return '🔍 全体'
  }
}

/**
 * 動的な人気検索キーワードを生成
 */
export function getPopularSearches() {
  // 実装時はSupabaseから取得
  // 現在はモックデータを返す
  return {
    trending: ['よにのちゃんねる', '二宮和也', 'GUCCI'],
    celebrities: ['山田涼介', '菊池風磨', '中丸雄一'],
    locations: ['ル・パン・コティディアン', 'Bills 表参道', 'Blue Seal'],
    items: ['Nike スニーカー', 'Dior リップ', 'CHANEL 香水']
  }
}