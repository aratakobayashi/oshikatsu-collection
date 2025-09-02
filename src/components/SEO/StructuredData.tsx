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

interface FAQStructuredData extends BaseStructuredData {
  "@type": "FAQPage"
  mainEntity: Array<{
    "@type": "Question"
    name: string
    acceptedAnswer: {
      "@type": "Answer"
      text: string
    }
  }>
}

interface ReviewStructuredData extends BaseStructuredData {
  "@type": "Review"
  itemReviewed: {
    "@type": "Place" | "Person" | "Product"
    name: string
  }
  author: {
    "@type": "Person"
    name: string
  }
  reviewRating: {
    "@type": "Rating"
    ratingValue: number
    bestRating?: number
    worstRating?: number
  }
  reviewBody: string
  datePublished: string
}

type StructuredDataType = 
  | PersonStructuredData 
  | PlaceStructuredData 
  | ProductStructuredData 
  | WebSiteStructuredData 
  | BreadcrumbStructuredData
  | FAQStructuredData
  | ReviewStructuredData

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
  }),

  // FAQ structured data for rich snippets
  faq: (
    questions: Array<{ question: string; answer: string }>
  ): FAQStructuredData => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(qa => ({
      "@type": "Question",
      name: qa.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: qa.answer
      }
    }))
  }),

  // Review structured data
  review: (
    options: {
      itemType: 'Place' | 'Person' | 'Product'
      itemName: string
      reviewerName: string
      rating: number
      reviewText: string
      publishDate: string
      maxRating?: number
    }
  ): ReviewStructuredData => ({
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": options.itemType,
      name: options.itemName
    },
    author: {
      "@type": "Person",
      name: options.reviewerName
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: options.rating,
      bestRating: options.maxRating || 5,
      worstRating: 1
    },
    reviewBody: options.reviewText,
    datePublished: options.publishDate
  }),

  // Generate celebrity-specific FAQ data
  celebrityFAQ: (celebrityName: string, stats: { locations: number; items: number }) => {
    const questions = [
      {
        question: `${celebrityName}が実際に行ったお店はどこですか？`,
        answer: `${celebrityName}が番組で訪れたお店や行きつけのお店など、${stats.locations}箇所の詳細情報を掲載しています。アクセス方法や営業時間、実際に訪問したファンの体験談も含めて紹介しています。`
      },
      {
        question: `${celebrityName}の私服はどこで買えますか？`,
        answer: `${celebrityName}が着用したアイテム${stats.items}件について、ブランド情報と購入リンクを掲載しています。価格帯やコーディネートのポイントも詳しく解説しています。`
      },
      {
        question: `${celebrityName}の聖地巡礼におすすめのルートはありますか？`,
        answer: `${celebrityName}関連のスポットを効率よく回れるモデルルートを提案しています。公共交通機関でのアクセス方法や、周辺の観光スポット情報も併せて紹介しています。`
      }
    ]
    
    return generateStructuredData.faq(questions)
  },

  // Generate location-specific FAQ data
  locationFAQ: (locationName: string, celebrityName?: string) => {
    const questions = [
      {
        question: `${locationName}の営業時間は何時ですか？`,
        answer: `${locationName}の営業時間や定休日、予約の可否など、訪問前に知っておくべき基本情報をまとめています。季節による営業時間の変更がある場合も掲載しています。`
      },
      {
        question: `${locationName}へのアクセス方法を教えてください。`,
        answer: `${locationName}への電車・バス・車でのアクセス方法を詳しく説明しています。最寄り駅からの徒歩ルートや駐車場情報も含めて案内しています。`
      }
    ]
    
    if (celebrityName) {
      questions.push({
        question: `${celebrityName}が${locationName}を訪れたのはいつですか？`,
        answer: `${celebrityName}が${locationName}を訪問した番組情報や時期について詳しく紹介しています。その時の様子や注文したメニューなどの情報も掲載しています。`
      })
    }
    
    return generateStructuredData.faq(questions)
  }
}