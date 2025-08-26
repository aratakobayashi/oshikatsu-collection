import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import Card, { CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import HeroSection from '../../components/HeroSection'
import FeaturedCarousel from '../../components/FeaturedCarousel'
import WikipediaAPITest from '../../components/WikipediaAPITest'
import DevDataCreator from '../../components/DevDataCreator'
import UserJourneyTest from '../../components/UserJourneyTest'
import DataStatusCheck from '../../components/DataStatusCheck'
import { db, supabase } from '../../lib/supabase'

// 必要な型定義を追加
type Celebrity = {
  id: string
  name: string
  slug: string
  image_url?: string | null
  group_name?: string | null
}

type Location = {
  id: string
  name: string
  slug: string
  address?: string | null
  description?: string | null
  tabelog_url?: string | null
}

type Episode = {
  id: string
  title: string
  date: string
  description?: string | null
  thumbnail_url?: string | null
  video_url?: string | null
}

// Star Logo Component
const StarLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
)

export default function Home() {
  const navigate = useNavigate()
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [recentEpisodes, setRecentEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  
  useEffect(() => {
    fetchData()
    // ページ読み込み時に必ずトップに戻す
    window.scrollTo(0, 0)
  }, [])
  
  
  async function handleSearch(searchQuery: string) {
    if (!searchQuery.trim()) return
    
    try {
      const searchTerm = searchQuery.trim().toLowerCase()
      
      // 1. Search celebrities first (highest priority)
      const celebrityMatch = celebrities.find(c => 
        c.name.toLowerCase().includes(searchTerm)
      )
      
      if (celebrityMatch) {
        navigate(`/celebrities/${celebrityMatch.slug}`)
        return
      }
      
      // 2. Search locations second
      const locationMatch = locations.find(l => 
        l.name.toLowerCase().includes(searchTerm)
      )
      
      if (locationMatch) {
        navigate(`/locations/${locationMatch.id}`)
        return
      }
      
      // 3. Fallback to items page
      navigate(`/items?search=${encodeURIComponent(searchQuery)}`)
      
    } catch (error) {
      console.error('Search error:', error)
      navigate(`/items?search=${encodeURIComponent(searchQuery)}`)
    }
  }
  
  async function fetchData() {
    try {
      // Test basic connection first
      const { error: connectionError } = await supabase.from('celebrities').select('count').limit(1)
      if (connectionError) {
        throw new Error(`Database connection failed: ${connectionError.message}`)
      }
      
      // 必要なデータのみフェッチする
      const [celebritiesData, locationsData, episodesData] = await Promise.all([
        db.celebrities.getAll(),
        db.locations.getAll(),
        db.episodes.getAll()
      ])
      
      if (celebritiesData.length === 0) {
        console.warn('No celebrities found in database, showing placeholder message')
      }
      
      if (episodesData.length === 0) {
        console.warn('No episodes found in database, showing placeholder message')
      }
      
      setCelebrities(celebritiesData)
      setLocations(locationsData)
      setRecentEpisodes(episodesData.slice(0, 6))
    } catch (error) {
      console.error('Error fetching data:', error)
      // データ取得に失敗した場合は空の配列を設定
      setCelebrities([])
      setRecentEpisodes([])
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    if (recentEpisodes.length === 0) return
    setCurrentSlide((prev) => (prev + 1) % recentEpisodes.length)
  }

  const prevSlide = () => {
    if (recentEpisodes.length === 0) return
    setCurrentSlide((prev) => (prev - 1 + recentEpisodes.length) % recentEpisodes.length)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <HeroSection onSearch={handleSearch} />

      {/* Featured Carousel Section */}
      <FeaturedCarousel />

      {/* Development Data Creator - 開発用 (開発環境でのみ表示) */}
      {import.meta.env.DEV && (
        <section className="py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <DataStatusCheck />
            <DevDataCreator />
            <div className="mt-8">
              <UserJourneyTest />
            </div>
          </div>
        </section>
      )}

      {/* Wikipedia API Test Section - 開発用 (開発環境でのみ表示) */}
      {import.meta.env.DEV && (
        <section className="py-20 bg-yellow-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4 mb-8">
              <h3 className="text-yellow-800 font-semibold mb-2">🚧 開発用セクション</h3>
              <p className="text-yellow-700 text-sm">
                Wikipedia APIのテスト用コンポーネントです。データ収集が完了したら削除予定です。
              </p>
            </div>
            <WikipediaAPITest />
          </div>
        </section>
      )}

      {/* Popular Celebrities Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              人気の推し
            </h2>
            <p className="text-xl text-gray-600">
              注目度の高い推しをチェック
            </p>
          </div>
          
          {celebrities.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 lg:gap-8">
              {celebrities.slice(0, 6).map((celebrity) => (
                <Link key={celebrity.id} to={`/celebrities/${celebrity.slug}`}>
                  <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 shadow-lg overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative">
                        {celebrity.image_url ? (
                          <img
                            src={celebrity.image_url}
                            alt={celebrity.name}
                            className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg'
                            }}
                          />
                        ) : (
                          <div className="w-full aspect-square bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <Users className="h-12 w-12 md:h-16 md:w-16 text-rose-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      
                      <div className="p-3 md:p-4 lg:p-6 text-center">
                        <h3 className="font-bold text-gray-900 mb-1 md:mb-2 group-hover:text-rose-600 transition-colors text-sm md:text-base">
                          {celebrity.name}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-500">{celebrity.group_name || '個人'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="shadow-xl border-0">
              <CardContent className="p-16 text-center">
                <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  まだ推しが登録されていません
                </h3>
                <p className="text-gray-500 mb-6">
                  データベースに推しの情報がありません。新しい推しを登録してください。
                </p>
                <Link to="/submit">
                  <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-full">
                    推しを質問する
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
          
          <div className="text-center mt-12">
            <Link to="/celebrities">
              <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                すべての推しを見る
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Episodes Carousel */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              ピックアップエピソード
            </h2>
            <p className="text-xl text-gray-600">
              最新の注目エピソードをチェック
            </p>
          </div>
          
          {recentEpisodes.length > 0 ? (
            <div className="relative">
              <div className="overflow-hidden rounded-2xl">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {recentEpisodes.map((episode) => (
                    <div key={episode.id} className="w-full flex-shrink-0">
                      <Card className="mx-4 shadow-xl border-0 overflow-hidden">
                        <CardContent className="p-0">
                          <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="relative h-48 md:h-56 lg:h-80">
                              {episode.thumbnail_url ? (
                                <img
                                  src={episode.thumbnail_url}
                                  alt={episode.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = 'https://images.pexels.com/photos/1040903/pexels-photo-1040903.jpeg'
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                  <Calendar className="h-12 w-12 md:h-16 md:w-16 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="p-4 md:p-6 lg:p-12 flex flex-col justify-center">
                              <div className="flex items-center text-xs md:text-sm text-gray-500 mb-2 md:mb-4">
                                <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                                {new Date(episode.date).toLocaleDateString()}
                              </div>
                              <h3 className="text-lg md:text-xl lg:text-3xl font-bold text-gray-900 mb-2 md:mb-4 leading-tight">
                                {episode.title}
                              </h3>
                              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed overflow-hidden">
                                {episode.description ? 
                                  (episode.description.length > 100 ? 
                                    episode.description.substring(0, 100) + '...' : 
                                    episode.description
                                  ) : 
                                  'エピソードの詳細はありません'
                                }
                              </p>
                              <Link to={`/episodes/${episode.id}`}>
                                <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base">
                                  詳細を見る
                                  <ArrowRight className="h-3 w-3 md:h-4 md:w-4 ml-2" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Carousel Controls - Only show if there are multiple episodes */}
              {recentEpisodes.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  
                  {/* Carousel Indicators */}
                  <div className="flex justify-center mt-8 space-x-2">
                    {recentEpisodes.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${
                          i === currentSlide ? 'bg-rose-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <Card className="shadow-xl border-0">
              <CardContent className="p-16 text-center">
                <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  まだエピソードが登録されていません
                </h3>
                <p className="text-gray-500 mb-6">
                  データベースにエピソードの情報がありません。新しいエピソードを登録してください。
                </p>
                <Link to="/submit">
                  <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-full">
                    エピソードを投稿する
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  )
}