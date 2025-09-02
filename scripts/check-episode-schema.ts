#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkEpisodeSchema() {
  console.log('📋 エピソードテーブルのサンプルデータ確認...\n')
  
  const { data: sample } = await supabase
    .from('episodes')
    .select('*')
    .limit(1)
  
  if (sample && sample.length > 0) {
    console.log('サンプルデータのカラム:')
    console.log(Object.keys(sample[0]))
  }
}

checkEpisodeSchema()
