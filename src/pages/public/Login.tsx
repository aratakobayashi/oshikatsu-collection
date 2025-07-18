import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { useAuth } from '../../components/AuthProvider'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(formData.email, formData.password)
      navigate('/submit')
    } catch (error: any) {
      setError(error.message || 'ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-pink-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              ログイン
            </h1>
            <p className="text-xl text-gray-600">
              アカウントにログインして投稿機能を利用しましょう
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 lg:px-8 py-12">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              アカウントにログイン
            </h2>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
              
              <Input
                label="メールアドレス"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                autoComplete="email"
                placeholder="your@email.com"
                className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
              />
              
              <div className="relative">
                <Input
                  label="パスワード"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                  placeholder="パスワードを入力"
                  className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-full py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                icon={LogIn}
                loading={loading}
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </Button>
              
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  アカウントをお持ちでない方は
                </p>
                <Link
                  to="/register"
                  className="text-rose-600 hover:text-rose-800 font-medium text-lg"
                >
                  新規登録はこちら
                </Link>
              </div>
              
              <div className="text-center pt-4">
                <Link
                  to="/"
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ホームに戻る
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}