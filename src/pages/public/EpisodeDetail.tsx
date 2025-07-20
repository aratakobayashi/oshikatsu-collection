import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Package, ExternalLink, User, ShoppingBag, Camera } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import Disclaimer, { AffiliateDisclaimer } from '../../components/Disclaimer'
import { db } from '../../lib/supabase'

// 型定義
interface Celebrity {
  id: string
  name: string
  slug: string
}

interface Episode {
  id: string
  title: string
  date: string
  notes?: string
  celebrity?: Celebrity
}

interface Location {
  id: string
  name: string
  address?: string
  menu_example: string[]
  image_urls: string[]
  reservation_url?: string
  map_url?: string
}

interface Item {
  id: string
  name: string
  brand?: string
  description?: string
  color?: string
  material?: string
  category?: string
  subcategory?: string
  price: number
  affiliate_url?: string
  image_url?: string
  is_available?: boolean
}

export default function EpisodeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (id) {
      fetchEpisodeData(id)
    }
  }, [id])
  
  async function fetchEpisodeData(id: string) {
    try {
      const [episodeData, locationsData, itemsData] = await Promise.all([
        db.episodes.getById(id),
        db.locations.getByEpisodeId(id),
        db.items.getByEpisodeId(id)
      ])
      
      setEpisode(episodeData)
      setLocations(locationsData)
      setItems(itemsData)
    } catch (error) {
      console.error('Error fetching episode data:', error)
      setError('Episode not found')
    } finally {
      setLoading(false)
    }
  }

  // 投稿フォームに遷移（エピソード情報を事前入力）
  function handleSubmitQuestion() {
    if (!episode) return
    
    navigate('/submit', {
      state: {
        episodeId: episode.id,
        episodeTitle: episode.title,
        celebrityName: episode.celebrity?.name,
        prefilledText: `${episode.title}で${episode.celebrity?.name || ''}さんが着用していたアイテムについて教えてください`
      }
    })
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (error || !episode) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">エピソードが見つかりません</h1>
            <p className="text-gray-600 mb-6">お探しのエピソードは存在しません。</p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ホームに戻る
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Episode Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-6 w-6" />
          <span className="text-lg">{new Date(episode.date).toLocaleDateString()}</span>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">{episode.title}</h1>
        
        <div className="flex items-center space-x-4">
          <Link
            to={`/celebrities/${episode.celebrity?.slug}`}
            className="inline-flex items-center bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            <User className="h-4 w-4 mr-2" />
            {episode.celebrity?.name}
          </Link>
          
          <div className="flex items-center space-x-4 text-white opacity-90">
            <span className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {locations.length} ロケーション
            </span>
            <span className="flex items-center">
              <Package className="h-4 w-4 mr-1" />
              {items.length} アイテム
            </span>
          </div>
        </div>
      </div>
      
      {/* Episode Notes */}
      {episode.notes && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900">エピソードメモ</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{episode.notes}</p>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Locations */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">ロケーション</h2>
          
          {locations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">このエピソードのロケーションが見つかりません。</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {locations.map((location) => (
                <Card key={location.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {location.name}
                    </h3>
                    
                    {location.address && (
                      <p className="text-gray-600 mb-4">{location.address}</p>
                    )}
                    
                        {location.menu_example && location.menu_example.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">メニューアイテム:</h4>
                        <div className="flex flex-wrap gap-2">
                          {location.menu_example.map((item: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {location.image_urls && location.image_urls.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">写真:</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {location.image_urls.slice(0, 4).map((url: string, index: number) => (
                            <img
                              key={index}
                              src={url}
                              alt={`${location.name} photo ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {location.reservation_url && (
                      <div className="mt-4">
                        <a
                          href={location.reservation_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          予約・詳細を見る
                        </a>
                      </div>
                    )}
                    
                    {location.map_url && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">マップ:</h4>
                        <a
                          href={location.map_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          マップを見る
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Items Section - 大幅改良 */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🛍️ 着用推定アイテム</h2>
          
          {/* 免責事項 */}
          <Disclaimer type="items" className="mb-6" />
          
          {items.length === 0 ? (
            /* アイテムがない場合の改良UI */
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <Package className="h-16 w-16 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      現在、着用アイテムの情報がありません
                    </h3>
                    <p className="text-gray-600 mb-4">
                      このエピソードで着用されていたアイテムをご存知ですか？
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={handleSubmitQuestion}
                      className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      写真を投稿して質問する
                    </Button>
                    
                    <p className="text-xs text-gray-500">
                      エピソードの詳細情報を事前入力してお送りします
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* アイテムがある場合の表示 */
            <div className="space-y-6">
              {items.map((item) => (
                <Card key={item.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-start space-x-4 p-6">
                      {/* 商品画像 */}
                      <div className="flex-shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-24 h-24 object-cover rounded-lg shadow-md"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* 商品情報 */}
                      <div className="flex-1 min-w-0">
                        {/* ブランド */}
                        {item.brand && (
                          <p className="text-sm font-semibold text-blue-600 mb-1">{item.brand}</p>
                        )}
                        
                        {/* 商品名 */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {item.name}
                        </h3>
                        
                        {/* 説明 */}
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                            {item.description}
                          </p>
                        )}
                        
                        {/* 詳細情報 */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.color && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {item.color}
                            </span>
                          )}
                          {item.material && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              {item.material}
                            </span>
                          )}
                          {item.category && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              {item.subcategory || item.category}
                            </span>
                          )}
                        </div>
                        
                        {/* 価格 */}
                        {item.price > 0 && (
                          <div className="text-2xl font-bold text-green-600 mb-3">
                            ¥{item.price.toLocaleString()}
                            <span className="text-sm text-gray-500 font-normal ml-2">税込</span>
                          </div>
                        )}
                        
                        {/* 購入ボタン */}
                        <div className="flex space-x-2">
                          {item.affiliate_url && (
                            <a
                              href={item.affiliate_url}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              className="inline-flex items-center bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 font-medium text-sm shadow-lg hover:shadow-xl"
                            >
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              購入する
                            </a>
                          )}
                          
                          <Link
                            to={`/items/${item.id}`}
                            className="inline-flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                          >
                            詳細を見る
                          </Link>
                        </div>
                        
                        {/* 在庫・利用可能性 */}
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.is_available 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {item.is_available ? '在庫あり' : '在庫なし'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* アフィリエイト表記 */}
              <AffiliateDisclaimer />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}