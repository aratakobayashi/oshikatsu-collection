// 📊 PageSpeed Insights API を使った詳細パフォーマンス確認
// Google PageSpeed Insights API を使用

const API_KEY = 'AIzaSyBqE5aN5T3z6K9Z8d8X5Q8yP3dJ7e2Q0n4' // 不要（公開API）

const URLS_TO_CHECK = [
  'https://collection.oshikatsu-guide.com/',
  'https://collection.oshikatsu-guide.com/celebrities'
]

async function checkPageSpeedInsights(url) {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=PERFORMANCE`
  
  console.log(`🔍 Checking PageSpeed for: ${url}`)
  
  try {
    const response = await fetch(apiUrl)
    const data = await response.json()
    
    if (data.error) {
      console.error(`❌ API Error:`, data.error.message)
      return null
    }
    
    const lighthouse = data.lighthouseResult
    const metrics = lighthouse.audits
    
    console.log(`📊 Results for ${url}:`)
    console.log(`   Performance Score: ${Math.round(lighthouse.categories.performance.score * 100)}/100`)
    
    // Core Web Vitals
    const lcp = metrics['largest-contentful-paint']
    const fid = metrics['max-potential-fid'] // FID is estimated
    const cls = metrics['cumulative-layout-shift']
    const fcp = metrics['first-contentful-paint']
    const tbt = metrics['total-blocking-time']
    
    console.log(`   🎯 Core Web Vitals:`)
    console.log(`      LCP: ${lcp?.displayValue || 'N/A'}`)
    console.log(`      FID: ${fid?.displayValue || 'N/A'}`)
    console.log(`      CLS: ${cls?.displayValue || 'N/A'}`)
    console.log(`   📈 Other Metrics:`)
    console.log(`      FCP: ${fcp?.displayValue || 'N/A'}`)
    console.log(`      TBT: ${tbt?.displayValue || 'N/A'}`)
    
    return {
      url,
      score: Math.round(lighthouse.categories.performance.score * 100),
      lcp: lcp?.numericValue || 0,
      cls: cls?.numericValue || 0,
      fcp: fcp?.numericValue || 0,
      tbt: tbt?.numericValue || 0
    }
    
  } catch (error) {
    console.error(`❌ Error checking ${url}:`, error.message)
    return null
  }
}

async function runPageSpeedCheck() {
  console.log('📊 PageSpeed Insights Check')
  console.log('============================')
  console.log('')
  
  const results = []
  
  for (const url of URLS_TO_CHECK) {
    const result = await checkPageSpeedInsights(url)
    if (result) results.push(result)
    console.log('')
  }
  
  console.log('🎯 Summary & Action Items:')
  console.log('==========================')
  results.forEach(result => {
    const status = result.score >= 90 ? '🟢 Excellent' :
                   result.score >= 70 ? '🟡 Good' :
                   result.score >= 50 ? '🟠 Needs Work' : '🔴 Poor'
    
    console.log(`${status} ${result.url}`)
    console.log(`   Score: ${result.score}/100`)
    console.log(`   LCP: ${(result.lcp/1000).toFixed(1)}s`)
    console.log(`   CLS: ${result.cls.toFixed(3)}`)
  })
  
  // 最も遅いページを特定
  const slowest = results.sort((a, b) => a.score - b.score)[0]
  if (slowest && slowest.score < 70) {
    console.log(`\\n🎯 Priority: Optimize ${slowest.url}`)
    console.log(`   Current score: ${slowest.score}/100`)
    if (slowest.lcp > 2500) console.log(`   ⚠️ LCP too slow: ${(slowest.lcp/1000).toFixed(1)}s (target: <2.5s)`)
    if (slowest.cls > 0.1) console.log(`   ⚠️ CLS too high: ${slowest.cls.toFixed(3)} (target: <0.1)`)
  }
}

runPageSpeedCheck().catch(error => {
  console.error('❌ Error:', error)
})