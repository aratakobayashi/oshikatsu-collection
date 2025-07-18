import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import TextArea from '../../components/ui/TextArea'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { db, Celebrity } from '../../lib/supabase'
import { useAuth } from '../../components/AuthProvider'

export default function Celebrities() {
  const { user, signOut } = useAuth()
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCelebrity, setEditingCelebrity] = useState<Celebrity | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    profile_img: '',
    youtube_url: ''
  })
  
  useEffect(() => {
    fetchCelebrities()
  }, [])
  
  async function fetchCelebrities() {
    try {
      const data = await db.celebrities.getAll()
      setCelebrities(data)
    } catch (error) {
      console.error('Error fetching celebrities:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingCelebrity) {
        await db.celebrities.update(editingCelebrity.id, formData)
      } else {
        await db.celebrities.create(formData)
      }
      
      await fetchCelebrities()
      resetForm()
    } catch (error) {
      console.error('Error saving celebrity:', error)
    }
  }
  
  async function handleDelete(id: string) {
    if (!confirm('このセレブリティを削除してもよろしいですか？')) return
    
    try {
      await db.celebrities.delete(id)
      await fetchCelebrities()
    } catch (error) {
      console.error('Error deleting celebrity:', error)
    }
  }
  
  function resetForm() {
    setShowForm(false)
    setEditingCelebrity(null)
    setFormData({
      name: '',
      slug: '',
      profile_img: '',
      youtube_url: ''
    })
  }
  
  function startEdit(celebrity: Celebrity) {
    setEditingCelebrity(celebrity)
    setFormData({
      name: celebrity.name,
      slug: celebrity.slug,
      profile_img: celebrity.profile_img,
      youtube_url: celebrity.youtube_url
    })
    setShowForm(true)
  }
  
  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }
  
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
          <h2 className="text-3xl font-bold text-gray-900">推し管理</h2>
          <p className="text-gray-600 mt-2">推しのプロフィールと情報を管理</p>
          <p className="text-sm text-gray-500 mt-1">ログイン中: {user?.email}</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            icon={Plus} 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            推しを追加
          </Button>
          <Button 
            variant="outline"
            icon={LogOut}
            onClick={signOut}
          >
            ログアウト
          </Button>
        </div>
      </div>
      
      {showForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              {editingCelebrity ? '推しを編集' : '新しい推しを追加'}
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="名前"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setFormData(prev => ({ 
                      ...prev, 
                      name,
                      slug: generateSlug(name)
                    }))
                  }}
                  required
                />
                
                <Input
                  label="スラッグ"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  helpText="URL用の識別子"
                  required
                />
                
                <Input
                  label="プロフィール画像URL"
                  value={formData.profile_img}
                  onChange={(e) => setFormData(prev => ({ ...prev, profile_img: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
                
                <Input
                  label="YouTube URL"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
                  placeholder="https://youtube.com/channel/..."
                />
              </div>
              
              <div className="flex space-x-4">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingCelebrity ? '更新' : '作成'}
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
        {celebrities.map((celebrity) => (
          <Card key={celebrity.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                {celebrity.profile_img && (
                  <img
                    src={celebrity.profile_img}
                    alt={celebrity.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{celebrity.name}</h3>
                  <p className="text-sm text-gray-500">/{celebrity.slug}</p>
                  {celebrity.youtube_url && (
                    <a 
                      href={celebrity.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      YouTube Channel
                    </a>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-4">
                <Link to={`/celebrities/${celebrity.slug}`}>
                  <Button variant="outline" size="sm" icon={Eye}>
                    View
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={Edit}
                  onClick={() => startEdit(celebrity)}
                >
                  Edit
                </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  icon={Trash2}
                  onClick={() => handleDelete(celebrity.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {celebrities.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">推しが見つかりません。最初の推しを作成して開始してください。</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}