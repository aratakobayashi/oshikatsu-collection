import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Filter, Film, Tv, Video, Star, TrendingUp, Eye, Calendar } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardContent } from '../../components/ui/Card'
import { db, Work } from '../../lib/supabase'

export default function Works() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [works, setWorks] = useState<Work[]>([])
  const [filteredWorks, setFilteredWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'title')
  
  useEffect(() => {
    fetchData()
  }, [])
  
  useEffect(() => {
    filterAndSortWorks()
  }, [works, searchTerm, selectedType, sortBy])
  
  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (selectedType) params.set('type', selectedType)
    if (sortBy !== 'title') params.set('sort', sortBy)
    
    setSearchParams(params)
  }, [searchTerm, selectedType, sortBy, setSearchParams])
  
  async function fetchData() {
    try {
      const worksData = await db.works.getAll()
      setWorks(worksData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  function filterAndSortWorks() {
    let filtered = [...works]
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(work =>
        work.title.toLowerCase().includes(term) ||
        work.description.toLowerCase().includes(term)
      )
    }
    
    // Type filter
    if (selectedType) {
      filtered = filtered.filter(work => work.type === selectedType)
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'release_date':
          return new Date(b.release_date || 0).getTime() - new Date(a.release_date || 0).getTime()
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })
    
    setFilteredWorks(filtered)
  }
  
  function getTypeIcon(type: string) {
    switch (type) {
      case 'drama':
        return <Tv className="h-5 w-5" />
      case 'movie':
        return <Film className="h-5 w-5" />
      case 'cm':
        return <Video className="h-5 w-5" />
      case 'variety':
        return <Star className="h-5 w-5" />
      default:
        return <Film className="h-5 w-5" />
    }
  }
  
  function getTypeLabel(type: string) {
    const labels = {
      drama: 'ドラマ',
      movie: '映画',
      cm: 'CM',
      variety: 'バラエティ',
      other: 'その他'
    }
    return labels[type as keyof typeof labels] || type
  }
  
  function clearFilters() {
    setSearchTerm('')
    setSelectedType('')
    setSortBy('title')
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">作品を読み込み中...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white/20 p-4 rounded-full">
                <Film className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              ドラマ・映画・CM検索
            </h1>
            <p className="text-xl opacity-90 mb-8">
              お気に入りの作品から、推しの着用アイテムや訪問店舗を発見しよう
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm opacity-80">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                <span>人気作品多数</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2" />
                <span>最新情報</span>
              </div>
              <div className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                <span>詳細情報</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-6">
            {/* Main Search */}
            <div className="mb-6">
              <div className="relative">
                <Input
                  placeholder="作品名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-lg py-4 pl-12 pr-4 rounded-xl border-2 border-gray-200 focus:border-purple-500"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              </div>
            </div>
            
            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                options={[
                  { value: '', label: '🎬 全てのジャンル' },
                  { value: 'drama', label: '📺 ドラマ' },
                  { value: 'movie', label: '🎬 映画' },
                  { value: 'cm', label: '📹 CM' },
                  { value: 'variety', label: '⭐ バラエティ' },
                  { value: 'other', label: '🔖 その他' }
                ]}
              />
              
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'title', label: '🔤 タイトル順' },
                  { value: 'release_date', label: '📅 公開日順' },
                  { value: 'created_at', label: '🆕 新着順' }
                ]}
              />
              
              <div></div>
              
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full hover:bg-purple-50 hover:border-purple-300"
              >
                🔄 フィルタクリア
              </Button>
            </div>
            
            {/* Results Info */}
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-600 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <span className="font-medium text-purple-600">{filteredWorks.length}作品</span>
                を表示中
              </div>
              
              <Link to="/submit">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  <Film className="h-4 w-4 mr-2" />
                  作品を質問する
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Works Grid */}
        {filteredWorks.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-16 text-center">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Film className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                作品が見つかりません
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedType
                  ? '検索条件を変更してお試しください' 
                  : 'まだ作品が登録されていません'}
              </p>
              <div className="space-x-4">
                <Button onClick={clearFilters} variant="outline">
                  フィルタをクリア
                </Button>
                <Link to="/submit">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    作品を質問する
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWorks.map((work) => (
              <Link key={work.id} to={`/works/${work.slug}`}>
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full group">
                  <CardContent className="p-6 text-center">
                    {/* Poster Image */}
                    <div className="relative mb-4">
                      {work.poster_url ? (
                        <img
                          src={work.poster_url}
                          alt={work.title}
                          className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300 shadow-lg"
                        />
                      ) : (
                        <div className="w-full h-48 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                          {getTypeIcon(work.type)}
                        </div>
                      )}
                      
                      {/* Type Badge */}
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium rounded-full shadow-sm flex items-center">
                          {getTypeIcon(work.type)}
                          <span className="ml-1">{getTypeLabel(work.type)}</span>
                        </span>
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                      {work.title}
                    </h3>
                    
                    {/* Description */}
                    {work.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {work.description}
                      </p>
                    )}
                    
                    {/* Release Date */}
                    {work.release_date && (
                      <div className="flex items-center justify-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(work.release_date).getFullYear()}年
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
        
        {/* Load More Section */}
        {filteredWorks.length > 0 && filteredWorks.length >= 20 && (
          <div className="text-center mt-12">
            <Card className="inline-block">
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">さらに多くの作品を見る</p>
                <Button variant="outline" className="px-8 py-3">
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