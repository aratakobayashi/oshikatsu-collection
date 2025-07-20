import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
      const { data, error } = await supabase.from(tableName).select('*')
      if (error) throw error
      return data
    },
    
    async getById(id: string) {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    
    async getBySlug(slug: string) {
      const { data, error } = await supabase.from(tableName).select('*').eq('slug', slug).maybeSingle()
      if (error) throw error
      return data
    },
    
    async create(item: CreateItemData) {
      const { data, error } = await supabase.from(tableName).insert(item).select().single()
      if (error) throw error
      return data
    },
    
    async update(id: string, updates: UpdateItemData) {
      const { data, error } = await supabase.from(tableName).update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    
    async delete(id: string) {
      const { error } = await supabase.from(tableName).delete().eq('id', id)
      if (error) throw error
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
      const { data, error } = await supabase.from('celebrities').select('*').eq('id', celebrityId)
      if (error) throw error
      return data
    }
  },
  
  // Episodes - 🔧 celebrity情報をJOINして取得
  episodes: {
    async getAll() {
      const { data, error } = await supabase
        .from('episodes')
        .select(`
          *,
          celebrity:celebrities(id, name, slug, image_url)
        `)
      if (error) throw error
      return data
    },
    
    async getById(id: string) {
      const { data, error } = await supabase
        .from('episodes')
        .select(`
          *,
          celebrity:celebrities(id, name, slug, image_url)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    
    async getBySlug(slug: string) {
      const { data, error } = await supabase
        .from('episodes')
        .select(`
          *,
          celebrity:celebrities(id, name, slug, image_url)
        `)
        .eq('slug', slug)
        .maybeSingle()
      if (error) throw error
      return data
    },
    
    async create(item: CreateItemData) {
      const { data, error } = await supabase.from('episodes').insert(item).select().single()
      if (error) throw error
      return data
    },
    
    async update(id: string, updates: UpdateItemData) {
      const { data, error } = await supabase.from('episodes').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    
    async delete(id: string) {
      const { error } = await supabase.from('episodes').delete().eq('id', id)
      if (error) throw error
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
      const { data, error } = await supabase
        .from('episodes')
        .select(`
          *,
          celebrity:celebrities(id, name, slug, image_url)
        `)
        .eq('work_id', workId)
        .order('date', { ascending: false })
      
      if (error) throw error
      return data
    }
  },
  
  // Items
  items: {
    ...createCrudOperations('items'),
    async getByEpisodeId(episodeId: string) {
      const { data, error } = await supabase.from('items').select('*').eq('episode_id', episodeId)
      if (error) throw error
      return data
    },
    async getByWorkId(workId: string) {
      const { data, error } = await supabase.from('items').select('*').eq('work_id', workId)
      if (error) throw error
      return data
    }
  },
  
  // Locations
  locations: {
    ...createCrudOperations('locations'),
    async getByEpisodeId(episodeId: string) {
      const { data, error } = await supabase.from('locations').select('*').eq('episode_id', episodeId)
      if (error) throw error
      return data
    },
    async getByWorkId(workId: string) {
      const { data, error } = await supabase.from('locations').select('*').eq('work_id', workId)
      if (error) throw error
      return data
    }
  },
  
  // Works
  works: {
    ...createCrudOperations('works'),
    async getTrending() {
      const { data, error } = await supabase.from('works').select('*').eq('is_trending', true).order('trending_order', { ascending: true })
      if (error) throw error
      return data
    },
    async updateTrending(id: string, isTrending: boolean, trendingOrder?: number) {
      const updates: WorkUpdates = { is_trending: isTrending }
      if (trendingOrder !== undefined) {
        updates.trending_order = trendingOrder
      }
      const { data, error } = await supabase.from('works').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    }
  },
  
  // Groups
  groups: createCrudOperations('groups'),
  
  // Celebrity Groups
  celebrityGroups: {
    ...createCrudOperations('celebrity_groups'),
    async getByCelebrityId(celebrityId: string) {
      const { data, error } = await supabase.from('celebrity_groups').select('*').eq('celebrity_id', celebrityId)
      if (error) throw error
      return data
    },
    async getByGroupId(groupId: string) {
      const { data, error } = await supabase.from('celebrity_groups').select('*').eq('group_id', groupId)
      if (error) throw error
      return data
    }
  },
  
  // Brands
  brands: createCrudOperations('brands'),
  
  // Appearances
  appearances: {
    ...createCrudOperations('appearances'),
    async getByEpisodeId(episodeId: string) {
      const { data, error } = await supabase.from('appearances').select('*').eq('episode_id', episodeId)
      if (error) throw error
      return data
    }
  },
  
  // Users
  users: createCrudOperations('users'),
  
  // User Posts
  userPosts: {
    ...createCrudOperations('user_posts'),
    async getByUserId(userId: string) {
      const { data, error } = await supabase.from('user_posts').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    async getByCelebrityId(celebrityId: string) {
      const { data, error } = await supabase.from('user_posts').select('*').eq('celebrity_id', celebrityId).order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    async getByEpisodeId(episodeId: string) {
      const { data, error } = await supabase.from('user_posts').select('*').eq('episode_id', episodeId).order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    async getByWorkId(workId: string) {
      const { data, error } = await supabase.from('user_posts').select('*').eq('work_id', workId).order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  },
  
  // User Answers
  userAnswers: {
    ...createCrudOperations('user_answers'),
    async getByPostId(postId: string) {
      const { data, error } = await supabase.from('user_answers').select('*').eq('post_id', postId).order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    async getByUserId(userId: string) {
      const { data, error } = await supabase.from('user_answers').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  },

  // Storage operations
  storage: {
    async uploadImage(bucket: string, path: string, file: File) {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file)
      if (error) throw error
      return data
    },
    
    async getPublicUrl(bucket: string, path: string) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      return data.publicUrl
    },
    
    async deleteFile(bucket: string, path: string) {
      const { error } = await supabase.storage.from(bucket).remove([path])
      if (error) throw error
      return true
    }
  }
}

// Database types (you can generate these with supabase gen types typescript)
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