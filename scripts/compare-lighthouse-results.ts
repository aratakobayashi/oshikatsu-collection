#!/usr/bin/env tsx
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

const resultsDir = join(process.cwd(), 'lighthouse-results')

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
}

function findBaselineFiles(): string[] {
  if (!existsSync(resultsDir)) {
    console.error('❌ No lighthouse-results directory found. Run the performance test first!')
    process.exit(1)
  }
  
  const files = readdirSync(resultsDir)
  return files
    .filter(f => f.startsWith('performance-baseline-') && f.endsWith('.json'))
    .sort()
}

function parseMetricValue(metric: string): number {
  if (metric === 'N/A' || metric === 'Error') return -1
  
  // Remove units and parse
  const value = metric.replace(/[^0-9.]/g, '')
  return parseFloat(value) || -1
}

function compareMetrics(before: LighthouseResult[], after: LighthouseResult[]) {
  console.log('\n📊 Performance Comparison Report')
  console.log('=====================================')
  console.log(`📅 Comparing ${before.length} pages\n`)
  
  // Performance Score Comparison
  console.log('## 🎯 Performance Score Changes\n')
  console.log('| Page | Before | After | Change | Status |')
  console.log('|------|--------|-------|--------|--------|')
  
  let totalImprovement = 0
  
  before.forEach(beforeResult => {
    const afterResult = after.find(a => a.page === beforeResult.page)
    if (!afterResult) return
    
    const change = afterResult.performance - beforeResult.performance
    totalImprovement += change
    
    const changeStr = change > 0 ? `+${change}` : `${change}`
    const emoji = change > 0 ? '📈' : change < 0 ? '📉' : '➡️'
    const status = change >= 10 ? '✨ Great!' : change >= 5 ? '👍 Good' : change >= 0 ? '👌 OK' : '⚠️ Degraded'
    
    console.log(`| ${beforeResult.page} | ${beforeResult.performance} | ${afterResult.performance} | ${changeStr} ${emoji} | ${status} |`)
  })
  
  const avgImprovement = Math.round(totalImprovement / before.length)
  console.log(`\n**Average Improvement: ${avgImprovement > 0 ? '+' : ''}${avgImprovement} points**`)
  
  // Core Web Vitals Comparison
  console.log('\n## 🔍 Core Web Vitals Changes\n')
  console.log('### LCP (Largest Contentful Paint)')
  console.log('| Page | Before | After | Improvement |')
  console.log('|------|--------|-------|-------------|')
  
  before.forEach(beforeResult => {
    const afterResult = after.find(a => a.page === beforeResult.page)
    if (!afterResult) return
    
    const beforeLCP = parseMetricValue(beforeResult.lcp)
    const afterLCP = parseMetricValue(afterResult.lcp)
    
    if (beforeLCP > 0 && afterLCP > 0) {
      const improvement = ((beforeLCP - afterLCP) / beforeLCP * 100).toFixed(1)
      const emoji = parseFloat(improvement) > 0 ? '✅' : '❌'
      console.log(`| ${beforeResult.page} | ${beforeResult.lcp} | ${afterResult.lcp} | ${improvement}% ${emoji} |`)
    }
  })
  
  console.log('\n### CLS (Cumulative Layout Shift)')
  console.log('| Page | Before | After | Status |')
  console.log('|------|--------|-------|--------|')
  
  before.forEach(beforeResult => {
    const afterResult = after.find(a => a.page === beforeResult.page)
    if (!afterResult) return
    
    const beforeCLS = parseMetricValue(beforeResult.cls)
    const afterCLS = parseMetricValue(afterResult.cls)
    
    if (beforeCLS >= 0 && afterCLS >= 0) {
      const status = afterCLS <= 0.1 ? '✅ Good' : afterCLS <= 0.25 ? '⚠️ Needs Work' : '❌ Poor'
      console.log(`| ${beforeResult.page} | ${beforeResult.cls} | ${afterResult.cls} | ${status} |`)
    }
  })
  
  // Summary and Recommendations
  console.log('\n## 📋 Summary\n')
  
  const improvements = before.filter((b, i) => {
    const a = after.find(a => a.page === b.page)
    return a && a.performance > b.performance
  }).length
  
  const degradations = before.filter((b, i) => {
    const a = after.find(a => a.page === b.page)
    return a && a.performance < b.performance
  }).length
  
  console.log(`- ✅ Improved: ${improvements} pages`)
  console.log(`- ➡️ No Change: ${before.length - improvements - degradations} pages`)
  console.log(`- ❌ Degraded: ${degradations} pages`)
  
  if (avgImprovement >= 10) {
    console.log('\n🎉 **Excellent work!** Significant performance improvements achieved!')
  } else if (avgImprovement >= 5) {
    console.log('\n👍 **Good progress!** Noticeable performance improvements.')
  } else if (avgImprovement >= 0) {
    console.log('\n👌 **Stable performance.** Minor improvements detected.')
  } else {
    console.log('\n⚠️ **Performance degradation detected.** Review recent changes.')
  }
  
  // Specific Recommendations
  console.log('\n## 💡 Next Steps\n')
  
  const worstPerformers = after
    .filter(a => a.performance < 70)
    .sort((a, b) => a.performance - b.performance)
    .slice(0, 3)
  
  if (worstPerformers.length > 0) {
    console.log('### Pages needing attention:')
    worstPerformers.forEach(page => {
      console.log(`- **${page.page}** (Score: ${page.performance}/100)`)
      
      const lcpValue = parseMetricValue(page.lcp)
      if (lcpValue > 2.5) {
        console.log(`  - Improve LCP: Currently ${page.lcp} (target: < 2.5s)`)
      }
      
      const clsValue = parseMetricValue(page.cls)
      if (clsValue > 0.1) {
        console.log(`  - Reduce CLS: Currently ${page.cls} (target: < 0.1)`)
      }
      
      const tbtValue = parseMetricValue(page.tbt)
      if (tbtValue > 200) {
        console.log(`  - Reduce TBT: Currently ${page.tbt} (target: < 200ms)`)
      }
    })
  } else {
    console.log('✨ All pages performing well! Consider:')
    console.log('- Implementing advanced optimizations (HTTP/3, Brotli compression)')
    console.log('- Adding Service Worker for offline support')
    console.log('- Optimizing third-party scripts')
  }
}

function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    // Auto-detect before and after files
    const baselineFiles = findBaselineFiles()
    
    if (baselineFiles.length < 2) {
      console.error('❌ Need at least 2 baseline files to compare.')
      console.error('Run the performance test before and after making changes.')
      process.exit(1)
    }
    
    const beforeFile = join(resultsDir, baselineFiles[baselineFiles.length - 2])
    const afterFile = join(resultsDir, baselineFiles[baselineFiles.length - 1])
    
    console.log(`📂 Comparing:`)
    console.log(`  Before: ${baselineFiles[baselineFiles.length - 2]}`)
    console.log(`  After:  ${baselineFiles[baselineFiles.length - 1]}`)
    
    const before: LighthouseResult[] = JSON.parse(readFileSync(beforeFile, 'utf-8'))
    const after: LighthouseResult[] = JSON.parse(readFileSync(afterFile, 'utf-8'))
    
    compareMetrics(before, after)
  } else if (args.length === 2) {
    // Use specified files
    const beforeFile = join(resultsDir, args[0])
    const afterFile = join(resultsDir, args[1])
    
    if (!existsSync(beforeFile) || !existsSync(afterFile)) {
      console.error('❌ One or both specified files do not exist.')
      process.exit(1)
    }
    
    const before: LighthouseResult[] = JSON.parse(readFileSync(beforeFile, 'utf-8'))
    const after: LighthouseResult[] = JSON.parse(readFileSync(afterFile, 'utf-8'))
    
    compareMetrics(before, after)
  } else {
    console.log('Usage:')
    console.log('  npm run lighthouse:compare                    # Auto-detect last 2 results')
    console.log('  npm run lighthouse:compare before.json after.json  # Compare specific files')
  }
}

main().catch(console.error)