import React, { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { useAuth } from '../../components/AuthProvider'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { db } from '../../lib/supabase'

interface ImportProgress {
  total: number
  imported: number
  failed: number
  current?: string
}

interface WordPressArticle {
  title: string
  content: string
  excerpt?: string
  featured_image?: string
  category: string
  tags?: string[]
  published_at: string
  wordpress_id?: number
  wordpress_slug?: string
  author?: string
}

export default function ArticleImport() {
  const { user } = useAuth()
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [previewData, setPreviewData] = useState<WordPressArticle[]>([])
  const [importResults, setImportResults] = useState<{success: string[], failed: string[]}>({
    success: [],
    failed: []
  })

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      let articles: WordPressArticle[] = []

      if (file.type === 'application/json') {
        // JSON形式の処理
        const data = JSON.parse(text)
        articles = processJsonData(data)
      } else if (file.name.endsWith('.xml')) {
        // WordPress XML形式の処理
        articles = processWordPressXml(text)
      } else if (file.name.endsWith('.csv')) {
        // CSV形式の処理
        articles = processCsvData(text)
      }

      setPreviewData(articles)
    } catch (error) {
      console.error('ファイル読み込みエラー:', error)
      alert('ファイルの形式が正しくありません')
    }
  }

  function processJsonData(data: any): WordPressArticle[] {
    // WordPress REST API JSONの処理
    if (Array.isArray(data)) {
      return data.map(item => ({
        title: item.title?.rendered || item.title,
        content: item.content?.rendered || item.content,
        excerpt: item.excerpt?.rendered || item.excerpt,
        featured_image: item.featured_media_url || item.featured_image,
        category: item.categories?.[0] || 'uncategorized',
        tags: item.tags || [],
        published_at: item.date || new Date().toISOString(),
        wordpress_id: item.id,
        wordpress_slug: item.slug
      }))
    }
    return []
  }

  function processWordPressXml(xmlText: string): WordPressArticle[] {
    // WordPress XMLの基本的な解析
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
    const items = xmlDoc.querySelectorAll('item')

    return Array.from(items).map(item => {
      const title = item.querySelector('title')?.textContent || ''
      const content = item.querySelector('content\\:encoded')?.textContent ||
                    item.querySelector('encoded')?.textContent || ''
      const excerpt = item.querySelector('excerpt\\:encoded')?.textContent || ''
      const category = item.querySelector('category')?.textContent || 'uncategorized'
      const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString()

      return {
        title,
        content,
        excerpt,
        category,
        published_at: new Date(pubDate).toISOString(),
        wordpress_id: parseInt(item.querySelector('wp\\:post_id')?.textContent || '0'),
        wordpress_slug: item.querySelector('wp\\:post_name')?.textContent || ''
      }
    }).filter(article => article.title && article.content)
  }

  function processCsvData(csvText: string): WordPressArticle[] {
    const lines = csvText.split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const article: any = {}

      headers.forEach((header, index) => {
        article[header] = values[index] || ''
      })

      return {
        title: article.title || article.Title,
        content: article.content || article.Content,
        excerpt: article.excerpt || article.Excerpt,
        featured_image: article.featured_image || article.Image,
        category: article.category || article.Category || 'uncategorized',
        tags: article.tags ? article.tags.split(';') : [],
        published_at: article.published_at || article.Date || new Date().toISOString(),
        wordpress_id: article.wordpress_id ? parseInt(article.wordpress_id) : undefined,
        wordpress_slug: article.wordpress_slug || article.Slug
      }
    }).filter(article => article.title && article.content)
  }

  async function startImport() {
    if (previewData.length === 0) return

    setImporting(true)
    setProgress({ total: previewData.length, imported: 0, failed: 0 })

    const results = { success: [], failed: [] }
    const categories = await db.categories.getAll()

    for (let i = 0; i < previewData.length; i++) {
      const article = previewData[i]
      setProgress(prev => prev ? { ...prev, current: article.title } : null)

      try {
        // カテゴリマッピング
        const category = categories.find(c =>
          c.name.includes(article.category) ||
          c.slug.includes(article.category.toLowerCase())
        ) || categories[0] // デフォルトカテゴリ

        const articleData = {
          title: article.title,
          slug: generateSlug(article.title),
          content: article.content,
          excerpt: article.excerpt || '',
          featured_image: article.featured_image || '',
          category_id: category.id,
          tags: article.tags || [],
          status: 'published' as const,
          published_at: article.published_at,
          wordpress_id: article.wordpress_id,
          wordpress_slug: article.wordpress_slug,
          seo_title: article.title,
          meta_description: article.excerpt || article.title.substring(0, 160)
        }

        await db.articles.create(articleData)
        results.success.push(article.title)

        setProgress(prev => prev ? { ...prev, imported: prev.imported + 1 } : null)
      } catch (error) {
        console.error(`記事インポートエラー: ${article.title}`, error)
        results.failed.push(article.title)
        setProgress(prev => prev ? { ...prev, failed: prev.failed + 1 } : null)
      }

      // 少し待機してUI更新
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setImportResults(results)
    setImporting(false)
    setProgress(null)
  }

  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  function downloadTemplate() {
    const csvTemplate = `title,content,excerpt,featured_image,category,tags,published_at,wordpress_id,wordpress_slug
"サンプル記事タイトル","記事の本文内容","記事の抜粋","https://example.com/image.jpg","はじめての推し活","タグ1;タグ2","2024-01-01T00:00:00Z","1","sample-article"`

    const blob = new Blob([csvTemplate], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wordpress-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">WordPress記事インポート</h2>
        <p className="text-gray-600 mt-2">WordPress記事をインポートして移管します</p>
        <p className="text-sm text-gray-500 mt-1">ログイン中: {user?.email}</p>
      </div>

      {/* テンプレートダウンロード */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">📋 CSVテンプレート</h3>
        <p className="text-gray-600 mb-4">
          CSV形式で記事をインポートする場合は、以下のテンプレートを使用してください。
        </p>
        <Button onClick={downloadTemplate} icon={Download}>
          CSVテンプレートをダウンロード
        </Button>
      </Card>

      {/* ファイルアップロード */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">📁 ファイルアップロード</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            WordPress記事ファイルをアップロードしてください<br />
            対応形式: XML (WordPress Export), JSON, CSV
          </p>
          <input
            type="file"
            accept=".xml,.json,.csv"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button as="span" icon={FileText}>
              ファイルを選択
            </Button>
          </label>
        </div>
      </Card>

      {/* プレビュー */}
      {previewData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">👀 インポートプレビュー</h3>
          <p className="text-gray-600 mb-4">
            {previewData.length}件の記事が見つかりました
          </p>

          <div className="max-h-96 overflow-y-auto space-y-2 mb-4">
            {previewData.slice(0, 10).map((article, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium">{article.title}</h4>
                <p className="text-sm text-gray-600">
                  カテゴリ: {article.category} |
                  公開日: {new Date(article.published_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            {previewData.length > 10 && (
              <p className="text-sm text-gray-500 text-center">
                他 {previewData.length - 10}件...
              </p>
            )}
          </div>

          <Button
            onClick={startImport}
            disabled={importing}
            className="w-full"
          >
            {importing ? 'インポート中...' : `${previewData.length}件の記事をインポート開始`}
          </Button>
        </Card>
      )}

      {/* インポート進捗 */}
      {progress && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">📊 インポート進捗</h3>
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.imported + progress.failed) / progress.total * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span>進行中: {progress.imported + progress.failed} / {progress.total}</span>
              <span>成功: {progress.imported} | 失敗: {progress.failed}</span>
            </div>
            {progress.current && (
              <p className="text-sm text-gray-600">
                現在処理中: {progress.current}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* インポート結果 */}
      {importResults.success.length > 0 || importResults.failed.length > 0 ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">✅ インポート結果</h3>

          {importResults.success.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center text-green-600 mb-2">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">成功: {importResults.success.length}件</span>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {importResults.success.map((title, index) => (
                  <p key={index} className="text-sm text-gray-600">• {title}</p>
                ))}
              </div>
            </div>
          )}

          {importResults.failed.length > 0 && (
            <div>
              <div className="flex items-center text-red-600 mb-2">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">失敗: {importResults.failed.length}件</span>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {importResults.failed.map((title, index) => (
                  <p key={index} className="text-sm text-gray-600">• {title}</p>
                ))}
              </div>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  )
}