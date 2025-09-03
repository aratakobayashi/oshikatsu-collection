// 🚀 簡易パフォーマンス確認スクリプト
import { performance } from 'perf_hooks'

const URLS_TO_CHECK = [
  { name: 'Home', url: 'https://collection.oshikatsu-guide.com/' },
  { name: 'Celebrities', url: 'https://collection.oshikatsu-guide.com/celebrities' },
  { name: 'Celebrity Profile', url: 'https://collection.oshikatsu-guide.com/celebrities/matsushige-yutaka' },
  { name: 'Locations', url: 'https://collection.oshikatsu-guide.com/locations' },
  { name: 'Items', url: 'https://collection.oshikatsu-guide.com/items' },
]

async function checkPagePerformance(url, name) {
  console.log(`🔍 Testing ${name}...`)
  
  const start = performance.now()
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    const end = performance.now()
    const responseTime = end - start
    const contentLength = response.headers.get('content-length') || 'unknown'
    
    console.log(`✅ ${name}:`)
    console.log(`   Response Time: ${responseTime.toFixed(0)}ms`)
    console.log(`   Status: ${response.status}`)
    console.log(`   Content Length: ${contentLength} bytes`)
    console.log(`   Content Type: ${response.headers.get('content-type')}`)
    
    return {
      name,
      url,
      responseTime: Math.round(responseTime),
      status: response.status,
      size: contentLength
    }
    
  } catch (error) {
    console.error(`❌ ${name} failed:`, error.message)
    return {
      name,
      url,
      responseTime: -1,
      status: 'error',
      error: error.message
    }
  }
}

async function runPerformanceCheck() {
  console.log('🚀 Quick Performance Check')
  console.log('==========================')
  console.log('')
  
  const results = []
  
  for (const page of URLS_TO_CHECK) {
    const result = await checkPagePerformance(page.url, page.name)
    results.push(result)
    console.log('')
  }
  
  console.log('📊 Summary:')
  console.log('===========')
  results.forEach(result => {
    if (result.responseTime > 0) {
      const performance = result.responseTime < 200 ? '🟢' : 
                         result.responseTime < 500 ? '🟡' : '🔴'
      console.log(`${performance} ${result.name}: ${result.responseTime}ms`)
    } else {
      console.log(`❌ ${result.name}: Error`)
    }
  })
  
  console.log('')
  console.log('🎯 Next Steps:')
  const slowPages = results.filter(r => r.responseTime > 500)
  if (slowPages.length > 0) {
    console.log('🔴 Slow pages (>500ms):')
    slowPages.forEach(page => console.log(`   - ${page.name}: ${page.responseTime}ms`))
    console.log('   → Need optimization')
  } else {
    console.log('✅ All pages responding well!')
  }
  
  const fastPages = results.filter(r => r.responseTime <= 200)
  if (fastPages.length > 0) {
    console.log('🟢 Fast pages (≤200ms):')
    fastPages.forEach(page => console.log(`   - ${page.name}: ${page.responseTime}ms`))
  }
}

runPerformanceCheck().then(() => {
  console.log('\n✅ Performance check completed!')
}).catch(error => {
  console.error('❌ Error:', error)
})