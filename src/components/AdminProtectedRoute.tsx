// src/components/AdminProtectedRoute.tsx
import React from 'react'
import { useAuth } from './AuthProvider'
import LoginForm from './LoginForm'

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading } = useAuth()
  
  // 環境変数から管理者メールを取得（デフォルト値としてバックアップ用メールを設定）
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'your-backup-email@example.com';
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!user) {
    return <LoginForm />
  }
  
  if (user.email !== adminEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center text-red-600 mb-4">アクセス権限がありません</h2>
          <p className="text-gray-600 mb-4">
            この管理画面は開発者/運用担当者のみがアクセスできます。
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            ホームページに戻る
          </button>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}