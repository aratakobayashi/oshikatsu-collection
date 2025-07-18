import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, User, Tag, Eye, Heart, MessageSquare, ExternalLink, ArrowLeft } from 'lucide-react'
import Button from '../../components/ui/Button'
import TextArea from '../../components/ui/TextArea'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { db, UserPost } from '../../lib/supabase'
import { useAuth } from '../../components/AuthProvider'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [post, setPost] = useState<UserPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answerContent, setAnswerContent] = useState('')
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  
  useEffect(() => {
    if (id) {
      fetchPost(id)
    }
  }, [id])
  
  async function fetchPost(id: string) {
    try {
      const data = await db.userPosts.getById(id)
      setPost(data)
    } catch (error) {
      console.error('Error fetching post:', error)
      setError('投稿が見つかりません')
    } finally {
      setLoading(false)
    }
  }
  
  async function handleAnswerSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !answerContent.trim()) return
    
    setSubmittingAnswer(true)
    try {
      // Here you would create an answer - for now just show success
      alert('回答を投稿しました！（実装予定）')
      setAnswerContent('')
    } catch (error) {
      console.error('Error submitting answer:', error)
    } finally {
      setSubmittingAnswer(false)
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
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
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
  
  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">投稿が見つかりません</h1>
            <p className="text-gray-600 mb-6">お探しの投稿は存在しないか、削除された可能性があります。</p>
            <Link to="/posts">
              <Button className="bg-blue-600 hover:bg-blue-700">
                投稿一覧に戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/posts" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            投稿一覧に戻る
          </Link>
        </div>
        
        {/* Post Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              {getStatusBadge(post.status)}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {post.view_count} 閲覧
                </span>
                <span className="flex items-center">
                  <Heart className="h-4 w-4 mr-1" />
                  {post.like_count} いいね
                </span>
              </div>
            </div>
            
            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {post.title}
            </h1>
            
            {/* Images */}
            {post.image_urls.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {post.image_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(url, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Content */}
            {post.content && (
              <div className="mb-6">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>
              </div>
            )}
            
            {/* User and Celebrity Info */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <User className="h-5 w-5 mr-2" />
                    <span className="font-medium">{post.user?.display_name || 'Unknown'}</span>
                  </div>
                  
                  {post.celebrity && (
                    <Link 
                      to={`/celebrities/${post.celebrity.slug}`}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Tag className="h-5 w-5 mr-2" />
                      <span className="font-medium">{post.celebrity.name}</span>
                    </Link>
                  )}
                  
                  {post.episode && (
                    <Link 
                      to={`/episodes/${post.episode_id}`}
                      className="flex items-center text-purple-600 hover:text-purple-800"
                    >
                      <ExternalLink className="h-5 w-5 mr-2" />
                      <span className="font-medium">{post.episode.title}</span>
                    </Link>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4 mr-1" />
                    いいね
                  </Button>
                  <Button variant="outline" size="sm">
                    共有
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Answer Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                回答・コメント
              </h2>
              <span className="text-sm text-gray-500">0件の回答</span>
            </div>
          </CardHeader>
          
          <CardContent>
            {user ? (
              <form onSubmit={handleAnswerSubmit} className="space-y-4">
                <TextArea
                  placeholder="この質問に回答してみましょう..."
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  rows={4}
                  required
                />
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    loading={submittingAnswer}
                    disabled={!answerContent.trim()}
                  >
                    回答を投稿
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">回答するにはログインが必要です</p>
                <div className="space-x-4">
                  <Link to="/login">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      ログイン
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="outline">
                      新規登録
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            
            {/* Placeholder for answers */}
            <div className="mt-8 text-center text-gray-500">
              <p>まだ回答がありません。最初の回答者になりませんか？</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}