import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// 亀梨和也エピソードロケーション分析システム
export class KamenashiLocationAnalyzer {
  private episodes: any[] = [];
  private locationsToResearch: any[] = [];
  private stats = {
    totalEpisodes: 0,
    episodesWithPotentialLocations: 0,
    specificStoresIdentified: 0
  };

  // メイン処理
  async analyzeKamenashiLocations(): Promise<void> {
    console.log('🔍 亀梨和也エピソードロケーション分析開始');
    console.log('='.repeat(60));
    console.log('📺 全212エピソードからロケーション情報を抽出');
    console.log('🎯 具体的な店舗名・施設名を特定\n');

    try {
      // Step 1: 亀梨和也の全エピソード取得
      await this.fetchAllEpisodes();
      
      // Step 2: ロケーション情報の分析
      await this.analyzeLocationPatterns();

      // Step 3: レポート生成
      await this.generateReport();

    } catch (error) {
      console.error('❌ 処理エラー:', error);
    }
  }

  // 全エピソード取得
  private async fetchAllEpisodes(): Promise<void> {
    console.log('📺 エピソード取得中...');
    
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'kamenashi-kazuya')
      .single();

    if (!celebrity) {
      throw new Error('亀梨和也が見つかりません');
    }

    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('id, title, description, video_url, date')
      .eq('celebrity_id', celebrity.id)
      .order('date', { ascending: false });

    if (error || !episodes) {
      throw new Error('エピソード取得エラー');
    }

    this.episodes = episodes;
    this.stats.totalEpisodes = episodes.length;
    console.log(`✅ ${episodes.length}件のエピソードを取得\n`);
  }

  // ロケーション情報の分析
  private async analyzeLocationPatterns(): Promise<void> {
    console.log('🔍 ロケーション情報分析中...\n');

    // ロケーションキーワードパターン
    const locationKeywords = [
      // 飲食店関連
      '店', 'レストラン', 'カフェ', 'ラーメン', '焼肉', '寿司', 'バー', '居酒屋',
      'ビストロ', 'イタリアン', 'フレンチ', '中華', '和食', '洋食', 'ダイニング',
      // 施設関連
      'ホテル', '旅館', '温泉', 'スパ', 'サウナ', 'スタジオ', '劇場', 'ロケ地',
      // 地名・エリア
      '東京', '渋谷', '新宿', '銀座', '六本木', '表参道', '原宿', '青山', '赤坂',
      '恵比寿', '代官山', '中目黒', '自由が丘', '下北沢', '吉祥寺', '横浜',
      // 企画関連
      'ゲスト', 'コラボ', '訪問', '探訪', '巡り', 'ツアー', '取材', 'ロケ',
      '料理', 'グルメ', '食べ', '飲み', '体験', '挑戦'
    ];

    // カテゴリー別に分類
    const categories = {
      restaurant: [] as any[],
      hotel_spa: [] as any[],
      studio: [] as any[],
      travel: [] as any[],
      guest_collab: [] as any[],
      cooking: [] as any[],
      other: [] as any[]
    };

    for (const episode of this.episodes) {
      const titleLower = episode.title.toLowerCase();
      const descLower = (episode.description || '').toLowerCase();
      const combined = `${titleLower} ${descLower}`;

      // カテゴリー判定
      if (combined.includes('レストラン') || combined.includes('店') || 
          combined.includes('ラーメン') || combined.includes('焼肉') ||
          combined.includes('寿司') || combined.includes('カフェ')) {
        categories.restaurant.push(episode);
        this.stats.episodesWithPotentialLocations++;
      } else if (combined.includes('ホテル') || combined.includes('旅館') ||
                 combined.includes('温泉') || combined.includes('スパ')) {
        categories.hotel_spa.push(episode);
        this.stats.episodesWithPotentialLocations++;
      } else if (combined.includes('スタジオ') || combined.includes('収録')) {
        categories.studio.push(episode);
      } else if (combined.includes('旅') || combined.includes('ツアー') ||
                 combined.includes('探訪')) {
        categories.travel.push(episode);
        this.stats.episodesWithPotentialLocations++;
      } else if (combined.includes('ゲスト') || combined.includes('コラボ')) {
        categories.guest_collab.push(episode);
      } else if (combined.includes('料理') || combined.includes('クッキング')) {
        categories.cooking.push(episode);
      } else {
        // キーワードチェック
        for (const keyword of locationKeywords) {
          if (combined.includes(keyword)) {
            categories.other.push(episode);
            this.stats.episodesWithPotentialLocations++;
            break;
          }
        }
      }
    }

    // 分析結果表示
    console.log('📊 カテゴリー別分析結果:');
    console.log(`   🍽️ レストラン・飲食店: ${categories.restaurant.length}件`);
    console.log(`   🏨 ホテル・温泉・スパ: ${categories.hotel_spa.length}件`);
    console.log(`   🎬 スタジオ収録: ${categories.studio.length}件`);
    console.log(`   🧳 旅行・探訪企画: ${categories.travel.length}件`);
    console.log(`   🤝 ゲストコラボ: ${categories.guest_collab.length}件`);
    console.log(`   🍳 料理企画: ${categories.cooking.length}件`);
    console.log(`   📍 その他ロケーション: ${categories.other.length}件\n`);

    // 具体的な店舗が特定可能なエピソードをリストアップ
    console.log('🎯 特定可能な店舗候補（上位30件）:\n');
    
    let count = 0;
    for (const category of ['restaurant', 'hotel_spa', 'travel']) {
      for (const episode of categories[category as keyof typeof categories]) {
        if (count >= 30) break;
        count++;
        
        console.log(`【${count}】${episode.title}`);
        if (episode.description) {
          console.log(`   📝 ${episode.description.substring(0, 100)}...`);
        }
        console.log(`   🔗 ${episode.video_url}`);
        console.log(`   📅 ${new Date(episode.date).toLocaleDateString('ja-JP')}\n`);
        
        this.locationsToResearch.push(episode);
      }
      if (count >= 30) break;
    }
  }

  // レポート生成
  private async generateReport(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📊 亀梨和也ロケーション分析レポート');
    console.log('='.repeat(60));

    console.log('\n📈 分析結果:');
    console.log(`📺 総エピソード数: ${this.stats.totalEpisodes}件`);
    console.log(`📍 ロケーション候補: ${this.stats.episodesWithPotentialLocations}件`);
    console.log(`🎯 調査対象エピソード: ${this.locationsToResearch.length}件`);

    const percentage = Math.round(
      (this.stats.episodesWithPotentialLocations / this.stats.totalEpisodes) * 100
    );
    console.log(`📊 ロケーション含有率: ${percentage}%`);

    console.log('\n💡 次のステップ:');
    console.log('   1. 各エピソードの動画内容から具体的な店舗名を特定');
    console.log('   2. ファンサイト・ブログから撮影場所情報を収集');
    console.log('   3. SNSでの目撃情報・ロケ地情報を調査');
    console.log('   4. 特定した店舗の詳細情報（住所・電話番号）を取得');
    console.log('   5. データベースにロケーション情報を登録');

    console.log('\n🔍 調査方針:');
    console.log('   - タイトルに店名が含まれるエピソードを優先');
    console.log('   - ゲストコラボ回は撮影場所が特定しやすい');
    console.log('   - 料理企画は実際の飲食店での撮影が多い');
    console.log('   - 旅行企画は観光地・宿泊施設が明確');

    console.log('\n📝 データ保存ファイル:');
    console.log('   src/scripts/data-collection/kamenashi-locations-to-research.json');
    
    // 調査対象エピソードをJSONファイルに保存
    const fs = await import('fs/promises');
    await fs.writeFile(
      'src/scripts/data-collection/kamenashi-locations-to-research.json',
      JSON.stringify(this.locationsToResearch, null, 2)
    );
    
    console.log('\n' + '='.repeat(60));
  }
}

// メイン処理
async function main() {
  const analyzer = new KamenashiLocationAnalyzer();
  await analyzer.analyzeKamenashiLocations();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}