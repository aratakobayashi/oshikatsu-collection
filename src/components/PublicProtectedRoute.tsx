import React from 'react'
import { useAuth } from './AuthProvider'
import { Link } from 'react-router-dom'
import Card, { CardContent } from './ui/Card'
import Button from './ui/Button'
import { LogIn, UserPlus } from 'lucide-react'

interface PublicProtectedRouteProps {
  children: React.ReactNode
}

export default function PublicProtectedRoute({ children }: PublicProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ログインが必要です
            </h2>
            <p className="text-gray-600 mb-8">
              投稿機能を利用するにはアカウントが必要です
            </p>
          </div>
          
          <Card>
            <CardContent className="p-8 space-y-4">
              <Link to="/login" className="block">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  icon={LogIn}
                >
                  ログイン
                </Button>
              </Link>
              
              <Link to="/register" className="block">
                <Button 
                  variant="outline"
                  className="w-full"
                  icon={UserPlus}
                >
                  新規登録
                </Button>
              </Link>
              
              <div className="text-center pt-4">
                <Link 
                  to="/"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  ホームに戻る
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return <>{children}</>
}