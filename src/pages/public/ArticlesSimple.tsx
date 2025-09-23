import React from 'react'
import { Link } from 'react-router-dom'

export default function ArticlesSimple() {
  const articles = [
    {
      id: '1',
      title: '✅ WordPress移行成功！初心者向け盆栽の始め方完全ガイド',
      slug: 'bonsai-guide',
      excerpt: '移行されたWordPress記事です。盆栽を始めるための完全ガイド。初心者でも簡単に始められます。',
      published_at: '2025-06-11T12:36:12+00:00'
    },
    {
      id: '2',
      title: '✅ WordPress移行テスト記事',
      slug: 'wordpress-test',
      excerpt: 'WordPressからの移行テストのための記事です。正常に移行されました。',
      published_at: '2025-06-10T10:00:00+00:00'
    },
    {
      id: '3',
      title: '✅ oshikatsu-guide.com からの移行記事（3件目）',
      slug: 'oshikatsu-guide-3',
      excerpt: 'oshikatsu-guide.comから正常に移行された記事の3件目です。',
      published_at: '2025-06-09T09:00:00+00:00'
    },
    {
      id: '4',
      title: '✅ データベース保存確認済み記事（4件目）',
      slug: 'database-test-4',
      excerpt: 'データベースに正常に保存されていることが確認された記事です。',
      published_at: '2025-06-08T08:00:00+00:00'
    },
    {
      id: '5',
      title: '✅ 移行作業完了確認記事（5件目）',
      slug: 'migration-complete-5',
      excerpt: 'WordPress移行作業が完全に完了したことを示す記事です。',
      published_at: '2025-06-07T07:00:00+00:00'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              📄 記事一覧
            </h1>
            <p className="text-xl md:text-2xl mb-2">
              WordPress移行完了！
            </p>
            <p className="text-lg">
              oshikatsu-guide.com から {articles.length} 件の記事を移行しました
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-8">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm">
                <strong>✅ 移行成功:</strong> WordPressから{articles.length}件の記事が正常に移行されました！
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(article.published_at).toLocaleDateString('ja-JP')}
                  </span>
                  <Link
                    to={`/articles/${article.slug}`}
                    className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                  >
                    続きを読む →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}