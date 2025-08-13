require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// ユーザー体験を改善するための品質フィルタ
const QUALITY_FILTERS = {
  // 除外すべき曖昧なロケーション
  excludeAmbiguous: [
    'ドライブスルー', // 具体店舗名がない
    'グルメ', // 抽象的すぎる  
    '新店舗', // 具体性がない
    'レストラン', // 一般的すぎる
    'カフェ' // 具体店舗名がない場合
  ],
  
  // 保持すべき具体的なロケーション
  keepSpecific: [
    'スシロー', 'CoCo壱番屋', '焼肉ライク', 'びっくりドンキー', 
    '富士そば', 'はなまるうどん', '日高屋', 'スターバックス',
    'マクドナルド', 'ガスト', 'サイゼリヤ', 'もつ鍋専門店',
    '唐揚げ専門店', 'サービスエリア内レストラン'
  ],
  
  // 信頼度による判定
  minConfidenceForDisplay: 40, // 表示する最低信頼度
  confirmedThreshold: 80, // 確定とみなす信頼度
  
  // ユーザー確認ステータス
  verificationStatus: {
    ESTIMATED: 'estimated', // 推定
    USER_CONFIRMED: 'user_confirmed', // ユーザー確認済み
    VERIFIED: 'verified' // 確定（複数ユーザー確認など）
  }
}

async function improveLocationQuality() {
  console.log('🔧 ロケーション品質改善開始')
  console.log('🎯 目標: ユーザー体験の向上\n')
  
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('name', 'よにのちゃんねる')
    .single()

  // 現在のロケーション一覧取得
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('celebrity_id', celebrity.id)

  console.log(`📍 分析対象: ${locations.length}件のロケーション\n`)

  const analysis = {
    total: locations.length,
    shouldRemove: [],
    shouldKeep: [],
    needsImprovement: [],
    highQuality: []
  }

  // 品質分析
  locations.forEach(location => {
    const confidence = extractConfidence(location.tags)
    
    if (QUALITY_FILTERS.excludeAmbiguous.includes(location.name)) {
      analysis.shouldRemove.push({
        ...location,
        reason: '曖昧すぎる（具体店舗名なし）',
        confidence
      })
    } else if (QUALITY_FILTERS.keepSpecific.includes(location.name)) {
      analysis.highQuality.push({
        ...location,
        confidence
      })
    } else if (confidence < QUALITY_FILTERS.minConfidenceForDisplay) {
      analysis.shouldRemove.push({
        ...location,
        reason: '信頼度が低すぎる',
        confidence
      })
    } else {
      analysis.shouldKeep.push({
        ...location,
        confidence
      })
    }
  })

  // 分析結果表示
  console.log('📊 品質分析結果:')
  console.log(`  高品質（具体店舗名）: ${analysis.highQuality.length}件`)
  console.log(`  保持可能: ${analysis.shouldKeep.length}件`)
  console.log(`  削除推奨: ${analysis.shouldRemove.length}件\n`)

  // 削除推奨の詳細
  if (analysis.shouldRemove.length > 0) {
    console.log('❌ 削除推奨ロケーション:')
    analysis.shouldRemove.forEach(loc => {
      console.log(`  - ${loc.name} (${loc.reason}, 信頼度: ${loc.confidence}%)`)
    })
    console.log()
  }

  // 高品質ロケーションの表示
  console.log('✅ 高品質ロケーション:')
  analysis.highQuality.forEach(loc => {
    const status = loc.confidence >= QUALITY_FILTERS.confirmedThreshold ? '確定候補' : '推定'
    console.log(`  - ${loc.name} (信頼度: ${loc.confidence}%, ${status})`)
  })

  // 実際に削除実行（曖昧なもののみ）
  console.log('\n🗑️ 曖昧なロケーションを削除中...')
  
  const ambiguousLocations = analysis.shouldRemove.filter(loc => 
    QUALITY_FILTERS.excludeAmbiguous.includes(loc.name)
  )

  for (const location of ambiguousLocations) {
    // 関連する episode_locations も削除
    await supabase
      .from('episode_locations')
      .delete()
      .eq('location_id', location.id)

    // ロケーション削除
    await supabase
      .from('locations')
      .delete()
      .eq('id', location.id)

    console.log(`  ✅ 削除完了: ${location.name}`)
  }

  // verification_statusカラムの追加提案（スキーマ変更が必要）
  console.log('\n🔄 推奨スキーマ改善:')
  console.log('  locations テーブルに verification_status カラム追加')
  console.log('  - "estimated": 推定ロケーション')
  console.log('  - "user_confirmed": ユーザー確認済み') 
  console.log('  - "verified": 確定')

  // 最終結果確認
  const { count: finalLocationCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact' })
    .eq('celebrity_id', celebrity.id)

  const { count: finalLinkCount } = await supabase
    .from('episode_locations')
    .select('episode_id', { count: 'exact' })

  console.log('\n📊 改善後の状況:')
  console.log(`  総ロケーション数: ${locations.length}件 → ${finalLocationCount}件`)
  console.log(`  削除済み: ${locations.length - finalLocationCount}件`)
  console.log(`  総紐づけ数: ${finalLinkCount}件`)

  const { data: episodes } = await supabase
    .from('episodes')
    .select('*', { count: 'exact' })
    .eq('celebrity_id', celebrity.id)

  const improvedRate = ((finalLinkCount / episodes.length) * 100).toFixed(1)
  console.log(`  改善後検出率: ${improvedRate}%`)

  console.log('\n🎯 次のステップ:')
  console.log('  1. フロントエンドに「推定ロケーション」表示を追加')
  console.log('  2. ユーザー確認機能の実装') 
  console.log('  3. verification_status による段階的信頼度表示')

  return {
    removed: ambiguousLocations.length,
    remaining: finalLocationCount,
    improvedRate: parseFloat(improvedRate)
  }
}

// tagsから信頼度を抽出
function extractConfidence(tags) {
  if (!tags || !Array.isArray(tags)) return 0
  
  const confidenceTag = tags.find(tag => tag.includes('信頼度'))
  if (!confidenceTag) return 0
  
  const match = confidenceTag.match(/(\d+)%/)
  return match ? parseInt(match[1]) : 0
}

// メイン実行
async function main() {
  try {
    await improveLocationQuality()
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { improveLocationQuality }