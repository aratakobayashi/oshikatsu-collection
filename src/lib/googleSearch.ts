// src/lib/googleSearch.ts
interface GoogleSearchResult {
  title: string
  link: string
  snippet: string
  displayLink: string
}

interface GoogleSearchResponse {
  items: GoogleSearchResult[]
  searchInformation: {
    totalResults: string
    searchTime: number
  }
}

export class GoogleSearchAPI {
  private apiKey: string
  private engineId: string
  
  constructor() {
  this.apiKey = import.meta.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY
  this.engineId = import.meta.env.VITE_GOOGLE_CUSTOM_SEARCH_ENGINE_ID
    
    if (!this.apiKey || !this.engineId) {
      throw new Error('Google Search API credentials not found')
    }
  }
  
  async search(query: string, options?: {
    start?: number
    num?: number
  }): Promise<GoogleSearchResponse> {
    const params = new URLSearchParams({
      key: this.apiKey,
      cx: this.engineId,
      q: query,
      start: String(options?.start || 1),
      num: String(options?.num || 10)
    })
    
    const url = `https://www.googleapis.com/customsearch/v1?${params}`
    
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Google Search API error: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Google Search API Error:', error)
      throw error
    }
  }
  
  // ファッション情報特化検索
  async searchFashion(celebrityName: string, episodeTitle: string): Promise<GoogleSearchResponse> {
    const query = `${celebrityName} ${episodeTitle} 衣装 ファッション ブランド`
    return this.search(query)
  }
  
  // ロケーション情報特化検索
  async searchLocation(episodeTitle: string): Promise<GoogleSearchResponse> {
    const query = `${episodeTitle} 撮影地 ロケ地 場所`
    return this.search(query)
  }
}

export const googleSearch = new GoogleSearchAPI()