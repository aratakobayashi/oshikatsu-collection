import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Filter, MapPin, ExternalLink, User, Tag, Calendar, Phone, Globe, Star, TrendingUp, Heart, Eye } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardContent } from '../../components/ui/Card'
import { db } from '../../lib/supabase'

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
  opening_hours: any
  price_range: string
  description: string
  episode_id: string
  created_at: string
  episode?: {
    id: string
    title: string
    date: string
    celebrity_id: string
    celebrity?: {
      id: string
      name: string
      slug: string
    }
  }
  related_posts_count?: number
}

interface Celebrity {
  id: string
  name: string
  slug: string
}

interface Episode {
  id: string
  title: string
  date: string
  celebrity_id: string
}

export default function Locations() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [locations, setLocations] = useState<LocationWithDetails[]>([])
  const [filteredLocations, setFilteredLocations] = useState<LocationWithDetails[]>([])
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedCelebrity, setSelectedCelebrity] = useState(searchParams.get('celebrity') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedEpisode, setSelectedEpisode] = useState(searchParams.get('episode') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at')
  
  useEffect(() => {
    fetchData()
  }, [])
  
  useEffect(() => {
    filterAndSortLocations()
  }, [locations, searchTerm, selectedCelebrity, selectedCategory, selectedEpisode, sortBy])
  
  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (selectedCelebrity) params.set('celebrity', selectedCelebrity)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedEpisode) params.set('episode', selectedEpisode)
    if (sortBy !== 'created_at') params.set('sort', sortBy)
    
    setSearchParams(params)
  }, [searchTerm, selectedCelebrity, selectedCategory, selectedEpisode, sortBy, setSearchParams])
  
  async function fetchData() {
    try {
      // Fetch all locations with related data
      const { data: locationsData, error: locationsError } = await db.supabase
        .from('locations')
        .select(`
          *,
          episode:episodes(
            id,
            title,
            date,
            celebrity_id,
            celebrity:celebrities(id, name, slug)
          )
        `)
        .order('created_at', { ascending: false })
      
      if (locationsError) throw locationsError
      
      // Fetch filter options
      const [celebritiesData, episodesData] = await Promise.all([
        db.celebrities.getAll(),
        db.episodes.getAll()
      ])
      
      setLocations(locationsData || [])
      setCelebrities(celebritiesData)
      setEpisodes(episodesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  function filterAndSortLocations() {
    let filtered = [...locations]
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(location =>
        location.name.toLowerCase().includes(term) ||
        location.description.toLowerCase().includes(term) ||
        location.address.toLowerCase().includes(term) ||
        location.episode?.celebrity?.name.toLowerCase().includes(term)
      )
    }
    
    // Celebrity filter
    if (selectedCelebrity) {
      filtered = filtered.filter(location => 
        location.episode?.celebrity?.id === selectedCelebrity
      )
    }
    
    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(location => location.category === selectedCategory)
    }
    
    // Episode filter
    if (selectedEpisode) {
      filtered = filtered.filter(location => location.episode_id === selectedEpisode)
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'name':
          return a.name.localeCompare(b.name)
        case 'celebrity_name':
          return (a.episode?.celebrity?.name || '').localeCompare(b.episode?.celebrity?.name || '')
        case 'episode_date':
          return new Date(b.episode?.date || 0).getTime() - new Date(a.episode?.date || 0).getTime()
        default:
          return 0
      }
    })
    
    setFilteredLocations(filtered)
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
  
  function clearFilters() {
    setSearchTerm('')
    setSelectedCelebrity('')
    setSelectedCategory('')
    setSelectedEpisode('')
    setSortBy('created_at')
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">店舗を読み込み中...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white/20 p-4 rounded-full">
                <MapPin className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              推し訪問店舗
            </h1>
            <p className="text-xl opacity-90 mb-8">
              お気に入りの推しが訪れたカフェ・レストラン・ショップを発見しよう
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm opacity-80">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                <span>人気スポット多数</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2" />
                <span>厳選店舗</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                <span>簡単予約</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-6">
            {/* Main Search */}
            <div className="mb-6">
              <div className="relative">
                <Input
                  placeholder="店舗名、住所、推し名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-lg py-4 pl-12 pr-4 rounded-xl border-2 border-gray-200 focus:border-purple-500"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              </div>
            </div>
            
            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Select
                value={selectedCelebrity}
                onChange={(e) => setSelectedCelebrity(e.target.value)}
                options={[
                  { value: '', label: '👤 全ての推し' },
                  ...celebrities.map(c => ({ value: c.id, label: c.name }))
                ]}
              />
              
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={[
                  { value: '', label: '🏪 全てのカテゴリ' },
                  { value: 'restaurant', label: '🍽️ レストラン' },
                  { value: 'cafe', label: '☕ カフェ' },
                  { value: 'shop', label: '🛍️ ショップ' },
                  { value: 'hotel', label: '🏨 ホテル' },
                  { value: 'venue', label: '🎪 会場' },
                  { value: 'tourist_spot', label: '🗼 観光地' },
                  { value: 'other', label: '🔖 その他' }
                ]}
              />
              
              <Select
                value={selectedEpisode}
                onChange={(e) => setSelectedEpisode(e.target.value)}
                options={[
                  { value: '', label: '📺 全てのエピソード' },
                  ...episodes.map(e => ({ value: e.id, label: e.title }))
                ]}
              />
              
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'created_at', label: '🆕 新着順' },
                  { value: 'name', label: '🔤 店舗名順' },
                  { value: 'celebrity_name', label: '⭐ 推し名順' },
                  { value: 'episode_date', label: '📅 エピソード日順' }
                ]}
              />
              
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full hover:bg-purple-50 hover:border-purple-300"
              >
                🔄 フィルタクリア
              </Button>
            </div>
            
            {/* Results Info */}
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-600 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <span className="font-medium text-purple-600">{filteredLocations.length}件</span>
                の店舗を表示中
              </div>
              
              <Link to="/submit">
                <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white">
                  <MapPin className="h-4 w-4 mr-2" />
                  店舗を質問する
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Locations Grid */}
        {filteredLocations.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-16 text-center">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                店舗が見つかりません
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedCelebrity || selectedCategory || selectedEpisode
                  ? '検索条件を変更してお試しください' 
                  : 'まだ店舗が登録されていません'}
              </p>
              <div className="space-x-4">
                <Button onClick={clearFilters} variant="outline">
                  フィルタをクリア
                </Button>
                <Link to="/submit">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    店舗を質問する
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <Card key={location.id} className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full group overflow-hidden">
                <CardContent className="p-0">
                  {/* Image Container */}
                  <div className="relative overflow-hidden bg-gray-100">
                    {location.image_urls.length > 0 ? (
                      <img
                        src={location.image_urls[0]}
                        alt={location.name}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <MapPin className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Overlay Badges */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between">
                      <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-medium rounded-full shadow-sm">
                        {getCategoryLabel(location.category)}
                      </span>
                      
                      {location.price_range && (
                        <span className="px-3 py-1 bg-green-500/90 text-white text-xs font-medium rounded-full shadow-sm">
                          {location.price_range}
                        </span>
                      )}
                    </div>
                    
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="space-y-3">
                        <Link to={`/locations/${location.id}`}>
                          <Button className="bg-white text-gray-900 hover:bg-gray-100 w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            詳細を見る
                          </Button>
                        </Link>
                        {location.reservation_url && (
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white w-full"
                            onClick={(e) => {
                              e.preventDefault()
                              window.open(location.reservation_url, '_blank')
                            }}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            予約する
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5 space-y-3">
                    {/* Location Name */}
                    <h3 className="font-bold text-gray-900 line-clamp-2 text-lg group-hover:text-purple-600 transition-colors">
                      {location.name}
                    </h3>
                    
                    {/* Address */}
                    {location.address && (
                      <div className="flex items-start space-x-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{location.address}</span>
                      </div>
                    )}
                    
                    {/* Description */}
                    {location.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {location.description}
                      </p>
                    )}
                    
                    {/* Celebrity & Episode */}
                    {location.episode?.celebrity && (
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center text-sm">
                          <User className="h-4 w-4 mr-2 text-purple-500" />
                          <Link 
                            to={`/celebrities/${location.episode.celebrity.slug}`}
                            className="font-medium text-purple-600 hover:text-purple-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {location.episode.celebrity.name}
                          </Link>
                          <span className="text-gray-500 ml-2">が訪れた</span>
                        </div>
                        
                        {location.episode.title && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            <Link 
                              to={`/episodes/${location.episode.id}`}
                              className="truncate hover:text-purple-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {location.episode.title}
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Menu Examples */}
                    {location.menu_example.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">メニュー例:</p>
                        <div className="flex flex-wrap gap-1">
                          {location.menu_example.slice(0, 3).map((item, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {item}
                            </span>
                          ))}
                          {location.menu_example.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{location.menu_example.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Link to={`/locations/${location.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full hover:bg-purple-50 hover:border-purple-300"
                        >
                          詳細
                        </Button>
                      </Link>
                      
                      {location.reservation_url && (
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => {
                            e.preventDefault()
                            window.open(location.reservation_url, '_blank')
                          }}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          予約
                        </Button>
                      )}
                      
                      {location.map_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={(e) => {
                            e.preventDefault()
                            window.open(location.map_url, '_blank')
                          }}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          地図
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Load More Section */}
        {filteredLocations.length > 0 && filteredLocations.length >= 20 && (
          <div className="text-center mt-12">
            <Card className="inline-block">
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">さらに多くの店舗を見る</p>
                <Button variant="outline" className="px-8 py-3">
                  もっと読み込む
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}