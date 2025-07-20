import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { db } from '../../lib/supabase'

// 型定義を直接定義
interface Item {
  id: string
  episode_id: string
  name: string
  brand: string
  affiliate_url: string
  image_url: string
  price: number
  category?: string
  subcategory?: string
  currency?: string
  description?: string
  color?: string
  size?: string
  material?: string
  is_available?: boolean
  created_at?: string
  updated_at?: string
}

interface Episode {
  id: string
  title: string
  celebrity?: {
    id: string
    name: string
    slug: string
  }
}

export default function Items() {
  const [items, setItems] = useState<Item[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [formData, setFormData] = useState({
    episode_id: '',
    name: '',
    brand: '',
    affiliate_url: '',
    image_url: '',
    price: ''
  })
  
  const fetchData = useCallback(async () => {
    try {
      const episodesData = await db.episodes.getAll()
      setEpisodes(episodesData)
      
      // Fetch items for all episodes
      const itemsData = []
      for (const episode of episodesData) {
        const episodeItems = await db.items.getByEpisodeId(episode.id)
        itemsData.push(...episodeItems)
      }
      setItems(itemsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  const resetForm = useCallback(() => {
    setShowForm(false)
    setEditingItem(null)
    setFormData({
      episode_id: '',
      name: '',
      brand: '',
      affiliate_url: '',
      image_url: '',
      price: ''
    })
  }, [])
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const itemData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0
      }
      
      if (editingItem) {
        await db.items.update(editingItem.id, itemData)
      } else {
        await db.items.create(itemData)
      }
      
      await fetchData()
      resetForm()
    } catch (error) {
      console.error('Error saving item:', error)
    }
  }, [formData, editingItem, fetchData, resetForm])
  
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('このアイテムを削除してもよろしいですか？')) return
    
    try {
      await db.items.delete(id)
      await fetchData()
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }, [fetchData])
  
  const startEdit = useCallback((item: Item) => {
    setEditingItem(item)
    setFormData({
      episode_id: item.episode_id,
      name: item.name,
      brand: item.brand,
      affiliate_url: item.affiliate_url,
      image_url: item.image_url,
      price: item.price.toString()
    })
    setShowForm(true)
  }, [])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">アイテム</h2>
          <p className="text-gray-600 mt-2">エピソードで紹介された商品とアイテムを管理</p>
        </div>
        <Button 
          icon={Plus} 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          アイテムを追加
        </Button>
      </div>
      
      {showForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              {editingItem ? 'アイテムを編集' : '新しいアイテムを追加'}
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="エピソード"
                  value={formData.episode_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, episode_id: e.target.value }))}
                  options={[
                    { value: '', label: 'エピソードを選択' },
                    ...episodes.map(e => ({ value: e.id, label: `${e.title} (${e.celebrity?.name})` }))
                  ]}
                  required
                />
                
                <Input
                  label="名前"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                
                <Input
                  label="ブランド"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                />
                
                <Input
                  label="価格"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              
              <Input
                label="アフィリエイトURL"
                value={formData.affiliate_url}
                onChange={(e) => setFormData(prev => ({ ...prev, affiliate_url: e.target.value }))}
                placeholder="https://example.com/affiliate-link"
              />
              
              <Input
                label="画像URL"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
              
              <div className="flex space-x-4">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingItem ? '更新' : '作成'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const episode = episodes.find(e => e.id === item.episode_id)
          return (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    {item.brand && (
                      <p className="text-sm text-gray-500">{item.brand}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {episode?.title} • {episode?.celebrity?.name}
                    </p>
                    {item.price > 0 && (
                      <p className="text-lg font-bold text-green-600 mt-2">
                        ¥{item.price.toLocaleString()}
                      </p>
                    )}
                    {item.affiliate_url && (
                      <a
                        href={item.affiliate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-2"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        商品を見る
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    icon={Edit}
                    onClick={() => startEdit(item)}
                  >
                    編集
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    icon={Trash2}
                    onClick={() => handleDelete(item.id)}
                  >
                    削除
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {items.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">アイテムが見つかりません。最初のアイテムを作成して開始してください。</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}