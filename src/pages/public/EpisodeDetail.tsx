import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, MapPin, Package, ExternalLink, User } from 'lucide-react'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { db, Episode, Location, Item } from '../../lib/supabase'

export default function EpisodeDetail() {
  const { id } = useParams<{ id: string }>()
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
                    
                    {location.menu_example.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">メニューアイテム:</h4>
                        <div className="flex flex-wrap gap-2">
                          {location.menu_example.map((item, index) => (
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
                    
                    {location.image_urls.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">写真:</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {location.image_urls.slice(0, 4).map((url, index) => (
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
        
        {/* Items */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">注目アイテム</h2>
          
          {items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">このエピソードのアイテムが見つかりません。</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h3>
                        
                        {item.brand && (
                          <p className="text-gray-600 mb-2">{item.brand}</p>
                        )}
                        
                        {item.price > 0 && (
                          <p className="text-2xl font-bold text-green-600 mb-3">
                            ¥{item.price.toLocaleString()}
                          </p>
                        )}
                        
                        {item.affiliate_url && (
                          <a
                            href={item.affiliate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            商品を見る
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}