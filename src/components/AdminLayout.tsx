import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { 
  Home,
  Users,
  Calendar,
  MapPin,
  Package,
  MessageSquare,
  Film,
  LogOut
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()
  const { user, signOut } = useAuth()

  const navItems = [
    { path: '/admin', label: 'ダッシュボード', icon: Home },
    { path: '/admin/celebrities', label: '推し管理', icon: Users },
    { path: '/admin/episodes', label: 'エピソード', icon: Calendar },
    { path: '/admin/locations', label: 'ロケーション', icon: MapPin },
    { path: '/admin/items', label: 'アイテム', icon: Package },
    { path: '/admin/posts', label: '投稿管理', icon: MessageSquare },
    { path: '/admin/works', label: '作品管理', icon: Film },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/admin" className="flex items-center space-x-3">
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                推し活管理画面
              </span>
            </Link>
            
            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <span className="text-sm text-gray-600">
                    {user.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>ログアウト</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="space-y-1 bg-white p-4 rounded-lg shadow-sm">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
              
              <div className="pt-4 mt-4 border-t border-gray-200">
                <Link
                  to="/"
                  className="flex items-center space-x-3 px-4 py-3 rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <Home className="h-5 w-5" />
                  <span className="font-medium">サイトに戻る</span>
                </Link>
              </div>
            </nav>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1 bg-white p-6 rounded-lg shadow-sm">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}