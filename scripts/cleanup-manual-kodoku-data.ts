/**
 * 手動で追加した孤独のグルメのエピソードを削除し、
 * TMDBからの全取得に備えるクリーンアップスクリプト
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface CleanupStats {
  episodes: number
  episodeLocations: number
  locations: number
}

class KodokuDataCleaner {
  private celebrityId: string = ''
  private stats: CleanupStats = { episodes: 0, episodeLocations: 0, locations: 0 }

  async getCelebrityId(): Promise<void> {
    const { data, error } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'matsushige-yutaka')
      .single()

    if (error || !data) {
      throw new Error('松重豊のセレブリティが見つかりません')
    }

    this.celebrityId = data.id
    console.log('✅ 松重豊のID:', this.celebrityId)
  }

  async deleteEpisodeLocations(): Promise<void> {
    console.log('\n🔗 エピソード-ロケーション紐付けを削除中...')

    // まず松重豊のエピソードIDを取得
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', this.celebrityId)

    if (!episodes || episodes.length === 0) {
      console.log('📺 エピソードが見つかりません')
      return
    }

    const episodeIds = episodes.map(ep => ep.id)

    // 紐付けを削除
    const { error, count } = await supabase
      .from('episode_locations')
      .delete()
      .in('episode_id', episodeIds)

    if (error) {
      console.error('❌ 紐付け削除エラー:', error)
    } else {
      this.stats.episodeLocations = count || 0
      console.log(`✅ ${this.stats.episodeLocations}件の紐付けを削除しました`)
    }
  }

  async deleteEpisodes(): Promise<void> {
    console.log('\n📺 手動エピソードを削除中...')

    const { error, count } = await supabase
      .from('episodes')
      .delete()
      .eq('celebrity_id', this.celebrityId)

    if (error) {
      console.error('❌ エピソード削除エラー:', error)
    } else {
      this.stats.episodes = count || 0
      console.log(`✅ ${this.stats.episodes}件のエピソードを削除しました`)
    }
  }

  async deleteManualLocations(): Promise<void> {
    console.log('\n📍 手動ロケーションを削除中...')

    const { error, count } = await supabase
      .from('locations')
      .delete()
      .like('description', '%孤独のグルメ%')

    if (error) {
      console.error('❌ ロケーション削除エラー:', error)
    } else {
      this.stats.locations = count || 0
      console.log(`✅ ${this.stats.locations}件のロケーションを削除しました`)
    }
  }

  async verifyCleanup(): Promise<void> {
    console.log('\n🔍 クリーンアップ結果を確認中...')

    // 残存エピソードをチェック
    const { count: remainingEpisodes } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', this.celebrityId)

    // 残存ロケーションをチェック
    const { count: remainingLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .like('description', '%孤独のグルメ%')

    console.log('📊 確認結果:')
    console.log(`   残存エピソード: ${remainingEpisodes}件`)
    console.log(`   残存ロケーション: ${remainingLocations}件`)

    if (remainingEpisodes === 0 && remainingLocations === 0) {
      console.log('✅ クリーンアップ完了！')
    } else {
      console.log('⚠️ 一部データが残存しています')
    }
  }

  async performFullCleanup(): Promise<void> {
    console.log('🧹 孤独のグルメ手動データのクリーンアップ開始')
    console.log('='.repeat(60))

    try {
      // 1. セレブリティIDを取得
      await this.getCelebrityId()

      // 2. 紐付けから削除（外部キー制約のため最初に実行）
      await this.deleteEpisodeLocations()

      // 3. エピソードを削除
      await this.deleteEpisodes()

      // 4. 手動ロケーションを削除
      await this.deleteManualLocations()

      // 5. 結果確認
      await this.verifyCleanup()

      // 6. 統計表示
      console.log('\n📊 削除統計:')
      console.log(`✅ エピソード: ${this.stats.episodes}件`)
      console.log(`✅ 紐付け: ${this.stats.episodeLocations}件`)
      console.log(`✅ ロケーション: ${this.stats.locations}件`)
      console.log(`🎯 合計: ${Object.values(this.stats).reduce((a, b) => a + b, 0)}件のデータを削除`)

      console.log('\n🚀 次のステップ:')
      console.log('1. TMDB APIキーを設定')
      console.log('2. fetch-kodoku-tmdb-data.ts を実行')
      console.log('3. 全130+エピソードを自動取得！')

    } catch (error) {
      console.error('❌ クリーンアップエラー:', error)
    }
  }

  // セーフティチェック（実行前確認）
  async safetyCheck(): Promise<boolean> {
    console.log('⚠️ 安全確認: 削除対象データの確認\n')

    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('celebrity_id', this.celebrityId)

    const { data: locations } = await supabase
      .from('locations')
      .select('id, name')
      .like('description', '%孤独のグルメ%')

    console.log('📺 削除予定エピソード:')
    episodes?.forEach(ep => console.log(`   - ${ep.title}`))

    console.log('\n📍 削除予定ロケーション:')
    locations?.forEach(loc => console.log(`   - ${loc.name}`))

    const totalCount = (episodes?.length || 0) + (locations?.length || 0)
    console.log(`\n🎯 削除対象: 合計 ${totalCount}件`)

    return totalCount > 0
  }
}

// 実行確認付きメイン関数
async function cleanupWithConfirmation() {
  const cleaner = new KodokuDataCleaner()
  
  try {
    // セレブリティIDを取得
    await cleaner.getCelebrityId()
    
    // 安全確認
    const hasData = await cleaner.safetyCheck()
    
    if (!hasData) {
      console.log('📭 削除対象のデータが見つかりません')
      return
    }

    console.log('\n❓ 上記のデータを削除してTMDB取得に備えますか？')
    console.log('   続行するには --confirm フラグを追加してください')
    console.log('   例: npx tsx scripts/cleanup-manual-kodoku-data.ts --confirm')

    // コマンドライン引数をチェック
    if (process.argv.includes('--confirm')) {
      console.log('\n🚀 削除を実行します...')
      await cleaner.performFullCleanup()
    } else {
      console.log('\n⏸️ 削除をキャンセルしました')
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupWithConfirmation().catch(console.error)
}

export { KodokuDataCleaner }