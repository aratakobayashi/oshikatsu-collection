import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Users, Search, MessageSquare, Plus, Menu, X, Heart, Star, Package, MapPin, ExternalLink, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const { user, isAuthenticated, loading } = useAuth()

  const navigationItems = [
    { id: 'home', path: '/', icon: Home, label: 'ホーム', color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { id: 'celebrities', path: '/celebrities', icon: Users, label: '推し', color: 'text-rose-500', bgColor: 'bg-rose-50' },
    { id: 'locations', path: '/locations', icon: MapPin, label: '場所', color: 'text-purple-500', bgColor: 'bg-purple-50' },
    { id: 'items', path: '/items', icon: Package, label: 'アイテム', color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { id: 'posts', path: '/posts', icon: MessageSquare, label: '質問', color: 'text-green-500', bgColor: 'bg-green-50' }
  ]

  const quickActions = [
    { icon: Package, label: 'アイテム', path: '/items', color: 'from-orange-400 to-red-500' },
    { icon: MapPin, label: '店舗', path: '/locations', color: 'from-blue-400 to-indigo-500' },
    { icon: Heart, label: 'お気に入り', path: '/favorites', color: 'from-pink-400 to-rose-500' },
    { icon: Star, label: '人気', path: '/popular', color: 'from-yellow-400 to-orange-500' }
  ]



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header */}
      <header className="hidden lg:block bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Desktop Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-rose-400 to-pink-500 p-2 rounded-xl">
                <Heart className="h-6 w-6 text-white" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">推し活コレクション</h1>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                    location.pathname === item.path
                      ? `${item.bgColor} ${item.color}`
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Desktop CTA & Auth */}
            <div className="flex items-center space-x-4">
              {!loading && (
                isAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    <Link
                      to="/submit"
                      className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-2 rounded-xl font-semibold hover:from-rose-600 hover:to-pink-600 transition-all"
                    >
                      質問を投稿
                    </Link>
                    <div className="text-sm text-gray-600">
                      {user?.email}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link
                      to="/login"
                      className="flex items-center space-x-2 px-5 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <LogIn className="h-4 w-4" />
                      <span className="font-medium">ログイン</span>
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center space-x-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-2 rounded-xl font-semibold hover:from-rose-600 hover:to-pink-600 transition-all"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>会員登録</span>
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-lg sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Mobile Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-rose-400 to-pink-500 p-2 rounded-xl">
                <Heart className="h-6 w-6 text-white" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">推し活コレクション</h1>
                <p className="text-xs text-gray-500">みんなで作る推し活辞典</p>
              </div>
            </Link>

            {/* Hamburger Menu */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                placeholder="推し名・ブランド・アイテムで検索..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="border-t border-gray-100 bg-white">
            <div className="px-4 py-6 space-y-6">
              {/* Quick Actions Grid */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">クイックアクション</h3>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, index) => (
                    <Link
                      key={index}
                      to={action.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group"
                    >
                      <div className={`p-2 bg-gradient-to-r ${action.color} rounded-xl text-white group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-gray-900">{action.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Main Navigation */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">メニュー</h3>
                <div className="space-y-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`w-full flex items-center space-x-3 p-4 rounded-2xl transition-all ${
                        location.pathname === item.path
                          ? `${item.bgColor} ${item.color}`
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Auth & CTA Buttons */}
              {!loading && (
                isAuthenticated ? (
                  <div className="space-y-3">
                    <Link
                      to="/submit"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
                    >
                      <Plus className="h-5 w-5" />
                      <span>質問を投稿する</span>
                    </Link>
                    <div className="text-center text-sm text-gray-600">
                      ログイン中: {user?.email}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
                    >
                      <UserPlus className="h-5 w-5" />
                      <span>無料会員登録</span>
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full border-2 border-gray-300 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
                    >
                      <LogIn className="h-5 w-5" />
                      <span>ログイン</span>
                    </Link>
                  </div>
                )
              )}

              {/* External Links */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">外部リンク</h3>
                <a
                  href="https://oshikatsu-guide.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl hover:from-purple-100 hover:to-pink-100 transition-colors"
                >
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
                    <ExternalLink className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 block">推し活ガイドブック</span>
                    <span className="text-xs text-gray-500">推し活の基本をチェック</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-2xl z-50">
        <div className="px-2 py-2">
          <div className="flex justify-around items-center">
            {/* First 4 navigation items */}
            {navigationItems.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all ${
                  location.pathname === item.path
                    ? `${item.bgColor} ${item.color}`
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <item.icon className={`h-5 w-5 mb-1`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            ))}
            
            {/* Center Action Button */}
            {!loading && (
              isAuthenticated ? (
                <Link
                  to="/submit"
                  className="flex flex-col items-center px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                >
                  <Plus className="h-5 w-5 mb-1" />
                  <span className="text-[10px] font-medium">投稿</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex flex-col items-center px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                >
                  <LogIn className="h-5 w-5 mb-1" />
                  <span className="text-[10px] font-medium">ログイン</span>
                </Link>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Bottom padding for mobile to avoid navigation overlap */}
      <div className="lg:hidden h-20" />

      {/* Desktop Footer */}
      <footer className="hidden lg:block bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-rose-400">
                  <Heart className="h-8 w-8" fill="currentColor" />
                </div>
                <span className="text-xl font-bold">推し活コレクション</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                推し活の聖地巡礼・私服特定をもっとリッチに。<br />
                ファン同士で情報を共有し、お気に入りのアイテムやスポットを発見するプラットフォームです。
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">サービス</h3>
              <ul className="space-y-4">
                <li><Link to="/celebrities" className="text-gray-400 hover:text-white transition-colors">推し一覧</Link></li>
                <li><Link to="/items" className="text-gray-400 hover:text-white transition-colors">アイテム</Link></li>
                <li><Link to="/locations" className="text-gray-400 hover:text-white transition-colors">店舗・ロケ地</Link></li>
                <li><Link to="/posts" className="text-gray-400 hover:text-white transition-colors">質問・投稿</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">サポート</h3>
              <ul className="space-y-4">
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">サイト概要</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">お問い合わせ</Link></li>
                <li><a href="https://oshikatsu-guide.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">推し活ガイドブック</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-400">
                © 2024 推し活コレクション. All rights reserved.
              </p>
              <div className="flex space-x-6 text-sm">
                <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                  プライバシーポリシー
                </Link>
                <Link to="/terms-of-service" className="text-gray-400 hover:text-white transition-colors">
                  利用規約
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout