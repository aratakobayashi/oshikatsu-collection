#!/usr/bin/env tsx
import { execSync } from 'child_process'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const URLS_TO_TEST = [
  { name: 'home', url: 'https://collection.oshikatsu-guide.com/' },
  { name: 'celebrities', url: 'https://collection.oshikatsu-guide.com/celebrities' },
  { name: 'celebrity-profile', url: 'https://collection.oshikatsu-guide.com/celebrities/matsushige-yutaka' },
  { name: 'locations', url: 'https://collection.oshikatsu-guide.com/locations' },
  { name: 'items', url: 'https://collection.oshikatsu-guide.com/items' },
]

const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const resultsDir = join(process.cwd(), 'lighthouse-results')

if (!existsSync(resultsDir)) {
  mkdirSync(resultsDir, { recursive: true })
}

interface LighthouseResult {
  page: string
  url: string
  performance: number
  fcp: string
  lcp: string
  cls: string
  tbt: string
  si: string
  tti: string
  fid?: string
}

async function runLighthouse(url: string, name: string): Promise<LighthouseResult> {
  console.log(`\n🔍 Testing ${name} (${url})...`)
  
  try {
    const outputPath = join(resultsDir, `${name}-${timestamp}.json`)
    
    // Run Lighthouse with performance-only audit
    execSync(
      `npx lighthouse "${url}" \
        --output=json \
        --output-path="${outputPath}" \
        --only-categories=performance \
        --chrome-flags="--headless" \
        --quiet`,
      { stdio: 'pipe' }
    )
    
    // Read and parse the results
    const { readFileSync } = await import('fs')
    const results = JSON.parse(
      readFileSync(outputPath, 'utf-8')
    )
    
    const metrics = results.audits
    
    return {
      page: name,
      url: url,
      performance: Math.round(results.categories.performance.score * 100),
      fcp: metrics['first-contentful-paint']?.displayValue || 'N/A',
      lcp: metrics['largest-contentful-paint']?.displayValue || 'N/A',
      cls: metrics['cumulative-layout-shift']?.displayValue || 'N/A',
      tbt: metrics['total-blocking-time']?.displayValue || 'N/A',
      si: metrics['speed-index']?.displayValue || 'N/A',
      tti: metrics['interactive']?.displayValue || 'N/A',
    }
  } catch (error) {
    console.error(`❌ Error testing ${name}:`, error)
    return {
      page: name,
      url: url,
      performance: 0,
      fcp: 'Error',
      lcp: 'Error',
      cls: 'Error',
      tbt: 'Error',
      si: 'Error',
      tti: 'Error',
    }
  }
}

function formatResults(results: LighthouseResult[]): string {
  const header = `
# 🚀 Lighthouse Performance Report
**Date**: ${new Date().toLocaleString('ja-JP')}
**Environment**: Production

## 📊 Overall Scores

| Page | Performance Score | Status |
|------|------------------|--------|`

  const scoreRows = results.map(r => {
    const emoji = r.performance >= 90 ? '🟢' : r.performance >= 50 ? '🟡' : '🔴'
    return `| ${r.page} | ${r.performance}/100 ${emoji} | ${r.performance >= 90 ? 'Good' : r.performance >= 50 ? 'Needs Improvement' : 'Poor'} |`
  }).join('\n')

  const metricsHeader = `

## 📈 Core Web Vitals & Key Metrics

| Page | FCP | LCP | CLS | TBT | SI | TTI |
|------|-----|-----|-----|-----|-----|-----|`

  const metricsRows = results.map(r => 
    `| ${r.page} | ${r.fcp} | ${r.lcp} | ${r.cls} | ${r.tbt} | ${r.si} | ${r.tti} |`
  ).join('\n')

  const legend = `

## 📖 Metrics Legend
- **FCP (First Contentful Paint)**: 最初のコンテンツ描画時間
- **LCP (Largest Contentful Paint)**: 最大コンテンツ描画時間 ⭐ Core Web Vital
- **CLS (Cumulative Layout Shift)**: 累積レイアウトシフト ⭐ Core Web Vital
- **TBT (Total Blocking Time)**: 合計ブロック時間
- **SI (Speed Index)**: スピードインデックス
- **TTI (Time to Interactive)**: 操作可能になるまでの時間

## 🎯 Target Scores for Good Performance
- **FCP**: < 1.8s
- **LCP**: < 2.5s ⭐
- **CLS**: < 0.1 ⭐
- **TBT**: < 200ms
- **SI**: < 3.4s
- **TTI**: < 3.8s`

  const recommendations = `

## 💡 Quick Wins for Performance
1. **画像最適化**: WebP/AVIF形式の使用、適切なサイズ設定
2. **JavaScriptバンドル削減**: コード分割、Tree Shaking
3. **リソースの優先度設定**: Critical CSSのインライン化
4. **キャッシュ戦略**: 静的リソースの長期キャッシュ
5. **遅延読み込み**: 画像とコンポーネントの遅延読み込み`

  return header + '\n' + scoreRows + metricsHeader + '\n' + metricsRows + legend + recommendations
}

async function main() {
  console.log('🚀 Starting Lighthouse Performance Tests...')
  console.log('================================')
  
  const results: LighthouseResult[] = []
  
  for (const target of URLS_TO_TEST) {
    const result = await runLighthouse(target.url, target.name)
    results.push(result)
    
    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  // Generate summary report
  const reportContent = formatResults(results)
  const reportPath = join(resultsDir, `performance-report-${timestamp}.md`)
  writeFileSync(reportPath, reportContent)
  
  // Also save as JSON for comparison
  const jsonPath = join(resultsDir, `performance-baseline-${timestamp}.json`)
  writeFileSync(jsonPath, JSON.stringify(results, null, 2))
  
  console.log('\n================================')
  console.log('✅ Testing Complete!')
  console.log(`📊 Report saved to: ${reportPath}`)
  console.log(`📈 Baseline data saved to: ${jsonPath}`)
  console.log('\n📋 Summary:')
  
  results.forEach(r => {
    const emoji = r.performance >= 90 ? '🟢' : r.performance >= 50 ? '🟡' : '🔴'
    console.log(`  ${emoji} ${r.page}: ${r.performance}/100`)
  })
  
  const avgScore = Math.round(
    results.reduce((sum, r) => sum + r.performance, 0) / results.length
  )
  console.log(`\n📊 Average Performance Score: ${avgScore}/100`)
  
  // Provide next steps
  console.log('\n📝 Next Steps:')
  console.log('1. Review the detailed report in lighthouse-results/')
  console.log('2. Implement performance improvements')
  console.log('3. Run this script again to measure improvements')
  console.log('4. Compare before/after metrics using the JSON files')
}

main().catch(console.error)