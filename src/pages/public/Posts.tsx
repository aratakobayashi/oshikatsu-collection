import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Calendar, Eye, Heart, MessageSquare, User, Tag, TrendingUp, Star } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardContent } from '../../components/ui/Card'
import { db, UserPost, Celebrity } from '../../lib/supabase'

export default function Posts() {
  const [posts, setPosts] = useState<UserPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<UserPost[]>([])
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCelebrity, setSelectedCelebrity] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  
  // Sample data for demonstration
  const samplePosts = [
    {
      id: 'po1a2b3c-d4e5-f678-9012-345678901234',
      title: 'このジャケットのブランドを教えてください',
      content: '二宮和也さんが着ていたデニムジャケットのブランドが知りたいです。',
      image_urls: ['https://images.pexels.com/photos/1065116/pexels-photo-1065116.jpeg'],
      status: 'open',
      view_count: 120,
      like_count: 15,
      created_at: '2024-01-15',
      user: { display_name: '推し活ファン' },
      celebrity: { name: '二宮和也', slug: 'ninomiya-kazunari' }
    },
    {
      id: 'po2b3c4d-e5f6-g789-0123-456789012345',
      title: 'この店舗の場所を知っている方いますか？',
      content: '橋本涼さんが動画で紹介していたカフェの場所を教えてください。',
      image_urls: ['https://images.pexels.com/photos/1040903/pexels-photo-1040903.jpeg'],
      status: 'solved',
      view_count: 89,
      like_count: 8,
      created_at: '2024-01-20',
      user: { display_name: 'カフェ好き' },
      celebrity: { name: '橋本涼', slug: 'hashimoto-ryo' }
    },
    {
      id: 'po3c4d5e-f6g7-h890-1234-567890123456',
      title: '美咲さんが使っているリップの色番号',
      content: 'CHANELのリップだと思うのですが、色番号がわかりません。',
      image_urls: ['https://images.pexels.com/photos/1043505/pexels-photo-1043505.jpeg'],
      status: 'open',
      view_count: 156,
      like_count: 23,
      created_at: '2024-01-25',
      user: { display_name: 'コスメマニア' },
      celebrity: { name: '田中美咲', slug: 'tanaka-misaki' }
    },
    {
      id: 'po4d5e6f-g7h8-i901-2345-678901234567',
      title: 'このスニーカーの詳細情報',
      content: 'Nikeのスニーカーですが、正確なモデル名を知りたいです。',
      image_urls: ['https://images.pexels.com/photos/1040915/pexels-photo-1040915.jpeg'],
      status: 'open',
      view_count: 78,
      like_count: 12,
      created_at: '2024-02-01',
      user: { display_name: 'スニーカーヘッド' },
      celebrity: { name: '佐藤健太', slug: 'sato-kenta' }
    }
  ]
  
  useEffect(() => {
    fetchData()
  }, [])
  
  useEffect(() => {
    filterAndSortPosts()
  }, [posts, searchTerm, selectedCelebrity, selectedStatus, sortBy])
  
  async function fetchData() {
    try {
      const [postsData, celebritiesData] = await Promise.all([
        db.userPosts.getAll(),
        db.celebrities.getAll()
      ])
      setPosts(postsData)
      setCelebrities(celebritiesData)
    } catch (error) {
      console.error('Error fetching data:', error)
      // Use sample data as fallback
      setPosts(samplePosts as any)
      setCelebrities([])
    } finally {
      setLoading(false)
    }
  }
  
  function filterAndSortPosts() {
    let filtered = [...(posts.length > 0 ? posts : samplePosts)]
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.celebrity?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Celebrity filter
    if (selectedCelebrity) {
      filtered = filtered.filter(post => post.celebrity_id === selectedCelebrity)
    }
    
    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(post => post.status === selectedStatus)
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
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">質問を読み込み中...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-pink-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-br from-rose-100 to-pink-100 p-4 rounded-2xl">
                <MessageSquare className="h-12 w-12 text-rose-600" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              みんなの質問
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              ファンコミュニティで情報を共有・発見しよう
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-rose-500" />
                <span>活発なコミュニティ</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-rose-500" />
                <span>質の高い回答</span>
              </div>
              <div className="flex items-center">
                <Eye className="h-5 w-5 mr-2 text-rose-500" />
                <span>豊富な情報</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Search and Filters */}
        <Card className="mb-12 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <Input
                  placeholder="タイトル、内容、タレント名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-2xl border-2 border-gray-200 focus:border-rose-400 shadow-lg"
                />
              </div>
              
              <Select
                value={selectedCelebrity}
                onChange={(e) => setSelectedCelebrity(e.target.value)}
                options={[
                  { value: '', label: '全ての推し' },
                  ...celebrities.map(c => ({ value: c.id, label: c.name }))
                ]}
                className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
              />
              
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: '', label: '全てのステータス' },
                  { value: 'open', label: '受付中' },
                  { value: 'solved', label: '解決済み' },
                  { value: 'closed', label: '終了' }
                ]}
                className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
              />
              
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'created_at', label: '新着順' },
                  { value: 'view_count', label: '人気順' },
                  { value: 'like_count', label: 'いいね順' },
                  { value: 'title', label: 'タイトル順' }
                ]}
                className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
              />
            </div>
            
            <div className="flex items-center justify-between mt-6 border-t border-gray-100 pt-6">
              <div className="text-sm text-gray-500 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <span className="font-medium text-rose-600">{filteredPosts.length}件</span>
                の投稿を表示中
              </div>
              
              <Link to="/submit">
                <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                  質問を投稿する
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <Card className="shadow-xl border-0">
            <CardContent className="p-16 text-center">
              <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                質問が見つかりません
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedCelebrity || selectedStatus 
                  ? '条件に一致する投稿が見つかりません。' 
                  : 'まだ投稿がありません。'}
              </p>
              <Link to="/submit">
                <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-full">
                  最初の質問を投稿する
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <Link key={post.id} to={`/posts/${post.id}`}>
                <Card className="hover:shadow-2xl transition-all duration-500 cursor-pointer h-full border-0 shadow-lg overflow-hidden group">
                  <CardContent className="p-0">
                    {/* Status and Date */}
                    <div className="p-6 pb-0">
                      <div className="flex items-center justify-between mb-4">
                        {getStatusBadge(post.status)}
                        <span className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Images */}
                    {post.image_urls.length > 0 && (
                      <div className="px-6 pb-4">
                        <img
                          src={post.image_urls[0]}
                          alt={post.title}
                          className="w-full h-48 object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                        />
                        {post.image_urls.length > 1 && (
                          <div className="text-xs text-gray-500 mt-2 text-center">
                            +{post.image_urls.length - 1}枚の画像
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="p-6 pt-0">
                      {/* Title */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-rose-600 transition-colors">
                        {post.title}
                      </h3>
                      
                      {/* Content */}
                      {post.content && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {post.content}
                        </p>
                      )}
                      
                      {/* User and Celebrity */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <User className="h-4 w-4 mr-1" />
                          {post.user?.display_name || 'Unknown'}
                        </div>
                        
                        {post.celebrity && (
                          <div className="flex items-center text-sm text-rose-600">
                            <Tag className="h-4 w-4 mr-1" />
                            {post.celebrity.name}
                          </div>
                        )}
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {post.view_count}
                          </span>
                          <span className="flex items-center">
                            <Heart className="h-4 w-4 mr-1" />
                            {post.like_count}
                          </span>
                        </div>
                        
                        <span className="flex items-center text-rose-500">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          回答募集中
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}