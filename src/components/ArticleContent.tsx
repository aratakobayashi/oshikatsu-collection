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

    // 段落のスタイリング - 読みやすさを重視
    html = html.replace(/<p([^>]*)>/g, '<p$1 class="text-lg leading-relaxed text-gray-700 mb-6">');

    // リストのスタイリング
    html = html.replace(/<ul([^>]*)>/g, '<ul$1 class="list-disc list-inside mb-6 ml-4 space-y-2">');
    html = html.replace(/<ol([^>]*)>/g, '<ol$1 class="list-decimal list-inside mb-6 ml-4 space-y-2">');
    html = html.replace(/<li([^>]*)>/g, '<li$1 class="text-lg text-gray-700 leading-relaxed">');

    // 強調テキストのスタイリング
    html = html.replace(/<strong([^>]*)>/g, '<strong$1 class="font-bold text-gray-900">');
    html = html.replace(/<em([^>]*)>/g, '<em$1 class="italic text-gray-800">');

    // リンクのスタイリング
    html = html.replace(/<a([^>]*?)>/g, '<a$1 class="text-purple-600 hover:text-purple-800 underline transition-colors duration-200">');

    // 引用のスタイリング
    html = html.replace(/<blockquote([^>]*)>/g, '<blockquote$1 class="border-l-4 border-purple-400 pl-4 py-2 my-6 italic text-gray-700 bg-purple-50 rounded-r-lg">');

    // テーブルのスタイリング
    html = html.replace(/<table([^>]*)>/g, '<table$1 class="w-full mb-6 border-collapse">');
    html = html.replace(/<th([^>]*)>/g, '<th$1 class="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">');
    html = html.replace(/<td([^>]*)>/g, '<td$1 class="border border-gray-300 px-4 py-2">');

    // 画像のスタイリング
    html = html.replace(/<img([^>]*?)>/g, '<img$1 class="max-w-full h-auto rounded-lg shadow-lg my-6 mx-auto">');

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

      <style jsx>{`
        .article-content {
          font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', sans-serif;
          line-height: 1.8;
          color: #374151;
        }

        .article-content > *:first-child {
          margin-top: 0;
        }

        .article-content > *:last-child {
          margin-bottom: 0;
        }

        .article-content pre {
          background-color: #1f2937;
          color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }

        .article-content code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }

        .article-content pre code {
          background-color: transparent;
          padding: 0;
        }

        .article-content hr {
          border-top: 2px solid #e5e7eb;
          margin: 2rem 0;
        }

        @media (min-width: 768px) {
          .article-content {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </article>
  );
}