import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, ArrowLeft, Clock, Eye, Share2, Heart, BookOpen, ListOrdered, ChevronRight, Twitter, Facebook, MessageCircle, Copy, CheckCircle, Home, FolderOpen } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// Instagram埋め込み用の型定義
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process(): void
      }
    }
  }
}

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
)

interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  published_at: string
  featured_image_url?: string
  category_id?: string
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
}

interface TocItem {
  id: string
  text: string
  level: number
}

// 読了時間を計算
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

// シェア機能
// 各SNSプラットフォーム用のシェア関数
function shareToTwitter(title: string, url: string) {
  const text = `${title} | 推し活ガイド`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  window.open(twitterUrl, '_blank', 'width=600,height=400')
}

function shareToFacebook(url: string) {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  window.open(facebookUrl, '_blank', 'width=600,height=400')
}

function shareToLine(title: string, url: string) {
  const text = `${title} | 推し活ガイド`
  const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(`${text}\n${url}`)}`
  window.open(lineUrl, '_blank')
}

async function copyUrlToClipboard(url: string, setCopiedUrl: (value: boolean) => void) {
  try {
    await navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  } catch (error) {
    // フォールバック：古いブラウザ対応
    const textArea = document.createElement('textarea')
    textArea.value = url
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }
}

// 汎用シェア関数（ネイティブシェアAPI対応）
function handleShare(title: string, url: string) {
  if (navigator.share) {
    navigator.share({
      title,
      url
    })
  } else {
    // フォールバック：URLコピー
    copyUrlToClipboard(url, () => {})
    alert('URLをコピーしました！')
  }
}

export default function ArticleDetailSimple() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [showToc, setShowToc] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [formattedContent, setFormattedContent] = useState<string>('')
  const [youtubeComponents, setYoutubeComponents] = useState<Array<{id: string; videoId: string}>>([])
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (slug) {
      fetchArticle(slug)
    }
  }, [slug])

  useEffect(() => {
    // Instagram埋め込み用スクリプトを動的に読み込み
    const loadInstagramScript = () => {
      if (window.instgrm) {
        window.instgrm.Embeds.process()
        return
      }

      const script = document.createElement('script')
      script.async = true
      script.src = 'https://www.instagram.com/embed.js'
      script.onload = () => {
        if (window.instgrm) {
          window.instgrm.Embeds.process()
        }
      }
      document.body.appendChild(script)
    }

    if (article && article.content.includes('instagram.com')) {
      loadInstagramScript()
    }
  }, [article])

  useEffect(() => {
    // Twitter埋め込み用スクリプトを動的に読み込み
    const loadTwitterScript = () => {
      if (window.twttr) {
        window.twttr.widgets.load()
        return
      }

      const script = document.createElement('script')
      script.async = true
      script.src = 'https://platform.twitter.com/widgets.js'
      script.onload = () => {
        if (window.twttr) {
          window.twttr.widgets.load()
        }
      }
      document.body.appendChild(script)
    }

    if (article && article.content.includes('twitter-tweet')) {
      loadTwitterScript()
    }
  }, [article])

  async function fetchArticle(articleSlug: string) {
    try {
      setLoading(true)
      setError(null)

      // URLパラメータをエンコードしたまま保持
      // ブラウザが自動的にデコードしてしまうので、再度エンコードする
      const encodedSlug = encodeURIComponent(articleSlug).toLowerCase()

      const { data, error: supabaseError } = await supabase
        .from('articles')
        .select(`
          id, title, slug, content, excerpt, published_at, featured_image_url, category_id,
          article_categories(id, name, slug, description)
        `)
        .eq('slug', encodedSlug)
        .eq('status', 'published')
        .single()

      if (supabaseError) {
        setError('記事が見つかりませんでした')
      } else {
        setArticle(data)
        // カテゴリ情報をセット
        if (data.article_categories) {
          setCategory(data.article_categories)
        }
      }
    } catch (error) {
      console.error('予期しないエラー:', error)
      setError('記事の読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // 関連記事を取得するuseEffect
  useEffect(() => {
    if (article && article.id && article.category_id) {
      fetchRelatedArticles(article.id, article.category_id).then(setRelatedArticles)
    }
  }, [article])

  function formatContent(content: string): { html: string; components: Array<{id: string; videoId: string}> } {
    if (!content) return { html: '', components: [] }

    console.log('🎨 formatContent called with content length:', content.length)

    let formatted = content
    const youtubeComponents: Array<{id: string; videoId: string}> = []

    // Twitter埋め込み処理を最初に実行
    // 既存のTwitter blockquoteをReactコンポーネント用に変換
    formatted = formatted.replace(
      /<blockquote class="twitter-tweet"[^>]*>([\s\S]*?)<\/blockquote>/g,
      (match, content) => {
        console.log('🐦 Twitter embed detected and converted')
        return `<div class="my-6 mx-auto max-w-2xl">${match}</div>`
      }
    )

    // TwitterウィジェットJSを削除（Reactアプリでは別途処理）
    formatted = formatted.replace(
      /<script[^>]*src="https:\/\/platform\.twitter\.com\/widgets\.js"[^>]*><\/script>/g,
      ''
    )

    // YouTube iframe埋め込み処理
    formatted = formatted.replace(
      /<iframe[^>]*src="https:\/\/www\.youtube\.com\/embed\/([^"]*)"[^>]*><\/iframe>/g,
      (match, videoId) => {
        console.log('🎥 YouTube iframe detected and converted to rich embed:', videoId)
        const componentId = `youtube-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        youtubeComponents.push({ id: componentId, videoId })
        return `<div id="${componentId}" class="youtube-embed-placeholder"></div>`
      }
    )

    // Instagram iframe埋め込み処理（高品質リンクカードに変換）
    formatted = formatted.replace(
      /<iframe[^>]*src="([^"]*instagram\.com[^"]*)"[^>]*><\/iframe>/g,
      (match, url) => {
        console.log('📱 Instagram detected, converting to enhanced link card:', url)

        // URLから投稿IDとタイプを抽出
        let postUrl = url.replace('/embed', '').replace('/captioned', '');
        const isReel = url.includes('/reel/');
        const isPost = url.includes('/p/');
        const mediaId = url.match(/\/([A-Za-z0-9_-]+)(?:\/|$)/)?.[1] || '';
        
        // 投稿タイプの判定
        let postType = '投稿';
        let postIcon = '📷';
        let gradientColors = 'from-purple-400 via-pink-400 to-orange-400';
        
        if (isReel) {
          postType = 'Reel';
          postIcon = '🎬';
          gradientColors = 'from-purple-500 via-pink-500 to-red-500';
        } else if (isPost) {
          postType = 'フォト';
          postIcon = '📸';
          gradientColors = 'from-blue-400 via-purple-400 to-pink-400';
        }

        // 高品質Instagramリンクカードを作成
        return `<div style="max-width: 560px; margin: 2.5rem auto; position: relative; overflow: hidden;">
          <!-- グラデーション背景 -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);">
            <div style="background: #ffffff; border-radius: 14px; padding: 1.5rem; position: relative;">
              
              <!-- ヘッダー部分 -->
              <div style="display: flex; align-items: center; margin-bottom: 1.25rem;">
                <div style="width: 50px; height: 50px; background: linear-gradient(135deg, ${gradientColors}); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                  ${postIcon}
                </div>
                <div style="margin-left: 16px; flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="font-size: 20px; font-weight: 700; color: #1a202c; letter-spacing: -0.025em;">Instagram ${postType}</span>
                    <div style="width: 20px; height: 20px; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                  </div>
                  <div style="font-size: 14px; color: #718096; font-weight: 500;">ID: ${mediaId}</div>
                </div>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.025em;">
                  NEW
                </div>
              </div>
              
              <!-- コンテンツ部分 -->
              <div style="margin-bottom: 1.5rem;">
                <p style="color: #2d3748; font-size: 16px; line-height: 1.6; margin: 0;">
                  📸 最新の${postType}をInstagramでチェック！<br>
                  <span style="color: #718096; font-size: 14px;">タップしてInstagramアプリで開く</span>
                </p>
              </div>
              
              <!-- アクション部分 -->
              <a href="${postUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; justify-content: center; width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; text-decoration: none; padding: 14px 24px; border-radius: 12px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); position: relative; overflow: hidden;">
                <span style="position: relative; z-index: 2; display: flex; align-items: center; gap: 8px;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagramで開く
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 4px;">
                    <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/>
                  </svg>
                </span>
              </a>
              
              <!-- 装飾的要素 -->
              <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)); border-radius: 50%; z-index: 1;"></div>
            </div>
          </div>
        </div>`;
      }
    )

    // テキストからInstagram URLを検出してリンクカードに変換
    formatted = formatted.replace(
      /https?:\/\/(?:www\.)?instagram\.com\/(reel|p)\/([a-zA-Z0-9_-]+)\/?/g,
      (match, type, postId) => {
        console.log('📱 Instagram URL detected, converting to enhanced link card:', match)
        
        const isReel = type === 'reel';
        const postType = isReel ? 'Reel' : 'フォト';
        const postIcon = isReel ? '🎬' : '📸';
        const gradientColors = isReel ? 'from-purple-500 via-pink-500 to-red-500' : 'from-blue-400 via-purple-400 to-pink-400';

        return `<div style="max-width: 560px; margin: 2.5rem auto; position: relative; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);">
            <div style="background: #ffffff; border-radius: 14px; padding: 1.5rem; position: relative;">
              <div style="display: flex; align-items: center; margin-bottom: 1.25rem;">
                <div style="width: 50px; height: 50px; background: linear-gradient(135deg, ${gradientColors}); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                  ${postIcon}
                </div>
                <div style="margin-left: 16px; flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="font-size: 20px; font-weight: 700; color: #1a202c; letter-spacing: -0.025em;">Instagram ${postType}</span>
                    <div style="width: 20px; height: 20px; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                  </div>
                  <div style="font-size: 14px; color: #718096; font-weight: 500;">ID: ${postId}</div>
                </div>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.025em;">
                  NEW
                </div>
              </div>
              <div style="margin-bottom: 1.5rem;">
                <p style="color: #2d3748; font-size: 16px; line-height: 1.6; margin: 0;">
                  📸 最新の${postType}をInstagramでチェック！<br>
                  <span style="color: #718096; font-size: 14px;">タップしてInstagramアプリで開く</span>
                </p>
              </div>
              <a href="${match}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; justify-content: center; width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; text-decoration: none; padding: 14px 24px; border-radius: 12px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); position: relative; overflow: hidden;">
                <span style="position: relative; z-index: 2; display: flex; align-items: center; gap: 8px;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagramで開く
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 4px;">
                    <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/>
                  </svg>
                </span>
              </a>
              <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)); border-radius: 50%; z-index: 1;"></div>
            </div>
          </div>
        </div>`;
      }
    )

    // テキストから見出しを自動生成するロジックを追加
    // 1. 「｜」で区切られたタイトル部分をH1として処理
    formatted = formatted.replace(/^([^｜\n]+｜[^\n]+)/gm, '<h1 class="text-3xl font-bold text-gray-900 mb-6" style="color: #111827 !important; font-size: 1.875rem !important; font-weight: 700 !important; margin-bottom: 1.5rem !important;">$1</h1>')

    // 2. 絵文字で始まる行を見出しとして処理（💡、📍、🎤、🗣、💬、🧑‍🎤など）
    formatted = formatted.replace(/^([💡📍🎤🗣💬🧑‍🎤🎯📊⚡️✨🔥🎊🎉🎁🎈🎭🎪🎨🎬🎮🎲🎯🎱🏆🏅🥇🥈🥉🏃‍♂️🏃‍♀️🏋️‍♂️🏋️‍♀️🤸‍♂️🤸‍♀️🧘‍♂️🧘‍♀️][^\n]+)/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b-2 border-gray-200" style="color: #111827 !important; font-size: 1.5rem !important; font-weight: 700 !important; margin-top: 2rem !important; margin-bottom: 1rem !important; padding-bottom: 0.5rem !important; border-bottom: 2px solid #e5e7eb !important;">$1</h2>')

    // 3. 数字で始まる行を見出しとして処理（1. 2. 3.など）
    formatted = formatted.replace(/^(\d+\.\s*[^\n]+)/gm, '<h3 class="text-xl font-semibold text-gray-800 mt-6 mb-3" style="color: #1f2937 !important; font-size: 1.25rem !important; font-weight: 600 !important; margin-top: 1.5rem !important; margin-bottom: 0.75rem !important;">$1</h3>')

    // 4. 「この記事でわかること」のような説明文をボックス化
    formatted = formatted.replace(/(この記事でわかること[^\n]*(?:\n[^\n]+)*)/gm, '<div class="bg-blue-50 border-l-4 border-blue-400 p-4 my-6 rounded-r-lg" style="background-color: #eff6ff !important; border-left: 4px solid #60a5fa !important; padding: 1rem !important; margin: 1.5rem 0 !important; border-radius: 0 0.5rem 0.5rem 0 !important;"><div class="text-blue-800 font-semibold" style="color: #1e40af !important; font-weight: 600 !important;">$1</div></div>')

    // 5. 「セットリスト」「演出」「MC」「ファンサ」「レポート」「感想」「まとめ」「結論」「ポイント」「注意」「重要」などのキーワードを含む行を見出しに
    formatted = formatted.replace(/^([^。\n]*(?:セットリスト|演出|MC|ファンサ|レポート|感想|まとめ|結論|ポイント|注意|重要)[^。\n]*)/gm, '<h3 class="text-xl font-semibold text-gray-800 mt-6 mb-3 pl-4 border-l-4 border-teal-500" style="color: #1f2937 !important; font-size: 1.25rem !important; font-weight: 600 !important; margin-top: 1.5rem !important; margin-bottom: 0.75rem !important; padding-left: 1rem !important; border-left: 4px solid #14b8a6 !important;">$1</h3>')

    // YouTube URL埋め込み（プレーンテキストURL用）
    formatted = formatted.replace(
      /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g,
      (match, videoId) => {
        console.log('🎥 YouTube URL detected and converted to rich embed:', match, '→', videoId)
        const componentId = `youtube-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        youtubeComponents.push({ id: componentId, videoId })
        return `<div id="${componentId}" class="youtube-embed-placeholder"></div>`
      }
    )

    // WordPress用のInstagram blockquote（後方互換性のため残す）
    formatted = formatted.replace(
      /https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)\/?/g,
      (match, postId) => {
        console.log('📱 Instagram embed created for:', match, '→', postId)
        return '<div class="my-6 mx-auto max-w-lg"><blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/' + postId + '/" data-instgrm-version="14"></blockquote></div>'
      }
    )

    // WordPressの段落を適切に処理
    formatted = formatted.replace(/<p>/g, '<p class="mb-4 leading-relaxed text-gray-700">')

    // 吹き出しスタイルの処理（「」で囲まれたセリフ）
    formatted = formatted.replace(
      /「([^「」]+)」/g,
      (match, content) => {
        // 特定のセリフを吹き出しスタイルに変換
        if (content.includes('飾らなさ') || content.includes('ナチュラル')) {
          return `<div class="flex items-start gap-3 my-6">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <span class="text-2xl">👤</span>
              </div>
            </div>
            <div class="flex-grow">
              <div class="inline-block bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm border border-purple-100">
                <p class="text-gray-800 font-medium italic">「${content}」</p>
              </div>
            </div>
          </div>`;
        }
        return match;
      }
    );

    // 既存のHTMLタグがある場合の見出し処理
    let headingIdCounter = 0
    const generateHeadingId = (text: string): string => {
      headingIdCounter++
      const cleanText = text.replace(/<[^>]*>/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
      return `heading-${headingIdCounter}-${cleanText.substring(0, 30)}`
    }

    // 既存のHTMLタグにIDとスタイルを追加
    formatted = formatted.replace(/<h1([^>]*?)>(.*?)<\/h1>/g, (match, attrs, content) => {
      const id = generateHeadingId(content)
      return `<h1${attrs} id="${id}" class="text-3xl font-bold text-gray-900 mb-6" style="color: #111827 !important; font-size: 1.875rem !important; font-weight: 700 !important; margin-bottom: 1.5rem !important;">${content}</h1>`
    })

    formatted = formatted.replace(/<h2([^>]*?)>(.*?)<\/h2>/g, (match, attrs, content) => {
      const id = generateHeadingId(content)
      return `<h2${attrs} id="${id}" class="text-2xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b-2 border-gray-200" style="color: #111827 !important; font-size: 1.5rem !important; font-weight: 700 !important; margin-top: 2rem !important; margin-bottom: 1rem !important; padding-bottom: 0.5rem !important; border-bottom: 2px solid #e5e7eb !important;">${content}</h2>`
    })
    
    formatted = formatted.replace(/<h3([^>]*?)>(.*?)<\/h3>/g, (match, attrs, content) => {
      const id = generateHeadingId(content)
      return `<h3${attrs} id="${id}" class="text-xl font-semibold text-gray-800 mt-6 mb-3" style="color: #1f2937 !important; font-size: 1.25rem !important; font-weight: 600 !important; margin-top: 1.5rem !important; margin-bottom: 0.75rem !important;">${content}</h3>`
    })
    
    formatted = formatted.replace(/<h4([^>]*?)>(.*?)<\/h4>/g, (match, attrs, content) => {
      const id = generateHeadingId(content)
      return `<h4${attrs} id="${id}" class="text-lg font-medium text-gray-800 mt-5 mb-2" style="color: #1f2937 !important; font-size: 1.125rem !important; font-weight: 500 !important; margin-top: 1.25rem !important; margin-bottom: 0.5rem !important;">${content}</h4>`
    })

    // 読みやすい段落スタイル
    formatted = formatted.replace(/<p([^>]*)>/g, '<p$1 class="mb-4 leading-relaxed text-gray-700 text-base" style="margin-bottom: 1rem !important; line-height: 1.625 !important; color: #374151 !important; font-size: 1rem !important;">')

    // シンプルなリストスタイル
    formatted = formatted.replace(/<ul([^>]*)>/g, '<ul$1 class="mb-4 pl-6 space-y-2" style="margin-bottom: 1rem !important; padding-left: 1.5rem !important; list-style-type: disc !important;">')
    formatted = formatted.replace(/<ol([^>]*)>/g, '<ol$1 class="mb-4 pl-6 space-y-2 list-decimal" style="margin-bottom: 1rem !important; padding-left: 1.5rem !important; list-style-type: decimal !important;">')
    formatted = formatted.replace(/<li([^>]*)>/g, '<li$1 class="text-gray-700 text-base leading-relaxed" style="color: #374151 !important; font-size: 1rem !important; line-height: 1.625 !important; margin-bottom: 0.5rem !important;">')

    // 引用スタイル
    formatted = formatted.replace(/<blockquote([^>]*)>/g, '<blockquote$1 class="my-4 pl-4 border-l-4 border-gray-300 bg-gray-50 py-2 italic text-gray-600" style="margin: 1rem 0 !important; padding-left: 1rem !important; border-left: 4px solid #d1d5db !important; background-color: #f9fafb !important; padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; font-style: italic !important; color: #4b5563 !important;">')

    // 強調テキスト
    formatted = formatted.replace(/<strong([^>]*)>/g, '<strong$1 class="font-semibold text-gray-900" style="font-weight: 600 !important; color: #111827 !important;">')
    formatted = formatted.replace(/<em([^>]*)>/g, '<em$1 class="italic text-gray-700" style="font-style: italic !important; color: #374151 !important;">')

    // 画像スタイル
    formatted = formatted.replace(/<img([^>]*?)>/g, '<img$1 class="my-6 mx-auto max-w-full h-auto rounded-lg shadow-md" loading="lazy" style="margin: 1.5rem auto !important; max-width: 100% !important; height: auto !important; border-radius: 0.5rem !important; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;">')

    // プレーンテキストURLをリンクに変換（YouTube/Instagram以外）
    formatted = formatted.replace(
      /(?<!href="|src=")https?:\/\/(?!(?:www\.|m\.)?(?:youtube\.com|youtu\.be|instagram\.com))[^\s<>"]+/g,
      '<a href="$&" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors duration-200" style="color: #2563eb !important; text-decoration: underline !important;">$&</a>'
    )

    // 既存のリンクスタイル
    formatted = formatted.replace(/<a([^>]*?)>/g, '<a$1 class="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors duration-200" style="color: #2563eb !important; text-decoration: underline !important;">')

    // 改行を適切に処理
    if (!formatted.includes('<h') && !formatted.includes('<p>')) {
      // HTMLタグがない場合の処理
      const lines = formatted.split('\n')
      const processedLines = []
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) {
          processedLines.push('')
          continue
        }
        
        // 改行を段落に変換
        if (!line.startsWith('<')) {
          processedLines.push(`<p class="mb-4 leading-relaxed text-gray-700 text-base" style="margin-bottom: 1rem !important; line-height: 1.625 !important; color: #374151 !important; font-size: 1rem !important;">${line}</p>`)
        } else {
          processedLines.push(line)
        }
      }
      
      formatted = processedLines.join('\n')
    }

    console.log('🎨 formatContent completed successfully', {
      htmlLength: formatted.length,
      youtubeComponentsCount: youtubeComponents.length,
      youtubeComponents
    })
    return { html: formatted, components: youtubeComponents }
  }

  function generateToc(content: string): TocItem[] {
    const tocItems: TocItem[] = []
    const headingRegex = /<h([234])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[234]>/gi
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const level = parseInt(match[1])
      const id = match[2]
      const text = match[3].replace(/<[^>]*>/g, '').trim()
      
      tocItems.push({
        id,
        text,
        level
      })
    }

    return tocItems
  }

  useEffect(() => {
    if (article && article.content) {
      try {
        let contentToProcess = article.content;

        const result = formatContent(contentToProcess)
        setFormattedContent(result.html)
        setYoutubeComponents(result.components)
        const tocItems = generateToc(result.html)
        setTocItems(tocItems)
        setShowToc(tocItems.length > 2)
      } catch (error) {
        console.error('❌ コンテンツフォーマットエラー:', error)
        setFormattedContent(article.content) // フォールバック: 元のコンテンツを表示
        setYoutubeComponents([])
        setTocItems([])
        setShowToc(false)
      }
    }
  }, [article])

  // Load Twitter and Instagram embed scripts
  useEffect(() => {
    if (!contentRef.current) return

    // Twitter埋め込みスクリプトの読み込み
    const twitterEmbeds = contentRef.current.querySelectorAll('.twitter-tweet')
    if (twitterEmbeds.length > 0) {
      console.log('🐦 Loading Twitter widgets...')
      const twitterScript = document.createElement('script')
      twitterScript.src = 'https://platform.twitter.com/widgets.js'
      twitterScript.async = true
      document.body.appendChild(twitterScript)
    }

    // Instagram埋め込みスクリプトの読み込み
    const instagramEmbeds = contentRef.current.querySelectorAll('.instagram-media')
    if (instagramEmbeds.length > 0) {
      console.log('📱 Loading Instagram embeds...')
      const instagramScript = document.createElement('script')
      instagramScript.src = 'https://www.instagram.com/embed.js'
      instagramScript.async = true
      document.body.appendChild(instagramScript)

      // スクリプトが読み込まれたら処理
      instagramScript.onload = () => {
        if ((window as any).instgrm) {
          (window as any).instgrm.Embeds.process()
        }
      }
    }

    return () => {
      // クリーンアップ: スクリプトを削除
      const scripts = document.querySelectorAll('script[src*="twitter.com"], script[src*="instagram.com"]')
      scripts.forEach(script => script.remove())
    }
  }, [formattedContent])

  // Render YouTube components after HTML is set
  useEffect(() => {
    console.log('🎬 YouTube components useEffect triggered:', {
      componentsLength: youtubeComponents.length,
      hasContentRef: !!contentRef.current,
      components: youtubeComponents,
      formattedContentLength: formattedContent.length
    })

    if (youtubeComponents.length > 0 && contentRef.current) {
      youtubeComponents.forEach(({ id, videoId }) => {
        console.log('🔍 Looking for placeholder:', id, 'for video:', videoId)
        const placeholder = contentRef.current?.querySelector(`#${id}`)
        console.log('📍 Placeholder found:', !!placeholder)

        if (placeholder && !placeholder.querySelector('.youtube-embed-rendered')) {
          console.log('✅ Rendering YouTubeEmbed for:', videoId)

          // Create a container for the React component
          const container = document.createElement('div')
          container.className = 'youtube-embed-rendered'
          placeholder.appendChild(container)

          // Use React to render the component
          import('react-dom/client').then(({ createRoot }) => {
            const root = createRoot(container)
            root.render(React.createElement(YouTubeEmbed, {
              videoId,
              autoPlay: false,
              showInfo: true
            }))
            console.log('🎥 YouTubeEmbed rendered for:', videoId)
          }).catch(error => {
            console.error('❌ Error rendering YouTubeEmbed:', error)
          })
        } else {
          console.log('⚠️ Skipping render for:', id, 'placeholder exists:', !!placeholder, 'already rendered:', !!placeholder?.querySelector('.youtube-embed-rendered'))
        }
      })
    }
  }, [formattedContent, youtubeComponents])

  function scrollToHeading(id: string) {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  async function fetchRelatedArticles(currentArticleId: string, categoryId?: string): Promise<Article[]> {
    if (!categoryId) return []

    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, published_at, featured_image_url, category_id')
        .eq('status', 'published')
        .eq('category_id', categoryId)
        .neq('id', currentArticleId)
        .order('published_at', { ascending: false })
        .limit(3)

      if (error) {
        console.error('関連記事取得エラー:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('関連記事取得エラー:', error)
      return []
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">記事を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">記事が見つかりません</h2>
          <p className="text-gray-600 mb-6">{error || '指定された記事は存在しないか、削除されました。'}</p>
          <Link
            to="/articles"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            記事一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  const readingTime = calculateReadingTime(article.content)
  const randomViews = Math.floor(Math.random() * 1000) + 100

  // デバッグ: 記事表示前の状態をコンソールに出力
  console.log('🎯 Article rendering state:', {
    hasArticle: !!article,
    articleTitle: article?.title,
    contentLength: article?.content?.length,
    formattedContentLength: formattedContent?.length,
    tocItemsCount: tocItems.length,
    youtubeComponentsCount: youtubeComponents.length
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dynamic Breadcrumb */}
          <nav className="flex items-center text-sm text-white/80 mb-6">
            <Link
              to="/"
              className="flex items-center hover:text-white transition-colors group"
            >
              <Home className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-200" />
              ホーム
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-white/60" />

            <Link
              to="/articles"
              className="flex items-center hover:text-white transition-colors group"
            >
              <BookOpen className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-200" />
              記事一覧
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-white/60" />

            {category && (
              <>
                <Link
                  to={`/articles?category=${category.slug}`}
                  className="flex items-center hover:text-white transition-colors group"
                >
                  <FolderOpen className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-200" />
                  {category.name}
                </Link>
                <ChevronRight className="w-4 h-4 mx-2 text-white/60" />
              </>
            )}

            <span className="text-white font-medium truncate max-w-xs">
              {article?.title || '記事詳細'}
            </span>
          </nav>

          {/* Back Button */}
          <Link
            to="/articles"
            className="inline-flex items-center mb-6 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors group backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            記事一覧に戻る
          </Link>

          {/* Article Header */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {/* Article Meta */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(article.published_at)}</span>
              </div>

              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <Clock className="w-4 h-4" />
                <span>{readingTime}分で読了</span>
              </div>

              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <Eye className="w-4 h-4" />
                <span>{randomViews} views</span>
              </div>

              <button
                onClick={() => handleShare(article.title, window.location.href)}
                className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>シェア</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Image */}
        {article.featured_image_url && (
          <div className="mb-8">
            <div className="aspect-[16/9] sm:aspect-[2/1] lg:aspect-[5/2] w-full max-w-4xl mx-auto overflow-hidden rounded-2xl shadow-xl">
              <img
                src={article.featured_image_url}
                alt={article.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Article Content - 左側メイン */}
          <div className="xl:flex-1 xl:max-w-5xl">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* SPでの読みやすさを大幅改善 */}
              <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-12 lg:py-12">
                {/* Content Body */}

                <div
                  ref={contentRef}
                  className="wordpress-content max-w-none"
                  style={{
                    fontFamily: '"Yu Gothic", "游ゴシック", YuGothic, "游ゴシック体", "Hiragino Sans", "ヒラギノ角ゴ ProN W3", "Hiragino Kaku Gothic ProN", sans-serif',
                    lineHeight: '1.9',
                    color: '#2d3748',
                    letterSpacing: '0.02em'
                  }}
                  dangerouslySetInnerHTML={{ __html: formattedContent }}
                />
              </div>
            </div>
          </div>

          {/* Table of Contents - 右側サイドバー */}
          {showToc && tocItems.length > 0 && (
            <div className="xl:w-80 xl:flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sticky top-8">
                <div className="flex items-center mb-4">
                  <ListOrdered className="w-5 h-5 text-teal-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">目次</h3>
                </div>
                <nav className="space-y-2">
                  {tocItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToHeading(item.id)}
                      className={`
                        flex items-start w-full text-left p-2 rounded-lg transition-all hover:bg-gray-50 group
                        ${item.level === 2 ? 'text-gray-900 font-medium' :
                          item.level === 3 ? 'text-gray-700 ml-4' :
                          'text-gray-600 ml-8 text-sm'}
                      `}
                    >
                      <ChevronRight className="w-4 h-4 text-teal-500 mr-2 mt-0.5 group-hover:text-teal-600 transition-colors flex-shrink-0" />
                      <span className="leading-relaxed">{item.text}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}
        </div>

        {/* WordPress-like Custom Styles */}
        <style jsx>{`
          .wordpress-content {
            font-size: 18px;
            line-height: 1.8;
          }

          .wordpress-content .wp-h2 {
            font-family: inherit;
            font-weight: bold;
            text-align: center;
            position: relative;
            margin: 2rem 0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }

          .wordpress-content .wp-block-image {
            margin: 2rem 0;
            text-align: center;
          }

          .wordpress-content .wp-block-image img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }

          .wordpress-content .youtube-embed-placeholder {
            margin: 2rem 0;
          }

          @media (max-width: 640px) {
            .wordpress-content {
              font-size: 16px;
              line-height: 1.7;
            }
          }
        `}</style>

        {/* Article Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                推
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900 text-lg">推し活ガイド編集部</h3>
                <p className="text-gray-600 text-sm">推し活をもっと楽しく、もっとお得に</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/articles"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                他の記事も読む
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>

              {/* SNSシェアボタン */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-gray-900 font-semibold mb-4 text-center">この記事をシェア</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Twitter */}
                  <button
                    onClick={() => shareToTwitter(article.title, window.location.href)}
                    className="flex flex-col items-center p-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors duration-200 group"
                  >
                    <Twitter className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Twitter</span>
                  </button>

                  {/* Facebook */}
                  <button
                    onClick={() => shareToFacebook(window.location.href)}
                    className="flex flex-col items-center p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 group"
                  >
                    <Facebook className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Facebook</span>
                  </button>

                  {/* LINE */}
                  <button
                    onClick={() => shareToLine(article.title, window.location.href)}
                    className="flex flex-col items-center p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 group"
                  >
                    <MessageCircle className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">LINE</span>
                  </button>

                  {/* URLコピー */}
                  <button
                    onClick={() => copyUrlToClipboard(window.location.href, setCopiedUrl)}
                    className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 group ${
                      copiedUrl
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                    }`}
                  >
                    {copiedUrl ? (
                      <CheckCircle className="w-6 h-6 mb-1" />
                    ) : (
                      <Copy className="w-6 h-6 mb-1" />
                    )}
                    <span className="text-xs font-medium">
                      {copiedUrl ? 'コピー済' : 'URLコピー'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center mb-6">
                <BookOpen className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">関連記事</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((relatedArticle) => (
                  <Link
                    key={relatedArticle.id}
                    to={`/articles/${relatedArticle.slug}`}
                    className="group block bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors"
                  >
                    {relatedArticle.featured_image_url && (
                      <div className="aspect-[16/9] mb-4 overflow-hidden rounded-lg">
                        <img
                          src={relatedArticle.featured_image_url}
                          alt={relatedArticle.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                      {relatedArticle.title}
                    </h4>
                    {relatedArticle.excerpt && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                        {relatedArticle.excerpt}
                      </p>
                    )}
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(relatedArticle.published_at)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
