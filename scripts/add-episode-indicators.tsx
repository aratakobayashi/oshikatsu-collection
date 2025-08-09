/**
 * CelebrityProfile.tsxのエピソードカードにlocation/itemインジケーター追加
 */

// エピソードごとのlocation/item情報を取得する関数を追加
async function fetchEpisodeLinksData(episodes: EpisodeWithDetails[]) {
  if (!episodes || episodes.length === 0) return {}
  
  const episodeIds = episodes.map(ep => ep.id)
  
  try {
    // Episode-Location リンク取得
    const { data: locationLinks } = await supabase
      .from('episode_locations')
      .select('episode_id, location_id')
      .in('episode_id', episodeIds)
    
    // Episode-Item リンク取得  
    const { data: itemLinks } = await supabase
      .from('episode_items')
      .select('episode_id, item_id')
      .in('episode_id', episodeIds)
    
    // エピソードIDごとに集計
    const episodeLinksMap: { [episodeId: string]: { locations: number, items: number } } = {}
    
    episodes.forEach(episode => {
      episodeLinksMap[episode.id] = { locations: 0, items: 0 }
    })
    
    locationLinks?.forEach(link => {
      if (episodeLinksMap[link.episode_id]) {
        episodeLinksMap[link.episode_id].locations++
      }
    })
    
    itemLinks?.forEach(link => {
      if (episodeLinksMap[link.episode_id]) {
        episodeLinksMap[link.episode_id].items++
      }
    })
    
    return episodeLinksMap
  } catch (error) {
    console.error('❌ Episode links fetch error:', error)
    return {}
  }
}

// エピソードカード内に追加するインジケーターコンポーネント
function EpisodeLinksIndicator({ locationCount, itemCount }: { locationCount: number, itemCount: number }) {
  if (locationCount === 0 && itemCount === 0) return null
  
  return (
    <div className="absolute top-3 right-3 flex items-center gap-1">
      {locationCount > 0 && (
        <div className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
          <Coffee className="h-3 w-3" />
          {locationCount}
        </div>
      )}
      {itemCount > 0 && (
        <div className="bg-rose-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
          <ShoppingBag className="h-3 w-3" />
          {itemCount}
        </div>
      )}
    </div>
  )
}

// 修正されたエピソードカード部分（CelebrityProfile.tsxの590-680行あたりを置き換え）
/*
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {filteredEpisodes.map((episode) => {
    const episodeLinks = episodeLinksData[episode.id] || { locations: 0, items: 0 }
    
    return (
      <Link key={episode.id} to={`/episodes/${episode.id}`}>
        <Card className="hover:shadow-2xl transition-all duration-500 cursor-pointer h-full group border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            {/* Thumbnail */}
            <div className="relative">
              {episode.thumbnail_url ? (
                <img
                  src={episode.thumbnail_url}
                  alt={episode.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://images.pexels.com/photos/1040903/pexels-photo-1040903.jpeg'
                  }}
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Play className="h-16 w-16 text-gray-400" />
                </div>
              )}
              
              {/* Platform Badge */}
              {episode.platform && (
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full shadow-sm ${getPlatformColor(episode.platform)}`}>
                    {getPlatformIcon(episode.platform)} {getPlatformLabel(episode.platform)}
                  </span>
                </div>
              )}
              
              {/* Location/Item Indicators - 新規追加 */}
              <EpisodeLinksIndicator 
                locationCount={episodeLinks.locations} 
                itemCount={episodeLinks.items} 
              />
              
              {/* Video Link Overlay */}
              {episode.video_url && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-4">
                    <Play className="h-8 w-8 text-gray-900" />
                  </div>
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Date */}
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{new Date(episode.date).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                {episode.title}
              </h3>
              
              {/* Description */}
              {episode.description && (
                <p className="text-gray-600 line-clamp-3 text-sm">
                  {episode.description}
                </p>
              )}
              
              {/* Duration & Views + Links Info - 修正部分 */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {episode.duration_minutes && (
                    <span>{episode.duration_minutes}分</span>
                  )}
                  {episode.view_count && episode.view_count > 0 && (
                    <span className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {episode.view_count.toLocaleString()}
                    </span>
                  )}
                </div>
                
                {/* Links Summary */}
                <div className="flex items-center gap-3 text-xs">
                  {episodeLinks.locations > 0 && (
                    <span className="flex items-center text-amber-600">
                      <Coffee className="h-3 w-3 mr-1" />
                      {episodeLinks.locations}店舗
                    </span>
                  )}
                  {episodeLinks.items > 0 && (
                    <span className="flex items-center text-rose-600">
                      <ShoppingBag className="h-3 w-3 mr-1" />
                      {episodeLinks.items}アイテム
                    </span>
                  )}
                  {episode.video_url && (
                    <span className="flex items-center text-blue-600">
                      <Play className="h-3 w-3 mr-1" />
                      動画
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  })}
</div>
*/

console.log('エピソードカードにインジケーター追加コード準備完了');
console.log('CelebrityProfile.tsxに実装が必要です');
console.log('');
console.log('追加要素:');
console.log('1. fetchEpisodeLinksData関数');
console.log('2. EpisodeLinksIndicator コンポーネント'); 
console.log('3. episodeLinksData state');
console.log('4. エピソードカード内のインジケーター表示');
console.log('5. カード下部のサマリー情報');