import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Load environment variables
dotenv.config({ path: join(projectRoot, '.env.production') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function deleteBonsaiTags() {
  console.log('🌱 盆栽関連タグの削除を開始...\n');

  // 盆栽関連タグのリスト
  const bonsaiTagSlugs = [
    'maple', 'pruning', 'fruit-bearing', 'annual-care', 'pine',
    'coniferous', 'sakura', 'repotting', 'watering', 'pest-disease',
    'autumn-leaves', 'fertilizer', 'flowering-tree', 'tools', 'pot',
    'flowering', 'deciduous'
  ];

  // まず、これらのタグを取得
  const { data: bonsaiTags, error: fetchError } = await supabase
    .from('article_tags')
    .select('*')
    .in('slug', bonsaiTagSlugs);

  if (fetchError) {
    console.error('❌ タグ取得エラー:', fetchError);
    return;
  }

  console.log('📋 削除対象タグ:', bonsaiTags.length, '件');
  bonsaiTags.forEach(tag => {
    console.log(`- ${tag.name} (ID: ${tag.id}, slug: ${tag.slug})`);
  });

  // これらのタグIDを使用している記事を確認
  console.log('\n🔍 これらのタグを使用している記事を確認中...');
  const tagIds = bonsaiTags.map(tag => tag.id);

  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, tag_ids')
    .not('tag_ids', 'is', null);

  if (articlesError) {
    console.error('❌ 記事取得エラー:', articlesError);
    return;
  }

  // タグIDが重複している記事を検索
  const articlesWithBonsaiTags = articles.filter(article => {
    if (Array.isArray(article.tag_ids)) {
      return article.tag_ids.some(tagId => tagIds.includes(tagId));
    }
    return false;
  });

  if (articlesWithBonsaiTags.length > 0) {
    console.log(`⚠️ ${articlesWithBonsaiTags.length}件の記事が盆栽タグを使用しています:`);
    articlesWithBonsaiTags.forEach(article => {
      const usedBonsaiTagIds = article.tag_ids.filter(tagId => tagIds.includes(tagId));
      const usedBonsaiTags = bonsaiTags.filter(tag => usedBonsaiTagIds.includes(tag.id));
      console.log(`- ${article.title.substring(0, 50)}... (使用タグ: ${usedBonsaiTags.map(t => t.name).join(', ')})`);
    });

    // 記事からタグを削除
    console.log('\n🔄 記事からタグを削除中...');
    for (const article of articlesWithBonsaiTags) {
      const newTagIds = article.tag_ids.filter(tagId => !tagIds.includes(tagId));

      const { error: updateError } = await supabase
        .from('articles')
        .update({ tag_ids: newTagIds })
        .eq('id', article.id);

      if (updateError) {
        console.error(`❌ 記事更新エラー (${article.title}):`, updateError);
      } else {
        console.log(`✅ 記事から盆栽タグを削除: ${article.title.substring(0, 50)}...`);
      }
    }
  } else {
    console.log('✅ 盆栽タグを使用している記事はありません');
  }

  // タグを削除
  console.log('\n🗑️ 盆栽タグを削除中...');
  for (const tag of bonsaiTags) {
    const { error: deleteError } = await supabase
      .from('article_tags')
      .delete()
      .eq('id', tag.id);

    if (deleteError) {
      console.error(`❌ タグ削除エラー (${tag.name}):`, deleteError);
    } else {
      console.log(`✅ タグ削除完了: ${tag.name}`);
    }
  }

  // 削除後の確認
  console.log('\n📊 削除後のタグ数確認...');
  const { data: remainingTags, count } = await supabase
    .from('article_tags')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ 残りタグ数: ${count}件`);
  console.log('\n🎉 盆栽関連タグの削除が完了しました！');

  process.exit(0);
}

deleteBonsaiTags().catch(console.error);