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

// 新しいタグ候補（既存の'初心者'タグに追加）
const newTags = [
  // ジャンル系
  { name: 'timelesz', slug: 'timelesz', color: 'bg-purple-50 text-purple-700' },
  { name: 'ジャニーズ', slug: 'johnnys', color: 'bg-pink-50 text-pink-700' },
  { name: 'K-POP', slug: 'kpop', color: 'bg-green-50 text-green-700' },
  { name: 'アイドル', slug: 'idol', color: 'bg-yellow-50 text-yellow-700' },
  { name: '声優', slug: 'seiyuu', color: 'bg-indigo-50 text-indigo-700' },

  // 活動系
  { name: 'ライブ', slug: 'live', color: 'bg-red-50 text-red-700' },
  { name: 'コンサート', slug: 'concert', color: 'bg-red-50 text-red-700' },
  { name: 'イベント', slug: 'event', color: 'bg-orange-50 text-orange-700' },
  { name: 'オンライン', slug: 'online', color: 'bg-cyan-50 text-cyan-700' },

  // グッズ系
  { name: 'うちわ', slug: 'uchiwa', color: 'bg-lime-50 text-lime-700' },
  { name: 'ペンライト', slug: 'penlight', color: 'bg-amber-50 text-amber-700' },
  { name: 'アクスタ', slug: 'acrylic-stand', color: 'bg-teal-50 text-teal-700' },
  { name: 'グッズ', slug: 'goods', color: 'bg-emerald-50 text-emerald-700' },

  // SNS系
  { name: 'SNS', slug: 'sns', color: 'bg-sky-50 text-sky-700' },
  { name: 'Twitter', slug: 'twitter', color: 'bg-blue-50 text-blue-700' },
  { name: 'Instagram', slug: 'instagram', color: 'bg-pink-50 text-pink-700' },

  // その他
  { name: 'マナー', slug: 'manner', color: 'bg-slate-50 text-slate-700' },
  { name: '応援', slug: 'support', color: 'bg-rose-50 text-rose-700' },
  { name: '聖地巡礼', slug: 'pilgrimage', color: 'bg-violet-50 text-violet-700' },
  { name: 'カフェ', slug: 'cafe', color: 'bg-amber-50 text-amber-700' },
  { name: '交通', slug: 'transportation', color: 'bg-gray-50 text-gray-700' },
  { name: '遠征', slug: 'tour', color: 'bg-indigo-50 text-indigo-700' }
];

async function setupTagsProperly() {
  console.log('🏷️ タグシステムを正しく設定中...\n');

  try {
    // 1. categoriesテーブルを作成
    console.log('=== 1. categoriesテーブルの作成 ===');
    console.log('以下のSQLを手動で実行してください:');
    console.log(`
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(100) DEFAULT 'bg-gray-50 text-gray-700',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 基本カテゴリの挿入
INSERT INTO categories (name, slug, description, color) VALUES
('推し活入門', 'oshikatsu-basics', '推し活を始める人向けの基礎知識', 'bg-blue-50 text-blue-700'),
('イベント参加', 'event-guide', 'ライブやイベントの参加ガイド', 'bg-red-50 text-red-700'),
('グッズ・アイテム', 'goods-items', '推し活グッズや関連アイテム情報', 'bg-green-50 text-green-700'),
('SNS活用', 'sns-tips', 'SNSでの推し活テクニック', 'bg-purple-50 text-purple-700'),
('応援マナー', 'support-manner', 'ファンとしてのマナーや心得', 'bg-yellow-50 text-yellow-700'),
('タレント情報', 'talent-info', 'タレント・アイドルの詳細情報', 'bg-pink-50 text-pink-700'),
('ライブレポート', 'live-report', 'ライブやコンサートのレポート', 'bg-orange-50 text-orange-700');
    `);

    // 2. 新しいタグを追加（既存の'初心者'以外）
    console.log('\n=== 2. 新しいタグの追加 ===');

    for (const tag of newTags) {
      const { data, error } = await supabase
        .from('article_tags')  // 実際のtagsテーブル
        .upsert([tag], { onConflict: 'slug' });

      if (error) {
        console.log(`❌ ${tag.name}: エラー - ${error.message}`);
      } else {
        console.log(`✅ ${tag.name}: 追加/更新完了`);
      }
    }

    // 3. 現在の全タグを取得
    const { data: allTags } = await supabase
      .from('article_tags')
      .select('*');

    console.log('\n=== 3. 現在のタグ一覧 ===');
    if (allTags) {
      allTags.forEach(tag => {
        console.log(`🏷️ ${tag.name} (${tag.slug})`);
      });
    }

    // 4. 記事にタグを自動割り当て
    console.log('\n=== 4. 記事へのタグ自動割り当て ===');

    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, content, tag_ids');

    if (articles && allTags) {
      const tagMap = {};
      allTags.forEach(tag => {
        tagMap[tag.slug] = tag.id;
      });

      for (const article of articles) {
        const titleLower = article.title.toLowerCase();
        const contentLower = (article.content || '').toLowerCase();
        const combined = titleLower + ' ' + contentLower;

        const assignedTags = [];

        // タグの自動割り当てロジック
        if (combined.includes('timelesz')) assignedTags.push(tagMap['timelesz']);
        if (combined.includes('初心者') || combined.includes('始め')) assignedTags.push(tagMap['beginner']);
        if (combined.includes('ライブ') || combined.includes('コンサート') || combined.includes('公演')) {
          assignedTags.push(tagMap['live']);
          assignedTags.push(tagMap['concert']);
        }
        if (combined.includes('イベント')) assignedTags.push(tagMap['event']);
        if (combined.includes('sns') || combined.includes('ソーシャル')) assignedTags.push(tagMap['sns']);
        if (combined.includes('twitter')) assignedTags.push(tagMap['twitter']);
        if (combined.includes('instagram')) assignedTags.push(tagMap['instagram']);
        if (combined.includes('マナー')) assignedTags.push(tagMap['manner']);
        if (combined.includes('応援')) assignedTags.push(tagMap['support']);
        if (combined.includes('グッズ') || combined.includes('アイテム')) assignedTags.push(tagMap['goods']);
        if (combined.includes('うちわ')) assignedTags.push(tagMap['uchiwa']);
        if (combined.includes('ペンライト')) assignedTags.push(tagMap['penlight']);
        if (combined.includes('アクスタ')) assignedTags.push(tagMap['acrylic-stand']);
        if (combined.includes('カフェ')) assignedTags.push(tagMap['cafe']);
        if (combined.includes('遠征') || combined.includes('交通')) {
          assignedTags.push(tagMap['tour']);
          assignedTags.push(tagMap['transportation']);
        }
        if (combined.includes('オンライン')) assignedTags.push(tagMap['online']);

        // 重複を除去
        const uniqueTags = [...new Set(assignedTags.filter(Boolean))];

        if (uniqueTags.length > 0) {
          await supabase
            .from('articles')
            .update({ tag_ids: uniqueTags })
            .eq('id', article.id);

          console.log(`🏷️ ${article.title.substring(0, 40)}... → ${uniqueTags.length}個のタグ`);
        }
      }
    }

    // 5. 最終確認
    console.log('\n=== 5. 設定完了状況 ===');

    const { count: tagCount } = await supabase
      .from('article_tags')
      .select('*', { count: 'exact', head: true });

    const { data: articlesWithTags } = await supabase
      .from('articles')
      .select('tag_ids')
      .not('tag_ids', 'eq', '[]');

    console.log(`✅ 総タグ数: ${tagCount}個`);
    console.log(`✅ タグ設定済み記事: ${articlesWithTags?.length || 0}個`);

    // タグ使用統計
    const { data: allArticles } = await supabase
      .from('articles')
      .select('tag_ids');

    if (allArticles && allTags) {
      const tagUsage = {};
      allTags.forEach(tag => {
        tagUsage[tag.name] = 0;
      });

      allArticles.forEach(article => {
        if (article.tag_ids && Array.isArray(article.tag_ids)) {
          article.tag_ids.forEach(tagId => {
            const tag = allTags.find(t => t.id === tagId);
            if (tag) {
              tagUsage[tag.name]++;
            }
          });
        }
      });

      console.log('\n=== タグ使用統計 ===');
      Object.entries(tagUsage)
        .sort((a, b) => b[1] - a[1])
        .forEach(([tagName, count]) => {
          if (count > 0) {
            console.log(`🏷️ ${tagName}: ${count}記事`);
          }
        });
    }

  } catch (error) {
    console.error('エラー:', error);
  }

  process.exit(0);
}

setupTagsProperly().catch(error => {
  console.error('エラー:', error);
  process.exit(1);
});