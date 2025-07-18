import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, ExternalLink, MapPin, Package, Users, Award, Globe, ArrowLeft, Star, Heart, Eye, Play, Filter, Search } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { db, Celebrity, Episode } from '../../lib/supabase'

interface EpisodeWithDetails extends Episode {
  celebrity?: {
    id: string
    name: string
    slug: string
  }
}

export default function CelebrityProfile() {
  const { slug } = useParams<{ slug: string }>()
  const [celebrity, setCelebrity] = useState<Celebrity | null>(null)
  const [episodes, setEpisodes] = useState<EpisodeWithDetails[]>([])
  const [filteredEpisodes, setFilteredEpisodes] = useState<EpisodeWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Episode filters
  const [episodeSearch, setEpisodeSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  
  useEffect(() => {
    if (slug) {
      fetchCelebrityData(slug)
    }
  }, [slug])
  
  useEffect(() => {
    filterEpisodes()
  }, [episodes, episodeSearch, platformFilter, yearFilter])
  
  async function fetchCelebrityData(slug: string) {
    try {
      console.log('🔍 [DEBUG] fetchCelebrityData called with slug:', slug)
      
      const celebrityData = await db.celebrities.getBySlug(slug)
      
      if (!celebrityData) {
        console.warn('⚠️ [DEBUG] No celebrity found for slug:', slug)
        setError('該当する推しが見つかりません')
        return
      }
      
      console.log('👤 [DEBUG] Celebrity data fetched:', celebrityData)
      console.log('🆔 [DEBUG] Celebrity ID:', celebrityData.id)
      setCelebrity(celebrityData)
      
      console.log('📺 [DEBUG] Fetching episodes for celebrity_id:', celebrityData.id)
      const episodesData = await db.episodes.getByCelebrityId(celebrityData.id)
      console.log('📺 [DEBUG] Episodes data received:', episodesData)
      console.log('📊 [DEBUG] Episodes count:', episodesData?.length || 0)
      
      if (episodesData && episodesData.length > 0) {
        console.log('✅ [DEBUG] First episode sample:', episodesData[0])
      } else {
        console.warn('⚠️ [DEBUG] No episodes found for celebrity_id:', celebrityData.id)
      }
      
      setEpisodes(episodesData)
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
    console.log('🔍 [DEBUG] filterEpisodes called')
    console.log('📺 [DEBUG] Total episodes before filter:', episodes.length)
    console.log('🔍 [DEBUG] Filter conditions:', { episodeSearch, platformFilter, yearFilter })
    
    let filtered = [...episodes]
    
    // Search filter
    if (episodeSearch) {
      const term = episodeSearch.toLowerCase()
      filtered = filtered.filter(episode =>
        episode.title.toLowerCase().includes(term) ||
        episode.description?.toLowerCase().includes(term)
      )
      console.log('🔍 [DEBUG] After search filter:', filtered.length)
    }
    
    // Platform filter
    if (platformFilter) {
      filtered = filtered.filter(episode => episode.platform === platformFilter)
      console.log('🔍 [DEBUG] After platform filter:', filtered.length)
    }
    
    // Year filter
    if (yearFilter) {
      filtered = filtered.filter(episode => 
        new Date(episode.date).getFullYear().toString() === yearFilter
      )
      console.log('🔍 [DEBUG] After year filter:', filtered.length)
    }
    
    console.log('✅ [DEBUG] Final filtered episodes count:', filtered.length)
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
            {/* デバッグ情報表示 */}
            <div className="text-xs text-gray-400 mt-1">
              DEBUG: episodes={episodes.length}, filtered={filteredEpisodes.length}, celebrity_id={celebrity?.id}
            </div>
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
            {filteredEpisodes.map((episode) => (
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
                        
                        {episode.video_url && (
                          <div className="flex items-center text-xs text-rose-600">
                            <Play className="h-3 w-3 mr-1" />
                            動画あり
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}