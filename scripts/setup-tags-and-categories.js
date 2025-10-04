import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Load production environment variables
dotenv.config({ path: join(projectRoot, '.env.production') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// カテゴリ候補
const categories = [
  { name: '推し活入門', slug: 'oshikatsu-basics', description: '推し活を始める人向けの基礎知識' },
  { name: 'イベント参加', slug: 'event-guide', description: 'ライブやイベントの参加ガイド' },
  { name: 'グッズ・アイテム', slug: 'goods-items', description: '推し活グッズや関連アイテム情報' },
  { name: 'SNS活用', slug: 'sns-tips', description: 'SNSでの推し活テクニック' },
  { name: '応援マナー', slug: 'support-manner', description: 'ファンとしてのマナーや心得' },
  { name: 'タレント情報', slug: 'talent-info', description: 'タレント・アイドルの詳細情報' },
  { name: 'ライブレポート', slug: 'live-report', description: 'ライブやコンサートのレポート' }
];

// タグ候補
const tags = [
  // ジャンル系
  { name: 'timelesz', slug: 'timelesz' },
  { name: 'ジャニーズ', slug: 'johnnys' },
  { name: 'K-POP', slug: 'kpop' },
  { name: 'アイドル', slug: 'idol' },
  { name: '声優', slug: 'seiyuu' },

  // 活動系
  { name: '初心者向け', slug: 'beginner' },
  { name: 'ライブ', slug: 'live' },
  { name: 'コンサート', slug: 'concert' },
  { name: 'イベント', slug: 'event' },
  { name: 'オンライン', slug: 'online' },
  { name: 'オフライン', slug: 'offline' },

  // グッズ系
  { name: 'うちわ', slug: 'uchiwa' },
  { name: 'ペンライト', slug: 'penlight' },
  { name: 'アクスタ', slug: 'acrylic-stand' },
  { name: 'トレカ', slug: 'trading-card' },

  // SNS系
  { name: 'Twitter', slug: 'twitter' },
  { name: 'Instagram', slug: 'instagram' },
  { name: 'TikTok', slug: 'tiktok' },
  { name: 'YouTube', slug: 'youtube' },

  // その他
  { name: 'マナー', slug: 'manner' },
  { name: '聖地巡礼', slug: 'pilgrimage' },
  { name: 'ファンレター', slug: 'fan-letter' },
  { name: 'プレゼント', slug: 'present' },
  { name: '応援広告', slug: 'support-ad' },
  { name: 'カフェ', slug: 'cafe' },
  { name: 'コラボ', slug: 'collaboration' }
];

async function setupTagsAndCategories() {
  console.log('📝 タグとカテゴリを設定中...\n');

  try {
    // 1. カテゴリをcategoriesテーブルに追加（存在しない場合は作成）
    console.log('=== カテゴリの設定 ===');

    // categoriesテーブルが存在するか確認
    const { data: existingCategories, error: catCheckError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    if (catCheckError && catCheckError.code === '42P01') {
      console.log('categoriesテーブルが存在しません。作成が必要です。');
      // ここでテーブル作成のSQLを出力
      console.log('\n以下のSQLを実行してください:');
      console.log(`
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `);
    } else {
      // カテゴリを追加
      for (const category of categories) {
        const { data, error } = await supabase
          .from('categories')
          .upsert([category], { onConflict: 'slug' });

        if (error) {
          console.log(`❌ ${category.name}: エラー - ${error.message}`);
        } else {
          console.log(`✅ ${category.name}: 追加/更新完了`);
        }
      }
    }

    // 2. タグをtagsテーブルに追加
    console.log('\n=== タグの設定 ===');

    for (const tag of tags) {
      const { data, error } = await supabase
        .from('tags')
        .upsert([tag], { onConflict: 'slug' });

      if (error) {
        console.log(`❌ ${tag.name}: エラー - ${error.message}`);
      } else {
        console.log(`✅ ${tag.name}: 追加/更新完了`);
      }
    }

    // 3. 記事にカテゴリとタグを割り当てる
    console.log('\n=== 記事へのカテゴリ・タグ割り当て ===');

    // 記事を取得
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, content');

    // カテゴリIDを取得
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, name, slug');

    const categoryMap = {};
    if (categoriesData) {
      categoriesData.forEach(cat => {
        categoryMap[cat.slug] = cat.id;
      });
    }

    // タグIDを取得
    const { data: tagsData } = await supabase
      .from('tags')
      .select('id, name, slug');

    const tagMap = {};
    if (tagsData) {
      tagsData.forEach(tag => {
        tagMap[tag.slug] = tag.id;
      });
    }

    if (articles) {
      for (const article of articles) {
        // タイトルと内容から適切なカテゴリとタグを推定
        const titleLower = article.title.toLowerCase();
        const contentLower = (article.content || '').toLowerCase();
        const combined = titleLower + ' ' + contentLower;

        // カテゴリを決定
        let categoryId = null;
        if (combined.includes('初心者') || combined.includes('始め')) {
          categoryId = categoryMap['oshikatsu-basics'];
        } else if (combined.includes('ライブ') || combined.includes('コンサート') || combined.includes('公演')) {
          categoryId = categoryMap['live-report'];
        } else if (combined.includes('イベント') || combined.includes('参加')) {
          categoryId = categoryMap['event-guide'];
        } else if (combined.includes('sns') || combined.includes('twitter') || combined.includes('instagram')) {
          categoryId = categoryMap['sns-tips'];
        } else if (combined.includes('マナー') || combined.includes('応援')) {
          categoryId = categoryMap['support-manner'];
        } else if (combined.includes('timelesz') || titleLower.includes('篠塚') || titleLower.includes('橋本') || titleLower.includes('猪俣')) {
          categoryId = categoryMap['talent-info'];
        } else if (combined.includes('グッズ') || combined.includes('アイテム')) {
          categoryId = categoryMap['goods-items'];
        }

        if (categoryId) {
          await supabase
            .from('articles')
            .update({ category_id: categoryId })
            .eq('id', article.id);
          console.log(`📁 ${article.title.substring(0, 30)}... → カテゴリ設定`);
        }

        // タグを決定
        const articleTags = [];

        // タグの自動割り当てロジック
        if (combined.includes('timelesz')) articleTags.push(tagMap['timelesz']);
        if (combined.includes('初心者')) articleTags.push(tagMap['beginner']);
        if (combined.includes('ライブ') || combined.includes('コンサート')) articleTags.push(tagMap['live']);
        if (combined.includes('sns')) articleTags.push(tagMap['twitter']);
        if (combined.includes('instagram')) articleTags.push(tagMap['instagram']);
        if (combined.includes('マナー')) articleTags.push(tagMap['manner']);
        if (combined.includes('イベント')) articleTags.push(tagMap['event']);
        if (combined.includes('カフェ')) articleTags.push(tagMap['cafe']);

        // タグを関連付け
        for (const tagId of articleTags.filter(Boolean)) {
          await supabase
            .from('article_tags')
            .upsert([{ article_id: article.id, tag_id: tagId }], {
              onConflict: 'article_id,tag_id'
            });
        }

        if (articleTags.filter(Boolean).length > 0) {
          console.log(`🏷️  ${article.title.substring(0, 30)}... → ${articleTags.filter(Boolean).length}個のタグ設定`);
        }
      }
    }

    // 4. 最終確認
    console.log('\n=== 設定完了状況 ===');

    const { count: categoryCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    const { count: tagCount } = await supabase
      .from('tags')
      .select('*', { count: 'exact', head: true });

    const { count: articleTagCount } = await supabase
      .from('article_tags')
      .select('*', { count: 'exact', head: true });

    const { count: articlesWithCategory } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .not('category_id', 'is', null);

    console.log(`✅ カテゴリ: ${categoryCount}個`);
    console.log(`✅ タグ: ${tagCount}個`);
    console.log(`✅ 記事×タグの紐付け: ${articleTagCount}個`);
    console.log(`✅ カテゴリ設定済み記事: ${articlesWithCategory}個`);

  } catch (error) {
    console.error('エラー:', error);
  }

  process.exit(0);
}

setupTagsAndCategories().catch(error => {
  console.error('エラー:', error);
  process.exit(1);
});