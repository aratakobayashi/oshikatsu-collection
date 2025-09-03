/**
 * 画像処理ユーティリティ
 * 404エラーやロード失敗に対する堅牢な画像ハンドリング
 */

// フォールバック画像の定義
export const FALLBACK_IMAGES = {
  celebrity: '/placeholder-celebrity.jpg',
  location: '/placeholder-location.jpg', 
  item: '/placeholder-item.jpg',
  video: '/placeholder-video.jpg',
  general: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop&auto=format'
} as const

export type FallbackImageType = keyof typeof FALLBACK_IMAGES

/**
 * 画像URL検証とフォールバック処理
 */
export const getValidImageUrl = async (
  imageUrl: string | undefined | null,
  fallbackType: FallbackImageType = 'general'
): Promise<string> => {
  if (!imageUrl) {
    return FALLBACK_IMAGES[fallbackType]
  }

  // Unsplash URL の検証と修正
  if (imageUrl.includes('images.unsplash.com')) {
    const validatedUrl = validateUnsplashUrl(imageUrl)
    if (validatedUrl !== imageUrl) {
      console.log(`[ImageUtils] Unsplash URL updated: ${imageUrl} -> ${validatedUrl}`)
      return validatedUrl
    }
  }

  // 画像の存在確認（オプション - パフォーマンス考慮）
  try {
    const response = await fetch(imageUrl, { method: 'HEAD', mode: 'no-cors' })
    if (response.ok || response.type === 'opaque') {
      return imageUrl
    }
  } catch (error) {
    console.log(`[ImageUtils] Image validation failed: ${imageUrl}`)
  }

  return FALLBACK_IMAGES[fallbackType]
}

/**
 * Unsplash URLの検証と修正
 * 古い/無効なUnsplash URLを修正
 */
export const validateUnsplashUrl = (url: string): string => {
  if (!url.includes('images.unsplash.com')) {
    return url
  }

  // 既知の問題のあるUnsplash画像IDリスト
  const problematicIds = [
    '1480714378408-67cf0d13bc1f',
    '1616662813165-fbd79d71b4b5', 
    '1569163139394-de4798aa62b6',
    '1565299624946-b28f40a0ca4b',
    '1574263867128-a3d06c4b2110',
    '1555529902-1974e9dd9e97'
  ]

  // URLから画像IDを抽出
  const match = url.match(/photo-([^?]+)/)
  if (match && problematicIds.includes(match[1])) {
    // 代替の安定したUnsplash画像に置換
    const alternativeImages = [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1556740727-e2df77cd753b?w=400&h=300&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format'
    ]
    
    // ハッシュベースで一貫した代替画像を選択
    const hash = match[1].split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return alternativeImages[hash % alternativeImages.length]
  }

  return url
}

/**
 * React用の画像onErrorハンドラー
 */
export const createImageErrorHandler = (fallbackType: FallbackImageType = 'general') => {
  return (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = event.target as HTMLImageElement
    const currentSrc = target.src
    
    // 既にフォールバック画像の場合は無限ループを防ぐ
    if (currentSrc === FALLBACK_IMAGES[fallbackType]) {
      return
    }

    console.log(`[ImageUtils] Image failed to load: ${currentSrc}, using fallback`)
    target.src = FALLBACK_IMAGES[fallbackType]
  }
}

/**
 * 画像プリロード用ユーティリティ
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`))
    img.src = src
  })
}

/**
 * レスポンシブ画像URL生成
 */
export const getResponsiveImageUrl = (
  baseUrl: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'jpg' | 'webp' | 'avif'
  } = {}
): string => {
  if (!baseUrl.includes('unsplash.com')) {
    return baseUrl
  }

  const params = new URLSearchParams()
  
  if (options.width) params.set('w', options.width.toString())
  if (options.height) params.set('h', options.height.toString())
  if (options.quality) params.set('q', options.quality.toString())
  if (options.format) params.set('fm', options.format)
  
  params.set('fit', 'crop')
  params.set('auto', 'format')

  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}${params.toString()}`
}