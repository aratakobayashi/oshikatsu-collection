#!/usr/bin/env npx tsx

/**
 * Episode Locationsデバッグスクリプト
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugEpisodeLocations() {
  console.log('🔍 Episode Locationsデバッグ')
  
  try {
    // 1. episode_locationsテーブルの確認
    const { data: episodeLocations, error: elError } = await supabase
      .from('episode_locations')
      .select('*')
      .limit(10)
    
    console.log('\n📋 episode_locationsテーブル:')
    console.log('件数:', episodeLocations?.length || 0)
    if (elError) console.error('エラー:', elError)
    
    if (episodeLocations && episodeLocations.length > 0) {
      console.log('サンプル:', episodeLocations[0])
    }
    
    // 2. locationsテーブルの確認
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name, tabelog_url')
      .limit(5)
    
    console.log('\n📍 locationsテーブル:')
    console.log('件数:', locations?.length || 0)
    if (locations && locations.length > 0) {
      console.log('サンプル:', locations[0])
    }
    
    // 3. 結合クエリのテスト
    const { data: joinedData, error: joinError } = await supabase
      .from('episode_locations')
      .select(`
        location_id,
        episodes(id, title)
      `)
      .limit(5)
    
    console.log('\n🔗 結合クエリテスト:')
    console.log('件数:', joinedData?.length || 0)
    if (joinError) console.error('エラー:', joinError)
    if (joinedData && joinedData.length > 0) {
      console.log('サンプル:', joinedData[0])
    }
    
  } catch (error) {
    console.error('❌ デバッグエラー:', error)
  }
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  debugEpisodeLocations()
}