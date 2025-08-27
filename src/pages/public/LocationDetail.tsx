import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, MapPin, Phone, Globe, Calendar, Tag, Clock, Play, Eye, Users, Film, Utensils } from 'lucide-react'
import { MetaTags, generateSEO } from '../../components/SEO/MetaTags'
import { StructuredData, generateStructuredData } from '../../components/SEO/StructuredData'
import Button from '../../components/ui/Button'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'

interface LocationWithDetails {
  id: string
  name: string
  slug: string
  address: string | null
  description: string | null
  website_url: string | null
  phone: string | null
  opening_hours: any
  latitude: number | null
  longitude: number | null
  image_url: string | null
  tags: string[] | null
  celebrity_id: string | null
  tabelog_url: string | null
  affiliate_info: any
  created_at: string
  updated_at: string
  episodes?: {
    id: string
    title: string
    date: string
    view_count: number | null
    duration: string | null
    thumbnail_url: string | null
    celebrities?: {
      name: string
      slug: string
    }
  }[]
}

export default function LocationDetail() {
  const { id } = useParams<{ id: string }>()
  const [location, setLocation] = useState<LocationWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (id) {
      fetchLocation(id)
    }
  }, [id])
  
  async function fetchLocation(id: string) {
    try {
      console.log('🔍 Fetching location with ID:', id)
      
      // UUIDパターンかslugかを判定
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      
      let locationData, locationError
      
      if (isUUID) {
        // UUID形式の場合はIDで検索
        console.log('🔍 Searching by UUID:', id)
        const response = await supabase
          .from('locations')
          .select('*')
          .eq('id', id)
          .single()
        
        locationData = response.data
        locationError = response.error
      } else {
        // それ以外はslugで検索
        console.log('🔍 Searching by slug:', id)
        const response = await supabase
          .from('locations')
          .select('*')
          .eq('slug', id)
          .single()
        
        locationData = response.data
        locationError = response.error
      }
      
      if (locationError) {
        console.error('❌ Location error:', locationError)
        throw locationError
      }
      
      console.log('✅ Successfully fetched location:', locationData)
      
      // 新しい中間テーブル構造でエピソード情報を取得
      const { data: episodes, error: episodesError } = await supabase
        .from('episode_locations')
        .select(`
          id,
          episode_id,
          episodes(
            id,
            title,
            date,
            view_count,
            duration,
            thumbnail_url,
            celebrity_id,
            celebrities(name, slug)
          )
        `)
        .eq('location_id', locationData.id)
        .order('episodes(date)', { ascending: false })
      
      if (episodes && !episodesError) {
        // エピソードデータを整形
        locationData.episodes = episodes.map(link => ({
          id: link.episodes.id,
          title: link.episodes.title,
          date: link.episodes.date,
          view_count: link.episodes.view_count,
          duration: link.episodes.duration,
          thumbnail_url: link.episodes.thumbnail_url,
          celebrities: link.episodes.celebrities
        }))
        console.log(`✅ Successfully fetched ${episodes.length} episodes for this location`)
      } else {
        console.error('❌ Episodes fetch error:', episodesError)
        locationData.episodes = []
      }
      
      setLocation(locationData)
    } catch (error) {
      console.error('Error fetching location:', error)
      setError('ロケーションが見つかりません')
    } finally {
      setLoading(false)
    }
  }
  
  function getCategoryLabel(category: string) {
    const labels = {
      restaurant: 'レストラン',
      cafe: 'カフェ',
      shop: 'ショップ',
      hotel: 'ホテル',
      venue: '会場',
      tourist_spot: '観光地',
      other: 'その他'
    }
    return labels[category as keyof typeof labels] || category
  }

  function formatViewCount(count: number | null): string {
    if (!count) return '－'
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toLocaleString()
  }

  function formatDuration(duration: string | null): string {
    if (!duration || typeof duration !== 'string') return '－'
    
    // ISO 8601 duration format (PT10M30S) をパース
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return duration
    
    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  function getYouTubeUrl(episodeId: string): string {
    return `https://www.youtube.com/watch?v=${episodeId}`
  }

  function getYouTubeThumbnail(episodeId: string): string {
    return `https://img.youtube.com/vi/${episodeId}/mqdefault.jpg`
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (error || !location) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">ロケーションが見つかりません</h1>
            <p className="text-gray-600 mb-6">お探しのロケーションは存在しないか、削除された可能性があります。</p>
            <Link to="/">
              <Button className="bg-blue-600 hover:bg-blue-700">
                ホームに戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Generate SEO data
  const locationSEO = location ? generateSEO.location(
    location.name,
    location.address || '',
    location.episodes?.[0]?.celebrities?.name || ''
  ) : { title: '', description: '', keywords: '' }

  // Generate structured data
  const placeStructuredData = location ? generateStructuredData.place(
    location.name,
    {
      type: location.tabelog_url ? 'Restaurant' : 'TouristAttraction',
      description: location.description || undefined,
      address: location.address || undefined,
      latitude: location.latitude || undefined,
      longitude: location.longitude || undefined,
      images: location.image_url ? [location.image_url] : undefined,
      website: location.website_url || undefined,
      phone: location.phone || undefined,
      cuisine: location.tags?.filter(tag => 
        ['和食', '洋食', '中華', 'イタリアン', 'フレンチ', 'カフェ', 'デザート'].includes(tag)
      )
    }
  ) : null

  // Breadcrumb structured data
  const breadcrumbData = location ? generateStructuredData.breadcrumb([
    { name: 'ホーム', url: 'https://collection.oshikatsu-guide.com' },
    { name: 'ロケ地一覧', url: 'https://collection.oshikatsu-guide.com/locations' },
    { name: location.name }
  ]) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {location && (
        <>
          <MetaTags 
            title={locationSEO.title}
            description={locationSEO.description}
            keywords={locationSEO.keywords}
            canonicalUrl={`https://collection.oshikatsu-guide.com/locations/${location.id}`}
            ogUrl={`https://collection.oshikatsu-guide.com/locations/${location.id}`}
            ogImage={location.image_url || undefined}
          />
          
          <StructuredData data={[
            ...(placeStructuredData ? [placeStructuredData] : []),
            ...(breadcrumbData ? [breadcrumbData] : [])
          ]} />
        </>
      )}
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            ホームに戻る
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card>
              <CardContent className="p-8">
                <div className="space-y-4">
                  {/* Tags */}
                  {location.tags && location.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {location.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Name */}
                  <h1 className="text-3xl font-bold text-gray-900">
                    {location.name}
                  </h1>
                  
                  {/* Address */}
                  {location.address && (
                    <div className="flex items-start space-x-2 text-gray-600">
                      <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>{location.address}</span>
                    </div>
                  )}
                  
                  {/* Description */}
                  {location.description && (
                    <p className="text-gray-700 leading-relaxed">
                      {location.description}
                    </p>
                  )}
                  
                  {/* Website */}
                  {location.website_url && (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <a
                        href={location.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        公式サイト
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Episode Information - Timeline Style for Multiple Episodes */}
            {location.episodes && location.episodes.length > 0 ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">訪問エピソード</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {location.episodes.length > 1 
                          ? `複数のタレントが訪れた人気スポット！` 
                          : 'このロケーションが登場したエピソード'}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm rounded-full font-medium">
                      {location.episodes.length}件
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Timeline Container for Multiple Episodes */}
                  <div className={location.episodes.length > 1 ? "relative" : "space-y-6"}>
                    {location.episodes.length > 1 && (
                      /* Timeline Line */
                      <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-purple-400 to-blue-400"></div>
                    )}
                    
                    <div className="space-y-6">
                      {location.episodes.map((episode, index) => (
                      <div key={episode.id} className="relative">
                        {/* Timeline Dot for Multiple Episodes */}
                        {location.episodes.length > 1 && (
                          <div className="absolute left-0 top-12 z-10">
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg">
                              <span className="text-white font-bold">{index + 1}</span>
                            </div>
                          </div>
                        )}
                        
                        <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 ${
                          location.episodes.length > 1 ? 'ml-20' : ''
                        }`}>
                          <div className="flex">
                          {/* サムネイル */}
                          <div className="flex-shrink-0">
                            <img
                              src={episode.thumbnail_url || getYouTubeThumbnail(episode.id)}
                              alt={episode.title}
                              className="w-40 h-24 object-cover"
                              onError={(e) => {
                                e.currentTarget.src = getYouTubeThumbnail(episode.id)
                              }}
                            />
                          </div>
                          
                          {/* コンテンツ */}
                          <div className="flex-1 p-4">
                            <div className="flex flex-col h-full">
                              {/* タイトルとタレント */}
                              <div className="flex-1">
                                <Link
                                  to={`/episodes/${episode.id}`}
                                  className="block group"
                                >
                                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight mb-1">
                                    {episode.title}
                                  </h3>
                                </Link>
                                
                                {episode.celebrities && (
                                  <div className="flex items-center space-x-2 mb-3">
                                    <Users className="h-4 w-4 text-blue-600" />
                                    <Link 
                                      to={`/celebrities/${episode.celebrities.slug}`}
                                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                    >
                                      {episode.celebrities.name}
                                    </Link>
                                  </div>
                                )}
                              </div>
                              
                              {/* メタ情報 */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(episode.date).toLocaleDateString('ja-JP')}
                                  </div>
                                  
                                  {episode.view_count && (
                                    <div className="flex items-center">
                                      <Eye className="h-4 w-4 mr-1" />
                                      {formatViewCount(episode.view_count)}回再生
                                    </div>
                                  )}
                                  
                                  {episode.duration && (
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1" />
                                      {formatDuration(episode.duration)}
                                    </div>
                                  )}
                                </div>
                                
                                {/* アクションボタン */}
                                <div className="flex items-center space-x-2">
                                  <Link to={`/episodes/${episode.id}`}>
                                    <Button size="sm" variant="outline" className="text-xs">
                                      詳細を見る
                                    </Button>
                                  </Link>
                                  
                                  <a 
                                    href={getYouTubeUrl(episode.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center"
                                  >
                                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-xs">
                                      <Play className="h-3 w-3 mr-1" />
                                      YouTube
                                    </Button>
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                          {/* ロケーション固有の情報があれば表示 */}
                          <div className="bg-blue-50 px-4 py-2 border-t border-blue-100">
                            <p className="text-xs text-blue-700">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              このエピソードで <strong>{location.name}</strong> を訪問
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* No Episodes Message */
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900">訪問エピソード</h2>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <Film className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-2">まだエピソード情報がありません</p>
                    <p className="text-sm text-gray-500">
                      このロケーションに関連するエピソードが追加されると、<br />
                      ここに表示されます
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact & Links */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900">店舗情報</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Phone */}
                {location.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <a href={`tel:${location.phone}`} className="text-blue-600 hover:text-blue-800">
                      {location.phone}
                    </a>
                  </div>
                )}
                
                {/* Website */}
                {location.website_url && (
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <a 
                      href={location.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      公式サイト
                    </a>
                  </div>
                )}
                
                {/* Tabelog Affiliate Link */}
                {location.tabelog_url && (
                  <div className="pt-4 border-t border-gray-200">
                    <a
                      href={location.tabelog_url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      onClick={() => {
                        // トラッキング用のイベントを送信
                        console.log('Tabelog affiliate link clicked:', {
                          location_id: location.id,
                          location_name: location.name,
                          tabelog_url: location.tabelog_url
                        })
                      }}
                      className="block"
                    >
                      <Button 
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition hover:scale-105"
                      >
                        <Utensils className="h-5 w-5 mr-2" />
                        食べログで予約する
                      </Button>
                    </a>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      ※食べログへ移動します
                    </p>
                  </div>
                )}
                
                {/* Opening Hours */}
                {location.opening_hours && Object.keys(location.opening_hours).length > 0 && (
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">営業時間</span>
                    </div>
                    <div className="ml-8 text-sm text-gray-600">
                      {/* This would need proper formatting based on the opening_hours structure */}
                      <p>営業時間情報あり</p>
                    </div>
                  </div>
                )}
                
                {/* Tags */}
                {location.tags && location.tags.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <Tag className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">タグ</span>
                    </div>
                    <div className="ml-8 flex flex-wrap gap-2">
                      {location.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}