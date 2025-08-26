/**
 * メインカルーセルコンポーネント
 * タレント、エピソード、ロケーションを動的表示
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Users, MapPin, Play, Calendar, Star, ExternalLink } from 'lucide-react'

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

interface CarouselSection {
  title: string
  subtitle: string
  icon: React.ElementType
  color: string
  bgGradient: string
  items: (Celebrity | Episode | Location)[]
  type: 'celebrity' | 'episode' | 'location'
}

const FeaturedCarousel: React.FC = () => {
  const [currentSection, setCurrentSection] = useState(0)
  const [currentItems, setCurrentItems] = useState<{ [key: string]: number }>({ 0: 0, 1: 0, 2: 0 })
  const [data, setData] = useState<CarouselSection[]>([])
  const [loading, setLoading] = useState(true)

  // カルーセルセクション定義
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
    }
  ]

  // データ取得（実装時にSupabaseから取得）
  useEffect(() => {
    const loadData = async () => {
      try {
        // モックデータ（実装時はSupabaseから取得）
        const mockData: CarouselSection[] = [
          {
            ...sections[0],
            items: [
              { id: '1', name: 'よにのちゃんねる', slug: 'yonino', image_url: 'https://via.placeholder.com/200x200', group_name: 'ジャニーズ', episode_count: 150 },
              { id: '2', name: '二宮和也', slug: 'ninomiya', image_url: 'https://via.placeholder.com/200x200', group_name: '嵐', episode_count: 89 },
              { id: '3', name: '中丸雄一', slug: 'nakamaru', image_url: 'https://via.placeholder.com/200x200', group_name: 'KAT-TUN', episode_count: 78 },
              { id: '4', name: '山田涼介', slug: 'yamada', image_url: 'https://via.placeholder.com/200x200', group_name: 'Hey! Say! JUMP', episode_count: 65 }
            ] as Celebrity[]
          },
          {
            ...sections[1],
            items: [
              { id: '1', title: 'よにの朝ごはん #112', date: '2024-08-20', thumbnail_url: 'https://via.placeholder.com/300x200', view_count: 250000, duration: '15:30', celebrities: { name: 'よにのちゃんねる', slug: 'yonino' } },
              { id: '2', title: '聖地巡礼 in 渋谷', date: '2024-08-18', thumbnail_url: 'https://via.placeholder.com/300x200', view_count: 180000, duration: '12:45', celebrities: { name: '二宮和也', slug: 'ninomiya' } },
              { id: '3', title: 'カフェ巡り企画', date: '2024-08-15', thumbnail_url: 'https://via.placeholder.com/300x200', view_count: 320000, duration: '18:20', celebrities: { name: '山田涼介', slug: 'yamada' } }
            ] as Episode[]
          },
          {
            ...sections[2],
            items: [
              { id: '1', name: '挽肉と米', address: '東京都渋谷区道玄坂', image_url: 'https://via.placeholder.com/300x200', episode_count: 5, tabelog_url: 'https://tabelog.com/example', description: 'よにのちゃんねるで話題のハンバーグ店' },
              { id: '2', name: 'Paul Bassett 新宿店', address: '東京都新宿区', image_url: 'https://via.placeholder.com/300x200', episode_count: 3, description: '人気のコーヒーショップ' },
              { id: '3', name: 'ル・パン・コティディアン', address: '東京都港区', image_url: 'https://via.placeholder.com/300x200', episode_count: 4, tabelog_url: 'https://tabelog.com/example2', description: 'おしゃれなベーカリーカフェ' }
            ] as Location[]
          }
        ]

        setData(mockData)
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
    setCurrentItems(prev => ({
      ...prev,
      [sectionIndex]: (prev[sectionIndex] + 1) % (data[sectionIndex]?.items.length || 1)
    }))
  }

  const prevItem = (sectionIndex: number) => {
    setCurrentItems(prev => ({
      ...prev,
      [sectionIndex]: prev[sectionIndex] === 0 ? (data[sectionIndex]?.items.length || 1) - 1 : prev[sectionIndex] - 1
    }))
  }

  const renderCelebrityCard = (celebrity: Celebrity) => (
    <Link to={`/celebrities/${celebrity.slug}`} key={celebrity.id}>
      <div className="relative group cursor-pointer">
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
          <div className="relative">
            <img 
              src={celebrity.image_url || 'https://via.placeholder.com/200x200'} 
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

  const renderLocationCard = (location: Location) => (
    <Link to={`/locations/${location.id}`} key={location.id}>
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
      <div className={`relative bg-gradient-to-r ${currentSectionData.bgGradient} rounded-3xl p-8 mb-8`}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => prevItem(currentSection)}
            className="p-3 bg-white/80 hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-10"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>
          
          <div className="flex-1 mx-8">
            <div className="transition-all duration-500 ease-in-out">
              {currentItem && (
                <div className="max-w-md mx-auto">
                  {currentSectionData.type === 'celebrity' && renderCelebrityCard(currentItem as Celebrity)}
                  {currentSectionData.type === 'episode' && renderEpisodeCard(currentItem as Episode)}
                  {currentSectionData.type === 'location' && renderLocationCard(currentItem as Location)}
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => nextItem(currentSection)}
            className="p-3 bg-white/80 hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-10"
          >
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>
        </div>
        
        {/* アイテムインジケーター */}
        <div className="flex justify-center mt-6 space-x-1">
          {currentSectionData.items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentItems(prev => ({ ...prev, [currentSection]: index }))}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === currentItemIndex 
                  ? 'bg-white w-6' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 「もっと見る」ボタン */}
      <div className="text-center">
        <Link to={currentSectionData.type === 'celebrity' ? '/celebrities' : currentSectionData.type === 'episode' ? '/episodes' : '/locations'}>
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