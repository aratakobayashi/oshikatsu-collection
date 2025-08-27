import React, { useEffect, useState } from 'react'
import { MetaTags, generateSEO } from '../../components/SEO/MetaTags'
import IdolSearchComponentV2 from '../../components/IdolSearchComponentV2'
import { db } from '../../lib/supabase'

export default function Celebrities() {
  const [celebrityCount, setCelebrityCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const celebrities = await db.celebrities.getAll()
        setCelebrityCount(celebrities.length)
      } catch (error) {
        console.error('Error fetching celebrity count:', error)
      }
    }
    fetchCount()
  }, [])

  const celebritiesSEO = generateSEO.celebrities(celebrityCount)

  return (
    <>
      <MetaTags 
        title={celebritiesSEO.title}
        description={celebritiesSEO.description}
        keywords={celebritiesSEO.keywords}
        canonicalUrl="https://collection.oshikatsu-guide.com/celebrities"
        ogUrl="https://collection.oshikatsu-guide.com/celebrities"
      />
      <IdolSearchComponentV2 />
    </>
  )
}