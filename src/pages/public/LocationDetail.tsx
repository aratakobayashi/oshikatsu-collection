import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, MapPin, Phone, Globe, Calendar, Tag, Clock } from 'lucide-react'
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
  created_at: string
  updated_at: string
  episodes?: {
    id: string
    title: string
    date: string
    celebrity?: {
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
      
      // まずslugで検索を試行
      let { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('*')
        .eq('slug', id)
        .single()
      
      // slugで見つからない場合はUUIDとして検索
      if (locationError && locationError.code === 'PGRST116') {
        console.log('🔍 Slug not found, trying UUID search...')
        const uuidResponse = await supabase
          .from('locations')
          .select('*')
          .eq('id', id)
          .single()
        
        locationData = uuidResponse.data
        locationError = uuidResponse.error
      }
      
      if (locationError) {
        console.error('❌ Location error:', locationError)
        throw locationError
      }
      
      console.log('✅ Successfully fetched location:', locationData)
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
            
            {/* Episode Information */}
            {location.episodes && location.episodes.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900">関連エピソード</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {location.episodes.map((episode) => (
                      <Link
                        key={episode.id}
                        to={`/episodes/${episode.id}`}
                        className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="space-y-2">
                          <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                            {episode.title}
                          </h3>
                          {episode.celebrity && (
                            <p className="text-sm text-gray-600">
                              {episode.celebrity.name}
                            </p>
                          )}
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(episode.date).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                      </Link>
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