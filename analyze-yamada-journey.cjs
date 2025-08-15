const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeYamadaUserJourney() {
  console.log('🎭 山田涼介ユーザージャーニー分析\n');

  // ユーザージャーニーの各ステップで必要なデータを分析
  const userJourneySteps = [
    {
      step: 1,
      action: "推し検索・発見",
      required_data: [
        "基本プロフィール（名前、グループ、デビュー日）",
        "プロフィール画像",
        "所属グループ（Hey! Say! JUMP）"
      ],
      current_status: "✅ 実装済み",
      data_source: "手動入力 + YouTube API（画像）"
    },
    {
      step: 2, 
      action: "メディア活動一覧表示",
      required_data: [
        "TV番組出演リスト",
        "映画・ドラマ出演作品",
        "YouTube出演回（よにのちゃんねる）",
        "Hey! Say! JUMP活動"
      ],
      current_status: "⚠️ 一部不足",
      data_source: "YouTube API + TMDB API + 手動収集"
    },
    {
      step: 3,
      action: "エピソード詳細閲覧", 
      required_data: [
        "各出演作品の詳細情報",
        "放送・公開日",
        "役名・出演時間",
        "作品サムネイル・画像"
      ],
      current_status: "❌ 未実装",
      data_source: "TMDB API + 公式サイト"
    },
    {
      step: 4,
      action: "ロケーション発見",
      required_data: [
        "撮影場所・ロケ地情報",
        "よにのちゃんねる出演回の訪問場所", 
        "ドラマ・映画の撮影地",
        "店舗情報（住所、営業時間、予約方法）"
      ],
      current_status: "❌ 未実装",
      data_source: "動画解析 + ロケ地データベース"
    },
    {
      step: 5,
      action: "アイテム発見",
      required_data: [
        "着用衣装・ファッション",
        "使用アイテム・小物",
        "ブランド・価格情報",
        "購入リンク"
      ],
      current_status: "❌ 未実装", 
      data_source: "画像解析 + ファッション情報サイト"
    }
  ];

  console.log('📊 山田涼介ユーザージャーニー分析結果:\n');

  userJourneySteps.forEach((step, i) => {
    console.log(`${step.step}. ${step.action}`);
    console.log(`   ステータス: ${step.current_status}`);
    console.log(`   データソース: ${step.data_source}`);
    console.log(`   必要データ:`);
    step.required_data.forEach(data => {
      console.log(`     • ${data}`);
    });
    console.log('');
  });

  // データ収集の優先順位を分析
  console.log('🎯 データ収集優先順位（コスト効率重視）:\n');
  
  const priorities = [
    {
      priority: 1,
      task: "YouTube出演回データ収集",
      effort: "低",
      impact: "高", 
      method: "YouTube Data API活用",
      description: "よにのちゃんねる出演回を全て収集し、山田くん出演回をタグ付け"
    },
    {
      priority: 2, 
      task: "ドラマ・映画データ収集",
      effort: "中",
      impact: "高",
      method: "TMDB API + 手動収集",
      description: "主要出演作品をTMDB APIで取得、詳細情報を補完"
    },
    {
      priority: 3,
      task: "ロケーション特定",
      effort: "高",
      impact: "高",
      method: "動画分析 + 手動調査",
      description: "よにのちゃんねる動画から訪問店舗・場所を特定"
    },
    {
      priority: 4,
      task: "アイテム情報収集",
      effort: "高", 
      impact: "中",
      method: "画像解析 + ファッション調査",
      description: "着用アイテムの特定とブランド・価格調査"
    }
  ];

  priorities.forEach((item, i) => {
    console.log(`【優先度${item.priority}】${item.task}`);
    console.log(`   工数: ${item.effort} | 効果: ${item.impact}`);
    console.log(`   手法: ${item.method}`);
    console.log(`   内容: ${item.description}`);
    console.log('');
  });

  console.log('💡 推奨実装順序:');
  console.log('1. YouTube Data APIでよにのちゃんねる全エピソード取得');
  console.log('2. 山田涼介出演回の特定・タグ付け');
  console.log('3. TMDB APIで主要出演作品情報取得');
  console.log('4. 手動でロケーション情報を段階的に追加');
  console.log('5. 将来的にAI画像解析でアイテム特定自動化');
}

analyzeYamadaUserJourney();