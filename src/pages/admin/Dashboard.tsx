import { useState, useEffect, useCallback } from 'react'
import { Users, Calendar, MapPin, Package, MessageSquare } from 'lucide-react'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { db } from '../../lib/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({
    celebrities: 0,
    episodes: 0,
    locations: 0,
    items: 0,
    userPosts: 0
  })
  
  const [loading, setLoading] = useState(true)
  
  // ✅ useCallbackで無限ループを防ぐ
  const fetchStats = useCallback(async () => {
    try {
      console.log('🔍 Dashboard: Fetching stats...')
      
      // ✅ 修正: 1回のクエリで全データを取得（1000回ループを削除）
      const [celebrities, episodes, userPosts, locations, items] = await Promise.all([
        db.celebrities.getAll(),
        db.episodes.getAll(),
        db.userPosts.getAll(),
        db.locations.getAll(), // ✅ 全ロケーションを一度に取得
        db.items.getAll()      // ✅ 全アイテムを一度に取得
      ])
      
      setStats({
        celebrities: celebrities.length,
        episodes: episodes.length,
        locations: locations.length,
        items: items.length,
        userPosts: userPosts.length
      })
      
      console.log('✅ Dashboard: Stats fetched successfully', {
        celebrities: celebrities.length,
        episodes: episodes.length,
        locations: locations.length,
        items: items.length,
        userPosts: userPosts.length
      })
    } catch (error) {
      console.error('❌ Dashboard: Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }, []) // ✅ 空の依存配列
  
  // ✅ 初回のみ実行
  useEffect(() => {
    fetchStats()
  }, [fetchStats])
  
  const statCards = [
    { 
      title: '推し', 
      value: stats.celebrities, 
      icon: Users, 
      color: 'text-blue-600 bg-blue-100' 
    },
    { 
      title: 'エピソード', 
      value: stats.episodes, 
      icon: Calendar, 
      color: 'text-green-600 bg-green-100' 
    },
    { 
      title: 'ロケーション', 
      value: stats.locations, 
      icon: MapPin, 
      color: 'text-purple-600 bg-purple-100' 
    },
    { 
      title: 'アイテム', 
      value: stats.items, 
      icon: Package, 
      color: 'text-orange-600 bg-orange-100' 
    },
    { 
      title: 'ユーザー投稿', 
      value: stats.userPosts, 
      icon: MessageSquare, 
      color: 'text-pink-600 bg-pink-100' 
    },
  ]
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">統計データを読み込み中...</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">管理ダッシュボード</h2>
        <p className="text-gray-600 mt-2">推し活検索システムの管理画面</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">クイックアクション</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/admin/celebrities"
              className="block p-4 text-center bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-900">推し管理</p>
            </a>
            
            <a
              href="/admin/episodes"
              className="block p-4 text-center bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-900">エピソード管理</p>
            </a>
            
            <a
              href="/admin/locations"
              className="block p-4 text-center bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <MapPin className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-900">ロケーション管理</p>
            </a>
            
            <a
              href="/admin/posts"
              className="block p-4 text-center bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
            >
              <MessageSquare className="h-8 w-8 text-pink-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-pink-900">ユーザー投稿管理</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}