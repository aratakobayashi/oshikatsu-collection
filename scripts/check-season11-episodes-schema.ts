#!/usr/bin/env node

/**
 * Season11エピソードのデータベーススキーマ確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSeason11EpisodesSchema() {
  console.log('🔍 Season11エピソードのスキーマ確認中...\n')

  try {
    // Season11の1つのエピソードを取得してスキーマ確認
    const { data: episode, error } = await supabase
      .from('episodes')
      .select('*')
      .like('title', '%Season11%')
      .limit(1)
      .single()

    if (error) {
      console.error('❌ エピソード取得エラー:', error)
      return
    }

    if (!episode) {
      console.log('❌ Season11のエピソードが見つかりません')
      return
    }

    console.log('📋 Season11エピソードのスキーマ:')
    console.log('=' .repeat(50))
    
    Object.keys(episode).forEach(key => {
      const value = episode[key]
      const type = typeof value
      const preview = value ? String(value).substring(0, 50) : 'null'
      console.log(`${key}: ${type} = ${preview}${preview.length >= 50 ? '...' : ''}`)
    })

    console.log('=' .repeat(50))

    // 他のシーズンとの比較のため、Season10のエピソードも確認
    console.log('\n🔄 比較用: Season10エピソードのスキーマ:')
    const { data: season10Episode } = await supabase
      .from('episodes')
      .select('*')
      .like('title', '%Season10%')
      .limit(1)
      .single()

    if (season10Episode) {
      console.log('=' .repeat(50))
      Object.keys(season10Episode).forEach(key => {
        const value = season10Episode[key]
        const type = typeof value
        const preview = value ? String(value).substring(0, 50) : 'null'
        const isSame = key in episode
        const marker = isSame ? '✅' : '❌'
        console.log(`${marker} ${key}: ${type} = ${preview}${preview.length >= 50 ? '...' : ''}`)
      })
      console.log('=' .repeat(50))
    }

    // Season11の全エピソード確認
    console.log('\n📺 Season11全エピソードリスト:')
    const { data: allEpisodes } = await supabase
      .from('episodes')
      .select('id, title, celebrity_id')
      .like('title', '%Season11%')
      .order('title')

    if (allEpisodes) {
      allEpisodes.forEach((ep, index) => {
        const hasChef = ep.celebrity_id ? '👨‍🍳' : '❌'
        console.log(`${index + 1}. ${hasChef} ${ep.title.replace('孤独のグルメ Season11 ', '')}`)
      })
    }

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkSeason11EpisodesSchema()