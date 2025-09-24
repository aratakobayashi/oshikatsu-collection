import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.production' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkComedianFinalResults() {
  const comedians = [
    'マヂカルラブリー', 'ぺこぱ', '四千頭身', 'チョコレートプラネット',
    '霜降り明星', '見取り図', 'EXIT', 'かまいたち'
  ];

  console.log('😂 お笑い芸人最終エピソード数:');
  console.log('==============================');

  const results = [];

  for (const name of comedians) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', name)
      .single();

    if (celebrity) {
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id')
        .eq('celebrity_id', celebrity.id);

      const count = episodes?.length || 0;
      results.push({ name, count });
    }
  }

  results
    .sort((a, b) => b.count - a.count)
    .forEach((result, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      console.log(`${medal} ${result.name}: ${result.count}本`);
    });

  const total = results.reduce((sum, r) => sum + r.count, 0);
  console.log(`\n📊 総エピソード数: ${total}本`);
  console.log(`📈 平均エピソード数: ${(total / results.length).toFixed(1)}本`);
}

checkComedianFinalResults().catch(console.error);