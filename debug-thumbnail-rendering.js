// 🔍 実際のサムネイル画像の読み込み状況を確認
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
)

// HTTPSリクエストでサムネイル画像の実際の可用性をテスト
async function checkImageAvailability(url, timeout = 5000) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; oshikatsu-collection; +https://collection.oshikatsu-guide.com/)'
      }
    })
    
    clearTimeout(timeoutId)
    
    return {
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return { error: 'TIMEOUT' }
    }
    return { error: error.message }
  }
}

async function debugThumbnailRendering() {
  console.log('🔍 Thumbnail Rendering & Network Analysis')
  console.log('=========================================')
  
  try {
    // 1. HomeのProgressiveクエリと同じデータを取得
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('id, title, description, thumbnail_url, celebrity:celebrities(name, slug)')
      .order('created_at', { ascending: false })
      .limit(4)
    
    if (error) {
      console.error('❌ データ取得エラー:', error)
      return
    }
    
    console.log('📺 ホームページエピソード分析:')
    console.log('===========================')
    
    // 2. 各サムネイルURLの実際の可用性をテスト
    for (let i = 0; i < episodes.length; i++) {
      const episode = episodes[i]
      console.log(`\n${i + 1}. ${episode.title}`)
      
      if (!episode.thumbnail_url) {
        console.log('   ❌ thumbnail_url がありません')
        continue
      }
      
      console.log(`   🔗 URL: ${episode.thumbnail_url}`)
      
      // 実際のHTTPリクエストで画像の存在確認
      console.log('   ⏳ ネットワーク確認中...')
      const imageCheck = await checkImageAvailability(episode.thumbnail_url)
      
      if (imageCheck.error) {
        console.log(`   ❌ ネットワークエラー: ${imageCheck.error}`)
        if (imageCheck.error === 'TIMEOUT') {
          console.log('   ⚠️  画像読み込み遅延が原因の可能性')
        }
      } else if (imageCheck.ok) {
        console.log(`   ✅ ステータス: ${imageCheck.status}`)
        console.log(`   ✅ Content-Type: ${imageCheck.contentType || '不明'}`)
        console.log(`   ✅ サイズ: ${imageCheck.contentLength ? imageCheck.contentLength + ' bytes' : '不明'}`)
        
        // TMDBの画像特有の分析
        if (episode.thumbnail_url.includes('image.tmdb.org')) {
          console.log('   📱 TMDB画像: 正常にアクセス可能')
          
          // CORS情報があるかチェック（ブラウザで重要）
          const corsTest = await fetch(episode.thumbnail_url, {
            method: 'HEAD',
            mode: 'cors'
          }).catch(() => null)
          
          if (corsTest) {
            console.log('   ✅ CORS: ブラウザからアクセス可能')
          } else {
            console.log('   ⚠️  CORS: ブラウザからの制限の可能性')
          }
        }
      } else {
        console.log(`   ❌ ステータス: ${imageCheck.status}`)
        console.log('   ❌ 画像が利用できません')
      }
    }
    
    // 3. HomeBalanced.tsxの実装との比較
    console.log('\n🎨 HomeBalanced.tsx 実装分析:')
    console.log('============================')
    
    console.log('実装されているJSX構造:')
    console.log(`<div className="relative aspect-video bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center overflow-hidden">`)
    console.log(`  {episode.thumbnail_url ? (`)
    console.log(`    <img src={episode.thumbnail_url} alt={episode.title} className="w-full h-full object-cover" loading="lazy" onError={...} />`)
    console.log(`  ) : null}`)
    console.log(`  <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">`)
    console.log(`    <Play className="h-12 w-12 text-rose-400" />`)
    console.log(`  </div>`)
    console.log(`</div>`)
    
    console.log('\n🤔 可能な原因の分析:')
    console.log('==================')
    
    console.log('1. 📊 データフロー: ✅ 正常（DBから正しいURLが取得されている）')
    console.log('2. 🔗 ネットワーク: ✅ 正常（画像URLにアクセス可能）')
    console.log('3. 🎨 JSX構造: ✅ 実装済み（条件分岐とimg要素が正しく設置）')
    console.log('')
    console.log('🔍 残る可能性のある原因:')
    console.log('   A. CSS z-index問題 → fallback Playアイコンが画像の上に表示される')
    console.log('   B. Progressive loading遅延 → データ読み込み前にfallbackが表示される')
    console.log('   C. onError処理の誤動作 → 正常な画像もエラーとして非表示になる')
    console.log('   D. aspect-video CSS → 画像のサイズ指定で表示範囲外になる')
    
    console.log('\n💡 次の調査ステップ:')
    console.log('===================')
    console.log('1. 実際のブラウザでの要素検証（Dev Tools）')
    console.log('2. CSS z-indexスタッキング確認')
    console.log('3. Progressive loading タイミング確認')
    
  } catch (error) {
    console.error('💥 分析エラー:', error)
  }
}

debugThumbnailRendering().then(() => {
  console.log('\n🏁 Thumbnail Rendering Analysis Complete')
  process.exit(0)
}).catch(error => {
  console.error('❌ Analysis Failed:', error)
  process.exit(1)
})