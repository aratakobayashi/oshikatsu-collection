#!/usr/bin/env npx tsx

/**
 * 手動でepisode_locationsテーブルを作成
 * Supabaseに直接SQL実行
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

async function createEpisodeLocationsTable() {
  console.log('🛠️ episode_locationsテーブル作成開始')
  console.log('=' .repeat(50))
  
  try {
    // 1. テーブル作成SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS episode_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        episode_id UUID NOT NULL,
        location_id UUID NOT NULL,
        visited_at INTEGER,
        description TEXT,
        featured BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT fk_episode_locations_episode 
          FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
        CONSTRAINT fk_episode_locations_location 
          FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
        CONSTRAINT unique_episode_location 
          UNIQUE(episode_id, location_id)
      );
    `
    
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    })
    
    if (createError) {
      console.error('❌ テーブル作成エラー:', createError.message)
      throw createError
    }
    
    console.log('✅ episode_locationsテーブル作成完了')
    
    // 2. インデックス作成
    const indexSQLs = [
      'CREATE INDEX IF NOT EXISTS idx_episode_locations_episode_id ON episode_locations(episode_id);',
      'CREATE INDEX IF NOT EXISTS idx_episode_locations_location_id ON episode_locations(location_id);',
      'CREATE INDEX IF NOT EXISTS idx_episode_locations_featured ON episode_locations(featured) WHERE featured = TRUE;',
      'CREATE INDEX IF NOT EXISTS idx_episode_locations_created_at ON episode_locations(created_at DESC);'
    ]
    
    for (const indexSQL of indexSQLs) {
      const { error: indexError } = await supabase.rpc('exec_sql', { 
        sql: indexSQL 
      })
      
      if (indexError) {
        console.error('⚠️ インデックス作成エラー:', indexError.message)
      } else {
        console.log('✅ インデックス作成完了')
      }
    }
    
    // 3. RLS設定
    const rlsSQLs = [
      'ALTER TABLE episode_locations ENABLE ROW LEVEL SECURITY;',
      'CREATE POLICY "Enable read access for all users" ON episode_locations FOR SELECT USING (true);'
    ]
    
    for (const rlsSQL of rlsSQLs) {
      const { error: rlsError } = await supabase.rpc('exec_sql', { 
        sql: rlsSQL 
      })
      
      if (rlsError) {
        console.error('⚠️ RLS設定エラー:', rlsError.message)
      } else {
        console.log('✅ RLS設定完了')
      }
    }
    
    // 4. 作成確認
    const { data: testData, error: testError } = await supabase
      .from('episode_locations')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ テーブル確認エラー:', testError.message)
      throw testError
    }
    
    console.log('✅ テーブル作成・設定完了')
    console.log('🎯 次のステップ: データ移行スクリプト実行')
    
    return true
    
  } catch (error) {
    console.error('❌ テーブル作成失敗:', error)
    
    console.log('\n🔧 手動対応が必要です:')
    console.log('1. Supabaseダッシュボード → SQL Editor')
    console.log('2. マイグレーションSQLを手動実行')
    console.log('3. テーブル作成完了後、移行スクリプト実行')
    
    return false
  }
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  createEpisodeLocationsTable()
}

export { createEpisodeLocationsTable }