import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { 
  Home,
  Users,
  HelpCircle,
  ExternalLink,
  MessageSquare
} from 'lucide-react'

// Star Logo Component
const StarLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
)

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="text-rose-400">
                <StarLogo className="h-8 w-8" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                推し活コレクション
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link 
                to="/" 
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === '/' 
                    ? 'text-rose-600 bg-rose-50' 
                    : 'text-gray-700 hover:text-rose-600 hover:bg-gray-50'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>ホーム</span>
              </Link>
              
              <Link 
                to="/celebrities" 
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === '/celebrities' 
                    ? 'text-rose-600 bg-rose-50' 
                    : 'text-gray-700 hover:text-rose-600 hover:bg-gray-50'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>推し一覧</span>
              </Link>
              
              <a 
                href="https://oshikatsu-guide.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-700 hover:text-rose-600 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gray-50 border-b-2 border-rose-200"
              >
                <span className="underline">推し活ガイドブック</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              
              <Link 
                to="/posts" 
                className="flex items-center space-x-2 text-gray-700 hover:text-rose-600 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gray-50"
              >
                <MessageSquare className="h-4 w-4" />
                <span>みんなの質問</span>
              </Link>
            </nav>
            
            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link 
                    to="/submit"
                    className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-2.5 rounded-full hover:from-rose-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    質問投稿
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="text-gray-600 hover:text-gray-800 transition-colors px-4 py-2"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-gray-600 hover:text-gray-800 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    ログイン
                  </Link>
                  <Link 
                    to="/register"
                    className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-2.5 rounded-full hover:from-rose-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    新規登録
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50">
        <div className="grid grid-cols-4 py-2">
          <Link 
            to="/" 
            className={`flex flex-col items-center py-3 px-2 ${
              location.pathname === '/' 
                ? 'text-rose-600' 
                : 'text-gray-500'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">ホーム</span>
          </Link>
          
          <Link 
            to="/celebrities" 
            className={`flex flex-col items-center py-3 px-2 ${
              location.pathname === '/celebrities' 
                ? 'text-rose-600' 
                : 'text-gray-500'
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">推し一覧</span>
          </Link>
          
          <Link 
            to="/posts" 
            className={`flex flex-col items-center py-3 px-2 ${
              location.pathname === '/posts' 
                ? 'text-rose-600' 
                : 'text-gray-500'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs mt-1">質問</span>
          </Link>
          
          <Link 
            to="/posts" 
            className={`flex flex-col items-center py-3 px-2 ${
              location.pathname === '/posts' 
                ? 'text-rose-600' 
                : 'text-gray-500'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs mt-1">質問</span>
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  )
}