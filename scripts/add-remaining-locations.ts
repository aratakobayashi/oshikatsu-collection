/**
 * 残りロケーション追加（slug重複解決版）
 * 全25件の不足ロケーションを完全追加
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { writeFileSync } from 'fs'

// 環境変数読み込み
const stagingEnv = dotenv.config({ path: '.env.staging' })
const productionEnv = dotenv.config({ path: '.env.production' })

const stagingUrl = stagingEnv.parsed?.VITE_SUPABASE_URL!
const stagingKey = stagingEnv.parsed?.VITE_SUPABASE_ANON_KEY!
const productionUrl = productionEnv.parsed?.VITE_SUPABASE_URL!
const productionKey = productionEnv.parsed?.VITE_SUPABASE_ANON_KEY!

const stagingSupabase = createClient(stagingUrl, stagingKey)
const productionSupabase = createClient(productionUrl, productionKey)

// 全25件の不足ロケーション（完全版）
const allMissingLocations = [
  // 既に追加済み（4件）
  {
    name: 'OVERRIDE 神宮前',
    address: '東京都渋谷区神宮前6丁目18-11 明治ビルディング',
    episodeTitle: '#438【買い物!!】経理の帽子が悲鳴をあげていた日',
    category: 'ショップ',
    status: 'added'
  },
  {
    name: 'CozyStyleCOFFEE',
    address: '東京都新宿区上落合３丁目１０−３',
    episodeTitle: '#419【ドライブ!!】これがよにのクオリティーだっ！の日',
    category: 'カフェ',
    status: 'added'
  },
  {
    name: 'LATTE ART MANIA TOKYO',
    address: '東京都港区北青山２丁目９−１３ 斉藤ビル1F',
    episodeTitle: '#405【考察!!】意外と経理がちゃんと考えていた日',
    category: 'カフェ',
    status: 'added'
  },
  {
    name: 'dancyu食堂',
    address: '東京都千代田区丸の内１丁目９−１ グランスタ八重北 1F',
    episodeTitle: '#369【イノッチ祭!!】とんでもない思い出が出てきた日',
    category: '定食屋',
    status: 'added'
  },
  
  // 残り21件（要追加）
  {
    name: '西公園',
    address: '福岡県福岡市中央区西公園１３−１',
    episodeTitle: '#412【福岡!!】お花見が気持ち良すぎた日',
    category: '公園',
    status: 'pending'
  },
  {
    name: '博多元気一杯!!',
    address: '福岡県福岡市博多区下呉服町４−３１−１',
    episodeTitle: '#411 【福岡!!】替え玉！替え玉！の日',
    category: 'ラーメン店',
    status: 'pending'
  },
  {
    name: '熟豚三代目蔵司',
    address: '東京都港区赤坂４丁目２−２',
    episodeTitle: '#397【トンカツな朝は２人で】こりゃ大変プロジェクトですな!?',
    category: 'とんかつ店',
    status: 'pending'
  },
  {
    name: '洋麺屋 五右衛門 赤坂店',
    address: '東京都港区赤坂５丁目１−４ 赤坂いそむらビル １Ｆ',
    episodeTitle: '#389【朝食!!】卍が所望していたお店に行った日',
    category: 'パスタ店',
    status: 'pending'
  },
  {
    name: 'ル・パン・コティディアン',
    address: '東京都港区赤坂9丁目7-1 東京ミッドタウンプラザ1F',
    episodeTitle: '#354【朝食!!】RIKACO(さん)に会った日',
    category: 'ベーカリーカフェ',
    status: 'pending'
  },
  {
    name: 'トーキョーアジフライ',
    address: '東京都千代田区九段南３丁目８−１０ B1階',
    episodeTitle: '#316【遂に!!】思いっきりストレートに行った日',
    category: '居酒屋',
    status: 'pending'
  },
  {
    name: '二丁目食堂トレド',
    address: '東京都新宿区神楽坂２丁目６',
    episodeTitle: '#282【洋食パラダイス♪】開口一番を探り合った日!!!',
    category: '洋食店',
    status: 'pending'
  },
  {
    name: '土鍋炊ごはん なかよし',
    address: '東京都渋谷区恵比寿西１丁目８−２',
    episodeTitle: '#274【朝食シリーズ!!】自発光と卍の指輪がお揃いだと発覚した日',
    category: '定食屋',
    status: 'pending'
  },
  {
    name: 'おひつ膳田んぼ',
    address: '東京都世田谷区三軒茶屋１丁目２９−１０',
    episodeTitle: '#135【新シリーズ】折角だから朝飯だけ食べてみた',
    category: '定食屋',
    status: 'pending'
  },
  {
    name: '東京都庁第一庁舎32階職員食堂',
    address: '東京都新宿区西新宿２丁目８−１',
    episodeTitle: '#150【朝飯】やっぱり皆で飯を食べると美味い。',
    category: '食堂',
    status: 'pending'
  },
  {
    name: 'あん梅',
    address: '東京都港区麻布十番',
    episodeTitle: '#320【朝食!!】本当に普通に喋って終わった日',
    category: '和食店',
    status: 'pending'
  },
  {
    name: '伊東食堂',
    address: '東京都豊島区東池袋',
    episodeTitle: '#402【アワード!!】今までの朝食を振り返った日',
    category: '定食屋',
    status: 'pending'
  },
  {
    name: '筋肉食堂',
    address: '東京都中央区銀座',
    episodeTitle: '#402【アワード!!】今までの朝食を振り返った日',
    category: 'レストラン',
    status: 'pending'
  },
  {
    name: '胡同',
    address: '東京都港区西麻布',
    episodeTitle: '#402【アワード!!】今までの朝食を振り返った日',
    category: '中華料理店',
    status: 'pending'
  },
  {
    name: '相撲茶屋 寺尾',
    address: '東京都墨田区両国',
    episodeTitle: '#402【アワード!!】今までの朝食を振り返った日',
    category: 'ちゃんこ店',
    status: 'pending'
  },
  {
    name: '秋葉原カリガリ',
    address: '東京都千代田区外神田',
    episodeTitle: '#402【アワード!!】今までの朝食を振り返った日',
    category: 'レストラン',
    status: 'pending'
  },
  
  // 本番に不足しているエピソード（5件）
  {
    name: '食事処 相州屋',
    address: '東京都世田谷区松原１丁目３８−９',
    episodeTitle: '#310（本番に不足）',
    category: '定食屋',
    status: 'episode_missing'
  },
  {
    name: '手しおごはん玄 新宿南口店',
    address: '東京都渋谷区代々木２丁目２３−１',
    episodeTitle: '#264（本番に不足）',
    category: '定食屋',
    status: 'episode_missing'
  },
  {
    name: '赤坂ごはん 山ね家',
    address: '東京都港区赤坂7丁目8-1 赤坂三分坂マンション1F',
    episodeTitle: '#249（本番に不足）',
    category: '定食屋',
    status: 'episode_missing'
  },
  {
    name: 'キッチンオリジン 赤坂店',
    address: '東京都港区赤坂５丁目５−７',
    episodeTitle: '#234（本番に不足）',
    category: 'お弁当店',
    status: 'episode_missing'
  },
  {
    name: 'iki ESPRESSO',
    address: '詳細不明',
    episodeTitle: '不明',
    category: 'カフェ',
    status: 'episode_missing'
  }
]

async function generateUniqueSlug(name: string, existingSlugs: Set<string>): Promise<string> {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^\w\s\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]/g, '') // 日本語も保持
    .replace(/\s+/g, '-')
    .trim()
  
  // 英数字のみに変換
  baseSlug = baseSlug
    .replace(/[^\w-]/g, '')
    .replace(/^-+|-+$/g, '')
  
  if (!baseSlug) {
    baseSlug = 'location'
  }
  
  let uniqueSlug = baseSlug
  let counter = 1
  
  while (existingSlugs.has(uniqueSlug)) {
    uniqueSlug = `${baseSlug}-${counter}`
    counter++
  }
  
  existingSlugs.add(uniqueSlug)
  return uniqueSlug
}

async function getAllExistingSlugs(): Promise<Set<string>> {
  const { data: locations } = await stagingSupabase
    .from('locations')
    .select('slug')
  
  const slugs = new Set<string>()
  locations?.forEach(loc => {
    if (loc.slug) {
      slugs.add(loc.slug)
    }
  })
  
  console.log(`📊 既存slug数: ${slugs.size}件`)
  return slugs
}

async function restoreRemainingEpisodes() {
  console.log('📺 残りエピソードを復元中...\n')
  
  const pendingLocations = allMissingLocations.filter(loc => 
    loc.status === 'pending' && !loc.episodeTitle.includes('本番に不足')
  )
  
  const uniqueEpisodes = [...new Set(pendingLocations.map(loc => loc.episodeTitle))]
  
  console.log(`🎯 復元対象エピソード: ${uniqueEpisodes.length}件`)
  
  let restoredCount = 0
  
  for (const title of uniqueEpisodes) {
    // ステージングに既存チェック
    const { data: existingEpisode } = await stagingSupabase
      .from('episodes')
      .select('id')
      .eq('title', title)
      .single()
    
    if (existingEpisode) {
      console.log(`⚠️ ${title} 既に存在`)
      restoredCount++
      continue
    }
    
    // 本番から取得
    const { data: productionEpisode } = await productionSupabase
      .from('episodes')
      .select('*')
      .eq('title', title)
      .single()
    
    if (productionEpisode) {
      // celebrity_id変換
      const { data: stagingCelebrity } = await stagingSupabase
        .from('celebrities')
        .select('id')
        .eq('name', 'よにのちゃんねる')
        .single()
      
      if (stagingCelebrity) {
        const episodeForStaging = {
          ...productionEpisode,
          celebrity_id: stagingCelebrity.id
        }
        
        const { error } = await stagingSupabase
          .from('episodes')
          .insert([episodeForStaging])
        
        if (error) {
          console.log(`❌ ${title} 復元エラー: ${error.message}`)
        } else {
          console.log(`✅ ${title} 復元完了`)
          restoredCount++
        }
      }
    } else {
      console.log(`❌ ${title} 本番に見つかりません`)
    }
  }
  
  console.log(`\n📊 エピソード復元: ${restoredCount}/${uniqueEpisodes.length}件\n`)
  return restoredCount
}

async function addRemainingLocations() {
  console.log('📍 残りロケーション追加中...\n')
  
  const existingSlugs = await getAllExistingSlugs()
  
  const { data: celebrity } = await stagingSupabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!celebrity) {
    console.log('❌ Celebrity見つかりません')
    return { added: 0, relations: 0 }
  }
  
  const locationsToAdd = allMissingLocations.filter(loc => loc.status === 'pending')
  
  let addedCount = 0
  let relationCount = 0
  
  for (const locationData of locationsToAdd) {
    // 既存チェック
    const { data: existing } = await stagingSupabase
      .from('locations')
      .select('id, name')
      .eq('name', locationData.name)
      .single()
    
    let locationId: string
    
    if (existing) {
      console.log(`⚠️ ロケーション既存: ${locationData.name}`)
      locationId = existing.id
    } else {
      // ユニークslug生成
      const uniqueSlug = await generateUniqueSlug(locationData.name, existingSlugs)
      
      // 新規追加
      const { data: newLocation, error: locationError } = await stagingSupabase
        .from('locations')
        .insert([{
          name: locationData.name,
          address: locationData.address,
          slug: uniqueSlug,
          celebrity_id: celebrity.id
        }])
        .select('id')
        .single()
      
      if (locationError || !newLocation) {
        console.log(`❌ ${locationData.name} 追加エラー: ${locationError?.message}`)
        continue
      }
      
      locationId = newLocation.id
      console.log(`✅ ロケーション追加: ${locationData.name} (slug: ${uniqueSlug})`)
      addedCount++
    }
    
    // エピソード関連付け
    const { data: episode } = await stagingSupabase
      .from('episodes')
      .select('id')
      .eq('title', locationData.episodeTitle)
      .single()
    
    if (episode) {
      // 関連付け存在チェック
      const { data: existingRelation } = await stagingSupabase
        .from('episode_locations')
        .select('id')
        .eq('episode_id', episode.id)
        .eq('location_id', locationId)
        .single()
      
      if (!existingRelation) {
        const { error: relationError } = await stagingSupabase
          .from('episode_locations')
          .insert([{
            episode_id: episode.id,
            location_id: locationId
          }])
        
        if (!relationError) {
          console.log(`🔗 関連付け追加: ${locationData.name}`)
          relationCount++
        } else {
          console.log(`❌ 関連付けエラー: ${locationData.name}`)
        }
      } else {
        console.log(`⚠️ 関連付け既存: ${locationData.name}`)
      }
    } else {
      console.log(`❌ エピソード未発見: ${locationData.episodeTitle}`)
    }
  }
  
  console.log(`\n📊 ロケーション追加完了:`)
  console.log(`📍 新規ロケーション: ${addedCount}件`)
  console.log(`🔗 新規関連付け: ${relationCount}件\n`)
  
  return { added: addedCount, relations: relationCount }
}

async function verifyFinalResults() {
  console.log('🔍 最終結果確認中...\n')
  
  // ステージング環境の競合カバー率を確認
  const { data: stagingLocations } = await stagingSupabase
    .from('locations')
    .select('name')
  
  const stagingLocationNames = new Set(
    stagingLocations?.map(loc => loc.name.toLowerCase()) || []
  )
  
  const targetLocationNames = allMissingLocations
    .filter(loc => loc.status !== 'episode_missing')
    .map(loc => loc.name.toLowerCase())
  
  const covered = targetLocationNames.filter(name => 
    stagingLocationNames.has(name)
  ).length
  
  const coverageRate = Math.round((covered / targetLocationNames.length) * 100)
  
  console.log(`📊 競合ロケーション カバー状況:`)
  console.log(`✅ カバー済み: ${covered}/${targetLocationNames.length}件 (${coverageRate}%)`)
  
  // タグ付きエピソード確認
  const { data: episodes } = await stagingSupabase
    .from('episodes')
    .select(`
      id, title,
      episode_locations!left(id),
      episode_items!left(id)
    `)
  
  const taggedCount = episodes?.filter(ep => 
    (ep.episode_locations && ep.episode_locations.length > 0) ||
    (ep.episode_items && ep.episode_items.length > 0)
  ).length || 0
  
  console.log(`🎯 タグ付きエピソード: ${taggedCount}件`)
  
  return { covered, total: targetLocationNames.length, coverageRate, taggedCount }
}

// メイン実行
async function main() {
  try {
    console.log('🚀 残りロケーション完全追加開始\n')
    
    const episodeCount = await restoreRemainingEpisodes()
    const locationResult = await addRemainingLocations()
    const finalResult = await verifyFinalResults()
    
    // レポート生成
    const timestamp = new Date().toISOString().split('T')[0]
    const reportData = {
      timestamp,
      restored_episodes: episodeCount,
      added_locations: locationResult.added,
      added_relations: locationResult.relations,
      final_coverage: finalResult.coverageRate,
      tagged_episodes: finalResult.taggedCount,
      locations_added: allMissingLocations.filter(loc => loc.status === 'pending')
    }
    
    writeFileSync(
      `./data-backup/remaining-locations-report-${timestamp}.json`,
      JSON.stringify(reportData, null, 2)
    )
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 残りロケーション追加完了レポート')
    console.log('='.repeat(60))
    console.log(`📺 復元エピソード: ${episodeCount}件`)
    console.log(`📍 追加ロケーション: ${locationResult.added}件`)
    console.log(`🔗 追加関連付け: ${locationResult.relations}件`)
    console.log(`📊 競合カバー率: ${finalResult.coverageRate}%`)
    console.log(`🎯 タグ付きエピソード: ${finalResult.taggedCount}件`)
    
    if (finalResult.coverageRate >= 80) {
      console.log('\n🎉 優秀！競合の大部分をカバーしています')
      console.log('💡 本番環境への反映を検討できます')
    } else {
      console.log('\n⚠️ さらなるロケーション追加が必要です')
      console.log('🔧 残りの課題を確認してください')
    }
    
  } catch (error) {
    console.error('❌ 残りロケーション追加エラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}