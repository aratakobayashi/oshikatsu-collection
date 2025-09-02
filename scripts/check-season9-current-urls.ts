#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSeason9CurrentUrls() {
  console.log('🔍 Season9 現在のURL状況確認...\n')
  
  const episodeIds = [
    '6095960b-6fb7-45e0-b31d-6b48f312fbf9', // Episode 10
    '26f0f108-7d92-44a3-9edc-0461645e1bdb', // Episode 9
    'be1d70e8-16ac-4aff-bac4-83fd902f7b85', // Episode 8
    'e784437d-dcc7-4f55-8c2f-b08f08faa549', // Episode 5
    '6237ac50-fe5e-4462-8f3b-ea08e6f7817e', // Episode 4
    '969559b3-33d3-41dd-b237-6d270cccf74f'  // Episode 2
  ]
  
  for (const episodeId of episodeIds) {
    const { data } = await supabase
      .from('episodes')
      .select(`
        title,
        episode_locations(
          location:locations(
            name,
            tabelog_url
          )
        )
      `)
      .eq('id', episodeId)
      .single()
    
    if (data?.episode_locations?.[0]?.location) {
      const location = data.episode_locations[0].location
      const episodeNum = data.title.match(/第(\d+)話/)?.[1] || '?'
      
      console.log(`📍 Episode ${episodeNum}: ${data.title}`)
      console.log(`  🏢 DB店舗名: ${location.name}`)
      console.log(`  🔗 DB URL: ${location.tabelog_url}`)
      console.log()
    }
  }
}

checkSeason9CurrentUrls()
