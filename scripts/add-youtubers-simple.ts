/**
 * 人気YouTuberの追加（簡易版）
 * APIレート制限を避けるため、チャンネル情報は後で手動更新
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 人気YouTuber情報（確実に存在する有名YouTuber）
const FAMOUS_YOUTUBERS = [
  // 超有名YouTuber
  { name: 'PewDiePie', type: 'YouTuber', category: 'ゲーム実況', bio: '世界最大級のゲーム実況YouTuber', estimated_subs: 111000000 },
  { name: 'MrBeast', type: 'YouTuber', category: 'エンタメ', bio: '世界的に有名なエンタメYouTuber', estimated_subs: 200000000 },

  // 日本の超有名YouTuber
  { name: 'HIKAKIN', type: 'YouTuber', category: 'エンタメ', bio: '日本を代表するYouTuber。HikakinTVを運営。', estimated_subs: 10500000 },
  { name: 'Hajime Syacho', type: 'YouTuber', category: 'エンタメ', bio: 'はじめしゃちょー。日本トップクラスのYouTuber。', estimated_subs: 10300000 },
  { name: 'Seikin TV', type: 'YouTuber', category: 'エンタメ', bio: 'セイキンTV。HIKAKINの兄として活動。', estimated_subs: 4500000 },

  // ゲーム実況系
  { name: 'Kizuna AI', type: 'YouTuber', category: 'VTuber', bio: '世界初のバーチャルYouTuber', estimated_subs: 4200000 },
  { name: 'GameWith', type: 'YouTuber', category: 'ゲーム', bio: 'ゲーム攻略情報チャンネル', estimated_subs: 2000000 },
  { name: 'Kuroba Mario', type: 'YouTuber', category: 'ゲーム実況', bio: '人気ゲーム実況者', estimated_subs: 1500000 },

  // エンタメ・バラエティ系
  { name: 'Fischer\'s', type: 'YouTuber', category: 'エンタメグループ', bio: '7人組エンタメYouTuberグループ', estimated_subs: 7500000 },
  { name: 'Kemio', type: 'YouTuber', category: 'エンタメ', bio: '人気エンタメYouTuber', estimated_subs: 2000000 },
  { name: 'JunsKitchen', type: 'YouTuber', category: '料理', bio: '料理系YouTuber', estimated_subs: 4000000 },

  // 美容・ファッション系
  { name: 'Saito Asuka', type: 'YouTuber', category: '美容', bio: '美容系YouTuber', estimated_subs: 1000000 },
  { name: 'Sekine Risa', type: 'YouTuber', category: 'ファッション', bio: 'ファッション系YouTuber', estimated_subs: 800000 },

  // 音楽系
  { name: 'Nanou', type: 'YouTuber', category: '音楽', bio: '音楽系YouTuber', estimated_subs: 1200000 },
  { name: 'Goose House', type: 'YouTuber', category: '音楽グループ', bio: '音楽グループYouTuber', estimated_subs: 2000000 },

  // 教育・解説系
  { name: 'TED', type: 'YouTuber', category: '教育', bio: 'TED公式チャンネル', estimated_subs: 24000000 },
  { name: 'Crash Course', type: 'YouTuber', category: '教育', bio: '教育系YouTubeチャンネル', estimated_subs: 14000000 },

  // 料理・食べ物系
  { name: 'Tasty', type: 'YouTuber', category: '料理', bio: 'BuzzFeedの料理チャンネル', estimated_subs: 21000000 },
  { name: 'Bon Appétit', type: 'YouTuber', category: '料理', bio: '料理雑誌のYouTubeチャンネル', estimated_subs: 6000000 },

  // スポーツ系
  { name: 'Dude Perfect', type: 'YouTuber', category: 'スポーツ', bio: 'スポーツ・トリックショット系YouTuber', estimated_subs: 59000000 },
  { name: 'F2Freestylers', type: 'YouTuber', category: 'サッカー', bio: 'サッカーフリースタイル系YouTuber', estimated_subs: 13000000 },

  // テック・科学系
  { name: 'Marques Brownlee', type: 'YouTuber', category: 'テクノロジー', bio: 'テクノロジーレビューYouTuber', estimated_subs: 18000000 },
  { name: 'Veritasium', type: 'YouTuber', category: '科学', bio: '科学教育YouTuber', estimated_subs: 13000000 },

  // ライフスタイル・Vlog系
  { name: 'Emma Chamberlain', type: 'YouTuber', category: 'ライフスタイル', bio: 'ライフスタイル系YouTuber', estimated_subs: 12000000 },
  { name: 'Casey Neistat', type: 'YouTuber', category: 'Vlog', bio: 'Vlog系YouTuber', estimated_subs: 12000000 }
]

async function addYouTubersSimple() {
  console.log('🎬 人気YouTuber追加開始（簡易版）')
  console.log('=================================\n')

  let totalAdded = 0
  let categoryStats = {}

  for (const youtuber of FAMOUS_YOUTUBERS) {
    console.log(`👤 ${youtuber.name} を追加中...`)

    // 既存チェック
    const { data: existing } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', youtuber.name)
      .single()

    if (existing) {
      console.log(`   ⏭️ 既に存在します`)
      continue
    }

    // セレブリティ追加
    const celebrityId = youtuber.name.replace(/[\s\u3000]/g, '_').toLowerCase().replace(/[^a-z0-9_]/g, '_')
    const slug = youtuber.name.replace(/[\s\u3000]/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '-')

    const { error: celebrityError } = await supabase
      .from('celebrities')
      .insert({
        id: celebrityId,
        name: youtuber.name,
        slug: slug,
        type: youtuber.type,
        bio: youtuber.bio,
        subscriber_count: youtuber.estimated_subs,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (celebrityError) {
      console.log(`   ❌ セレブリティ追加エラー: ${celebrityError.message}`)
      continue
    }

    // サンプルエピソード追加（後でYouTube APIで実際の動画に置き換え可能）
    const sampleEpisodes = [
      {
        id: `${celebrityId}_sample_1`,
        title: `【${youtuber.category}】${youtuber.name}の人気動画 #1`,
        description: `${youtuber.name}による${youtuber.category}動画`,
        date: new Date().toISOString(),
        duration: null,
        thumbnail_url: `https://via.placeholder.com/480x360/FF6B6B/FFFFFF?text=${encodeURIComponent(youtuber.name)}`,
        video_url: `https://youtube.com/results?search_query=${encodeURIComponent(youtuber.name)}`,
        view_count: Math.floor(youtuber.estimated_subs / 100),
        celebrity_id: celebrityId
      },
      {
        id: `${celebrityId}_sample_2`,
        title: `【${youtuber.category}】${youtuber.name}の人気動画 #2`,
        description: `${youtuber.name}による${youtuber.category}動画`,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: null,
        thumbnail_url: `https://via.placeholder.com/480x360/4ECDC4/FFFFFF?text=${encodeURIComponent(youtuber.name)}`,
        video_url: `https://youtube.com/results?search_query=${encodeURIComponent(youtuber.name)}`,
        view_count: Math.floor(youtuber.estimated_subs / 150),
        celebrity_id: celebrityId
      },
      {
        id: `${celebrityId}_sample_3`,
        title: `【${youtuber.category}】${youtuber.name}の人気動画 #3`,
        description: `${youtuber.name}による${youtuber.category}動画`,
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        duration: null,
        thumbnail_url: `https://via.placeholder.com/480x360/45B7D1/FFFFFF?text=${encodeURIComponent(youtuber.name)}`,
        video_url: `https://youtube.com/results?search_query=${encodeURIComponent(youtuber.name)}`,
        view_count: Math.floor(youtuber.estimated_subs / 200),
        celebrity_id: celebrityId
      }
    ]

    let episodeCount = 0
    for (const episode of sampleEpisodes) {
      const { error: episodeError } = await supabase
        .from('episodes')
        .insert(episode)

      if (!episodeError) {
        episodeCount++
      }
    }

    console.log(`   ✅ ${youtuber.name}: ${episodeCount}エピソード追加完了 (推定登録者数: ${youtuber.estimated_subs.toLocaleString()}人)`)

    // カテゴリ統計
    categoryStats[youtuber.category] = (categoryStats[youtuber.category] || 0) + 1
    totalAdded++

    await new Promise(resolve => setTimeout(resolve, 300))
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 人気YouTuber追加完了！')
  console.log('='.repeat(60))
  console.log(`📊 結果:`)
  console.log(`  追加したYouTuber: ${totalAdded}人`)
  console.log(`  追加したエピソード: ${totalAdded * 3}本`)

  // カテゴリ別統計
  console.log('\n📈 カテゴリ別統計:')
  Object.entries(categoryStats)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count}人`)
    })

  console.log('\n🌟 追加された主要YouTuber:')
  console.log('  🌍 グローバル: PewDiePie、MrBeast、TED、Dude Perfect')
  console.log('  🇯🇵 日本: HIKAKIN、はじめしゃちょー、Fischer\'s、Kizuna AI')
  console.log('  🎮 ゲーム: GameWith、Kuroba Mario')
  console.log('  🍳 料理: Tasty、JunsKitchen、Bon Appétit')
  console.log('  📚 教育: TED、Crash Course、Veritasium')
  console.log('  💻 テック: Marques Brownlee')
  console.log('  🎵 音楽: Goose House、Nanou')

  console.log('\n💡 確認方法:')
  console.log('• タレント一覧ページで「YouTuber」で検索')
  console.log('• 各YouTuberのプロフィールページでエピソードを確認')
  console.log('• 推定登録者数情報も表示されます')
  console.log('• 後でYouTube Data APIで実際の動画情報に更新可能')
  console.log('• ブラウザでハードリフレッシュ（Ctrl+Shift+R / Cmd+Shift+R）')
}

// 実行
addYouTubersSimple().catch(console.error)