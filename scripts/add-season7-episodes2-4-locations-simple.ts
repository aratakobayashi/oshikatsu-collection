#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const EPISODE_IDS = {
  episode2: '9e8d80c6-737a-4546-ab6a-d8523bac562b',
  episode3: '40d9b6fe-f36e-4487-933a-99b4a66e0651', 
  episode4a: '11043d22-dc50-4843-9e86-556f77543e0a',
  episode4b: '11043d22-dc50-4843-9e86-556f77543e0a'
}

async function addLocations() {
  console.log('Season7 第2-4話ロケーションデータ追加開始...')
  console.log('=' .repeat(70))
  
  const locations = [
    {
      episodeId: EPISODE_IDS.episode2,
      name: 'マッシーナ メッシーナ',
      slug: 'massina-messina-machida-s7e2',
      address: '東京都町田市高ヶ坂1-4-17',
      description: '経堂から町田に移転したバイキングレストラン。1日1組限定のバイキングとワンコイン弁当で人気。',
      tags: ['食堂', 'バイキング', '移転店舗', 'Season7'],
      tabelog_url: 'https://tabelog.com/tokyo/A1327/A132701/13284418/',
      opening_hours: '不定休'
    },
    {
      episodeId: EPISODE_IDS.episode3,
      name: 'サルシータ',
      slug: 'salsita-minamiazabu-s7e3',
      address: '東京都港区南麻布4-5-65 広尾アーバンビル B1F',
      description: '広尾の地下にある本格メキシコ料理店。チョリソのケソフンディードや鶏肉のピピアンベルデなど本場の味を提供。',
      tags: ['メキシコ料理', '本格的', '広尾', 'Season7'],
      tabelog_url: 'https://tabelog.com/tokyo/A1307/A130703/13045856/',
      opening_hours: '11:45-14:15, 17:30-23:00'
    },
    {
      episodeId: EPISODE_IDS.episode4a,
      name: '一番',
      slug: 'ichiban-shimonita-s7e4',
      address: '群馬県甘楽郡下仁田町下仁田362',
      description: '昭和レトロな雰囲気の中華食堂。タンメンと餃子が名物。',
      tags: ['中華料理', 'タンメン', '昭和レトロ', 'Season7'],
      tabelog_url: 'https://tabelog.com/gunma/A1005/A100501/10005946/',
      opening_hours: '11:30-14:00, 17:00-20:00'
    },
    {
      episodeId: EPISODE_IDS.episode4b,
      name: 'コロムビア',
      slug: 'columbia-shimonita-s7e4',
      address: '群馬県甘楽郡下仁田町下仁田362',
      description: '下仁田の老舗すき焼き店。上州黒毛和牛、下仁田豚、上州鶏など地元食材を使用。',
      tags: ['すき焼き', '和牛', '地産地消', 'Season7'],
      tabelog_url: 'https://tabelog.com/gunma/A1005/A100501/10005687/',
      opening_hours: '11:30-14:00, 17:00-19:00'
    }
  ]
  
  let successCount = 0
  
  for (const location of locations) {
    try {
      console.log('追加中: ' + location.name)
      
      const { episodeId, ...locationData } = location
      const completeData = {
        ...locationData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        affiliate_info: {
          linkswitch: {
            status: 'active',
            last_verified: new Date().toISOString(),
            original_url: location.tabelog_url
          }
        }
      }
      
      const { data: insertedLocation, error: locationError } = await supabase
        .from('locations')
        .insert(completeData)
        .select()
        .single()
      
      if (locationError) {
        console.error('Location error:', locationError)
        continue
      }
      
      const { error: relationError } = await supabase
        .from('episode_locations')
        .insert({
          episode_id: episodeId,
          location_id: insertedLocation.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (relationError) {
        console.error('Relation error:', relationError)
        continue
      }
      
      console.log('✅ ' + location.name + ' 追加完了')
      successCount++
      
    } catch (error) {
      console.error('Error:', error)
    }
  }
  
  console.log('\n' + '=' .repeat(70))
  console.log('完了: ' + successCount + '/4 店舗追加成功')
  console.log('Season7 第2-4話のロケーションデータ追加完了!')
}

addLocations()