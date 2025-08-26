import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Filter, MapPin, User, Calendar, Phone, Star, TrendingUp, Eye, Play, Film } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardContent } from '../../components/ui/Card'
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
  episode_id: string
  created_at: string
  tags?: string[]
  episode?: {
    id: string
    title: string
    date: string
    celebrity_id: string
    view_count?: number
    duration?: string
    celebrity?: {
      id: string
      name: string
      slug: string
    }
  }
  episodes?: Array<{
    id: string
    title: string
    date: string
    view_count?: number
    celebrity?: {
      id: string
      name: string
      slug: string
    }
  }>
  episodes_count?: number
  related_posts_count?: number
}

interface LocationGroup {
  name: string
  address: string
  locations: LocationWithDetails[]
  masterLocation: LocationWithDetails
  episodeCount: number
  allEpisodes: Array<{
    id: string
    title: string
    date: string
    celebrity?: {
      id: string
      name: string
      slug: string
    }
  }>
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
  const [groupedLocations, setGroupedLocations] = useState<LocationGroup[]>([])
  const [showGrouped, setShowGrouped] = useState(true)
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [locationTags, setLocationTags] = useState<string[]>([])
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedCelebrity, setSelectedCelebrity] = useState(searchParams.get('celebrity') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedEpisode, setSelectedEpisode] = useState(searchParams.get('episode') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at')
  
  // Sample data for demonstration - wrapped in useMemo to prevent recreation
  const sampleLocations = useMemo(() => [
    {
      id: 'loc1a2b3c-d4e5-f678-9012-345678901234',
      name: '築地本願寺カフェ',
      address: '東京都中央区築地3-15-1',
      latitude: 35.6647,
      longitude: 139.7715,
      map_url: 'https://maps.google.com/築地本願寺',
      menu_example: ['築地丼', '海鮮丼', '抹茶ラテ'],
      image_urls: ['https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'],
      category: 'cafe',
      phone: '03-1234-5678',
      website: 'https://tsukiji-hongwanji.jp/',
      reservation_url: 'https://tabelog.com/tokyo/A1313/A131301/13001234/',
      opening_hours: { monday: '9:00-18:00' },
      price_range: '¥1,000-2,000',
      description: '築地の老舗カフェで新鮮な海鮮を楽しめます',
      episode_id: 'ep1a2b3c-d4e5-f678-9012-345678901234',
      created_at: '2024-01-15',
      episode: {
        id: 'ep1a2b3c-d4e5-f678-9012-345678901234',
        title: 'よにの朝ごはん#1',
        date: '2024-01-15',
        celebrity_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        celebrity: {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          name: '二宮和也',
          slug: 'ninomiya-kazunari'
        }
      }
    },
    {
      id: 'loc2b3c4d-e5f6-g789-0123-456789012345',
      name: '表参道ヒルズ',
      address: '東京都渋谷区神宮前4-12-10',
      latitude: 35.6658,
      longitude: 139.7128,
      map_url: 'https://maps.google.com/表参道ヒルズ',
      menu_example: [],
      image_urls: ['https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg'],
      category: 'shop',
      phone: '03-3497-0310',
      website: 'https://www.omotesandohills.com/',
      reservation_url: '',
      opening_hours: { monday: '11:00-21:00' },
      price_range: '¥3,000-10,000',
      description: '表参道の高級ショッピングモール',
      episode_id: 'ep2b3c4d-e5f6-g789-0123-456789012345',
      created_at: '2024-01-20',
      episode: {
        id: 'ep2b3c4d-e5f6-g789-0123-456789012345',
        title: 'VS嵐#33',
        date: '2024-01-20',
        celebrity_id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
        celebrity: {
          id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
          name: '橋本涼',
          slug: 'hashimoto-ryo'
        }
      }
    }
  ], [])
  
  // Location grouping logic
  const groupLocationsByIdentity = useCallback((locationList: LocationWithDetails[]): LocationGroup[] => {
    const groups: { [key: string]: LocationWithDetails[] } = {}

    locationList.forEach(location => {
      // 名前と住所を正規化してキーとする
      const normalizedName = location.name.trim().toLowerCase()
      const normalizedAddress = (location.address || '').trim().toLowerCase()
      const key = `${normalizedName}|${normalizedAddress}`

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(location)
    })

    // LocationGroupオブジェクトに変換
    const locationGroups: LocationGroup[] = Object.entries(groups).map(([key, locs]) => {
      // マスターロケーション選択（最も詳細な情報を持つものを選ぶ）
      const masterLocation = locs.reduce((best, current) => {
        let bestScore = calculateLocationScore(best)
        let currentScore = calculateLocationScore(current)
        return currentScore > bestScore ? current : best
      })
      
      // 全エピソード情報を収集（新しい構造対応）
      const allEpisodes = locs
        .flatMap(l => l.episodes || [l.episode].filter(Boolean))
        .map(ep => ({
          id: ep!.id,
          title: ep!.title,
          date: ep!.date,
          celebrity: ep!.celebrity
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      return {
        name: masterLocation.name,
        address: masterLocation.address || '',
        locations: locs,
        masterLocation: masterLocation,
        episodeCount: locs.length,
        allEpisodes: allEpisodes
      }
    })

    return locationGroups.sort((a, b) => b.episodeCount - a.episodeCount)
  }, [])

  const calculateLocationScore = useCallback((location: LocationWithDetails): number => {
    let score = 0
    
    if (location.address?.length > 10) score += 3
    if (location.description?.length > 20) score += 2
    if (location.website || location.reservation_url) score += 1
    if (location.tags?.length > 0) score += 1
    
    return score
  }, [])

  // Define functions BEFORE using them in useEffect
  const fetchData = useCallback(async () => {
    try {
      console.log('🔍 Public Locations: Fetching data...')
      
      // Fetch all locations with related episode data via episode_locations junction table
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select(`
          *,
          episode_locations(
            id,
            episode_id,
            episodes(
              id,
              title,
              date,
              view_count,
              duration,
              celebrity_id,
              celebrities(id, name, slug)
            )
          )
        `)
        .not('episode_locations', 'is', null)
        .order('created_at', { ascending: false })
      
      if (locationsError) throw locationsError
      
      // Fetch filter options
      const [celebritiesData, episodesData] = await Promise.all([
        supabase.from('celebrities').select('*'),
        supabase.from('episodes').select('*')
      ])
      
      // Process locations data to format it correctly
      const allLocations = (locationsData || []).map(location => {
        // Get episode data from episode_locations junction table
        // For backward compatibility, use the first episode if multiple exist
        const firstEpisodeLink = location.episode_locations?.[0]
        const episode = firstEpisodeLink?.episodes ? {
          id: firstEpisodeLink.episodes.id,
          title: firstEpisodeLink.episodes.title,
          date: firstEpisodeLink.episodes.date,
          view_count: firstEpisodeLink.episodes.view_count,
          duration: firstEpisodeLink.episodes.duration,
          celebrity_id: firstEpisodeLink.episodes.celebrity_id,
          celebrity: firstEpisodeLink.episodes.celebrities
        } : undefined
        
        // Create episodes array for multiple episode support
        const episodes = location.episode_locations?.map(link => ({
          id: link.episodes.id,
          title: link.episodes.title,
          date: link.episodes.date,
          view_count: link.episodes.view_count,
          celebrity: link.episodes.celebrities
        })) || []
        
        return {
          ...location,
          episode, // Primary episode for compatibility
          episodes, // All episodes for enhanced display
          episodes_count: episodes.length,
          episode_id: location.episode_id || episode?.id || ''
        }
      })
      
      setLocations(allLocations)
      setCelebrities(celebritiesData.data || [])
      setEpisodes(episodesData.data || [])
      
      // ロケーションタグの一覧を取得
      const allTags = allLocations.flatMap(location => location.tags || []).filter(Boolean)
      const uniqueTags = [...new Set(allTags)].sort()
      setLocationTags(uniqueTags)
      
      console.log('✅ Public Locations: Data fetched successfully', { 
        locations: locationsData?.length || 0,
        celebrities: celebritiesData.data?.length || 0,
        episodes: episodesData.data?.length || 0
      })
    } catch (error) {
      console.error('❌ Public Locations: Error fetching data:', error)
      // Use sample data as fallback
      setLocations(sampleLocations)
    } finally {
      setLoading(false)
    }
  }, [sampleLocations])
  
  const filterAndSortLocations = useCallback(() => {
    let filtered = [...(locations.length > 0 ? locations : sampleLocations)]
    
    // Enhanced Search filter with fuzzy matching
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(location => {
        const searchableText = [
          location.name,
          location.description,
          location.address,
          location.category,
          location.episode?.celebrity?.name,
          location.episode?.title,
          ...(location.tags || []),
          ...(location.menu_example || [])
        ].filter(Boolean).join(' ').toLowerCase()
        
        // 基本検索
        if (searchableText.includes(term)) return true
        
        // 部分マッチ検索（スペースで区切ったキーワード）
        const keywords = term.split(/\s+/).filter(k => k.length > 0)
        return keywords.every(keyword => searchableText.includes(keyword))
      })
    }
    
    // Celebrity filter
    if (selectedCelebrity) {
      filtered = filtered.filter(location => 
        location.episode?.celebrity?.id === selectedCelebrity
      )
    }
    
    // Category filter (using tags)
    if (selectedCategory) {
      filtered = filtered.filter(location => 
        location.tags?.includes(selectedCategory) || location.category === selectedCategory
      )
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
    
    // グループ化処理
    if (showGrouped) {
      const grouped = groupLocationsByIdentity(filtered)
      setGroupedLocations(grouped)
    }
  }, [locations, sampleLocations, searchTerm, selectedCelebrity, selectedCategory, selectedEpisode, sortBy, showGrouped, groupLocationsByIdentity])
  
  // Now use the functions in useEffect
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  useEffect(() => {
    filterAndSortLocations()
  }, [filterAndSortLocations])
  
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
                  placeholder="店舗名、住所、推し名、メニュー、タグで検索..."
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
                  ...locationTags.map(tag => ({ 
                    value: tag, 
                    label: `🏷️ ${tag}` 
                  }))
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
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  {showGrouped ? (
                    <>
                      <span className="font-medium text-purple-600">{groupedLocations.length}グループ</span>
                      （{filteredLocations.length}件の店舗）を表示中
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-purple-600">{filteredLocations.length}件</span>
                      の店舗を表示中
                    </>
                  )}
                </div>
                
                {/* グループ化トグルボタン */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGrouped(!showGrouped)}
                  className={`${showGrouped ? 'bg-purple-50 border-purple-300 text-purple-700' : 'hover:bg-gray-50'}`}
                >
                  {showGrouped ? '📊 グループ表示' : '📋 個別表示'}
                </Button>
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
        {(showGrouped ? groupedLocations.length === 0 : filteredLocations.length === 0) ? (
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
        ) : showGrouped ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedLocations.map((group) => (
              <Card key={`${group.name}-${group.address}`} className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full group overflow-hidden">
                <CardContent className="p-0">
                  {/* Image Container */}
                  <div className="relative overflow-hidden bg-gray-100">
                    {group.masterLocation.image_urls && group.masterLocation.image_urls.length > 0 ? (
                      <img
                        src={group.masterLocation.image_urls[0]}
                        alt={group.masterLocation.name}
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
                        {getCategoryLabel(group.masterLocation.category)}
                      </span>
                      
                      {/* Episode Count Badge */}
                      <span className="px-3 py-1 bg-purple-600/90 text-white text-xs font-medium rounded-full shadow-sm">
                        {group.episodeCount}回訪問
                      </span>
                    </div>
                    
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="space-y-3">
                        <Link to={`/locations/${group.masterLocation.id}`}>
                          <Button className="bg-white text-gray-900 hover:bg-gray-100 w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            詳細を見る
                          </Button>
                        </Link>
                        {group.masterLocation.reservation_url && (
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white w-full"
                            onClick={(e) => {
                              e.preventDefault()
                              window.open(group.masterLocation.reservation_url, '_blank')
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
                      {group.name}
                    </h3>
                    
                    {/* Address */}
                    {group.address && (
                      <div className="flex items-start space-x-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{group.address}</span>
                      </div>
                    )}
                    
                    {/* Description */}
                    {group.masterLocation.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {group.masterLocation.description}
                      </p>
                    )}
                    
                    {/* Episodes Summary */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-purple-700">
                            📺 {group.episodeCount}回訪問
                          </span>
                          <span className="text-xs text-gray-600">
                            {group.allEpisodes.length > 0 && 
                              new Date(group.allEpisodes[0].date).toLocaleDateString('ja-JP')
                            }〜
                          </span>
                        </div>
                        
                        {/* Recent Episodes */}
                        {group.allEpisodes.slice(0, 2).map((episode, index) => (
                          <div key={episode.id} className="text-xs text-gray-600">
                            <div className="flex items-center space-x-1">
                              <span className="text-purple-600">#{index + 1}</span>
                              <span className="line-clamp-1 flex-1">{episode.title}</span>
                              {episode.celebrity && (
                                <span className="text-blue-600 font-medium">
                                  {episode.celebrity.name}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {group.allEpisodes.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            他{group.allEpisodes.length - 2}件のエピソード
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Link to={`/locations/${group.masterLocation.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full hover:bg-purple-50 hover:border-purple-300"
                        >
                          詳細
                        </Button>
                      </Link>
                      
                      {group.masterLocation.reservation_url && (
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => {
                            e.preventDefault()
                            window.open(group.masterLocation.reservation_url, '_blank')
                          }}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          予約
                        </Button>
                      )}
                      
                      {group.masterLocation.map_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={(e) => {
                            e.preventDefault()
                            window.open(group.masterLocation.map_url, '_blank')
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <Card key={location.id} className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full group overflow-hidden">
                <CardContent className="p-0">
                  {/* Image Container */}
                  <div className="relative overflow-hidden bg-gray-100">
                    {location.image_urls && location.image_urls.length > 0 ? (
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
                    
                    {/* Celebrity & Episode - Enhanced Display */}
                    {location.episode ? (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200">
                        <div className="space-y-2">
                          {/* Episode Title with Icon */}
                          {location.episode.title && (
                            <div className="flex items-start space-x-2">
                              <Film className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                              <div className="flex-1">
                                <Link 
                                  to={`/episodes/${location.episode.id}`}
                                  className="font-medium text-purple-700 hover:text-purple-900 line-clamp-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {location.episode.title}
                                </Link>
                              </div>
                            </div>
                          )}
                          
                          {/* Celebrity Info */}
                          {location.episode.celebrity && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-sm">
                                <User className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                                <Link 
                                  to={`/celebrities/${location.episode.celebrity.slug}`}
                                  className="font-medium text-blue-700 hover:text-blue-900"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {location.episode.celebrity.name}
                                </Link>
                              </div>
                              
                              {/* Date */}
                              {location.episode.date && (
                                <div className="flex items-center text-xs text-gray-600">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(location.episode.date).toLocaleDateString('ja-JP')}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* YouTube Link Button */}
                          {location.episode.id && (
                            <a
                              href={`https://www.youtube.com/watch?v=${location.episode.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              YouTubeで見る
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center text-sm text-gray-500">
                          <Film className="h-4 w-4 mr-2" />
                          <span>エピソード情報なし</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Menu Examples */}
                    {location.menu_example && location.menu_example.length > 0 && (
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
                          {location.menu_example && location.menu_example.length > 3 && (
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
        {(showGrouped ? groupedLocations.length > 0 && groupedLocations.length >= 20 : filteredLocations.length > 0 && filteredLocations.length >= 20) && (
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