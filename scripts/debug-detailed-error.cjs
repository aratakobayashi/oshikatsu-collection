// 詳細エラーデバッグスクリプト
const crypto = require('crypto')

const SUPABASE_URL = 'https://ounloyykptsqzdqbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcWJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

async function debugDetailedError() {
  console.log('🔍 詳細エラーデバッグ開始...')
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
  
  // 1. 基本的な読み取りテスト
  console.log('\n1. episodes読み取りテスト:')
  try {
    const readResponse = await fetch(`${SUPABASE_URL}/rest/v1/episodes?limit=1`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    })
    console.log(`   Status: ${readResponse.status}`)
    if (readResponse.ok) {
      const data = await readResponse.json()
      console.log(`   ✅ 読み取り成功: ${data.length}件`)
    } else {
      console.log(`   ❌ 読み取り失敗: ${await readResponse.text()}`)
    }
  } catch (error) {
    console.log(`   ❌ 読み取りエラー: ${error.message}`)
  }
  
  // 2. items読み取りテスト
  console.log('\n2. items読み取りテスト:')
  try {
    const readResponse = await fetch(`${SUPABASE_URL}/rest/v1/items?limit=1`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    })
    console.log(`   Status: ${readResponse.status}`)
    if (readResponse.ok) {
      const data = await readResponse.json()
      console.log(`   ✅ 読み取り成功: ${data.length}件`)
      if (data.length > 0) {
        console.log('   既存アイテムのフィールド:', Object.keys(data[0]))
      }
    } else {
      console.log(`   ❌ 読み取り失敗: ${await readResponse.text()}`)
    }
  } catch (error) {
    console.log(`   ❌ 読み取りエラー: ${error.message}`)
  }
  
  // 3. アイテム挿入テスト（超シンプル）
  console.log('\n3. 最小限アイテム挿入テスト:')
  
  const testItem = {
    name: 'デバッグテストアイテム'
  }
  
  try {
    console.log('   投入データ:', testItem)
    const response = await fetch(`${SUPABASE_URL}/rest/v1/items`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(testItem)
    })
    
    console.log(`   Status: ${response.status}`)
    console.log('   Headers:', [...response.headers.entries()])
    
    const responseText = await response.text()
    console.log(`   Response: ${responseText}`)
    
    if (response.ok) {
      console.log('   ✅ 挿入成功!')
    } else {
      console.log('   ❌ 挿入失敗')
      
      // エラーの詳細解析
      try {
        const errorJson = JSON.parse(responseText)
        console.log('   エラー詳細:')
        console.log(`     Code: ${errorJson.code}`)
        console.log(`     Message: ${errorJson.message}`)
        console.log(`     Details: ${errorJson.details}`)
        console.log(`     Hint: ${errorJson.hint}`)
      } catch (e) {
        console.log('   エラーはJSON形式ではありません')
      }
    }
    
  } catch (error) {
    console.log(`   ❌ 挿入エラー: ${error.message}`)
  }
  
  // 4. JWTデコード情報
  console.log('\n4. JWT情報確認:')
  try {
    const base64Url = SUPABASE_ANON_KEY.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    
    const jwtPayload = JSON.parse(jsonPayload)
    console.log('   JWT Payload:', jwtPayload)
    console.log('   Role:', jwtPayload.role)
    console.log('   Expiry:', new Date(jwtPayload.exp * 1000))
  } catch (error) {
    console.log(`   ❌ JWT解析エラー: ${error.message}`)
  }
}

debugDetailedError()