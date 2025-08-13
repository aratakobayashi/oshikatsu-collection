/**
 * 不足しているエピソード調査
 * 競合ロケーションに対応するエピソード番号を特定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 本番環境変数読み込み
dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 不足している競合ロケーション（25件）
const missingLocations = [
  'OVERRIDE 神宮前',
  'CozyStyleCOFFEE', 
  '西公園',
  '博多元気一杯!!',
  'LATTE ART MANIA TOKYO',
  '熟豚三代目蔵司',
  '洋麺屋 五右衛門 赤坂店',
  'dancyu食堂',
  'トーキョーアジフライ',
  '食事処 相州屋',
  '二丁目食堂トレド',
  '土鍋炊ごはん なかよし',
  '手しおごはん玄 新宿南口店',
  '赤坂ごはん 山ね家',
  'キッチンオリジン 赤坂店',
  '東京都庁第一庁舎32階職員食堂',
  'おひつ膳田んぼ',
  '伊東食堂',
  'あん梅',
  '筋肉食堂',
  '胡同',
  '相撲茶屋 寺尾',
  '秋葉原カリガリ',
  'ル・パン・コティディアン',
  'iki ESPRESSO'
]

// 競合エピソード番号マッピング（調査済み）
const episodeMapping = {
  'OVERRIDE 神宮前': '#438',
  'CozyStyleCOFFEE': '#419',
  '西公園': '#412',
  '博多元気一杯!!': '#411',
  'LATTE ART MANIA TOKYO': '#405',
  '熟豚三代目蔵司': '#397',
  '洋麺屋 五右衛門 赤坂店': '#389',
  'dancyu食堂': '#369',
  'トーキョーアジフライ': '#316',
  '食事処 相州屋': '#310',
  '二丁目食堂トレド': '#282',
  '土鍋炊ごはん なかよし': '#274',
  '手しおごはん玄 新宿南口店': '#264',
  '赤坂ごはん 山ね家': '#249',
  'キッチンオリジン 赤坂店': '#234',
  '東京都庁第一庁舎32階職員食堂': '#150',
  'おひつ膳田んぼ': '#135',
  '伊東食堂': '#402/#404（朝食アワード）',
  'あん梅': '#320',
  '筋肉食堂': '#402/#404（朝食アワード）',
  '胡同': '#402/#404（朝食アワード）',
  '相撲茶屋 寺尾': '#402/#404（朝食アワード）',
  '秋葉原カリガリ': '#402/#404（朝食アワード）',
  'ル・パン・コティディアン': '#354',
  'iki ESPRESSO': '不明'
}

async function findCorrespondingEpisodes() {
  console.log('🔍 不足ロケーションに対応するエピソード調査\n')
  
  // まず本番のエピソード一覧を取得
  const { data: productionEpisodes } = await supabase
    .from('episodes')
    .select('id, title, video_url, date')
    .order('date', { ascending: false })
  
  console.log(`📺 本番エピソード総数: ${productionEpisodes?.length || 0}件\n`)
  
  console.log('📋 不足ロケーションと対応エピソード:')
  console.log('='.repeat(80))
  
  const foundEpisodes: any[] = []
  const missingEpisodes: string[] = []
  
  for (const location of missingLocations) {
    const episodeNumber = episodeMapping[location as keyof typeof episodeMapping]
    
    if (episodeNumber && episodeNumber !== '不明') {
      // エピソード番号からタイトルで検索
      const episodeNumberClean = episodeNumber.replace(/#|（朝食アワード）/g, '').split('/')[0]
      
      const matchingEpisode = productionEpisodes?.find(ep => 
        ep.title.includes(episodeNumberClean) || 
        ep.title.includes(`#${episodeNumberClean}`)
      )
      
      if (matchingEpisode) {
        console.log(`✅ ${location}`)
        console.log(`   エピソード: ${matchingEpisode.title}`)
        console.log(`   日付: ${matchingEpisode.date}`)
        console.log(`   URL: ${matchingEpisode.video_url || 'なし'}`)
        foundEpisodes.push({
          location,
          episodeNumber,
          episode: matchingEpisode
        })
      } else {
        console.log(`❌ ${location}`)
        console.log(`   予想エピソード番号: ${episodeNumber}`)
        console.log(`   → 本番にエピソードが見つかりません`)
        missingEpisodes.push(location)
      }
    } else {
      console.log(`⚠️ ${location}`)
      console.log(`   エピソード番号: 不明`)
      missingEpisodes.push(location)
    }
    
    console.log('')
  }
  
  console.log('='.repeat(80))
  console.log('📊 調査結果サマリー:')
  console.log(`✅ 対応エピソード見つかった: ${foundEpisodes.length}件`)
  console.log(`❌ エピソード不足: ${missingEpisodes.length}件`)
  
  if (missingEpisodes.length > 0) {
    console.log('\n❌ 本番に不足しているエピソード:')
    missingEpisodes.forEach((location, i) => {
      console.log(`${i + 1}. ${location}`)
    })
    
    console.log('\n💡 これらのエピソードを追加する必要があります')
  }
  
  if (foundEpisodes.length > 0) {
    console.log(`\n✅ 見つかったエピソード（${foundEpisodes.length}件）にロケーション情報を追加可能`)
    console.log('🚀 ステージング環境でのテスト追加が推奨されます')
  }
  
  return { foundEpisodes, missingEpisodes }
}

// メイン実行
async function main() {
  try {
    const result = await findCorrespondingEpisodes()
    
    console.log('\n' + '='.repeat(60))
    console.log('🎯 次のアクション推奨')
    console.log('='.repeat(60))
    
    if (result.foundEpisodes.length > 0) {
      console.log('1. ステージング環境に本番エピソードを復元')
      console.log('2. 不足しているロケーション情報を追加')
      console.log('3. 新しいロケーションとエピソードの関連付け作成')
    }
    
    if (result.missingEpisodes.length > 0) {
      console.log('4. 本番に不足しているエピソードの追加を検討')
      console.log('5. YouTubeから該当動画情報を取得して新規エピソード作成')
    }
    
  } catch (error) {
    console.error('❌ エピソード調査エラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}