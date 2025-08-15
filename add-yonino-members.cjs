const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addYoninoMembers() {
  console.log('🎭 よにのちゃんねるメンバーを追加開始...\n');

  // よにのちゃんねるメンバーのデータ
  const members = [
    {
      id: crypto.randomUUID(), // UUIDを手動生成
      name: '二宮和也',
      slug: 'ninomiya-kazunari',
      bio: '嵐のメンバー。よにのちゃんねるの代表・リーダー的存在。様々な企画やゲストとの絡みで場を盛り上げる。',
      type: 'idol',
      group_name: '嵐',
      agency: 'SMILE-UP.',
      fandom_name: 'ファン',
      social_links: {
        youtube: 'よにのちゃんねる（共同運営）',
        official: 'https://www.johnnys-net.jp/page?id=artistTop&artist=13'
      },
      subscriber_count: 4000000, // よにのちゃんねる登録者数（共同）
      status: 'active',
      image_url: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg', // プレースホルダー
      debut_date: '1999-09-15'
    },
    {
      id: crypto.randomUUID(),
      name: '中丸雄一',
      slug: 'nakamaru-yuichi', 
      bio: '元KAT-TUNのメンバー（2025年3月解散）。個人YouTubeチャンネル「中丸銀河ちゃんねる」を運営。旅系コンテンツやTV出演で活動中。',
      type: 'solo_artist',
      group_name: 'KAT-TUN（解散済み）',
      agency: 'SMILE-UP.',
      fandom_name: 'ファン',
      social_links: {
        youtube: '中丸銀河ちゃんねる',
        official: '中丸雄一 OFFICIAL SITE『中丸通信』',
        yonino: 'よにのちゃんねる（ゲスト出演）'
      },
      subscriber_count: 100000, // 個人チャンネルの推定
      status: 'active',
      image_url: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg',
      debut_date: '2006-03-22'
    },
    {
      id: crypto.randomUUID(),
      name: '山田涼介',
      slug: 'yamada-ryosuke',
      bio: 'Hey! Say! JUMPのメンバー。よにのちゃんねるではバラエティ豊かな企画で視聴者を楽しませる。',
      type: 'idol', 
      group_name: 'Hey! Say! JUMP',
      agency: 'SMILE-UP.',
      fandom_name: 'ファン',
      social_links: {
        youtube: 'よにのちゃんねる（共同運営）',
        official: 'https://www.johnnys-net.jp/page?id=artistTop&artist=14'
      },
      subscriber_count: 4000000,
      status: 'active',
      image_url: 'https://images.pexels.com/photos/1040882/pexels-photo-1040882.jpeg',
      debut_date: '2007-08-08'
    },
    {
      id: crypto.randomUUID(),
      name: '菊池風磨',
      slug: 'kikuchi-fuma',
      bio: 'Sexy Zoneのメンバー。よにのちゃんねるでは若手らしいフレッシュさで番組に活気をもたらす。',
      type: 'idol',
      group_name: 'Sexy Zone', 
      agency: 'SMILE-UP.',
      fandom_name: 'セクゾファン',
      social_links: {
        youtube: 'よにのちゃんねる（共同運営）',
        official: 'https://www.johnnys-net.jp/page?id=artistTop&artist=19'
      },
      subscriber_count: 4000000,
      status: 'active',
      image_url: 'https://images.pexels.com/photos/1040883/pexels-photo-1040883.jpeg',
      debut_date: '2011-08-10'
    }
  ];

  try {
    // 既存のメンバーをチェック
    for (const member of members) {
      const { data: existing } = await supabase
        .from('celebrities')
        .select('id, name')
        .eq('slug', member.slug)
        .single();

      if (existing) {
        console.log(`⚠️  ${member.name} は既に登録済みです (ID: ${existing.id})`);
        continue;
      }

      // 新しいメンバーを追加
      const { data, error } = await supabase
        .from('celebrities')
        .insert(member)
        .select()
        .single();

      if (error) {
        console.error(`❌ ${member.name} の追加に失敗:`, error.message);
      } else {
        console.log(`✅ ${member.name} を追加しました (ID: ${data.id})`);
        
        // 追加情報を表示
        console.log(`   グループ: ${member.group_name}`);
        console.log(`   デビュー: ${member.debut_date}`);
        console.log(`   URL: /celebrities/${member.slug}\n`);
      }
    }

    // 最終確認
    const { data: allCelebrities, count } = await supabase
      .from('celebrities')
      .select('name, group_name', { count: 'exact' });

    console.log('📊 現在登録されている推し一覧:');
    allCelebrities?.forEach((celeb, i) => {
      console.log(`   ${i + 1}. ${celeb.name} (${celeb.group_name || '個人'})`);
    });
    console.log(`\n合計: ${count}名の推しが登録されています 🎉`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
  }
}

addYoninoMembers();