/**
 * FAQ構造化データ自動生成ユーティリティ
 * 既存データベースの情報から動的にFAQコンテンツを生成
 */

export interface FAQItem {
  question: string
  answer: string
}

export interface FAQStructuredData {
  "@context": "https://schema.org"
  "@type": "FAQPage"
  mainEntity: Array<{
    "@type": "Question"
    name: string
    acceptedAnswer: {
      "@type": "Answer"
      text: string
    }
  }>
}

/**
 * セレブリティページ用FAQ生成
 */
export const generateCelebrityFAQ = (
  celebrityName: string,
  stats: {
    locationCount?: number
    latestEpisode?: { title: string; airDate: string }
    areas?: string[]
    episodeCount?: number
  } = {}
): FAQItem[] => {
  const faqs: FAQItem[] = []

  // Q1: ロケ地数に関する質問
  if (stats.locationCount !== undefined && stats.locationCount > 0) {
    faqs.push({
      question: `${celebrityName}さんの聖地巡礼スポットは何箇所ありますか？`,
      answer: `${celebrityName}さん関連の聖地巡礼スポットは現在${stats.locationCount}箇所掲載しています。番組で紹介された飲食店から撮影場所まで、推し活に役立つ情報を網羅的に紹介しています。`
    })
  }

  // Q2: 最新エピソード情報
  if (stats.latestEpisode) {
    faqs.push({
      question: `${celebrityName}さんの最新エピソード情報を教えてください`,
      answer: `${celebrityName}さんの最新エピソードは「${stats.latestEpisode.title}」（${stats.latestEpisode.airDate}放送）です。番組内で訪問した場所の詳細情報も掲載しています。`
    })
  } else if (stats.episodeCount && stats.episodeCount > 0) {
    faqs.push({
      question: `${celebrityName}さんのエピソード情報はありますか？`,
      answer: `${celebrityName}さん関連のエピソードを${stats.episodeCount}件掲載中です。各エピソードで訪問したロケ地情報もあわせてご覧いただけます。`
    })
  }

  // Q3: エリア情報
  if (stats.areas && stats.areas.length > 0) {
    faqs.push({
      question: `${celebrityName}さんの推し活スポットはどのエリアにありますか？`,
      answer: `${celebrityName}さんの推し活スポットは主に${stats.areas.slice(0, 3).join('・')}エリアにあります。各エリアの詳細な聖地巡礼ルートも紹介しています。`
    })
  }

  // Q4: 聖地巡礼の回り方（常に表示）
  faqs.push({
    question: `${celebrityName}さんの聖地巡礼はどのように回るのがおすすめですか？`,
    answer: `${celebrityName}さんの聖地巡礼は、エリアごとにまとめて回るのがおすすめです。各スポットの営業時間や定休日を事前に確認し、効率的なルートで推し活を楽しんでください。当サイトではマップ機能も提供しています。`
  })

  // Q5: 推し活グッズ情報
  faqs.push({
    question: `${celebrityName}さんの推し活で人気のグッズはありますか？`,
    answer: `${celebrityName}さんの推し活では、番組グッズや写真集が人気です。聖地巡礼の際は、推しの写真や応援グッズを持参するファンも多くいらっしゃいます。`
  })

  return faqs
}

/**
 * ロケーションページ用FAQ生成
 */
export const generateLocationFAQ = (
  locationName: string,
  data: {
    celebrities?: string[]
    broadcastDates?: string[]
    address?: string
    category?: string
    nearbySpots?: number
  } = {}
): FAQItem[] => {
  const faqs: FAQItem[] = []

  // Q1: 来店した有名人
  if (data.celebrities && data.celebrities.length > 0) {
    const celebList = data.celebrities.slice(0, 3).join('・')
    faqs.push({
      question: `${locationName}を訪れた有名人は誰ですか？`,
      answer: `${locationName}は${celebList}さんなど${data.celebrities.length}名の著名人が訪れた聖地巡礼スポットです。推し活ファンに人気の場所として知られています。`
    })
  }

  // Q2: 放送情報
  if (data.broadcastDates && data.broadcastDates.length > 0) {
    faqs.push({
      question: `${locationName}はいつテレビで紹介されましたか？`,
      answer: `${locationName}は${data.broadcastDates[0]}に放送された番組で紹介されました。${
        data.broadcastDates.length > 1 
          ? `他にも${data.broadcastDates.length - 1}回の放送で取り上げられています。` 
          : ''
      }`
    })
  }

  // Q3: アクセス情報
  if (data.address) {
    faqs.push({
      question: `${locationName}へのアクセス方法を教えてください`,
      answer: `${locationName}は${data.address}にあります。公共交通機関でのアクセスが便利で、推し活での聖地巡礼に最適です。詳しいアクセス情報はページ内のマップをご確認ください。`
    })
  }

  // Q4: 訪問のベストタイミング
  const isRestaurant = data.category === 'restaurant' || data.category === 'cafe'
  faqs.push({
    question: `${locationName}を訪れるベストタイミングは？`,
    answer: isRestaurant
      ? `${locationName}は平日のランチタイムや午後の時間帯が比較的空いています。推し活での聖地巡礼は、混雑を避けてゆっくり楽しむのがおすすめです。`
      : `${locationName}は営業時間内であればいつでも訪問可能です。推し活ファンの方は、写真撮影がしやすい時間帯を選ぶことをおすすめします。`
  })

  // Q5: 写真撮影について（常に表示）
  faqs.push({
    question: `${locationName}での推し活撮影スポットは？`,
    answer: `${locationName}では、番組で映った場所での記念撮影が人気です。他のお客様への配慮を忘れずに、推し活の思い出作りを楽しんでください。SNSへの投稿時は、お店のルールを守りましょう。`
  })

  // Q6: 周辺の推し活スポット
  if (data.nearbySpots && data.nearbySpots > 0) {
    faqs.push({
      question: `${locationName}の周辺に他の推し活スポットはありますか？`,
      answer: `${locationName}の周辺には${data.nearbySpots}箇所の推し活スポットがあります。効率的な聖地巡礼ルートを組んで、複数のスポットを回ることができます。`
    })
  }

  return faqs
}

/**
 * FAQ構造化データを生成
 */
export const generateFAQStructuredData = (faqs: FAQItem[]): FAQStructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question" as const,
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: faq.answer
      }
    }))
  }
}

/**
 * エリア名を住所から抽出するヘルパー関数
 */
export const extractAreaFromAddress = (address: string): string => {
  // 東京都の主要エリア
  const tokyoAreas = [
    '渋谷', '新宿', '池袋', '銀座', '六本木', '青山', '表参道',
    '原宿', '恵比寿', '品川', '上野', '浅草', '秋葉原', '東京',
    '丸の内', '日本橋', '赤坂', '麻布', '代官山', '中目黒'
  ]
  
  // 神奈川県の主要エリア
  const kanagawaAreas = [
    '横浜', 'みなとみらい', '関内', '川崎', '鎌倉', '藤沢', '小田原'
  ]
  
  const allAreas = [...tokyoAreas, ...kanagawaAreas]
  
  // 住所からエリア名を検出
  for (const area of allAreas) {
    if (address.includes(area)) {
      return area
    }
  }
  
  // 区名から推定
  const wardMatch = address.match(/([^都道府県市]+区)/)
  if (wardMatch) {
    return wardMatch[1].replace('区', '')
  }
  
  return ''
}

/**
 * 複数の住所からエリアリストを生成
 */
export const extractAreasFromAddresses = (addresses: string[]): string[] => {
  const areas = new Set<string>()
  
  addresses.forEach(address => {
    const area = extractAreaFromAddress(address)
    if (area) {
      areas.add(area)
    }
  })
  
  return Array.from(areas)
}