import React from 'react'

interface BaseStructuredData {
  "@context": string
  "@type": string
}

interface PersonStructuredData extends BaseStructuredData {
  "@type": "Person"
  name: string
  birthDate?: string
  birthPlace?: string
  jobTitle?: string
  gender?: string
  description?: string
  image?: string
  url?: string
  sameAs?: string[]
  knowsAbout?: string[]
  worksFor?: {
    "@type": "Organization"
    name: string
  }
}

interface PlaceStructuredData extends BaseStructuredData {
  "@type": "TouristAttraction" | "Restaurant" | "LocalBusiness"
  name: string
  description?: string
  address?: {
    "@type": "PostalAddress"
    streetAddress?: string
    addressLocality?: string
    addressRegion?: string
    postalCode?: string
    addressCountry?: string
  }
  geo?: {
    "@type": "GeoCoordinates"
    latitude: number
    longitude: number
  }
  image?: string[]
  url?: string
  telephone?: string
  openingHours?: string[]
  priceRange?: string
  aggregateRating?: {
    "@type": "AggregateRating"
    ratingValue: number
    reviewCount: number
    bestRating?: number
    worstRating?: number
  }
  servesCuisine?: string[]
}

interface ProductStructuredData extends BaseStructuredData {
  "@type": "Product"
  name: string
  description?: string
  brand?: {
    "@type": "Brand"
    name: string
  }
  category?: string
  color?: string
  material?: string
  size?: string
  image?: string[]
  offers?: {
    "@type": "Offer"
    price: string
    priceCurrency: string
    availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock"
    url?: string
    seller?: {
      "@type": "Organization"
      name: string
    }
  }
  aggregateRating?: {
    "@type": "AggregateRating"
    ratingValue: number
    reviewCount: number
  }
  review?: Array<{
    "@type": "Review"
    author: {
      "@type": "Person"
      name: string
    }
    reviewRating: {
      "@type": "Rating"
      ratingValue: number
    }
    reviewBody: string
    datePublished: string
  }>
}

interface WebSiteStructuredData extends BaseStructuredData {
  "@type": "WebSite"
  name: string
  url: string
  description?: string
  potentialAction?: {
    "@type": "SearchAction"
    target: string
    "query-input": string
  }
}

interface BreadcrumbStructuredData extends BaseStructuredData {
  "@type": "BreadcrumbList"
  itemListElement: Array<{
    "@type": "ListItem"
    position: number
    name: string
    item?: string
  }>
}

type StructuredDataType = 
  | PersonStructuredData 
  | PlaceStructuredData 
  | ProductStructuredData 
  | WebSiteStructuredData 
  | BreadcrumbStructuredData

interface StructuredDataProps {
  data: StructuredDataType | StructuredDataType[]
}

export const StructuredData: React.FC<StructuredDataProps> = ({ data }) => {
  const jsonLd = Array.isArray(data) ? data : [data]
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd, null, 2)
      }}
    />
  )
}

// Utility functions for generating structured data
export const generateStructuredData = {
  // Website-level structured data
  website: (): WebSiteStructuredData => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "推し活コレクション",
    url: "https://collection.oshikatsu-guide.com",
    description: "推し活の聖地巡礼・私服特定をもっとリッチに。ファン同士で情報を共有し、お気に入りのアイテムやスポットを発見するプラットフォーム。",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://collection.oshikatsu-guide.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }),

  // Celebrity/Person structured data
  person: (
    name: string,
    options: {
      birthDate?: string
      birthPlace?: string
      jobTitle?: string
      gender?: 'Male' | 'Female'
      description?: string
      image?: string
      homepage?: string
      groupName?: string
      knownFor?: string[]
    } = {}
  ): PersonStructuredData => {
    const personData: PersonStructuredData = {
      "@context": "https://schema.org",
      "@type": "Person",
      name,
      url: `https://collection.oshikatsu-guide.com/celebrities/${encodeURIComponent(name)}`
    }

    if (options.birthDate) {
      personData.birthDate = options.birthDate
    }

    if (options.birthPlace) {
      personData.birthPlace = options.birthPlace
    }

    if (options.jobTitle) {
      personData.jobTitle = options.jobTitle
    }

    if (options.gender) {
      personData.gender = options.gender
    }

    if (options.description) {
      personData.description = options.description
    }

    if (options.image) {
      personData.image = options.image
    }

    if (options.homepage) {
      personData.sameAs = [options.homepage]
    }

    if (options.groupName) {
      personData.worksFor = {
        "@type": "Organization",
        name: options.groupName
      }
    }

    if (options.knownFor && options.knownFor.length > 0) {
      personData.knowsAbout = options.knownFor
    }

    return personData
  },

  // Location/Restaurant structured data
  place: (
    name: string,
    options: {
      type?: 'TouristAttraction' | 'Restaurant' | 'LocalBusiness'
      description?: string
      address?: string
      latitude?: number
      longitude?: number
      images?: string[]
      website?: string
      phone?: string
      priceRange?: string
      rating?: number
      reviewCount?: number
      cuisine?: string[]
    } = {}
  ): PlaceStructuredData => {
    const placeData: PlaceStructuredData = {
      "@context": "https://schema.org",
      "@type": options.type || "TouristAttraction",
      name
    }

    if (options.description) {
      placeData.description = options.description
    }

    if (options.address) {
      // Simple address parsing - could be enhanced
      placeData.address = {
        "@type": "PostalAddress",
        streetAddress: options.address,
        addressCountry: "JP"
      }
    }

    if (options.latitude && options.longitude) {
      placeData.geo = {
        "@type": "GeoCoordinates",
        latitude: options.latitude,
        longitude: options.longitude
      }
    }

    if (options.images && options.images.length > 0) {
      placeData.image = options.images
    }

    if (options.website) {
      placeData.url = options.website
    }

    if (options.phone) {
      placeData.telephone = options.phone
    }

    if (options.priceRange) {
      placeData.priceRange = options.priceRange
    }

    if (options.rating && options.reviewCount) {
      placeData.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: options.rating,
        reviewCount: options.reviewCount,
        bestRating: 5,
        worstRating: 1
      }
    }

    if (options.cuisine && options.cuisine.length > 0) {
      placeData.servesCuisine = options.cuisine
    }

    return placeData
  },

  // Product/Item structured data
  product: (
    name: string,
    options: {
      description?: string
      brand?: string
      category?: string
      color?: string
      material?: string
      size?: string
      images?: string[]
      price?: number
      currency?: string
      availability?: 'InStock' | 'OutOfStock'
      purchaseUrl?: string
      rating?: number
      reviewCount?: number
    } = {}
  ): ProductStructuredData => {
    const productData: ProductStructuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      name
    }

    if (options.description) {
      productData.description = options.description
    }

    if (options.brand) {
      productData.brand = {
        "@type": "Brand",
        name: options.brand
      }
    }

    if (options.category) {
      productData.category = options.category
    }

    if (options.color) {
      productData.color = options.color
    }

    if (options.material) {
      productData.material = options.material
    }

    if (options.size) {
      productData.size = options.size
    }

    if (options.images && options.images.length > 0) {
      productData.image = options.images
    }

    if (options.price !== undefined) {
      productData.offers = {
        "@type": "Offer",
        price: options.price.toString(),
        priceCurrency: options.currency || "JPY",
        availability: options.availability === 'OutOfStock' 
          ? "https://schema.org/OutOfStock" 
          : "https://schema.org/InStock"
      }

      if (options.purchaseUrl) {
        productData.offers.url = options.purchaseUrl
      }
    }

    if (options.rating && options.reviewCount) {
      productData.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: options.rating,
        reviewCount: options.reviewCount
      }
    }

    return productData
  },

  // Breadcrumb structured data
  breadcrumb: (
    items: Array<{ name: string; url?: string }>
  ): BreadcrumbStructuredData => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url })
    }))
  })
}