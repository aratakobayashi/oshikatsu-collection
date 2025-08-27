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
  celebrity: (name: string, worksCount: number = 0, locationsCount: number = 0) => ({
    title: `${name}の出演作品・ロケ地情報 | 推し活コレクション`,
    description: `${name}が出演した作品${worksCount}件とロケ地情報。聖地巡礼スポット${locationsCount}件を写真付きで紹介。ファン必見の推し活情報をまとめています。`,
    keywords: `${name}, 推し活, 聖地巡礼, ロケ地, 出演作品, ファン, アイドル`
  }),

  location: (name: string, address: string = '', celebrityName: string = '') => ({
    title: `${name} - ロケ地・聖地巡礼情報 | 推し活コレクション`,
    description: `${name}${address ? `（${address}）` : ''}の詳細情報。${celebrityName ? `${celebrityName}の` : ''}聖地巡礼スポットとして人気。アクセス方法や営業時間、周辺情報を掲載。`,
    keywords: `${name}, ${celebrityName}, ロケ地, 聖地巡礼, ${address}, 推し活, 撮影場所`
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

  posts: (count: number = 0) => ({
    title: `質問・投稿一覧（${count}件）| 推し活コレクション`,
    description: `推し活に関する質問・投稿${count}件を掲載。ファン同士で情報交換し、推し活をより楽しもう。疑問や発見をシェアしよう。`,
    keywords: '質問, 投稿, 推し活, 情報交換, ファン, コミュニティ'
  })
}