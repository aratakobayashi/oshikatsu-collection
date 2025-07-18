import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Tag, Calendar, MapPin } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { db } from '../../lib/supabase'

interface ItemWithDetails {
  id: string
  name: string
  brand: string
  affiliate_url: string
  image_url: string
  price: number
  category: string
  subcategory: string
  currency: string
  description: string
  color: string
  size: string
  material: string
  is_available: boolean
  episode?: {
    id: string
    title: string
    date: string
    celebrity?: {
      name: string
      slug: string
    }
  }
}

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<ItemWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (id) {
      fetchItem(id)
    }
  }, [id])
  
  async function fetchItem(id: string) {
    try {
      // This would need to be implemented in the db service
      // For now, we'll simulate the data structure
      const { data, error } = await db.supabase
        .from('items')
        .select(`
          *,
          episode:episodes(
            id,
            title,
            date,
            celebrity:celebrities(name, slug)
          )
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      setItem(data)
    } catch (error) {
      console.error('Error fetching item:', error)
      setError('アイテムが見つかりません')
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
  
  if (error || !item) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">アイテムが見つかりません</h1>
            <p className="text-gray-600 mb-6">お探しのアイテムは存在しないか、削除された可能性があります。</p>
            <Link to="/">
              <Button className="bg-blue-600 hover:bg-blue-700">
                ホームに戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            ホームに戻る
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Item Image */}
          <div>
            <Card>
              <CardContent className="p-8">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">画像なし</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Item Details */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-8">
                <div className="space-y-4">
                  {/* Category */}
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {item.category}
                    </span>
                    {item.subcategory && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                        {item.subcategory}
                      </span>
                    )}
                  </div>
                  
                  {/* Brand */}
                  {item.brand && (
                    <div className="text-lg text-blue-600 font-medium">
                      {item.brand}
                    </div>
                  )}
                  
                  {/* Name */}
                  <h1 className="text-3xl font-bold text-gray-900">
                    {item.name}
                  </h1>
                  
                  {/* Price */}
                  {item.price > 0 && (
                    <div className="text-3xl font-bold text-green-600">
                      ¥{item.price.toLocaleString()}
                    </div>
                  )}
                  
                  {/* Description */}
                  {item.description && (
                    <p className="text-gray-700 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  
                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {item.color && (
                      <div>
                        <span className="font-medium text-gray-900">カラー:</span>
                        <span className="ml-2 text-gray-600">{item.color}</span>
                      </div>
                    )}
                    {item.size && (
                      <div>
                        <span className="font-medium text-gray-900">サイズ:</span>
                        <span className="ml-2 text-gray-600">{item.size}</span>
                      </div>
                    )}
                    {item.material && (
                      <div>
                        <span className="font-medium text-gray-900">素材:</span>
                        <span className="ml-2 text-gray-600">{item.material}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-900">在庫状況:</span>
                      <span className={`ml-2 ${item.is_available ? 'text-green-600' : 'text-red-600'}`}>
                        {item.is_available ? '在庫あり' : '在庫なし'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Purchase Button */}
                  {item.affiliate_url && (
                    <div className="pt-4">
                      <a
                        href={item.affiliate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-lg py-3">
                          <ExternalLink className="h-5 w-5 mr-2" />
                          商品を購入する
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Episode Information */}
            {item.episode && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-gray-900">関連エピソード</h2>
                </CardHeader>
                <CardContent>
                  <Link 
                    to={`/episodes/${item.episode.id}`}
                    className="block hover:bg-gray-50 p-4 rounded-lg transition-colors"
                  >
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900">{item.episode.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(item.episode.date).toLocaleDateString()}
                        </span>
                        {item.episode.celebrity && (
                          <span className="flex items-center">
                            <Tag className="h-4 w-4 mr-1" />
                            {item.episode.celebrity.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}