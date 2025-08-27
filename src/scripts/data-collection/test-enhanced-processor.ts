#!/usr/bin/env node

/**
 * Enhanced Auto Location Processor テストスクリプト
 * 新機能の動作確認用
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { 
  EnhancedAutoLocationProcessor,
  testEnhancedProcessor
} from './enhanced-auto-location-processor';

// 本番環境設定読み込み
dotenv.config({ path: '.env.production' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function runComprehensiveTest() {
  console.log('🧪 Enhanced Auto Location Processor - Comprehensive Test');
  console.log('='.repeat(60));
  
  const processor = new EnhancedAutoLocationProcessor(supabase);
  
  // より多様なテストデータ
  const testLocations = [
    // レストラン系
    {
      name: '博多一風堂 渋谷店',
      address: '東京都渋谷区道玄坂2-6-2 Daiwa渋谷square 2F',
      description: 'とんこつラーメンの有名店',
      source: 'test_restaurant'
    },
    {
      name: '寿司処 銀座 次郎',
      address: '東京都中央区銀座4-2-15 塚本素山ビル地下1階',
      description: '世界的に有名な寿司店',
      source: 'test_sushi'
    },
    {
      name: 'Bills お台場',
      address: '東京都港区台場1-6-1 アクアシティお台場 3F',
      description: 'リコッタパンケーキで有名なオーストラリア発カフェ',
      source: 'test_pancake_cafe'
    },
    
    // ショップ系
    {
      name: '東急ハンズ渋谷店',
      address: '東京都渋谷区宇田川町12-18',
      description: '生活用品とDIY用品の大型専門店',
      source: 'test_lifestyle_shop'
    },
    {
      name: 'ユニクロ 銀座店',
      address: '東京都中央区銀座6-9-5 ギンザコマツ西館',
      description: 'カジュアル衣料品の世界的ブランド',
      source: 'test_clothing'
    },
    
    // 観光地系
    {
      name: '東京スカイツリー',
      address: '東京都墨田区押上1-1-2',
      description: '高さ634mの電波塔・観光施設。東京の新しいランドマーク',
      source: 'test_landmark'
    },
    {
      name: '浅草寺',
      address: '東京都台東区浅草2-3-1',
      description: '東京最古の寺院。雷門と仲見世通りで有名',
      source: 'test_temple'
    },
    
    // エンターテイメント系
    {
      name: 'ラウンドワン 池袋店',
      address: '東京都豊島区東池袋1-21-1',
      description: 'ボウリングやカラオケ、ゲームセンターが楽しめる複合施設',
      source: 'test_entertainment'
    },
    
    // ホテル系
    {
      name: 'ザ・リッツ・カールトン東京',
      address: '東京都港区赤坂9-7-1 東京ミッドタウン',
      description: '東京ミッドタウン内の最高級ホテル',
      source: 'test_luxury_hotel'
    },
    
    // 特殊ケース
    {
      name: 'クライオサウナ六本木',
      address: '東京都港区六本木4-11-5 アルコタワー12F',
      description: '極低温サウナで話題の次世代ウェルネス施設',
      source: 'test_wellness'
    }
  ];

  console.log(`\n🔬 Testing with ${testLocations.length} diverse locations...\n`);

  try {
    // バッチ処理テスト
    const results = await processor.processLocationsBatch(testLocations);
    
    // 統計表示
    processor.displayBatchStats(results);
    
    // 詳細結果表示
    console.log('\n🔍 Detailed Results:');
    console.log('='.repeat(50));
    
    results.forEach((location, index) => {
      console.log(`\n${index + 1}. ${location.name}`);
      console.log(`   📍 Address: ${location.address}`);
      console.log(`   🏷️  Category: ${location.category}`);
      console.log(`   📝 Description: ${location.description}`);
      console.log(`   🖼️  Images: ${location.image_urls.length} assigned`);
      console.log(`   🔍 Keywords: ${location.search_keywords.join(', ')}`);
      console.log(`   🎯 Confidence: ${location.confidence}`);
      console.log(`   📊 Source: ${location.source}`);
    });

    // データベース保存テスト（テスト用セレブリティID）
    console.log('\n💾 Testing database integration...');
    const TEST_CELEBRITY_ID = 'test-celebrity-enhanced-processor';
    
    let savedCount = 0;
    for (let i = 0; i < Math.min(3, results.length); i++) {
      const success = await processor.saveToDatabase(
        results[i], 
        TEST_CELEBRITY_ID,
        `test-episode-${i + 1}`
      );
      if (success) savedCount++;
    }
    
    console.log(`✅ Database test: ${savedCount}/3 test locations saved`);

    // 品質評価
    const qualityScore = evaluateQuality(results);
    console.log(`\n🏆 Overall Quality Score: ${qualityScore}/100`);
    
    if (qualityScore >= 85) {
      console.log('🌟 EXCELLENT: Enhanced processor working perfectly!');
    } else if (qualityScore >= 70) {
      console.log('👍 GOOD: Enhanced processor working well with minor improvements needed');
    } else {
      console.log('⚠️  NEEDS ATTENTION: Some issues detected, please review');
    }

    // クリーンアップ
    await cleanupTestData(TEST_CELEBRITY_ID);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * 品質評価関数
 */
function evaluateQuality(results: any[]): number {
  if (results.length === 0) return 0;

  const metrics = {
    hasImages: results.filter(r => r.image_urls && r.image_urls.length >= 3).length / results.length,
    hasCategorization: results.filter(r => r.category && r.category !== 'other').length / results.length,
    hasDescription: results.filter(r => r.description && r.description.length > 10).length / results.length,
    hasKeywords: results.filter(r => r.search_keywords && r.search_keywords.length >= 2).length / results.length,
    highConfidence: results.filter(r => r.confidence === 'high').length / results.length
  };

  // 重み付きスコア計算
  const score = (
    metrics.hasImages * 25 +
    metrics.hasCategorization * 25 +
    metrics.hasDescription * 20 +
    metrics.hasKeywords * 15 +
    metrics.highConfidence * 15
  ) * 100;

  return Math.round(score);
}

/**
 * テストデータクリーンアップ
 */
async function cleanupTestData(celebrityId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('celebrity_id', celebrityId);
    
    if (error) {
      console.error('⚠️  Cleanup warning:', error.message);
    } else {
      console.log('🧹 Test data cleaned up successfully');
    }
  } catch (error) {
    console.error('⚠️  Cleanup error:', error);
  }
}

/**
 * シンプルテスト（軽量版）
 */
async function runSimpleTest() {
  console.log('🧪 Enhanced Auto Location Processor - Simple Test');
  console.log('='.repeat(50));
  
  const results = await testEnhancedProcessor();
  
  console.log(`\n✅ Simple test completed with ${results.length} results`);
  return results;
}

// メイン実行
async function main() {
  const testType = process.argv[2] || 'simple';
  
  try {
    if (testType === 'comprehensive') {
      await runComprehensiveTest();
    } else {
      await runSimpleTest();
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runComprehensiveTest, runSimpleTest };