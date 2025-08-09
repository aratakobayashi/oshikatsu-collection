/**
 * LocationDetail ページのデバッグ
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function testLocationDetail() {
  console.log('🔍 LocationDetail デバッグ')
  console.log('='.repeat(50))
  
  const locationId = '4454e9ab-1357-4cc2-b5ef-95c54652642c'
  
  try {
    console.log('📍 対象Location ID:', locationId)
    
    // 1. 基本的なlocation取得
    console.log('\n🔍 Basic location fetch:')
    const { data: basicLocation, error: basicError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single()
      
    if (basicError) {
      console.log('❌ Basic fetch error:', basicError.message)
      return
    }
    
    console.log('✅ Basic location found:')
    console.log('   Name:', basicLocation.name)
    console.log('   Address:', basicLocation.address)
    console.log('   Description:', basicLocation.description?.substring(0, 50) + '...')
    
    // 2. LocationDetailページと同じクエリを試す
    console.log('\n🔍 LocationDetail page query:')
    const { data: detailLocation, error: detailError } = await supabase
      .from('locations')
      .select(`
        *,
        episode:episodes(
          id,
          title,
          date,
          celebrity:celebrities(name, slug)
        )
      `)
      .eq('id', locationId)
      .single()
      
    if (detailError) {
      console.log('❌ Detail query error:', detailError.message)
      
      // 3. エピソードとの関連確認
      console.log('\n🔍 Episode links check:')
      const { data: episodeLinks, error: linkError } = await supabase
        .from('episode_locations')
        .select(`
          episode_id,
          episodes!inner(
            id,
            title,
            date,
            celebrity_id,
            celebrities!inner(name, slug)
          )
        `)
        .eq('location_id', locationId)
        
      if (linkError) {
        console.log('❌ Episode links error:', linkError.message)
      } else {
        console.log('✅ Episode links found:', episodeLinks?.length || 0)
        episodeLinks?.forEach((link, idx) => {
          console.log(`  ${idx + 1}. Episode: ${link.episodes?.title}`)
          console.log(`     Celebrity: ${link.episodes?.celebrities?.name}`)
        })
      }
    } else {
      console.log('✅ Detail query successful')
      console.log('   Episode info:', detailLocation.episode ? 'Found' : 'Not found')
    }
    
    // 4. 簡単なクエリでlocation情報を修正取得
    console.log('\n🔍 Simplified location query for page:')
    const { data: simpleLocation, error: simpleError } = await supabase
      .from('locations')
      .select(`
        id,
        name,
        slug,
        address,
        description,
        website_url,
        phone,
        opening_hours,
        tags,
        celebrity_id,
        created_at
      `)
      .eq('id', locationId)
      .single()
      
    if (simpleError) {
      console.log('❌ Simple query error:', simpleError.message)
    } else {
      console.log('✅ Simple query successful:')
      console.log('   Available fields:')
      Object.keys(simpleLocation).forEach(key => {
        const value = simpleLocation[key]
        if (value !== null && value !== undefined) {
          console.log(`     ${key}: ${typeof value === 'string' ? value.substring(0, 30) + '...' : value}`)
        }
      })
    }
    
  } catch (error: any) {
    console.error('❌ エラー:', error.message)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  testLocationDetail().catch(console.error)
}