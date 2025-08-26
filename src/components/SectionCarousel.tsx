/**
 * セクション専用カルーセルコンポーネント
 * 各セクション（celebrities, episodes, locations, items）で共通利用
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Users, MapPin, Play, Package, ExternalLink, Calendar, Star } from 'lucide-react'

// データ型定義
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

interface SectionCarouselProps {
  title: string
  subtitle: string
  icon: React.ElementType
  color: string
  bgGradient: string
  items: (Celebrity | Episode | Location | Item)[]
  type: 'celebrity' | 'episode' | 'location' | 'item'
  linkPath: string
}

const SectionCarousel: React.FC<SectionCarouselProps> = ({
  title,
  subtitle,
  icon: Icon,
  color,
  bgGradient,
  items,
  type,
  linkPath
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(1)

  // レスポンシブ対応
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

  // 自動回転機能
  useEffect(() => {
    if (items.length <= itemsPerPage) return // アイテムが少ない場合は自動回転しない
    
    const autoRotateInterval = setInterval(() => {
      setCurrentIndex(prev => {
        const maxIndex = items.length - itemsPerPage
        return prev >= maxIndex ? 0 : prev + 1
      })
    }, 5000) // 5秒間隔で自動回転

    return () => clearInterval(autoRotateInterval)
  }, [items.length, itemsPerPage])

  const nextItem = () => {
    if (currentIndex >= items.length - itemsPerPage) return
    setCurrentIndex(prev => prev + 1)
  }

  const prevItem = () => {
    if (currentIndex <= 0) return
    setCurrentIndex(prev => prev - 1)
  }

  // カードレンダリング関数
  const renderCelebrityCard = (celebrity: Celebrity) => (
    <Link to={`/celebrities/${celebrity.slug}`} key={celebrity.id}>
      <div className="relative group cursor-pointer">
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
          <div className="relative">
            <img 
              src={celebrity.image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'} 
              alt={celebrity.name}
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
              {celebrity.episode_count || 0}回登場
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg text-gray-900 mb-1">{celebrity.name}</h3>
            <p className="text-sm text-gray-600">{celebrity.group_name || '個人'}</p>
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
              src={episode.thumbnail_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop'} 
              alt={episode.title}
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white flex items-center">
              <Play className="h-3 w-3 mr-1" />
              {episode.duration || '動画'}
            </div>
            {episode.view_count && (
              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                {(episode.view_count / 10000).toFixed(0)}万回再生
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg text-gray-900 mb-1">{episode.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{new Date(episode.date).toLocaleDateString()}</p>
            <p className="text-xs text-gray-500 line-clamp-2">
              {episode.celebrities?.name && `出演: ${episode.celebrities.name}`}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )

  const renderLocationCard = (location: Location) => {
    // 聖地巡礼スポット用の高品質プレースホルダー画像（レストラン・カフェ系）
    const getLocationPlaceholder = (index: number) => {
      const placeholders = [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop', // レストラン内装
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=250&fit=crop', // カフェテーブル
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop', // 料理
        'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400&h=250&fit=crop', // カフェ外観
        'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=250&fit=crop', // レストラン雰囲気
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=250&fit=crop', // レストランテーブル
        'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=250&fit=crop', // カフェラテ
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=250&fit=crop'  // カフェ内装
      ]
      return placeholders[index % placeholders.length]
    }

    return (
      <Link to={`/locations/${location.id}`} key={location.id}>
        <div className="relative group cursor-pointer">
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
            <div className="relative">
              <img 
                src={location.image_url || getLocationPlaceholder(parseInt(location.id))} 
                alt={location.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                {location.episode_count || 0}回登場
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
  }

  const renderItemCard = (item: Item) => {
    // 推しアイテム用の高品質プレースホルダー画像（コスメ・ファッション・グッズ系）
    const getItemPlaceholder = (index: number) => {
      const placeholders = [
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=200&fit=crop', // コスメ
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=200&fit=crop', // ファッション
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=200&fit=crop', // アクセサリー
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=200&fit=crop', // ファッション小物
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop', // コスメセット
        'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=300&h=200&fit=crop', // バッグ
        'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=200&fit=crop', // リップ・コスメ
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=200&fit=crop'  // ジュエリー
      ]
      return placeholders[index % placeholders.length]
    }

    return (
      <Link to={`/items/${item.id}`} key={item.id}>
        <div className="relative group cursor-pointer">
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
            <div className="relative">
              <img 
                src={item.image_url || getItemPlaceholder(parseInt(item.id))} 
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
  }

  const renderCard = (item: Celebrity | Episode | Location | Item) => {
    switch (type) {
      case 'celebrity':
        return renderCelebrityCard(item as Celebrity)
      case 'episode':
        return renderEpisodeCard(item as Episode)
      case 'location':
        return renderLocationCard(item as Location)
      case 'item':
        return renderItemCard(item as Item)
      default:
        return null
    }
  }

  if (items.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Icon className={`h-8 w-8 ${color} mr-3`} />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h2>
            </div>
            <p className="text-lg text-gray-600">{subtitle}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Icon className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-500">まだデータが登録されていません</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* セクションヘッダー */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Icon className={`h-8 w-8 ${color} mr-3`} />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h2>
          </div>
          <p className="text-lg text-gray-600">{subtitle}</p>
        </div>

        {/* カルーセル */}
        <div className={`relative bg-gradient-to-r ${bgGradient} rounded-3xl p-6 md:p-8`}>
          <div className="flex items-center justify-between">
            {/* 前へボタン */}
            <button
              onClick={prevItem}
              className="p-2 md:p-3 bg-white/80 hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-10 flex-shrink-0"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-700" />
            </button>
            
            {/* カード表示エリア */}
            <div className="flex-1 mx-4 md:mx-8 overflow-hidden">
              <div className="transition-all duration-500 ease-in-out">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {items
                    .slice(currentIndex, currentIndex + itemsPerPage)
                    .map((item) => (
                      <div key={item.id} className="w-full">
                        {renderCard(item)}
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            {/* 次へボタン */}
            <button
              onClick={nextItem}
              className="p-2 md:p-3 bg-white/80 hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-10 flex-shrink-0"
              disabled={currentIndex >= items.length - itemsPerPage}
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-gray-700" />
            </button>
          </div>
          
          {/* ページインジケーター */}
          <div className="flex justify-center mt-6 space-x-1">
            {Array.from({ length: Math.ceil(items.length / itemsPerPage) }).map((_, pageIndex) => (
              <button
                key={pageIndex}
                onClick={() => setCurrentIndex(pageIndex * itemsPerPage)}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  Math.floor(currentIndex / itemsPerPage) === pageIndex
                    ? 'bg-white w-6' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 「もっと見る」ボタン */}
        <div className="text-center mt-8">
          <Link to={linkPath}>
            <button className="inline-flex items-center px-8 py-4 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-full text-gray-700 hover:text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              {title}をもっと見る
              <ChevronRight className="h-5 w-5 ml-2" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default SectionCarousel