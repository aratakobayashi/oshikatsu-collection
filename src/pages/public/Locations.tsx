import React, { useEffect, useState } from 'react'
import { MetaTags, generateSEO } from '../../components/SEO/MetaTags'
import LocationSearchV2 from '../../components/LocationSearchV2'
import { db } from '../../lib/supabase'

export default function Locations() {
  const [locationCount, setLocationCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const locations = await db.locations.getAll()
        setLocationCount(locations.length)
      } catch (error) {
        console.error('Error fetching location count:', error)
      }
    }
    fetchCount()
  }, [])

  const locationsSEO = generateSEO.locations(locationCount)

  return (
    <>
      <MetaTags 
        title={locationsSEO.title}
        description={locationsSEO.description}
        keywords={locationsSEO.keywords}
        canonicalUrl="https://collection.oshikatsu-guide.com/locations"
        ogUrl="https://collection.oshikatsu-guide.com/locations"
      />
      <LocationSearchV2 />
    </>
  )
}