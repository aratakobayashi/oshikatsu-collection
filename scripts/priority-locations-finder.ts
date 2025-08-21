#!/usr/bin/env npx tsx

/**
 * 優先度の高いロケーション（収益性の高そうな店舗）を特定するスクリプト
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env.production') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function findPriorityLocations() {
  try {
    console.log('🎯 高収益が期待できる店舗を特定中...')
    
    // 飲食店キーワード
    const restaurantKeywords = [
      'レストラン', 'カフェ', '料理', 'ラーメン', '寿司', '焼肉', 
      'ベーカリー', 'パン', 'ダイニング', 'ビストロ', 'バー'
    ]
    
    // エピソードと関連データを取得
    const { data: locationsWithEpisodes, error } = await supabase
      .from('locations')
      .select(`
        id,
        name,
        address,
        website_url,
        tags,
        description,
        episode_id,
        episodes:episode_id (
          id,
          title,
          view_count,
          date,
          celebrities:celebrity_id (
            name,
            subscriber_count
          )
        )
      `)
      .not('episode_id', 'is', null)
      .order('name')
    
    if (error || !locationsWithEpisodes) {
      console.error('❌ データ取得エラー:', error)
      return
    }
    
    console.log(`📊 ${locationsWithEpisodes.length}件のエピソード関連ロケーションを分析中...`)
    
    // 飲食店をフィルタリングして優先度をスコア化
    const priorityLocations = locationsWithEpisodes
      .filter(location => {
        const searchText = [
          location.name || '',
          location.description || '',
          (location.tags || []).join(' ')
        ].join(' ').toLowerCase()
        
        return restaurantKeywords.some(keyword => 
          searchText.includes(keyword.toLowerCase())
        )
      })
      .map(location => {
        let score = 0
        let scoreDetails: string[] = []
        
        // エピソードの再生回数によるスコア
        const episode = location.episodes as any
        if (episode?.view_count) {
          if (episode.view_count > 100000) {
            score += 50
            scoreDetails.push('高再生回数(10万+)')
          } else if (episode.view_count > 50000) {
            score += 30
            scoreDetails.push('中再生回数(5万+)')
          } else if (episode.view_count > 10000) {
            score += 15
            scoreDetails.push('低再生回数(1万+)')
          }
        }
        
        // タレントのチャンネル登録者数によるスコア
        if (episode?.celebrities?.subscriber_count) {
          if (episode.celebrities.subscriber_count > 1000000) {
            score += 30
            scoreDetails.push('大物タレント(100万+)')
          } else if (episode.celebrities.subscriber_count > 500000) {
            score += 20
            scoreDetails.push('人気タレント(50万+)')
          }
        }
        
        // エピソードの新しさによるスコア
        if (episode?.date) {
          const episodeDate = new Date(episode.date)
          const now = new Date()
          const daysDiff = (now.getTime() - episodeDate.getTime()) / (1000 * 60 * 60 * 24)
          
          if (daysDiff < 90) {
            score += 20
            scoreDetails.push('最近のエピソード(3ヶ月以内)')
          } else if (daysDiff < 365) {
            score += 10
            scoreDetails.push('比較的新しい(1年以内)')
          }
        }
        
        // 人気店舗タイプによるスコア
        const name = location.name.toLowerCase()
        if (name.includes('カフェ') || name.includes('cafe')) {
          score += 15
          scoreDetails.push('カフェ系(人気ジャンル)')
        }
        if (name.includes('ベーカリー') || name.includes('パン')) {
          score += 15
          scoreDetails.push('ベーカリー系(人気ジャンル)')
        }
        if (name.includes('ラーメン')) {
          score += 10
          scoreDetails.push('ラーメン系')
        }
        
        // 既に食べログURLがある場合は減点（優先度下げる）
        if (location.website_url?.includes('tabelog.com')) {
          score -= 100 // 後回しにする
          scoreDetails.push('既に食べログURL設定済み')
        }
        
        return {
          ...location,
          priority_score: score,
          score_details: scoreDetails,
          episode_info: episode
        }
      })
      .sort((a, b) => b.priority_score - a.priority_score)
    
    console.log('\n🏆 TOP20 優先設定対象店舗:')
    console.log('=' .repeat(80))
    
    const top20 = priorityLocations.slice(0, 20)
    
    top20.forEach((location, index) => {
      console.log(`\n${index + 1}. ${location.name} (スコア: ${location.priority_score})`)
      console.log(`   ID: ${location.id}`)
      if (location.address) console.log(`   住所: ${location.address}`)
      if (location.website_url) console.log(`   現在のURL: ${location.website_url}`)
      if (location.episode_info) {
        console.log(`   エピソード: ${location.episode_info.title}`)
        if (location.episode_info.view_count) {
          console.log(`   再生回数: ${location.episode_info.view_count.toLocaleString()}回`)
        }
        if (location.episode_info.celebrities) {
          console.log(`   タレント: ${location.episode_info.celebrities.name}`)
        }
      }
      console.log(`   理由: ${location.score_details.join(', ')}`)
    })
    
    // CSV出力
    const csvData = [
      'ランク,ID,店舗名,住所,スコア,エピソードタイトル,再生回数,タレント,現在のURL,理由',
      ...top20.map((loc, index) => [
        index + 1,
        `"${loc.id}"`,
        `"${loc.name}"`,
        `"${loc.address || ''}"`,
        loc.priority_score,
        `"${loc.episode_info?.title || ''}"`,
        loc.episode_info?.view_count || 0,
        `"${loc.episode_info?.celebrities?.name || ''}"`,
        `"${loc.website_url || ''}"`,
        `"${loc.score_details.join(', ')}"`
      ].join(','))
    ].join('\n')
    
    const fs = await import('fs')
    const outputPath = resolve(__dirname, '../priority-locations-top20.csv')
    fs.writeFileSync(outputPath, csvData, 'utf-8')
    
    console.log(`\n✅ TOP20をCSVに出力: ${outputPath}`)
    console.log('\n🚀 推奨アクションプラン:')
    console.log('1. まずTOP5の店舗の食べログURLを手動で調査')
    console.log('2. アフィリエイトリンクを設定')
    console.log('3. 1週間様子を見てクリック数を確認')
    console.log('4. 効果があればTOP20まで拡大')
    
    // 統計情報
    console.log('\n📊 統計情報:')
    console.log(`総飲食店候補: ${priorityLocations.length}件`)
    console.log(`高スコア店舗(50+): ${priorityLocations.filter(l => l.priority_score >= 50).length}件`)
    console.log(`中スコア店舗(20-49): ${priorityLocations.filter(l => l.priority_score >= 20 && l.priority_score < 50).length}件`)
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

findPriorityLocations()