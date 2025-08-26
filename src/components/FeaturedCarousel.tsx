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
  const [itemsPerPage, setItemsPerPage] = useState(1)

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

  // データ取得（実装時にSupabaseから取得）
  useEffect(() => {
    const loadData = async () => {
      try {
        // モックデータ（実装時はSupabaseから取得）
        const mockData: CarouselSection[] = [
          {
            ...sections[0],
            items: [
              { id: '1', name: 'よにのちゃんねる', slug: 'yonino', image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', group_name: 'ジャニーズ', episode_count: 150 },
              { id: '2', name: '二宮和也', slug: 'ninomiya', image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face', group_name: '嵐', episode_count: 89 },
              { id: '3', name: '中丸雄一', slug: 'nakamaru', image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face', group_name: 'KAT-TUN', episode_count: 78 },
              { id: '4', name: '山田涼介', slug: 'yamada', image_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face', group_name: 'Hey! Say! JUMP', episode_count: 65 },
              { id: '5', name: '菊池風磨', slug: 'kikuchi', image_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face', group_name: 'timelesz', episode_count: 52 },
              { id: '6', name: '森本慎太郎', slug: 'morimoto', image_url: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=200&h=200&fit=crop&crop=face', group_name: 'SixTONES', episode_count: 43 }
            ] as Celebrity[]
          },
          {
            ...sections[1],
            items: [
              { id: '1', title: 'よにの朝ごはん #112', date: '2024-08-20', thumbnail_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop', view_count: 250000, duration: '15:30', celebrities: { name: 'よにのちゃんねる', slug: 'yonino' } },
              { id: '2', title: '聖地巡礼 in 渋谷', date: '2024-08-18', thumbnail_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=250&fit=crop', view_count: 180000, duration: '12:45', celebrities: { name: '二宮和也', slug: 'ninomiya' } },
              { id: '3', title: 'カフェ巡り企画', date: '2024-08-15', thumbnail_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=250&fit=crop', view_count: 320000, duration: '18:20', celebrities: { name: '山田涼介', slug: 'yamada' } },
              { id: '4', title: '推し活グルメツアー', date: '2024-08-12', thumbnail_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=250&fit=crop', view_count: 195000, duration: '20:15', celebrities: { name: '菊池風磨', slug: 'kikuchi' } },
              { id: '5', title: '東京スイーツ散策', date: '2024-08-10', thumbnail_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=250&fit=crop', view_count: 275000, duration: '14:55', celebrities: { name: '森本慎太郎', slug: 'morimoto' } }
            ] as Episode[]
          },
          {
            ...sections[2],
            items: [
              { id: '1', name: '挽肉と米', address: '東京都渋谷区道玄坂', image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop', episode_count: 5, tabelog_url: 'https://tabelog.com/example', description: 'よにのちゃんねるで話題のハンバーグ店' },
              { id: '2', name: 'Paul Bassett 新宿店', address: '東京都新宿区', image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=250&fit=crop', episode_count: 3, description: '人気のコーヒーショップ' },
              { id: '3', name: 'ル・パン・コティディアン', address: '東京都港区', image_url: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=400&h=250&fit=crop', episode_count: 4, tabelog_url: 'https://tabelog.com/example2', description: 'おしゃれなベーカリーカフェ' },
              { id: '4', name: 'Bills 表参道', address: '東京都港区', image_url: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=400&h=250&fit=crop', episode_count: 2, tabelog_url: 'https://tabelog.com/example3', description: '有名パンケーキ専門店' },
              { id: '5', name: '青山フラワーマーケット カフェ', address: '東京都港区', image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop', episode_count: 3, description: '花と緑に囲まれたカフェ' },
              { id: '6', name: 'スターバックス 渋谷店', address: '東京都渋谷区', image_url: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=250&fit=crop', episode_count: 6, tabelog_url: 'https://tabelog.com/example4', description: '渋谷の人気カフェスポット' }
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