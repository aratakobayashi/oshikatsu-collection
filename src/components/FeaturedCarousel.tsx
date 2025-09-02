/**
 * メインカルーセルコンポーネント
 * タレント、エピソード、ロケーションを動的表示
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Users, MapPin, Play, Calendar, Star, ExternalLink, Package } from 'lucide-react'
import { db } from '../lib/supabase'

interface Celebrity {
  id: string
  name: string
  slug: string
  image_url?: string | null
  group_name?: string | null
  episode_count?: number
}

interface Episode {
  id: string
  title: string
  date: string
  thumbnail_url?: string | null
  view_count?: number
  duration?: string | null
  celebrities?: { name: string, slug: string }
}

interface Location {
  id: string
  name: string
  address?: string | null
  image_url?: string | null
  episode_count?: number
  tabelog_url?: string | null
  description?: string | null
}

interface Item {
  id: string
  name: string
  brand?: string | null
  category?: string | null
  image_url?: string | null
  description?: string | null
  purchase_url?: string | null
  price?: string | null
  episode_id?: string | null
}

interface CarouselSection {
  title: string
  subtitle: string
  icon: React.ElementType
  color: string
  bgGradient: string
  items: (Celebrity | Episode | Location | Item)[]
  type: 'celebrity' | 'episode' | 'location' | 'item'
}

const FeaturedCarousel: React.FC = () => {
  const [currentSection, setCurrentSection] = useState(0)
  const [currentItems, setCurrentItems] = useState<{ [key: string]: number }>({ 0: 0, 1: 0, 2: 0, 3: 0 })
  const [data, setData] = useState<CarouselSection[]>([])
  const [loading, setLoading] = useState(true)
  const [itemsPerPage, setItemsPerPage] = useState(1)

  // カルーセルセクション定義（4セクション）
  const sections: Omit<CarouselSection, 'items'>[] = [
    {
      title: "人気のタレント・推し",
      subtitle: "よにのちゃんねる、SixTONES、Snow Man...",
      icon: Users,
      color: "text-purple-600",
      bgGradient: "from-purple-50 to-indigo-50",
      type: 'celebrity'
    },
    {
      title: "話題のエピソード",
      subtitle: "最新の動画・番組をチェック",
      icon: Play,
      color: "text-rose-600", 
      bgGradient: "from-rose-50 to-pink-50",
      type: 'episode'
    },
    {
      title: "聖地巡礼スポット",
      subtitle: "推しが訪れたカフェ・レストラン",
      icon: MapPin,
      color: "text-green-600",
      bgGradient: "from-green-50 to-emerald-50", 
      type: 'location'
    },
    {
      title: "推しアイテム",
      subtitle: "愛用コスメ・ファッション・グッズ",
      icon: Package,
      color: "text-orange-600",
      bgGradient: "from-orange-50 to-amber-50",
      type: 'item'
    }
  ]

  // 画面サイズに応じた表示アイテム数の更新
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth >= 1024) setItemsPerPage(3) // PC: 3枚
        else if (window.innerWidth >= 768) setItemsPerPage(2)  // タブレット: 2枚
        else setItemsPerPage(1) // スマホ: 1枚
      }
    }

    updateItemsPerPage()
    window.addEventListener('resize', updateItemsPerPage)
    return () => window.removeEventListener('resize', updateItemsPerPage)
  }, [])

  // Supabaseからリアルデータを取得
  useEffect(() => {
    const loadData = async () => {
      try {
        // Supabaseから実データを並行取得（4種類）
        const [celebritiesData, episodesData, locationsData, itemsData] = await Promise.all([
          db.celebrities.getAll(),
          db.episodes.getAll(), 
          db.locations.getAll(),
          db.items.getAll()
        ])

        // 実データでCarouselSectionを構築（4セクション）
        const realData: CarouselSection[] = [
          {
            ...sections[0],
            items: celebritiesData.slice(0, 9) as Celebrity[] // 上位9名を表示
          },
          {
            ...sections[1], 
            items: episodesData.slice(0, 6) as Episode[] // 最新6エピソード
          },
          {
            ...sections[2],
            items: locationsData.slice(0, 9) as Location[] // 人気9店舗
          },
          {
            ...sections[3],
            items: itemsData.slice(0, 9) as Item[] // 人気9アイテム
          }
        ]

        setData(realData)
        setLoading(false)
      } catch (error) {
        console.error('データ取得エラー:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // セクション自動切り替え
  useEffect(() => {
    const sectionInterval = setInterval(() => {
      setCurrentSection((prev) => (prev + 1) % sections.length)
    }, 8000) // 8秒ごとにセクション切り替え

    return () => clearInterval(sectionInterval)
  }, [sections.length])

  // アイテム自動切り替え  
  useEffect(() => {
    const itemInterval = setInterval(() => {
      setCurrentItems(prev => {
        const newItems = { ...prev }
        Object.keys(newItems).forEach(key => {
          const sectionIndex = parseInt(key)
          const maxItems = data[sectionIndex]?.items.length || 0
          if (maxItems > 0) {
            newItems[key] = (prev[key] + 1) % maxItems
          }
        })
        return newItems
      })
    }, 4000) // 4秒ごとにアイテム切り替え

    return () => clearInterval(itemInterval)
  }, [data])

  const nextItem = (sectionIndex: number) => {
    setCurrentItems(prev => {
      const maxIndex = Math.max(0, (data[sectionIndex]?.items.length || 0) - itemsPerPage)
      return {
        ...prev,
        [sectionIndex]: Math.min(prev[sectionIndex] + itemsPerPage, maxIndex)
      }
    })
  }

  const prevItem = (sectionIndex: number) => {
    setCurrentItems(prev => ({
      ...prev,
      [sectionIndex]: Math.max(0, prev[sectionIndex] - itemsPerPage)
    }))
  }

  const renderCelebrityCard = (celebrity: Celebrity) => (
    <Link to={`/celebrities/${celebrity.slug}`} key={celebrity.id}>
      <div className="relative group cursor-pointer">
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
          <div className="relative">
            <img 
              src={celebrity.image_url || '/placeholder-celebrity.jpg'} 
              alt={celebrity.name}
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
              {celebrity.episode_count}件
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg text-gray-900 mb-1">{celebrity.name}</h3>
            <p className="text-sm text-gray-600">{celebrity.group_name}</p>
          </div>
        </div>
      </div>
    </Link>
  )

  const renderEpisodeCard = (episode: Episode) => (
    <Link to={`/episodes/${episode.id}`} key={episode.id}>
      <div className="relative group cursor-pointer">
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
          <div className="relative">
            <img 
              src={episode.thumbnail_url || 'https://via.placeholder.com/300x200'} 
              alt={episode.title}
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
              {episode.duration}
            </div>
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-gray-700 flex items-center">
              <Play className="h-3 w-3 mr-1" />
              {episode.view_count?.toLocaleString()}
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
              <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{episode.title}</h3>
            <p className="text-sm text-gray-600 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(episode.date).toLocaleDateString('ja-JP')}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )

  const const renderLocationCard = (item: Location) => (
    <div key={item.id} className="w-72 flex-shrink-0 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
      <div className="h-48 bg-gray-200 relative">
        <img 
          src={item.image_url || '/placeholder-location.jpg'} 
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/placeholder-location.jpg'
          }}
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
          {item.episode_count || 0}回登場
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-1">{item.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{item.address || '住所未登録'}</p>
        <p className="text-xs text-gray-500 line-clamp-2">{item.description || '詳しい説明は準備中です'}</p>
      </div>
    </div>
  )} key={location.id}>
      <div className="relative group cursor-pointer">
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
          <div className="relative">
            <img 
              src={location.image_url || 'https://via.placeholder.com/300x200'} 
              alt={location.name}
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
              {location.episode_count}回登場
            </div>
            {location.tabelog_url && (
              <div className="absolute bottom-2 right-2">
                <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  予約
                </div>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg text-gray-900 mb-1">{location.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{location.address}</p>
            <p className="text-xs text-gray-500 line-clamp-2">{location.description}</p>
          </div>
        </div>
      </div>
    </Link>
  )

  const renderItemCard = (item: Item) => (
    <Link to={`/items/${item.id}`} key={item.id}>
      <div className="relative group cursor-pointer">
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
          <div className="relative">
            <img 
              src={item.image_url || 'https://images.unsplash.com/photo-1556740727-e2df77cd753b?w=300&h=200&fit=crop'} 
              alt={item.name}
              className="w-full h-48 object-cover"
            />
            {item.brand && (
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white">
                {item.brand}
              </div>
            )}
            {item.price && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                {item.price}
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg text-gray-900 mb-1">{item.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{item.category || 'アイテム'}</p>
            <p className="text-xs text-gray-500 line-clamp-2">
              {item.description || '推しが愛用するこだわりのアイテム'}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">コンテンツを読み込み中...</p>
        </div>
      </div>
    )
  }

  const currentSectionData = data[currentSection]
  if (!currentSectionData) return null

  const currentItemIndex = currentItems[currentSection] || 0
  const currentItem = currentSectionData.items[currentItemIndex]

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
      {/* セクションヘッダー */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <currentSectionData.icon className={`h-8 w-8 ${currentSectionData.color} mr-3`} />
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            {currentSectionData.title}
          </h2>
        </div>
        <p className="text-lg text-gray-600 mb-6">{currentSectionData.subtitle}</p>
        
        {/* セクション切り替えドット */}
        <div className="flex justify-center space-x-2 mb-8">
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSection(index)}
              className={`h-3 w-3 rounded-full transition-all duration-300 ${
                index === currentSection 
                  ? 'bg-rose-500 w-8' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* メインカルーセル */}
      <div className={`relative bg-gradient-to-r ${currentSectionData.bgGradient} rounded-3xl p-4 md:p-8 mb-8`}>
        <div className="flex items-center justify-between">
          {/* 前へボタン */}
          <button
            onClick={() => prevItem(currentSection)}
            className="p-2 md:p-3 bg-white/80 hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-10 flex-shrink-0"
            disabled={currentItemIndex === 0}
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-700" />
          </button>
          
          {/* カード表示エリア */}
          <div className="flex-1 mx-2 md:mx-8 overflow-hidden">
            <div className="transition-all duration-500 ease-in-out">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {currentSectionData.items
                  .slice(currentItemIndex, currentItemIndex + itemsPerPage)
                  .map((item) => (
                    <div key={item.id} className="w-full">
                      {currentSectionData.type === 'celebrity' && renderCelebrityCard(item as Celebrity)}
                      {currentSectionData.type === 'episode' && renderEpisodeCard(item as Episode)}
                      {currentSectionData.type === 'location' && renderLocationCard(item as Location)}
                      {currentSectionData.type === 'item' && renderItemCard(item as Item)}
                    </div>
                  ))}
              </div>
            </div>
          </div>
          
          {/* 次へボタン */}
          <button
            onClick={() => nextItem(currentSection)}
            className="p-2 md:p-3 bg-white/80 hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-10 flex-shrink-0"
            disabled={currentItemIndex >= (currentSectionData.items.length - itemsPerPage)}
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-gray-700" />
          </button>
        </div>
        
        {/* ページインジケーター */}
        <div className="flex justify-center mt-6 space-x-1">
          {Array.from({ length: Math.ceil(currentSectionData.items.length / itemsPerPage) }).map((_, pageIndex) => (
            <button
              key={pageIndex}
              onClick={() => setCurrentItems(prev => ({ ...prev, [currentSection]: pageIndex * itemsPerPage }))}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                Math.floor(currentItemIndex / itemsPerPage) === pageIndex
                  ? 'bg-white w-6' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 「もっと見る」ボタン */}
      <div className="text-center">
        <Link to={currentSectionData.type === 'celebrity' ? '/celebrities' : currentSectionData.type === 'episode' ? '/episodes' : currentSectionData.type === 'location' ? '/locations' : '/items'}>
          <button className={`inline-flex items-center px-8 py-4 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-full text-gray-700 hover:text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
            {currentSectionData.title}をもっと見る
            <ChevronRight className="h-5 w-5 ml-2" />
          </button>
        </Link>
      </div>
    </div>
  )
}

export default FeaturedCarousel