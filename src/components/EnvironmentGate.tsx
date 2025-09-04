import React, { useState, useEffect } from 'react'

interface EnvironmentGateProps {
  children: React.ReactNode
}

const EnvironmentGate: React.FC<EnvironmentGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isInitializing, setIsInitializing] = useState(true)

  // 環境判定（環境変数 + URL判定）
  let appEnv = import.meta.env.VITE_ENVIRONMENT || import.meta.env.APP_ENV || 'development'
  const currentUrl = window.location.href
  
  // URL ベースの環境判定（フォールバック）
  if (currentUrl.includes('deploy-preview-')) {
    appEnv = 'preview'
  } else if (currentUrl.includes('develop--')) {
    appEnv = 'staging'  
  } else if (currentUrl.includes('collection.oshikatsu-guide.com')) {
    appEnv = 'production'
  }
  
  const requiresAuth = appEnv === 'staging' || appEnv === 'preview'
  
  // デバッグ情報
  console.log('EnvironmentGate Debug:', {
    VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
    APP_ENV: import.meta.env.APP_ENV,
    appEnv,
    requiresAuth,
    url: window.location.href,
    pathname: window.location.pathname
  })

  // 認証不要な環境はそのまま表示
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!requiresAuth) {
        setIsAuthenticated(true)
        setIsInitializing(false)
        return
      }

      // セッションストレージから認証状態を復元
      const savedAuth = sessionStorage.getItem('env-authenticated')
      if (savedAuth === appEnv) {
        setIsAuthenticated(true)
      }
      setIsInitializing(false)
    }, 100) // 100ms待機して初期化を確実にする
    
    return () => clearTimeout(timer)
  }, [requiresAuth, appEnv])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 環境別パスワード
    const passwords = {
      staging: 'staging123',
      preview: 'preview123'
    }
    
    const correctPassword = passwords[appEnv as keyof typeof passwords]
    
    if (password === correctPassword) {
      setIsAuthenticated(true)
      sessionStorage.setItem('env-authenticated', appEnv)
      setError('')
    } else {
      setError('パスワードが正しくありません')
      setPassword('')
    }
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
        <div className="text-center text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">🔐 認証が必要です</h1>
          <p className="text-white/80">
            この環境にアクセスするには認証が必要です
          </p>
          <div className="inline-block bg-white/20 px-4 py-2 rounded-full text-sm font-medium mt-4">
            環境: {appEnv.toUpperCase()}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-white font-medium mb-2">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="パスワードを入力してください"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-100 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            認証
          </button>
        </form>

        <div className="mt-6 text-center text-white/60 text-xs">
          <p>開発・テスト環境用の認証システムです</p>
        </div>
      </div>
    </div>
  )
}

export default EnvironmentGate