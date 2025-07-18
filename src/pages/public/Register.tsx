import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Eye, EyeOff, Check, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { useAuth } from '../../components/AuthProvider'

interface FormData {
  email: string
  username: string
  display_name: string
  password: string
  confirmPassword: string
}

export default function Register() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: '',
    display_name: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validateForm() {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください'
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'ユーザー名を入力してください'
    } else if (formData.username.length < 3) {
      newErrors.username = 'ユーザー名は3文字以上で入力してください'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'ユーザー名は英数字とアンダースコアのみ使用できます'
    }

    // Display name validation
    if (!formData.display_name.trim()) {
      newErrors.display_name = '表示名を入力してください'
    } else if (formData.display_name.length > 50) {
      newErrors.display_name = '表示名は50文字以内で入力してください'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください'
    } else if (formData.password.length < 6) {
      newErrors.password = 'パスワードは6文字以上で入力してください'
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      await signUp(formData.email, formData.password, {
        username: formData.username,
        display_name: formData.display_name
      })
      
      navigate('/submit', { 
        state: { message: 'アカウントが作成されました！投稿を開始できます。' } 
      })
    } catch (error: any) {
      // Check if the error is due to user already existing
      if (error.message && error.message.includes('User already registered')) {
        setErrors({ 
          submit: 'このメールアドレスは既に登録されています。ログインページからサインインしてください。' 
        })
      } else {
        setErrors({ submit: error.message || '登録に失敗しました' })
      }
    } finally {
      setLoading(false)
    }
  }

  function getPasswordStrength(password: string) {
    if (password.length === 0) return { strength: 0, label: '' }
    if (password.length < 6) return { strength: 1, label: '弱い' }
    if (password.length < 8) return { strength: 2, label: '普通' }
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, label: '強い' }
    }
    return { strength: 2, label: '普通' }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-pink-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              新規登録
            </h1>
            <p className="text-xl text-gray-600">
              アカウントを作成して投稿機能を利用しましょう
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 lg:px-8 py-12">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              新しいアカウントを作成
            </h2>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {errors.submit}
                </div>
              )}
              
              <Input
                label="メールアドレス"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                error={errors.email}
                required
                autoComplete="email"
                placeholder="your@email.com"
                className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
              />
              
              <Input
                label="ユーザー名"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                error={errors.username}
                helpText="3文字以上の英数字（アンダースコア可）"
                required
                autoComplete="username"
                placeholder="username123"
                className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
              />
              
              <Input
                label="表示名"
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                error={errors.display_name}
                helpText="投稿時に表示される名前（50文字以内）"
                required
                placeholder="山田太郎"
                className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
              />
              
              <div className="relative">
                <Input
                  label="パスワード"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  error={errors.password}
                  required
                  autoComplete="new-password"
                  placeholder="6文字以上のパスワード"
                  className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            passwordStrength.strength === 1 ? 'bg-red-500 w-1/3' :
                            passwordStrength.strength === 2 ? 'bg-yellow-500 w-2/3' :
                            passwordStrength.strength === 3 ? 'bg-green-500 w-full' : 'w-0'
                          }`}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{passwordStrength.label}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <Input
                  label="パスワード確認"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  error={errors.confirmPassword}
                  required
                  autoComplete="new-password"
                  placeholder="パスワードを再入力"
                  className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                
                {formData.confirmPassword && (
                  <div className="mt-2 flex items-center space-x-2">
                    {formData.password === formData.confirmPassword ? (
                      <div className="flex items-center text-green-600">
                        <Check className="h-4 w-4 mr-1" />
                        <span className="text-xs">パスワードが一致しています</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <X className="h-4 w-4 mr-1" />
                        <span className="text-xs">パスワードが一致しません</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-full py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                icon={UserPlus}
                loading={loading}
              >
                {loading ? '登録中...' : 'アカウント作成'}
              </Button>
              
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  既にアカウントをお持ちの方は
                </p>
                <Link
                  to="/login"
                  className="text-rose-600 hover:text-rose-800 font-medium text-lg"
                >
                  ログインはこちら
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