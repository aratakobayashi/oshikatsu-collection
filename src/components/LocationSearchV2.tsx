import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, MapPin, Heart, ExternalLink, Sparkles, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { debounce } from 'lodash'

interface LocationWithDetails {
  id: string
  name: string
  address: string
  category: string
  description: string
  image_urls: string[]
  reservation_url: string
  episode_locations?: Array<{
    episodes: {
      id: string
      title: string
      date: string
      celebrity_id: string
      celebrities: {
        id: string
        name: string
        slug: string
      }
    }
  }>
  episodes_count?: number
}

interface Celebrity {
  id: string
  name: string
  slug: string
}

export default function LocationSearchV2() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'restaurant' | 'cafe' | 'shop' | 'tourist'>('all')
  const [activeCelebrity, setActiveCelebrity] = useState<string>('all')
  const [results, setResults] = useState<LocationWithDetails[]>([])
  const [popularLocations, setPopularLocations] = useState<LocationWithDetails[]>([])
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // 初期データ取得
  useEffect(() => {
    const initLoad = async () => {
      setInitialLoading(true)
      try {
        // 人気の店舗を取得
        const { data: locationsData } = await supabase
          .from('locations')
          .select(`
            *,
            episode_locations(
              episodes(
                id,
                title,
                date,
                celebrity_id,
                celebrities(id, name, slug)
              )
            )
          `)
          .limit(100)

        // 推しリストを取得
        const { data: celebritiesData } = await supabase
          .from('celebrities')
          .select('id, name, slug')
          .eq('status', 'active')
          .limit(50)

        const processedLocations = (locationsData || []).map(location => ({
          ...location,
          episodes_count: location.episode_locations?.length || 0
        }))

        setPopularLocations(processedLocations)
        setCelebrities(celebritiesData || [])
        
        // デバッグ用：全店舗数と一部の店舗名を表示
        console.log('📊 Total locations loaded:', processedLocations.length)
        if (processedLocations.length > 0) {
          console.log('📍 Sample locations:', processedLocations.slice(0, 10).map(l => l.name).join(', '))
          
          // カテゴリ分析：各店舗がどのカテゴリに該当するかを表示
          const categoryAnalysis = {}
          const uncategorized = []
          
          processedLocations.forEach(location => {
            const inferredCategory = inferCategoryFromName(location.name)
            if (inferredCategory === 'other') {
              uncategorized.push(location.name)
            }
            categoryAnalysis[inferredCategory] = (categoryAnalysis[inferredCategory] || 0) + 1
          })
          
          console.log('📊 Category analysis:', categoryAnalysis)
          if (uncategorized.length > 0) {
            console.log('❓ Uncategorized locations:', uncategorized.slice(0, 10).join(', '))
          }
        }

        // URLパラメータからの検索クエリを読み取り
        const searchFromUrl = searchParams.get('search')
        if (searchFromUrl) {
          setSearchQuery(searchFromUrl)
          performSearch(searchFromUrl, 'all', 'all')
        }
      } catch (error) {
        console.error('Error fetching initial data:', error)
      } finally {
        setInitialLoading(false)
      }
    }
    initLoad()
  }, [])

  // 検索実行
  const performSearch = async (query: string, categoryFilter: string, celebrityFilter: string) => {
    if (!query.trim() && categoryFilter === 'all' && celebrityFilter === 'all') {
      setResults([])
      return
    }

    setLoading(true)
    try {
      let supabaseQuery = supabase
        .from('locations')
        .select(`
          *,
          episode_locations(
            episodes(
              id,
              title,
              date,
              celebrity_id,
              celebrities(id, name, slug)
            )
          )
        `)

      // テキスト検索
      if (query.trim()) {
        supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,address.ilike.%${query}%,description.ilike.%${query}%`)
      }

      // カテゴリフィルター（categoryカラムが存在しない場合のフォールバック対応）
      if (categoryFilter !== 'all') {
        // まずcategoryカラムを使用した検索を試行
        supabaseQuery = supabaseQuery.or(`category.ilike.%${categoryFilter}%,name.ilike.%${categoryFilter}%`)
      }

      console.log('🔍 LocationSearchV2: Performing search', { query, categoryFilter, celebrityFilter })
      let { data, error } = await supabaseQuery.limit(100)
      
      // categoryカラムが存在しない場合のフォールバック検索
      if (error && error.code === '42703') {
        console.log('🔄 Category column not found, fallback to name-only search', { categoryFilter })
        
        // 新しいクエリを作成
        let fallbackQuery = supabase
          .from('locations')
          .select(`
            *,
            episode_locations(
              episodes(
                id,
                title,
                date,
                celebrity_id,
                celebrities(id, name, slug)
              )
            )
          `)
        
        // テキスト検索とカテゴリ検索を組み合わせ
        const conditions = []
        
        if (query.trim()) {
          conditions.push(`name.ilike.%${query}%`)
          conditions.push(`address.ilike.%${query}%`) 
          conditions.push(`description.ilike.%${query}%`)
        }
        
        if (categoryFilter !== 'all') {
          // 英語と日本語の両方でカテゴリ検索
          const categoryKeywords = getCategoryKeywords(categoryFilter)
          categoryKeywords.forEach(keyword => {
            conditions.push(`name.ilike.%${keyword}%`)
          })
        }
        
        if (conditions.length > 0) {
          fallbackQuery = fallbackQuery.or(conditions.join(','))
        }
        
        console.log('🔄 Fallback query conditions:', conditions)
        const fallbackResult = await fallbackQuery.limit(100)
        data = fallbackResult.data
        error = fallbackResult.error
        
        console.log('🔄 Fallback search result:', { 
          success: !error, 
          count: data?.length || 0,
          error: error?.message 
        })
        
        // デバッグ用：店舗名の一部を表示
        if (data && data.length > 0) {
          console.log('📍 Found locations:', data.slice(0, 5).map(l => l.name).join(', '))
        }
      }
      
      if (error) {
        console.error('Search error:', error)
        setResults([])
        return
      }
      
      let processedData = (data || []).map(location => ({
        ...location,
        episodes_count: location.episode_locations?.length || 0,
        // categoryが存在しない場合は店舗名から推測
        category: location.category || inferCategoryFromName(location.name)
      }))

      // 推しフィルター（クライアント側で実行）
      if (celebrityFilter !== 'all') {
        processedData = processedData.filter(location => 
          location.episode_locations?.some(ep => 
            ep.episodes?.celebrities?.id === celebrityFilter
          )
        )
      }

      // 人気順でソート（エピソード数順）
      processedData.sort((a, b) => (b.episodes_count || 0) - (a.episodes_count || 0))

      setResults(processedData)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // デバウンス検索
  const debouncedSearch = useCallback(
    debounce((query: string, category: string, celebrity: string) => {
      performSearch(query, category, celebrity)
      if (query.trim()) {
        setSearchParams({ search: query })
      } else {
        setSearchParams({})
      }
    }, 300),
    []
  )

  // 検索入力処理
  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    debouncedSearch(value, activeFilter, activeCelebrity)
  }

  // フィルター変更処理
  const handleFilterChange = (filter: typeof activeFilter) => {
    setActiveFilter(filter)
    
    // 「すべて」の場合は検索をスキップして全データを表示
    if (filter === 'all' && !searchQuery.trim() && activeCelebrity === 'all') {
      console.log('📋 Showing all locations:', popularLocations.length)
      setResults(popularLocations)
      return
    }
    
    performSearch(searchQuery, filter, activeCelebrity)
  }

  const handleCelebrityChange = (celebrityId: string) => {
    setActiveCelebrity(celebrityId)
    performSearch(searchQuery, activeFilter, celebrityId)
  }

  // 店舗名からカテゴリを推測する関数（強化版）
  const inferCategoryFromName = (name: string) => {
    const lowerName = name.toLowerCase()
    
    // Restaurant keywords (大幅拡張)
    const restaurantKeywords = [
      'レストラン', 'restaurant', 'dining', '食事', '料理', 'グリル', 'ビストロ', 'イタリアン', '中華', '和食', 'フレンチ',
      '焼肉', 'ラーメン', 'うどん', 'そば', '寿司', '天ぷら', '定食', '居酒屋', 'バル', 'tavern', '酒場', '食堂',
      'kitchen', 'diner', 'grill', 'bar', 'pub', 'bistro',
      // 店舗名の末尾パターン
      '屋', '亭', '処', '軒', '家', '庵', 'や', 'ボキューズ', 'ぼきゅーず',
      // 料理ジャンル
      'ごはん', 'めし', '玄', 'うし', '牛', 'ビーフ', 'beef', 'ステーキ', 'steak',
      // 有名店・チェーン店
      'ushihachi', 'うしはち', '今半', 'いまはん', '風香', 'ふうか', 
      'cocktail', 'カクテル', 'works', 'ワークス', 'すき焼き', 'しゃぶしゃぶ'
    ]
    
    // Cafe keywords (アイス・甘味処も含む)
    const cafeKeywords = [
      'カフェ', 'cafe', 'coffee', 'コーヒー', '喫茶', 'スタバ', 'starbucks', 'タリーズ', 'ドトール', 'tully', 'doutor',
      '珈琲', 'tea', 'ティー', 'latte', 'ラテ', 'cappuccino', 'espresso', 'mocha', 'モカ', 'frappuccino', 'フラペチーノ',
      // アイスクリーム・甘味
      'blue seal', 'ブルーシール', 'ice', 'アイス', 'cream', 'クリーム', 'gelato', 'ジェラート',
      'パフェ', 'パンケーキ', 'pancake', 'ワッフル', 'waffle'
    ]
    
    // Shop keywords (和菓子屋・伝統的な店も含む)
    const shopKeywords = [
      'ショップ', 'shop', 'store', '店舗', '専門店', 'boutique', 'ブティック', '雑貨', 'セレクト',
      'マート', 'mart', 'market', 'デパート', '百貨店', 'アパレル', 'fashion', 'ファッション', 'clothes', '服',
      'コンビニ', 'convenience', 'drugstore', 'pharmacy', '薬局',
      // 和菓子・伝統的な店
      '堂', 'どう', '本舗', 'ほんぽ', '商店', '商会', '呉服', '骨董', '古美術',
      // 有名デパート・百貨店
      '三越', 'みつこし', 'mitsukoshi', '伊勢丹', '高島屋', '大丸', '西武', '東急', 'そごう'
    ]
    
    // Hotel keywords
    const hotelKeywords = ['ホテル', 'hotel', 'inn', '宿泊', 'リゾート', 'resort', '旅館', 'ryokan']
    
    // Venue keywords
    const venueKeywords = ['会場', 'venue', 'hall', 'ホール', '劇場', 'theater', 'スタジオ', 'studio']
    
    // Tourist/Entertainment keywords
    const touristKeywords = [
      '水族館', 'aquarium', '動物園', 'zoo', '博物館', 'museum', '美術館', 'gallery',
      '公園', 'park', 'パーク', '庭園', 'garden', '植物園', 'タワー', 'tower',
      'ビーチ', 'beach', '海岸', '海水浴場', '展望台', 'wall', 'ウォール',
      '城', 'castle', '神社', 'shrine', '寺', 'temple', '稲荷', '別院',
      '迎賓館', '記念館', 'memorial', 'スカイツリー', 'tokyo tower', '東京タワー'
    ]
    
    if (restaurantKeywords.some(keyword => lowerName.includes(keyword))) return 'restaurant'
    if (cafeKeywords.some(keyword => lowerName.includes(keyword))) return 'cafe'
    if (shopKeywords.some(keyword => lowerName.includes(keyword))) return 'shop'
    if (hotelKeywords.some(keyword => lowerName.includes(keyword))) return 'hotel'
    if (venueKeywords.some(keyword => lowerName.includes(keyword))) return 'venue'
    if (touristKeywords.some(keyword => lowerName.includes(keyword))) return 'tourist'
    
    return 'other'
  }

  // カテゴリ別検索キーワードを取得
  const getCategoryKeywords = (category: string) => {
    switch (category) {
      case 'restaurant':
        return [
          'レストラン', 'restaurant', 'dining', '食事', '料理', 
          'グリル', 'ビストロ', 'イタリアン', '中華', '和食', 'フレンチ',
          '焼肉', 'ラーメン', 'うどん', 'そば', '寿司', '天ぷら',
          '定食', '居酒屋', 'バル', 'tavern', '酒場', '食堂',
          'kitchen', 'diner', 'grill', 'bar', 'pub', 'bistro',
          '屋', '亭', '処', '軒', '家', '庵', 'や', 'ボキューズ',
          'ごはん', 'めし', '玄', 'うし', '牛', 'ビーフ', 'beef', 'ステーキ', 'steak',
          'ushihachi', 'うしはち', '今半', 'いまはん', '風香', 'ふうか', 
          'cocktail', 'カクテル', 'works', 'すき焼き', 'しゃぶしゃぶ'
        ]
      case 'cafe':
        return [
          'カフェ', 'cafe', 'coffee', 'コーヒー', '喫茶', 
          'スタバ', 'starbucks', 'タリーズ', 'ドトール', 'tully', 'doutor',
          '珈琲', 'tea', 'ティー', 'latte', 'ラテ', 'cappuccino',
          'espresso', 'mocha', 'モカ', 'frappuccino', 'フラペチーノ',
          'blue seal', 'ブルーシール', 'ice', 'アイス', 'cream', 'ジェラート',
          'パフェ', 'パンケーキ', 'pancake', 'ワッフル', 'waffle'
        ]
      case 'shop':
        return [
          'ショップ', 'shop', 'store', '店舗', '専門店', 
          'boutique', 'ブティック', '雑貨', 'セレクト',
          'マート', 'mart', 'market', 'デパート', '百貨店',
          'アパレル', 'fashion', 'ファッション', 'clothes', '服',
          'コンビニ', 'convenience', 'drugstore', 'pharmacy', '薬局',
          '堂', 'どう', '本舗', 'ほんぽ', '商店', '商会',
          '三越', 'みつこし', 'mitsukoshi', '伊勢丹', '高島屋', '大丸', '西武', '東急'
        ]
      case 'hotel':
        return ['ホテル', 'hotel', 'inn', '宿泊', 'リゾート', 'resort', '旅館', 'ryokan']
      case 'venue':
        return ['会場', 'venue', 'hall', 'ホール', '劇場', 'theater', 'スタジオ', 'studio']
      case 'tourist':
        return [
          '水族館', 'aquarium', '動物園', 'zoo', '博物館', 'museum', '美術館', 'gallery',
          '公園', 'park', 'パーク', '庭園', 'garden', '植物園', 'タワー', 'tower',
          'ビーチ', 'beach', '海岸', '海水浴場', '展望台', 'wall', 'ウォール',
          '城', 'castle', '神社', 'shrine', '寺', 'temple', '稲荷', '別院',
          '迎賓館', '記念館', 'memorial', 'スカイツリー', 'tokyo tower'
        ]
      default:
        return [category]
    }
  }

  // カテゴリラベル
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'restaurant': return 'レストラン'
      case 'cafe': return 'カフェ'
      case 'shop': return 'ショップ'
      case 'hotel': return 'ホテル'
      case 'tourist': return '観光・娯楽'
      default: return 'その他'
    }
  }

  // カテゴリ色
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'restaurant': return 'bg-orange-500/90'
      case 'cafe': return 'bg-amber-500/90'  
      case 'shop': return 'bg-purple-500/90'
      case 'hotel': return 'bg-blue-500/90'
      case 'tourist': return 'bg-green-500/90'
      default: return 'bg-gray-500/90'
    }
  }

  // カテゴリ別高品質プレースホルダー画像
  const getCategoryImage = (category: string, locationId: string) => {
    const restaurantImages = [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop', // レストラン内装
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop', // エレガントなレストラン
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=250&fit=crop', // 高級レストラン
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=250&fit=crop', // 日本料理
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop', // 料理プレート
    ]
    
    const cafeImages = [
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=250&fit=crop', // カフェラテ
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=250&fit=crop', // カフェテーブル
      'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=250&fit=crop', // コーヒーとケーキ
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=250&fit=crop', // モダンカフェ
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400&h=250&fit=crop', // カフェ外観
    ]
    
    const shopImages = [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop', // ショッピング
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=250&fit=crop', // ブティック
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop', // 店舗インテリア
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=250&fit=crop', // ファッション店
      'https://images.unsplash.com/photo-1555529902-1974e9dd9e97?w=400&h=250&fit=crop', // アクセサリー店
    ]
    
    const hotelImages = [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=250&fit=crop', // ホテルロビー
      'https://images.unsplash.com/photo-1587985064135-0366536eab42?w=400&h=250&fit=crop', // 高級ホテル
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=250&fit=crop', // ホテル外観
    ]
    
    const touristImages = [
      'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=400&h=250&fit=crop', // 水族館
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop', // 公園
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=250&fit=crop', // 美術館
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=250&fit=crop', // 神社
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=250&fit=crop', // ビーチ
    ]

    const getImageArray = (cat: string) => {
      switch (cat?.toLowerCase()) {
        case 'restaurant': return restaurantImages
        case 'cafe': return cafeImages  
        case 'shop': return shopImages
        case 'hotel': return hotelImages
        case 'tourist': return touristImages
        default: return restaurantImages // デフォルト
      }
    }

    const images = getImageArray(category)
    const index = parseInt(locationId.replace(/[^0-9]/g, '') || '0') % images.length
    return images[index]
  }

  // 最新の推しを取得
  const getLatestCelebrity = (location: LocationWithDetails) => {
    if (!location.episode_locations || location.episode_locations.length === 0) return null
    
    const latestEpisode = location.episode_locations
      .filter(ep => ep.episodes)
      .sort((a, b) => new Date(b.episodes.date).getTime() - new Date(a.episodes.date).getTime())[0]

    return latestEpisode?.episodes?.celebrities || null
  }

  // 場所カードコンポーネント
  const LocationCard = ({ location }: { location: LocationWithDetails }) => {
    const latestCelebrity = getLatestCelebrity(location)
    
    return (
      <Link to={`/locations/${location.id}`} className="block">
        <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group h-full">
          {/* 画像エリア */}
          <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
            {location.image_urls && location.image_urls.length > 0 ? (
              <img
                src={location.image_urls[0]}
                alt={location.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = getCategoryImage(location.category, location.id)
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="h-16 w-16 text-gray-300" />
              </div>
            )}
            
            {/* カテゴリバッジ（右上） */}
            <div className="absolute top-3 right-3">
              <span className={`px-3 py-1 text-xs font-medium rounded-full text-white ${getCategoryColor(location.category)}`}>
                {getCategoryLabel(location.category)}
              </span>
            </div>

            {/* 訪問回数バッジ（左上） */}
            {location.episodes_count && location.episodes_count > 0 && (
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 text-xs font-medium bg-red-500/90 text-white rounded-full">
                  {location.episodes_count}回訪問
                </span>
              </div>
            )}
          </div>

          {/* 情報エリア */}
          <div className="p-4">
            {/* 店舗名 */}
            <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-rose-500 transition-colors line-clamp-1">
              {location.name}
            </h3>
            
            {/* 住所 */}
            <div className="flex items-start space-x-2 text-sm text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{location.address}</span>
            </div>

            {/* 最新の推し */}
            {latestCelebrity && (
              <div className="flex items-center space-x-2 text-sm text-rose-600 mb-2">
                <Heart className="h-4 w-4" />
                <span>最新: {latestCelebrity.name}</span>
              </div>
            )}

            {/* 説明文 */}
            {location.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {location.description}
              </p>
            )}

            {/* 予約ボタン */}
            {location.reservation_url && (
              <div className="mt-3">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    window.open(location.reservation_url, '_blank')
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>予約・詳細</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </Link>
    )
  }

  const displayData = searchQuery.trim() || activeFilter !== 'all' || activeCelebrity !== 'all' ? results : popularLocations

  return (
    <div className="min-h-screen bg-gray-50">
      {/* コンパクトヘッダー */}
      <div className="bg-white border-b sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* タイトル */}
          <div className="text-center mb-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              聖地巡礼スポット
            </h1>
          </div>

          {/* 統合検索バー */}
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="店舗名・住所・推し名で検索..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-base border border-gray-200 rounded-full focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
              />
            </div>

            {/* フィルター */}
            <div className="flex flex-wrap justify-center gap-2">
              {/* カテゴリフィルター */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleFilterChange('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    activeFilter === 'all' 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => handleFilterChange('restaurant')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    activeFilter === 'restaurant' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  レストラン
                </button>
                <button
                  onClick={() => handleFilterChange('cafe')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    activeFilter === 'cafe' 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  カフェ
                </button>
                <button
                  onClick={() => handleFilterChange('shop')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    activeFilter === 'shop' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ショップ
                </button>
                <button
                  onClick={() => handleFilterChange('tourist')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    activeFilter === 'tourist' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  観光・娯楽
                </button>
              </div>

              {/* 推しフィルター */}
              {celebrities.length > 0 && (
                <select
                  value={activeCelebrity}
                  onChange={(e) => handleCelebrityChange(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full focus:border-rose-400 focus:outline-none"
                >
                  <option value="all">👥 すべての推し</option>
                  {celebrities.slice(0, 10).map(celebrity => (
                    <option key={celebrity.id} value={celebrity.id}>
                      {celebrity.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 検索状態の表示 */}
            {(searchQuery.trim() || activeFilter !== 'all' || activeCelebrity !== 'all') && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {loading ? '検索中...' : `${displayData.length}件の結果`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* セクションタイトル */}
        {!searchQuery.trim() && activeFilter === 'all' && activeCelebrity === 'all' && (
          <div className="mb-6 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">人気の聖地巡礼スポット</h2>
          </div>
        )}

        {/* 結果グリッド */}
        {initialLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayData.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        )}

        {/* 結果なし */}
        {!loading && !initialLoading && displayData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <MapPin size={48} className="mx-auto" />
            </div>
            <p className="text-gray-600">該当する店舗が見つかりませんでした</p>
            <p className="text-sm text-gray-500 mt-2">別のキーワードでお試しください</p>
          </div>
        )}
      </div>
    </div>
  )
}