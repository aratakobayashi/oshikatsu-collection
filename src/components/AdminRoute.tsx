/**
 * 管理者権限が必要なルートのガード
 */

import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Card, { CardContent } from './ui/Card'

interface AdminRouteProps {
  children: ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">認証状況を確認中...</p>
        </div>
      </div>
    )
  }

  // 一時的に認証を無効化（開発用）
  // if (!user) {
  //   return <Navigate to="/login" replace />
  // }

  // 一時的に管理者チェックも無効化（開発用）
  // if (!isAdmin) {
  //   return (
  //     ... 権限エラー画面 ...
  //   )
  // }

  return <>{children}</>
}