require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// 実用的なロケーション検出システム（前回のコードから）
const PRACTICAL_LOCATION_DETECTION = {
  definiteStores: [
    // 回転寿司
    { name: 'スシロー', category: '回転寿司', confidence: 95 },
    { name: 'はま寿司', category: '回転寿司', confidence: 95 },
    { name: 'かっぱ寿司', category: '回転寿司', confidence: 95 },
    { name: 'くら寿司', category: '回転寿司', confidence: 95 },
    
    // ファストフード
    { name: 'マクドナルド', category: 'ファストフード', confidence: 95 },
    { name: 'マック', category: 'ファストフード', confidence: 90 },
    { name: 'モスバーガー', category: 'ファストフード', confidence: 95 },
    { name: 'バーガーキング', category: 'ファストフード', confidence: 95 },
    { name: 'ケンタッキー', category: 'ファストフード', confidence: 95 },
    { name: 'KFC', category: 'ファストフード', confidence: 90 },
    
    // 牛丼チェーン
    { name: 'すき家', category: '牛丼チェーン', confidence: 95 },
    { name: '松屋', category: '牛丼チェーン', confidence: 95 },
    { name: '吉野家', category: '牛丼チェーン', confidence: 95 },
    { name: 'なか卯', category: '牛丼チェーン', confidence: 95 },
    
    // カフェ
    { name: 'スターバックス', category: 'カフェ', confidence: 95 },
    { name: 'スタバ', category: 'カフェ', confidence: 90 },
    { name: 'ドトール', category: 'カフェ', confidence: 95 },
    { name: 'タリーズ', category: 'カフェ', confidence: 95 },
    { name: 'コメダ珈琲', category: 'カフェ', confidence: 95 },
    { name: 'ベローチェ', category: 'カフェ', confidence: 95 },
    { name: 'エクセルシオール', category: 'カフェ', confidence: 95 },
    
    // ファミレス
    { name: 'ガスト', category: 'ファミリーレストラン', confidence: 95 },
    { name: 'サイゼリヤ', category: 'ファミリーレストラン', confidence: 95 },
    { name: 'ジョナサン', category: 'ファミリーレストラン', confidence: 95 },
    { name: 'デニーズ', category: 'ファミリーレストラン', confidence: 95 },
    { name: 'ロイヤルホスト', category: 'ファミリーレストラン', confidence: 95 },
    { name: 'ビッグボーイ', category: 'ファミリーレストラン', confidence: 95 },
    
    // ラーメン
    { name: '一蘭', category: 'ラーメン', confidence: 95 },
    { name: '一風堂', category: 'ラーメン', confidence: 95 },
    { name: '天下一品', category: 'ラーメン', confidence: 95 },
    { name: '日高屋', category: 'ラーメン', confidence: 95 },
    
    // その他チェーン
    { name: 'CoCo壱番屋', category: 'カレー', confidence: 95 },
    { name: 'ココイチ', category: 'カレー', confidence: 90 },
    { name: '大戸屋', category: '定食', confidence: 95 },
    { name: 'やよい軒', category: '定食', confidence: 95 }
  ],

  areas: [
    { name: '東京', type: '都道府県', confidence: 85 },
    { name: '渋谷', type: '区域', confidence: 90 },
    { name: '新宿', type: '区域', confidence: 90 },
    { name: '原宿', type: '区域', confidence: 90 },
    { name: '六本木', type: '区域', confidence: 90 },
    { name: '池袋', type: '区域', confidence: 90 },
    { name: '銀座', type: '区域', confidence: 90 },
    { name: '福岡', type: '都道府県', confidence: 85 },
    { name: '大阪', type: '都道府県', confidence: 85 },
    { name: '鎌倉', type: '市', confidence: 85 },
    { name: '横浜', type: '市', confidence: 85 }
  ],

  mealContext: [
    '朝食', '朝飯', '朝ごはん', 'モーニング',
    'ランチ', '昼食', '昼飯',
    '夕食', '夜飯', '晩飯', 'ディナー'
  ]
}

// ロケーション検出関数
function detectPracticalLocation(title, description) {
  const combinedText = `${title} ${description}`.toLowerCase()
  const results = {
    detectedStores: [],
    detectedAreas: [],
    mealContext: null,
    overallConfidence: 0,
    tags: []
  }

  // 店舗名検出
  PRACTICAL_LOCATION_DETECTION.definiteStores.forEach(store => {
    if (combinedText.includes(store.name.toLowerCase())) {
      results.detectedStores.push(store)
      results.tags.push(`店舗:${store.name}`)
      results.tags.push(`カテゴリ:${store.category}`)
    }
  })

  // エリア検出
  PRACTICAL_LOCATION_DETECTION.areas.forEach(area => {
    if (combinedText.includes(area.name.toLowerCase())) {
      results.detectedAreas.push(area)
      results.tags.push(`エリア:${area.name}`)
    }
  })

  // 食事コンテキスト検出
  const mealMatch = PRACTICAL_LOCATION_DETECTION.mealContext.find(meal =>
    combinedText.includes(meal.toLowerCase())
  )
  if (mealMatch) {
    results.mealContext = mealMatch
    results.tags.push(`食事:${mealMatch}`)
  }

  // 信頼度計算
  if (results.detectedStores.length > 0) {
    const maxConfidence = Math.max(...results.detectedStores.map(s => s.confidence))
    results.overallConfidence = maxConfidence
  } else if (results.detectedAreas.length > 0) {
    const maxConfidence = Math.max(...results.detectedAreas.map(a => a.confidence))
    results.overallConfidence = maxConfidence * 0.6
  } else if (results.mealContext) {
    results.overallConfidence = 30
  }

  return results
}

// locations テーブルに保存
async function saveLocationData(locationData, celebrityId) {
  try {
    // 既存チェック
    const { data: existing } = await supabase
      .from('locations')
      .select('id')
      .eq('name', locationData.name)
      .eq('celebrity_id', celebrityId)
      .single()

    if (existing) {
      console.log(`  ⏭️  既存: ${locationData.name}`)
      return existing.id
    }

    // slugを生成（名前から）
    const slug = locationData.name
      .toLowerCase()
      .replace(/[^a-z0-9ぁ-んァ-ヶー一-龯]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    // 新規作成
    const { data, error } = await supabase
      .from('locations')
      .insert({
        id: randomUUID(),
        name: locationData.name,
        slug: slug,
        description: locationData.description || `${locationData.name} - よにのちゃんねるで訪問された店舗`,
        address: locationData.address || '',
        tags: [locationData.category], // categoryをtagsに変換
        celebrity_id: celebrityId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error(`  ❌ 保存エラー: ${error.message}`)
      return null
    }

    console.log(`  ✅ 新規保存: ${locationData.name}`)
    return data.id

  } catch (error) {
    console.error(`  ❌ エラー: ${error}`)
    return null
  }
}

// episode_locations 関連テーブルに保存
async function linkEpisodeToLocation(episodeId, locationId) {
  try {
    // 既存チェック
    const { data: existing } = await supabase
      .from('episode_locations')
      .select('id')
      .eq('episode_id', episodeId)
      .eq('location_id', locationId)
      .single()

    if (existing) {
      return true
    }

    // 新規リンク作成
    const { error } = await supabase
      .from('episode_locations')
      .insert({
        id: randomUUID(),
        episode_id: episodeId,
        location_id: locationId,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error(`  ❌ リンクエラー: ${error.message}`)
      return false
    }

    return true

  } catch (error) {
    console.error(`  ❌ エラー: ${error}`)
    return false
  }
}

// メイン処理
async function processAndSaveLocationDetection() {
  console.log('🚀 実用的ロケーション検出 & データ保存開始\n')

  // よにのちゃんねるの推しIDを取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('name', 'よにのちゃんねる')
    .single()

  if (!celebrity) {
    console.error('❌ よにのちゃんねるが見つかりません')
    return
  }

  // 全エピソード取得
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .order('date', { ascending: false })

  if (error || !episodes) {
    console.error('❌ エピソード取得エラー:', error)
    return
  }

  console.log(`📺 分析対象: ${episodes.length}件のエピソード\n`)

  const statistics = {
    totalAnalyzed: episodes.length,
    storeDetected: 0,
    areaDetected: 0,
    locationsCreated: 0,
    linksCreated: 0,
    detectedStoreTypes: {}
  }

  for (let i = 0; i < episodes.length; i++) {
    const episode = episodes[i]
    
    // 進捗表示
    if (i % 50 === 0) {
      console.log(`\n📊 進行状況: ${i}/${episodes.length} (${((i / episodes.length) * 100).toFixed(1)}%)\n`)
    }

    // ロケーション検出
    const detection = detectPracticalLocation(
      episode.title || '',
      episode.description || ''
    )

    // 店舗が検出された場合
    if (detection.detectedStores.length > 0) {
      console.log(`\n🔍 [${i + 1}] ${episode.title}`)
      statistics.storeDetected++

      for (const store of detection.detectedStores) {
        console.log(`  🏪 検出: ${store.name} (${store.category})`)
        
        // 統計更新
        statistics.detectedStoreTypes[store.category] = 
          (statistics.detectedStoreTypes[store.category] || 0) + 1

        // locations テーブルに保存
        const locationId = await saveLocationData({
          name: store.name,
          category: store.category,
          description: `${store.name} - よにのちゃんねるで訪問された店舗`
        }, celebrity.id)

        if (locationId) {
          statistics.locationsCreated++

          // エピソードとロケーションをリンク
          const linked = await linkEpisodeToLocation(episode.id, locationId)
          if (linked) {
            statistics.linksCreated++
            console.log(`  🔗 リンク作成完了`)
          }
        }
      }
    }

    // エリアが検出された場合（店舗がない場合のみ記録）
    if (detection.detectedStores.length === 0 && detection.detectedAreas.length > 0) {
      statistics.areaDetected++
    }

    // タグ情報をエピソードに追加（tags列が存在する場合）
    if (detection.tags.length > 0) {
      try {
        await supabase
          .from('episodes')
          .update({ 
            tags: detection.tags,
            updated_at: new Date().toISOString()
          })
          .eq('id', episode.id)
      } catch (tagError) {
        // tags列がない場合はスキップ
      }
    }
  }

  // 最終統計表示
  console.log('\n' + '=' * 60)
  console.log('📊 最終統計レポート')
  console.log('=' * 60)
  console.log(`\n🎯 検出結果:`)
  console.log(`  総分析エピソード数: ${statistics.totalAnalyzed}件`)
  console.log(`  店舗検出エピソード: ${statistics.storeDetected}件 (${((statistics.storeDetected / statistics.totalAnalyzed) * 100).toFixed(1)}%)`)
  console.log(`  エリアのみ検出: ${statistics.areaDetected}件`)

  console.log(`\n💾 データベース保存:`)
  console.log(`  新規ロケーション作成: ${statistics.locationsCreated}件`)
  console.log(`  エピソードリンク作成: ${statistics.linksCreated}件`)

  console.log(`\n🏪 検出店舗カテゴリ:`)
  const sortedTypes = Object.entries(statistics.detectedStoreTypes)
    .sort(([,a], [,b]) => b - a)
  sortedTypes.forEach(([type, count]) => {
    console.log(`  ${type}: ${count}件`)
  })

  console.log('\n🎉 ロケーション検出 & データ保存完了!')
}

// 実行
async function main() {
  try {
    await processAndSaveLocationDetection()
  } catch (error) {
    console.error('❌ 処理エラー:', error)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { 
  detectPracticalLocation,
  saveLocationData,
  linkEpisodeToLocation,
  processAndSaveLocationDetection
}