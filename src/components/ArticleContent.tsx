import React, { useEffect, useRef, useState } from 'react';
import YouTubeEmbed from './YouTubeEmbed';
import { ChevronRight } from 'lucide-react';

interface ArticleContentProps {
  content: string;
  onTocGenerated?: (tocItems: TocItem[]) => void;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function ArticleContent({ content, onTocGenerated }: ArticleContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [processedContent, setProcessedContent] = useState<string>('');

  useEffect(() => {
    if (content) {
      const { html, tocItems } = processContent(content);
      setProcessedContent(html);
      if (onTocGenerated) {
        onTocGenerated(tocItems);
      }
    }
  }, [content, onTocGenerated]);

  function processContent(rawContent: string): { html: string; tocItems: TocItem[] } {
    let html = rawContent;
    const tocItems: TocItem[] = [];
    let headingIdCounter = 0;

    // マークダウン記法の処理を最初に実行
    // 太字の変換 (**text** → <strong>text</strong>)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // イタリック体の変換 (*text* → <em>text</em>)
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

    // コードブロック (```code``` → <pre><code>code</code></pre>)
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // インラインコード (`code` → <code>code</code>)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // マークダウン見出しの変換（# → h1, ## → h2, ### → h3, #### → h4）
    // h5の変換 (##### text)
    html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');

    // h4の変換 (#### text)
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');

    // h3の変換 (### text)
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

    // h2の変換 (## text)
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');

    // h1の変換 (# text)
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // YouTube URL を魅力的なサムネイル付きカードに直接変換
    // embed URLとwatch URLの両方に対応し、パラメータも考慮
    html = html.replace(
      /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s<>"']*)?/g,
      (match, videoId) => {
        return `<div class="youtube-embed my-8 mx-auto max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-300 group">
          <div class="relative">
            <img
              src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg"
              alt="YouTube動画サムネイル"
              class="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onerror="this.src='https://img.youtube.com/vi/${videoId}/mqdefault.jpg'; this.onerror=function(){this.src='https://img.youtube.com/vi/${videoId}/default.jpg';}"
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
                href="https://www.youtube.com/watch?v=${videoId}"
                target="_blank"
                rel="noopener noreferrer"
                class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              >
                視聴する
              </a>
            </div>
          </div>
        </div>`;
      }
    );

    // リンクの変換 ([text](url) → <a href="url">text</a>)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // 改行の変換（2つの改行 → <p>タグ）
    html = html.replace(/\n\n/g, '</p><p>');
    // 最初と最後のpタグを追加
    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }

    // YouTubeEmbedコンポーネントタグを検出して置換
    html = html.replace(
      /<youtube-embed\s+video-id="([^"]+)"(?:\s+title="([^"]+)")?\s*><\/youtube-embed>/g,
      (match, videoId, title) => {
        return `<div class="youtube-embed-container" data-video-id="${videoId}" data-title="${title || ''}"></div>`;
      }
    );

    // 見出しにIDを追加してTOC用のアンカーを作成
    const generateHeadingId = (text: string): string => {
      headingIdCounter++;
      const cleanText = text.replace(/<[^>]*>/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
      return `heading-${headingIdCounter}-${cleanText.substring(0, 30)}`;
    };

    // h1タグのスタイリング
    html = html.replace(/<h1([^>]*?)>(.*?)<\/h1>/g, (match, attrs, content) => {
      const id = generateHeadingId(content);
      tocItems.push({ id, text: content.replace(/<[^>]*>/g, ''), level: 1 });
      return `<h1${attrs} id="${id}" class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 pb-4 border-b-4 border-purple-500">${content}</h1>`;
    });

    // h2タグのスタイリング - より見やすく
    html = html.replace(/<h2([^>]*?)>(.*?)<\/h2>/g, (match, attrs, content) => {
      const id = generateHeadingId(content);
      tocItems.push({ id, text: content.replace(/<[^>]*>/g, ''), level: 2 });
      return `<h2${attrs} id="${id}" class="text-3xl md:text-4xl font-bold text-gray-800 mt-12 mb-6 pb-3 border-b-2 border-purple-300">${content}</h2>`;
    });

    // h3タグのスタイリング
    html = html.replace(/<h3([^>]*?)>(.*?)<\/h3>/g, (match, attrs, content) => {
      const id = generateHeadingId(content);
      tocItems.push({ id, text: content.replace(/<[^>]*>/g, ''), level: 3 });
      return `<h3${attrs} id="${id}" class="text-2xl md:text-3xl font-semibold text-gray-800 mt-8 mb-4 pl-4 border-l-4 border-purple-400">${content}</h3>`;
    });

    // h4タグのスタイリング
    html = html.replace(/<h4([^>]*?)>(.*?)<\/h4>/g, (match, attrs, content) => {
      const id = generateHeadingId(content);
      tocItems.push({ id, text: content.replace(/<[^>]*>/g, ''), level: 4 });
      return `<h4${attrs} id="${id}" class="text-xl md:text-2xl font-semibold text-gray-700 mt-6 mb-3">${content}</h4>`;
    });

    // h5タグのスタイリング
    html = html.replace(/<h5([^>]*?)>(.*?)<\/h5>/g, (match, attrs, content) => {
      const id = generateHeadingId(content);
      tocItems.push({ id, text: content.replace(/<[^>]*>/g, ''), level: 5 });
      return `<h5${attrs} id="${id}" class="text-lg md:text-xl font-medium text-gray-600 mt-4 mb-2">${content}</h5>`;
    });

    // 段落のスタイリング - 読みやすさを重視
    html = html.replace(/<p([^>]*)>/g, '<p$1 class="text-lg leading-relaxed text-gray-700 mb-6">');

    // 特別なスタイルクラスの処理
    // ハイライトボックス
    html = html.replace(/<div class="highlight-box"([^>]*)>(.*?)<\/div>/gs,
      '<div class="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-6 my-8 rounded-r-lg shadow-sm">$2</div>');

    // ポイントボックス
    html = html.replace(/<div class="point-box"([^>]*)>(.*?)<\/div>/gs,
      '<div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-6 my-8 rounded-lg shadow-sm"><div class="flex items-start"><span class="text-2xl mr-3">💡</span><div>$2</div></div></div>');

    // 注意ボックス
    html = html.replace(/<div class="note-box"([^>]*)>(.*?)<\/div>/gs,
      '<div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-6 my-8 rounded-lg shadow-sm"><div class="flex items-start"><span class="text-2xl mr-3">📝</span><div>$2</div></div></div>');

    // 警告ボックス
    html = html.replace(/<div class="warning-box"([^>]*)>(.*?)<\/div>/gs,
      '<div class="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 p-6 my-8 rounded-lg shadow-sm"><div class="flex items-start"><span class="text-2xl mr-3">⚠️</span><div>$2</div></div></div>');

    // 成功/Tipボックス
    html = html.replace(/<div class="tip-box"([^>]*)>(.*?)<\/div>/gs,
      '<div class="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-6 my-8 rounded-lg shadow-sm"><div class="flex items-start"><span class="text-2xl mr-3">✨</span><div>$2</div></div></div>');

    // インライン強調 (キーワード強調)
    html = html.replace(/<span class="keyword"([^>]*)>(.*?)<\/span>/g,
      '<span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold">$2</span>');

    // インライン重要
    html = html.replace(/<span class="important"([^>]*)>(.*?)<\/span>/g,
      '<span class="bg-red-100 text-red-800 px-2 py-1 rounded font-bold">$2</span>');

    // リストのスタイリング - より美しく
    html = html.replace(/<ul([^>]*)>/g, '<ul$1 class="space-y-3 mb-8">');
    html = html.replace(/<ol([^>]*)>/g, '<ol$1 class="space-y-3 mb-8">');
    html = html.replace(/<li([^>]*)>/g, '<li$1 class="flex items-start text-lg text-gray-700 leading-relaxed"><span class="text-purple-500 mr-3 mt-1">•</span><div>');

    // リストアイテムの終了タグを修正
    html = html.replace(/<\/li>/g, '</div></li>');

    // 強調テキストのスタイリング
    html = html.replace(/<strong([^>]*)>/g, '<strong$1 class="font-bold text-gray-900 bg-yellow-50 px-1 rounded">');
    html = html.replace(/<em([^>]*)>/g, '<em$1 class="italic text-purple-700 font-medium">');

    // リンクのスタイリング
    html = html.replace(/<a([^>]*?)>/g, '<a$1 class="text-purple-600 hover:text-purple-800 underline decoration-2 underline-offset-2 transition-colors duration-200 font-medium">');

    // 引用のスタイリング - より目立つように
    html = html.replace(/<blockquote([^>]*)>/g, '<blockquote$1 class="border-l-4 border-purple-400 pl-6 py-4 my-8 italic text-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 rounded-r-lg shadow-sm relative"><span class="absolute top-2 left-2 text-purple-300 text-4xl leading-none">"</span><div class="relative z-10 ml-6">');
    html = html.replace(/<\/blockquote>/g, '</div></blockquote>');

    // テーブルのスタイリング - より美しく
    html = html.replace(/<table([^>]*)>/g, '<table$1 class="w-full mb-8 border-collapse bg-white rounded-lg overflow-hidden shadow-lg">');
    html = html.replace(/<thead([^>]*)>/g, '<thead$1 class="bg-gradient-to-r from-purple-600 to-blue-600 text-white">');
    html = html.replace(/<th([^>]*)>/g, '<th$1 class="px-6 py-4 text-left font-bold text-sm uppercase tracking-wider">');
    html = html.replace(/<tbody([^>]*)>/g, '<tbody$1 class="divide-y divide-gray-200">');
    html = html.replace(/<tr([^>]*)>/g, '<tr$1 class="hover:bg-gray-50 transition-colors">');
    html = html.replace(/<td([^>]*)>/g, '<td$1 class="px-6 py-4 text-gray-700">');

    // 画像のスタイリング
    html = html.replace(/<img([^>]*?)>/g, '<img$1 class="max-w-full h-auto rounded-xl shadow-xl my-8 mx-auto border border-gray-200">');

    return { html, tocItems };
  }

  // YouTube埋め込みコンポーネントをマウント
  useEffect(() => {
    if (!contentRef.current) return;

    const embedContainers = contentRef.current.querySelectorAll('.youtube-embed-container');
    embedContainers.forEach((container) => {
      const videoId = container.getAttribute('data-video-id');
      const title = container.getAttribute('data-title');

      if (videoId && !container.querySelector('.youtube-embed-mounted')) {
        // React Portalを使用せず、直接コンポーネントをレンダリング
        const wrapper = document.createElement('div');
        wrapper.className = 'youtube-embed-mounted my-8';
        container.appendChild(wrapper);

        // YouTubeEmbedコンポーネントを動的に挿入
        import('react-dom/client').then(({ createRoot }) => {
          const root = createRoot(wrapper);
          root.render(<YouTubeEmbed videoId={videoId} />);
        });
      }
    });
  }, [processedContent]);

  return (
    <article className="prose prose-lg max-w-none">
      <div
        ref={contentRef}
        className="article-content"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    </article>
  );
}