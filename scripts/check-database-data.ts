/**
 * データベース内のデータ存在状況を確認
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseData() {
  console.log('🔍 データベースデータ存在状況確認')
  console.log('='.repeat(60))
  
  try {
    // 1. Celebritiesテーブル確認
    console.log('\n👤 Celebrities テーブル:')
    console.log('-'.repeat(40))
    const { data: celebrities, error: celebError } = await supabase
      .from('celebrities')
      .select('id, name, slug')
      .limit(10)
    
    if (celebError) {
      console.error('❌ Celebritiesテーブル取得エラー:', celebError.message)
    } else {
      console.log(`📊 登録Celebrity数: ${celebrities?.length || 0}件`)
      celebrities?.forEach((celeb, index) => {
        console.log(`  ${index + 1}. ${celeb.name} (slug: ${celeb.slug})`)
      })
    }
    
    // 2. "よにのちゃんねる"の存在確認
    console.log('\n🔍 "よにのちゃんねる" 検索:')
    console.log('-'.repeat(40))
    const { data: yoniData, error: yoniError } = await supabase
      .from('celebrities')
      .select('*')
      .or('name.eq.よにのちゃんねる,slug.eq.よにのちゃんねる')
    
    if (yoniError) {
      console.error('❌ よにのちゃんねる検索エラー:', yoniError.message)
    } else {
      if (yoniData && yoniData.length > 0) {
        console.log('✅ よにのちゃんねる見つかりました!')
        yoniData.forEach(celeb => {
          console.log(`  ID: ${celeb.id}`)
          console.log(`  名前: ${celeb.name}`)
          console.log(`  Slug: ${celeb.slug}`)
          console.log(`  作成日: ${celeb.created_at}`)
        })
      } else {
        console.log('❌ よにのちゃんねる が見つかりません')
      }
    }
    
    // 3. 部分一致検索
    console.log('\n🔍 部分一致検索 ("よに", "チャンネル"):')
    console.log('-'.repeat(40))
    const { data: partialData, error: partialError } = await supabase
      .from('celebrities')
      .select('id, name, slug')
      .or('name.ilike.%よに%,name.ilike.%チャンネル%,slug.ilike.%よに%')
    
    if (partialError) {
      console.error('❌ 部分一致検索エラー:', partialError.message)
    } else {
      console.log(`📊 部分一致結果: ${partialData?.length || 0}件`)
      partialData?.forEach((celeb, index) => {
        console.log(`  ${index + 1}. ${celeb.name} (slug: ${celeb.slug})`)
      })
    }
    
    // 4. Episodes テーブル確認
    console.log('\n📺 Episodes テーブル:')
    console.log('-'.repeat(40))
    const { data: episodes, error: epError } = await supabase
      .from('episodes')
      .select('id, title, celebrity_id')
      .limit(5)
    
    if (epError) {
      console.error('❌ Episodes取得エラー:', epError.message)
    } else {
      console.log(`📊 登録Episode数: ${episodes?.length || 0}件`)
      episodes?.forEach((ep, index) => {
        console.log(`  ${index + 1}. ${ep.title} (Celebrity: ${ep.celebrity_id})`)
      })
    }
    
    // 5. よにのちゃんねる関連エピソード確認
    if (yoniData && yoniData.length > 0) {
      const yoniId = yoniData[0].id
      console.log(`\n📺 よにのちゃんねる (ID: ${yoniId}) 関連エピソード:`)
      console.log('-'.repeat(40))
      
      const { data: yoniEpisodes, error: yoniEpError } = await supabase
        .from('episodes')
        .select('id, title, air_date')
        .eq('celebrity_id', yoniId)
        .limit(10)
      
      if (yoniEpError) {
        console.error('❌ よにのちゃんねるエピソード取得エラー:', yoniEpError.message)
      } else {
        console.log(`📊 よにのちゃんねるエピソード数: ${yoniEpisodes?.length || 0}件`)
        yoniEpisodes?.forEach((ep, index) => {
          console.log(`  ${index + 1}. ${ep.title} (${ep.air_date})`)
        })
      }
    }
    
    // 6. 関連テーブルの状況確認
    console.log('\n📊 関連テーブル状況:')
    console.log('-'.repeat(40))
    
    const tables = ['locations', 'items', 'episode_locations', 'episode_items']
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ ${table}: エラー (${error.message})`)
        } else {
          console.log(`✅ ${table}: ${count || 0}件`)
        }
      } catch (err: any) {
        console.log(`❌ ${table}: 取得失敗 (${err.message})`)
      }
    }
    
    // 7. データ作成提案
    console.log('\n💡 解決策の提案:')
    console.log('-'.repeat(40))
    console.log('1. よにのちゃんねるデータが存在しない場合:')
    console.log('   npx tsx scripts/create-yoni-data.ts')
    console.log('2. 既存データをインポートする場合:')
    console.log('   npx tsx scripts/import-sample-data.ts')
    console.log('3. 手動でデータを作成する場合:')
    console.log('   管理画面 → Celebrities → 新規作成')
    
  } catch (error: any) {
    console.error('❌ データ確認エラー:', error.message)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  checkDatabaseData().catch(console.error)
}