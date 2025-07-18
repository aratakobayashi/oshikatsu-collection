import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Filter, Users, ExternalLink, Star, TrendingUp, Eye, Calendar, ArrowRight, MapPin, Award, User, Heart } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardContent } from '../../components/ui/Card'
import { db, Celebrity } from '../../lib/supabase'

export default function Celebrities() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [filteredCelebrities, setFilteredCelebrities] = useState<Celebrity[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedGender, setSelectedGender] = useState(searchParams.get('gender') || '')
  const [selectedDepartment, setSelectedDepartment] = useState(searchParams.get('department') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popularity')
  
  useEffect(() => {
    fetchData()
  }, [])
  
  useEffect(() => {
    filterAndSortCelebrities()
  }, [celebrities, searchTerm, selectedGender, selectedDepartment, sortBy])
  
  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (selectedGender) params.set('gender', selectedGender)
    if (selectedDepartment) params.set('department', selectedDepartment)
    if (sortBy !== 'popularity') params.set('sort', sortBy)
    
    setSearchParams(params)
  }, [searchTerm, selectedGender, selectedDepartment, sortBy, setSearchParams])
  
  async function fetchData() {
    try {
      const celebritiesData = await db.celebrities.getAll()
      setCelebrities(celebritiesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  function filterAndSortCelebrities() {
    let filtered = [...celebrities]
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(celebrity =>
        celebrity.name.toLowerCase().includes(term) ||
        celebrity.bio?.toLowerCase().includes(term) ||
        celebrity.group_name?.toLowerCase().includes(term) ||
        celebrity.also_known_as?.toLowerCase().includes(term) ||
        celebrity.place_of_birth?.toLowerCase().includes(term)
      )
    }
    
    // Gender filter
    if (selectedGender) {
      filtered = filtered.filter(celebrity => celebrity.gender?.toString() === selectedGender)
    }
    
    // Department filter
    if (selectedDepartment) {
      filtered = filtered.filter(celebrity => celebrity.known_for_department === selectedDepartment)
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'popularity':
          return (b.popularity || 0) - (a.popularity || 0)
        case 'birthday':
          if (!a.birthday && !b.birthday) return 0
          if (!a.birthday) return 1
          if (!b.birthday) return -1
          return new Date(b.birthday).getTime() - new Date(a.birthday).getTime()
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })
    
    setFilteredCelebrities(filtered)
  }
  
  function getGenderLabel(gender: number | null) {
    if (gender === 1) return '女性'
    if (gender === 2) return '男性'
    return '不明'
  }
  
  function formatBirthday(birthday: string | null) {
    if (!birthday) return null
    try {
      return new Date(birthday).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return birthday
    }
  }
  
  function getAge(birthday: string | null) {
    if (!birthday) return null
    try {
      const birth = new Date(birthday)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return age
    } catch {
      return null
    }
  }
  
  function clearFilters() {
    setSearchTerm('')
    setSelectedGender('')
    setSelectedDepartment('')
    setSortBy('popularity')
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">推しを読み込み中...</p>
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
                <Users className="h-12 w-12 text-rose-600" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              人気推し一覧
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              お気に入りの推しを見つけて、私服・愛用品・訪問店舗をチェック
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-rose-500" />
                <span>人気推し多数</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-rose-500" />
                <span>最新情報</span>
              </div>
              <div className="flex items-center">
                <Eye className="h-5 w-5 mr-2 text-rose-500" />
                <span>詳細プロフィール</span>
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
                  placeholder="推し名・グループ名・出身地で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-lg py-4 pl-12 pr-4 rounded-2xl border-2 border-gray-200 focus:border-rose-400 shadow-lg"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              </div>
            </div>
            
            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                options={[
                  { value: '', label: '👤 全ての性別' },
                  { value: '1', label: '👩 女性' },
                  { value: '2', label: '👨 男性' }
                ]}
                className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
              />
              
              <Select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                options={[
                  { value: '', label: '🎭 全ての分野' },
                  { value: 'Acting', label: '🎬 俳優' },
                  { value: 'Directing', label: '🎥 監督' },
                  { value: 'Production', label: '📺 プロデュース' },
                  { value: 'Writing', label: '✍️ 脚本' },
                  { value: 'Sound', label: '🎵 音楽' }
                ]}
                className="rounded-xl border-2 border-gray-200 focus:border-rose-400"
              />
              
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'popularity', label: '⭐ 人気順' },
                  { value: 'name', label: '🔤 名前順' },
                  { value: 'birthday', label: '🎂 誕生日順' },
                  { value: 'created_at', label: '🆕 新着順' }
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
                <span className="font-medium text-rose-600">{filteredCelebrities.length}人</span>
                の推しを表示中
              </div>
              
              <Link to="/submit">
                <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Users className="h-4 w-4 mr-2" />
                  推しを質問する
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Celebrities Grid */}
        {filteredCelebrities.length === 0 ? (
          <Card className="shadow-xl border-0">
            <CardContent className="p-16 text-center">
              <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Users className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                推しが見つかりません
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedGender || selectedDepartment
                  ? '検索条件を変更してお試しください' 
                  : 'まだ推しが登録されていません'}
              </p>
              <div className="space-x-4">
                <Button onClick={clearFilters} variant="outline" className="rounded-full">
                  フィルタをクリア
                </Button>
                <Link to="/submit">
                  <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-full">
                    推しを質問する
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredCelebrities.map((celebrity) => (
              <Link key={celebrity.id} to={`/celebrities/${celebrity.slug}`}>
                <Card className="hover:shadow-2xl transition-all duration-500 cursor-pointer h-full group border-0 shadow-lg overflow-hidden">
                  <CardContent className="p-0">
                    {/* Profile Image */}
                    <div className="relative">
                      {celebrity.image_url ? (
                        <img
                          src={celebrity.image_url}
                          alt={celebrity.name}
                          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            // Fallback for broken images
                            const target = e.target as HTMLImageElement
                            target.src = 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg'
                          }}
                        />
                      ) : (
                        <div className="w-full h-64 bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          <Users className="h-16 w-16 text-rose-400" />
                        </div>
                      )}
                      
                      {/* Overlay Badges */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between">
                        {celebrity.gender && (
                          <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-medium rounded-full shadow-sm">
                            {getGenderLabel(celebrity.gender)}
                          </span>
                        )}
                        
                        {celebrity.popularity && celebrity.popularity > 10 && (
                          <span className="px-3 py-1 bg-yellow-500/90 text-white text-xs font-medium rounded-full shadow-sm flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            人気
                          </span>
                        )}
                      </div>
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 space-y-3">
                      {/* Name */}
                      <h3 className="font-bold text-gray-900 group-hover:text-rose-600 transition-colors text-lg line-clamp-1">
                        {celebrity.name}
                      </h3>
                      
                      {/* Group Name */}
                      {celebrity.group_name && (
                        <div className="flex items-center text-sm text-purple-600">
                          <Users className="h-4 w-4 mr-1" />
                          <span className="font-medium">{celebrity.group_name}</span>
                        </div>
                      )}
                      
                      {/* Birthday & Age */}
                      {celebrity.birthday && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{formatBirthday(celebrity.birthday)}</span>
                          {getAge(celebrity.birthday) && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {getAge(celebrity.birthday)}歳
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Place of Birth */}
                      {celebrity.place_of_birth && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="line-clamp-1">{celebrity.place_of_birth}</span>
                        </div>
                      )}
                      
                      {/* Known For Department */}
                      {celebrity.known_for_department && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Award className="h-4 w-4 mr-1" />
                          <span>{celebrity.known_for_department}</span>
                        </div>
                      )}
                      
                      {/* Bio */}
                      {celebrity.bio && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {celebrity.bio}
                        </p>
                      )}
                      
                      {/* Popularity Score */}
                      {celebrity.popularity && celebrity.popularity > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-500">人気度</span>
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-gradient-to-r from-rose-500 to-pink-500 h-2 rounded-full"
                                style={{ width: `${Math.min(celebrity.popularity / 100 * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-rose-600">
                              {celebrity.popularity.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
        
        {/* Load More Section */}
        {filteredCelebrities.length > 0 && filteredCelebrities.length >= 20 && (
          <div className="text-center mt-16">
            <Card className="inline-block shadow-lg border-0">
              <CardContent className="p-8">
                <p className="text-gray-600 mb-4">さらに多くの推しを見る</p>
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