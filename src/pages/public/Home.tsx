import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Calendar, MapPin, Package, ExternalLink, Star, TrendingUp, Users, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import Card, { CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { db, supabase, Celebrity, Episode, UserPost, Work } from '../../lib/supabase'

// Star Logo Component
const StarLogo = ({ className = "h-12 w-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
)

export default function Home() {
  const navigate = useNavigate()
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [recentEpisodes, setRecentEpisodes] = useState<Episode[]>([])
  const [recentPosts, setRecentPosts] = useState<UserPost[]>([])
  const [trendingWorks, setTrendingWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // Sample data for demonstration
  const sampleCelebrities = [
    { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: '二宮和也', slug: 'ninomiya-kazunari', image_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg', group: '嵐' },
    { id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012', name: '橋本涼', slug: 'hashimoto-ryo', image_url: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg', group: 'よにの' },
    { id: 'c3d4e5f6-g7h8-9012-cdef-345678901234', name: '田中美咲', slug: 'tanaka-misaki', image_url: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg', group: 'YouTuber' },
    { id: 'd4e5f6g7-h8i9-0123-defg-456789012345', name: '佐藤健太', slug: 'sato-kenta', image_url: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg', group: 'ファッション系' },
    { id: 'e5f6g7h8-i9j0-1234-efgh-567890123456', name: '山田花子', slug: 'yamada-hanako', image_url: 'https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg', group: 'ライフスタイル系' },
    { id: 'f6g7h8i9-j0k1-2345-fghi-678901234567', name: '鈴木一郎', slug: 'suzuki-ichiro', image_url: 'https://images.pexels.com/photos/1040882/pexels-photo-1040882.jpeg', group: 'お笑い' },
  ]

  const sampleEpisodes = [
    { id: 'ep1a2b3c-d4e5-f678-9012-345678901234', title: 'よにの朝ごはん#1', date: '2024-01-15', image: 'https://images.pexels.com/photos/1040903/pexels-photo-1040903.jpeg', description: '二宮和也の朝食ルーティンを紹介' },
    { id: 'ep2b3c4d-e5f6-g789-0123-456789012345', title: 'VS嵐#33', date: '2024-01-20', image: 'https://images.pexels.com/photos/1065105/pexels-photo-1065105.jpeg', description: '橋本涼がゲスト出演したバラエティ番組' },
    { id: 'ep3c4d5e-f6g7-h890-1234-567890123456', title: '美咲の美容ルーティン', date: '2024-01-25', image: 'https://images.pexels.com/photos/1043494/pexels-photo-1043494.jpeg', description: '田中美咲のスキンケア・メイクアップ' },
    { id: 'ep4d5e6f-g7h8-i901-2345-678901234567', title: 'ケンタのファッションチェック', date: '2024-02-01', image: 'https://images.pexels.com/photos/1040904/pexels-photo-1040904.jpeg', description: '佐藤健太の今季おすすめコーディネート' },
  ]
  
  useEffect(() => {
    fetchData()
  }, [])
  
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    try {
      const searchTerm = searchQuery.trim().toLowerCase()
      
      // Search celebrities
      const celebrityMatch = sampleCelebrities.find(c => 
        c.name.toLowerCase().includes(searchTerm)
      )
      
      if (celebrityMatch) {
        navigate(`/celebrities/${celebrityMatch.slug}`)
        return
      }
      
      // Fallback to items page
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
      
      const [celebritiesData, episodesData, postsData, trendingWorksData] = await Promise.all([
        db.celebrities.getAll(),
        db.episodes.getAll(),
        db.userPosts.getAll(),
        db.works.getTrending()
      ])
      setCelebrities(celebritiesData)
      setRecentEpisodes(episodesData.slice(0, 6))
      setRecentPosts(postsData.slice(0, 6))
      setTrendingWorks(trendingWorksData)
    } catch (error) {
      console.error('Error fetching data:', error)
      const errorMessage = error instanceof Error ? error.message : 'データの取得に失敗しました'
      // Use sample data as fallback
      setCelebrities(sampleCelebrities as any)
      setRecentEpisodes(sampleEpisodes as any)
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sampleEpisodes.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sampleEpisodes.length) % sampleEpisodes.length)
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
      <section className="relative bg-gradient-to-br from-rose-50 via-white to-pink-50 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Main Headline */}
            <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              推し活の聖地巡礼・私服特定を、<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
                もっとリッチに。
              </span>
            </h1>
            
            <p className="text-lg lg:text-xl text-gray-600 mb-10 leading-relaxed">
              推しの私服・愛用品・訪問店舗をみんなで共有・発見
            </p>
            
            {/* Search Bar */}
            <div className="max-w-3xl mx-auto mb-12">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="推し・グループ・番組・ブランド名で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-8 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:border-rose-400 focus:outline-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm"
                  />
                  <Button 
                    type="submit"
                    className="absolute right-2 top-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-xl px-8 py-3.5"
                    disabled={!searchQuery.trim()}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </div>
              </form>
              
              {/* Search Suggestions */}
              <div className="mt-5 flex flex-wrap gap-2 justify-center">
                <span className="text-sm text-gray-500">人気検索:</span>
                {['二宮和也', 'GUCCI', 'Nike', '代官山', 'カフェ'].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setSearchQuery(term)
                      handleSearch({ preventDefault: () => {} } as React.FormEvent)
                    }}
                    className="px-3 py-1.5 bg-white text-rose-600 text-sm rounded-full border border-rose-200 hover:bg-rose-50 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/celebrities">
                <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                  <Users className="h-5 w-5 mr-2" />
                  推し一覧を見る
                </Button>
              </Link>
              <Link to="/posts">
                <Button variant="outline" className="border-2 border-rose-200 text-rose-600 hover:bg-rose-50 px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                  みんなの質問を見る
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

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
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {sampleCelebrities.map((celebrity) => (
              <Link key={celebrity.id} to={`/celebrities/${celebrity.slug}`}>
                <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 shadow-lg overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={celebrity.image_url}
                        alt={celebrity.name}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    <div className="p-6 text-center">
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-rose-600 transition-colors">
                        {celebrity.name}
                      </h3>
                      <p className="text-sm text-gray-500">{celebrity.group}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
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
          
          <div className="relative">
            <div className="overflow-hidden rounded-2xl">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {sampleEpisodes.map((episode, index) => (
                  <div key={episode.id} className="w-full flex-shrink-0">
                    <Card className="mx-4 shadow-xl border-0 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                          <div className="relative h-64 lg:h-80">
                            <img
                              src={episode.image}
                              alt={episode.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-8 lg:p-12 flex flex-col justify-center">
                            <div className="flex items-center text-sm text-gray-500 mb-4">
                              <Calendar className="h-4 w-4 mr-2" />
                              {new Date(episode.date).toLocaleDateString()}
                            </div>
                            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                              {episode.title}
                            </h3>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                              {episode.description}
                            </p>
                            <Link to={`/episodes/${episode.id}`}>
                              <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 py-3 rounded-full">
                                詳細を見る
                                <ArrowRight className="h-4 w-4 ml-2" />
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
            
            {/* Carousel Controls */}
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
              {sampleEpisodes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentSlide ? 'bg-rose-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              推し活をもっと楽しく
            </h2>
            <p className="text-xl text-gray-600">
              ファン同士で情報を共有し、お気に入りのアイテムやスポットを発見
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-rose-100 to-pink-100 p-6 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Package className="h-10 w-10 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">アイテム発見</h3>
              <p className="text-gray-600 leading-relaxed">
                推しの私服・アクセサリーを特定し、購入リンクで簡単ショッピング
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-6 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">ロケ地探訪</h3>
              <p className="text-gray-600 leading-relaxed">
                撮影場所・お店を特定し、実際に訪れて同じ体験を楽しもう
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-green-100 to-teal-100 p-6 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">コミュニティ</h3>
              <p className="text-gray-600 leading-relaxed">
                ファン同士で知識を共有し、みんなで疑問を解決
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-rose-400">
                  <StarLogo className="h-8 w-8" />
                </div>
                <span className="text-xl font-bold">推し活コレクション</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                推し活の聖地巡礼・私服特定をもっとリッチに。<br />
                ファン同士で情報を共有し、お気に入りのアイテムやスポットを発見するプラットフォームです。
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323C6.001 8.198 7.152 7.708 8.449 7.708s2.448.49 3.323 1.416c.875.875 1.365 2.026 1.365 3.323s-.49 2.448-1.365 3.323c-.875.807-2.026 1.218-3.323 1.218z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">サービス</h3>
              <ul className="space-y-4">
                <li><Link to="/celebrities" className="text-gray-400 hover:text-white transition-colors">推し一覧</Link></li>
                <li><Link to="/items" className="text-gray-400 hover:text-white transition-colors">アイテム</Link></li>
                <li><Link to="/locations" className="text-gray-400 hover:text-white transition-colors">店舗・ロケ地</Link></li>
                <li><Link to="/posts" className="text-gray-400 hover:text-white transition-colors">質問・投稿</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">サポート</h3>
              <ul className="space-y-4">
                <li><Link to="/how-to-use" className="text-gray-400 hover:text-white transition-colors">使い方</Link></li>
                <li><Link to="/faq" className="text-gray-400 hover:text-white transition-colors">よくある質問</Link></li>
                <li><a href="https://oshikatsu-guide.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">推し活ガイドブック</a></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">お問い合わせ</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 推し活コレクション. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}