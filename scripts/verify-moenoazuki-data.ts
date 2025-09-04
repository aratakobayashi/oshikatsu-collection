import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// ES Modules対応
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 環境変数読み込み
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyMoenoazukiData() {
  console.log('🔍 もえのあずきの完全なデータ状況を検証中...\n')

  try {
    // 1. セレブリティ基本情報
    console.log('1️⃣ セレブリティ基本情報:')
    const { data: celebrity, error: celebrityError } = await supabase
      .from('celebrities')
      .select('*')
      .eq('slug', 'moenoazuki')
      .single()

    if (celebrityError) {
      console.error('❌ セレブリティ取得エラー:', celebrityError.message)
      return
    }

    console.log(`✅ 名前: ${celebrity.name}`)
    console.log(`   スラッグ: ${celebrity.slug}`)
    console.log(`   画像: ${celebrity.image_url}`)
    console.log(`   登録者数: ${celebrity.subscriber_count?.toLocaleString()}`)
    console.log(`   ステータス: ${celebrity.status}`)
    console.log('')

    // 2. エピソード一覧
    console.log('2️⃣ エピソード一覧:')
    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('*')
      .eq('celebrity_id', celebrity.id)
      .order('date', { ascending: false })

    if (episodesError) {
      console.error('❌ エピソード取得エラー:', episodesError.message)
    } else {
      console.log(`✅ エピソード数: ${episodes?.length || 0}`)
      episodes?.forEach((ep, i) => {
        console.log(`   ${i + 1}. ${ep.title}`)
        console.log(`      ID: ${ep.id}`)
        console.log(`      日付: ${new Date(ep.date).toLocaleDateString('ja-JP')}`)
        console.log(`      視聴回数: ${ep.view_count?.toLocaleString() || 'N/A'}`)
        console.log(`      YouTube URL: ${ep.video_url}`)
        console.log('')
      })
    }

    // 3. ロケ地関連
    console.log('3️⃣ ロケ地関連データ:')
    
    // 直接関連付け (celebrity_id経由)
    const { data: directLocations, error: directError } = await supabase
      .from('locations')
      .select('*')
      .eq('celebrity_id', celebrity.id)

    console.log(`📍 直接関連ロケ地数: ${directLocations?.length || 0}`)
    directLocations?.forEach((loc, i) => {
      console.log(`   ${i + 1}. ${loc.name} (直接関連)`)
      console.log(`      スラッグ: ${loc.slug}`)
      console.log(`      食べログ: ${loc.tabelog_url ? '有り' : '無し'}`)
    })

    // エピソード経由の関連付け
    if (episodes && episodes.length > 0) {
      const { data: episodeLocations, error: epLocError } = await supabase
        .from('episode_locations')
        .select(`
          episode_id,
          location:locations(
            id,
            name,
            slug,
            address,
            tabelog_url
          )
        `)
        .in('episode_id', episodes.map(ep => ep.id))

      console.log(`🔗 エピソード経由ロケ地数: ${episodeLocations?.length || 0}`)
      episodeLocations?.forEach((rel, i) => {
        const episode = episodes.find(ep => ep.id === rel.episode_id)
        console.log(`   ${i + 1}. ${rel.location?.name} (エピソード経由)`)
        console.log(`      関連エピソード: ${episode?.title}`)
        console.log(`      食べログ: ${rel.location?.tabelog_url ? '有り' : '無し'}`)
      })
    }

    console.log('')

    // 4. フロントエンド表示用データ確認
    console.log('4️⃣ フロントエンド表示用データ確認:')
    
    // セレブリティ詳細ページで必要なクエリをシミュレート
    const { data: detailPageData, error: detailError } = await supabase
      .from('celebrities')
      .select(`
        *,
        episodes:episodes(
          id,
          title,
          date,
          thumbnail_url,
          video_url,
          view_count
        )
      `)
      .eq('slug', 'moenoazuki')
      .single()

    if (detailError) {
      console.error('❌ 詳細ページデータ取得エラー:', detailError.message)
    } else {
      console.log('✅ 詳細ページデータ取得成功')
      console.log(`   セレブリティ: ${detailPageData.name}`)
      console.log(`   エピソード数: ${detailPageData.episodes?.length || 0}`)
      console.log('')
      
      if (detailPageData.episodes?.length === 0) {
        console.log('⚠️ 問題発見: エピソードが関連付けられていない')
        console.log('   原因候補:')
        console.log('   1. celebrity_id の不一致')
        console.log('   2. フロントエンドのクエリロジック問題')
        console.log('   3. データベーススキーマの問題')
      }
    }

    // 5. 修正提案
    console.log('5️⃣ 修正提案:')
    if (episodes && episodes.length > 0) {
      console.log('✅ データベースレベル: エピソードは正常に存在')
      console.log('🔧 対策: フロントエンドのクエリロジックを確認')
      console.log('   - celebrity詳細ページのクエリ')
      console.log('   - エピソード取得のJOIN条件')
      console.log('   - キャッシュのクリア')
    } else {
      console.log('❌ データベースレベル: エピソードが存在しない')
      console.log('🔧 対策: エピソード追加スクリプトの再実行')
    }

  } catch (error: any) {
    console.error('❌ 検証エラー:', error.message)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyMoenoazukiData()
    .then(() => {
      console.log('\n✅ 検証完了!')
    })
    .catch((error) => {
      console.error('❌ 実行エラー:', error.message)
      process.exit(1)
    })
}

export { verifyMoenoazukiData }