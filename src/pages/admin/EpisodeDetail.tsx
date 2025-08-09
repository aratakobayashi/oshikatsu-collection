import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, ShoppingBag, Plus, Trash2, Search, ExternalLink, Zap, Star } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { db, Episode, Celebrity } from '../../lib/supabase'

interface Location {
  id: string
  name: string
  slug: string
  description?: string
  address?: string
  website_url?: string
  tags?: string[]
}

interface Item {
  id: string
  name: string
  slug: string
  description?: string
  brand?: string
  price?: number
  purchase_url?: string
  category?: string
  tags?: string[]
}

interface EpisodeLocation {
  id: string
  episode_id: string
  location_id: string
  location?: Location
  created_at: string
}

interface EpisodeItem {
  id: string
  episode_id: string
  item_id: string
  item?: Item
  created_at: string
}

interface AutoSuggestion {
  type: 'location' | 'item'
  entity_id: string
  entity_name: string
  confidence: number
  match_reason: string
  matched_text: string
}

export default function AdminEpisodeDetail() {
  const { id } = useParams<{ id: string }>()
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [celebrity, setCelebrity] = useState<Celebrity | null>(null)
  const [episodeLocations, setEpisodeLocations] = useState<EpisodeLocation[]>([])
  const [episodeItems, setEpisodeItems] = useState<EpisodeItem[]>([])
  const [allLocations, setAllLocations] = useState<Location[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 新規紐付け用
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [itemSearch, setItemSearch] = useState('')
  
  // 自動マッチング用
  const [autoSuggestions, setAutoSuggestions] = useState<AutoSuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (id) {
      fetchEpisodeDetail(id)
    }
  }, [id])

  async function fetchEpisodeDetail(episodeId: string) {
    try {
      setLoading(true)
      
      // エピソード基本情報取得
      const episodeData = await db.episodes.getById(episodeId)
      if (!episodeData) {
        setError('エピソードが見つかりません')
        return
      }
      setEpisode(episodeData)
      
      // 関連セレブ情報取得
      if (episodeData.celebrity_id) {
        const celebrityData = await db.celebrities.getById(episodeData.celebrity_id)
        setCelebrity(celebrityData)
        
        // そのセレブの全店舗・アイテム情報を取得
        const [locationsData, itemsData] = await Promise.all([
          db.locations.getByCelebrityId(episodeData.celebrity_id),
          db.items.getByCelebrityId(episodeData.celebrity_id)
        ])
        setAllLocations(locationsData)
        setAllItems(itemsData)
      }
      
      // このエピソードに紐付いた店舗・アイテム取得
      const [linkedLocations, linkedItems] = await Promise.all([
        fetchEpisodeLocations(episodeId),
        fetchEpisodeItems(episodeId)
      ])
      setEpisodeLocations(linkedLocations)
      setEpisodeItems(linkedItems)
      
    } catch (error) {
      console.error('Error fetching episode detail:', error)
      setError('データの取得中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // エピソード-店舗の紐付け情報を取得
  async function fetchEpisodeLocations(episodeId: string): Promise<EpisodeLocation[]> {
    try {
      const { data, error } = await db.supabase
        .from('episode_locations')
        .select(`
          id,
          episode_id,
          location_id,
          created_at,
          locations:location_id (
            id,
            name,
            slug,
            description,
            address,
            website_url,
            tags
          )
        `)
        .eq('episode_id', episodeId)
      
      if (error) throw error
      
      return data.map(item => ({
        id: item.id,
        episode_id: item.episode_id,
        location_id: item.location_id,
        location: item.locations ? {
          id: item.locations.id,
          name: item.locations.name,
          slug: item.locations.slug,
          description: item.locations.description,
          address: item.locations.address,
          website_url: item.locations.website_url,
          tags: item.locations.tags
        } : undefined,
        created_at: item.created_at
      }))
    } catch (error) {
      console.error('Error fetching episode locations:', error)
      return []
    }
  }

  // エピソード-アイテムの紐付け情報を取得
  async function fetchEpisodeItems(episodeId: string): Promise<EpisodeItem[]> {
    try {
      const { data, error } = await db.supabase
        .from('episode_items')
        .select(`
          id,
          episode_id,
          item_id,
          created_at,
          items:item_id (
            id,
            name,
            slug,
            description,
            brand,
            price,
            purchase_url,
            category,
            tags
          )
        `)
        .eq('episode_id', episodeId)
      
      if (error) throw error
      
      return data.map(item => ({
        id: item.id,
        episode_id: item.episode_id,
        item_id: item.item_id,
        item: item.items ? {
          id: item.items.id,
          name: item.items.name,
          slug: item.items.slug,
          description: item.items.description,
          brand: item.items.brand,
          price: item.items.price,
          purchase_url: item.items.purchase_url,
          category: item.items.category,
          tags: item.items.tags
        } : undefined,
        created_at: item.created_at
      }))
    } catch (error) {
      console.error('Error fetching episode items:', error)
      return []
    }
  }

  // 自動マッチング実行
  async function runAutoMatching() {
    if (!episode) return
    
    setIsAnalyzing(true)
    try {
      // エピソードのタイトルと説明文を分析
      const episodeText = [
        episode.title || '',
        episode.description || ''
      ].join(' ')
      
      console.log('🤖 自動マッチング開始:', episode.title)
      
      const suggestions: AutoSuggestion[] = []
      
      // 店舗のマッチング
      for (const location of allLocations) {
        let confidence = 0
        let matchReason = ''
        let matchedText = ''
        
        const text = episodeText.toLowerCase()
        
        // 店舗名での完全一致
        if (text.includes(location.name.toLowerCase())) {
          confidence += 0.9
          matchReason += '店舗名完全一致, '
          matchedText = location.name
        }
        
        // 住所での一致
        if (location.address && text.includes(location.address.toLowerCase())) {
          confidence += 0.4
          matchReason += `住所一致, `
        }
        
        // タグでの一致
        if (location.tags) {
          for (const tag of location.tags) {
            if (text.includes(tag.toLowerCase())) {
              confidence += 0.3
              matchReason += `タグ一致(${tag}), `
            }
          }
        }
        
        // カフェ・レストラン関連キーワード
        const locationKeywords = ['カフェ', 'cafe', 'コーヒー', 'coffee', 'レストラン', 'restaurant', 'お店', '店舗', 'ホテル', 'hotel']
        for (const keyword of locationKeywords) {
          if (text.includes(keyword)) {
            confidence += 0.1
            matchReason += `関連キーワード(${keyword}), `
          }
        }
        
        if (confidence >= 0.3) {
          suggestions.push({
            type: 'location',
            entity_id: location.id,
            entity_name: location.name,
            confidence: Math.min(confidence, 1.0),
            match_reason: matchReason.replace(/, $/, ''),
            matched_text: matchedText.trim() || location.name
          })
        }
      }
      
      // アイテムのマッチング
      for (const item of allItems) {
        let confidence = 0
        let matchReason = ''
        let matchedText = ''
        
        const text = episodeText.toLowerCase()
        
        // アイテム名での完全一致
        if (text.includes(item.name.toLowerCase())) {
          confidence += 0.9
          matchReason += 'アイテム名完全一致, '
          matchedText = item.name
        }
        
        // ブランド名での一致
        if (item.brand && text.includes(item.brand.toLowerCase())) {
          confidence += 0.8
          matchReason += `ブランド一致(${item.brand}), `
          matchedText = item.brand
        }
        
        // カテゴリでの一致
        if (item.category && text.includes(item.category.toLowerCase())) {
          confidence += 0.5
          matchReason += `カテゴリ一致(${item.category}), `
        }
        
        // タグでの一致
        if (item.tags) {
          for (const tag of item.tags) {
            if (text.includes(tag.toLowerCase())) {
              confidence += 0.3
              matchReason += `タグ一致(${tag}), `
            }
          }
        }
        
        // ファッション関連キーワード
        const fashionKeywords = ['服', '着用', '着てた', '着ていた', 'ファッション', 'コーデ', 'バッグ', 'カバン', 'アクセサリー', '靴']
        for (const keyword of fashionKeywords) {
          if (text.includes(keyword)) {
            confidence += 0.1
            matchReason += `関連キーワード(${keyword}), `
          }
        }
        
        if (confidence >= 0.3) {
          suggestions.push({
            type: 'item',
            entity_id: item.id,
            entity_name: item.name,
            confidence: Math.min(confidence, 1.0),
            match_reason: matchReason.replace(/, $/, ''),
            matched_text: matchedText.trim() || item.name
          })
        }
      }
      
      // 信頼度順にソート
      suggestions.sort((a, b) => b.confidence - a.confidence)
      
      setAutoSuggestions(suggestions)
      setShowSuggestions(true)
      
      console.log('✅ 自動マッチング完了:', suggestions.length, '件の提案')
      
    } catch (error) {
      console.error('❌ 自動マッチングエラー:', error)
      alert('自動マッチングでエラーが発生しました')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 提案から直接紐付け
  async function linkFromSuggestion(suggestion: AutoSuggestion) {
    if (!id) return
    
    try {
      if (suggestion.type === 'location') {
        const { error } = await db.supabase
          .from('episode_locations')
          .insert({
            episode_id: id,
            location_id: suggestion.entity_id
          })
        
        if (error) throw error
        
        const updatedLocations = await fetchEpisodeLocations(id)
        setEpisodeLocations(updatedLocations)
        
      } else if (suggestion.type === 'item') {
        const { error } = await db.supabase
          .from('episode_items')
          .insert({
            episode_id: id,
            item_id: suggestion.entity_id
          })
        
        if (error) throw error
        
        const updatedItems = await fetchEpisodeItems(id)
        setEpisodeItems(updatedItems)
      }
      
      // 提案リストから削除
      setAutoSuggestions(prev => prev.filter(s => s.entity_id !== suggestion.entity_id))
      
    } catch (error) {
      console.error('提案からの紐付けエラー:', error)
      alert('紐付けに失敗しました')
    }
  }

  // 店舗をエピソードに紐付け
  async function linkLocation() {
    if (!selectedLocationId || !id) return
    
    try {
      const { error } = await db.supabase
        .from('episode_locations')
        .insert({
          episode_id: id,
          location_id: selectedLocationId
        })
      
      if (error) throw error
      
      // 再取得
      const updatedLocations = await fetchEpisodeLocations(id)
      setEpisodeLocations(updatedLocations)
      
      // フォームをリセット
      setSelectedLocationId('')
      setShowLocationForm(false)
      
    } catch (error) {
      console.error('Error linking location:', error)
      alert('店舗の紐付けに失敗しました')
    }
  }

  // アイテムをエピソードに紐付け
  async function linkItem() {
    if (!selectedItemId || !id) return
    
    try {
      const { error } = await db.supabase
        .from('episode_items')
        .insert({
          episode_id: id,
          item_id: selectedItemId
        })
      
      if (error) throw error
      
      // 再取得
      const updatedItems = await fetchEpisodeItems(id)
      setEpisodeItems(updatedItems)
      
      // フォームをリセット
      setSelectedItemId('')
      setShowItemForm(false)
      
    } catch (error) {
      console.error('Error linking item:', error)
      alert('アイテムの紐付けに失敗しました')
    }
  }

  // 店舗紐付け削除
  async function unlinkLocation(linkId: string) {
    if (!confirm('この店舗の紐付けを削除しますか？')) return
    
    try {
      const { error } = await db.supabase
        .from('episode_locations')
        .delete()
        .eq('id', linkId)
      
      if (error) throw error
      
      setEpisodeLocations(prev => prev.filter(item => item.id !== linkId))
    } catch (error) {
      console.error('Error unlinking location:', error)
      alert('店舗の紐付け削除に失敗しました')
    }
  }

  // アイテム紐付け削除
  async function unlinkItem(linkId: string) {
    if (!confirm('このアイテムの紐付けを削除しますか？')) return
    
    try {
      const { error } = await db.supabase
        .from('episode_items')
        .delete()
        .eq('id', linkId)
      
      if (error) throw error
      
      setEpisodeItems(prev => prev.filter(item => item.id !== linkId))
    } catch (error) {
      console.error('Error unlinking item:', error)
      alert('アイテムの紐付け削除に失敗しました')
    }
  }

  // 店舗フィルタリング
  const filteredLocations = allLocations.filter(location =>
    location.name.toLowerCase().includes(locationSearch.toLowerCase()) &&
    !episodeLocations.some(el => el.location_id === location.id)
  )

  // アイテムフィルタリング
  const filteredItems = allItems.filter(item =>
    (item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
     (item.brand && item.brand.toLowerCase().includes(itemSearch.toLowerCase()))) &&
    !episodeItems.some(ei => ei.item_id === item.id)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !episode) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">エラー</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to="/admin/episodes">
              <Button>エピソード一覧に戻る</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <Link 
          to="/admin/episodes"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          エピソード一覧に戻る
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{episode.title}</h1>
            {celebrity && (
              <p className="text-lg text-gray-600">{celebrity.name}</p>
            )}
            <p className="text-sm text-gray-500">
              {new Date(episode.date).toLocaleDateString('ja-JP')}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={runAutoMatching}
              disabled={isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700 flex items-center"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  分析中...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  自動提案
                </>
              )}
            </Button>
            
            {episode.video_url && (
              <a
                href={episode.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                動画を開く
              </a>
            )}
          </div>
        </div>
        
        {episode.description && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">{episode.description}</p>
          </div>
        )}
      </div>

      {/* 自動提案セクション */}
      {showSuggestions && autoSuggestions.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-900">自動提案</h3>
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  {autoSuggestions.length}件
                </span>
              </div>
              <Button
                onClick={() => setShowSuggestions(false)}
                variant="outline"
                size="sm"
                className="text-purple-600 border-purple-300"
              >
                ×
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {autoSuggestions.slice(0, 10).map((suggestion, index) => (
                <div 
                  key={`${suggestion.type}-${suggestion.entity_id}`}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {suggestion.type === 'location' ? (
                        <MapPin className="h-4 w-4 text-amber-600" />
                      ) : (
                        <ShoppingBag className="h-4 w-4 text-rose-600" />
                      )}
                      <span className="font-medium text-gray-900">
                        {suggestion.entity_name}
                      </span>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium text-yellow-600">
                          {(suggestion.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      <strong>理由:</strong> {suggestion.match_reason}
                    </p>
                    {suggestion.matched_text && (
                      <p className="text-xs text-purple-600">
                        <strong>一致テキスト:</strong> "{suggestion.matched_text}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      onClick={() => linkFromSuggestion(suggestion)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      追加
                    </Button>
                  </div>
                </div>
              ))}
              {autoSuggestions.length > 10 && (
                <div className="text-center text-sm text-gray-500">
                  他 {autoSuggestions.length - 10} 件の提案があります
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 店舗情報セクション */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-amber-600" />
                <h2 className="text-xl font-semibold">関連店舗</h2>
                <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                  {episodeLocations.length}件
                </span>
              </div>
              <Button 
                onClick={() => setShowLocationForm(true)}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                追加
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {episodeLocations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  関連する店舗が登録されていません
                </p>
              ) : (
                episodeLocations.map((episodeLocation) => (
                  <div key={episodeLocation.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {episodeLocation.location?.name}
                      </h3>
                      {episodeLocation.location?.address && (
                        <p className="text-sm text-gray-600 mb-2">
                          {episodeLocation.location.address}
                        </p>
                      )}
                      {episodeLocation.location?.description && (
                        <p className="text-sm text-gray-700 mb-2">
                          {episodeLocation.location.description}
                        </p>
                      )}
                      {episodeLocation.location?.tags && episodeLocation.location.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {episodeLocation.location.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {episodeLocation.location?.website_url && (
                        <a
                          href={episodeLocation.location.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <Button
                        onClick={() => unlinkLocation(episodeLocation.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* アイテム情報セクション */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-rose-600" />
                <h2 className="text-xl font-semibold">関連アイテム</h2>
                <span className="ml-2 px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded-full">
                  {episodeItems.length}件
                </span>
              </div>
              <Button 
                onClick={() => setShowItemForm(true)}
                size="sm"
                className="bg-rose-600 hover:bg-rose-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                追加
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {episodeItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  関連するアイテムが登録されていません
                </p>
              ) : (
                episodeItems.map((episodeItem) => (
                  <div key={episodeItem.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {episodeItem.item?.brand && (
                          <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded font-medium">
                            {episodeItem.item.brand}
                          </span>
                        )}
                        {episodeItem.item?.category && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {episodeItem.item.category}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {episodeItem.item?.name}
                      </h3>
                      {episodeItem.item?.description && (
                        <p className="text-sm text-gray-700 mb-2">
                          {episodeItem.item.description}
                        </p>
                      )}
                      {episodeItem.item?.price && episodeItem.item.price > 0 && (
                        <p className="text-green-600 font-semibold text-sm mb-2">
                          ¥{episodeItem.item.price.toLocaleString()}
                        </p>
                      )}
                      {episodeItem.item?.tags && episodeItem.item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {episodeItem.item.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {episodeItem.item?.purchase_url && (
                        <a
                          href={episodeItem.item.purchase_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <Button
                        onClick={() => unlinkItem(episodeItem.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 店舗追加モーダル */}
      {showLocationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">店舗を紐付ける</h3>
              <Button 
                onClick={() => setShowLocationForm(false)}
                variant="outline"
                size="sm"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="店舗名で検索..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredLocations.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    該当する店舗が見つかりません
                  </p>
                ) : (
                  filteredLocations.map((location) => (
                    <div 
                      key={location.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedLocationId === location.id 
                          ? 'border-amber-500 bg-amber-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedLocationId(location.id)}
                    >
                      <h4 className="font-medium text-gray-900">{location.name}</h4>
                      {location.address && (
                        <p className="text-sm text-gray-600">{location.address}</p>
                      )}
                      {location.description && (
                        <p className="text-sm text-gray-700 mt-1">
                          {location.description.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  onClick={() => setShowLocationForm(false)}
                  variant="outline"
                >
                  キャンセル
                </Button>
                <Button 
                  onClick={linkLocation}
                  disabled={!selectedLocationId}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  紐付ける
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* アイテム追加モーダル */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">アイテムを紐付ける</h3>
              <Button 
                onClick={() => setShowItemForm(false)}
                variant="outline"
                size="sm"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="アイテム名・ブランド名で検索..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    該当するアイテムが見つかりません
                  </p>
                ) : (
                  filteredItems.map((item) => (
                    <div 
                      key={item.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedItemId === item.id 
                          ? 'border-rose-500 bg-rose-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedItemId(item.id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {item.brand && (
                          <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded">
                            {item.brand}
                          </span>
                        )}
                        {item.category && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-700 mt-1">
                          {item.description.substring(0, 100)}...
                        </p>
                      )}
                      {item.price && item.price > 0 && (
                        <p className="text-green-600 font-semibold text-sm mt-1">
                          ¥{item.price.toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  onClick={() => setShowItemForm(false)}
                  variant="outline"
                >
                  キャンセル
                </Button>
                <Button 
                  onClick={linkItem}
                  disabled={!selectedItemId}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  紐付ける
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}