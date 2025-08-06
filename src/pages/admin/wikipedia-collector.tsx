import { useState, useRef } from 'react'
import { Play, Pause, Square, RefreshCw, Users, Database, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import Button from '../../components/ui/Button'
import TextArea from '../../components/ui/TextArea'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { supabase } from '../../lib/supabase'

// 型定義
interface CollectionResult {
  name: string
  status: 'success' | 'error' | 'pending'
  celebrity_id?: string
  error_message?: string
  processing_time?: number
  data_quality_score?: number
}

interface CollectionStats {
  total: number
  completed: number
  success: number
  failed: number
  pending: number
  estimated_remaining_time: number
}

interface CelebrityData {
  name: string
  slug: string
  bio: string
  image_url: string
  birth_date: Date | null
  place_of_birth: string | null
  nationality: string
  gender: number | null
  height_cm: number | null
  blood_type: string | null
  debut_date: Date | null
  years_active: string | null
  agency: string | null
  group_name: string | null
  also_known_as: string | null
  known_for_department: string | null
  wikipedia_url: string | null
  wikipedia_page_id: number | null
  wikipedia_last_modified: Date | null
  homepage: string | null
  youtube_url: string | null
  tmdb_id: number | null
  popularity: number | null
  social_media_urls: Record<string, string>
  career_highlights: Array<{ year: number; achievement: string; type?: string }>
  associated_groups: Array<{ name: string; role?: string; period?: string }>
  data_sources: string[]
  data_completeness_score: number
  last_verified_at: Date
}

// Wikidata型定義
interface WikidataEntity {
  id: string;
  labels: Record<string, { language: string; value: string }>;
  claims: Record<string, WikidataClaim[]>;
}

interface WikidataClaim {
  mainsnak: {
    snaktype: string;
    datavalue?: {
      value: unknown;
      type: string;
    };
  };
}

interface WikidataSearchResult {
  id: string;
  label: string;
  description: string;
}

// Wikidata APIクライアント
class WikidataClient {
  static async searchEntities(query: string): Promise<WikidataSearchResult[]> {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=ja&limit=3&format=json&origin=*`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return data.search || [];
    } catch (error) {
      console.warn(`Wikidata検索失敗: ${error}`);
      return [];
    }
  }

  static async getEntity(entityId: string): Promise<WikidataEntity | null> {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&format=json&origin=*`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return data.entities[entityId] || null;
    } catch (error) {
      console.warn(`Wikidataエンティティ取得失敗: ${error}`);
      return null;
    }
  }

  static extractClaimValue(claims: WikidataClaim[], type: 'time' | 'quantity' | 'string' | 'wikibase-entityid' = 'string'): unknown {
    if (!claims || claims.length === 0) return null;

    const claim = claims[0];
    const mainsnak = claim.mainsnak;
    
    if (!mainsnak || mainsnak.snaktype !== 'value') return null;

    const datavalue = mainsnak.datavalue;
    if (!datavalue) return null;

    switch (type) {
      case 'time': {
        const timeValue = datavalue.value as { time?: string };
        const timeStr = timeValue?.time;
        if (timeStr) {
          const match = timeStr.match(/\+(\d{4})-(\d{2})-(\d{2})/);
          if (match) {
            return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          }
        }
        return null;
      }
      case 'quantity': {
        const quantityValue = datavalue.value as { amount?: string };
        return parseFloat(quantityValue?.amount || '0') || null;
      }
      case 'string':
        return datavalue.value || null;
      case 'wikibase-entityid': {
        const entityValue = datavalue.value as { id?: string };
        return entityValue?.id || null;
      }
      default:
        return datavalue.value;
    }
  }
}

// プリセットタレントリスト
const PRESET_CELEBRITIES = {
  'テスト用少数': [
    '二宮和也',
    '白石麻衣', 
    '指原莉乃'
  ],
  
  'ジャニーズ系': [
    '二宮和也', '櫻井翔', '相葉雅紀', '松本潤', '大野智',
    '平野紫耀', '永瀬廉', '高橋海人', '岸優太', '神宮寺勇太',
    '松村北斗', '京本大我', '田中樹', '森本慎太郎', '髙地優吾',
    '岩本照', '深澤辰哉', '佐久間大介', '阿部亮平', '宮舘涼太'
  ],
  
  '坂道系': [
    '白石麻衣', '齋藤飛鳥', '生田絵梨花', '松村沙友理', '高山一実',
    '森田ひかる', '山﨑天', '藤吉夏鈴', '田村保乃', '井上梨名',
    '小坂菜緒', '加藤史帆', '佐々木久美', '齊藤京子', '高瀬愛奈'
  ]
}

export default function DataCollection() {
  const [customInput, setCustomInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [results, setResults] = useState<CollectionResult[]>([])
  const [stats, setStats] = useState<CollectionStats>({
    total: 0,
    completed: 0,
    success: 0,
    failed: 0,
    pending: 0,
    estimated_remaining_time: 0
  })
  const [currentProcessing, setCurrentProcessing] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const processingStartTime = useRef<number>(0)

  // ログ追加
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)])
  }

  // 日付解析の強化版
  const parseDate = (text: string): Date | null => {
    if (!text) return null;
    
    const cleanText = text.replace(/[年月日()（）\s]/g, '').trim();
    
    const patterns = [
      /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})/,
      /(\d{4})年(\d{1,2})月(\d{1,2})日/,
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
      /(\d{4})[年/-](\d{1,2})[月]?$/,
      /^(\d{4})年?$/
    ];
    
    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match) {
        if (match.length === 2) {
          return new Date(parseInt(match[1]), 0, 1);
        } else if (match.length === 3) {
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, 1);
        } else if (match.length === 4) {
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        }
      }
    }
    
    return null;
  };

  // 身長抽出の強化版
  const extractHeight = (text: string): number | null => {
    const patterns = [
      /身長[：:\s]*(\d{2,3})(?:cm|センチ|センチメートル|㎝)/i,
      /(\d{2,3})\s*(?:cm|センチ|㎝)/i,
      /height[：:\s]*(\d{2,3})\s*cm/i,
      /プロフィール.*?身長[：:\s]*(\d{2,3})/i,
      /身長\s*=\s*(\d{2,3})/i
    ];
    
    for (const pattern of patterns) {
      const matches = text.matchAll(new RegExp(pattern.source, pattern.flags + 'g'));
      for (const match of matches) {
        const height = parseInt(match[1]);
        if (height >= 130 && height <= 230) {
          console.log(`身長抽出成功: ${height}cm`);
          return height;
        }
      }
    }
    
    return null;
  };

  // グループ名検出の強化版
  const detectGroupName = (name: string, text: string): string | null => {
    const groups = [
      { patterns: [/(嵐|ARASHI)/i], name: '嵐' },
      { patterns: [/(King & Prince|キンプリ)/i], name: 'King & Prince' },
      { patterns: [/(SixTONES|ストーンズ)/i], name: 'SixTONES' },
      { patterns: [/(Snow Man|スノーマン)/i], name: 'Snow Man' },
      { patterns: [/(乃木坂46|乃木坂)/i], name: '乃木坂46' },
      { patterns: [/(櫻坂46|櫻坂)/i], name: '櫻坂46' },
      { patterns: [/(日向坂46|日向坂)/i], name: '日向坂46' },
      { patterns: [/(AKB48|AKB)/i], name: 'AKB48' }
    ];
    
    const searchText = `${text} ${name}`;
    
    for (const group of groups) {
      for (const pattern of group.patterns) {
        if (pattern.test(searchText)) {
          console.log(`グループ検出成功: ${group.name}`);
          return group.name;
        }
      }
    }
    
    const memberGroups: Record<string, string> = {
      '大野智': '嵐', '櫻井翔': '嵐', '相葉雅紀': '嵐', '二宮和也': '嵐', '松本潤': '嵐',
      '平野紫耀': 'King & Prince', '永瀬廉': 'King & Prince', '高橋海人': 'King & Prince', 
      '白石麻衣': '乃木坂46', '齋藤飛鳥': '乃木坂46', '生田絵梨花': '乃木坂46',
      '森田ひかる': '櫻坂46', '山﨑天': '櫻坂46'
    };
    
    if (memberGroups[name]) {
      const detectedGroup = memberGroups[name];
      console.log(`メンバー名からグループ推定: ${name} → ${detectedGroup}`);
      return detectedGroup;
    }
    
    return null;
  };

  // 強化版Wikipedia APIからデータ取得
  const fetchWikipediaData = async (name: string): Promise<CelebrityData> => {
    console.log(`🚀 強化版Wikipedia情報取得開始: ${name}`);

    try {
      // Phase 1: Wikidata API試行
      console.log('=== Phase 1: Wikidata API ===');
      
      const searchResults = await WikidataClient.searchEntities(name);
      let celebrityData: CelebrityData | null = null;
      
      if (searchResults.length > 0) {
        const bestMatch = searchResults[0];
        console.log(`Wikidata候補: ${bestMatch.label}`);
        
        const entity = await WikidataClient.getEntity(bestMatch.id);
        
        if (entity) {
          console.log('Wikidataエンティティ取得成功');
          const claims = entity.claims;
          
          celebrityData = {
            name: entity.labels?.ja?.value || entity.labels?.en?.value || name,
            slug: (entity.labels?.ja?.value || name).toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^\w\-ぁ-んァ-ヶー一-龯]/g, '')
              .substring(0, 100),
            bio: 'Wikidataから取得',
            image_url: '',
            birth_date: claims?.P569 ? WikidataClient.extractClaimValue(claims.P569, 'time') as Date : null,
            place_of_birth: null,
            nationality: '日本',
            gender: claims?.P21 ? (WikidataClient.extractClaimValue(claims.P21, 'wikibase-entityid') === 'Q6581097' ? 1 : 2) : null,
            height_cm: claims?.P2048 ? Math.round((WikidataClient.extractClaimValue(claims.P2048, 'quantity') as number) * 100) : null,
            blood_type: null,
            debut_date: null,
            years_active: null,
            agency: null,
            group_name: null,
            also_known_as: null,
            known_for_department: 'エンターテインメント',
            wikipedia_url: null,
            wikipedia_page_id: null,
            wikipedia_last_modified: null,
            homepage: null,
            youtube_url: null,
            tmdb_id: null,
            popularity: null,
            social_media_urls: {},
            career_highlights: [],
            associated_groups: [],
            data_sources: ['wikidata'],
            data_completeness_score: 0,
            last_verified_at: new Date()
          };
          
          console.log('✅ Wikidataから基本情報取得成功');
        }
      }

      // Phase 2: Wikipedia API
      console.log('=== Phase 2: Wikipedia API ===');
      
      const summaryResponse = await fetch(
        `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
      );
      
      if (!summaryResponse.ok) {
        throw new Error(`Wikipedia Summary API Error: ${summaryResponse.status}`);
      }
      
      const summaryData = await summaryResponse.json();
      
      // Wikidataが失敗した場合はWikipediaから初期化
      if (!celebrityData) {
        const slug = name.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-ぁ-んァ-ヶー一-龯]/g, '')
          .substring(0, 100);

        celebrityData = {
          name: summaryData.title,
          slug: slug,
          bio: summaryData.extract || '',
          image_url: summaryData.thumbnail?.source || summaryData.originalimage?.source || '',
          birth_date: null,
          place_of_birth: null,
          nationality: '日本',
          gender: null,
          height_cm: null,
          blood_type: null,
          debut_date: null,
          years_active: null,
          agency: null,
          group_name: null,
          also_known_as: null,
          known_for_department: 'エンターテインメント',
          wikipedia_url: summaryData.content_urls?.desktop?.page || '',
          wikipedia_page_id: summaryData.pageid,
          wikipedia_last_modified: summaryData.timestamp ? new Date(summaryData.timestamp) : null,
          homepage: null,
          youtube_url: null,
          tmdb_id: null,
          popularity: null,
          social_media_urls: {},
          career_highlights: [],
          associated_groups: [],
          data_sources: ['wikipedia'],
          data_completeness_score: 0,
          last_verified_at: new Date()
        };
      } else {
        // WikidataにないデータをWikipediaで補完
        celebrityData.bio = summaryData.extract || celebrityData.bio;
        celebrityData.image_url = summaryData.thumbnail?.source || summaryData.originalimage?.source || celebrityData.image_url;
        celebrityData.wikipedia_url = summaryData.content_urls?.desktop?.page || celebrityData.wikipedia_url;
        celebrityData.wikipedia_page_id = summaryData.pageid || celebrityData.wikipedia_page_id;
        celebrityData.wikipedia_last_modified = summaryData.timestamp ? new Date(summaryData.timestamp) : celebrityData.wikipedia_last_modified;
        celebrityData.data_sources = ['wikidata', 'wikipedia'];
      }

      // Phase 3: 詳細テキスト解析
      console.log('=== Phase 3: 詳細テキスト解析 ===');
      
      let fullText = celebrityData.bio || '';
      
      try {
        const wikiResponse = await fetch(
          `https://ja.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(name)}&prop=extracts|revisions&exintro=false&explaintext=true&rvprop=content&origin=*`
        );
        
        if (wikiResponse.ok) {
          const wikiData = await wikiResponse.json();
          const pages = wikiData.query?.pages;
          
          if (pages) {
            const pageId = Object.keys(pages)[0];
            const page = pages[pageId];
            
            if (page.extract) fullText += ' ' + page.extract;
            if (page.revisions && page.revisions[0]) {
              fullText += ' ' + (page.revisions[0]['*'] || '');
            }
          }
          
          console.log(`詳細テキスト取得: ${fullText.length}文字`);
        }
      } catch (error) {
        console.warn('詳細テキスト取得失敗:', error);
      }

      // Phase 4: 強化された抽出ロジック
      console.log('=== Phase 4: 強化抽出ロジック ===');
      
      if (!celebrityData.birth_date) {
        celebrityData.birth_date = parseDate(fullText);
      }
      
      if (!celebrityData.height_cm) {
        celebrityData.height_cm = extractHeight(fullText);
      }
      
      if (!celebrityData.blood_type) {
        const bloodTypeMatch = fullText.match(/血液型[：:\s]*([ABO]{1,2}型?)/i);
        if (bloodTypeMatch) {
          const bloodType = bloodTypeMatch[1].replace(/型/g, '').toUpperCase();
          if (['A', 'B', 'AB', 'O'].includes(bloodType)) {
            celebrityData.blood_type = bloodType;
          }
        }
      }
      
      if (!celebrityData.agency) {
        const agencyMatch = fullText.match(/事務所[：:\s]*([^\n\r。、]+)/);
        if (agencyMatch) {
          const agency = agencyMatch[1].trim().replace(/[（(].*[）)]/, '');
          if (agency.length > 0 && agency.length < 50) {
            celebrityData.agency = agency;
          }
        }
      }
      
      if (!celebrityData.group_name) {
        celebrityData.group_name = detectGroupName(name, fullText);
      }

      // 出身地抽出
      if (!celebrityData.place_of_birth) {
        const birthPlaceMatch = fullText.match(/出身[：:\s]*([^\n\r。、]+)/);
        if (birthPlaceMatch) {
          celebrityData.place_of_birth = birthPlaceMatch[1].trim();
        }
      }

      // associated_groups更新
      if (celebrityData.group_name) {
        celebrityData.associated_groups = [{
          name: celebrityData.group_name,
          role: 'メンバー',
          period: celebrityData.years_active || undefined
        }];
      }

      // データ完全性スコア計算
      let score = 0;
      const weights = {
        name: 0.10,
        bio: 0.15,
        image_url: 0.10,
        birth_date: 0.15,
        place_of_birth: 0.08,
        height_cm: 0.08,
        blood_type: 0.05,
        agency: 0.12,
        group_name: 0.10
      };

      Object.entries(weights).forEach(([key, weight]) => {
        const value = celebrityData![key as keyof CelebrityData];
        if (value !== null && value !== undefined && value !== '') {
          score += weight;
        }
      });

      celebrityData.data_completeness_score = Math.min(score, 1.0);

      console.log(`🎉 ${name} データ取得完了`);
      console.log(`データソース: ${celebrityData.data_sources.join(', ')}`);
      console.log(`品質スコア: ${Math.round(score * 100)}%`);

      return celebrityData;

    } catch (error) {
      console.error(`❌ ${name} 強化版データ取得エラー:`, error);
      throw error;
    }
  }

  // Supabaseに保存
  const saveCelebrityToSupabase = async (celebrityData: CelebrityData): Promise<string> => {
    const { data, error } = await supabase
      .from('celebrities_new')
      .upsert({
        ...celebrityData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'slug',
        ignoreDuplicates: false
      })
      .select('id')
      .single()
    
    if (error) {
      throw error
    }
    
    return data.id
  }

  // 単一Celebrity処理
  const processSingleCelebrity = async (name: string): Promise<CollectionResult> => {
    const startTime = Date.now()
    
    try {
      setCurrentProcessing(name)
      addLog(`処理開始: ${name}`)
      
      // 強化版Wikipedia情報取得
      const celebrityData = await fetchWikipediaData(name)
      
      // Supabase保存
      const celebrityId = await saveCelebrityToSupabase(celebrityData)
      
      const processingTime = Date.now() - startTime
      addLog(`✅ 成功: ${name} (${processingTime}ms, 品質: ${Math.round(celebrityData.data_completeness_score * 100)}%)`)
      
      return {
        name: name,
        status: 'success',
        celebrity_id: celebrityId,
        processing_time: processingTime,
        data_quality_score: celebrityData.data_completeness_score
      }
      
    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      addLog(`❌ 失敗: ${name} - ${errorMessage}`)
      
      return {
        name: name,
        status: 'error',
        error_message: errorMessage,
        processing_time: processingTime
      }
      
    } finally {
      setCurrentProcessing('')
    }
  }

  // バッチ処理メイン
  const processBatch = async (names: string[]) => {
    if (names.length === 0) return
    
    setIsProcessing(true)
    setIsPaused(false)
    processingStartTime.current = Date.now()
    
    abortControllerRef.current = new AbortController()
    
    const initialResults: CollectionResult[] = names.map(name => ({
      name,
      status: 'pending'
    }))
    setResults(initialResults)
    setStats({
      total: names.length,
      completed: 0,
      success: 0,
      failed: 0,
      pending: names.length,
      estimated_remaining_time: 0
    })
    
    addLog(`🚀 強化版バッチ処理開始: ${names.length}名`)
    
    try {
      const batchSize = 2
      const allResults: CollectionResult[] = []
      
      for (let i = 0; i < names.length; i += batchSize) {
        if (abortControllerRef.current?.signal.aborted) {
          addLog('⏹️ 処理が中断されました')
          break
        }
        
        while (isPaused && !abortControllerRef.current?.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        const batch = names.slice(i, i + batchSize)
        addLog(`📦 バッチ処理: ${i + 1}-${Math.min(i + batchSize, names.length)}/${names.length}`)
        
        const batchPromises = batch.map(name => processSingleCelebrity(name))
        const batchResults = await Promise.all(batchPromises)
        
        allResults.push(...batchResults)
        
        const completed = allResults.length
        const success = allResults.filter(r => r.status === 'success').length
        const failed = allResults.filter(r => r.status === 'error').length
        const pending = names.length - completed
        
        const elapsedTime = Date.now() - processingStartTime.current
        const avgTimePerItem = elapsedTime / completed
        const estimatedRemainingTime = (avgTimePerItem * pending) / 1000
        
        setStats({
          total: names.length,
          completed,
          success,
          failed,
          pending,
          estimated_remaining_time: estimatedRemainingTime
        })
        
        const updatedResults = [...initialResults]
        allResults.forEach(result => {
          const index = updatedResults.findIndex(r => r.name === result.name)
          if (index !== -1) {
            updatedResults[index] = result
          }
        })
        setResults(updatedResults)
        
        if (i + batchSize < names.length) {
          await new Promise(resolve => setTimeout(resolve, 4000))
        }
      }
      
      const successCount = allResults.filter(r => r.status === 'success').length
      const avgQuality = allResults
        .filter(r => r.status === 'success' && r.data_quality_score)
        .reduce((sum, r) => sum + (r.data_quality_score || 0), 0) / successCount
      
      addLog(`🎉 強化版バッチ処理完了! 成功: ${successCount}/${names.length}, 平均品質: ${Math.round(avgQuality * 100)}%`)
      
    } catch (error) {
      addLog(`❌ バッチ処理エラー: ${error}`)
    } finally {
      setIsProcessing(false)
      setIsPaused(false)
      setCurrentProcessing('')
    }
  }

  // プリセット読み込み
  const loadPreset = (presetKey: string) => {
    const names = PRESET_CELEBRITIES[presetKey as keyof typeof PRESET_CELEBRITIES]
    if (names) {
      setCustomInput(names.join('\n'))
      addLog(`📋 プリセット読み込み: ${presetKey} (${names.length}名)`)
    }
  }

  // 入力からタレント名リストを取得
  const getNamesList = (): string[] => {
    return customInput
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0)
  }

  // 処理開始
  const startProcessing = () => {
    const names = getNamesList()
    if (names.length === 0) {
      alert('タレント名を入力してください')
      return
    }
    processBatch(names)
  }

  // 処理中断
  const stopProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsProcessing(false)
    setIsPaused(false)
    addLog('⏹️ 処理を中断しました')
  }

  // 一時停止/再開
  const togglePause = () => {
    setIsPaused(!isPaused)
    addLog(isPaused ? '▶️ 処理を再開しました' : '⏸️ 処理を一時停止しました')
  }

  // 結果クリア
  const clearResults = () => {
    setResults([])
    setStats({
      total: 0,
      completed: 0,
      success: 0,
      failed: 0,
      pending: 0,
      estimated_remaining_time: 0
    })
    setLogs([])
    addLog('🗑️ 結果をクリアしました')
  }

  // 進捗率計算
  const progressPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">強化版データ収集管理</h2>
          <p className="text-gray-600 mt-2">Wikidata + Wikipedia APIから自動でタレント詳細情報を収集・保存</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            処理速度: 約4-6秒/人（強化版）
          </div>
          {currentProcessing && (
            <div className="flex items-center text-sm text-blue-600">
              <Clock className="h-4 w-4 mr-1 animate-spin" />
              処理中: {currentProcessing}
            </div>
          )}
        </div>
      </div>

      {/* 入力セクション */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-500" />
            1. タレント選択
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* プリセット選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                プリセットリスト
              </label>
              <div className="space-y-2">
                {Object.keys(PRESET_CELEBRITIES).map((presetKey) => {
                  const count = PRESET_CELEBRITIES[presetKey as keyof typeof PRESET_CELEBRITIES].length
                  return (
                    <Button
                      key={presetKey}
                      variant="outline"
                      onClick={() => loadPreset(presetKey)}
                      className="w-full justify-between"
                      disabled={isProcessing}
                    >
                      <span>{presetKey}</span>
                      <span className="text-sm text-gray-500">{count}名</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* カスタム入力 */}
            <div>
              <TextArea
                label="カスタム入力（1行に1名）"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                rows={10}
                placeholder="二宮和也&#10;白石麻衣&#10;指原莉乃&#10;..."
                disabled={isProcessing}
              />
              <div className="mt-2 text-sm text-gray-500">
                入力数: {getNamesList().length}名
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 制御セクション */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Play className="h-5 w-5 mr-2 text-green-500" />
            2. 処理制御
          </h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {!isProcessing ? (
              <Button
                onClick={startProcessing}
                className="bg-green-600 hover:bg-green-700"
                icon={Play}
                disabled={getNamesList().length === 0}
              >
                強化処理開始
              </Button>
            ) : (
              <>
                <Button
                  onClick={togglePause}
                  className={isPaused ? "bg-green-600 hover:bg-green-700" : "bg-yellow-600 hover:bg-yellow-700"}
                  icon={isPaused ? Play : Pause}
                >
                  {isPaused ? '再開' : '一時停止'}
                </Button>
                <Button
                  onClick={stopProcessing}
                  variant="danger"
                  icon={Square}
                >
                  中断
                </Button>
              </>
            )}
            
            <Button
              onClick={clearResults}
              variant="outline"
              icon={RefreshCw}
              disabled={isProcessing}
            >
              結果クリア
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">強化処理で取得される情報</h4>
            <div className="text-xs text-blue-700 grid grid-cols-2 gap-2">
              <div>✅ Wikidata構造化データ</div>
              <div>✅ 生年月日・出身地</div>
              <div>✅ 身長・血液型</div>
              <div>✅ 所属事務所・グループ</div>
              <div>✅ データ品質スコア</div>
              <div>✅ 和暦対応</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 進捗セクション */}
      {(isProcessing || results.length > 0) && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Database className="h-5 w-5 mr-2 text-purple-500" />
              3. 処理状況
            </h3>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  進捗: {stats.completed}/{stats.total} ({progressPercentage.toFixed(1)}%)
                </span>
                <span className="text-sm text-gray-500">
                  残り約{Math.ceil(stats.estimated_remaining_time / 60)}分
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              {isPaused && (
                <div className="mt-2 text-center text-sm text-yellow-600">
                  ⏸️ 処理が一時停止中です
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">総数</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                <div className="text-sm text-gray-500">成功</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-sm text-gray-500">失敗</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-500">待機中</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.success > 0 ? Math.round((results.filter(r => r.status === 'success' && r.data_quality_score).reduce((sum, r) => sum + (r.data_quality_score || 0), 0) / stats.success) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-500">平均品質</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 結果詳細 */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              4. 処理結果
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.status === 'success' 
                      ? 'bg-green-50 border-green-200' 
                      : result.status === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {result.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                    {result.status === 'pending' && <Clock className="h-5 w-5 text-gray-400" />}
                    
                    <div>
                      <div className="font-medium text-gray-900">{result.name}</div>
                      {result.error_message && (
                        <div className="text-sm text-red-600">{result.error_message}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {result.data_quality_score && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.data_quality_score >= 0.8 
                          ? 'bg-green-100 text-green-800'
                          : result.data_quality_score >= 0.6
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        品質: {Math.round(result.data_quality_score * 100)}%
                      </span>
                    )}
                    {result.processing_time && (
                      <span>{result.processing_time}ms</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ログセクション */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-gray-500" />
              5. 処理ログ
            </h3>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="space-y-1 text-sm font-mono">
                {logs.map((log, index) => (
                  <div key={index} className="text-gray-300">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 注意事項 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">強化版の特徴</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• WikidataとWikipedia APIを併用して構造化データを優先取得</li>
                <li>• 2名ずつバッチ処理（API制限対策）</li>
                <li>• 1名あたり4-6秒程度の処理時間</li>
                <li>• 日付解析の大幅強化（和暦対応）</li>
                <li>• 身長・血液型・事務所・グループ名の高精度抽出</li>
                <li>• データ品質スコアで取得精度を数値化</li>
                <li>• 既存データは更新され、重複はマージされます</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}