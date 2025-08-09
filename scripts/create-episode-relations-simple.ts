/**
 * シンプルな方法でエピソード関連テーブルを作成
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function createTables() {
  console.log('🗃️  エピソード関連テーブル作成を試行中...')
  
  try {
    // まずは既存テーブルの確認を試す
    console.log('🔍 既存テーブル確認...')
    
    // episode_locationsテーブルの存在確認
    const { data: episodeLocationsTest, error: epLocError } = await supabase
      .from('episode_locations')
      .select('count')
      .limit(1)
    
    if (epLocError && epLocError.code === '42P01') {
      console.log('❌ episode_locationsテーブルが存在しません')
    } else {
      console.log('✅ episode_locationsテーブルが存在します')
    }
    
    // episode_itemsテーブルの存在確認
    const { data: episodeItemsTest, error: epItError } = await supabase
      .from('episode_items')
      .select('count')
      .limit(1)
    
    if (epItError && epItError.code === '42P01') {
      console.log('❌ episode_itemsテーブルが存在しません')
    } else {
      console.log('✅ episode_itemsテーブルが存在します')
    }
    
    console.log('\n📝 手動でテーブル作成が必要です')
    console.log('Supabase管理画面 (https://supabase.com/dashboard/project/' + 
      process.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] + 
      '/editor) で以下のSQLを実行してください:')
    
    console.log('\n-- エピソード-店舗 紐付けテーブル')
    console.log(`CREATE TABLE IF NOT EXISTS public.episode_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id TEXT NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(episode_id, location_id)
);`)

    console.log('\n-- エピソード-アイテム 紐付けテーブル')
    console.log(`CREATE TABLE IF NOT EXISTS public.episode_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id TEXT NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(episode_id, item_id)
);`)

    console.log('\n-- RLS設定')
    console.log(`ALTER TABLE public.episode_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_items ENABLE ROW LEVEL SECURITY;`)

    console.log('\n-- 権限設定')
    console.log(`CREATE POLICY "Allow read access to episode_locations" ON public.episode_locations FOR SELECT USING (true);
CREATE POLICY "Allow read access to episode_items" ON public.episode_items FOR SELECT USING (true);
CREATE POLICY "Allow all access to episode_locations for admin" ON public.episode_locations USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to episode_items for admin" ON public.episode_items USING (true) WITH CHECK (true);`)
    
    console.log('\n🎯 手動実行後、管理画面の動作確認を進めてください')
    
  } catch (error: any) {
    console.error('❌ エラー:', error.message)
    throw error
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  createTables().catch(console.error)
}