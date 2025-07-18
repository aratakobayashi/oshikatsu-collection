import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Calendar, Film, Tv, Video, Star, Package, MapPin, MessageSquare } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { db, Work } from '../../lib/supabase'

interface WorkWithRelated {
  work: Work
  items: any[]
  locations: any[]
  episodes: any[]
  posts: any[]
}

export default function WorkDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [workData, setWorkData] = useState<WorkWithRelated | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (slug) {
      fetchWorkData(slug)
    }
  }, [slug])
  
  async function fetchWorkData(slug: string) {
    try {
      // Decode the URL slug in case it contains encoded characters
      const decodedSlug = decodeURIComponent(slug)
      const work = await db.works.getBySlug(decodedSlug)
      
      if (!work) {
        setError('該当作品が見つかりません')
        return
      }
      
      // Fetch related data
      const [itemsData, locationsData, episodesData, postsData] = await Promise.all([
        db.supabase
          .from('items')
          .select(`
            *,
            episode:episodes(title, celebrity:celebrities(name, slug))
          `)
          .eq('work_id', work.id),
        db.supabase
          .from('locations')
          .select(`
            *,
            episode:episodes(title, celebrity:celebrities(name, slug))
          `)
          .eq('work_id', work.id),
        db.supabase
          .from('episodes')
          .select(`
            *,
            celebrity:celebrities(name, slug)
          `)
          .eq('work_id', work.id),
        db.supabase
          .from('user_posts')
          .select(`
            *,
            user:users(username, display_name),
            celebrity:celebrities(name, slug)
          `)
          .eq('work_id', work.id)
      ])
      
      setWorkData({
        work,
        items: itemsData.data || [],
        locations: locationsData.data || [],
        episodes: episodesData.data || [],
        posts: postsData.data || []
      })
    } catch (error) {
      console.error('Error fetching work data:', error)
      // エラーメッセージをそのまま表示
      const errorMessage = error instanceof Error ? error.message : '作品が見つかりません'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  function getTypeIcon(type: string) {
    switch (type) {
      case 'drama':
        return <Tv className="h-6 w-6" />
      case 'movie':
        return <Film className="h-6 w-6" />
      case 'cm':
        return <Video className="h-6 w-6" />
      case 'variety':
        return <Star className="h-6 w-6" />
      default:
        return <Film className="h-6 w-6" />
    }
  }
  
  function getTypeLabel(type: string) {
    const labels = {
      drama: 'ドラマ',
      movie: '映画',
      cm: 'CM',
      variety: 'バラエティ',
      other: 'その他'
    }
    return labels[type as keyof typeof labels] || type
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (error || !workData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
            <p className="text-gray-600 mb-6">
              {error === '該当作品が見つかりません' 
                ? 'お探しの作品は存在しないか、URLが間違っている可能性があります。' 
                : 'しばらく時間をおいてから再度お試しください。'}
            </p>
            <Link to="/works">
              <Button className="bg-blue-600 hover:bg-blue-700">
                作品一覧に戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const { work, items, locations, episodes, posts } = workData
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/works" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            作品一覧に戻る
          </Link>
        </div>
        
        {/* Work Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-8 mb-8">
          <div className="flex items-start space-x-6">
            {work.poster_url && (
              <img
                src={work.poster_url}
                alt={work.title}
                className="w-32 h-48 rounded-lg object-cover border-4 border-white shadow-lg"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                {getTypeIcon(work.type)}
                <span className="text-lg font-medium">{getTypeLabel(work.type)}</span>
              </div>
              
              <h1 className="text-4xl font-bold mb-4">{work.title}</h1>
              
              {work.description && (
                <p className="text-xl opacity-90 mb-4">{work.description}</p>
              )}
              
              <div className="flex items-center space-x-6 text-sm opacity-80">
                {work.release_date && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(work.release_date).toLocaleDateString()}
                  </div>
                )}
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  {items.length} アイテム
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {locations.length} 店舗
                </div>
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {posts.length} 投稿
                </div>
              </div>
              
              {work.official_site && (
                <div className="mt-6">
                  <a
                    href={work.official_site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    公式サイト
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Items */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">関連アイテム</h2>
            
            {items.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">この作品に関連するアイテムが見つかりません。</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {items.slice(0, 6).map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          {item.brand && (
                            <p className="text-sm text-gray-500">{item.brand}</p>
                          )}
                          {item.episode?.celebrity && (
                            <p className="text-sm text-blue-600">
                              {item.episode.celebrity.name}が着用
                            </p>
                          )}
                        </div>
                        {item.price > 0 && (
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              ¥{item.price.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {items.length > 6 && (
                  <div className="text-center">
                    <Link to={`/items?work=${work.id}`}>
                      <Button variant="outline">
                        すべてのアイテムを見る ({items.length}件)
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Locations */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">関連店舗</h2>
            
            {locations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">この作品に関連する店舗が見つかりません。</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {locations.slice(0, 6).map((location) => (
                  <Card key={location.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900">{location.name}</h3>
                        {location.address && (
                          <p className="text-sm text-gray-600">{location.address}</p>
                        )}
                        {location.episode?.celebrity && (
                          <p className="text-sm text-blue-600">
                            {location.episode.celebrity.name}が訪問
                          </p>
                        )}
                        {location.menu_example.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {location.menu_example.slice(0, 3).map((item: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {locations.length > 6 && (
                  <div className="text-center">
                    <Link to={`/locations?work=${work.id}`}>
                      <Button variant="outline">
                        すべての店舗を見る ({locations.length}件)
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* User Posts */}
        {posts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">関連する質問・投稿</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.slice(0, 6).map((post) => (
                <Link key={post.id} to={`/posts/${post.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>投稿者: {post.user?.display_name}</p>
                        {post.celebrity && (
                          <p className="text-blue-600">関連: {post.celebrity.name}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            
            {posts.length > 6 && (
              <div className="text-center mt-6">
                <Link to={`/posts?work=${work.id}`}>
                  <Button variant="outline">
                    すべての投稿を見る ({posts.length}件)
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}