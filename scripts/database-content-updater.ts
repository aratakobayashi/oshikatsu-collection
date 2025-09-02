#!/usr/bin/env node

/**
 * コンテンツSEO強化データのデータベース更新
 * 生成した詳細説明とセマンティックタグの安全な本番反映
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function updateDatabaseWithGeneratedContent() {
  console.log('📝 コンテンツSEO強化データベース更新')
  console.log('='.repeat(60))

  // 1. 生成ファイルの読み込み
  let descriptionData: any[] = []
  let tagData: any[] = []

  try {
    // 最新の生成ファイルを探す
    const files = fs.readdirSync('.').filter(f => f.includes('generated-'))
    const descriptionFile = files.find(f => f.includes('descriptions'))
    const tagFile = files.find(f => f.includes('tags'))

    if (descriptionFile) {
      descriptionData = JSON.parse(fs.readFileSync(descriptionFile, 'utf8'))
      console.log(`✅ 詳細説明データ読み込み: ${descriptionFile}`)
      console.log(`   対象: ${descriptionData.filter(d => d.needsUpdate).length}件`)
    }

    if (tagFile) {
      tagData = JSON.parse(fs.readFileSync(tagFile, 'utf8'))
      console.log(`✅ タグデータ読み込み: ${tagFile}`)
      console.log(`   対象: ${tagData.filter(d => d.needsUpdate).length}件`)
    }
  } catch (error) {
    console.error('❌ 生成ファイル読み込みエラー:', error)
    return
  }

  // 2. 現在のデータベース状態確認
  const { data: currentLocations, error: fetchError } = await supabase
    .from('locations')
    .select('id, name, description, tags')

  if (fetchError) {
    console.error('❌ 現在データ取得エラー:', fetchError)
    return
  }

  console.log(`📊 現在のデータベース: ${currentLocations.length}件`)

  // 3. バックアップ作成
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = `database-backup-before-content-update-${timestamp}.json`
  
  fs.writeFileSync(backupFile, JSON.stringify(currentLocations, null, 2))
  console.log(`💾 バックアップ作成: ${backupFile}`)

  // 4. 更新対象の特定と検証
  const updateQueue = []

  // 説明文更新対象
  if (descriptionData.length > 0) {
    const descUpdates = descriptionData
      .filter(item => item.needsUpdate && item.generated && item.generated.length > 10)
      .map(item => ({
        id: item.id,
        name: item.name,
        type: 'description',
        oldValue: item.original || '',
        newValue: item.generated,
        improvement: item.generated.length - (item.original?.length || 0)
      }))
    
    updateQueue.push(...descUpdates)
  }

  // タグ更新対象
  if (tagData.length > 0) {
    const tagUpdates = tagData
      .filter(item => item.needsUpdate && item.generatedTags && item.generatedTags.length > 3)
      .map(item => ({
        id: item.id,
        name: item.name,
        type: 'tags',
        oldValue: item.originalTags || [],
        newValue: item.generatedTags,
        improvement: item.generatedTags.length - (item.originalTags?.length || 0)
      }))
    
    updateQueue.push(...tagUpdates)
  }

  console.log(`\n🎯 更新対象: ${updateQueue.length}件`)
  console.log(`   説明文: ${updateQueue.filter(u => u.type === 'description').length}件`)
  console.log(`   タグ: ${updateQueue.filter(u => u.type === 'tags').length}件`)

  // 5. 更新プレビュー表示
  console.log('\n📋 【更新プレビュー（先頭5件）】')
  console.log('='.repeat(50))
  
  updateQueue.slice(0, 5).forEach((update, i) => {
    console.log(`${i+1}. ${update.name} (${update.type})`)
    if (update.type === 'description') {
      console.log(`   旧: ${update.oldValue.slice(0, 50)}${update.oldValue.length > 50 ? '...' : ''}`)
      console.log(`   新: ${update.newValue.slice(0, 50)}${update.newValue.length > 50 ? '...' : ''}`)
      console.log(`   改善: +${update.improvement}文字`)
    } else {
      console.log(`   旧タグ数: ${update.oldValue.length}`)
      console.log(`   新タグ数: ${update.newValue.length}`)
      console.log(`   改善: +${update.improvement}個`)
    }
    console.log('')
  })

  return {
    updateQueue,
    backupFile,
    totalUpdates: updateQueue.length,
    descriptionUpdates: updateQueue.filter(u => u.type === 'description').length,
    tagUpdates: updateQueue.filter(u => u.type === 'tags').length
  }
}

async function executeUpdateToDatabase(updateQueue: any[], backupFile: string) {
  console.log('\n🚀 データベース更新実行')
  console.log('='.repeat(40))

  let successCount = 0
  let errorCount = 0
  const errors = []

  // バッチ処理で更新実行
  for (const update of updateQueue) {
    try {
      let updateData: any = {}
      
      if (update.type === 'description') {
        updateData.description = update.newValue
      } else if (update.type === 'tags') {
        updateData.tags = update.newValue
      }

      const { error } = await supabase
        .from('locations')
        .update(updateData)
        .eq('id', update.id)

      if (error) {
        throw error
      }

      successCount++
      
      // 進捗表示（10件ごと）
      if (successCount % 10 === 0) {
        console.log(`✅ 進捗: ${successCount}/${updateQueue.length}件完了`)
      }

    } catch (error) {
      errorCount++
      errors.push({
        id: update.id,
        name: update.name,
        type: update.type,
        error: error.message
      })
      console.error(`❌ 更新エラー (${update.name}): ${error.message}`)
    }
  }

  // 更新完了サマリー
  console.log('\n🎉 データベース更新完了!')
  console.log('='.repeat(30))
  console.log(`成功: ${successCount}件`)
  console.log(`エラー: ${errorCount}件`)
  
  if (errors.length > 0) {
    console.log('\n❌ エラー詳細:')
    errors.slice(0, 5).forEach(err => {
      console.log(`   ${err.name} (${err.type}): ${err.error}`)
    })
  }

  // エラーログ保存
  if (errors.length > 0) {
    const errorLogFile = `update-errors-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    fs.writeFileSync(errorLogFile, JSON.stringify(errors, null, 2))
    console.log(`📋 エラーログ保存: ${errorLogFile}`)
  }

  return {
    successCount,
    errorCount,
    errors,
    backupFile
  }
}

async function verifyUpdateResults() {
  console.log('\n🔍 更新結果検証')
  console.log('='.repeat(30))

  // 更新後のデータ状態確認
  const { data: updatedLocations, error } = await supabase
    .from('locations')
    .select(`
      id, name, description, tags,
      episode_locations(
        episodes(celebrities(name))
      )
    `)

  if (error) {
    console.error('❌ 検証エラー:', error)
    return
  }

  // 品質統計
  const withDescription = updatedLocations.filter(loc => 
    loc.description && loc.description.length > 20).length
  const withTags = updatedLocations.filter(loc => 
    loc.tags && loc.tags.length >= 5).length
  
  const avgDescriptionLength = Math.round(
    updatedLocations
      .filter(loc => loc.description)
      .reduce((sum, loc) => sum + loc.description.length, 0) / 
    updatedLocations.filter(loc => loc.description).length
  )

  const avgTagCount = Math.round(
    updatedLocations
      .filter(loc => loc.tags)
      .reduce((sum, loc) => sum + loc.tags.length, 0) / 
    updatedLocations.filter(loc => loc.tags).length
  )

  console.log(`📊 更新後品質統計:`)
  console.log(`   詳細説明充実: ${withDescription}/${updatedLocations.length}件 (${Math.round(withDescription/updatedLocations.length*100)}%)`)
  console.log(`   タグ充実: ${withTags}/${updatedLocations.length}件 (${Math.round(withTags/updatedLocations.length*100)}%)`)
  console.log(`   平均説明文字数: ${avgDescriptionLength}文字`)
  console.log(`   平均タグ数: ${avgTagCount}個`)

  return {
    totalLocations: updatedLocations.length,
    withDescription,
    withTags,
    avgDescriptionLength,
    avgTagCount
  }
}

// メイン実行関数
async function main() {
  try {
    // Phase 1: 更新準備
    const prepResult = await updateDatabaseWithGeneratedContent()
    
    if (!prepResult || prepResult.totalUpdates === 0) {
      console.log('⚠️ 更新対象データが見つかりません。')
      return
    }

    // Phase 2: 実行確認
    console.log('\n⚠️ データベース更新の最終確認')
    console.log(`更新対象: ${prepResult.totalUpdates}件`)
    console.log(`バックアップ: ${prepResult.backupFile}`)
    console.log('')

    // Phase 3: 更新実行
    const execResult = await executeUpdateToDatabase(prepResult.updateQueue, prepResult.backupFile)

    // Phase 4: 結果検証
    const verifyResult = await verifyUpdateResults()

    // 最終レポート
    console.log('\n🏆 【コンテンツSEO強化 更新完了レポート】')
    console.log('='.repeat(50))
    console.log(`✅ 更新成功: ${execResult.successCount}件`)
    console.log(`❌ 更新エラー: ${execResult.errorCount}件`)
    console.log(`📊 最終品質: 説明文${Math.round(verifyResult.withDescription/verifyResult.totalLocations*100)}%、タグ${Math.round(verifyResult.withTags/verifyResult.totalLocations*100)}%充実`)
    console.log(`💾 バックアップ: ${execResult.backupFile}`)
    console.log('')
    console.log('🚀 SEO効果測定開始準備完了!')

  } catch (error) {
    console.error('❌ メイン処理エラー:', error)
    process.exit(1)
  }
}

// 実行制御
const args = process.argv.slice(2)
const confirmFlag = args.includes('--confirm')

if (!confirmFlag) {
  console.log('⚠️  このスクリプトは本番データベースを更新します。')
  console.log('生成した詳細説明とタグをlocationsテーブルに反映します。')
  console.log('')
  console.log('実行前に以下を確認してください:')
  console.log('1. generated-descriptions-*.json ファイルの存在')
  console.log('2. generated-tags-*.json ファイルの存在')
  console.log('3. データベースへの書き込み権限')
  console.log('')
  console.log('実行するには --confirm フラグを付けてください:')
  console.log('npx tsx scripts/database-content-updater.ts --confirm')
  process.exit(0)
}

// 実行
main()