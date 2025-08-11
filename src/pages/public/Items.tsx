import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Filter, Package, User, Calendar, ShoppingBag, Star, TrendingUp, Eye } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardContent } from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'

interface ItemWithDetails {
  id: string
  name: string
  brand: string
  brand_id: string | null
  affiliate_url: string
  image_url: string
  price: number
  category: string
  subcategory: string
  currency: string
  description: string
  color: string
  size: string
  material: string
  is_available: boolean
  episode_id: string
  created_at: string
  episode?: {
    id: string
    title: string
    date: string
    celebrity_id: string
    celebrity?: {
      id: string
      name: string
      slug: string
    }
  }
  related_posts_count?: number
}

function Items() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<ItemWithDetails[]>([])
  const [filteredItems, setFilteredItems] = useState<ItemWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at')
  
  // Sample data for demonstration - wrapped in useMemo to prevent recreation
  const sampleItems = useMemo(() => [
    {
      id: 'it1a2b3c-d4e5-f678-9012-345678901234',
      name: 'オーバーサイズTシャツ',
      brand: 'GUCCI',
      brand_id: 'br1a2b3c-d4e5-f678-9012-345678901234',
      affiliate_url: 'https://amazon.co.jp/dp/B08ABCD123',
      image_url: 'https://images.pexels.com/photos/1040914/pexels-photo-1040914.jpeg',
      price: 45000,
      category: 'clothing',
      subcategory: 'トップス',
      currency: 'JPY',
      description: 'GUCCIのロゴ入りオーバーサイズTシャツ',
      color: 'ブラック',
      size: 'M',
      material: 'コットン100%',
      is_available: true,
      episode_id: 'ep1a2b3c-d4e5-f678-9012-345678901234',
      created_at: '2024-01-15',
      episode: {
        id: 'ep1a2b3c-d4e5-f678-9012-345678901234',
        title: 'よにの朝ごはん#1',
        date: '2024-01-15',
        celebrity_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        celebrity: {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          name: '二宮和也',
          slug: 'ninomiya-kazunari'
        }
      }
    },
    {
      id: 'it2b3c4d-e5f6-g789-0123-456789012345',
      name: 'デニムジャケット',
      brand: 'Supreme',
      brand_id: 'br2b3c4d-e5f6-g789-0123-456789012345',
      affiliate_url: 'https://amazon.co.jp/dp/B08EFGH456',
      image_url: 'https://images.pexels.com/photos/1065116/pexels-photo-1065116.jpeg',
      price: 32000,
      category: 'clothing',
      subcategory: 'アウター',
      currency: 'JPY',
      description: 'Supremeのヴィンテージデニムジャケット',
      color: 'インディゴ',
      size: 'L',
      material: 'デニム',
      is_available: true,
      episode_id: 'ep2b3c4d-e5f6-g789-0123-456789012345',
      created_at: '2024-01-20',
      episode: {
        id: 'ep2b3c4d-e5f6-g789-0123-456789012345',
        title: 'VS嵐#33',
        date: '2024-01-20',
        celebrity_id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
        celebrity: {
          id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
          name: '橋本涼',
          slug: 'hashimoto-ryo'
        }
      }
    },
    {
      id: 'it3c4d5e-f6g7-h890-1234-567890123456',
      name: 'リップスティック',
      brand: 'CHANEL',
      brand_id: 'br3c4d5e-f6g7-h890-1234-567890123456',
      affiliate_url: 'https://amazon.co.jp/dp/B08IJKL789',
      image_url: 'https://images.pexels.com/photos/1043505/pexels-photo-1043505.jpeg',
      price: 4800,
      category: 'cosmetics',
      subcategory: 'リップ',
      currency: 'JPY',
      description: 'CHANELの人気リップスティック',
      color: 'レッド',
      size: '',
      material: '',
      is_available: true,
      episode_id: 'ep3c4d5e-f6g7-h890-1234-567890123456',
      created_at: '2024-01-25',
      episode: {
        id: 'ep3c4d5e-f6g7-h890-1234-567890123456',
        title: '美咲の美容ルーティン',
        date: '2024-01-25',
        celebrity_id: 'c3d4e5f6-g7h8-9012-cdef-345678901234',
        celebrity: {
          id: 'c3d4e5f6-g7h8-9012-cdef-345678901234',
          name: '田中美咲',
          slug: 'tanaka-misaki'
        }
      }
    },
    {
      id: 'it4d5e6f-g7h8-i901-2345-678901234567',
      name: 'スニーカー',
      brand: 'Nike',
      brand_id: 'br4d5e6f-g7h8-i901-2345-678901234567',
      affiliate_url: 'https://amazon.co.jp/dp/B08MNO012',
      image_url: 'https://images.pexels.com/photos/1040915/pexels-photo-1040915.jpeg',
      price: 18000,
      category: 'shoes',
      subcategory: 'スニーカー',
      currency: 'JPY',
      description: 'Nike Air Force 1 限定カラー',
      color: 'ホワイト',
      size: '27.0cm',
      material: 'レザー',
      is_available: true,
      episode_id: 'ep4d5e6f-g7h8-i901-2345-678901234567',
      created_at: '2024-02-01',
      episode: {
        id: 'ep4d5e6f-g7h8-i901-2345-678901234567',
        title: 'ケンタのファッションチェック',
        date: '2024-02-01',
        celebrity_id: 'd4e5f6g7-h8i9-0123-defg-456789012345',
        celebrity: {
          id: 'd4e5f6g7-h8i9-0123-defg-456789012345',
          name: '佐藤健太',
          slug: 'sato-kenta'
        }
      }
    }
  ], [])
  
  // Define functions BEFORE using them in useEffect
  const fetchData = useCallback(async () => {
    try {
      // Fetch all items with related data
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select(`
          *,
          episode:episodes(
            id,
            title,
            date,
            celebrity_id,
            celebrity:celebrities(id, name, slug)
          )
        `)
        .order('created_at', { ascending: false })
      
      if (itemsError) throw itemsError
      
      const allItems = itemsData || []
      setItems(allItems)
      
      // カテゴリとブランドの一覧を取得
      const uniqueCategories = [...new Set(allItems.map(item => item.category).filter(Boolean))].sort()
      const uniqueBrands = [...new Set(allItems.map(item => item.brand).filter(Boolean))].sort()
      
      setCategories(uniqueCategories)
      setBrands(uniqueBrands)
      
    } catch (error) {
      console.error('Error fetching data:', error)
      // Use sample data as fallback
      setItems(sampleItems)
    } finally {
      setLoading(false)
    }
  }, [sampleItems])
  
  const filterAndSortItems = useCallback(() => {
    let filtered = [...(items.length > 0 ? items : sampleItems)]
    
    // Enhanced Search filter with fuzzy matching
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item => {
        const searchableText = [
          item.name,
          item.description,
          item.brand,
          item.category,
          item.subcategory,
          item.color,
          item.material,
          item.episode?.celebrity?.name,
          item.episode?.title
        ].filter(Boolean).join(' ').toLowerCase()
        
        // 基本検索
        if (searchableText.includes(term)) return true
        
        // 部分マッチ検索（スペースで区切ったキーワード）
        const keywords = term.split(/\s+/).filter(k => k.length > 0)
        return keywords.every(keyword => searchableText.includes(keyword))
      })
    }
    
    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }
    
    // Brand filter
    if (selectedBrand) {
      filtered = filtered.filter(item => item.brand === selectedBrand)
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'price_asc':
          return a.price - b.price
        case 'price_desc':
          return b.price - a.price
        case 'brand_name':
          return a.brand.localeCompare(b.brand)
        default:
          return 0
      }
    })
    
    setFilteredItems(filtered)
  }, [items, sampleItems, searchTerm, selectedCategory, selectedBrand, sortBy])
  
  // Now use the functions in useEffect
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  useEffect(() => {
    filterAndSortItems()
  }, [filterAndSortItems])
  
  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedBrand) params.set('brand', selectedBrand)
    if (sortBy !== 'created_at') params.set('sort', sortBy)
    
    setSearchParams(params)
  }, [searchTerm, selectedCategory, selectedBrand, sortBy, setSearchParams])
  
  function getCategoryLabel(category: string) {
    const labels = {
      clothing: '服',
      shoes: '靴',
      bag: 'バッグ',
      accessory: 'アクセサリー',
      jewelry: 'ジュエリー',
      watch: '時計',
      cosmetics: 'コスメ',
      other: 'その他'
    }
    return labels[category as keyof typeof labels] || category
  }
  
  function clearFilters() {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedBrand('')
    setSortBy('created_at')
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">アイテムを読み込み中...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-pink-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-br from-rose-100 to-pink-100 p-4 rounded-2xl">
                <Package className="h-12 w-12 text-rose-600" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              推し愛用アイテム
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              お気に入りの推しが着用している服・アクセサリーを発見しよう
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-rose-500" />
                <span>人気ブランド多数</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-rose-500" />
                <span>厳選アイテム</span>
              </div>
              <div className="flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-rose-500" />
                <span>簡単購入</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Search and Filters */}
        <Card className="mb-12 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Main Search */}
            <div className="mb-8">
              <div className="relative max-w-2xl mx-auto">
                <Input
                  placeholder="アイテム名、ブランド名、推し名、色、素材で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-lg py-4 pl-12 pr-4 rounded-2xl border-2 border-gray-200 focus:border-rose-400 shadow-lg"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              </div>
            </div>
            
            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={[
                  { value: '', label: '📦 全てのカテゴリ' },
                  ...categories.map(category => ({ 
                    value: category, 
                    label: `🏷️ ${category}` 
                  }))
                ]}
                className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
              />
              
              <Select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                options={[
                  { value: '', label: '🏪 全てのブランド' },
                  ...brands.map(brand => ({ 
                    value: brand, 
                    label: brand 
                  }))
                ]}
                className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
              />
              
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'created_at', label: '🆕 新着順' },
                  { value: 'price_desc', label: '💰 価格高い順' },
                  { value: 'price_asc', label: '💸 価格安い順' },
                  { value: 'brand_name', label: '🔤 ブランド名順' }
                ]}
                className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
              />
              
              
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full hover:bg-rose-50 hover:border-rose-300 rounded-xl border-2 py-3"
              >
                🔄 フィルタクリア
              </Button>
            </div>
            
            {/* Results Info */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-6">
              <div className="text-sm text-gray-600 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <span className="font-medium text-rose-600">{filteredItems.length}件</span>
                のアイテムを表示中
              </div>
              
              <Link to="/submit">
                <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Package className="h-4 w-4 mr-2" />
                  アイテムを質問する
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <Card className="shadow-xl border-0">
            <CardContent className="p-16 text-center">
              <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                アイテムが見つかりません
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedCategory
                  ? '検索条件を変更してお試しください' 
                  : 'まだアイテムが登録されていません'}
              </p>
              <div className="space-x-4">
                <Button onClick={clearFilters} variant="outline" className="rounded-full">
                  フィルタをクリア
                </Button>
                <Link to="/submit">
                  <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-full">
                    アイテムを質問する
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-2xl transition-all duration-500 cursor-pointer h-full group overflow-hidden border-0 shadow-lg">
                <CardContent className="p-0">
                  {/* Image Container */}
                  <div className="relative overflow-hidden bg-gray-50">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Package className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Overlay Badges */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between">
                      <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-medium rounded-full shadow-sm">
                        {getCategoryLabel(item.category)}
                      </span>
                      
                      <span className={`px-3 py-1 text-xs font-medium rounded-full shadow-sm ${
                        item.is_available 
                          ? 'bg-green-500/90 text-white' 
                          : 'bg-red-500/90 text-white'
                      }`}>
                        {item.is_available ? '在庫あり' : '在庫なし'}
                      </span>
                    </div>
                    
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="space-y-3">
                        <Link to={`/items/${item.id}`}>
                          <Button className="bg-white text-gray-900 hover:bg-gray-100 w-full rounded-full">
                            <Eye className="h-4 w-4 mr-2" />
                            詳細を見る
                          </Button>
                        </Link>
                        {item.affiliate_url && (
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white w-full rounded-full"
                            onClick={(e) => {
                              e.preventDefault()
                              window.open(item.affiliate_url, '_blank')
                            }}
                          >
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            購入する
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 space-y-3">
                    {/* Brand */}
                    {item.brand && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-rose-600 uppercase tracking-wide">
                          {item.brand}
                        </span>
                      </div>
                    )}
                    
                    {/* Item Name */}
                    <h3 className="font-bold text-gray-900 line-clamp-2 text-lg group-hover:text-rose-600 transition-colors">
                      {item.name}
                    </h3>
                    
                    {/* Price */}
                    {item.price > 0 && (
                      <div className="text-2xl font-bold text-green-600">
                        ¥{item.price.toLocaleString()}
                        <span className="text-sm text-gray-500 font-normal ml-2">税込</span>
                      </div>
                    )}
                    
                    {/* Celebrity & Episode */}
                    {item.episode?.celebrity && (
                      <div className="bg-rose-50 rounded-xl p-3 space-y-2">
                        <div className="flex items-center text-sm">
                          <User className="h-4 w-4 mr-2 text-rose-500" />
                          <Link 
                            to={`/celebrities/${item.episode.celebrity.slug}`}
                            className="font-medium text-rose-600 hover:text-rose-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.episode.celebrity.name}
                          </Link>
                          <span className="text-gray-500 ml-2">が愛用</span>
                        </div>
                        
                        {item.episode.title && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            <Link 
                              to={`/episodes/${item.episode.id}`}
                              className="truncate hover:text-rose-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {item.episode.title}
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Item Details Tags */}
                    {(item.color || item.size || item.material) && (
                      <div className="flex flex-wrap gap-2">
                        {item.color && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {item.color}
                          </span>
                        )}
                        {item.size && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                            {item.size}
                          </span>
                        )}
                        {item.material && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            {item.material}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Link to={`/items/${item.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full hover:bg-rose-50 hover:border-rose-300 rounded-full"
                        >
                          詳細
                        </Button>
                      </Link>
                      
                      {item.affiliate_url && (
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full"
                          onClick={(e) => {
                            e.preventDefault()
                            window.open(item.affiliate_url, '_blank')
                          }}
                        >
                          <ShoppingBag className="h-4 w-4 mr-1" />
                          購入
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Load More Section */}
        {filteredItems.length > 0 && filteredItems.length >= 20 && (
          <div className="text-center mt-16">
            <Card className="inline-block shadow-lg border-0">
              <CardContent className="p-8">
                <p className="text-gray-600 mb-4">さらに多くのアイテムを見る</p>
                <Button variant="outline" className="px-8 py-3 rounded-full">
                  もっと読み込む
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default Items