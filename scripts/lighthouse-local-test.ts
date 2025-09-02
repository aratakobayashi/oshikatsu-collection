#!/usr/bin/env node
/**
 * ローカル環境でのLighthouse性能測定
 * Phase 3最適化の効果確認用
 */

import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import * as fs from 'fs'

interface LocalTestResult {
  url: string
  performance: number
  fcp: number
  lcp: number
  tbt: number
  tti: number
  cls: number
  timestamp: string
}

async function runLocalLighthouse(): Promise<LocalTestResult | null> {
  console.log('🚀 ローカルLighthouse測定開始...')
  
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
  })

  try {
    const options = {
      logLevel: 'info' as const,
      output: 'json' as const,
      onlyCategories: ['performance'],
      port: chrome.port,
      throttling: {
        rttMs: 40,
        throughputKbps: 10000,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0
      }
    }

    const url = 'http://localhost:4173/'
    console.log(`🔍 測定中: ${url}`)

    const runnerResult = await lighthouse(url, options)
    
    if (!runnerResult || !runnerResult.lhr) {
      throw new Error('Lighthouse結果が取得できませんでした')
    }

    const lhr = runnerResult.lhr
    
    // Core Web Vitalsの値を取得
    const performance = Math.round(lhr.categories.performance.score! * 100)
    const fcp = lhr.audits['first-contentful-paint'].numericValue || 0
    const lcp = lhr.audits['largest-contentful-paint'].numericValue || 0
    const tbt = lhr.audits['total-blocking-time'].numericValue || 0
    const tti = lhr.audits['interactive'].numericValue || 0  
    const cls = lhr.audits['cumulative-layout-shift'].numericValue || 0

    const result: LocalTestResult = {
      url,
      performance,
      fcp: Math.round(fcp),
      lcp: Math.round(lcp), 
      tbt: Math.round(tbt),
      tti: Math.round(tti),
      cls: Math.round(cls * 1000) / 1000,
      timestamp: new Date().toISOString()
    }

    return result

  } catch (error) {
    console.error('❌ エラー:', error)
    return null
  } finally {
    await chrome.kill()
  }
}

async function main() {
  console.log('📊 Phase 3最適化後のローカル性能測定')
  console.log('================================')
  
  const result = await runLocalLighthouse()
  
  if (result) {
    console.log('\n✅ 測定完了!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📈 Performance Score: ${result.performance}/100`)
    console.log(`⚡ First Contentful Paint: ${result.fcp}ms`)
    console.log(`🎯 Largest Contentful Paint: ${result.lcp}ms`) 
    console.log(`⏳ Total Blocking Time: ${result.tbt}ms`)
    console.log(`🎮 Time to Interactive: ${result.tti}ms`)
    console.log(`📐 Cumulative Layout Shift: ${result.cls}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // 改善の評価
    if (result.performance >= 90) {
      console.log('🎉 EXCELLENT! 大幅改善されています')
    } else if (result.performance >= 70) {
      console.log('👍 GOOD! 改善効果が確認できます') 
    } else if (result.performance >= 50) {
      console.log('📈 FAIR: さらなる最適化が必要です')
    } else {
      console.log('🔧 NEEDS WORK: 追加の最適化が必要です')
    }

    // 特に重要な指標をチェック
    if (result.lcp <= 2500) {
      console.log('✅ LCP: 良好 (≤2.5s)')
    } else if (result.lcp <= 4000) {
      console.log('⚠️  LCP: 要改善 (2.5-4s)')
    } else {
      console.log('❌ LCP: 改善必要 (>4s)')
    }
    
    // 結果をファイルに保存
    const outputPath = './lighthouse-results/phase3-local-result.json'
    fs.mkdirSync('./lighthouse-results', { recursive: true })
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
    console.log(`\n💾 結果保存: ${outputPath}`)
    
  } else {
    console.log('❌ 測定に失敗しました')
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { runLocalLighthouse }