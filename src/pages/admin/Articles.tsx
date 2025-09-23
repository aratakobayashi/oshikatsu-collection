import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, LogOut, Upload, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../components/AuthProvider'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { TextArea } from '../../components/ui/TextArea'
import { Select } from '../../components/ui/Select'
import { Card } from '../../components/ui/Card'
import { db } from '../../lib/supabase'
import type { Article, Category, ArticleWithCategory } from '../../lib/supabase'

export default function Articles() {
  const { user, signOut } = useAuth()
  const [articles, setArticles] = useState<ArticleWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    category_id: '',
    tags: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    featured: false,
    seo_title: '',
    meta_description: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [articlesData, categoriesData] = await Promise.all([
        db.articles.getAll(),
        db.categories.getAll()
      ])
      setArticles(articlesData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const articleData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        published_at: formData.status === 'published' ? new Date().toISOString() : null
      }

      if (editingArticle) {
        await db.articles.update(editingArticle.id, articleData)
      } else {
        await db.articles.create(articleData)
      }

      await fetchData()
      resetForm()
    } catch (error) {
      console.error('Error saving article:', error)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('この記事を削除してもよろしいですか？')) return

    try {
      await db.articles.delete(id)
      await fetchData()
    } catch (error) {
      console.error('Error deleting article:', error)
    }
  }

  function resetForm() {
    setShowForm(false)
    setEditingArticle(null)
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      featured_image: '',
      category_id: '',
      tags: '',
      status: 'draft',
      featured: false,
      seo_title: '',
      meta_description: ''
    })
  }

  function startEdit(article: ArticleWithCategory) {
    setEditingArticle(article)
    setFormData({
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt || '',
      featured_image: article.featured_image || '',
      category_id: article.category_id,
      tags: Array.isArray(article.tags) ? article.tags.join(', ') : '',
      status: article.status,
      featured: article.featured,
      seo_title: article.seo_title || '',
      meta_description: article.meta_description || ''
    })
    setShowForm(true)
  }

  function generateSlug(title: string) {
    return title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
          <h2 className="text-3xl font-bold text-gray-900">記事管理</h2>
          <p className="text-gray-600 mt-2">ブログ記事の作成・編集・管理</p>
          <p className="text-sm text-gray-500 mt-1">ログイン中: {user?.email}</p>
        </div>
        <div className="flex space-x-3">
          <Button
            icon={Plus}
            onClick={() => setShowForm(true)}
          >
            新しい記事
          </Button>
          <Link to="/admin/articles/migrate">
            <Button
              variant="outline"
              icon={Globe}
            >
              WordPress移行
            </Button>
          </Link>
          <Link to="/admin/articles/import">
            <Button
              variant="outline"
              icon={Upload}
            >
              ファイル
            </Button>
          </Link>
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
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">
            {editingArticle ? '記事を編集' : '新しい記事を作成'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="タイトル"
                value={formData.title}
                onChange={(e) => {
                  const title = e.target.value
                  setFormData(prev => ({
                    ...prev,
                    title,
                    slug: prev.slug || generateSlug(title)
                  }))
                }}
                required
              />
              <Input
                label="スラッグ"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                required
              />
            </div>

            <TextArea
              label="コンテンツ"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={8}
              required
            />

            <TextArea
              label="抜粋"
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="アイキャッチ画像URL"
                value={formData.featured_image}
                onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                type="url"
              />

              <Select
                label="カテゴリ"
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                required
              >
                <option value="">カテゴリを選択</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="タグ（カンマ区切り）"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="タグ1, タグ2, タグ3"
              />

              <Select
                label="ステータス"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              >
                <option value="draft">下書き</option>
                <option value="published">公開</option>
                <option value="archived">アーカイブ</option>
              </Select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                注目記事として表示
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="SEOタイトル"
                value={formData.seo_title}
                onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
              />

              <TextArea
                label="メタディスクリプション"
                value={formData.meta_description}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="flex space-x-3">
              <Button type="submit">
                {editingArticle ? '更新' : '作成'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                キャンセル
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-6">
        {articles.map((article) => (
          <Card key={article.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span
                    className="px-2 py-1 text-xs rounded-full text-white"
                    style={{ backgroundColor: article.category?.color || '#3B82F6' }}
                  >
                    {article.category?.name}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    article.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : article.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {article.status === 'published' ? '公開' :
                     article.status === 'draft' ? '下書き' : 'アーカイブ'}
                  </span>
                  {article.featured && (
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      注目
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {article.excerpt}
                  </p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>作成日: {formatDate(article.created_at)}</span>
                  {article.published_at && (
                    <span>公開日: {formatDate(article.published_at)}</span>
                  )}
                  {article.view_count > 0 && (
                    <span>閲覧数: {article.view_count.toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                {article.status === 'published' && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Eye}
                    onClick={() => window.open(`/articles/${article.slug}`, '_blank')}
                  >
                    表示
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  icon={Edit}
                  onClick={() => startEdit(article)}
                >
                  編集
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={Trash2}
                  onClick={() => handleDelete(article.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  削除
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {articles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">まだ記事がありません</p>
            <Button onClick={() => setShowForm(true)}>
              最初の記事を作成
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}