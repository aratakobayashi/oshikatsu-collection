import { useState, useEffect } from 'react'
import { MetaTags, generateSEO } from '../../components/SEO/MetaTags'
import { db } from '../../lib/supabase'
import { EpisodeSearchV2 } from '../../components/EpisodeSearchV2'

export default function Episodes() {
  const [episodeCount, setEpisodeCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const episodes = await db.episodes.getAll()
        setEpisodeCount(episodes.length)
      } catch (error) {
        console.error('Error fetching episode count:', error)
      }
    }
    fetchCount()
  }, [])

  const episodesSEO = generateSEO.episodes(episodeCount)

  return (
    <>
      <MetaTags 
        title={episodesSEO.title}
        description={episodesSEO.description}
        keywords={episodesSEO.keywords}
        canonicalUrl="https://collection.oshikatsu-guide.com/episodes"
        ogUrl="https://collection.oshikatsu-guide.com/episodes"
      />
      <EpisodeSearchV2 />
    </>
  )
}