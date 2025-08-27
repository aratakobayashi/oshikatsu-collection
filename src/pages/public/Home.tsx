import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Play, MapPin, Package } from 'lucide-react'
import { MetaTags, generateSEO } from '../../components/SEO/MetaTags'
import { StructuredData, generateStructuredData } from '../../components/SEO/StructuredData'
import HeroSection from '../../components/HeroSection'
import SectionCarousel from '../../components/SectionCarousel'
import WikipediaAPITest from '../../components/WikipediaAPITest'
import DevDataCreator from '../../components/DevDataCreator'
import UserJourneyTest from '../../components/UserJourneyTest'
import DataStatusCheck from '../../components/DataStatusCheck'
import { db } from '../../lib/supabase'
import { getSearchPath, detectSearchType } from '../../utils/searchHelper'


// Star Logo Component
const StarLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
)

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

export default function Home() {
  const navigate = useNavigate()
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // ページ読み込み時に必ずトップに戻す
    window.scrollTo(0, 0)
    fetchData()
  }, [])
  
  async function fetchData() {
    try {
      // Supabaseから実データを並行取得
      const [celebritiesData, episodesData, locationsData, itemsData] = await Promise.all([
        db.celebrities.getAll(),
        db.episodes.getAll(),
        db.locations.getAll(),
        db.items.getAll()
      ])

      setCelebrities(celebritiesData)
      setEpisodes(episodesData)
      setLocations(locationsData)
      setItems(itemsData)
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function handleSearch(searchQuery: string) {
    if (!searchQuery.trim()) return
    
    try {
      // 🧠 インテリジェント検索：内容を判定して適切なページへ遷移
      const searchPath = getSearchPath(searchQuery.trim())
      const searchType = detectSearchType(searchQuery.trim())
      
      // デバッグログ（開発時のみ）
      if (import.meta.env.DEV) {
        console.log('🔍 Smart Search:', {
          query: searchQuery,
          type: searchType,
          path: searchPath
        })
      }
      
      navigate(searchPath)
    } catch (error) {
      console.error('Search error:', error)
      // エラー時のフォールバック
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
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
  
  const homeSEO = generateSEO.home()
  const websiteStructuredData = generateStructuredData.website()

  return (
    <div className="bg-white">
      <MetaTags 
        title={homeSEO.title}
        description={homeSEO.description}
        keywords={homeSEO.keywords}
        canonicalUrl="https://collection.oshikatsu-guide.com/"
        ogUrl="https://collection.oshikatsu-guide.com/"
      />
      
      <StructuredData data={websiteStructuredData} />
      
      {/* Hero Section */}
      <HeroSection onSearch={handleSearch} />

      {/* 4つの独立したカルーセルセクション */}
      
      {/* 1. 人気のタレント・推し */}
      <SectionCarousel
        title="人気のタレント・推し"
        subtitle="よにのちゃんねる、SixTONES、Snow Man..."
        icon={Users}
        color="text-purple-600"
        bgGradient="from-purple-50 to-indigo-50"
        items={celebrities}
        type="celebrity"
        linkPath="/celebrities"
      />

      {/* 2. 話題のエピソード */}
      <SectionCarousel
        title="話題のエピソード"
        subtitle="最新の動画・番組をチェック"
        icon={Play}
        color="text-rose-600"
        bgGradient="from-rose-50 to-pink-50"
        items={episodes}
        type="episode"
        linkPath="/episodes"
      />

      {/* 3. 聖地巡礼スポット */}
      <SectionCarousel
        title="聖地巡礼スポット"
        subtitle="推しが訪れたカフェ・レストラン"
        icon={MapPin}
        color="text-green-600"
        bgGradient="from-green-50 to-emerald-50"
        items={locations}
        type="location"
        linkPath="/locations"
      />

      {/* 4. 推しアイテム */}
      <SectionCarousel
        title="推しアイテム"
        subtitle="愛用コスメ・ファッション・グッズ"
        icon={Package}
        color="text-orange-600"
        bgGradient="from-orange-50 to-amber-50"
        items={items}
        type="item"
        linkPath="/items"
      />

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


    </div>
  )
}