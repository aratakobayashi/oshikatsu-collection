require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')
const { enhancedLocationDetection, ENHANCED_LOCATION_DETECTION } = require('./enhanced-detection-system.cjs')

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// 既存店舗を活用して全エピソードに強化版検出を適用
async function applyEnhancedDetectionFixed() {
  console.log('🚀 全エピソードに強化版検出適用（既存店舗活用版）\n')
  
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('name', 'よにのちゃんねる')
    .single()

  // 既存店舗を取得
  const { data: existingLocations } = await supabase
    .from('locations')
    .select('*')
    .eq('celebrity_id', celebrity.id)

  console.log(`📍 既存店舗数: ${existingLocations?.length || 0}件`)

  // 全エピソードを取得
  const { data: episodes } = await supabase
    .from('episodes')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .order('date', { ascending: false })

  console.log(`📺 処理対象: ${episodes.length}件のエピソード\n`)

  const results = {
    processed: 0,
    detections: 0,
    newLocations: 0,
    newLinks: 0,
    existingLinks: 0,
    categories: {},
    detectedStores: new Set(),
    errors: 0
  }

  // 店舗名から既存ロケーションを検索するマップを作成
  const locationMap = new Map()
  existingLocations?.forEach(loc => {
    locationMap.set(loc.name, loc)
  })

  console.log('📊 処理開始...\n')

  for (const episode of episodes) {
    try {
      results.processed++
      
      if (results.processed % 50 === 0) {
        console.log(`⏳ 処理中... ${results.processed}/${episodes.length}件`)
      }
      
      const detection = enhancedLocationDetection(episode)
      
      if (detection.estimatedStore && detection.overallConfidence >= 50) {
        results.detections++
        const store = detection.estimatedStore
        results.detectedStores.add(store.name)
        
        // カテゴリ統計
        const category = store.category
        results.categories[category] = (results.categories[category] || 0) + 1
        
        let savedLocation = locationMap.get(store.name)
        
        // 既存店舗がない場合のみ新規作成
        if (!savedLocation) {
          const locationData = {
            id: randomUUID(),
            name: store.name,
            slug: generateSlug(store.name, celebrity.id, results.newLocations),
            tags: [category, `信頼度${store.confidence}%`],
            celebrity_id: celebrity.id,
            created_at: new Date().toISOString()
          }

          const { data: newLocation, error: locationError } = await supabase
            .from('locations')
            .insert(locationData)
            .select()
            .single()

          if (!locationError && newLocation) {
            savedLocation = newLocation
            locationMap.set(store.name, savedLocation)
            results.newLocations++
            console.log(`✅ 新規店舗追加: ${store.name}`)
          } else {
            results.errors++
            continue
          }
        }

        // エピソード-ロケーション紐づけ
        if (savedLocation) {
          // 既存紐づけチェック
          const { data: existingLink } = await supabase
            .from('episode_locations')
            .select('*')
            .eq('episode_id', episode.id)
            .eq('location_id', savedLocation.id)
            .single()

          if (!existingLink) {
            const episodeLocationData = {
              id: randomUUID(),
              episode_id: episode.id,
              location_id: savedLocation.id,
              created_at: new Date().toISOString()
            }

            const { error: linkError } = await supabase
              .from('episode_locations')
              .insert(episodeLocationData)
            
            if (!linkError) {
              results.newLinks++
            } else {
              results.errors++
            }
          } else {
            results.existingLinks++
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ エピソード処理エラー:`, error.message)
      results.errors++
    }
  }

  // 最終結果確認
  const { count: finalLocationCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact' })
    .eq('celebrity_id', celebrity.id)

  const { count: finalLinkCount } = await supabase
    .from('episode_locations')
    .select('episode_id', { count: 'exact' })

  // 結果サマリー
  console.log('\n' + '=' * 60)
  console.log('🎉 全エピソード処理完了！')
  console.log('=' * 60)
  
  console.log('\n📊 処理結果:')
  console.log(`  処理済みエピソード: ${results.processed}件`)
  console.log(`  検出成功: ${results.detections}件`)
  console.log(`  新規店舗: ${results.newLocations}件`)
  console.log(`  新規紐づけ: ${results.newLinks}件`)
  console.log(`  既存紐づけ: ${results.existingLinks}件`)
  console.log(`  エラー: ${results.errors}件`)
  
  const detectionRate = ((results.detections / results.processed) * 100).toFixed(1)
  const linkRate = ((results.newLinks / results.processed) * 100).toFixed(1)
  
  console.log(`\n🎯 検出率: ${detectionRate}%`)
  console.log(`🔗 紐づけ率: ${linkRate}%`)
  
  console.log('\n📍 最終データ状況:')
  console.log(`  総店舗数: ${finalLocationCount}件`)
  console.log(`  総紐づけ数: ${finalLinkCount}件`)
  
  // ファンサイト比較
  console.log('\n🆚 ファンサイト比較:')
  console.log(`  ファンサイト: 45% (朝食系20件のみ)`)
  console.log(`  我々のシステム: ${detectionRate}% (全341件)`)
  
  if (parseFloat(detectionRate) > 45) {
    console.log(`  🏆 ファンサイトを上回りました！`)
  } else {
    const gap = (45 - parseFloat(detectionRate)).toFixed(1)
    console.log(`  📈 ファンサイトまで: あと${gap}%ポイント`)
  }
  
  console.log('\n🏪 検出店舗一覧:')
  Array.from(results.detectedStores).forEach((store, index) => {
    console.log(`  ${index + 1}. ${store}`)
  })
  
  console.log('\n📈 カテゴリ分布:')
  Object.entries(results.categories)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count}件`)
    })

  return results
}

// 重複を避けるslug生成
function generateSlug(name, celebrityId, counter) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
  
  return `${baseSlug}-${celebrityId.substring(0, 8)}-${counter}`
}

// メイン実行
async function main() {
  try {
    await applyEnhancedDetectionFixed()
  } catch (error) {
    console.error('❌ メインエラー:', error)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { applyEnhancedDetectionFixed }