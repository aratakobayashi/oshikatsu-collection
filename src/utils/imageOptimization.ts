// 画像最適化とSEO向けalt属性生成ユーティリティ

interface ImageOptimizationOptions {
  quality?: number
  format?: 'webp' | 'jpg' | 'png'
  width?: number
  height?: number
}

interface AltTextOptions {
  context?: string
  keywords?: string[]
  includeAction?: boolean
  includeBrand?: boolean
}

export const imageOptimization = {
  // 高品質なalt属性を生成
  generateAltText: {
    // セレブリティ画像用
    celebrity: (
      name: string, 
      options: { 
        context?: '一覧' | 'プロフィール' | 'エピソード'
        groupName?: string
        profession?: string
      } = {}
    ): string => {
      const { context = 'プロフィール', groupName, profession } = options
      
      let altText = `${name}`
      
      if (groupName) {
        altText += `（${groupName}メンバー）`
      }
      
      if (profession) {
        altText += `・${profession}`
      }
      
      switch (context) {
        case '一覧':
          altText += 'の写真｜推し活コレクション'
          break
        case 'プロフィール':
          altText += `のプロフィール画像｜出演作品・ロケ地情報`
          break
        case 'エピソード':
          altText += `の出演シーン画像｜推し活コレクション`
          break
        default:
          altText += 'の画像｜推し活コレクション'
      }
      
      return altText
    },

    // ロケ地・店舗画像用
    location: (
      name: string,
      options: {
        address?: string
        category?: string
        context?: '一覧' | '詳細' | 'エピソード'
        visitedBy?: string
      } = {}
    ): string => {
      const { address, category, context = '詳細', visitedBy } = options
      
      let altText = `${name}`
      
      if (category) {
        altText += `（${category}）`
      }
      
      if (address) {
        // 住所から都道府県を抽出
        const prefecture = address.match(/([都道府県])/)?.[0]
        if (prefecture) {
          const prefectureName = address.split(prefecture)[0] + prefecture
          altText += `・${prefectureName}`
        }
      }
      
      if (visitedBy) {
        altText += `｜${visitedBy}が訪問した`
      }
      
      switch (context) {
        case '一覧':
          altText += '聖地巡礼スポット｜推し活コレクション'
          break
        case '詳細':
          altText += 'の店内・外観写真｜聖地巡礼ガイド'
          break
        case 'エピソード':
          altText += 'でのシーン｜推し活コレクション'
          break
        default:
          altText += '｜推し活コレクション'
      }
      
      return altText
    },

    // アイテム・商品画像用
    item: (
      name: string,
      options: {
        brand?: string
        category?: string
        color?: string
        context?: '一覧' | '詳細' | 'エピソード'
        wornBy?: string
        price?: number
      } = {}
    ): string => {
      const { brand, category, color, context = '詳細', wornBy, price } = options
      
      let altText = ''
      
      if (brand) {
        altText += `${brand}・`
      }
      
      altText += name
      
      if (color) {
        altText += `（${color}）`
      }
      
      if (category) {
        altText += `｜${category}`
      }
      
      if (wornBy) {
        altText += `｜${wornBy}愛用`
      }
      
      if (price && price > 0) {
        altText += `｜¥${price.toLocaleString()}`
      }
      
      switch (context) {
        case '一覧':
          altText += '｜私服特定・推し活コレクション'
          break
        case '詳細':
          altText += 'の商品画像｜購入可能・私服特定'
          break
        case 'エピソード':
          altText += 'の着用シーン｜推し活コレクション'
          break
        default:
          altText += '｜推し活コレクション'
      }
      
      return altText
    },

    // エピソード・動画サムネイル用
    episode: (
      title: string,
      options: {
        celebrityName?: string
        date?: string
        platform?: 'YouTube' | 'TV' | 'Instagram' | 'TikTok' | 'その他'
        hasLocations?: boolean
        hasItems?: boolean
      } = {}
    ): string => {
      const { celebrityName, date, platform, hasLocations, hasItems } = options
      
      let altText = `『${title}』`
      
      if (celebrityName) {
        altText += `｜${celebrityName}出演`
      }
      
      if (platform) {
        altText += `・${platform}`
      }
      
      if (date) {
        const formattedDate = new Date(date).toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long'
        })
        altText += `（${formattedDate}）`
      }
      
      // コンテンツの豊富さを表現
      const features = []
      if (hasLocations) features.push('ロケ地情報')
      if (hasItems) features.push('アイテム情報')
      
      if (features.length > 0) {
        altText += `｜${features.join('・')}あり`
      }
      
      altText += '｜推し活コレクション'
      
      return altText
    }
  },

  // 画像URL最適化（CDN・圧縮対応）
  optimizeImageUrl: (
    originalUrl: string,
    options: ImageOptimizationOptions = {}
  ): string => {
    if (!originalUrl) return originalUrl
    
    const { quality = 80, format = 'webp', width, height } = options
    
    // Unsplash画像の最適化
    if (originalUrl.includes('images.unsplash.com')) {
      let optimizedUrl = originalUrl
      
      // 既存のパラメータを維持しつつ最適化パラメータを追加
      const url = new URL(originalUrl)
      
      if (width) url.searchParams.set('w', width.toString())
      if (height) url.searchParams.set('h', height.toString())
      url.searchParams.set('q', quality.toString())
      url.searchParams.set('fm', format)
      url.searchParams.set('fit', 'crop')
      url.searchParams.set('auto', 'format')
      
      return url.toString()
    }
    
    // その他のCDN対応（将来的にCloudinaryやImageKit等）
    // TODO: 他のCDNサービス対応を追加
    
    return originalUrl
  },

  // レスポンシブ画像セット生成
  generateResponsiveImageSet: (
    originalUrl: string,
    sizes: { width: number; label: string }[] = [
      { width: 400, label: '1x' },
      { width: 800, label: '2x' }
    ]
  ): { src: string; srcSet: string; sizes: string } => {
    const srcSet = sizes
      .map(size => `${imageOptimization.optimizeImageUrl(originalUrl, { width: size.width })} ${size.width}w`)
      .join(', ')
    
    return {
      src: imageOptimization.optimizeImageUrl(originalUrl, { width: 400 }),
      srcSet,
      sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px'
    }
  },

  // 画像の遅延読み込み設定
  getLazyLoadingProps: (isAboveFold: boolean = false) => ({
    loading: isAboveFold ? 'eager' as const : 'lazy' as const,
    decoding: 'async' as const
  }),

  // 画像エラー時のフォールバック
  getErrorFallback: (type: 'celebrity' | 'location' | 'item' | 'episode'): string => {
    const fallbacks = {
      celebrity: '/placeholder-celebrity.jpg',
      location: '/placeholder-location.jpg',
      item: '/placeholder-item.jpg',
      episode: '/placeholder-episode.jpg'
    }
    
    return fallbacks[type]
  }
}

// SEOフレンドリーな画像コンポーネントのプロパティ生成
export const generateImageProps = (
  type: 'celebrity' | 'location' | 'item' | 'episode',
  name: string,
  imageUrl: string | null,
  options: any = {}
) => {
  const altText = imageOptimization.generateAltText[type](name, options)
  const optimizedUrl = imageUrl ? imageOptimization.optimizeImageUrl(imageUrl) : null
  const fallbackUrl = imageOptimization.getErrorFallback(type)
  
  return {
    src: optimizedUrl || fallbackUrl,
    alt: altText,
    ...imageOptimization.getLazyLoadingProps(options.isAboveFold),
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.src = fallbackUrl
    }
  }
}