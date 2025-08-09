/**
 * 本番データ品質チェックスクリプト
 * 収集したデータの整合性と品質を検証
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 必要な環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface ValidationResult {
  category: string
  total: number
  passed: number
  failed: number
  warnings: string[]
  errors: string[]
}

async function main() {
  console.log('🔍 本番データ品質チェック開始')
  console.log('=' .repeat(50))
  
  const results: ValidationResult[] = []
  
  // 1. チャンネル基本情報チェック
  console.log('📺 チャンネル情報検証中...')
  const channelResult = await validateChannels()
  results.push(channelResult)
  printResult(channelResult)
  
  // 2. 動画データチェック
  console.log('\n🎬 動画データ検証中...')
  const episodeResult = await validateEpisodes()
  results.push(episodeResult)
  printResult(episodeResult)
  
  // 3. データ関連性チェック
  console.log('\n🔗 データ関連性検証中...')
  const relationshipResult = await validateRelationships()
  results.push(relationshipResult)
  printResult(relationshipResult)
  
  // 4. 最終レポート
  console.log('\n' + '=' .repeat(50))
  console.log('📊 検証結果サマリー')
  console.log('=' .repeat(50))
  
  let totalPassed = 0
  let totalFailed = 0
  let totalWarnings = 0
  let totalErrors = 0
  
  for (const result of results) {
    console.log(`${result.category}:`)
    console.log(`  ✅ 合格: ${result.passed}/${result.total}`)
    console.log(`  ❌ 失敗: ${result.failed}/${result.total}`)
    if (result.warnings.length > 0) {
      console.log(`  ⚠️  警告: ${result.warnings.length}件`)
    }
    if (result.errors.length > 0) {
      console.log(`  🚨 エラー: ${result.errors.length}件`)
    }
    
    totalPassed += result.passed
    totalFailed += result.failed
    totalWarnings += result.warnings.length
    totalErrors += result.errors.length
  }
  
  console.log('\n📈 総合結果:')
  const totalTests = totalPassed + totalFailed
  const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0'
  console.log(`  成功率: ${successRate}% (${totalPassed}/${totalTests})`)
  console.log(`  警告: ${totalWarnings}件`)
  console.log(`  エラー: ${totalErrors}件`)
  
  // 品質評価
  if (totalErrors > 0) {
    console.log('\n🚨 重大なエラーが発見されました。修正が必要です。')
    process.exit(1)
  } else if (totalWarnings > 0) {
    console.log('\n⚠️  警告があります。確認を推奨します。')
  } else if (parseFloat(successRate) >= 95) {
    console.log('\n🎉 データ品質は良好です！本番デプロイ可能です。')
  } else {
    console.log('\n⚠️  一部のテストが失敗しています。確認してください。')
  }
}

async function validateChannels(): Promise<ValidationResult> {
  const result: ValidationResult = {
    category: 'チャンネル情報',
    total: 0,
    passed: 0,
    failed: 0,
    warnings: [],
    errors: []
  }
  
  try {
    const { data: channels, error } = await supabase
      .from('celebrities')
      .select('*')
      .eq('type', 'youtube_channel')
    
    if (error) {
      result.errors.push(`データ取得エラー: ${error.message}`)
      return result
    }
    
    if (!channels || channels.length === 0) {
      result.errors.push('YouTubeチャンネルが登録されていません')
      return result
    }
    
    result.total = channels.length
    
    for (const channel of channels) {
      let passed = true
      
      // 必須フィールドチェック
      if (!channel.name) {
        result.errors.push(`チャンネル名が未設定: ${channel.id}`)
        passed = false
      }
      
      if (!channel.slug) {
        result.errors.push(`スラッグが未設定: ${channel.id}`)
        passed = false
      }
      
      // データ品質チェック
      if (!channel.subscriber_count || channel.subscriber_count < 0) {
        result.warnings.push(`登録者数が不正: ${channel.name}`)
      }
      
      if (!channel.video_count || channel.video_count < 0) {
        result.warnings.push(`動画数が不正: ${channel.name}`)
      }
      
      // よにのチャンネル専用チェック
      if (channel.id === 'UC2alHD2WkakOiTxCxF-uMAg') {
        if (channel.name !== 'よにのチャンネル') {
          result.warnings.push('よにのチャンネル名が期待値と異なります')
        }
        
        if (!channel.subscriber_count || channel.subscriber_count < 1000) {
          result.warnings.push('よにのチャンネルの登録者数が少なすぎます')
        }
      }
      
      if (passed) result.passed++
      else result.failed++
    }
    
  } catch (error: any) {
    result.errors.push(`検証エラー: ${error.message}`)
  }
  
  return result
}

async function validateEpisodes(): Promise<ValidationResult> {
  const result: ValidationResult = {
    category: '動画データ',
    total: 0,
    passed: 0,
    failed: 0,
    warnings: [],
    errors: []
  }
  
  try {
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('*')
    
    if (error) {
      result.errors.push(`データ取得エラー: ${error.message}`)
      return result
    }
    
    if (!episodes || episodes.length === 0) {
      result.errors.push('動画データが登録されていません')
      return result
    }
    
    result.total = episodes.length
    
    for (const episode of episodes) {
      let passed = true
      
      // 必須フィールドチェック
      if (!episode.title) {
        result.errors.push(`タイトルが未設定: ${episode.id}`)
        passed = false
      }
      
      if (!episode.date) {
        result.errors.push(`公開日が未設定: ${episode.id}`)
        passed = false
      }
      
      if (!episode.video_url) {
        result.errors.push(`動画URLが未設定: ${episode.id}`)
        passed = false
      }
      
      if (!episode.celebrity_id) {
        result.errors.push(`チャンネルIDが未設定: ${episode.id}`)
        passed = false
      }
      
      // データ品質チェック
      if (episode.view_count && episode.view_count < 0) {
        result.warnings.push(`視聴回数が不正: ${episode.title}`)
      }
      
      if (episode.duration && (episode.duration < 10 || episode.duration > 36000)) {
        result.warnings.push(`動画時間が不正: ${episode.title}`)
      }
      
      // YouTube URL形式チェック
      if (episode.video_url && !episode.video_url.includes('youtube.com/watch?v=')) {
        result.warnings.push(`YouTube URL形式が不正: ${episode.title}`)
      }
      
      if (passed) result.passed++
      else result.failed++
    }
    
    // 全体統計チェック
    if (episodes.length < 10) {
      result.warnings.push(`動画数が少なすぎます: ${episodes.length}本`)
    }
    
    // 公開日チェック
    const recentEpisodes = episodes.filter(ep => {
      const date = new Date(ep.date)
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      return date > oneYearAgo
    })
    
    if (recentEpisodes.length === 0) {
      result.warnings.push('過去1年以内の動画がありません')
    }
    
  } catch (error: any) {
    result.errors.push(`検証エラー: ${error.message}`)
  }
  
  return result
}

async function validateRelationships(): Promise<ValidationResult> {
  const result: ValidationResult = {
    category: 'データ関連性',
    total: 0,
    passed: 0,
    failed: 0,
    warnings: [],
    errors: []
  }
  
  try {
    // チャンネル存在チェック
    const { data: channels } = await supabase
      .from('celebrities')
      .select('id')
      .eq('type', 'youtube_channel')
    
    const { data: episodes } = await supabase
      .from('episodes')
      .select('celebrity_id')
    
    if (!channels || !episodes) {
      result.errors.push('関連性チェック用データ取得に失敗')
      return result
    }
    
    const channelIds = new Set(channels.map(c => c.id))
    result.total = episodes.length
    
    for (const episode of episodes) {
      if (channelIds.has(episode.celebrity_id)) {
        result.passed++
      } else {
        result.failed++
        result.errors.push(`存在しないチャンネルID: ${episode.celebrity_id}`)
      }
    }
    
    // よにのチャンネル特化チェック
    const yoniChannelId = 'UC2alHD2WkakOiTxCxF-uMAg'
    const yoniEpisodes = episodes.filter(ep => ep.celebrity_id === yoniChannelId)
    
    if (yoniEpisodes.length === 0) {
      result.errors.push('よにのチャンネルの動画が登録されていません')
    } else {
      result.warnings.push(`よにのチャンネル動画数: ${yoniEpisodes.length}本`)
    }
    
  } catch (error: any) {
    result.errors.push(`検証エラー: ${error.message}`)
  }
  
  return result
}

function printResult(result: ValidationResult) {
  console.log(`✅ 合格: ${result.passed}`)
  console.log(`❌ 失敗: ${result.failed}`)
  
  if (result.warnings.length > 0) {
    console.log(`⚠️  警告:`)
    result.warnings.forEach(warning => console.log(`     ${warning}`))
  }
  
  if (result.errors.length > 0) {
    console.log(`🚨 エラー:`)
    result.errors.forEach(error => console.log(`     ${error}`))
  }
}

main().catch(console.error)