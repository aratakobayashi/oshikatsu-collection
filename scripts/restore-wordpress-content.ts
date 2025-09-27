import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const supabase = createClient(supabaseUrl, supabaseKey);

interface WordPressPost {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  featured_media: number;
  categories: number[];
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
}

async function fetchWordPressContent(slug: string): Promise<string | null> {
  try {
    console.log(`🔍 WordPressから取得中: ${slug}`);

    const response = await fetch(`https://oshikatsu-guide.com/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=true`);

    if (!response.ok) {
      console.log(`❌ WordPress API エラー: ${response.status}`);
      return null;
    }

    const posts = await response.json();

    if (!posts || posts.length === 0) {
      console.log(`❌ 記事が見つかりません: ${slug}`);
      return null;
    }

    const post = posts[0] as WordPressPost;
    console.log(`✅ WordPress記事を取得: ${post.title.rendered}`);

    return post.content.rendered;
  } catch (error) {
    console.error(`❌ エラー (${slug}):`, error);
    return null;
  }
}

function analyzeContent(content: string, title: string): void {
  console.log(`📊 コンテンツ分析: ${title}`);
  console.log(`   長さ: ${content.length} 文字`);

  // YouTube検索
  const youtubeIframes = content.match(/<iframe[^>]*src="[^"]*youtube\.com\/embed\/[^"]*"[^>]*><\/iframe>/gi);
  const youtubeUrls = content.match(/https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi);

  console.log(`   🎥 YouTube iframes: ${youtubeIframes?.length || 0}`);
  console.log(`   🎥 YouTube URLs: ${youtubeUrls?.length || 0}`);

  // Instagram検索
  const instagramIframes = content.match(/<iframe[^>]*src="[^"]*instagram\.com[^"]*"[^>]*><\/iframe>/gi);
  const instagramUrls = content.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/[a-zA-Z0-9_-]+/gi);

  console.log(`   📱 Instagram iframes: ${instagramIframes?.length || 0}`);
  console.log(`   📱 Instagram URLs: ${instagramUrls?.length || 0}`);

  // Twitter検索
  const twitterEmbeds = content.match(/<blockquote[^>]*class="[^"]*twitter-tweet[^"]*"[^>]*>/gi);

  console.log(`   🐦 Twitter embeds: ${twitterEmbeds?.length || 0}`);

  if (youtubeIframes || youtubeUrls || instagramIframes || instagramUrls || twitterEmbeds) {
    console.log(`   🔥 埋め込みコンテンツ発見！`);
  }
}

function cleanSlug(slug: string): string {
  // URLエンコードされたスラッグをデコード
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

async function restoreWordPressContent() {
  console.log('🚀 WordPress コンテンツ復元開始');
  console.log('=' .repeat(60));

  // データベースから全記事を取得
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, slug, content')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('❌ データベースエラー:', error);
    return;
  }

  if (!articles || articles.length === 0) {
    console.log('ℹ️ 記事が見つかりません');
    return;
  }

  console.log(`📊 対象記事数: ${articles.length}件`);
  console.log('');

  let restoredCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const article of articles) {
    console.log(`\n📄 処理中: ${article.title}`);
    console.log(`   スラッグ: ${article.slug}`);

    // 現在のコンテンツを分析
    console.log(`\n📊 現在のコンテンツ分析:`);
    analyzeContent(article.content, article.title);

    // WordPressから元コンテンツを取得
    const cleanedSlug = cleanSlug(article.slug);
    const wordpressContent = await fetchWordPressContent(cleanedSlug);

    if (!wordpressContent) {
      console.log(`❌ WordPress コンテンツ取得失敗`);
      errorCount++;
      continue;
    }

    // WordPressコンテンツを分析
    console.log(`\n📊 WordPressコンテンツ分析:`);
    analyzeContent(wordpressContent, article.title);

    // 埋め込みコンテンツがある場合のみ更新
    const hasEmbeds = /(?:youtube\.com|instagram\.com|twitter-tweet)/.test(wordpressContent);

    if (!hasEmbeds) {
      console.log(`ℹ️ 埋め込みコンテンツなし - スキップ`);
      skipCount++;
      continue;
    }

    // データベースを更新（実際には権限の問題で失敗する可能性があるが、ログで確認）
    console.log(`🔄 データベース更新試行中...`);

    try {
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          content: wordpressContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', article.id);

      if (updateError) {
        console.log(`❌ 更新エラー: ${updateError.message}`);
        if (updateError.message.includes('row-level security')) {
          console.log(`🔐 RLS権限エラー - 手動での対応が必要です`);
        }
        errorCount++;
      } else {
        console.log(`✅ 更新成功！`);
        restoredCount++;
      }
    } catch (err) {
      console.error(`❌ 予期しないエラー:`, err);
      errorCount++;
    }

    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📈 復元結果サマリー');
  console.log('='.repeat(60));
  console.log(`📊 総記事数: ${articles.length}`);
  console.log(`✅ 復元成功: ${restoredCount}`);
  console.log(`ℹ️ スキップ: ${skipCount}`);
  console.log(`❌ エラー: ${errorCount}`);
  console.log('');

  if (errorCount > 0) {
    console.log('💡 推奨アクション:');
    console.log('1. Supabase RLS権限設定を確認');
    console.log('2. 手動でのコンテンツ更新を検討');
    console.log('3. 管理者権限でのスクリプト実行を検討');
  }

  console.log('🏁 WordPress コンテンツ復元完了');
}

// メイン実行
restoreWordPressContent().catch(console.error);

export { restoreWordPressContent };