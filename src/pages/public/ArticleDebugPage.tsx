import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function ArticleDebugPage() {
  const { slug } = useParams<{ slug: string }>();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      debugArticleAccess(slug);
    }
  }, [slug]);

  async function debugArticleAccess(articleSlug: string) {
    const debug: any = {
      originalSlug: articleSlug,
      urlDecoded: decodeURIComponent(articleSlug),
      urlEncoded: encodeURIComponent(articleSlug),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      userAgent: navigator.userAgent
    };

    try {
      // 1. オリジナルスラッグでの検索
      const { data: original, error: originalError } = await supabase
        .from('articles')
        .select('id, title, slug, status')
        .eq('slug', articleSlug)
        .single();

      debug.originalQuery = {
        data: original,
        error: originalError?.message
      };

      // 2. デコードされたスラッグでの検索
      const { data: decoded, error: decodedError } = await supabase
        .from('articles')
        .select('id, title, slug, status')
        .eq('slug', decodeURIComponent(articleSlug))
        .single();

      debug.decodedQuery = {
        data: decoded,
        error: decodedError?.message
      };

      // 3. 部分一致検索
      const { data: partial, error: partialError } = await supabase
        .from('articles')
        .select('id, title, slug, status')
        .ilike('slug', `%${articleSlug}%`)
        .limit(5);

      debug.partialQuery = {
        data: partial,
        error: partialError?.message
      };

      // 4. 全記事のスラッグ一覧（最初の10件）
      const { data: allSlugs, error: allSlugsError } = await supabase
        .from('articles')
        .select('slug, title')
        .limit(10);

      debug.allSlugs = {
        data: allSlugs,
        error: allSlugsError?.message
      };

    } catch (error) {
      debug.error = error;
    }

    setDebugInfo(debug);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">記事デバッグページ</h1>
          <p>デバッグ情報を取得中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">記事デバッグページ</h1>

        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">基本情報</h2>
          <div className="space-y-2 font-mono text-sm">
            <p><strong>URL Slug:</strong> {debugInfo.originalSlug}</p>
            <p><strong>URL Decoded:</strong> {debugInfo.urlDecoded}</p>
            <p><strong>URL Encoded:</strong> {debugInfo.urlEncoded}</p>
            <p><strong>Environment:</strong> {debugInfo.environment}</p>
            <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">オリジナルスラッグでの検索結果</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.originalQuery, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">デコードスラッグでの検索結果</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.decodedQuery, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">部分一致検索結果</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.partialQuery, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">全記事スラッグ一覧（最初の10件）</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.allSlugs, null, 2)}
          </pre>
        </div>

        {debugInfo.error && (
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-red-800">エラー情報</h2>
            <pre className="bg-red-100 p-4 rounded text-sm overflow-auto text-red-800">
              {JSON.stringify(debugInfo.error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}