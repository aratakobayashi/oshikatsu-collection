import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Snow Manファンサイトベースロケーションデータ
const SNOWMAN_LOCATIONS = [
  // ORICONニュースから抽出
  {
    name: 'Mystery Circus',
    address: '東京都渋谷区恵比寿西1-27-5',
    category: 'entertainment',
    description: 'エスケープゲーム施設',
    confidence: 'high',
    source: 'oricon_news'
  },
  {
    name: 'Napule Pizzeria',
    address: '東京都港区南青山5-6-24',
    category: 'restaurant',
    description: 'ナポリピザ専門店',
    confidence: 'high',
    source: 'oricon_news'
  },
  {
    name: 'Sarashina Horii',
    address: '東京都港区麻布十番1-8-7',
    category: 'restaurant', 
    description: '更科堀井 - 老舗蕎麦店',
    confidence: 'high',
    source: 'oricon_news'
  },
  {
    name: 'Wagaya no Shokudo',
    address: '東京都渋谷区桜丘町8-23-5',
    category: 'restaurant',
    description: 'わがやの食堂 - 定食屋',
    confidence: 'high',
    source: 'oricon_news'
  },
  {
    name: 'AKIBA Batting Center',
    address: '東京都千代田区外神田4-14-1 秋葉原UDX 9階',
    category: 'entertainment',
    description: 'バッティングセンター',
    confidence: 'high',
    source: 'oricon_news'
  },
  {
    name: 'Dr.HEAD 新宿店',
    address: '東京都新宿区新宿3-35-8',
    category: 'health',
    description: 'ドライヘッドスパ',
    confidence: 'high',
    source: 'oricon_news'
  },
  {
    name: 'しながわ水族館',
    address: '東京都品川区勝島3-2-1',
    category: 'tourist_spot',
    description: '水族館',
    confidence: 'high',
    source: 'oricon_news'
  },
  {
    name: 'Pablo 表参道店',
    address: '東京都渋谷区神宮前4-8-6',
    category: 'cafe',
    description: 'チーズタルト専門店',
    confidence: 'high',
    source: 'oricon_news'
  },
  {
    name: 'Club Pilates 恵比寿ガーデンプレイス店',
    address: '東京都渋谷区恵比寿4-20-4',
    category: 'health',
    description: 'ピラティススタジオ',
    confidence: 'high',
    source: 'oricon_news'
  },
  {
    name: '弁慶',
    address: '東京都港区台場1-6-1',
    category: 'entertainment',
    description: '釣り船・釣り堀',
    confidence: 'high',
    source: 'oricon_news'
  },
  // 追加ロケーション（他のファンサイト情報ベース）
  {
    name: '東京ミッドタウン日比谷',
    address: '東京都千代田区有楽町1-1-2',
    category: 'shopping',
    description: "Snow Man「We'll go together」MV撮影地",
    confidence: 'high',
    source: 'mv_location'
  },
  {
    name: '新横浜ラーメン博物館',
    address: '神奈川県横浜市港北区新横浜2-14-21',
    category: 'tourist_spot',
    description: 'ラーメンテーマパーク',
    confidence: 'high',
    source: 'youtube_episode'
  },
  {
    name: 'サンリオピューロランド',
    address: '東京都多摩市落合1-31',
    category: 'theme_park',
    description: 'サンリオキャラクターのテーマパーク',
    confidence: 'high',
    source: 'youtube_episode'
  },
  {
    name: '東京ディズニーランド',
    address: '千葉県浦安市舞浜1-1',
    category: 'theme_park',
    description: 'テーマパーク',
    confidence: 'medium',
    source: 'fan_site'
  },
  {
    name: 'ゴルフ練習場（詳細不明）',
    address: '東京都内',
    category: 'sports',
    description: 'ゴルフ練習・体験企画',
    confidence: 'medium',
    source: 'youtube_episode'
  }
];

// Snow Manファンサイトロケーション登録システム
export class SnowManFanSiteLocationImporter {
  private stats = {
    totalLocations: 0,
    successfulImports: 0,
    skippedDuplicates: 0,
    errors: 0,
    episodeMatches: 0
  };

  // メイン処理
  async importFanSiteLocations(): Promise<void> {
    console.log('🌟 Snow Manファンサイトロケーション登録開始');
    console.log('='.repeat(60));
    console.log('💡 情報源: ORICONニュース + ファンサイト情報');
    console.log(`📍 登録対象: ${SNOWMAN_LOCATIONS.length}件のロケーション\n`);

    try {
      // Snow Manのセレブリティ情報取得
      const { data: snowMan } = await supabase
        .from('celebrities')
        .select('id, name')
        .eq('slug', 'snow-man')
        .single();

      if (!snowMan) {
        console.error('❌ Snow Manが見つかりません');
        return;
      }

      console.log(`✅ セレブリティ確認: ${snowMan.name} (ID: ${snowMan.id})\n`);

      this.stats.totalLocations = SNOWMAN_LOCATIONS.length;

      // 各ロケーションを処理
      for (const [index, location] of SNOWMAN_LOCATIONS.entries()) {
        console.log(`【${index + 1}/${SNOWMAN_LOCATIONS.length}】 ${location.name}`);

        try {
          // エピソードマッチング試行
          const matchedEpisode = await this.findMatchingEpisode(location, snowMan.id);
          
          // ロケーション保存
          const result = await this.saveLocation(location, matchedEpisode, snowMan.id);
          
          if (result === 'success') {
            this.stats.successfulImports++;
            console.log(`   ✅ 登録成功: ${location.name}`);
            console.log(`      住所: ${location.address}`);
            console.log(`      カテゴリ: ${location.category}`);
            if (matchedEpisode) {
              console.log(`      エピソード: ${matchedEpisode.title}`);
              this.stats.episodeMatches++;
            }
          } else if (result === 'duplicate') {
            this.stats.skippedDuplicates++;
            console.log(`   ⚠️ 既存: ${location.name}`);
          } else {
            this.stats.errors++;
            console.log(`   ❌ エラー: ${location.name}`);
          }

        } catch (error) {
          console.error(`   ❌ 処理エラー: ${error.message}`);
          this.stats.errors++;
        }
      }

      await this.generateReport();

    } catch (error) {
      console.error('❌ 処理エラー:', error);
    }
  }

  // エピソードマッチング
  private async findMatchingEpisode(location: any, celebrityId: string): Promise<any> {
    try {
      // ロケーション名でエピソードを検索
      const searchTerms = [
        location.name,
        location.name.replace(/店$|さん$/, ''), // 「店」「さん」を除去
        location.description.split('・')[0] // 説明の最初の部分
      ];

      for (const term of searchTerms) {
        const { data: episodes } = await supabase
          .from('episodes')
          .select('id, title, date')
          .eq('celebrity_id', celebrityId)
          .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
          .order('date', { ascending: false })
          .limit(1);

        if (episodes && episodes.length > 0) {
          return episodes[0];
        }
      }

      // カテゴリベースの推測マッチング
      if (location.category === 'restaurant') {
        const { data: episodes } = await supabase
          .from('episodes')
          .select('id, title, date')
          .eq('celebrity_id', celebrityId)
          .or('title.ilike.%食べ%,title.ilike.%ランチ%,title.ilike.%ディナー%,title.ilike.%グルメ%')
          .order('date', { ascending: false })
          .limit(1);

        if (episodes && episodes.length > 0) {
          return episodes[0];
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // ロケーション保存
  private async saveLocation(location: any, episode: any, celebrityId: string): Promise<'success' | 'duplicate' | 'error'> {
    try {
      // 既存チェック
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('name', location.name)
        .eq('celebrity_id', celebrityId)
        .single();

      if (existing) {
        return 'duplicate';
      }

      // 新規保存
      const locationData = {
        name: location.name,
        slug: `${location.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${Date.now()}`,
        description: location.description,
        address: location.address,
        website_url: `https://www.google.com/maps/search/${encodeURIComponent(location.name + ' ' + location.address)}`,
        tags: this.generateTags(location),
        episode_id: episode?.id || null,
        celebrity_id: celebrityId
      };

      const { error } = await supabase
        .from('locations')
        .insert([locationData]);

      return error ? 'error' : 'success';
    } catch {
      return 'error';
    }
  }

  // タグ生成
  private generateTags(location: any): string[] {
    const tags = ['Snow Man', 'ファンサイト情報', location.category];
    
    if (location.confidence === 'high') tags.push('高精度');
    if (location.source === 'oricon_news') tags.push('ORICON');
    if (location.source === 'mv_location') tags.push('MV撮影地');
    if (location.source === 'youtube_episode') tags.push('YouTube企画');
    
    return tags;
  }

  // レポート生成
  private async generateReport(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Snow Manファンサイトロケーション登録レポート');
    console.log('='.repeat(60));

    // 総ロケーション数取得
    const { count: totalCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', await this.getSnowManId());

    console.log('\n📈 処理結果:');
    console.log(`📍 対象ロケーション: ${this.stats.totalLocations}件`);
    console.log(`✅ 新規登録: ${this.stats.successfulImports}件`);
    console.log(`⚠️ 重複スキップ: ${this.stats.skippedDuplicates}件`);
    console.log(`🔗 エピソード紐付け: ${this.stats.episodeMatches}件`);
    console.log(`❌ エラー: ${this.stats.errors}件`);

    console.log('\n📊 データベース統計:');
    console.log(`📍 Snow Man総ロケーション数: ${totalCount}件`);

    const successRate = Math.round((this.stats.successfulImports / this.stats.totalLocations) * 100);
    console.log(`🎯 登録成功率: ${successRate}%`);

    console.log('\n📱 確認URL:');
    console.log('   https://oshikatsu-collection.netlify.app/celebrities/snow-man');
    console.log('\n' + '='.repeat(60));
  }

  // Snow Man ID取得
  private async getSnowManId(): Promise<string> {
    const { data } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'snow-man')
      .single();
    return data?.id || '';
  }
}

// メイン処理
async function main() {
  const importer = new SnowManFanSiteLocationImporter();
  await importer.importFanSiteLocations();
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}