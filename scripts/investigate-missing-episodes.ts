/**
 * 本番不足エピソード調査
 * YouTubeから該当動画情報を取得して新規エピソード作成準備
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 本番環境変数読み込み
dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 本番に不足している5件のエピソード情報
const missingEpisodes = [
  {
    number: '310',
    expectedTitle: '食事処 相州屋関連',
    location: '食事処 相州屋',
    address: '東京都世田谷区松原１丁目３８−９',
    category: '定食屋',
    area: '明大前'
  },
  {
    number: '264',
    expectedTitle: '手しおごはん玄関連',
    location: '手しおごはん玄 新宿南口店',
    address: '東京都渋谷区代々木２丁目２３−１',
    category: '定食屋',
    area: '新宿'
  },
  {
    number: '249',
    expectedTitle: '赤坂ごはん 山ね家関連',
    location: '赤坂ごはん 山ね家',
    address: '東京都港区赤坂7丁目8-1 赤坂三分坂マンション1F',
    category: '定食屋',
    area: '赤坂'
  },
  {
    number: '234',
    expectedTitle: 'キッチンオリジン関連',
    location: 'キッチンオリジン 赤坂店',
    address: '東京都港区赤坂５丁目５−７',
    category: 'お弁当店',
    area: '赤坂'
  },
  {
    number: 'unknown',
    expectedTitle: 'iki ESPRESSO関連',
    location: 'iki ESPRESSO',
    address: '詳細不明',
    category: 'カフェ',
    area: '不明'
  }
]

async function checkCurrentEpisodes() {
  console.log('🔍 本番エピソード一覧確認\n')
  
  // 本番の全エピソード取得（番号順）
  const { data: episodes } = await supabase
    .from('episodes')
    .select('id, title, video_url, date')
    .order('date', { ascending: true })
  
  console.log(`📺 本番エピソード総数: ${episodes?.length || 0}件\n`)
  
  // 番号付きエピソードを抽出
  const numberedEpisodes = episodes?.filter(ep => 
    ep.title.match(/#\d+/)
  ) || []
  
  console.log('📋 番号付きエピソード（最初と最後の10件）:')
  console.log('='.repeat(80))
  
  // 最初の10件
  const first10 = numberedEpisodes.slice(0, 10)
  first10.forEach(ep => {
    const number = ep.title.match(/#(\d+)/)?.[1] || 'N/A'
    console.log(`#${number.padStart(3, '0')}: ${ep.title} (${ep.date?.split('T')[0]})`)
  })
  
  if (numberedEpisodes.length > 20) {
    console.log('...')
    
    // 最後の10件
    const last10 = numberedEpisodes.slice(-10)
    last10.forEach(ep => {
      const number = ep.title.match(/#(\d+)/)?.[1] || 'N/A'
      console.log(`#${number.padStart(3, '0')}: ${ep.title} (${ep.date?.split('T')[0]})`)
    })
  }
  
  console.log(`\n📊 番号付きエピソード: ${numberedEpisodes.length}件`)
  return numberedEpisodes
}

async function searchForMissingEpisodes(numberedEpisodes: any[]) {
  console.log('\n🔍 不足エピソード詳細調査\n')
  
  const results: any[] = []
  
  for (const missing of missingEpisodes) {
    console.log(`🎯 エピソード #${missing.number} 調査:`)
    console.log(`   予想タイトル: ${missing.expectedTitle}`)
    console.log(`   対象ロケーション: ${missing.location}`)
    
    if (missing.number === 'unknown') {
      console.log('   → エピソード番号不明のため手動調査必要')
      results.push({
        ...missing,
        status: 'manual_required',
        found: false
      })
    } else {
      // 番号での完全一致検索
      const exactMatch = numberedEpisodes.find(ep => 
        ep.title.includes(`#${missing.number}`)
      )
      
      if (exactMatch) {
        console.log(`   ✅ 発見: ${exactMatch.title}`)
        console.log(`      日付: ${exactMatch.date}`)
        console.log(`      URL: ${exactMatch.video_url || 'なし'}`)
        results.push({
          ...missing,
          status: 'found_in_production',
          found: true,
          episode: exactMatch
        })
      } else {
        // 近い番号を検索
        const nearbyNumbers = []
        const targetNum = parseInt(missing.number)
        
        for (let i = targetNum - 2; i <= targetNum + 2; i++) {
          const nearby = numberedEpisodes.find(ep => 
            ep.title.includes(`#${i}`)
          )
          if (nearby) {
            nearbyNumbers.push({
              number: i,
              title: nearby.title,
              date: nearby.date
            })
          }
        }
        
        console.log(`   ❌ #${missing.number} 本番に見つかりません`)
        if (nearbyNumbers.length > 0) {
          console.log(`   📍 近い番号のエピソード:`)
          nearbyNumbers.forEach(nearby => {
            console.log(`      #${nearby.number}: ${nearby.title}`)
          })
        }
        
        results.push({
          ...missing,
          status: 'missing_from_production',
          found: false,
          nearbyEpisodes: nearbyNumbers
        })
      }
    }
    
    console.log('')
  }
  
  return results
}

async function generateYouTubeSearchQueries(results: any[]) {
  console.log('🔍 YouTube検索クエリ生成\n')
  
  const missingResults = results.filter(r => !r.found)
  
  if (missingResults.length === 0) {
    console.log('✅ すべてのエピソードが本番に存在します')
    return
  }
  
  console.log('📺 YouTube検索推奨クエリ:')
  console.log('='.repeat(50))
  
  missingResults.forEach((missing, i) => {
    const queries = [
      `よにのちゃんねる #${missing.number}`,
      `ジャにのちゃんねる #${missing.number}`,
      `よにのちゃんねる ${missing.location}`,
      `二宮和也 山田涼介 菊池風磨 ${missing.area}`
    ]
    
    console.log(`${i + 1}. エピソード #${missing.number} (${missing.location}):`)
    queries.forEach((query, j) => {
      console.log(`   ${j + 1}) "${query}"`)
    })
    console.log('')
  })
  
  console.log('💡 これらのクエリでYouTubeを検索し、該当動画を特定してください')
  console.log('🎯 見つかった動画のURL、タイトル、投稿日を記録してください')
}

async function createEpisodeTemplate(results: any[]) {
  console.log('\n📋 新規エピソード作成テンプレート\n')
  
  const missingResults = results.filter(r => !r.found)
  
  if (missingResults.length === 0) {
    return
  }
  
  console.log('// 新規エピソード作成用テンプレート')
  console.log('const newEpisodes = [')
  
  missingResults.forEach((missing, i) => {
    console.log(`  {`)
    console.log(`    title: '#${missing.number}【要確認】${missing.expectedTitle}',`)
    console.log(`    video_url: '// YouTubeから取得したURL',`)
    console.log(`    date: '// YYYY-MM-DDTHH:mm:ssZ形式',`)
    console.log(`    description: '${missing.location}での朝食シリーズ',`)
    console.log(`    celebrity_id: '// よにのちゃんねるのID',`)
    console.log(`    location: {`)
    console.log(`      name: '${missing.location}',`)
    console.log(`      address: '${missing.address}',`)
    console.log(`      category: '${missing.category}'`)
    console.log(`    }`)
    console.log(`  }${i < missingResults.length - 1 ? ',' : ''}`)
  })
  
  console.log(']')
  console.log('')
  console.log('💡 YouTube調査後、このテンプレートを使用してエピソードを作成してください')
}

// メイン実行
async function main() {
  try {
    console.log('🔍 本番不足エピソード調査開始\n')
    
    const numberedEpisodes = await checkCurrentEpisodes()
    const results = await searchForMissingEpisodes(numberedEpisodes)
    
    console.log('='.repeat(60))
    console.log('📊 調査結果サマリー')
    console.log('='.repeat(60))
    
    const foundCount = results.filter(r => r.found).length
    const missingCount = results.filter(r => !r.found).length
    
    console.log(`✅ 本番に存在: ${foundCount}件`)
    console.log(`❌ 本番に不足: ${missingCount}件`)
    
    if (foundCount > 0) {
      console.log('\n✅ 本番に存在するエピソード:')
      results.filter(r => r.found).forEach(r => {
        console.log(`   #${r.number}: ${r.location}`)
      })
    }
    
    if (missingCount > 0) {
      console.log('\n❌ 本番に不足するエピソード:')
      results.filter(r => !r.found).forEach(r => {
        console.log(`   #${r.number}: ${r.location} (${r.area})`)
      })
      
      await generateYouTubeSearchQueries(results)
      await createEpisodeTemplate(results)
    }
    
    console.log('\n🎯 次のステップ:')
    if (missingCount > 0) {
      console.log('1. 上記クエリでYouTube検索実行')
      console.log('2. 該当動画の詳細情報収集')
      console.log('3. エピソード作成スクリプト実行')
      console.log('4. ロケーション情報との関連付け')
    } else {
      console.log('1. すべてのエピソードが本番に存在するため、ロケーション情報の追加のみ実施')
    }
    
  } catch (error) {
    console.error('❌ エピソード調査エラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}