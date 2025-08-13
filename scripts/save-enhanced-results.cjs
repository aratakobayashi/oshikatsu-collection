require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')
const { enhancedLocationDetection, ENHANCED_LOCATION_DETECTION } = require('./enhanced-detection-system.cjs')

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// 強化版検出結果をデータベースに保存
async function saveEnhancedResults() {
  console.log('💾 強化版検出結果をデータベースに保存中...\n')
  
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('name', 'よにのちゃんねる')
    .single()

  // 全てのよにのちゃんねるエピソードを取得
  const { data: episodes } = await supabase
    .from('episodes')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .order('date', { ascending: false })

  console.log(`📺 分析対象: ${episodes.length}件のエピソード`)

  const saveResults = {
    processed: 0,
    detections: 0,
    saved: 0,
    errors: 0
  }

  for (const episode of episodes) {
    try {
      saveResults.processed++
      
      // 強化版検出を実行
      const detection = enhancedLocationDetection(episode)
      
      if (detection.estimatedStore && detection.overallConfidence >= 60) {
        saveResults.detections++
        
        const store = detection.estimatedStore
        // slugを生成（店舗名をURL安全な形式に変換）
        const generateSlug = (name) => {
          const baseSlug = name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // 特殊文字を除去
            .replace(/\s+/g, '-') // スペースをハイフンに
            .trim()
          
          // ユニークにするために店舗名とセレブIDを組み合わせ
          return `${baseSlug}-${celebrity.id.substring(0, 8)}`
        }

        const locationData = {
          id: randomUUID(),
          name: store.name,
          slug: generateSlug(store.name),
          tags: [store.category, `信頼度${store.confidence}%`, `検出方法:${detection.detectionMethod.join(',')}`],
          celebrity_id: celebrity.id,
          created_at: new Date().toISOString()
        }

        // 既存のlocationをチェック（nameとslugの両方で確認）
        const { data: existingLocation } = await supabase
          .from('locations')
          .select('*')
          .or(`name.eq.${store.name},slug.eq.${generateSlug(store.name)}`)
          .eq('celebrity_id', celebrity.id)
          .single()

        let savedLocation = existingLocation

        if (!existingLocation) {
          // 新規作成
          const { data: newLocation, error: locationError } = await supabase
            .from('locations')
            .insert(locationData)
            .select()
            .single()

          if (locationError) {
            console.error(`❌ location作成エラー (${episode.title}):`, locationError.message)
            saveResults.errors++
            continue
          }
          savedLocation = newLocation
        }


        // episode_locationsテーブルに関連付け（confidenceフィールドを除外）
        const episodeLocationData = {
          id: randomUUID(),
          episode_id: episode.id,
          location_id: savedLocation.id,
          created_at: new Date().toISOString()
        }

        // 既存の関連付けをチェック
        const { data: existingEpisodeLocation } = await supabase
          .from('episode_locations')
          .select('*')
          .eq('episode_id', episode.id)
          .eq('location_id', savedLocation.id)
          .single()

        let episodeLocationError = null
        if (!existingEpisodeLocation) {
          const { error } = await supabase
            .from('episode_locations')
            .insert(episodeLocationData)
          episodeLocationError = error
        }

        if (episodeLocationError) {
          console.error(`❌ episode_location保存エラー (${episode.title}):`, episodeLocationError.message)
          saveResults.errors++
        } else {
          saveResults.saved++
          console.log(`✅ 保存完了: ${episode.title.substring(0, 40)} → ${store.name}`)
        }
      }
      
    } catch (error) {
      console.error(`❌ エピソード処理エラー (${episode.title}):`, error.message)
      saveResults.errors++
    }
  }

  // 結果サマリー
  console.log('\n' + '=' * 60)
  console.log('💾 データベース保存結果')
  console.log('=' * 60)
  console.log(`処理済み: ${saveResults.processed}件`)
  console.log(`検出成功: ${saveResults.detections}件`)
  console.log(`保存成功: ${saveResults.saved}件`)
  console.log(`エラー: ${saveResults.errors}件`)
  
  const detectionRate = ((saveResults.detections / saveResults.processed) * 100).toFixed(1)
  const saveRate = saveResults.detections > 0 ? ((saveResults.saved / saveResults.detections) * 100).toFixed(1) : 0
  
  console.log(`\n📊 統計:`)
  console.log(`検出率: ${detectionRate}%`)
  console.log(`保存成功率: ${saveRate}%`)

  // 保存された店舗の分布を確認
  const { data: savedLocations } = await supabase
    .from('locations')
    .select('name, tags')
    .eq('celebrity_id', celebrity.id)
    .order('created_at', { ascending: false })

  if (savedLocations?.length > 0) {
    console.log(`\n🏪 保存済み店舗 (${savedLocations.length}件):`)
    const categoryCount = {}
    
    savedLocations.forEach(location => {
      const category = location.tags?.[0] || '未分類'
      categoryCount[category] = (categoryCount[category] || 0) + 1
      console.log(`  ${location.name} (${category})`)
    })
    
    console.log(`\n📈 カテゴリ分布:`)
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}件`)
    })
  }

  return saveResults
}

// メイン実行
async function main() {
  try {
    await saveEnhancedResults()
  } catch (error) {
    console.error('❌ メインエラー:', error)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { saveEnhancedResults }