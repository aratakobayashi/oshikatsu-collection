/**
 * ステージング環境に不足ロケーション追加
 * 本番から対応エピソードを復元し、新しいロケーション情報を追加
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

// 追加するロケーションと対応エピソードのマッピング
const locationsToAdd = [
  {
    name: 'OVERRIDE 神宮前',
    address: '東京都渋谷区神宮前6丁目18-11 明治ビルディング',
    episodeTitle: '#438【買い物!!】経理の帽子が悲鳴をあげていた日',
    category: 'ショップ'
  },
  {
    name: 'CozyStyleCOFFEE',
    address: '東京都新宿区上落合３丁目１０−３',
    episodeTitle: '#419【ドライブ!!】これがよにのクオリティーだっ！の日',
    category: 'カフェ'
  },
  {
    name: '西公園',
    address: '福岡県福岡市中央区西公園１３−１',
    episodeTitle: '#412【福岡!!】お花見が気持ち良すぎた日',
    category: '公園'
  },
  {
    name: '博多元気一杯!!',
    address: '福岡県福岡市博多区下呉服町４−３１−１',
    episodeTitle: '#411 【福岡!!】替え玉！替え玉！の日',
    category: 'ラーメン店'
  },
  {
    name: 'LATTE ART MANIA TOKYO',
    address: '東京都港区北青山２丁目９−１３ 斉藤ビル1F',
    episodeTitle: '#405【考察!!】意外と経理がちゃんと考えていた日',
    category: 'カフェ'
  },
  {
    name: '熟豚三代目蔵司',
    address: '東京都港区赤坂４丁目２−２',
    episodeTitle: '#397【トンカツな朝は２人で】こりゃ大変プロジェクトですな!?',
    category: 'とんかつ店'
  },
  {
    name: '洋麺屋 五右衛門 赤坂店',
    address: '東京都港区赤坂５丁目１−４ 赤坂いそむらビル １Ｆ',
    episodeTitle: '#389【朝食!!】卍が所望していたお店に行った日',
    category: 'パスタ店'
  },
  {
    name: 'dancyu食堂',
    address: '東京都千代田区丸の内１丁目９−１ グランスタ八重北 1F',
    episodeTitle: '#369【イノッチ祭!!】とんでもない思い出が出てきた日',
    category: '定食屋'
  },
  {
    name: 'ル・パン・コティディアン',
    address: '東京都港区赤坂9丁目7-1 東京ミッドタウンプラザ1F',
    episodeTitle: '#354【朝食!!】RIKACO(さん)に会った日',
    category: 'ベーカリーカフェ'
  },
  // 朝食アワードの店舗（#402エピソード関連）
  {
    name: '伊東食堂',
    address: '東京都豊島区東池袋',
    episodeTitle: '#402【アワード!!】今までの朝食を振り返った日',
    category: '定食屋'
  }
]

async function restoreRequiredEpisodes() {
  console.log('📺 必要なエピソードを本番から復元中...\n')
  
  // 対象エピソードのタイトル一覧
  const targetTitles = [...new Set(locationsToAdd.map(loc => loc.episodeTitle))]
  
  console.log(`🎯 復元対象エピソード: ${targetTitles.length}件`)
  targetTitles.forEach((title, i) => {
    console.log(`${i + 1}. ${title}`)
  })
  
  let restoredCount = 0
  
  for (const title of targetTitles) {
    // 本番からエピソード取得
    const { data: productionEpisode } = await productionSupabase
      .from('episodes')
      .select('*')
      .eq('title', title)
      .single()
    
    if (productionEpisode) {
      // ステージングに既存チェック
      const { data: existingEpisode } = await stagingSupabase
        .from('episodes')
        .select('id')
        .eq('title', title)
        .single()
      
      if (!existingEpisode) {
        // celebrity_idをステージング用に変換
        const { data: stagingCelebrity } = await stagingSupabase
          .from('celebrities')
          .select('id')
          .eq('name', 'よにのちゃんねる')
          .single()
        
        if (!stagingCelebrity) {
          console.log(`❌ ${title} ステージング celebrity見つかりません`)
          continue
        }
        
        // エピソードデータをコピーしてcelebrity_idを修正
        const episodeForStaging = {
          ...productionEpisode,
          celebrity_id: stagingCelebrity.id
        }
        
        // ステージングに復元
        const { error } = await stagingSupabase
          .from('episodes')
          .insert([episodeForStaging])
        
        if (error) {
          console.log(`❌ ${title} 復元エラー: ${error.message}`)
        } else {
          console.log(`✅ ${title} 復元完了`)
          restoredCount++
        }
      } else {
        console.log(`⚠️ ${title} 既に存在`)
        restoredCount++
      }
    } else {
      console.log(`❌ ${title} 本番に見つかりません`)
    }
  }
  
  console.log(`\n📊 エピソード復元完了: ${restoredCount}/${targetTitles.length}件\n`)
  return restoredCount
}

async function addMissingLocations() {
  console.log('📍 不足ロケーション追加中...\n')
  
  // celebrityを取得
  const { data: celebrity } = await stagingSupabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!celebrity) {
    console.log('❌ よにのちゃんねるが見つかりません')
    return 0
  }
  
  let addedLocationCount = 0
  let addedRelationCount = 0
  
  for (const locationData of locationsToAdd) {
    // ロケーション存在チェック
    const { data: existingLocation } = await stagingSupabase
      .from('locations')
      .select('id, name')
      .eq('name', locationData.name)
      .single()
    
    let locationId: string
    
    if (existingLocation) {
      console.log(`⚠️ ロケーション既存: ${locationData.name}`)
      locationId = existingLocation.id
    } else {
      // slugを生成（名前をベースに）
      const slug = locationData.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // 特殊文字削除
        .replace(/\s+/g, '-') // スペースをハイフンに
        .trim()
      
      // 新規ロケーション追加
      const { data: newLocation, error: locationError } = await stagingSupabase
        .from('locations')
        .insert([{
          name: locationData.name,
          address: locationData.address,
          slug: slug,
          celebrity_id: celebrity.id
        }])
        .select('id')
        .single()
      
      if (locationError || !newLocation) {
        console.log(`❌ ${locationData.name} 追加エラー: ${locationError?.message}`)
        continue
      }
      
      locationId = newLocation.id
      console.log(`✅ ロケーション追加: ${locationData.name}`)
      addedLocationCount++
    }
    
    // 対応エピソード取得
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
        // 関連付け追加
        const { error: relationError } = await stagingSupabase
          .from('episode_locations')
          .insert([{
            episode_id: episode.id,
            location_id: locationId
          }])
        
        if (relationError) {
          console.log(`❌ ${locationData.name} 関連付けエラー: ${relationError.message}`)
        } else {
          console.log(`🔗 関連付け追加: ${locationData.name} ↔ ${locationData.episodeTitle}`)
          addedRelationCount++
        }
      } else {
        console.log(`⚠️ 関連付け既存: ${locationData.name}`)
      }
    } else {
      console.log(`❌ エピソード未発見: ${locationData.episodeTitle}`)
    }
  }
  
  console.log(`\n📊 ロケーション追加完了:`)
  console.log(`📍 新規ロケーション: ${addedLocationCount}件`)
  console.log(`🔗 新規関連付け: ${addedRelationCount}件\n`)
  
  return { addedLocationCount, addedRelationCount }
}

async function verifyAdditions() {
  console.log('🔍 追加結果確認中...\n')
  
  // 追加されたロケーションを確認
  const addedLocationNames = locationsToAdd.map(loc => loc.name)
  
  const { data: stagingLocations } = await stagingSupabase
    .from('locations')
    .select('id, name, address')
    .in('name', addedLocationNames)
  
  console.log(`📍 ステージングに追加されたロケーション: ${stagingLocations?.length || 0}件`)
  stagingLocations?.forEach((loc, i) => {
    console.log(`${i + 1}. ${loc.name}`)
    console.log(`   ${loc.address}`)
  })
  
  // タグ付きエピソード数確認
  const { data: taggedEpisodes } = await stagingSupabase
    .from('episodes')
    .select(`
      id, title,
      episode_locations!left(id),
      episode_items!left(id)
    `)
  
  const taggedCount = taggedEpisodes?.filter(ep => 
    (ep.episode_locations && ep.episode_locations.length > 0) ||
    (ep.episode_items && ep.episode_items.length > 0)
  ).length || 0
  
  console.log(`\n🎯 タグ付きエピソード総数: ${taggedCount}件`)
  
  return {
    addedLocations: stagingLocations?.length || 0,
    taggedEpisodes: taggedCount
  }
}

// メイン実行
async function main() {
  try {
    console.log('🚀 ステージング環境に不足ロケーション追加開始\n')
    
    const episodeCount = await restoreRequiredEpisodes()
    
    if (episodeCount > 0) {
      const locationResult = await addMissingLocations()
      
      const verifyResult = await verifyAdditions()
      
      // バックアップ作成
      const timestamp = new Date().toISOString().split('T')[0]
      const backupData = {
        timestamp,
        addedLocations: locationsToAdd,
        results: {
          restoredEpisodes: episodeCount,
          ...locationResult,
          ...verifyResult
        }
      }
      
      writeFileSync(
        `./data-backup/staging-location-additions-${timestamp}.json`,
        JSON.stringify(backupData, null, 2)
      )
      
      console.log('='.repeat(60))
      console.log('🎉 ステージング環境ロケーション追加完了')
      console.log('='.repeat(60))
      console.log(`📺 復元エピソード: ${episodeCount}件`)
      console.log(`📍 追加ロケーション: ${locationResult.addedLocationCount}件`)
      console.log(`🔗 追加関連付け: ${locationResult.addedRelationCount}件`)
      console.log(`🎯 タグ付きエピソード: ${verifyResult.taggedEpisodes}件`)
      
      if (locationResult.addedLocationCount > 0) {
        console.log('\n✅ ステージング環境での追加テスト成功！')
        console.log('💡 本番環境への反映を検討できます')
      } else {
        console.log('\n⚠️ 新規ロケーションは追加されませんでした')
        console.log('🔧 既存データまたは設定を確認してください')
      }
    } else {
      console.log('❌ 必要なエピソードが復元できませんでした')
    }
    
  } catch (error) {
    console.error('❌ ロケーション追加エラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}