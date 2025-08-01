import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 🔧 環境変数チェック
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are missing:')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
  throw new Error('Missing Supabase environment variables. Check your .env file or Netlify environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 🔧 Supabase接続テスト
console.log('🔌 Supabase client initialized:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey
})

// 型定義
interface CreateItemData {
  [key: string]: unknown
}

interface UpdateItemData {
  [key: string]: unknown
}

interface WorkUpdates {
  is_trending: boolean
  trending_order?: number
}

// Generic CRUD operations helper
function createCrudOperations(tableName: string) {
  return {
    async getAll() {
      console.log(`🔍 Fetching all from ${tableName}`)
      const { data, error } = await supabase.from(tableName).select('*')
      if (error) {
        console.error(`❌ Error fetching from ${tableName}:`, error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} records from ${tableName}`)
      return data
    },
    
    async getById(id: string) {
      console.log(`🔍 Fetching ${tableName} by ID:`, id)
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single()
      if (error) {
        console.error(`❌ Error fetching ${tableName} by ID:`, error)
        throw error
      }
      console.log(`✅ Successfully fetched ${tableName}:`, data?.id)
      return data
    },
    
    async getBySlug(slug: string) {
      console.log(`🔍 Fetching ${tableName} by slug:`, slug)
      const { data, error } = await supabase.from(tableName).select('*').eq('slug', slug).maybeSingle()
      if (error) {
        console.error(`❌ Error fetching ${tableName} by slug:`, error)
        throw error
      }
      console.log(`✅ Successfully fetched ${tableName}:`, data?.slug || 'not found')
      return data
    },
    
    async create(item: CreateItemData) {
      console.log(`🔍 Creating ${tableName}:`, item)
      const { data, error } = await supabase.from(tableName).insert(item).select().single()
      if (error) {
        console.error(`❌ Error creating ${tableName}:`, error)
        throw error
      }
      console.log(`✅ Successfully created ${tableName}:`, data?.id)
      return data
    },
    
    async update(id: string, updates: UpdateItemData) {
      console.log(`🔍 Updating ${tableName} ${id}:`, updates)
      const { data, error } = await supabase.from(tableName).update(updates).eq('id', id).select().single()
      if (error) {
        console.error(`❌ Error updating ${tableName}:`, error)
        throw error
      }
      console.log(`✅ Successfully updated ${tableName}:`, data?.id)
      return data
    },
    
    async delete(id: string) {
      console.log(`🔍 Deleting ${tableName}:`, id)
      const { error } = await supabase.from(tableName).delete().eq('id', id)
      if (error) {
        console.error(`❌ Error deleting ${tableName}:`, error)
        throw error
      }
      console.log(`✅ Successfully deleted ${tableName}:`, id)
      return true
    }
  }
}

// Database helper object with CRUD operations
export const db = {
  // Celebrities
  celebrities: {
    ...createCrudOperations('celebrities'),
    async getByCelebrityId(celebrityId: string) {
      console.log('🔍 Fetching celebrities by celebrity ID:', celebrityId)
      const { data, error } = await supabase.from('celebrities').select('*').eq('id', celebrityId)
      if (error) {
        console.error('❌ Error fetching celebrities:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} celebrities`)
      return data
    }
  },
  
  // Episodes - 🔧 celebrity情報をJOINして取得
  episodes: {
    async getAll() {
      console.log('🔍 Fetching all episodes with celebrity info')
      const { data, error } = await supabase
        .from('episodes')
        .select(`
          *,
          celebrity:celebrities(id, name, slug, image_url)
        `)
      if (error) {
        console.error('❌ Error fetching episodes:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} episodes`)
      return data
    },
    
    async getById(id: string) {
      console.log('🔍 Fetching episode with celebrity info, ID:', id)
      const { data, error } = await supabase
        .from('episodes')
        .select(`
          *,
          celebrity:celebrities(id, name, slug, image_url)
        `)
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('❌ Error fetching episode by ID:', error)
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }
      console.log('✅ Successfully fetched episode:', data?.title)
      console.log('✅ Celebrity info:', data?.celebrity?.name || 'No celebrity')
      return data
    },
    
    async getBySlug(slug: string) {
      console.log('🔍 Fetching episode by slug with celebrity info:', slug)
      const { data, error } = await supabase
        .from('episodes')
        .select(`
          *,
          celebrity:celebrities(id, name, slug, image_url)
        `)
        .eq('slug', slug)
        .maybeSingle()
      if (error) {
        console.error('❌ Error fetching episode by slug:', error)
        throw error
      }
      console.log('✅ Successfully fetched episode:', data?.title || 'not found')
      return data
    },
    
    async create(item: CreateItemData) {
      console.log('🔍 Creating episode:', item)
      const { data, error } = await supabase.from('episodes').insert(item).select().single()
      if (error) {
        console.error('❌ Error creating episode:', error)
        throw error
      }
      console.log('✅ Successfully created episode:', data?.id)
      return data
    },
    
    async update(id: string, updates: UpdateItemData) {
      console.log('🔍 Updating episode:', id, updates)
      const { data, error } = await supabase.from('episodes').update(updates).eq('id', id).select().single()
      if (error) {
        console.error('❌ Error updating episode:', error)
        throw error
      }
      console.log('✅ Successfully updated episode:', data?.id)
      return data
    },
    
    async delete(id: string) {
      console.log('🔍 Deleting episode:', id)
      const { error } = await supabase.from('episodes').delete().eq('id', id)
      if (error) {
        console.error('❌ Error deleting episode:', error)
        throw error
      }
      console.log('✅ Successfully deleted episode:', id)
      return true
    },
    
    async getByCelebrityId(celebrityId: string) {
      console.log('🔍 [DEBUG] episodes.getByCelebrityId called with:', celebrityId)
      
      const { data, error } = await supabase
        .from('episodes')
        .select(`
          *,
          celebrity:celebrities(id, name, slug, image_url)
        `)
        .eq('celebrity_id', celebrityId)
        .order('date', { ascending: false })
      
      console.log('📊 [DEBUG] Supabase episodes query result:', { data, error })
      
      if (error) {
        console.error('❌ [ERROR] Supabase episodes query failed:', error)
        console.error('❌ [ERROR] Query details:', {
          table: 'episodes',
          filter: `celebrity_id = ${celebrityId}`,
          error_code: error.code,
          error_message: error.message,
          error_details: error.details
        })
        throw error
      }
      
      console.log('✅ [DEBUG] Episodes query successful, count:', data?.length || 0)
      return data
    },
    
    async getByWorkId(workId: string) {
      console.log('🔍 Fetching episodes by work ID with celebrity info:', workId)
      const { data, error } = await supabase
        .from('episodes')
        .select(`
          *,
          celebrity:celebrities(id, name, slug, image_url)
        `)
        .eq('work_id', workId)
        .order('date', { ascending: false })
      
      if (error) {
        console.error('❌ Error fetching episodes by work ID:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} episodes by work ID`)
      return data
    }
  },
  
  // Items
  items: {
    ...createCrudOperations('items'),
    async getByEpisodeId(episodeId: string) {
      console.log('🔍 Fetching items by episode ID:', episodeId)
      const { data, error } = await supabase.from('items').select('*').eq('episode_id', episodeId)
      if (error) {
        console.error('❌ Error fetching items by episode ID:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} items`)
      return data
    },
    async getByWorkId(workId: string) {
      console.log('🔍 Fetching items by work ID:', workId)
      const { data, error } = await supabase.from('items').select('*').eq('work_id', workId)
      if (error) {
        console.error('❌ Error fetching items by work ID:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} items`)
      return data
    }
  },
  
  // Locations
  locations: {
    ...createCrudOperations('locations'),
    async getByEpisodeId(episodeId: string) {
      console.log('🔍 Fetching locations by episode ID:', episodeId)
      const { data, error } = await supabase.from('locations').select('*').eq('episode_id', episodeId)
      if (error) {
        console.error('❌ Error fetching locations by episode ID:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} locations`)
      return data
    },
    async getByWorkId(workId: string) {
      console.log('🔍 Fetching locations by work ID:', workId)
      const { data, error } = await supabase.from('locations').select('*').eq('work_id', workId)
      if (error) {
        console.error('❌ Error fetching locations by work ID:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} locations`)
      return data
    }
  },
  
  // Works
  works: {
    ...createCrudOperations('works'),
    async getTrending() {
      console.log('🔍 Fetching trending works')
      const { data, error } = await supabase.from('works').select('*').eq('is_trending', true).order('trending_order', { ascending: true })
      if (error) {
        console.error('❌ Error fetching trending works:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} trending works`)
      return data
    },
    async updateTrending(id: string, isTrending: boolean, trendingOrder?: number) {
      console.log('🔍 Updating trending status for work:', id)
      const updates: WorkUpdates = { is_trending: isTrending }
      if (trendingOrder !== undefined) {
        updates.trending_order = trendingOrder
      }
      const { data, error } = await supabase.from('works').update(updates).eq('id', id).select().single()
      if (error) {
        console.error('❌ Error updating trending status:', error)
        throw error
      }
      console.log('✅ Successfully updated trending status:', data?.id)
      return data
    }
  },
  
  // Groups
  groups: createCrudOperations('groups'),
  
  // Celebrity Groups
  celebrityGroups: {
    ...createCrudOperations('celebrity_groups'),
    async getByCelebrityId(celebrityId: string) {
      console.log('🔍 Fetching celebrity groups by celebrity ID:', celebrityId)
      const { data, error } = await supabase.from('celebrity_groups').select('*').eq('celebrity_id', celebrityId)
      if (error) {
        console.error('❌ Error fetching celebrity groups:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} celebrity groups`)
      return data
    },
    async getByGroupId(groupId: string) {
      console.log('🔍 Fetching celebrity groups by group ID:', groupId)
      const { data, error } = await supabase.from('celebrity_groups').select('*').eq('group_id', groupId)
      if (error) {
        console.error('❌ Error fetching celebrity groups by group ID:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} celebrity groups`)
      return data
    }
  },
  
  // Brands
  brands: createCrudOperations('brands'),
  
  // Appearances
  appearances: {
    ...createCrudOperations('appearances'),
    async getByEpisodeId(episodeId: string) {
      console.log('🔍 Fetching appearances by episode ID:', episodeId)
      const { data, error } = await supabase.from('appearances').select('*').eq('episode_id', episodeId)
      if (error) {
        console.error('❌ Error fetching appearances:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} appearances`)
      return data
    }
  },
  
  // Users
  users: createCrudOperations('users'),
  
  // User Posts
  userPosts: {
    ...createCrudOperations('user_posts'),
    async getByUserId(userId: string) {
      console.log('🔍 Fetching user posts by user ID:', userId)
      const { data, error } = await supabase.from('user_posts').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (error) {
        console.error('❌ Error fetching user posts:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} user posts`)
      return data
    },
    async getByCelebrityId(celebrityId: string) {
      console.log('🔍 Fetching user posts by celebrity ID:', celebrityId)
      const { data, error } = await supabase.from('user_posts').select('*').eq('celebrity_id', celebrityId).order('created_at', { ascending: false })
      if (error) {
        console.error('❌ Error fetching user posts by celebrity ID:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} user posts`)
      return data
    },
    async getByEpisodeId(episodeId: string) {
      console.log('🔍 Fetching user posts by episode ID:', episodeId)
      const { data, error } = await supabase.from('user_posts').select('*').eq('episode_id', episodeId).order('created_at', { ascending: false })
      if (error) {
        console.error('❌ Error fetching user posts by episode ID:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} user posts`)
      return data
    },
    async getByWorkId(workId: string) {
      console.log('🔍 Fetching user posts by work ID:', workId)
      const { data, error } = await supabase.from('user_posts').select('*').eq('work_id', workId).order('created_at', { ascending: false })
      if (error) {
        console.error('❌ Error fetching user posts by work ID:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} user posts`)
      return data
    }
  },
  
  // User Answers
  userAnswers: {
    ...createCrudOperations('user_answers'),
    async getByPostId(postId: string) {
      console.log('🔍 Fetching user answers by post ID:', postId)
      const { data, error } = await supabase.from('user_answers').select('*').eq('post_id', postId).order('created_at', { ascending: false })
      if (error) {
        console.error('❌ Error fetching user answers:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} user answers`)
      return data
    },
    async getByUserId(userId: string) {
      console.log('🔍 Fetching user answers by user ID:', userId)
      const { data, error } = await supabase.from('user_answers').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (error) {
        console.error('❌ Error fetching user answers by user ID:', error)
        throw error
      }
      console.log(`✅ Successfully fetched ${data?.length || 0} user answers`)
      return data
    }
  },

  // Storage operations
  storage: {
    async uploadImage(bucket: string, path: string, file: File) {
      console.log('🔍 Uploading image:', { bucket, path, fileName: file.name })
      const { data, error } = await supabase.storage.from(bucket).upload(path, file)
      if (error) {
        console.error('❌ Error uploading image:', error)
        throw error
      }
      console.log('✅ Successfully uploaded image:', data?.path)
      return data
    },
    
    async getPublicUrl(bucket: string, path: string) {
      console.log('🔍 Getting public URL:', { bucket, path })
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      console.log('✅ Generated public URL:', data.publicUrl)
      return data.publicUrl
    },
    
    async deleteFile(bucket: string, path: string) {
      console.log('🔍 Deleting file:', { bucket, path })
      const { error } = await supabase.storage.from(bucket).remove([path])
      if (error) {
        console.error('❌ Error deleting file:', error)
        throw error
      }
      console.log('✅ Successfully deleted file:', path)
      return true
    }
  }
}

// Database types (継続...)
export type Database = {
  public: {
    Tables: {
      celebrities: {
        Row: {
          id: string
          name: string
          slug: string
          image_url: string | null
          youtube_url: string | null
          sns_links: Record<string, unknown> | null
          bio: string | null
          birth_date: string | null
          nationality: string | null
          group_name: string | null
          tmdb_id: number | null
          birthday: string | null
          deathday: string | null
          place_of_birth: string | null
          gender: number | null
          homepage: string | null
          also_known_as: string | null
          popularity: number | null
          known_for_department: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          image_url?: string | null
          youtube_url?: string | null
          sns_links?: Record<string, unknown> | null
          bio?: string | null
          birth_date?: string | null
          nationality?: string | null
          group_name?: string | null
          tmdb_id?: number | null
          birthday?: string | null
          deathday?: string | null
          place_of_birth?: string | null
          gender?: number | null
          homepage?: string | null
          also_known_as?: string | null
          popularity?: number | null
          known_for_department?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          image_url?: string | null
          youtube_url?: string | null
          sns_links?: Record<string, unknown> | null
          bio?: string | null
          birth_date?: string | null
          nationality?: string | null
          group_name?: string | null
          tmdb_id?: number | null
          birthday?: string | null
          deathday?: string | null
          place_of_birth?: string | null
          gender?: number | null
          homepage?: string | null
          also_known_as?: string | null
          popularity?: number | null
          known_for_department?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      episodes: {
        Row: {
          id: string
          celebrity_id: string
          title: string
          date: string
          notes: string | null
          description: string | null
          video_url: string | null
          thumbnail_url: string | null
          platform: string | null
          duration_minutes: number | null
          view_count: number | null
          work_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          celebrity_id: string
          title: string
          date: string
          notes?: string | null
          description?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          platform?: string | null
          duration_minutes?: number | null
          view_count?: number | null
          work_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          celebrity_id?: string
          title?: string
          date?: string
          notes?: string | null
          description?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          platform?: string | null
          duration_minutes?: number | null
          view_count?: number | null
          work_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      items: {
        Row: {
          id: string
          episode_id: string
          name: string
          brand: string | null
          affiliate_url: string | null
          image_url: string | null
          price: number | null
          brand_id: string | null
          category: string
          subcategory: string | null
          currency: string | null
          description: string | null
          color: string | null
          size: string | null
          material: string | null
          is_available: boolean | null
          work_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          episode_id: string
          name: string
          brand?: string | null
          affiliate_url?: string | null
          image_url?: string | null
          price?: number | null
          brand_id?: string | null
          category?: string
          subcategory?: string | null
          currency?: string | null
          description?: string | null
          color?: string | null
          size?: string | null
          material?: string | null
          is_available?: boolean | null
          work_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          episode_id?: string
          name?: string
          brand?: string | null
          affiliate_url?: string | null
          image_url?: string | null
          price?: number | null
          brand_id?: string | null
          category?: string
          subcategory?: string | null
          currency?: string | null
          description?: string | null
          color?: string | null
          size?: string | null
          material?: string | null
          is_available?: boolean | null
          work_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      locations: {
        Row: {
          id: string
          episode_id: string
          name: string
          address: string | null
          latitude: number | null
          longitude: number | null
          map_url: string | null
          menu_example: string[] | null
          image_urls: string[] | null
          category: string
          phone: string | null
          website: string | null
          reservation_url: string | null
          opening_hours: Record<string, unknown> | null
          price_range: string | null
          description: string | null
          work_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          episode_id: string
          name: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          map_url?: string | null
          menu_example?: string[] | null
          image_urls?: string[] | null
          category?: string
          phone?: string | null
          website?: string | null
          reservation_url?: string | null
          opening_hours?: Record<string, unknown> | null
          price_range?: string | null
          description?: string | null
          work_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          episode_id?: string
          name?: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          map_url?: string | null
          menu_example?: string[] | null
          image_urls?: string[] | null
          category?: string
          phone?: string | null
          website?: string | null
          reservation_url?: string | null
          opening_hours?: Record<string, unknown> | null
          price_range?: string | null
          description?: string | null
          work_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      works: {
        Row: {
          id: string
          title: string
          slug: string
          type: string
          description: string | null
          release_date: string | null
          poster_url: string | null
          official_site: string | null
          is_trending: boolean | null
          trending_order: number | null
          genres: string | null
          cast: string | null
          tmdb_id: number | null
          main_cast: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          type?: string
          description?: string | null
          release_date?: string | null
          poster_url?: string | null
          official_site?: string | null
          is_trending?: boolean | null
          trending_order?: number | null
          genres?: string | null
          cast?: string | null
          tmdb_id?: number | null
          main_cast?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          type?: string
          description?: string | null
          release_date?: string | null
          poster_url?: string | null
          official_site?: string | null
          is_trending?: boolean | null
          trending_order?: number | null
          genres?: string | null
          cast?: string | null
          tmdb_id?: number | null
          main_cast?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          slug: string
          type: string
          image_url: string | null
          description: string | null
          debut_date: string | null
          official_site: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type: string
          image_url?: string | null
          description?: string | null
          debut_date?: string | null
          official_site?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          type?: string
          image_url?: string | null
          description?: string | null
          debut_date?: string | null
          official_site?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      celebrity_groups: {
        Row: {
          id: string
          celebrity_id: string
          group_id: string
          role: string | null
          joined_date: string | null
          left_date: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          celebrity_id: string
          group_id: string
          role?: string | null
          joined_date?: string | null
          left_date?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          celebrity_id?: string
          group_id?: string
          role?: string | null
          joined_date?: string | null
          left_date?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      brands: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          official_site: string | null
          description: string | null
          country: string | null
          founded_year: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          official_site?: string | null
          description?: string | null
          country?: string | null
          founded_year?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          official_site?: string | null
          description?: string | null
          country?: string | null
          founded_year?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      appearances: {
        Row: {
          id: string
          episode_id: string
          item_id: string | null
          location_id: string | null
          timestamp_start: number | null
          timestamp_end: number | null
          description: string | null
          screenshot_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          episode_id: string
          item_id?: string | null
          location_id?: string | null
          timestamp_start?: number | null
          timestamp_end?: number | null
          description?: string | null
          screenshot_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          episode_id?: string
          item_id?: string | null
          location_id?: string | null
          timestamp_start?: number | null
          timestamp_end?: number | null
          description?: string | null
          screenshot_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          username: string
          display_name: string
          avatar_url: string | null
          bio: string | null
          is_verified: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          username: string
          display_name: string
          avatar_url?: string | null
          bio?: string | null
          is_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          username?: string
          display_name?: string
          avatar_url?: string | null
          bio?: string | null
          is_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_posts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          image_urls: string[] | null
          celebrity_id: string | null
          episode_id: string | null
          status: string | null
          tags: string[] | null
          view_count: number | null
          like_count: number | null
          work_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          image_urls?: string[] | null
          celebrity_id?: string | null
          episode_id?: string | null
          status?: string | null
          tags?: string[] | null
          view_count?: number | null
          like_count?: number | null
          work_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          image_urls?: string[] | null
          celebrity_id?: string | null
          episode_id?: string | null
          status?: string | null
          tags?: string[] | null
          view_count?: number | null
          like_count?: number | null
          work_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_answers: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          item_id: string | null
          location_id: string | null
          confidence_level: number | null
          is_verified: boolean | null
          like_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          item_id?: string | null
          location_id?: string | null
          confidence_level?: number | null
          is_verified?: boolean | null
          like_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          item_id?: string | null
          location_id?: string | null
          confidence_level?: number | null
          is_verified?: boolean | null
          like_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}