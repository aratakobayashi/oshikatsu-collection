import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import TextArea from '../../components/ui/TextArea'
import Select from '../../components/ui/Select'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { db, Work } from '../../lib/supabase'

export default function Works() {
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingWork, setEditingWork] = useState<Work | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    type: 'drama' as const,
    description: '',
    release_date: '',
    poster_url: '',
    official_site: ''
  })
  
  useEffect(() => {
    fetchWorks()
  }, [])
  
  async function fetchWorks() {
    try {
      const data = await db.works.getAll()
      setWorks(data)
    } catch (error) {
      console.error('Error fetching works:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      // slug重複チェック
      if (!editingWork) {
        const { data: existingWorks } = await db.supabase
          .from('works')
          .select('id')
          .eq('slug', formData.slug)
        
        if (existingWorks && existingWorks.length > 0) {
          setErrors({ submit: 'このスラッグは既に使用されています。別のスラッグを入力してください。' })
          return
        }
      }
      
      if (editingWork) {
        // 編集時のslug重複チェック（自分以外）
        const { data: existingWorks } = await db.supabase
          .from('works')
          .select('id')
          .eq('slug', formData.slug)
          .neq('id', editingWork.id)
        
        if (existingWorks && existingWorks.length > 0) {
          setErrors({ submit: 'このスラッグは既に使用されています。別のスラッグを入力してください。' })
          return
        }
        
        await db.works.update(editingWork.id, formData)
      } else {
        await db.works.create(formData)
      }
      
      await fetchWorks()
      resetForm()
      setErrors({})
    } catch (error) {
      console.error('Error saving work:', error)
      setErrors({ submit: '作品の保存に失敗しました。もう一度お試しください。' })
    }
  }
  
  async function handleDelete(id: string) {
    if (!confirm('この作品を削除してもよろしいですか？')) return
    
    try {
      await db.works.delete(id)
      await fetchWorks()
    } catch (error) {
      console.error('Error deleting work:', error)
    }
  }
  
  async function handleTrendingToggle(work: Work) {
    try {
      const newTrendingStatus = !work.is_trending
      const trending_order = newTrendingStatus ? getNextTrendingOrder() : 0
      
      await db.works.updateTrending(work.id, newTrendingStatus, trending_order)
      await fetchWorks()
    } catch (error) {
      console.error('Error updating trending status:', error)
    }
  }
  
  async function handleTrendingOrderChange(work: Work, direction: 'up' | 'down') {
    try {
      const trendingWorks = works
        .filter(w => w.is_trending)
        .sort((a, b) => a.trending_order - b.trending_order)
      
      const currentIndex = trendingWorks.findIndex(w => w.id === work.id)
      if (currentIndex === -1) return
      
      let newOrder = work.trending_order
      
      if (direction === 'up' && currentIndex > 0) {
        const prevWork = trendingWorks[currentIndex - 1]
        newOrder = prevWork.trending_order
        await db.works.updateTrending(prevWork.id, true, work.trending_order)
      } else if (direction === 'down' && currentIndex < trendingWorks.length - 1) {
        const nextWork = trendingWorks[currentIndex + 1]
        newOrder = nextWork.trending_order
        await db.works.updateTrending(nextWork.id, true, work.trending_order)
      }
      
      await db.works.updateTrending(work.id, true, newOrder)
      await fetchWorks()
    } catch (error) {
      console.error('Error updating trending order:', error)
    }
  }
  
  function getNextTrendingOrder() {
    const trendingWorks = works.filter(w => w.is_trending)
    if (trendingWorks.length === 0) return 1
    return Math.max(...trendingWorks.map(w => w.trending_order)) + 1
  }
  
  function resetForm() {
    setShowForm(false)
    setEditingWork(null)
    setErrors({})
    setFormData({
      title: '',
      slug: '',
      type: 'drama',
      description: '',
      release_date: '',
      poster_url: '',
      official_site: ''
    })
  }
  
  function startEdit(work: Work) {
    setEditingWork(work)
    setFormData({
      title: work.title,
      slug: work.slug,
      type: work.type,
      description: work.description,
      release_date: work.release_date || '',
      poster_url: work.poster_url,
      official_site: work.official_site
    })
    setShowForm(true)
  }
  
  function generateSlug(title: string) {
    return title
      .toLowerCase()
      // Remove parentheses and other special characters, replace with dash
      .replace(/[()（）\[\]【】]/g, '-')
      // Replace spaces and other non-alphanumeric characters with dash
      .replace(/[^a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g, '-')
      // Remove leading/trailing dashes and multiple consecutive dashes
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-')
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
  
  const trendingWorks = works.filter(w => w.is_trending).sort((a, b) => a.trending_order - b.trending_order)
  const nonTrendingWorks = works.filter(w => !w.is_trending)
  
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
          <h2 className="text-3xl font-bold text-gray-900">作品管理</h2>
          <p className="text-gray-600 mt-2">ドラマ・映画・CM・バラエティ番組の管理</p>
        </div>
        <Button 
          icon={Plus} 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          作品を追加
        </Button>
      </div>
      
      {showForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              {editingWork ? '作品を編集' : '新しい作品を追加'}
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {errors.submit}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="タイトル"
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value
                    setFormData(prev => ({ 
                      ...prev, 
                      title,
                      slug: generateSlug(title)
                    }))
                    // エラーをクリア
                    if (errors.submit) {
                      setErrors({})
                    }
                  }}
                  required
                />
                
                <Input
                  label="スラッグ"
                  value={formData.slug}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, slug: e.target.value }))
                    // エラーをクリア
                    if (errors.submit) {
                      setErrors({})
                    }
                  }}
                  helpText="URL用の識別子"
                  required
                />
                
                <Select
                  label="ジャンル"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  options={[
                    { value: 'drama', label: 'ドラマ' },
                    { value: 'movie', label: '映画' },
                    { value: 'cm', label: 'CM' },
                    { value: 'variety', label: 'バラエティ' },
                    { value: 'other', label: 'その他' }
                  ]}
                  required
                />
                
                <Input
                  label="公開日"
                  type="date"
                  value={formData.release_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, release_date: e.target.value }))}
                />
              </div>
              
              <TextArea
                label="説明"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
              
              <Input
                label="ポスター画像URL"
                value={formData.poster_url}
                onChange={(e) => setFormData(prev => ({ ...prev, poster_url: e.target.value }))}
                placeholder="https://example.com/poster.jpg"
              />
              
              <Input
                label="公式サイトURL"
                value={formData.official_site}
                onChange={(e) => setFormData(prev => ({ ...prev, official_site: e.target.value }))}
                placeholder="https://example.com"
              />
              
              <div className="flex space-x-4">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingWork ? '更新' : '作成'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Trending Works Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-orange-500" />
              トレンド作品 ({trendingWorks.length}件)
            </h3>
            <p className="text-sm text-gray-500">
              トップページに表示される作品
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {trendingWorks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              トレンド作品が設定されていません
            </p>
          ) : (
            <div className="space-y-3">
              {trendingWorks.map((work, index) => (
                <div key={work.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-4">
                    <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{work.title}</h4>
                      <p className="text-sm text-gray-500">{getTypeLabel(work.type)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTrendingOrderChange(work, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTrendingOrderChange(work, 'down')}
                      disabled={index === trendingWorks.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTrendingToggle(work)}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      <TrendingDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* All Works Section */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold text-gray-900">全作品一覧</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {works.map((work) => (
              <div key={work.id} className={`p-4 rounded-lg border ${work.is_trending ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{work.title}</h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {getTypeLabel(work.type)}
                      </span>
                      {work.is_trending && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          トレンド #{work.trending_order}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-2">/{work.slug}</p>
                    
                    {work.description && (
                      <p className="text-gray-600 mb-2 line-clamp-2">{work.description}</p>
                    )}
                    
                    {work.release_date && (
                      <p className="text-sm text-gray-500">
                        公開日: {new Date(work.release_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant={work.is_trending ? "outline" : "secondary"}
                      size="sm"
                      onClick={() => handleTrendingToggle(work)}
                      className={work.is_trending ? "text-orange-600 hover:text-orange-800" : ""}
                    >
                      {work.is_trending ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                    </Button>
                    
                    <Link to={`/works/${work.slug}`}>
                      <Button variant="outline" size="sm" icon={Eye}>
                        表示
                      </Button>
                    </Link>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      icon={Edit}
                      onClick={() => startEdit(work)}
                    >
                      編集
                    </Button>
                    
                    <Button 
                      variant="danger" 
                      size="sm" 
                      icon={Trash2}
                      onClick={() => handleDelete(work.id)}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {works.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">作品が見つかりません。最初の作品を作成して開始してください。</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}