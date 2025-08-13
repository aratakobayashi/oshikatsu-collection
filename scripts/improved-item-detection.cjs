require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// 改良されたアイテム検出パターン（より寛容で実用的）
const IMPROVED_ITEM_PATTERNS = {
  // ファッションアイテム - より広範囲な検出
  'clothing': {
    'tops': {
      keywords: ['服', '着てる', '着用', 'outfit', 'コーデ', 'coordinate', 'ファッション', 'おしゃれ', 'スタイル'],
      specific: ['Tシャツ', 'シャツ', 'パーカー', 'ニット', 'セーター', 'ブラウス', 'カットソー'],
      confidence: 40
    },
    'bottoms': {
      keywords: ['パンツ', 'ズボン', 'ジーンズ', 'デニム', 'スカート', 'ショーツ'],
      confidence: 50
    },
    'outerwear': {
      keywords: ['ジャケット', 'コート', 'アウター', 'カーディガン'],
      confidence: 55
    }
  },

  // アクセサリー（より寛容な検出）
  'accessories': {
    'headwear': {
      keywords: ['帽子', 'キャップ', 'ハット', 'ニット帽', 'ベレー帽'],
      confidence: 60
    },
    'eyewear': {
      keywords: ['サングラス', 'メガネ', '眼鏡', 'グラス'],
      confidence: 65
    },
    'jewelry': {
      keywords: ['ネックレス', 'ピアス', 'イヤリング', '指輪', 'リング', 'ブレスレット', '時計', 'アクセサリー'],
      confidence: 50
    }
  },

  // バッグ・小物
  'bags': {
    'all_bags': {
      keywords: ['バッグ', 'リュック', 'かばん', 'カバン', 'ショルダー', 'トート', 'ハンド'],
      confidence: 55
    },
    'wallet': {
      keywords: ['財布', 'ウォレット'],
      confidence: 70
    }
  },

  // シューズ
  'shoes': {
    'all_shoes': {
      keywords: ['靴', 'シューズ', 'スニーカー', 'ブーツ', 'サンダル', 'パンプス'],
      confidence: 60
    }
  },

  // ショッピング・購入関連（重要なコンテキスト）
  'shopping_context': {
    'purchase': {
      keywords: ['買った', '購入', 'GET', 'ゲット', 'ショッピング', '買い物', 'new', 'ニュー'],
      confidence: 30
    },
    'trying_on': {
      keywords: ['試着', '着てみた', 'コーデ', 'outfit'],
      confidence: 35
    },
    'gift': {
      keywords: ['プレゼント', 'ギフト', 'もらった', 'いただいた'],
      confidence: 40
    }
  }
}

// 人気ブランドパターン（日本での一般的な表記含む）
const BRAND_PATTERNS = {
  'fast_fashion': {
    keywords: ['ユニクロ', 'UNIQLO', 'GU', 'ジーユー', 'ZARA', 'ザラ', 'H&M'],
    confidence: 60
  },
  'sports': {
    keywords: ['ナイキ', 'Nike', 'NIKE', 'アディダス', 'adidas', 'プーマ', 'PUMA', 'ニューバランス'],
    confidence: 65
  },
  'luxury': {
    keywords: ['グッチ', 'GUCCI', 'シャネル', 'CHANEL', 'ルイヴィトン', 'ヴィトン', 'LV'],
    confidence: 80
  }
}

// 改良された検出関数
function detectItemsImproved(title, description) {
  const combinedText = `${title} ${description}`.toLowerCase()
  const results = {
    items: [],
    brands: [],
    shopping_context: [],
    total_confidence: 0,
    detection_summary: ''
  }

  let totalMatches = 0
  let totalScore = 0

  // 1. アイテムカテゴリ検出
  Object.entries(IMPROVED_ITEM_PATTERNS).forEach(([category, subcategories]) => {
    Object.entries(subcategories).forEach(([subcat, config]) => {
      const matches = config.keywords.filter(keyword => 
        combinedText.includes(keyword.toLowerCase())
      )
      
      if (matches.length > 0) {
        const itemConfidence = Math.min(config.confidence + (matches.length * 10), 100)
        results.items.push({
          category,
          subcategory: subcat,
          matches,
          confidence: itemConfidence
        })
        totalMatches += matches.length
        totalScore += itemConfidence
      }
    })
  })

  // 2. ブランド検出
  Object.entries(BRAND_PATTERNS).forEach(([brandCategory, config]) => {
    const matches = config.keywords.filter(keyword =>
      combinedText.includes(keyword.toLowerCase())
    )
    
    if (matches.length > 0) {
      results.brands.push({
        category: brandCategory,
        matches,
        confidence: Math.min(config.confidence + (matches.length * 15), 100)
      })
      totalScore += config.confidence
    }
  })

  // 3. 総合信頼度計算（より実用的）
  if (totalMatches > 0) {
    // ベース信頼度：マッチ数とカテゴリの多様性を考慮
    let baseConfidence = Math.min(totalMatches * 15, 60)
    
    // ボーナス要素
    if (results.brands.length > 0) baseConfidence += 20
    if (results.items.some(item => item.category === 'shopping_context')) baseConfidence += 15
    if (title.toLowerCase().includes('コーデ') || title.toLowerCase().includes('ファッション')) baseConfidence += 10
    
    results.total_confidence = Math.min(baseConfidence, 95)
  }

  // 4. 検出サマリー生成
  if (results.items.length > 0) {
    const categories = [...new Set(results.items.map(item => item.category))]
    results.detection_summary = `${categories.join(', ')}関連のアイテム`
    
    if (results.brands.length > 0) {
      results.detection_summary += ` (${results.brands.map(b => b.matches[0]).join(', ')})`
    }
  }

  return results
}

// データベース保存機能
async function saveDetectedItems(episodeId, detectionResults) {
  if (detectionResults.total_confidence < 30) {
    return { saved: false, reason: 'confidence_too_low' }
  }

  try {
    // 既存のアイテム関連付けをチェック
    const { data: existing } = await supabase
      .from('episode_items')
      .select('*')
      .eq('episode_id', episodeId)

    if (existing && existing.length > 0) {
      return { saved: false, reason: 'already_exists' }
    }

    const itemsToSave = []

    // 高信頼度のアイテムのみ保存
    for (const item of detectionResults.items) {
      if (item.confidence >= 40) {
        // アイテムレコード作成/取得
        const itemName = `${item.category}_${item.subcategory}`
        const { data: itemRecord, error: itemError } = await supabase
          .from('items')
          .upsert({
            name: itemName,
            slug: itemName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            category: item.category,
            description: `自動検出: ${item.matches.join(', ')}`,
            tags: item.matches,
            celebrity_id: await getCelebrityId()
          }, { 
            onConflict: 'slug',
            ignoreDuplicates: false 
          })
          .select()
          .single()

        if (!itemError && itemRecord) {
          itemsToSave.push({
            episode_id: episodeId,
            item_id: itemRecord.id,
            confidence: item.confidence,
            detection_method: 'auto_improved',
            metadata: {
              keywords: item.matches,
              category: item.category,
              subcategory: item.subcategory
            }
          })
        }
      }
    }

    // エピソード-アイテム関連付け保存
    if (itemsToSave.length > 0) {
      const { error: linkError } = await supabase
        .from('episode_items')
        .insert(itemsToSave)

      if (linkError) {
        console.error('Link save error:', linkError)
        return { saved: false, reason: 'link_error' }
      }

      return { saved: true, items_count: itemsToSave.length }
    }

    return { saved: false, reason: 'no_high_confidence_items' }

  } catch (error) {
    console.error('Save error:', error)
    return { saved: false, reason: 'database_error' }
  }
}

async function getCelebrityId() {
  const { data } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  return data?.id
}

// メイン分析実行
async function runImprovedItemDetection() {
  console.log('🔍 改良アイテム検出システム実行開始\n')
  
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  const { data: episodes } = await supabase
    .from('episodes')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .order('date', { ascending: false })
    .limit(100) // より多くのエピソードで検証

  console.log(`📺 分析対象: ${episodes.length}件のエピソード\n`)

  const statistics = {
    total: episodes.length,
    detected: 0,
    saved: 0,
    high_confidence: 0,
    category_stats: {},
    brand_stats: {}
  }

  for (let i = 0; i < episodes.length; i++) {
    const episode = episodes[i]
    console.log(`\n🔍 分析中 (${i + 1}/${episodes.length}): ${episode.title}`)
    
    const detection = detectItemsImproved(episode.title || '', episode.description || '')
    
    if (detection.items.length > 0 || detection.brands.length > 0) {
      statistics.detected++
      
      if (detection.total_confidence >= 50) {
        statistics.high_confidence++
      }
      
      console.log(`  ✅ 検出成功 (信頼度: ${detection.total_confidence}%)`)
      console.log(`  📝 ${detection.detection_summary}`)
      
      // 詳細表示
      detection.items.forEach(item => {
        console.log(`    - ${item.category}/${item.subcategory}: ${item.matches.join(', ')} (${item.confidence}%)`)
        
        // 統計更新
        const key = `${item.category}-${item.subcategory}`
        statistics.category_stats[key] = (statistics.category_stats[key] || 0) + 1
      })
      
      detection.brands.forEach(brand => {
        console.log(`    🏷️  ブランド: ${brand.matches.join(', ')} (${brand.confidence}%)`)
        statistics.brand_stats[brand.category] = (statistics.brand_stats[brand.category] || 0) + 1
      })
      
      // データベース保存（テスト）
      const saveResult = await saveDetectedItems(episode.id, detection)
      if (saveResult.saved) {
        statistics.saved++
        console.log(`    💾 保存完了: ${saveResult.items_count}件`)
      } else {
        console.log(`    ⚠️  保存スキップ: ${saveResult.reason}`)
      }
      
    } else {
      console.log('  ⚪ アイテム検出なし')
    }
  }

  // 最終レポート
  console.log('\n📊 改良アイテム検出 最終レポート')
  console.log('=' * 50)
  console.log(`\n📈 検出統計:`)
  console.log(`  総エピソード数: ${statistics.total}件`)
  console.log(`  検出成功: ${statistics.detected}件 (${((statistics.detected / statistics.total) * 100).toFixed(1)}%)`)
  console.log(`  高信頼度: ${statistics.high_confidence}件 (${((statistics.high_confidence / statistics.total) * 100).toFixed(1)}%)`)
  console.log(`  DB保存済み: ${statistics.saved}件`)

  // カテゴリ別統計
  console.log(`\n📦 カテゴリ別検出数:`)
  Object.entries(statistics.category_stats)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count}件`)
    })

  // ブランド統計
  if (Object.keys(statistics.brand_stats).length > 0) {
    console.log(`\n🏷️  ブランド検出数:`)
    Object.entries(statistics.brand_stats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([brand, count]) => {
        console.log(`  ${brand}: ${count}件`)
      })
  }

  console.log('\n🎯 改善結果:')
  console.log(`  元の検出率: 0% → 改良後: ${((statistics.detected / statistics.total) * 100).toFixed(1)}%`)
  console.log(`  実用的検出 (信頼度50%以上): ${((statistics.high_confidence / statistics.total) * 100).toFixed(1)}%`)
  
  return statistics
}

// メイン実行
async function main() {
  try {
    await runImprovedItemDetection()
    console.log('\n🎉 改良アイテム検出システム完了!')
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { 
  detectItemsImproved, 
  runImprovedItemDetection,
  IMPROVED_ITEM_PATTERNS,
  BRAND_PATTERNS
}