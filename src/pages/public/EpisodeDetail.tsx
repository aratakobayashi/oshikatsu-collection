import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Package, ExternalLink, User, ShoppingBag, Camera, Play, Clock, Eye, ChevronRight, AlertCircle, Utensils } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import Disclaimer, { AffiliateDisclaimer } from '../../components/Disclaimer'
import VerificationButton from '../../components/VerificationButton'
import { db, supabase } from '../../lib/supabase'

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
  video_url?: string
  thumbnail_url?: string
  view_count?: number
  duration?: number
  description?: string
  platform?: string
}

interface Location {
  id: string
  name: string
  slug: string
  address?: string
  description?: string
  website_url?: string
  phone?: string
  tags?: string[]
  image_url?: string
  tabelog_url?: string
}

interface Item {
  id: string
  name: string
  slug: string
  brand?: string
  description?: string
  category?: string
  price?: number
  purchase_url?: string
  image_url?: string
  tags?: string[]
}

export default function EpisodeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [relatedEpisodes, setRelatedEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    console.log('🔍 EpisodeDetail mounted with ID:', id)
    if (id) {
      fetchEpisodeData(id)
    } else {
      console.error('❌ No episode ID found in URL params')
      setError('エピソードIDが見つかりません')
      setLoading(false)
    }
  }, [id])
  
  async function fetchEpisodeData(id: string) {
    try {
      console.log('🔍 Fetching episode data for ID:', id)
      
      // エピソード情報取得
      const episodeData = await db.episodes.getById(id)
      setEpisode(episodeData)
      
      // 関連するロケーション取得（中間テーブル経由）
      const { data: episodeLocations } = await supabase
        .from('episode_locations')
        .select(`
          location_id,
          locations (
            id,
            name,
            slug,
            address,
            description,
            website_url,
            phone,
            tags,
            image_url,
            tabelog_url
          )
        `)
        .eq('episode_id', id)
      
      // locations データを展開
      const locationsData = episodeLocations?.map(item => item.locations).filter(Boolean) || []
      
      console.log('🏪 Found locations:', locationsData?.length || 0)
      setLocations(locationsData || [])
      
      // 関連するアイテム取得（直接 items テーブルから）
      const { data: itemsData } = await supabase
        .from('items')
        .select(`
          id,
          name,
          slug,
          brand,
          description,
          category,
          price,
          purchase_url,
          image_url,
          tags
        `)
        .eq('episode_id', id)
      
      console.log('🛍️ Found items:', itemsData?.length || 0)
      setItems(itemsData || [])
      
      // 関連エピソードを取得（同じタレントの他のエピソード）
      if (episodeData.celebrity?.id) {
        const relatedEpisodesData = await db.episodes.getByCelebrityId(episodeData.celebrity.id)
        // 現在のエピソードを除外して最新5件を取得
        const filtered = relatedEpisodesData
          .filter(ep => ep.id !== id)
          .slice(0, 5)
        setRelatedEpisodes(filtered)
      }
      
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
  
  // YouTube動画IDを抽出する関数
  function getYouTubeEmbedUrl(url: string): string | null {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : null
  }

  const embedUrl = episode.video_url ? getYouTubeEmbedUrl(episode.video_url) : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Episode Header with Video/Thumbnail */}
      <div className="mb-8">
        {/* Video or Thumbnail Section */}
        {(embedUrl || episode.thumbnail_url) && (
          <div className="mb-6">
            {embedUrl ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg shadow-2xl"
                  src={embedUrl}
                  title={episode.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : episode.thumbnail_url ? (
              <div className="relative">
                <img
                  src={episode.thumbnail_url}
                  alt={episode.title}
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
                {episode.video_url && (
                  <a
                    href={episode.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg hover:bg-opacity-50 transition-opacity"
                  >
                    <div className="bg-white rounded-full p-4">
                      <Play className="h-12 w-12 text-red-600" fill="currentColor" />
                    </div>
                  </a>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Episode Info Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-6 text-white">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{new Date(episode.date).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              
              {episode.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{episode.duration}分</span>
                </div>
              )}
              
              {episode.view_count && episode.view_count > 0 && (
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  <span>{episode.view_count.toLocaleString()}回視聴</span>
                </div>
              )}
              
              {episode.platform && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {episode.platform === 'youtube' ? 'YouTube' : episode.platform}
                </span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{episode.title}</h1>
            
            {episode.description && (
              <p className="text-white/90 mb-4">{episode.description}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to={`/celebrities/${episode.celebrity?.slug}`}
                className="inline-flex items-center bg-white text-rose-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <User className="h-4 w-4 mr-2" />
                {episode.celebrity?.name}
              </Link>
              
              <div className="flex items-center gap-4 text-white">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {locations.length} ロケーション
                </span>
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {items.length} アイテム
                </span>
              </div>
              
              {episode.video_url && !embedUrl && (
                <a
                  href={episode.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  動画を見る
                </a>
              )}
            </div>
          </div>
        </Card>
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
              {/* 推定ロケーション注意書き */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-800 mb-1">推定ロケーションについて</h4>
                    <p className="text-sm text-amber-700">
                      以下のロケーション情報は、動画の内容から自動で推測されたものです。
                      正確性を保証するものではありません。ユーザーの皆様からの確認情報をお待ちしています。
                    </p>
                  </div>
                </div>
              </div>
              
              {locations.map((location) => (
                <Card key={location.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-amber-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <Link to={`/locations/${location.id}`}>
                          <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
                            {location.name}
                          </h3>
                        </Link>
                        <VerificationButton
                          itemId={location.id}
                          itemType="location"
                          itemName={location.name}
                          currentVerifications={0}
                          onVerify={(itemId, isCorrect) => {
                            // TODO: 実際の確認機能を実装
                            console.log(`Location ${itemId} verified as ${isCorrect ? 'correct' : 'incorrect'}`)
                            alert(isCorrect ? '確認ありがとうございます！' : 'フィードバックありがとうございます。改善いたします。')
                          }}
                        />
                      </div>
                    </div>
                    
                    {location.address && (
                      <div className="flex items-start space-x-2 text-gray-600 mb-3">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>{location.address}</p>
                      </div>
                    )}
                    
                    {location.description && (
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {location.description}
                      </p>
                    )}
                    
                    {location.tags && location.tags.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {location.tags.slice(0, 4).map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mt-4">
                      <Link to={`/locations/${location.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          詳細を見る
                        </Button>
                      </Link>
                      
                      {/* 食べログ予約CTAボタン */}
                      {location.tabelog_url && (
                        <a
                          href={location.tabelog_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                            <Utensils className="h-4 w-4" />
                            食べログで予約する
                          </Button>
                        </a>
                      )}
                      
                      {location.website_url && (
                        <a
                          href={location.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                            <ExternalLink className="h-4 w-4" />
                            公式サイト
                          </Button>
                        </a>
                      )}
                    </div>
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
              {/* 推定アイテム注意書き */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">推定着用アイテムについて</h4>
                    <p className="text-sm text-blue-700">
                      以下のアイテム情報は、動画の内容から自動で推測されたものです。
                      正確性を保証するものではありません。購入前に商品詳細をご確認ください。
                    </p>
                  </div>
                </div>
              </div>
              
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
                        
                        {/* タグ情報 */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.tags.slice(0, 3).map((tag, tagIndex) => (
                              <span key={tagIndex} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* 価格 */}
                        {item.price && item.price > 0 && (
                          <div className="text-2xl font-bold text-green-600 mb-3">
                            ¥{item.price.toLocaleString()}
                            <span className="text-sm text-gray-500 font-normal ml-2">税込</span>
                          </div>
                        )}
                        
                        {/* 購入ボタン */}
                        <div className="flex space-x-2">
                          {item.purchase_url && (
                            <a
                              href={item.purchase_url}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              className="inline-flex items-center bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 font-medium text-sm shadow-lg hover:shadow-xl"
                            >
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              購入する
                            </a>
                          )}
                          
                          <Link
                            to={`/items/${item.slug}`}
                            className="inline-flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                          >
                            詳細を見る
                          </Link>
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

      {/* Related Episodes Section */}
      {relatedEpisodes.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Play className="h-6 w-6 mr-2 text-rose-500" />
            関連エピソード
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedEpisodes.map((relatedEp) => (
              <Link 
                key={relatedEp.id} 
                to={`/episodes/${relatedEp.id}`}
                className="block"
              >
                <Card className="hover:shadow-xl transition-all duration-300 h-full">
                  {relatedEp.thumbnail_url && (
                    <div className="relative aspect-video">
                      <img
                        src={relatedEp.thumbnail_url}
                        alt={relatedEp.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                      {relatedEp.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                          {relatedEp.duration}分
                        </div>
                      )}
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(relatedEp.date).toLocaleDateString('ja-JP')}</span>
                      {relatedEp.view_count && relatedEp.view_count > 0 && (
                        <>
                          <Eye className="h-4 w-4 ml-2" />
                          <span>{relatedEp.view_count.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-rose-600 transition-colors">
                      {relatedEp.title}
                    </h3>
                    
                    {relatedEp.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {relatedEp.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-1 text-rose-600 mt-3 text-sm font-medium">
                      <span>詳細を見る</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}