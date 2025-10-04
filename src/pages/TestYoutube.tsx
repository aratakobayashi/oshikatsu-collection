import React, { useState, useRef, useEffect } from 'react'

// B&ZAI記事の擬似データ
const mockArticleContent = `
🎬 B&ZAIの初生配信動画はこちら！
https://www.youtube.com/watch?v=dQw4w9WgXcQ

B&ZAI（バンザイ）は、次世代のアイドルグループとして注目を集めています。

もう一つのYouTube動画：
https://youtu.be/abcdef12345

その他のコンテンツもあります。
`

function TestYoutube() {
  const contentRef = useRef<HTMLDivElement>(null)
  const [debugLog, setDebugLog] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  function formatContent(content: string): string {
    if (!content) return ''

    addLog('🔍 formatContent開始 - コンテンツ長: ' + content.length)
    addLog('📝 元のコンテンツ: ' + content.substring(0, 200))

    try {
      let formatted = content

      // HTMLエンティティをデコード（&lt; を < に変換など）
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = formatted
      formatted = tempDiv.innerHTML

      addLog('🎬 YouTube変換処理開始')

      // YouTube URLを魅力的なサムネイル付きカードに直接変換
      const youtubeRegex = /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g
      addLog('🔍 使用する正規表現: ' + youtubeRegex.source)

      const beforeYoutube = formatted
      formatted = formatted.replace(youtubeRegex, (match, videoId) => {
        addLog('✅ YouTube URL発見: ' + match + ' VideoID: ' + videoId)
        return `<div class="youtube-embed my-8 mx-auto max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-300 group">
          <div class="relative">
            <img
              src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg"
              alt="YouTube動画サムネイル"
              class="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
              <div class="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg transform group-hover:scale-110 transition-all duration-300 cursor-pointer">
                <svg class="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          </div>
          <div class="p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div>
                  <p class="font-semibold text-gray-900">YouTube動画</p>
                  <p class="text-sm text-gray-600">クリックして視聴</p>
                </div>
              </div>
              <a
                href="${match}"
                target="_blank"
                rel="noopener noreferrer"
                class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              >
                視聴する
              </a>
            </div>
          </div>
        </div>`
      })

      if (beforeYoutube !== formatted) {
        addLog('✅ YouTube変換が実行されました')
      } else {
        addLog('❌ YouTube変換は実行されませんでした')
      }

      // 改行を<br>に変換
      formatted = formatted.replace(/\n/g, '<br>')

      addLog('✅ formatContent完了 - 最終コンテンツ長: ' + formatted.length)
      return formatted
    } catch (error) {
      addLog('❌ エラー: ' + (error as Error).message)
      return content
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">YouTube変換テストページ</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 元のコンテンツ */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">元のコンテンツ</h2>
            <div className="bg-gray-50 p-4 rounded border text-sm whitespace-pre-wrap">
              {mockArticleContent}
            </div>
          </div>

          {/* 変換後のコンテンツ */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">変換後</h2>
            <div
              ref={contentRef}
              className="bg-white p-4 rounded border min-h-64"
              dangerouslySetInnerHTML={{ __html: formatContent(mockArticleContent) }}
            />
          </div>
        </div>

        {/* デバッグログ */}
        <div className="mt-8 bg-yellow-50 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">デバッグログ</h2>
          <div className="bg-white p-4 rounded border max-h-64 overflow-y-auto">
            {debugLog.map((log, index) => (
              <div key={index} className="text-sm text-gray-700 mb-1">
                {log}
              </div>
            ))}
          </div>
          <button
            onClick={() => setDebugLog([])}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            ログクリア
          </button>
        </div>
      </div>
    </div>
  )
}

export default TestYoutube