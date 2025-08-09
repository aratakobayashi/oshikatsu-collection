/**
 * 開発環境用モックデータベース
 * ローカルストレージを使って仮想的なデータベース機能を提供
 * 実際のSupabase接続なしでユーザージャーニーをテストできる
 */

interface MockData {
  celebrities: any[]
  episodes: any[]
  items: any[]
  locations: any[]
  works: any[]
  posts: any[]
}

class MockDatabase {
  private storageKey = 'oshikatsu_mock_data'

  // データ初期化
  private initializeStorage(): MockData {
    const defaultData: MockData = {
      celebrities: [],
      episodes: [],
      items: [],
      locations: [],
      works: [],
      posts: []
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(defaultData))
      return defaultData
    } catch (error) {
      console.warn('LocalStorage not available, using memory storage')
      return defaultData
    }
  }

  // データ取得
  private getData(): MockData {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : this.initializeStorage()
    } catch (error) {
      console.warn('Error reading from localStorage:', error)
      return this.initializeStorage()
    }
  }

  // データ保存
  private saveData(data: MockData): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Error saving to localStorage:', error)
    }
  }

  // CRUD操作作成
  private createTableOperations(tableName: keyof MockData) {
    return {
      create: async (item: any) => {
        console.log(`📝 Creating ${tableName}:`, item.name || item.title || item.id)
        const data = this.getData()
        const newItem = {
          ...item,
          id: item.id || this.generateId(),
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        }
        data[tableName].push(newItem)
        this.saveData(data)
        console.log(`✅ Created ${tableName}:`, newItem.id)
        return newItem
      },

      getAll: async () => {
        const data = this.getData()
        console.log(`📋 Getting all ${tableName}:`, data[tableName].length, 'items')
        return data[tableName]
      },

      getById: async (id: string) => {
        const data = this.getData()
        const item = data[tableName].find((item: any) => item.id === id)
        console.log(`🔍 Getting ${tableName} by ID:`, id, item ? '✅ found' : '❌ not found')
        return item || null
      },

      getBySlug: async (slug: string) => {
        const data = this.getData()
        const item = data[tableName].find((item: any) => item.slug === slug)
        console.log(`🔍 Getting ${tableName} by slug:`, slug, item ? '✅ found' : '❌ not found')
        return item || null
      },

      update: async (id: string, updates: any) => {
        const data = this.getData()
        const index = data[tableName].findIndex((item: any) => item.id === id)
        if (index !== -1) {
          data[tableName][index] = {
            ...data[tableName][index],
            ...updates,
            updated_at: new Date().toISOString()
          }
          this.saveData(data)
          console.log(`✅ Updated ${tableName}:`, id)
          return data[tableName][index]
        }
        console.log(`❌ ${tableName} not found for update:`, id)
        return null
      },

      delete: async (id: string) => {
        const data = this.getData()
        const index = data[tableName].findIndex((item: any) => item.id === id)
        if (index !== -1) {
          data[tableName].splice(index, 1)
          this.saveData(data)
          console.log(`✅ Deleted ${tableName}:`, id)
          return true
        }
        console.log(`❌ ${tableName} not found for deletion:`, id)
        return false
      }
    }
  }

  // ユニークID生成
  private generateId(): string {
    return 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // テーブル操作
  celebrities = {
    ...this.createTableOperations('celebrities'),
    
    unifiedSearch: async (query: string, filters?: any) => {
      const data = this.getData()
      let results = data.celebrities

      // テキスト検索
      if (query && query.trim()) {
        const searchTerm = query.toLowerCase().trim()
        results = results.filter((item: any) => 
          item.name?.toLowerCase().includes(searchTerm) ||
          item.bio?.toLowerCase().includes(searchTerm) ||
          item.agency?.toLowerCase().includes(searchTerm) ||
          item.fandom_name?.toLowerCase().includes(searchTerm)
        )
      }

      // フィルター適用
      if (filters?.type) {
        results = results.filter((item: any) => item.type === filters.type)
      }
      if (filters?.agency) {
        results = results.filter((item: any) => item.agency === filters.agency)
      }
      if (filters?.status) {
        results = results.filter((item: any) => item.status === filters.status)
      }

      console.log(`🔍 Unified search "${query}" returned ${results.length} results`)
      return results
    },

    getByType: async (type: string) => {
      const data = this.getData()
      const results = data.celebrities.filter((item: any) => item.type === type)
      console.log(`📋 Getting ${type} celebrities:`, results.length, 'items')
      return results
    },

    getPopular: async (limit: number = 10) => {
      const data = this.getData()
      // 登録者数または人気度で降順ソート
      const sortedCelebrities = data.celebrities
        .sort((a: any, b: any) => (b.subscriber_count || b.popularity || 0) - (a.subscriber_count || a.popularity || 0))
        .slice(0, limit)
      console.log(`🌟 Getting popular celebrities:`, sortedCelebrities.length, 'items')
      return sortedCelebrities
    }
  }

  episodes = {
    ...this.createTableOperations('episodes'),
    
    getByCelebrityId: async (celebrityId: string) => {
      const data = this.getData()
      const results = data.episodes.filter((item: any) => item.celebrity_id === celebrityId)
      console.log(`📺 Getting episodes for celebrity ${celebrityId}:`, results.length, 'items')
      return results
    }
  }

  items = {
    ...this.createTableOperations('items'),
    
    getByEpisodeId: async (episodeId: string) => {
      const data = this.getData()
      const results = data.items.filter((item: any) => item.episode_id === episodeId)
      console.log(`🛍️ Getting items for episode ${episodeId}:`, results.length, 'items')
      return results
    },

    getByCelebrityId: async (celebrityId: string) => {
      const data = this.getData()
      const results = data.items.filter((item: any) => item.celebrity_id === celebrityId)
      console.log(`🛍️ Getting items for celebrity ${celebrityId}:`, results.length, 'items')
      return results
    }
  }

  locations = {
    ...this.createTableOperations('locations'),
    
    getByEpisodeId: async (episodeId: string) => {
      const data = this.getData()
      const results = data.locations.filter((item: any) => item.episode_id === episodeId)
      console.log(`🏪 Getting locations for episode ${episodeId}:`, results.length, 'items')
      return results
    },

    getByCelebrityId: async (celebrityId: string) => {
      const data = this.getData()
      const results = data.locations.filter((item: any) => item.celebrity_id === celebrityId)
      console.log(`🏪 Getting locations for celebrity ${celebrityId}:`, results.length, 'items')
      return results
    }
  }

  works = this.createTableOperations('works')
  posts = this.createTableOperations('posts')

  // データ初期化・リセット
  async clearAll() {
    console.log('🧹 Clearing all mock data...')
    this.initializeStorage()
    console.log('✅ All mock data cleared')
  }

  async getStats() {
    const data = this.getData()
    const stats = {
      celebrities: data.celebrities.length,
      episodes: data.episodes.length,
      items: data.items.length,
      locations: data.locations.length,
      works: data.works.length,
      posts: data.posts.length,
      total: Object.values(data).reduce((sum, arr) => sum + arr.length, 0)
    }
    console.log('📊 Mock database stats:', stats)
    return stats
  }
}

// 環境判定
const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'development'
const isLocalEnvironment = import.meta.env.VITE_SUPABASE_URL?.includes('localhost')

// 開発環境でのデータベース切り替え
export const mockDb = new MockDatabase()

// 開発環境かつローカル環境の場合はモックDBを使用
export const developmentDb = (isDevelopment && isLocalEnvironment) ? mockDb : null

console.log('🔧 Mock database initialized for development:', !!developmentDb)