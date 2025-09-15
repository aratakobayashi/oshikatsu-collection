import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.production' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function getActors() {
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select('id, name, type')
    .in('type', ['俳優', '女優'])
    .order('name');

  console.log('🎬 俳優・女優一覧:');
  console.log('================');

  for (const celeb of celebrities || []) {
    // エピソード数確認
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', celeb.id);

    const count = episodes?.length || 0;
    console.log(`${celeb.name} (${celeb.type}): ${count}本`);
  }
}

getActors().catch(console.error);