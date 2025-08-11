const fetch = require('node-fetch')

// 8888-infoサイトから店舗情報をスクレイピング
class FansiteScraper {
  constructor() {
    this.baseUrl = 'https://8888-info.hatenablog.com'
  }

  // メインの朝ごはんページから情報を抽出
  async scrapeBreakfastInfo() {
    console.log('🔍 8888-infoサイトから朝ごはん情報を取得中...')
    
    try {
      const response = await fetch(`${this.baseUrl}/entry/朝ごはん`)
      const html = await response.text()
      
      console.log('✅ ページ取得成功')
      console.log(`📄 ページサイズ: ${html.length} characters`)
      
      // HTMLから店舗情報を抽出
      const storePattern = /🥩【([^】]+)】[\s\S]*?住所[：:]\s*([^\n]+)[\s\S]*?営業時間[：:]\s*([^\n]+)[\s\S]*?電話番号[：:]\s*([^\n]+)/g
      
      const stores = []
      let match
      
      while ((match = storePattern.exec(html)) !== null) {
        stores.push({
          name: match[1].trim(),
          address: match[2].trim(),
          hours: match[3].trim(),
          phone: match[4].trim()
        })
      }
      
      console.log(`🏪 抽出された店舗数: ${stores.length}件`)
      
      // エピソード番号とのマッピングを試行
      const episodePattern = /#(\d+)[【\s]([^】\n]+)[】]?[\s\S]*?🥩【([^】]+)】/g
      const episodeMatches = []
      
      let episodeMatch
      while ((episodeMatch = episodePattern.exec(html)) !== null) {
        episodeMatches.push({
          episodeNumber: episodeMatch[1],
          episodeTitle: episodeMatch[2].trim(),
          storeName: episodeMatch[3].trim()
        })
      }
      
      console.log(`📺 エピソード情報: ${episodeMatches.length}件`)
      
      return { stores, episodeMatches }
      
    } catch (error) {
      console.error('❌ スクレイピングエラー:', error.message)
      return { stores: [], episodeMatches: [] }
    }
  }

  // 特定のエピソード番号で検索
  async findEpisodeInfo(episodeNumber) {
    console.log(`🔍 エピソード#${episodeNumber}の情報を検索中...`)
    
    const { stores, episodeMatches } = await this.scrapeBreakfastInfo()
    
    // エピソード番号での直接マッチ
    const directMatch = episodeMatches.find(ep => ep.episodeNumber === episodeNumber.toString())
    
    if (directMatch) {
      console.log(`✅ エピソード#${episodeNumber}の情報を発見:`)
      console.log(`   タイトル: ${directMatch.episodeTitle}`)
      console.log(`   店舗: ${directMatch.storeName}`)
      
      // 対応する店舗詳細を検索
      const storeDetail = stores.find(store => store.name.includes(directMatch.storeName))
      
      if (storeDetail) {
        console.log(`📍 店舗詳細:`)
        console.log(`   住所: ${storeDetail.address}`)
        console.log(`   営業時間: ${storeDetail.hours}`)
        console.log(`   電話番号: ${storeDetail.phone}`)
        
        return {
          episode: directMatch,
          storeDetail: storeDetail
        }
      }
    }
    
    console.log(`⚠️ エピソード#${episodeNumber}の情報が見つかりませんでした`)
    
    // 利用可能なエピソード一覧を表示
    console.log(`\n📋 利用可能なエピソード情報:`)
    episodeMatches.slice(0, 10).forEach(ep => {
      console.log(`   #${ep.episodeNumber}: ${ep.episodeTitle} → ${ep.storeName}`)
    })
    
    return { episode: null, storeDetail: null }
  }

  // 全ての利用可能な店舗情報を取得
  async getAllStoreInfo() {
    console.log('🏪 全店舗情報を取得中...')
    
    const { stores, episodeMatches } = await this.scrapeBreakfastInfo()
    
    console.log(`\n📊 サマリー:`)
    console.log(`   店舗数: ${stores.length}件`)
    console.log(`   エピソード数: ${episodeMatches.length}件`)
    
    console.log(`\n🏪 店舗一覧 (最初の5件):`)
    stores.slice(0, 5).forEach((store, index) => {
      console.log(`   ${index + 1}. ${store.name}`)
      console.log(`      住所: ${store.address}`)
      console.log(`      営業時間: ${store.hours}`)
      console.log(`      電話: ${store.phone}`)
      console.log('')
    })
    
    return { stores, episodeMatches }
  }
}

// 実行部分
if (require.main === module) {
  const scraper = new FansiteScraper()
  
  const episodeNumber = process.argv[2] || '135'
  
  scraper.findEpisodeInfo(episodeNumber)
    .then(result => {
      if (!result.episode) {
        console.log('\n🔄 全体情報も取得してみます...')
        return scraper.getAllStoreInfo()
      }
    })
    .catch(error => {
      console.error('❌ 実行エラー:', error)
    })
}

module.exports = FansiteScraper