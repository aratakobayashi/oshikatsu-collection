import { useEffect } from 'react'

interface MetaTagsProps {
  title: string
  description: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogUrl?: string
  keywords?: string
  canonicalUrl?: string
}

export const MetaTags: React.FC<MetaTagsProps> = ({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  keywords,
  canonicalUrl
}) => {
  useEffect(() => {
    // Update document title
    document.title = title

    // Update existing meta tags or create new ones
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name'
      let element = document.querySelector(`meta[${attribute}="${property}"]`)
      
      if (element) {
        element.setAttribute('content', content)
      } else {
        element = document.createElement('meta')
        element.setAttribute(attribute, property)
        element.setAttribute('content', content)
        document.head.appendChild(element)
      }
    }

    // Basic SEO tags
    updateMetaTag('description', description)
    if (keywords) {
      updateMetaTag('keywords', keywords)
    }

    // Open Graph tags
    updateMetaTag('og:title', ogTitle || title, true)
    updateMetaTag('og:description', ogDescription || description, true)
    updateMetaTag('og:type', 'website', true)
    
    if (ogImage) {
      updateMetaTag('og:image', ogImage, true)
    }
    
    if (ogUrl) {
      updateMetaTag('og:url', ogUrl, true)
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image')
    updateMetaTag('twitter:title', ogTitle || title)
    updateMetaTag('twitter:description', ogDescription || description)
    
    if (ogImage) {
      updateMetaTag('twitter:image', ogImage)
    }

    // Canonical URL
    if (canonicalUrl) {
      let canonicalElement = document.querySelector('link[rel="canonical"]')
      if (canonicalElement) {
        canonicalElement.setAttribute('href', canonicalUrl)
      } else {
        canonicalElement = document.createElement('link')
        canonicalElement.setAttribute('rel', 'canonical')
        canonicalElement.setAttribute('href', canonicalUrl)
        document.head.appendChild(canonicalElement)
      }
    }

    // Cleanup function - restore default on unmount
    return () => {
      document.title = '推し活コレクション | みんなで作る推し活辞典'
    }
  }, [title, description, ogTitle, ogDescription, ogImage, ogUrl, keywords, canonicalUrl])

  return null // This component doesn't render anything
}

// SEO utility functions for generating meta content
export const generateSEO = {
  celebrity: (
    name: string, 
    worksCount: number = 0, 
    locationsCount: number = 0,
    options: {
      items?: number
      recentVisits?: string[]
      popularTags?: string[]
    } = {}
  ) => ({
    title: `${name}のロケ地・聖地巡礼ガイド${locationsCount > 0 ? `（${locationsCount}箇所）` : ''} | 推し活コレクション`,
    description: generateEnhancedCelebrityDescription(name, { worksCount, locationsCount, ...options }),
    keywords: `${name}, 推し活, 聖地巡礼, ロケ地, ${name} 行きつけの店, ${name} 私服, ${name} グルメ, ${name} 関連, ファン, ${name} 聖地巡礼, ${name} ロケ地巡り`
  }),

  location: (
    name: string, 
    address: string = '', 
    celebrityName: string = '',
    options: {
      visitType?: string
      category?: string
      area?: string
      features?: string[]
      priceRange?: string
    } = {}
  ) => ({
    title: `${name} - ロケ地・聖地巡礼情報 | 推し活コレクション`,
    description: generateEnhancedLocationDescription(name, { celebrity: celebrityName, ...options }),
    keywords: `${name}, ${celebrityName}, ロケ地, 聖地巡礼, ${celebrityName} 行きつけ, ${address}, 推し活, 撮影場所`
  }),

  item: (name: string, brand: string = '', celebrityName: string = '') => ({
    title: `【私服特定】${name}${brand ? ` - ${brand}` : ''} | 推し活コレクション`,
    description: `${celebrityName ? `${celebrityName}が着用した` : ''}${name}${brand ? `（${brand}）` : ''}の詳細情報。ブランド・価格・購入リンクを掲載。推し活・私服特定の参考に。`,
    keywords: `${name}, ${brand}, ${celebrityName}, 私服特定, ファッション, 推し活, アイテム, ブランド`
  }),

  episode: (title: string, workTitle: string = '', celebrityName: string = '') => ({
    title: `${title}${workTitle ? ` - ${workTitle}` : ''} | 推し活コレクション`,
    description: `${title}${workTitle ? `（${workTitle}）` : ''}のロケ地・使用アイテム情報。${celebrityName ? `${celebrityName}出演の` : ''}話題のシーンを詳しく解説。聖地巡礼・私服特定に役立つ情報満載。`,
    keywords: `${title}, ${workTitle}, ${celebrityName}, エピソード, ロケ地, 私服特定, 推し活`
  }),

  work: (title: string, celebrityName: string = '', episodeCount: number = 0) => ({
    title: `${title} - 出演者・ロケ地・エピソード一覧 | 推し活コレクション`,
    description: `${title}${celebrityName ? `（${celebrityName}出演）` : ''}の詳細情報。全${episodeCount}話のロケ地・使用アイテム・聖地巡礼情報を網羅。推し活ファン必見のまとめページ。`,
    keywords: `${title}, ${celebrityName}, 作品, ロケ地, エピソード, 推し活, 聖地巡礼`
  }),

  category: (categoryName: string, itemCount: number = 0) => ({
    title: `${categoryName}アイテム一覧 | 推し活コレクション`,
    description: `${categoryName}に関するアイテム${itemCount}件を掲載。推しの私服特定・ファッション情報をカテゴリ別に整理。ブランド・価格・購入リンク付き。`,
    keywords: `${categoryName}, アイテム, ファッション, 私服特定, 推し活, ブランド`
  }),

  // Default pages
  home: () => ({
    title: '推し活コレクション | みんなで作る推し活辞典',
    description: '推し活の聖地巡礼・私服特定をもっとリッチに。ファン同士で情報を共有し、お気に入りのアイテムやスポットを発見するプラットフォーム。推しの出演作品、ロケ地、アイテム情報が満載。',
    keywords: '推し活, 聖地巡礼, 私服特定, ロケ地, アイテム, ファン, アイドル, ファッション'
  }),

  celebrities: (count: number = 0) => ({
    title: `推し一覧（${count}名）| 推し活コレクション`,
    description: `人気の推し${count}名の出演作品・ロケ地情報をまとめて掲載。お気に入りの推しを見つけて、聖地巡礼や私服特定を楽しもう。`,
    keywords: '推し, アイドル, 俳優, 出演作品, 推し活, 一覧'
  }),

  locations: (count: number = 0) => ({
    title: `ロケ地・聖地巡礼スポット一覧（${count}箇所）| 推し活コレクション`,
    description: `全国の推し活聖地巡礼スポット${count}箇所を紹介。ロケ地情報、アクセス方法、営業時間など詳細情報付き。推しの足跡を辿ろう。`,
    keywords: 'ロケ地, 聖地巡礼, スポット, 推し活, 撮影場所, 観光'
  }),

  items: (count: number = 0) => ({
    title: `アイテム・私服特定一覧（${count}件）| 推し活コレクション`,
    description: `推しが着用したアイテム${count}件を私服特定。ブランド情報、価格、購入リンク付き。推しのファッションを完全再現しよう。`,
    keywords: 'アイテム, 私服特定, ファッション, ブランド, 推し活, 衣装'
  }),

  episodes: (count: number = 0) => ({
    title: `エピソード一覧（${count}話）| 推し活コレクション`,
    description: `人気作品の全${count}話のエピソード情報を掲載。各話のロケ地・使用アイテム・聖地巡礼情報を網羅。推し活ファン必見のエピソードガイド。`,
    keywords: 'エピソード, 作品, ロケ地, 聖地巡礼, 推し活, テレビ, 映画, アニメ'
  }),

  posts: (count: number = 0) => ({
    title: `質問・投稿一覧（${count}件）| 推し活コレクション`,
    description: `推し活に関する質問・投稿${count}件を掲載。ファン同士で情報交換し、推し活をより楽しもう。疑問や発見をシェアしよう。`,
    keywords: '質問, 投稿, 推し活, 情報交換, ファン, コミュニティ'
  })
}

// Enhanced content generation for high-volume keywords
export const generateEnhancedCelebrityDescription = (
  name: string,
  stats: {
    worksCount?: number
    locationsCount?: number
    items?: number
    recentVisits?: string[]
    popularTags?: string[]
  } = {}
): string => {
  const { worksCount = 0, locationsCount = 0, items = 0, recentVisits = [], popularTags = [] } = stats
  
  // ロングテールキーワード戦略: 高検索ボリューム×低競合キーワード
  const longtailKeywords = {
    locations: [`${name} 行きつけの店`, `${name} ロケ地`, `${name} グルメ`, `${name} 聖地巡礼`],
    fashion: [`${name} 私服`, `${name} 衣装`, `${name} ファッション`, `${name} コーデ`],
    spots: [`${name} デート`, `${name} 推し活`, `${name} スポット`, `${name} 撮影場所`]
  }
  
  // High-volume keyword templates for strategic SEO
  const templates = [
    `${longtailKeywords.locations[0]}から${longtailKeywords.locations[1]}まで、${name}が出演した番組・映画の撮影場所を完全ガイド。`,
    `推し活ファン必見！${longtailKeywords.spots[2]} ${locationsCount}箇所を詳しく紹介。実際に訪問できる${longtailKeywords.locations[2]}情報が満載。`,
    `${longtailKeywords.locations[0]}情報まとめ。実際に訪問した推し活ファンの口コミ・写真・アクセス方法も掲載。`,
    `【${longtailKeywords.fashion[0]}特定】着用アイテム${items}件をブランド・価格付きで解説。${longtailKeywords.fashion[2]}の参考にどうぞ。`
  ]

  let description = templates.join(' ')
  
  // Add recent visits with longtail keywords
  if (recentVisits.length > 0) {
    description += ` 最近の${longtailKeywords.locations[0]}：${recentVisits.slice(0, 2).join('、')}など。${longtailKeywords.spots[1]}におすすめ。`
  }
  
  // Add trending tags for longtail keyword coverage
  if (popularTags.length > 0) {
    description += ` ${popularTags.slice(0, 3).join('・')}で話題の${longtailKeywords.spots[2]}情報も充実。`
  }
  
  // 地域キーワード追加（東京、渋谷等の人気検索語）
  description += ` 東京・神奈川を中心とした${longtailKeywords.spots[1]}スポット情報を随時更新中。`
  
  return description
}

export const generateEnhancedLocationDescription = (
  name: string,
  options: {
    celebrity?: string
    visitType?: string
    category?: string
    area?: string
    features?: string[]
    priceRange?: string
  } = {}
): string => {
  const { celebrity, visitType = 'ロケ地', category = 'グルメスポット', area, features = [], priceRange } = options
  
  // ロングテールキーワード戦略: 地域×店舗×セレブリティ
  const locationKeywords = {
    pilgrimage: [`${name} 聖地巡礼`, `${name} ロケ地`, `${name} 推し活`, `${name} 撮影場所`],
    gourmet: [`${name} グルメ`, `${name} 料理`, `${name} メニュー`, `${name} 食事`],
    access: [`${name} アクセス`, `${name} 行き方`, `${name} 最寄り駅`, `${name} 営業時間`],
    experience: [`${name} 口コミ`, `${name} レビュー`, `${name} 体験談`, `${name} おすすめ`]
  }
  
  const templates = [
    `${locationKeywords.pilgrimage[0]}スポット${name}は${celebrity ? `${celebrity}の` : ''}${visitType}として人気の${category}。`,
    `推し活ファンが実際に訪れた${locationKeywords.experience[2]}・写真・${locationKeywords.access[0]}情報をまとめました。`,
    `${locationKeywords.access[3]}・予約方法・周辺の推し活スポットも併せて紹介。`
  ]
  
  // 地域キーワードの強化
  if (area) {
    templates.splice(1, 0, `${area}エリアで話題の${locationKeywords.pilgrimage[0]}スポット。${area} 推し活デートにもおすすめ。`)
  }
  
  // セレブリティ関連キーワード追加
  if (celebrity) {
    templates.push(`${celebrity} ファン必見の${locationKeywords.pilgrimage[1]}として多くの推し活ファンが訪問。`)
  }
  
  // 特徴キーワード
  if (features.length > 0) {
    templates.push(`${features.slice(0, 2).join('・')}が特徴の名店で、${locationKeywords.gourmet[0]}情報も詳しく解説。`)
  }
  
  // 価格帯キーワード
  if (priceRange) {
    templates.push(`予算${priceRange}で楽しめる推し活デートにもおすすめ。${locationKeywords.experience[0]}でも高評価。`)
  }
  
  // デート・グルメキーワード追加
  templates.push(`推し活デートや聖地巡礼の際の${locationKeywords.gourmet[0]}選びの参考にもどうぞ。`)
  
  return templates.join(' ')
}

// Keyword-optimized content generators for specific high-volume search terms
export const generateKeywordOptimizedContent = {
  // For targeting "[タレント名] ロケ地" keywords (25k+ searches)
  celebrityLocation: (celebrity: string, location: string, program?: string) => ({
    title: `${celebrity}のロケ地「${location}」詳細情報 | 推し活聖地巡礼`,
    description: `${celebrity}が${program ? `${program}で` : ''}訪れた${location}の詳細情報。アクセス方法、営業時間、推し活ファンの体験談を写真付きで紹介。聖地巡礼の参考に。`,
    keywords: `${celebrity} ロケ地, ${celebrity} ${location}, ${celebrity} 聖地巡礼, 推し活 ${location}${program ? `, ${program} ロケ地` : ''}`
  }),
  
  // For targeting "[タレント名] 行きつけ" keywords (5k+ searches)  
  celebrityFavorite: (celebrity: string, location: string, visitCount?: number) => ({
    title: `${celebrity}の行きつけ「${location}」情報 | 推し活グルメガイド`,
    description: `${celebrity}がよく通う${location}の詳細レポート。${visitCount ? `${visitCount}回以上の訪問実績。` : ''}メニュー、価格、予約方法まで推し活ファン向けに徹底解説。`,
    keywords: `${celebrity} 行きつけ, ${celebrity} グルメ, ${celebrity} ${location}, 推し活 グルメ, ${celebrity} おすすめ店`
  }),
  
  // For targeting "推し活 聖地巡礼" longtail keywords (30k+ searches)
  pilgrimageGuide: (area: string, celebrities: string[], locationCount: number) => ({
    title: `${area}エリア推し活聖地巡礼ガイド | ${locationCount}スポット完全攻略`,
    description: `${area}の推し活聖地巡礼スポット${locationCount}箇所を完全ガイド。${celebrities.slice(0, 3).join('・')}ゆかりの地を効率よく回るルートやアクセス方法を詳しく解説。`,
    keywords: `${area} 聖地巡礼, 推し活 ${area}, ${celebrities.slice(0, 2).join(' ')}, 聖地巡礼 ルート`
  }),
  
  // For targeting "[タレント名] 私服" keywords (12k+ searches)
  celebrityFashion: (celebrity: string, itemCount: number, brands: string[] = []) => ({
    title: `【${celebrity} 私服特定】着用アイテム${itemCount}件 | ブランド・価格まとめ`,
    description: `${celebrity}の私服コーディネート完全特定。着用アイテム${itemCount}件を${brands.length > 0 ? `${brands.slice(0, 2).join('・')}など` : ''}ブランド・価格・購入リンク付きで詳しく解説。`,
    keywords: `${celebrity} 私服, ${celebrity} ファッション, ${celebrity} 着用アイテム, ${celebrity} ブランド, 私服特定${brands.length > 0 ? `, ${brands.slice(0, 2).join(' ')}` : ''}`
  })
}