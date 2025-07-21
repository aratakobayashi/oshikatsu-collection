import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import TextArea from '../../components/ui/TextArea'
import Select from '../../components/ui/Select'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { db } from '../../lib/supabase'

// 型定義を直接定義
interface Location {
  id: string
  episode_id: string
  name: string
  address: string
  latitude?: number | null
  longitude?: number | null
  map_url: string
  menu_example: string[]
  image_urls: string[]
  category?: string
  phone?: string
  website?: string
  reservation_url?: string
  opening_hours?: Record<string, unknown>
  price_range?: string
  description?: string
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

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    episode_id: '',
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    map_url: '',
    menu_example: [] as string[],
    image_urls: [] as string[]
  })
  
  const [newMenuItem, setNewMenuItem] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  
  // ✅ 依存関係を空にして無限ループを防ぐ
  const fetchData = useCallback(async () => {
    try {
      console.log('🔍 Admin Locations: Fetching data...')
      
      // ✅ 修正: 1回のクエリで全ロケーションを取得
      const [episodesData, locationsData] = await Promise.all([
        db.episodes.getAll(),
        db.locations.getAll() // ✅ 全ロケーションを一度に取得
      ])
      
      setEpisodes(episodesData)
      setLocations(locationsData)
      
      console.log('✅ Admin Locations: Data fetched successfully', { 
        locations: locationsData.length, 
        episodes: episodesData.length 
      })
    } catch (error) {
      console.error('❌ Admin Locations: Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, []) // ✅ 空の依存配列
  
  const resetForm = useCallback(() => {
    setShowForm(false)
    setEditingLocation(null)
    setFormData({
      episode_id: '',
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      map_url: '',
      menu_example: [],
      image_urls: []
    })
    setNewMenuItem('')
    setNewImageUrl('')
  }, [])
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const locationData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      }
      
      if (editingLocation) {
        await db.locations.update(editingLocation.id, locationData)
      } else {
        await db.locations.create(locationData)
      }
      
      await fetchData()
      resetForm()
    } catch (error) {
      console.error('Error saving location:', error)
    }
  }, [formData, editingLocation, fetchData, resetForm])
  
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('このロケーションを削除してもよろしいですか？')) return
    
    try {
      await db.locations.delete(id)
      await fetchData()
    } catch (error) {
      console.error('Error deleting location:', error)
    }
  }, [fetchData])
  
  const startEdit = useCallback((location: Location) => {
    setEditingLocation(location)
    setFormData({
      episode_id: location.episode_id,
      name: location.name,
      address: location.address,
      latitude: location.latitude?.toString() || '',
      longitude: location.longitude?.toString() || '',
      map_url: location.map_url,
      menu_example: location.menu_example || [],
      image_urls: location.image_urls || []
    })
    setShowForm(true)
  }, [])
  
  function addMenuItem() {
    if (newMenuItem.trim()) {
      setFormData(prev => ({
        ...prev,
        menu_example: [...prev.menu_example, newMenuItem.trim()]
      }))
      setNewMenuItem('')
    }
  }
  
  function removeMenuItem(index: number) {
    setFormData(prev => ({
      ...prev,
      menu_example: prev.menu_example.filter((_, i) => i !== index)
    }))
  }
  
  function addImageUrl() {
    if (newImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, newImageUrl.trim()]
      }))
      setNewImageUrl('')
    }
  }
  
  function removeImageUrl(index: number) {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }))
  }
  
  // ✅ 初回のみ実行
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">データを読み込み中...</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">ロケーション</h2>
          <p className="text-gray-600 mt-2">エピソードで紹介された店舗・場所を管理</p>
        </div>
        <Button 
          icon={Plus} 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          ロケーションを追加
        </Button>
      </div>
      
      {showForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              {editingLocation ? 'ロケーションを編集' : '新しいロケーションを追加'}
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
              </div>
              
              <Input
                label="住所"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="緯度"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                />
                
                <Input
                  label="経度"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                />
              </div>
              
              <TextArea
                label="マップURL"
                value={formData.map_url}
                onChange={(e) => setFormData(prev => ({ ...prev, map_url: e.target.value }))}
                rows={3}
                helpText="Googleマップなどのリンク"
              />
              
              {/* Menu Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">メニュー例</label>
                <div className="space-y-2">
                  {formData.menu_example.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="flex-1 p-2 bg-gray-100 rounded">{item}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={X}
                        onClick={() => removeMenuItem(index)}
                      >
                        削除
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="メニューアイテムを追加"
                      value={newMenuItem}
                      onChange={(e) => setNewMenuItem(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addMenuItem}
                    >
                      追加
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Image URLs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">画像URL</label>
                <div className="space-y-2">
                  {formData.image_urls.map((url, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="flex-1 p-2 bg-gray-100 rounded text-sm">{url}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={X}
                        onClick={() => removeImageUrl(index)}
                      >
                        削除
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="画像URLを追加"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addImageUrl}
                    >
                      追加
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingLocation ? '更新' : '作成'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      <div className="space-y-4">
        {locations.map((location) => {
          const episode = episodes.find(e => e.id === location.episode_id)
          return (
            <Card key={location.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {episode?.title} • {episode?.celebrity?.name}
                    </p>
                    {location.address && (
                      <p className="text-gray-600 mt-2">{location.address}</p>
                    )}
                    {location.menu_example.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">メニューアイテム:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {location.menu_example.slice(0, 3).map((item, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {item}
                            </span>
                          ))}
                          {location.menu_example.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              他{location.menu_example.length - 3}件
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      icon={Edit}
                      onClick={() => startEdit(location)}
                    >
                      編集
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      icon={Trash2}
                      onClick={() => handleDelete(location.id)}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {locations.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">ロケーションが見つかりません。最初のロケーションを作成して開始してください。</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}