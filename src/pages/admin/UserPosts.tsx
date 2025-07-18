import React, { useState, useEffect } from 'react'
import { Eye, Trash2, Search, Filter, MessageSquare, Heart, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { db, UserPost } from '../../lib/supabase'

export default function UserPosts() {
  const [posts, setPosts] = useState<UserPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<UserPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  
  useEffect(() => {
    fetchPosts()
  }, [])
  
  useEffect(() => {
    filterAndSortPosts()
  }, [posts, searchTerm, statusFilter, sortBy])
  
  async function fetchPosts() {
    try {
      const data = await db.userPosts.getAll()
      setPosts(data)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }
  
  function filterAndSortPosts() {
    let filtered = [...posts]
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.user?.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(post => post.status === statusFilter)
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'view_count':
          return b.view_count - a.view_count
        case 'like_count':
          return b.like_count - a.like_count
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })
    
    setFilteredPosts(filtered)
  }
  
  async function handleDelete(id: string) {
    if (!confirm('この投稿を削除してもよろしいですか？')) return
    
    try {
      await db.userPosts.delete(id)
      await fetchPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }
  
  async function handleStatusChange(id: string, status: 'open' | 'solved' | 'closed') {
    try {
      await db.userPosts.update(id, { status })
      await fetchPosts()
    } catch (error) {
      console.error('Error updating post status:', error)
    }
  }
  
  function getStatusBadge(status: string) {
    const styles = {
      open: 'bg-green-100 text-green-800',
      solved: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800'
    }
    
    const labels = {
      open: '受付中',
      solved: '解決済み',
      closed: '終了'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
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
          <h2 className="text-3xl font-bold text-gray-900">ユーザー投稿</h2>
          <p className="text-gray-600 mt-2">ユーザーからの質問投稿を管理</p>
        </div>
        
        <div className="text-sm text-gray-500">
          全{posts.length}件の投稿
        </div>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="タイトル、内容、ユーザー名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
            
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: '全てのステータス' },
                { value: 'open', label: '受付中' },
                { value: 'solved', label: '解決済み' },
                { value: 'closed', label: '終了' }
              ]}
            />
            
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'created_at', label: '投稿日時順' },
                { value: 'view_count', label: '閲覧数順' },
                { value: 'like_count', label: 'いいね数順' },
                { value: 'title', label: 'タイトル順' }
              ]}
            />
            
            <div className="text-sm text-gray-500 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              {filteredPosts.length}件表示中
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusBadge(post.status)}
                    <span className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {post.title}
                  </h3>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span>投稿者: {post.user?.display_name || 'Unknown'}</span>
                    {post.celebrity && (
                      <span>タレント: {post.celebrity.name}</span>
                    )}
                    {post.episode && (
                      <span>エピソード: {post.episode.title}</span>
                    )}
                  </div>
                  
                  {post.content && (
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {post.content}
                    </p>
                  )}
                  
                  {/* Images */}
                  {post.image_urls.length > 0 && (
                    <div className="flex space-x-2 mb-3">
                      {post.image_urls.slice(0, 3).map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Post image ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ))}
                      {post.image_urls.length > 3 && (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500">
                          +{post.image_urls.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {post.view_count} 閲覧
                    </span>
                    <span className="flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      {post.like_count} いいね
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      回答数: 0
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-6">
                  <Select
                    value={post.status}
                    onChange={(e) => handleStatusChange(post.id, e.target.value as any)}
                    options={[
                      { value: 'open', label: '受付中' },
                      { value: 'solved', label: '解決済み' },
                      { value: 'closed', label: '終了' }
                    ]}
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Eye}
                  >
                    詳細
                  </Button>
                  
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDelete(post.id)}
                  >
                    削除
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredPosts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">
              {searchTerm || statusFilter ? '条件に一致する投稿が見つかりません。' : 'ユーザー投稿がまだありません。'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}