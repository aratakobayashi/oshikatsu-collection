// 東京の有名高級ホテルビュッフェ候補
const hotelBuffetCandidates = [
  {
    name: "帝国ホテル 東京 インペリアルバイキング サール",
    address: "東京都千代田区内幸町1-1-1 帝国ホテル 東京 本館17階",
    description: "日本初のホテルビュッフェで有名な帝国ホテルの高級ビュッフェレストラン",
    category: "hotel_restaurant",
    price_range: "¥8,000-15,000",
    features: ["老舗ホテル", "歴史あるビュッフェ", "高級感", "都心立地"]
  },
  {
    name: "ザ・リッツ・カールトン東京 タワーズ",
    address: "東京都港区赤坂9-7-1 東京ミッドタウン ザ・リッツ・カールトン東京 45階",
    description: "東京ミッドタウン最上階の高級ホテルビュッフェ",
    category: "hotel_restaurant", 
    price_range: "¥10,000-18,000",
    features: ["超高級", "絶景", "最上階", "外資系ホテル"]
  },
  {
    name: "グランドハイアット東京 フレンチキッチン",
    address: "東京都港区六本木6-10-3 グランドハイアット東京 2階",
    description: "六本木ヒルズ内の人気ホテルビュッフェレストラン",
    category: "hotel_restaurant",
    price_range: "¥7,000-12,000", 
    features: ["六本木ヒルズ", "国際的", "モダン", "アクセス良好"]
  },
  {
    name: "ホテルニューオータニ東京 ガーデンラウンジ",
    address: "東京都千代田区紀尾井町4-1 ホテルニューオータニ東京 ザ・メイン ロビィ階",
    description: "日本庭園を望む老舗ホテルの優雅なビュッフェ",
    category: "hotel_restaurant",
    price_range: "¥6,000-10,000",
    features: ["日本庭園", "老舗", "和洋折衷", "伝統的"]
  },
  {
    name: "シャングリ・ラ ホテル 東京 ザ・ロビーラウンジ",
    address: "東京都千代田区丸の内1-8-3 丸の内トラストタワー本館 28階",
    description: "東京駅直結の高層ホテルの上質なビュッフェ",
    category: "hotel_restaurant",
    price_range: "¥8,000-14,000",
    features: ["東京駅直結", "高層階", "ビジネス立地", "アジア系高級ホテル"]
  }
]

console.log('🏨 推定ホテルビュッフェ候補:')
console.log('==========================================')

hotelBuffetCandidates.forEach((hotel, index) => {
  console.log(`${index + 1}. ${hotel.name}`)
  console.log(`   住所: ${hotel.address}`)
  console.log(`   説明: ${hotel.description}`)
  console.log(`   価格帯: ${hotel.price_range}`)
  console.log(`   特徴: ${hotel.features.join(', ')}`)
  console.log('')
})

console.log('📝 提案:')
console.log('==========================================')
console.log('よにのちゃんねるの動画タイトル「ホテルブッヘった日」から、')
console.log('高級ホテルのビュッフェを体験している可能性が高いです。')
console.log('')
console.log('最も可能性が高いのは:')
console.log('1. 帝国ホテル（日本初のホテルビュッフェで有名）')
console.log('2. グランドハイアット東京（YouTuberにも人気）')
console.log('3. ホテルニューオータニ（アクセスが良く価格も手頃）')
console.log('')
console.log('動画のサムネイルや内容から、どのホテルか特定できれば')
console.log('正確なロケーション情報を追加できます。')