const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 3グループの情報
const groups = [
  {
    name: '=LOVE',
    slug: 'equal-love',
    description: '指原莉乃プロデュースのアイドルグループ。2017年デビュー。',
    youtube_channel_url: 'https://www.youtube.com/@ikonoijoy',
    youtube_channel_id: 'UCF2JbRNnlblXw0M-jMLrElg', // 実際のチャンネルIDを後で取得
    official_website: 'https://equal-love.jp/',
    agency: '代々木アニメーション学院',
    debut_date: '2017-08-23',
    tags: ['=LOVE', 'イコールラブ', 'アイドル', '指原莉乃', 'プロデュース']
  },
  {
    name: '≠ME',
    slug: 'not-equal-me',
    description: '指原莉乃プロデュースのアイドルグループ。2019年デビュー。',
    youtube_channel_url: 'https://www.youtube.com/@ikonoijoy',
    youtube_channel_id: 'UCF2JbRNnlblXw0M-jMLrElg',
    official_website: 'https://not-equal-me.jp/',
    agency: '代々木アニメーション学院',
    debut_date: '2019-07-03',
    tags: ['≠ME', 'ノットイコールミー', 'アイドル', '指原莉乃', 'プロデュース']
  },
  {
    name: '≒JOY',
    slug: 'nearly-equal-joy',
    description: '指原莉乃プロデュースのアイドルグループ。2021年デビュー。',
    youtube_channel_url: 'https://www.youtube.com/@ikonoijoy',
    youtube_channel_id: 'UCF2JbRNnlblXw0M-jMLrElg',
    official_website: 'https://nearly-equal-joy.jp/',
    agency: '代々木アニメーション学院',
    debut_date: '2021-02-28',
    tags: ['≒JOY', 'ニアリーイコールジョイ', 'アイドル', '指原莉乃', 'プロデュース']
  }
];

// YouTubeチャンネル情報を取得（簡易版）
async function getChannelInfo() {
  console.log('📺 YouTubeチャンネル情報を取得中...');
  
  // 実際の実装では YouTube Data API を使用
  // 今回は手動で設定
  return {
    channelId: 'UCF2JbRNnlblXw0M-jMLrElg', // 仮のID、後で正確なものに更新
    title: 'イコラブ・ノイミー・ニアジョイ / =LOVE・≠ME・≒JOY',
    description: '指原莉乃プロデュース =LOVE・≠ME・≒JOY 合同公式チャンネル',
    thumbnailUrl: 'https://yt3.googleusercontent.com/channel_thumbnail_default.jpg' // 実際のサムネイルURL
  };
}

// Celebrity追加関数
async function addCelebrity(groupData, channelInfo) {
  const celebrity = {
    id: crypto.randomUUID(),
    name: groupData.name,
    slug: groupData.slug,
    bio: groupData.description,
    image_url: channelInfo.thumbnailUrl,
    agency: groupData.agency,
    debut_date: groupData.debut_date,
    type: 'group',
    status: 'active',
    social_links: {
      youtube: groupData.youtube_channel_url,
      website: groupData.official_website
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('celebrities')
    .insert(celebrity)
    .select();

  return { data, error };
}

// メイン処理
async function addIkonoiCelebrities() {
  console.log('🎭 =LOVE・≠ME・≒JOY グループ追加開始！\n');

  try {
    // YouTubeチャンネル情報取得
    const channelInfo = await getChannelInfo();
    console.log(`✅ チャンネル情報取得: ${channelInfo.title}`);

    let addedCount = 0;
    let existingCount = 0;

    // 各グループを追加
    for (const group of groups) {
      console.log(`\n🎭 ${group.name} 追加中...`);
      
      const { data, error } = await addCelebrity(group, channelInfo);
      
      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          console.log(`⚠️ ${group.name} は既に存在します`);
          existingCount++;
        } else {
          console.error(`❌ ${group.name} 追加エラー:`, error.message);
        }
      } else {
        console.log(`✅ ${group.name} 追加成功！`);
        console.log(`   📝 説明: ${group.description}`);
        console.log(`   🌐 公式サイト: ${group.official_website}`);
        console.log(`   📅 デビュー: ${group.debut_date}`);
        console.log(`   🏷️ タグ: ${group.tags.join(', ')}`);
        addedCount++;
      }
    }

    console.log('\n🎉 グループ追加完了！');
    console.log('='.repeat(60));
    console.log(`📊 結果:`);
    console.log(`  - 新規追加: ${addedCount}グループ`);
    console.log(`  - 既存: ${existingCount}グループ`);
    console.log(`  - 合計処理: ${groups.length}グループ`);

    // 追加されたグループの確認
    console.log('\n📋 追加されたグループ:');
    for (const group of groups) {
      const { data: celebrities } = await supabase
        .from('celebrities')
        .select('id, name, slug')
        .eq('slug', group.slug);
      
      if (celebrities && celebrities.length > 0) {
        console.log(`✅ ${group.name} (ID: ${celebrities[0].id})`);
      }
    }

    console.log('\n🚀 次のステップ:');
    console.log('1. YouTube Data API でチャンネルの全動画を取得');
    console.log('2. 動画タイトル・説明文からグループを判別');
    console.log('3. ショート動画を除外');
    console.log('4. 各エピソードにロケーション・アイテムを紐づけ');
    
    console.log('\n🌐 確認URL:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/equal-love');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/not-equal-me');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/nearly-equal-joy');

  } catch (error) {
    console.error('❌ 処理中にエラーが発生:', error);
  }
}

// グループ判別ヘルパー関数（後でエピソード追加時に使用）
function detectGroupFromTitle(title, description = '') {
  const text = (title + ' ' + description).toLowerCase();
  
  // 優先順位付きでチェック（より具体的なものを先に）
  if (text.includes('≒joy') || text.includes('ニアジョイ') || text.includes('nearly') || text.includes('≒')) {
    return 'nearly-equal-joy';
  }
  if (text.includes('≠me') || text.includes('ノイミー') || text.includes('not equal') || text.includes('≠')) {
    return 'not-equal-me';
  }
  if (text.includes('=love') || text.includes('イコラブ') || text.includes('equal love') || text.includes('=')) {
    return 'equal-love';
  }
  
  // デフォルトは=LOVE（メイングループ）
  return 'equal-love';
}

console.log('🎬 合同チャンネル対応スクリプト実行中...');
addIkonoiCelebrities();

// 判別関数をエクスポート（他のスクリプトで使用）
module.exports = { detectGroupFromTitle };