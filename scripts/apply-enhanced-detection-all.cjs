require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')
const { enhancedLocationDetection, ENHANCED_LOCATION_DETECTION } = require('./enhanced-detection-system.cjs')

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// 全341エピソードに強化版検出を適用
async function applyEnhancedDetectionToAll() {
  console.log('🚀 全エピソードに強化版ロケーション検出を適用開始！\n')
  console.log('🎯 目標: ファンサイトの45%を全エピソードで上回る\n')
  console.log('=' * 60)
  
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('name', 'よにのちゃんねる')
    .single()

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
    categories: {},
    confidenceDistribution: { high: 0, medium: 0, low: 0 },
    errors: 0,
    detectedStores: new Set()
  }

  console.log('📊 処理開始...\n')

  for (const episode of episodes) {
    try {
      results.processed++
      
      // 進捗表示
      if (results.processed % 50 === 0) {
        console.log(`⏳ 処理中... ${results.processed}/${episodes.length}件 (${((results.processed/episodes.length)*100).toFixed(1)}%)`)
      }
      
      // 強化版検出を実行
      const detection = enhancedLocationDetection(episode)
      
      if (detection.estimatedStore && detection.overallConfidence >= 50) {
        results.detections++
        
        const store = detection.estimatedStore
        results.detectedStores.add(store.name)
        
        // 信頼度分布
        if (store.confidence >= 80) results.confidenceDistribution.high++
        else if (store.confidence >= 60) results.confidenceDistribution.medium++
        else results.confidenceDistribution.low++
        
        // カテゴリ統計
        const category = store.category
        results.categories[category] = (results.categories[category] || 0) + 1
        
        // 店舗データの保存
        const locationData = {
          id: randomUUID(),
          name: store.name,
          slug: generateSlug(store.name, celebrity.id),
          tags: [category, `信頼度${store.confidence}%`, `検出方法:${detection.detectionMethod.join(',')}`],
          celebrity_id: celebrity.id,
          created_at: new Date().toISOString()
        }

        // 既存チェック
        const { data: existingLocation } = await supabase
          .from('locations')
          .select('*')
          .eq('name', store.name)
          .eq('celebrity_id', celebrity.id)
          .single()

        let savedLocation = existingLocation

        if (!existingLocation) {
          const { data: newLocation, error: locationError } = await supabase
            .from('locations')
            .insert(locationData)
            .select()
            .single()

          if (!locationError) {
            savedLocation = newLocation
            results.newLocations++
          } else {
            console.log(`⚠️  店舗保存エラー: ${store.name} - ${locationError.message}`)
            results.errors++
            continue
          }
        }

        // エピソード-ロケーション紐づけ
        const episodeLocationData = {
          id: randomUUID(),
          episode_id: episode.id,
          location_id: savedLocation.id,
          created_at: new Date().toISOString()
        }

        // 既存紐づけチェック
        const { data: existingLink } = await supabase
          .from('episode_locations')
          .select('*')
          .eq('episode_id', episode.id)
          .eq('location_id', savedLocation.id)
          .single()

        if (!existingLink) {
          const { error: linkError } = await supabase
            .from('episode_locations')
            .insert(episodeLocationData)
          
          if (!linkError) {
            results.newLinks++
          } else {
            console.log(`⚠️  紐づけエラー: ${episode.title.substring(0, 30)}... - ${linkError.message}`)
            results.errors++
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ エピソード処理エラー (${episode.title.substring(0, 30)}...):`, error.message)
      results.errors++
    }
  }

  // 結果サマリー
  console.log('\n' + '=' * 60)
  console.log('🎉 全エピソード処理完了！')
  console.log('=' * 60)
  
  console.log('\n📊 処理結果サマリー:')
  console.log(`  処理済み: ${results.processed}件`)
  console.log(`  検出成功: ${results.detections}件`)
  console.log(`  新規店舗: ${results.newLocations}件`)
  console.log(`  新規紐づけ: ${results.newLinks}件`)
  console.log(`  エラー: ${results.errors}件`)
  
  const detectionRate = ((results.detections / results.processed) * 100).toFixed(1)
  console.log(`\n🎯 検出率: ${detectionRate}%`)
  
  // ファンサイト比較
  console.log('\n🆚 ファンサイト比較:')
  console.log(`  ファンサイト: 45% (朝食系のみ)`)
  console.log(`  我々のシステム: ${detectionRate}% (全エピソード)`)
  
  if (parseFloat(detectionRate) > 45) {
    console.log(`  🏆 ファンサイトを上回りました！(+${(parseFloat(detectionRate) - 45).toFixed(1)}%ポイント)`)
  }
  
  console.log('\n🏪 検出店舗一覧:')
  Array.from(results.detectedStores).forEach(store => {
    console.log(`  - ${store}`)
  })
  
  console.log('\n📈 カテゴリ分布:')
  Object.entries(results.categories).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}件`)
  })
  
  console.log('\n🎖️ 信頼度分布:')
  console.log(`  高信頼度 (80%+): ${results.confidenceDistribution.high}件`)
  console.log(`  中信頼度 (60-79%): ${results.confidenceDistribution.medium}件`)
  console.log(`  低信頼度 (50-59%): ${results.confidenceDistribution.low}件`)

  return results
}

// slugを生成（店舗名をURL安全な形式に変換）
function generateSlug(name, celebrityId) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 特殊文字を除去
    .replace(/\s+/g, '-') // スペースをハイフンに
    .trim()
  
  // ユニークにするために店舗名とセレブIDを組み合わせ
  return `${baseSlug}-${celebrityId.substring(0, 8)}`
}

// メイン実行
async function main() {
  try {
    await applyEnhancedDetectionToAll()
  } catch (error) {
    console.error('❌ メインエラー:', error)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { applyEnhancedDetectionToAll }