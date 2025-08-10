import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, ExternalLink, MapPin, Package, Users, Award, Globe, ArrowLeft, Star, Heart, Eye, Play, Filter, Search, Coffee, ShoppingBag } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { db, Celebrity, Episode, supabase } from '../../lib/supabase'

interface EpisodeWithDetails extends Episode {
  celebrity?: {
    id: string
    name: string
    slug: string
  }
}

interface Location {
  id: string
  name: string
  slug: string
  description?: string
  address?: string
  website_url?: string
  tags?: string[]
  created_at: string
}

interface Item {
  id: string
  name: string
  slug: string
  description?: string
  brand?: string
  price?: number
  purchase_url?: string
  category?: string
  tags?: string[]
  created_at: string
}

export default function CelebrityProfile() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [celebrity, setCelebrity] = useState<Celebrity | null>(null)
  
  // デコードされたslugを取得（日本語URL対応）
  const decodedSlug = slug ? decodeURIComponent(slug) : ''
  const [episodes, setEpisodes] = useState<EpisodeWithDetails[]>([])
  const [filteredEpisodes, setFilteredEpisodes] = useState<EpisodeWithDetails[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [episodeLinksData, setEpisodeLinksData] = useState<{ [episodeId: string]: { locations: number, items: number } }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Episode filters
  const [episodeSearch, setEpisodeSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  
  useEffect(() => {
    if (decodedSlug) {
      fetchCelebrityData(decodedSlug)
    }
  }, [decodedSlug])
  
  useEffect(() => {
    filterEpisodes()
  }, [episodes, episodeSearch, platformFilter, yearFilter])
  
  useEffect(() => {
    if (episodes.length > 0) {
      fetchEpisodeLinksData()
    }
  }, [episodes])
  
  async function fetchEpisodeLinksData() {
    if (!episodes || episodes.length === 0) return
    
    const episodeIds = episodes.map(ep => ep.id)
    try {
      // Episode-Location リンク取得
      const { data: locationLinks, error: locError } = await supabase
        .from('episode_locations')
        .select('episode_id, location_id')
        .in('episode_id', episodeIds)
      
      if (locError) {
        console.error('❌ Location links error:', locError)
      }
      
      // Episode-Item リンク取得  
      const { data: itemLinks, error: itemError } = await supabase
        .from('episode_items')
        .select('episode_id, item_id')
        .in('episode_id', episodeIds)
      
      if (itemError) {
        console.error('❌ Item links error:', itemError)
      }
      
      // エピソードIDごとに集計
      const episodeLinksMap: { [episodeId: string]: { locations: number, items: number } } = {}
      
      episodes.forEach(episode => {
        episodeLinksMap[episode.id] = { locations: 0, items: 0 }
      })
      
      locationLinks?.forEach(link => {
        if (episodeLinksMap[link.episode_id]) {
          episodeLinksMap[link.episode_id].locations++
        }
      })
      
      itemLinks?.forEach(link => {
        if (episodeLinksMap[link.episode_id]) {
          episodeLinksMap[link.episode_id].items++
        }
      })
      
      setEpisodeLinksData(episodeLinksMap)
    } catch (error) {
      console.error('❌ Episode links fetch error:', error)
    }
  }
  
  async function fetchCelebrityData(slug: string) {
    try {
      
      const celebrityData = await db.celebrities.getBySlug(decodedSlug)
      
      if (!celebrityData) {
        console.warn('⚠️ [DEBUG] No celebrity found for slug:', slug)
        setError('該当する推しが見つかりません')
        return
      }
      
      setCelebrity(celebrityData)
      
      const episodesData = await db.episodes.getByCelebrityId(celebrityData.id)
      
      setEpisodes(episodesData)
      
      // 店舗・アイテム情報を取得
      const locationsData = await db.locations.getByCelebrityId(celebrityData.id)
      setLocations(locationsData || [])
      
      const itemsData = await db.items.getByCelebrityId(celebrityData.id)
      setItems(itemsData || [])
      
    } catch (error) {
      console.error('❌ [ERROR] Error fetching celebrity data:', error)
      console.error('❌ [ERROR] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        slug: slug
      })
      const errorMessage = error instanceof Error ? error.message : '推しが見つかりません'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  function filterEpisodes() {
    
    let filtered = [...episodes]
    
    // Search filter
    if (episodeSearch) {
      const term = episodeSearch.toLowerCase()
      filtered = filtered.filter(episode =>
        episode.title.toLowerCase().includes(term) ||
        episode.description?.toLowerCase().includes(term)
      )
    }
    
    // Platform filter
    if (platformFilter) {
      filtered = filtered.filter(episode => episode.platform === platformFilter)
    }
    
    // Year filter
    if (yearFilter) {
      filtered = filtered.filter(episode => 
        new Date(episode.date).getFullYear().toString() === yearFilter
      )
    }
    
    setFilteredEpisodes(filtered)
  }
  
  function getPlatformIcon(platform: string) {
    switch (platform) {
      case 'youtube':
        return '📺'
      case 'tv':
        return '📻'
      case 'instagram':
        return '📷'
      case 'tiktok':
        return '🎵'
      default:
        return '🎬'
    }
  }
  
  function getPlatformLabel(platform: string) {
    const labels = {
      youtube: 'YouTube',
      tv: 'テレビ',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      other: 'その他'
    }
    return labels[platform as keyof typeof labels] || platform
  }
  
  function getPlatformColor(platform: string) {
    const colors = {
      youtube: 'bg-red-100 text-red-700',
      tv: 'bg-blue-100 text-blue-700',
      instagram: 'bg-purple-100 text-purple-700',
      tiktok: 'bg-pink-100 text-pink-700',
      other: 'bg-gray-100 text-gray-700'
    }
    return colors[platform as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  }
  
  function getGenderLabel(gender: number | null) {
    if (gender === 1) return '女性'
    if (gender === 2) return '男性'
    return '不明'
  }
  
  function formatBirthday(birthday: string | null) {
    if (!birthday) return null
    try {
      return new Date(birthday).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return birthday
    }
  }
  
  function getAge(birthday: string | null) {
    if (!birthday) return null
    try {
      const birth = new Date(birthday)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return age
    } catch {
      return null
    }
  }
  
  // Get unique years from episodes for filter
  const availableYears = [...new Set(episodes.map(ep => new Date(ep.date).getFullYear()))]
    .sort((a, b) => b - a)
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">推しの情報を読み込み中...</p>
        </div>
      </div>
    )
  }
  
  if (error || !celebrity) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
          <Card className="shadow-xl border-0">
            <CardContent className="p-12 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
              <p className="text-gray-600 mb-6">
                {error === '該当する推しが見つかりません' 
                  ? 'お探しの推しは存在しないか、URLが間違っている可能性があります。' 
                  : 'しばらく時間をおいてから再度お試しください。'}
              </p>
              <Link to="/celebrities">
                <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-full">
                  推し一覧に戻る
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8">
        <Link to="/celebrities" className="inline-flex items-center text-rose-600 hover:text-rose-800 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          推し一覧に戻る
        </Link>
      </div>
      
      {/* Celebrity Header */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Profile Image */}
            <div className="lg:col-span-1">
              <div className="relative">
                {celebrity.image_url ? (
                  <img
                    src={celebrity.image_url}
                    alt={celebrity.name}
                    className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl object-cover aspect-[3/4]"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg'
                    }}
                  />
                ) : (
                  <div className="w-full max-w-sm mx-auto aspect-[3/4] rounded-2xl shadow-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                    <Users className="h-24 w-24 text-rose-400" />
                  </div>
                )}
                
                {/* Popularity Badge */}
                {celebrity.popularity && celebrity.popularity > 10 && (
                  <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    人気
                  </div>
                )}
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                  {celebrity.name}
                </h1>
                
                {/* Also Known As */}
                {celebrity.also_known_as && (
                  <p className="text-lg text-gray-600 mb-4">
                    別名: {celebrity.also_known_as}
                  </p>
                )}
                
                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Group */}
                  {celebrity.group_name && (
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-purple-500" />
                      <div>
                        <span className="text-sm text-gray-500">グループ</span>
                        <p className="font-semibold text-purple-600">{celebrity.group_name}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Gender */}
                  {celebrity.gender && (
                    <div className="flex items-center space-x-3">
                      <div className="h-5 w-5 text-blue-500">👤</div>
                      <div>
                        <span className="text-sm text-gray-500">性別</span>
                        <p className="font-semibold text-blue-600">{getGenderLabel(celebrity.gender)}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Birthday */}
                  {celebrity.birthday && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-green-500" />
                      <div>
                        <span className="text-sm text-gray-500">誕生日</span>
                        <p className="font-semibold text-green-600">
                          {formatBirthday(celebrity.birthday)}
                          {getAge(celebrity.birthday) && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              {getAge(celebrity.birthday)}歳
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Place of Birth */}
                  {celebrity.place_of_birth && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-red-500" />
                      <div>
                        <span className="text-sm text-gray-500">出身地</span>
                        <p className="font-semibold text-red-600">{celebrity.place_of_birth}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Known For */}
                  {celebrity.known_for_department && (
                    <div className="flex items-center space-x-3">
                      <Award className="h-5 w-5 text-orange-500" />
                      <div>
                        <span className="text-sm text-gray-500">専門分野</span>
                        <p className="font-semibold text-orange-600">{celebrity.known_for_department}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Popularity */}
                  {celebrity.popularity && celebrity.popularity > 0 && (
                    <div className="flex items-center space-x-3">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <div>
                        <span className="text-sm text-gray-500">人気度</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                              style={{ width: `${Math.min(celebrity.popularity / 100 * 100, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold text-yellow-600">
                            {celebrity.popularity.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Bio */}
                {celebrity.bio && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">プロフィール</h3>
                    <p className="text-gray-700 leading-relaxed">{celebrity.bio}</p>
                  </div>
                )}
                
                {/* External Links */}
                <div className="flex flex-wrap gap-4">
                  {celebrity.homepage && (
                    <a
                      href={celebrity.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      公式サイト
                    </a>
                  )}
                  
                  {celebrity.youtube_url && (
                    <a
                      href={celebrity.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-full font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      YouTube
                    </a>
                  )}
                  
                  {celebrity.tmdb_id && (
                    <a
                      href={`https://www.themoviedb.org/person/${celebrity.tmdb_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      TMDB
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Episodes Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">エピソード</h2>
            <p className="text-gray-600">
              {episodes.length > 0 ? `${episodes.length}件のエピソード (表示中: ${filteredEpisodes.length}件)` : 'エピソードはまだありません'}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              <span>動画・詳細</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>日付順</span>
            </div>
          </div>
        </div>
        
        {/* Episode Filters */}
        {episodes.length > 0 && (
          <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Input
                    placeholder="エピソードを検索..."
                    value={episodeSearch}
                    onChange={(e) => setEpisodeSearch(e.target.value)}
                    className="pl-10 rounded-xl border-2 border-gray-200 focus:border-rose-400"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                
                <Select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  options={[
                    { value: '', label: '🎬 全てのプラットフォーム' },
                    { value: 'youtube', label: '📺 YouTube' },
                    { value: 'tv', label: '📻 テレビ' },
                    { value: 'instagram', label: '📷 Instagram' },
                    { value: 'tiktok', label: '🎵 TikTok' },
                    { value: 'other', label: '🔖 その他' }
                  ]}
                  className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
                />
                
                <Select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  options={[
                    { value: '', label: '📅 全ての年' },
                    ...availableYears.map(year => ({ 
                      value: year.toString(), 
                      label: `${year}年` 
                    }))
                  ]}
                  className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
                />
                
                <div className="flex items-center text-sm text-gray-500">
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="font-medium text-rose-600">{filteredEpisodes.length}件</span>
                  表示中
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {filteredEpisodes.length === 0 && episodes.length > 0 ? (
          <Card className="shadow-xl border-0">
            <CardContent className="p-16 text-center">
              <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                条件に一致するエピソードがありません
              </h3>
              <p className="text-gray-500 mb-6">
                検索条件を変更してお試しください。
              </p>
              <Button 
                onClick={() => {
                  setEpisodeSearch('')
                  setPlatformFilter('')
                  setYearFilter('')
                }}
                variant="outline" 
                className="rounded-full"
              >
                フィルタをクリア
              </Button>
            </CardContent>
          </Card>
        ) : episodes.length === 0 ? (
          <Card className="shadow-xl border-0">
            <CardContent className="p-16 text-center">
              <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                エピソードがありません
              </h3>
              <p className="text-gray-500 mb-6">
                この推しのエピソードはまだ登録されていません。
              </p>
              <Link to="/submit">
                <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-full">
                  エピソードを投稿する
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEpisodes.map((episode) => {
              const episodeLinks = episodeLinksData[episode.id] || { locations: 0, items: 0 }
              
              return (
              <Link key={episode.id} to={`/episodes/${episode.id}`}>
                <Card className="hover:shadow-2xl transition-all duration-500 cursor-pointer h-full group border-0 shadow-lg overflow-hidden">
                  <CardContent className="p-0">
                    {/* Thumbnail */}
                    <div className="relative">
                      {episode.thumbnail_url ? (
                        <img
                          src={episode.thumbnail_url}
                          alt={episode.title}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = 'https://images.pexels.com/photos/1040903/pexels-photo-1040903.jpeg'
                          }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          <Play className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Platform Badge */}
                      {episode.platform && (
                        <div className="absolute top-3 left-3">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full shadow-sm ${getPlatformColor(episode.platform)}`}>
                            {getPlatformIcon(episode.platform)} {getPlatformLabel(episode.platform)}
                          </span>
                        </div>
                      )}
                      
                      {/* Location/Item Indicators */}
                      {(episodeLinks.locations > 0 || episodeLinks.items > 0) && (
                        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
                          {episodeLinks.locations > 0 && (
                            <div className="bg-white/95 backdrop-blur-sm text-amber-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md border border-amber-200 flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>ロケ地あり</span>
                            </div>
                          )}
                          {episodeLinks.items > 0 && (
                            <div className="bg-white/95 backdrop-blur-sm text-rose-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md border border-rose-200 flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5" />
                              <span>アイテムあり</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Video Link Overlay */}
                      {episode.video_url && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-4">
                            <Play className="h-8 w-8 text-gray-900" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 space-y-4">
                      {/* Date */}
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{new Date(episode.date).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                        {episode.title}
                      </h3>
                      
                      {/* Description */}
                      {episode.description && (
                        <p className="text-gray-600 line-clamp-3 text-sm">
                          {episode.description}
                        </p>
                      )}
                      
                      {/* Duration & Views */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {episode.duration_minutes && (
                            <span>{episode.duration_minutes}分</span>
                          )}
                          {episode.view_count && episode.view_count > 0 && (
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {episode.view_count.toLocaleString()}
                            </span>
                          )}
                        </div>
                        
                        {/* Links Summary */}
                        <div className="flex items-center gap-3 text-xs">
                          {episodeLinks.locations > 0 && (
                            <span className="flex items-center text-amber-600">
                              <Coffee className="h-3 w-3 mr-1" />
                              {episodeLinks.locations}店舗
                            </span>
                          )}
                          {episodeLinks.items > 0 && (
                            <span className="flex items-center text-rose-600">
                              <ShoppingBag className="h-3 w-3 mr-1" />
                              {episodeLinks.items}アイテム
                            </span>
                          )}
                          {episode.video_url && (
                            <span className="flex items-center text-blue-600">
                              <Play className="h-3 w-3 mr-1" />
                              動画
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
            })}
          </div>
        )}
      </div>
      
      {/* Locations & Items Sections */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Locations Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                <Coffee className="h-6 w-6 mr-3 text-amber-600" />
                聖地・店舗情報
              </h2>
              <p className="text-gray-600">
                {locations.length > 0 ? `${locations.length}件の店舗情報` : '店舗情報はまだありません'}
              </p>
            </div>
          </div>
          
          {locations.length === 0 ? (
            <Card className="shadow-lg border-0">
              <CardContent className="p-12 text-center">
                <div className="bg-amber-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Coffee className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  店舗情報がありません
                </h3>
                <p className="text-gray-500 text-sm">
                  この推しが訪れた店舗情報はまだ登録されていません。
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {locations.slice(0, 6).map((location) => (
                <Link key={location.id} to={`/locations/${location.id}`}>
                  <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                            {location.name}
                          </h3>
                          {location.description && (
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                              {location.description}
                            </p>
                          )}
                          {location.address && (
                            <div className="flex items-center text-gray-500 text-xs mb-2">
                              <MapPin className="h-3 w-3 mr-1" />
                              {location.address}
                            </div>
                          )}
                          {location.tags && location.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {location.tags.slice(0, 3).map((tag, index) => (
                                <span 
                                  key={index} 
                                  className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {location.website_url && (
                          <div className="ml-4">
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {locations.length > 6 && (
                <div className="text-center pt-4">
                  <Link to="/locations">
                    <Button variant="outline" className="rounded-full">
                      すべての店舗を見る ({locations.length}件)
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 聖地巡礼マップ機能 */}
        {locations && locations.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <MapPin className="h-6 w-6" />
                聖地巡礼マップ
              </h2>
              <p className="text-white/90 mt-2">
                {celebrity.name}が訪れた場所を巡って、ファンの聖地巡礼を楽しもう！
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-4 text-gray-900">🗺️ おすすめ巡礼ルート</h3>
                  <div className="space-y-3">
                    {locations.slice(0, 4).map((location, index) => (
                      <div key={location.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{location.name}</h4>
                          {location.address && (
                            <p className="text-gray-600 text-sm mt-1">{location.address}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">📍 巡礼のコツ</h4>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• 営業時間を事前に確認しましょう</li>
                      <li>• 混雑時間を避けて訪問すると良いです</li>
                      <li>• 写真撮影は店舗のルールに従いましょう</li>
                      <li>• SNS投稿時は位置情報にご注意を</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mb-4 text-gray-900">💬 巡礼者の口コミ</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          A
                        </div>
                        <span className="font-semibold text-gray-900">巡礼ファン</span>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm">
                        よにちゃんが実際に行ったお店で、同じメニューを注文できて感動しました！
                      </p>
                    </div>
                    
                    <div className="text-center mt-4">
                      <Button variant="outline" className="text-sm" onClick={() => navigate('/submit')}>
                        あなたも口コミを投稿する
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Items Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                <ShoppingBag className="h-6 w-6 mr-3 text-rose-600" />
                ファッション・アイテム
              </h2>
              <p className="text-gray-600">
                {items.length > 0 ? `${items.length}件のアイテム情報` : 'アイテム情報はまだありません'}
              </p>
            </div>
          </div>
          
          {items.length === 0 ? (
            <Card className="shadow-lg border-0">
              <CardContent className="p-12 text-center">
                <div className="bg-rose-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-8 w-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  アイテム情報がありません
                </h3>
                <p className="text-gray-500 text-sm">
                  この推しが着用したアイテム情報はまだ登録されていません。
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {items.slice(0, 6).map((item) => (
                <Link key={item.id} to={`/items/${item.id}`}>
                  <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {item.brand && (
                              <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded-full font-medium">
                                {item.brand}
                              </span>
                            )}
                            {item.category && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                {item.category}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          {item.price && item.price > 0 && (
                            <div className="text-green-600 font-semibold text-sm mb-2">
                              ¥{item.price.toLocaleString()}
                            </div>
                          )}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.tags.slice(0, 3).map((tag, index) => (
                                <span 
                                  key={index} 
                                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {item.purchase_url && (
                          <div className="ml-4">
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {items.length > 6 && (
                <div className="text-center pt-4">
                  <Link to="/items">
                    <Button variant="outline" className="rounded-full">
                      すべてのアイテムを見る ({items.length}件)
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
        
      </div>
    </div>
  )
}