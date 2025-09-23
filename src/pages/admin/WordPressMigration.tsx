import React, { useState } from 'react'
import { Globe, Download, CheckCircle, AlertCircle, ArrowRight, Key } from 'lucide-react'
import { useAuth } from '../../components/AuthProvider'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { db } from '../../lib/supabase'

interface MigrationProgress {
  total: number
  imported: number
  failed: number
  current?: string
  phase: 'connecting' | 'fetching' | 'importing' | 'completed'
}

interface WordPressSite {
  url: string
  username?: string
  password?: string
  total_posts: number
  categories: any[]
}

export default function WordPressMigration() {
  const { user } = useAuth()
  const [siteUrl, setSiteUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [siteInfo, setSiteInfo] = useState<WordPressSite | null>(null)
  const [progress, setProgress] = useState<MigrationProgress | null>(null)
  const [migrationResults, setMigrationResults] = useState<{success: string[], failed: string[]}>({
    success: [],
    failed: []
  })

  async function testConnection() {
    if (!siteUrl.trim()) return

    setConnecting(true)
    setSiteInfo(null)

    try {
      // WordPress REST APIの基本情報を取得
      const baseUrl = siteUrl.replace(/\/$/, '')
      const apiUrl = `${baseUrl}/wp-json/wp/v2`

      // サイト情報を取得
      const siteResponse = await fetch(`${baseUrl}/wp-json`)
      if (!siteResponse.ok) {
        throw new Error('WordPress REST APIにアクセスできません')
      }

      // 投稿数を取得
      const postsResponse = await fetch(`${apiUrl}/posts?per_page=1&_embed=true`)
      const totalPosts = parseInt(postsResponse.headers.get('X-WP-Total') || '0')

      // カテゴリを取得
      const categoriesResponse = await fetch(`${apiUrl}/categories?per_page=100`)
      const categories = await categoriesResponse.json()

      setSiteInfo({
        url: baseUrl,
        username,
        password,
        total_posts: totalPosts,
        categories
      })

    } catch (error) {
      console.error('Connection error:', error)
      alert(`接続エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setConnecting(false)
    }
  }

  async function startMigration() {
    if (!siteInfo) return

    setMigrating(true)
    setProgress({
      total: siteInfo.total_posts,
      imported: 0,
      failed: 0,
      phase: 'fetching'
    })

    const results = { success: [], failed: [] }

    try {
      // カテゴリマッピングを準備
      const localCategories = await db.categories.getAll()
      const categoryMapping = createCategoryMapping(siteInfo.categories, localCategories)

      let currentPage = 1
      const perPage = 20
      let hasMore = true

      while (hasMore) {
        setProgress(prev => prev ? { ...prev, phase: 'fetching', current: `ページ ${currentPage} を取得中...` } : null)

        try {
          // WordPress記事を取得（認証付き）
          const url = `${siteInfo.url}/wp-json/wp/v2/posts?per_page=${perPage}&page=${currentPage}&_embed=true`
          const headers: HeadersInit = {
            'Content-Type': 'application/json'
          }

          // 認証情報がある場合は追加
          if (siteInfo.username && siteInfo.password) {
            headers['Authorization'] = `Basic ${btoa(`${siteInfo.username}:${siteInfo.password}`)}`
          }

          const response = await fetch(url, { headers })

          if (!response.ok) {
            if (response.status === 401) {
              throw new Error('認証が必要です。ユーザー名とパスワードを確認してください。')
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const posts = await response.json()

          if (posts.length === 0) {
            hasMore = false
            break
          }

          setProgress(prev => prev ? { ...prev, phase: 'importing' } : null)

          // 各記事をインポート
          for (const post of posts) {
            setProgress(prev => prev ? { ...prev, current: post.title.rendered } : null)

            try {
              const articleData = await convertWordPressPost(post, categoryMapping)
              await db.articles.create(articleData)
              results.success.push(post.title.rendered)

              setProgress(prev => prev ? { ...prev, imported: prev.imported + 1 } : null)
            } catch (error) {
              console.error(`記事インポートエラー: ${post.title.rendered}`, error)
              results.failed.push(post.title.rendered)
              setProgress(prev => prev ? { ...prev, failed: prev.failed + 1 } : null)
            }

            // 少し待機
            await new Promise(resolve => setTimeout(resolve, 100))
          }

          currentPage++
        } catch (error) {
          console.error(`ページ ${currentPage} の取得エラー:`, error)
          hasMore = false
        }
      }

      setProgress(prev => prev ? { ...prev, phase: 'completed' } : null)
      setMigrationResults(results)

    } catch (error) {
      console.error('Migration error:', error)
      alert(`移行エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setMigrating(false)
    }
  }

  function createCategoryMapping(wpCategories: any[], localCategories: any[]) {
    const mapping: Record<number, string> = {}

    wpCategories.forEach(wpCat => {
      // 名前やスラッグで一致するローカルカテゴリを探す
      const localCat = localCategories.find(local =>
        local.name.includes(wpCat.name) ||
        local.slug.includes(wpCat.slug) ||
        wpCat.name.includes(local.name)
      )

      mapping[wpCat.id] = localCat ? localCat.id : localCategories[0]?.id
    })

    return mapping
  }

  async function convertWordPressPost(post: any, categoryMapping: Record<number, string>) {
    // アイキャッチ画像を取得
    let featured_image = ''
    if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
      featured_image = post._embedded['wp:featuredmedia'][0].source_url
    }

    // カテゴリを取得
    const category_id = post.categories?.[0]
      ? categoryMapping[post.categories[0]]
      : (await db.categories.getAll())[0]?.id

    // タグを取得
    const tags = post._embedded?.['wp:term']?.[1] || []

    return {
      title: post.title.rendered,
      slug: post.slug,
      content: post.content.rendered,
      excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, ''), // HTMLタグを除去
      featured_image,
      category_id,
      tags: tags.map((tag: any) => tag.name),
      status: post.status === 'publish' ? 'published' as const : 'draft' as const,
      published_at: post.date,
      wordpress_id: post.id,
      wordpress_slug: post.slug,
      seo_title: post.title.rendered,
      meta_description: post.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 160)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">WordPress一括移行</h2>
        <p className="text-gray-600 mt-2">WordPress REST APIを使用して記事を一括移行します</p>
        <p className="text-sm text-gray-500 mt-1">ログイン中: {user?.email}</p>
      </div>

      {/* 接続設定 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          WordPress サイト接続
        </h3>

        <div className="space-y-4">
          <Input
            label="WordPressサイトURL"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://example.com"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="ユーザー名（オプション）"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="管理者ユーザー名"
            />

            <Input
              label="パスワード（オプション）"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="アプリケーションパスワード"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start">
              <Key className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">認証について</h4>
                <p className="text-sm text-blue-700 mt-1">
                  非公開記事も移行する場合は、WordPress管理画面で「アプリケーションパスワード」を生成してください。<br />
                  ユーザー → プロフィール → アプリケーションパスワード
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={testConnection}
            disabled={connecting || !siteUrl.trim()}
            icon={connecting ? undefined : Globe}
            className="w-full"
          >
            {connecting ? '接続中...' : 'サイトに接続してテスト'}
          </Button>
        </div>
      </Card>

      {/* サイト情報表示 */}
      {siteInfo && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            接続成功
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">サイトURL</p>
                <p className="font-medium">{siteInfo.url}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">記事数</p>
                <p className="font-medium">{siteInfo.total_posts.toLocaleString()}件</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">カテゴリ</p>
              <div className="flex flex-wrap gap-2">
                {siteInfo.categories.slice(0, 8).map(cat => (
                  <span key={cat.id} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {cat.name} ({cat.count})
                  </span>
                ))}
                {siteInfo.categories.length > 8 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    他 {siteInfo.categories.length - 8}件...
                  </span>
                )}
              </div>
            </div>

            <Button
              onClick={startMigration}
              disabled={migrating}
              className="w-full"
              icon={ArrowRight}
            >
              {migrating ? '移行中...' : `${siteInfo.total_posts}件の記事を移行開始`}
            </Button>
          </div>
        </Card>
      )}

      {/* 移行進捗 */}
      {progress && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">🚀 移行進捗</h3>
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.imported + progress.failed) / progress.total * 100}%` }}
              />
            </div>

            <div className="flex justify-between text-sm">
              <span>
                {progress.phase === 'connecting' && '接続中...'}
                {progress.phase === 'fetching' && '記事取得中...'}
                {progress.phase === 'importing' && '記事インポート中...'}
                {progress.phase === 'completed' && '移行完了'}
              </span>
              <span>
                {progress.imported + progress.failed} / {progress.total}
                （成功: {progress.imported} | 失敗: {progress.failed}）
              </span>
            </div>

            {progress.current && (
              <p className="text-sm text-gray-600">
                現在処理中: {progress.current}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* 移行結果 */}
      {migrationResults.success.length > 0 || migrationResults.failed.length > 0 ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">✅ 移行完了</h3>

          <div className="space-y-4">
            {migrationResults.success.length > 0 && (
              <div>
                <div className="flex items-center text-green-600 mb-2">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">移行成功: {migrationResults.success.length}件</span>
                </div>
                <div className="max-h-32 overflow-y-auto bg-green-50 p-3 rounded">
                  {migrationResults.success.slice(0, 10).map((title, index) => (
                    <p key={index} className="text-sm text-green-700">• {title}</p>
                  ))}
                  {migrationResults.success.length > 10 && (
                    <p className="text-sm text-green-600 font-medium">
                      他 {migrationResults.success.length - 10}件...
                    </p>
                  )}
                </div>
              </div>
            )}

            {migrationResults.failed.length > 0 && (
              <div>
                <div className="flex items-center text-red-600 mb-2">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">移行失敗: {migrationResults.failed.length}件</span>
                </div>
                <div className="max-h-32 overflow-y-auto bg-red-50 p-3 rounded">
                  {migrationResults.failed.map((title, index) => (
                    <p key={index} className="text-sm text-red-700">• {title}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button onClick={() => window.open('/admin/articles', '_blank')}>
                移行した記事を確認
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMigrationResults({ success: [], failed: [] })
                  setSiteInfo(null)
                  setSiteUrl('')
                  setUsername('')
                  setPassword('')
                }}
              >
                新しい移行を開始
              </Button>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  )
}