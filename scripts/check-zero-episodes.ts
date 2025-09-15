import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.production' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function getZeroEpisodeCelebs() {
  // 全セレブリティを取得
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select('id, name, type')
    .order('type', { ascending: true });

  const zeroEpisodeCelebs = [];

  for (const celeb of celebrities || []) {
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', celeb.id);

    if (!episodes || episodes.length === 0) {
      zeroEpisodeCelebs.push(celeb);
    }
  }

  console.log('📊 エピソード0本のタレント（タイプ別）:');
  console.log('=====================================');

  const byType: Record<string, string[]> = {};
  zeroEpisodeCelebs.forEach(celeb => {
    if (!byType[celeb.type]) byType[celeb.type] = [];
    byType[celeb.type].push(celeb.name);
  });

  Object.entries(byType).forEach(([type, names]) => {
    console.log(`\n${type} (${names.length}人):`);
    names.forEach(name => console.log(`  - ${name}`));
  });

  console.log(`\n📈 合計: ${zeroEpisodeCelebs.length}人`);
}

getZeroEpisodeCelebs().catch(console.error);