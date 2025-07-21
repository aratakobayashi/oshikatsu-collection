import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, MapPin, Phone, Globe, Calendar, Tag, Clock } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'

interface LocationWithDetails {
  id: string
  name: string
  address: string
  latitude: number | null
  longitude: number | null
  map_url: string
  menu_example: string[]
  image_urls: string[]
  category: string
  phone: string
  website: string
  reservation_url: string
  opening_hours: Record<string, unknown>
  price_range: string
  description: string
  episode?: {
    id: string
    title: string
    date: string
    celebrity?: {
      name: string
      slug: string
    }
  }
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
      
      // ✅ 修正: supabaseクライアントを直接使用
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          episode:episodes(
            id,
            title,
            date,
            celebrity:celebrities(name, slug)
          )
        `)
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }
      
      console.log('✅ Successfully fetched location:', data)
      setLocation(data)
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
  
  return (
    <div className="min-h-screen bg-gray-50">
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
                  {/* Category */}
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {getCategoryLabel(location.category)}
                  </span>
                  
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
                  
                  {/* Price Range */}
                  {location.price_range && (
                    <div className="text-lg font-semibold text-green-600">
                      価格帯: {location.price_range}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Images */}
            {location.image_urls.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900">写真</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {location.image_urls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`${location.name} photo ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(url, '_blank')}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Menu */}
            {location.menu_example.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900">メニュー例</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {location.menu_example.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        {item}
                      </div>
                    ))}
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
                {location.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <a 
                      href={location.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      公式サイト
                    </a>
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
                
                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  {location.reservation_url && (
                    <a
                      href={location.reservation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        予約・詳細を見る
                      </Button>
                    </a>
                  )}
                  
                  {location.map_url && (
                    <a
                      href={location.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" className="w-full">
                        <MapPin className="h-4 w-4 mr-2" />
                        地図で見る
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Episode Information */}
            {location.episode && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900">関連エピソード</h2>
                </CardHeader>
                <CardContent>
                  <Link 
                    to={`/episodes/${location.episode.id}`}
                    className="block hover:bg-gray-50 p-4 rounded-lg transition-colors"
                  >
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900">{location.episode.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(location.episode.date).toLocaleDateString()}
                        </span>
                        {location.episode.celebrity && (
                          <span className="flex items-center">
                            <Tag className="h-4 w-4 mr-1" />
                            {location.episode.celebrity.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}