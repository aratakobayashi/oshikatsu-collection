/**
 * TMDB APIから孤独のグルメの全エピソードと画像を取得する方法の説明
 */

export interface TMDBConfiguration {
  images: {
    base_url: string; // "https://image.tmdb.org/t/p/"
    secure_base_url: string; // "https://image.tmdb.org/t/p/"
    backdrop_sizes: string[]; // ["w300", "w780", "w1280", "original"]
    logo_sizes: string[]; 
    poster_sizes: string[]; // ["w92", "w154", "w185", "w342", "w500", "w780", "original"]
    profile_sizes: string[]; // ["w45", "w185", "h632", "original"]
    still_sizes: string[]; // ["w92", "w185", "w300", "original"] ← エピソード画像用
  }
}

export interface TMDBTVSeries {
  id: number;
  name: string;
  overview: string;
  seasons: TMDBSeason[];
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string;
  number_of_seasons: number;
  number_of_episodes: number;
}

export interface TMDBSeason {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  episode_count: number;
  air_date: string;
  poster_path: string | null;
}

export interface TMDBSeasonDetails {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: string;
  episodes: TMDBEpisode[];
}

export interface TMDBEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  air_date: string;
  still_path: string | null; // ← これがエピソード画像！
  vote_average: number;
  vote_count: number;
  runtime: number;
  season_number: number;
}

class TMDBAPIGuide {
  private apiKey: string;
  private baseUrl = 'https://api.themoviedb.org/3';
  private imageBaseUrl = 'https://image.tmdb.org/t/p/';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // 孤独のグルメの全データ取得手順
  explainDataRetrieval() {
    console.log('🍜 TMDB APIから孤独のグルメの全データを取得する手順\n');

    console.log('📋 必要なAPI呼び出し:');
    console.log('1. 設定情報取得: GET /configuration');
    console.log('2. TV詳細取得: GET /tv/55582');
    console.log('3. 各シーズン詳細: GET /tv/55582/season/{season_number}');
    console.log();

    console.log('🖼️ 画像URL構築方法:');
    console.log('- エピソード画像: https://image.tmdb.org/t/p/w300{still_path}');
    console.log('- 高解像度版: https://image.tmdb.org/t/p/original{still_path}');
    console.log('- タレント画像: https://image.tmdb.org/t/p/w500{profile_path}');
    console.log();

    console.log('📺 取得可能なデータ:');
    console.log('✅ 全11シーズンの情報');
    console.log('✅ 各エピソードのタイトル・あらすじ');
    console.log('✅ 正確な放送日');
    console.log('✅ エピソード画像（still_path）');
    console.log('✅ ランタイム（放送時間）');
    console.log('✅ 評価・投票数');
    console.log();

    console.log('💡 実装のポイント:');
    console.log('- APIレート制限: 40リクエスト/10秒');
    console.log('- 日本語対応: language=ja-JP パラメータ');
    console.log('- エラーハンドリング: 404やレート制限エラー対応');
    console.log('- 重複回避: 既存エピソードのチェック');
    console.log();
  }

  // サンプルAPIレスポンス
  showSampleResponses() {
    console.log('📄 サンプルAPIレスポンス:\n');

    const tvSeriesResponse = {
      id: 55582,
      name: "孤独のグルメ",
      overview: "井之頭五郎が仕事の合間に立ち寄る店で...",
      first_air_date: "2012-01-04",
      number_of_seasons: 11,
      number_of_episodes: 132,
      seasons: [
        {
          id: 12345,
          season_number: 1,
          name: "シーズン 1",
          episode_count: 12,
          air_date: "2012-01-04",
          poster_path: "/path-to-season-poster.jpg"
        }
      ]
    };

    const seasonResponse = {
      id: 12345,
      season_number: 1,
      name: "シーズン 1",
      episodes: [
        {
          id: 67890,
          episode_number: 1,
          name: "東京都台東区上野のカツサンド",
          overview: "井之頭五郎が上野でカツサンドを...",
          air_date: "2012-01-04",
          still_path: "/episode-1-image.jpg", // ← 重要！
          runtime: 24,
          vote_average: 8.5,
          season_number: 1
        }
      ]
    };

    console.log('1. TV Series Response:');
    console.log(JSON.stringify(tvSeriesResponse, null, 2));
    console.log('\n2. Season Details Response:');
    console.log(JSON.stringify(seasonResponse, null, 2));
    console.log();
  }

  // 実装コード例
  showImplementationExample() {
    console.log('💻 実装コード例:\n');

    const codeExample = `
// 1. 全シーズン取得
const tvData = await fetch(\`\${baseUrl}/tv/55582?api_key=\${apiKey}&language=ja-JP\`)
  .then(res => res.json());

console.log(\`全\${tvData.number_of_seasons}シーズン、\${tvData.number_of_episodes}エピソード\`);

// 2. 各シーズンの詳細取得
for (const season of tvData.seasons) {
  if (season.season_number === 0) continue; // スペシャル除外
  
  const seasonData = await fetch(
    \`\${baseUrl}/tv/55582/season/\${season.season_number}?api_key=\${apiKey}&language=ja-JP\`
  ).then(res => res.json());

  // 3. エピソード処理
  for (const episode of seasonData.episodes) {
    const episodeData = {
      title: \`孤独のグルメ Season\${episode.season_number} 第\${episode.episode_number}話「\${episode.name}」\`,
      date: episode.air_date,
      description: episode.overview,
      thumbnail_url: episode.still_path 
        ? \`https://image.tmdb.org/t/p/w300\${episode.still_path}\`
        : null,
      runtime: episode.runtime
    };
    
    // データベースに保存
    await addEpisodeToDB(episodeData);
  }
  
  // APIレート制限対策
  await sleep(250);
}`;

    console.log(codeExample);
    console.log();
  }

  // メリット・デメリット
  showProsAndCons() {
    console.log('⚖️ TMDB API使用のメリット・デメリット:\n');

    console.log('✅ メリット:');
    console.log('- 無料でアカウント登録のみ');
    console.log('- 高品質な公式画像');
    console.log('- 正確なメタデータ');
    console.log('- 日本語対応');
    console.log('- 豊富な画像サイズオプション');
    console.log('- APIが安定している');
    console.log();

    console.log('⚠️ 注意点:');
    console.log('- レート制限あり（40req/10sec）');
    console.log('- APIキー取得が必要');
    console.log('- 一部エピソードで画像なしの可能性');
    console.log('- あらすじが英語の場合もある');
    console.log();

    console.log('🎯 推奨実装:');
    console.log('1. 段階的実装（まずSeason 1のみテスト）');
    console.log('2. エラーハンドリング強化');
    console.log('3. 既存データとの重複チェック');
    console.log('4. 画像のフォールバック設定');
    console.log('5. バッチ処理でのプログレス表示');
  }
}

// 使用例
function demonstrateUsage() {
  console.log('🚀 TMDB APIを使った孤独のグルメデータ取得ガイド');
  console.log('='.repeat(60));

  // APIキーがない場合のデモ
  const guide = new TMDBAPIGuide('YOUR_API_KEY_HERE');
  
  guide.explainDataRetrieval();
  guide.showSampleResponses();
  guide.showImplementationExample();
  guide.showProsAndCons();

  console.log('🔑 次のステップ:');
  console.log('1. https://www.themoviedb.org/settings/api でAPIキー取得');
  console.log('2. 環境変数 TMDB_API_KEY に設定');
  console.log('3. fetch-kodoku-tmdb-data.ts を実行');
  console.log('4. 全130+エピソードの自動追加完了！');
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateUsage();
}

export { TMDBAPIGuide }