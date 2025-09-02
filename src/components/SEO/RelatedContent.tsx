import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Users, MapPin, Package, Play, Star, ExternalLink } from 'lucide-react'
import { db } from '../../lib/supabase'
import { generateImageProps } from '../../utils/imageOptimization'
import Card, { CardContent } from '../ui/Card'

interface RelatedItem {
  id: string
  title: string
  slug?: string
  image_url?: string
  description?: string
  category?: string
  type: 'celebrity' | 'location' | 'item' | 'episode'
  metadata?: {
    brand?: string
    price?: number
    address?: string
    celebrity_name?: string
    view_count?: number
    date?: string
  }
}

interface RelatedContentProps {
  currentId: string
  currentType: 'celebrity' | 'location' | 'item' | 'episode'
  currentTitle: string
  limit?: number
  className?: string
}

export const RelatedContent: React.FC<RelatedContentProps> = ({
  currentId,
  currentType,
  currentTitle,
  limit = 3,
  className = ''
}) => {
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRelatedContent()
  }, [currentId, currentType])

  const fetchRelatedContent = async () => {
    try {
      setLoading(true)
      
      let items: RelatedItem[] = []
      
      // タイプ別に実際のデータを取得
      switch (currentType) {
        case 'celebrity':
          items = await getRelatedToCelebrity(currentId)
          break
        case 'location':
          items = await getRelatedToLocation(currentId)
          break
        case 'item':
          items = await getRelatedToItem(currentId)
          break
        case 'episode':
          items = await getRelatedToEpisode(currentId)
          break
        default:
          // フォールバック：人気コンテンツを表示
          items = await getPopularContent()
      }
      
      // 重複除去とシャッフル
      const uniqueItems = items
        .filter((item, index, arr) => 
          arr.findIndex(i => i.id === item.id && i.type === item.type) === index
        )
        .slice(0, limit)
      
      setRelatedItems(uniqueItems)
    } catch (error) {
      console.error('Error fetching related content:', error)
      // エラー時のフォールバック
      await getFallbackContent()
    } finally {
      setLoading(false)
    }
  }

  // セレブリティに関連するコンテンツを取得
  const getRelatedToCelebrity = async (celebrityId: string): Promise<RelatedItem[]> => {
    const items: RelatedItem[] = []

    // 同じセレブリティの他のエピソード
    try {
      const { data: episodes } = await db.supabase
        .from('episodes')
        .select('id, title, date, thumbnail_url, view_count')
        .eq('celebrity_id', celebrityId)
        .neq('id', currentId)
        .order('date', { ascending: false })
        .limit(2)

      if (episodes) {
        items.push(...episodes.map(ep => ({
          id: ep.id,
          title: ep.title,
          image_url: ep.thumbnail_url,
          type: 'episode' as const,
          metadata: {
            view_count: ep.view_count,
            date: ep.date
          }
        })))
      }
    } catch (error) {
      console.error('Error fetching related episodes:', error)
    }

    // 同じセレブリティが使用したアイテム
    try {
      const { data: itemsData } = await db.supabase
        .from('items')
        .select(`
          id, name, brand, image_url, price, category,
          episodes!inner(celebrity_id)
        `)
        .eq('episodes.celebrity_id', celebrityId)
        .limit(2)

      if (itemsData) {
        items.push(...itemsData.map(item => ({
          id: item.id,
          title: item.name,
          image_url: item.image_url,
          type: 'item' as const,
          metadata: {
            brand: item.brand,
            price: item.price
          }
        })))
      }
    } catch (error) {
      console.error('Error fetching related items:', error)
    }

    return items
  }

  // ロケ地に関連するコンテンツを取得
  const getRelatedToLocation = async (locationId: string): Promise<RelatedItem[]> => {
    const items: RelatedItem[] = []

    // 同じ地域の他のロケ地
    try {
      const currentLocation = await db.locations.getById(locationId)
      if (currentLocation?.address) {
        const prefecture = currentLocation.address.split(/[都道府県]/)[0] + 
                         (currentLocation.address.match(/[都道府県]/) || [''])[0]
        
        const { data: nearbyLocations } = await db.supabase
          .from('locations')
          .select('id, name, address, image_url')
          .like('address', `${prefecture}%`)
          .neq('id', locationId)
          .limit(2)

        if (nearbyLocations) {
          items.push(...nearbyLocations.map(loc => ({
            id: loc.id,
            title: loc.name,
            image_url: loc.image_url,
            type: 'location' as const,
            metadata: {
              address: loc.address
            }
          })))
        }
      }
    } catch (error) {
      console.error('Error fetching nearby locations:', error)
    }

    // このロケ地を訪れたセレブリティ
    try {
      const { data: celebrityVisits } = await db.supabase
        .from('episode_locations')
        .select(`
          episodes!inner(
            celebrity_id,
            celebrities!inner(id, name, slug, image_url)
          )
        `)
        .eq('location_id', locationId)
        .limit(2)

      if (celebrityVisits) {
        const celebrities = celebrityVisits.map(visit => visit.episodes.celebrities).filter(Boolean)
        items.push(...celebrities.map(celeb => ({
          id: celeb.id,
          title: celeb.name,
          slug: celeb.slug,
          image_url: celeb.image_url,
          type: 'celebrity' as const
        })))
      }
    } catch (error) {
      console.error('Error fetching visiting celebrities:', error)
    }

    return items
  }

  // アイテムに関連するコンテンツを取得
  const getRelatedToItem = async (itemId: string): Promise<RelatedItem[]> => {
    const items: RelatedItem[] = []

    try {
      const currentItem = await db.supabase
        .from('items')
        .select('brand, category, episode_id')
        .eq('id', itemId)
        .single()

      if (currentItem.data) {
        // 同じブランドの他のアイテム
        if (currentItem.data.brand) {
          const { data: brandItems } = await db.supabase
            .from('items')
            .select('id, name, brand, image_url, price, category')
            .eq('brand', currentItem.data.brand)
            .neq('id', itemId)
            .limit(2)

          if (brandItems) {
            items.push(...brandItems.map(item => ({
              id: item.id,
              title: item.name,
              image_url: item.image_url,
              type: 'item' as const,
              metadata: {
                brand: item.brand,
                price: item.price
              }
            })))
          }
        }

        // 関連エピソード
        if (currentItem.data.episode_id) {
          const { data: episode } = await db.supabase
            .from('episodes')
            .select('id, title, thumbnail_url, celebrity_id, celebrities(name)')
            .eq('id', currentItem.data.episode_id)
            .single()

          if (episode) {
            items.push({
              id: episode.id,
              title: episode.title,
              image_url: episode.thumbnail_url,
              type: 'episode' as const,
              metadata: {
                celebrity_name: episode.celebrities?.name
              }
            })
          }
        }
      }
    } catch (error) {
      console.error('Error fetching related items:', error)
    }

    return items
  }

  // エピソードに関連するコンテンツを取得
  const getRelatedToEpisode = async (episodeId: string): Promise<RelatedItem[]> => {
    const items: RelatedItem[] = []

    try {
      const episode = await db.supabase
        .from('episodes')
        .select('celebrity_id, date')
        .eq('id', episodeId)
        .single()

      if (episode.data?.celebrity_id) {
        // 同じセレブリティの他のエピソード
        const { data: otherEpisodes } = await db.supabase
          .from('episodes')
          .select('id, title, date, thumbnail_url, view_count')
          .eq('celebrity_id', episode.data.celebrity_id)
          .neq('id', episodeId)
          .order('date', { ascending: false })
          .limit(2)

        if (otherEpisodes) {
          items.push(...otherEpisodes.map(ep => ({
            id: ep.id,
            title: ep.title,
            image_url: ep.thumbnail_url,
            type: 'episode' as const,
            metadata: {
              view_count: ep.view_count,
              date: ep.date
            }
          })))
        }
      }

      // このエピソードで使用されたアイテム
      const { data: episodeItems } = await db.supabase
        .from('items')
        .select('id, name, brand, image_url, price')
        .eq('episode_id', episodeId)
        .limit(2)

      if (episodeItems) {
        items.push(...episodeItems.map(item => ({
          id: item.id,
          title: item.name,
          image_url: item.image_url,
          type: 'item' as const,
          metadata: {
            brand: item.brand,
            price: item.price
          }
        })))
      }
    } catch (error) {
      console.error('Error fetching related episodes:', error)
    }

    return items
  }

  // 人気コンテンツを取得（フォールバック用）
  const getPopularContent = async (): Promise<RelatedItem[]> => {
    const items: RelatedItem[] = []

    try {
      // 人気のセレブリティ
      const { data: popularCelebs } = await db.supabase
        .from('celebrities')
        .select('id, name, slug, image_url, popularity')
        .order('popularity', { ascending: false })
        .limit(2)

      if (popularCelebs) {
        items.push(...popularCelebs.map(celeb => ({
          id: celeb.id,
          title: celeb.name,
          slug: celeb.slug,
          image_url: celeb.image_url,
          type: 'celebrity' as const
        })))
      }

      // 最近のエピソード
      const { data: recentEpisodes } = await db.supabase
        .from('episodes')
        .select('id, title, thumbnail_url, view_count, date, celebrities(name)')
        .order('date', { ascending: false })
        .limit(2)

      if (recentEpisodes) {
        items.push(...recentEpisodes.map(ep => ({
          id: ep.id,
          title: ep.title,
          image_url: ep.thumbnail_url,
          type: 'episode' as const,
          metadata: {
            celebrity_name: ep.celebrities?.name,
            view_count: ep.view_count
          }
        })))
      }
    } catch (error) {
      console.error('Error fetching popular content:', error)
    }

    return items
  }

  // エラー時のフォールバック
  const getFallbackContent = async () => {
    const fallbackItems: RelatedItem[] = [
      {
        id: 'popular',
        title: '人気のタレント・推し一覧',
        type: 'celebrity',
        image_url: '/placeholder-celebrity.jpg',
        slug: ''
      },
      {
        id: 'locations',
        title: '聖地巡礼スポット一覧',
        type: 'location',
        image_url: '/placeholder-location.jpg'
      },
      {
        id: 'items',
        title: '私服特定アイテム一覧',
        type: 'item', 
        image_url: '/placeholder-item.jpg'
      }
    ]

    setRelatedItems(fallbackItems.slice(0, limit))
  }

  const getItemLink = (item: RelatedItem): string => {
    const basePath = {
      celebrity: '/celebrities',
      location: '/locations', 
      item: '/items',
      episode: '/episodes'
    }
    
    const identifier = item.slug || item.id
    return `${basePath[item.type]}/${identifier}`
  }

  const getItemIcon = (type: string) => {
    const icons = {
      celebrity: Users,
      location: MapPin,
      item: Package,
      episode: Play
    }
    return icons[type as keyof typeof icons] || Star
  }

  const formatItemSubtitle = (item: RelatedItem): string => {
    switch (item.type) {
      case 'celebrity':
        return '🌟 他の人気タレント'
      case 'location':
        return item.metadata?.address 
          ? `📍 ${item.metadata.address.split('区')[0]}区の聖地` 
          : '🗺️ 聖地巡礼スポット'
      case 'item':
        return item.metadata?.brand 
          ? `👕 ${item.metadata.brand}${item.metadata?.price ? ` ¥${item.metadata.price.toLocaleString()}` : ''}` 
          : '🛍️ 私服特定アイテム'
      case 'episode':
        return item.metadata?.celebrity_name 
          ? `🎬 ${item.metadata.celebrity_name}の動画`
          : '📺 関連エピソード'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="bg-gray-300 rounded-lg h-32 mb-3"></div>
                <div className="bg-gray-300 rounded h-4 mb-2"></div>
                <div className="bg-gray-300 rounded h-3 w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (relatedItems.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          関連コンテンツ
        </h2>
        <div className="text-sm text-gray-500">
          {currentTitle} に関連
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedItems.map((item) => {
          const ItemIcon = getItemIcon(item.type)
          
          return (
            <Link
              key={item.id}
              to={getItemLink(item)}
              className="group block"
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 border-0 shadow-md overflow-hidden">
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="relative overflow-hidden bg-gray-100">
                    {item.image_url ? (
                      <img
                        {...generateImageProps(item.type, item.title, item.image_url, {
                          context: '関連コンテンツ'
                        })}
                        className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <ItemIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Type badge */}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center">
                      <ItemIcon className="h-3 w-3 mr-1 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">
                        {item.type === 'celebrity' && '推し'}
                        {item.type === 'location' && 'スポット'}
                        {item.type === 'item' && 'アイテム'}
                        {item.type === 'episode' && '動画'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-rose-600 transition-colors line-clamp-2 mb-1">
                      {item.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                      {formatItemSubtitle(item)}
                    </p>

                    {/* Call to action */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        詳細を見る
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-rose-500 transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* More link */}
      <div className="text-center mt-8">
        <Link
          to={`/${currentType === 'celebrity' ? 'celebrities' : currentType === 'location' ? 'locations' : currentType === 'item' ? 'items' : 'episodes'}`}
          className="inline-flex items-center text-rose-600 hover:text-rose-800 font-medium transition-colors"
        >
          さらに多くの{currentType === 'celebrity' ? '推し' : currentType === 'location' ? 'スポット' : currentType === 'item' ? 'アイテム' : 'エピソード'}を見る
          <ExternalLink className="h-4 w-4 ml-2" />
        </Link>
      </div>
    </div>
  )
}