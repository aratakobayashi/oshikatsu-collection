import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroSection from '../../components/HeroSection'
import FeaturedCarousel from '../../components/FeaturedCarousel'
import WikipediaAPITest from '../../components/WikipediaAPITest'
import DevDataCreator from '../../components/DevDataCreator'
import UserJourneyTest from '../../components/UserJourneyTest'
import DataStatusCheck from '../../components/DataStatusCheck'


// Star Logo Component
const StarLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
)

export default function Home() {
  const navigate = useNavigate()
  
  useEffect(() => {
    // ページ読み込み時に必ずトップに戻す
    window.scrollTo(0, 0)
  }, [])
  
  async function handleSearch(searchQuery: string) {
    if (!searchQuery.trim()) return
    
    try {
      // 検索クエリで直接items検索ページに移動
      navigate(`/items?search=${encodeURIComponent(searchQuery)}`)
    } catch (error) {
      console.error('Search error:', error)
      navigate(`/items?search=${encodeURIComponent(searchQuery)}`)
    }
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


    </div>
  )
}