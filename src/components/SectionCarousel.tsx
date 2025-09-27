/**
 * セクション専用カルーセルコンポーネント
 * 各セクション（celebrities, episodes, locations, items）で共通利用
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Users, MapPin, Play, Package, ExternalLink, Calendar, Star } from 'lucide-react'
import OptimizedYouTubeThumbnail from './OptimizedYouTubeThumbnail'

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
    }, 2500) // 2.5秒間隔で自動回転

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

  // YouTube動画IDを抽出する関数
  const extractYouTubeVideoId = (thumbnailUrl: string): string | null => {
    if (!thumbnailUrl) return null
    
    // maxresdefault.jpg URLs from YouTube
    const maxresMatch = thumbnailUrl.match(/\/vi\/([^\/]+)\/maxresdefault\.jpg/)
    if (maxresMatch) return maxresMatch[1]
    
    // 他のYouTubeサムネイル形式
    const standardMatch = thumbnailUrl.match(/\/vi\/([^\/]+)\/(default|mqdefault|hqdefault|sddefault|maxresdefault)\.jpg/)
    if (standardMatch) return standardMatch[1]
    
    return null
  }

  // カードレンダリング関数
  const const renderCelebrityCard = (celebrity: Celebrity) => (
    <Link to={`/celebrities/${celebrity.slug}`} key={celebrity.id} className="block cursor-pointer">
      <div className="relative group">
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
          <div className="relative">
            <img 
              src={celebrity.image_url || '/placeholder-celebrity.jpg'} 
              alt={celebrity.name}
              className="w-full h-48 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-celebrity.jpg'
              }}
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
  )} key={celebrity.id}>
      <div className="relative group cursor-pointer">
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
          <div className="relative">
            <img 
              src={celebrity.image_url || '/placeholder-celebrity.jpg'} 
              alt={celebrity.name}
              className="w-full h-48 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-celebrity.jpg'
              }}
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

  const const renderEpisodeCard = (episode: Episode) => {
    // YouTube動画IDを抽出
    const videoId = episode.thumbnail_url ? extractYouTubeVideoId(episode.thumbnail_url) : null
    
    return (
    <Link to={`/episodes/${episode.id}`} key={episode.id} className="block cursor-pointer">
      <div className="relative group">
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
          <div className="relative">
            {videoId ? (
              <OptimizedYouTubeThumbnail
                videoId={videoId}
                alt={episode.title}
                className="w-full h-48 object-cover"
                fallbackSrc="/placeholder-episode.jpg"
              />
            ) : (
              <img 
                src={episode.thumbnail_url || '/placeholder-episode.jpg'}
                alt={episode.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-episode.jpg'
                }}
              />
            )}
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
            
            {/* ロケ地タグ */}
            {episode.location_count && episode.location_count > 0 && (
              <div className="mb-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  <MapPin className="h-3 w-3 mr-1" />
                  ロケ地あり
                </span>
              </div>
            )}
            
            <p className="text-xs text-gray-500 line-clamp-2">
              {episode.celebrities?.name && `出演: ${episode.celebrities.name}`}
            </p>
          </div>
        </div>
      </div>
    </Link>
    )
  } key={episode.id}>
      <div className="relative group cursor-pointer">
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
          <div className="relative">
            {videoId ? (
              <OptimizedYouTubeThumbnail
                videoId={videoId}
                alt={episode.title}
                className="w-full h-48 object-cover"
                fallbackSrc="/placeholder-episode.jpg"
              />
            ) : (
              <img 
                src={episode.thumbnail_url || '/placeholder-episode.jpg'}
                alt={episode.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-episode.jpg'
                }}
              />
            )}
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
            
            {/* ロケ地タグ */}
            {episode.location_count && episode.location_count > 0 && (
              <div className="mb-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  <MapPin className="h-3 w-3 mr-1" />
                  ロケ地あり
                </span>
              </div>
            )}
            
            <p className="text-xs text-gray-500 line-clamp-2">
              {episode.celebrities?.name && `出演: ${episode.celebrities.name}`}
            </p>
          </div>
        </div>
      </div>
    </Link>
    )
  }

  const const renderLocationCard = (location: Location) => {
    return (
      <Link to={`/locations/${location.id}`} key={location.id} className="block cursor-pointer">
        <div className="relative group">
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
            <div className="relative">
              <img 
                src={location.image_url || '/placeholder-location.jpg'} 
                alt={location.name}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-location.jpg'
                }}
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
  } key={location.id}>
        <div className="relative group cursor-pointer">
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
            <div className="relative">
              <img 
                src={location.image_url || '/placeholder-location.jpg'} 
                alt={location.name}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-location.jpg'
                }}
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

  const const renderItemCard = (item: Item) => {
    return (
      <Link to={`/items/${item.id}`} key={item.id} className="block cursor-pointer">
        <div className="relative group">
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
            <div className="relative">
              <img 
                src={item.image_url || '/placeholder-item.jpg'} 
                alt={item.name}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-item.jpg'
                }}
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
  } key={item.id}>
        <div className="relative group cursor-pointer">
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
            <div className="relative">
              <img 
                src={item.image_url || '/placeholder-item.jpg'} 
                alt={item.name}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-item.jpg'
                }}
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
            
            {/* カード表示エリア - 横スライドアニメーション */}
            <div className="flex-1 mx-4 md:mx-8 overflow-hidden">
              <div className="relative">
                <div 
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ 
                    transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
                  }}
                >
                  {items.map((item, index) => (
                    <div 
                      key={item.id}
                      className={`flex-shrink-0 px-2 ${
                        itemsPerPage === 1 ? 'w-full' :
                        itemsPerPage === 2 ? 'w-1/2' : 'w-1/3'
                      }`}
                    >
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
            {Array.from({ length: Math.max(1, items.length - itemsPerPage + 1) }).map((_, pageIndex) => (
              <button
                key={pageIndex}
                onClick={() => setCurrentIndex(pageIndex)}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  currentIndex === pageIndex
                    ? 'bg-white w-6' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
          
          {/* 全て見るボタン */}
          <div className="text-center mt-6">
            <Link
              to={linkPath}
              className="inline-flex items-center px-6 py-3 bg-white text-gray-900 font-medium rounded-full hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              全て見る
              <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SectionCarousel