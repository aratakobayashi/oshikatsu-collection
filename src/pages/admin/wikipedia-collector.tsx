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
  birth_date?: Date | null
  place_of_birth?: string | null
  nationality: string
  gender?: number | null
  height_cm?: number | null
  blood_type?: string | null
  debut_date?: Date | null
  years_active?: string | null
  agency?: string | null
  group_name?: string | null
  also_known_as?: string | null
  known_for_department?: string | null
  wikipedia_url?: string | null
  wikipedia_page_id?: number | null
  wikipedia_last_modified?: Date | null
  social_media_urls: Record<string, string>
  career_highlights: Array<{ year: number; achievement: string; type?: string }>
  associated_groups: Array<{ name: string; role?: string; period?: string }>
  data_sources: string[]
  data_completeness_score: number
  last_verified_at: Date
}

// プリセットタレントリスト
const PRESET_CELEBRITIES = {
  '有名アイドル300名': [
    // ジャニーズ系 (50名)
    '二宮和也', '櫻井翔', '相葉雅紀', '松本潤', '大野智',
    '平野紫耀', '永瀬廉', '高橋海人', '岸優太', '神宮寺勇太', '岩橋玄樹',
    '松村北斗', '京本大我', '田中樹', '森本慎太郎', '髙地優吾', 'ジェシー',
    '岩本照', '深澤辰哉', '佐久間大介', '阿部亮平', '宮舘涼太', '向井康二', '目黒蓮', '渡辺翔太', 'ラウール',
    '道枝駿佑', '西畑大吾', '大橋和也', '小瀧望', '重岡大毅', '桐山照史', '中間淳太',
    '藤井流星', '濵田崇裕', '小島健', '福本大晴', '正門良規', '末澤誠也',
    '草間リチャード敬太', '作間龍斗', '浮所飛貴', '那須雄登', '松田元太', '檜山光成',
    '佐藤新', '安嶋秀生', '椿泰我', '松倉海斗', '織山尚大',
    
    // 坂道系 (60名)
    '白石麻衣', '齋藤飛鳥', '生田絵梨花', '松村沙友理', '高山一実', '西野七瀬', '桜井玲香', '橋本奈々未', '深川麻衣', '星野みなみ',
    '秋元真夏', '若月佑美', '衛藤美彩', '桜井玲香', '中田花奈', '大園桃子', '山下美月', '梅澤美波', '久保史緒里', '岩本蓮加',
    '森田ひかる', '山﨑天', '藤吉夏鈴', '田村保乃', '井上梨名', '増本綺良', '遠藤光莉', '大園玲', '大沼晶保', '土生瑞穂',
    '小坂菜緒', '加藤史帆', '佐々木久美', '齊藤京子', '高瀬愛奈', '東村芽依', '金村美玖', '河田陽菜', '小坂井祐莉絵', '富田鈴花',
    '上村ひなの', '髙橋未来虹', '森本茉莉', '山口陽世', '清宮レイ', '五百城茉央', '池田瑛紗', '一ノ瀬美空', '井上和', '岡本姫奈',
    '奥田いろは', '小川彩', '小野寺結加', '柿崎芽実', '掛橋沙耶香', '川嶋海荷', '菅原咲月', '冨里奈央', '中西アルノ', '弓木奈於',
    
    // AKB48系 (60名)
    '指原莉乃', '山本彩', '宮脇咲良', '松井珠理奈', '横山由依', '峯岸みなみ', '柏木由紀', '込山榛香', '向井地美音', '岡田奈々',
    '小嶋陽菜', '大島優子', '前田敦子', '高橋みなみ', '板野友美', '篠田麻里子', '河西智美', '松井玲奈', '木崎ゆりあ', '須田亜香里',
    '古川愛李', '谷真理佳', '高柳明音', '惣田紗莉渚', '岡田彩花', '小畑優奈', '荻野由佳', '中井りか', '本間日陽', '角ゆりあ',
    '太田夢莉', '吉田朱里', '白間美瑠', '加藤夕夏', '石田みなみ', '沖田彩華', '古賀成美', '宮里莉羅', '森保まどか', '兒玉遥',
    '松岡はな', '運上弘菜', '坂口渚沙', '佐藤七海', '千葉恵里', '立仙愛理', '浅井七海', '大盛真歩', '清水麻璃亜', '本田仁美',
    '矢作萌夏', '千葉恵里', '坂口渚沙', '佐藤七海', '立仙愛理', '浅井七海', '大盛真歩', '清水麻璃亜', '本田仁美', '矢作萌夏',
    
    // 女優・俳優・その他 (130名)
    '新垣結衣', '石原さとみ', '長澤まさみ', '綾瀬はるか', '吉高由里子', '有村架純', '橋本環奈', '広瀬すず', '土屋太鳳', '浜辺美波',
    '今田美桜', '永野芽郁', '清原果耶', '森七菜', '上白石萌音', '上白石萌歌', '川口春奈', '芳根京子', '杉咲花', '小松菜奈',
    '福山雅治', '木村拓哉', '佐藤健', '菅田将暉', '山田涼介', '横浜流星', '吉沢亮', '竹内涼真', '中川大志', '神木隆之介',
    '福士蒼汰', '野村周平', '山﨑賢人', '坂口健太郎', '三浦春馬', '岡田将生', '小栗旬', '向井理', '瑛太', '妻夫木聡',
    'IU', 'TWICE', 'BLACKPINK', 'NewJeans', 'IVE', 'aespa', 'ITZY', 'LE SSERAFIM', '(G)I-DLE', 'STAYC',
    'BTS', 'SEVENTEEN', 'STRAY KIDS', 'TOMORROW X TOGETHER', 'NCT', 'ENHYPEN', 'ATEEZ', 'TREASURE', 'MONSTA X', 'GOT7',
    'あいみょん', 'YOASOBI', 'King Gnu', '米津玄師', '星野源', '大塚愛', '椎名林檎', 'MISIA', '宇多田ヒカル', '安室奈美恵',
    '北川景子', '戸田恵梨香', '多部未華子', '蒼井優', '宮崎あおい', '深津絵里', '天海祐希', '松嶋菜々子', '竹内結子', '柴咲コウ',
    '堺雅人', '大泉洋', '阿部寛', '役所広司', '渡辺謙', '佐藤浩市', '西島秀俊', '大沢たかお', '唐沢寿明', '織田裕二',
    '橋下徹', '池上彰', '林修', '東野幸治', '今田耕司', '千原ジュニア', '有吉弘行', '松本人志', '坂上忍', '太田光',
    '指原莉乃', 'ローラ', '藤田ニコル', '渡辺直美', 'りゅうちぇる', 'ぺこ', 'みちょぱ', 'ゆきぽよ', 'えみちゃん', 'ひかりんちょ',
    '中居正広', '木村拓哉', '稲垣吾郎', '草彅剛', '香取慎吾', '長瀬智也', '国分太一', '城島茂', '山口達也', 'TOKIO',
    '関ジャニ∞', '錦戸亮', '大倉忠義', '横山裕', '渋谷すばる', '丸山隆平', '安田章大', '村上信五', 'Kis-My-Ft2', 'Sexy Zone'
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
  ],
  
  'K-POP女性': [
    'IU', 'TWICE', 'BLACKPINK', 'NewJeans', 'IVE',
    'aespa', 'ITZY', 'LE SSERAFIM', '(G)I-DLE', 'STAYC'
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
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]) // 最新100件
  }

  // 日付パース（複数形式対応）
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null
    
    const cleanStr = dateStr.replace(/[年月日()]/g, '').trim()
    
    // 複数の日付形式に対応
    const patterns = [
      /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})/,  // 1995年1月1日, 1995-1-1
      /(\d{4})[年/-](\d{1,2})/,                   // 1995年1月
      /(\d{1,2})[月/-](\d{1,2})[日/-](\d{4})/,   // 1月1日1995年
      /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/,      // 1/1/1995
      /(\d{4})/, // 年のみ
    ]
    
    for (const pattern of patterns) {
      const match = cleanStr.match(pattern)
      if (match) {
        if (pattern.source.includes('(d{4})$')) {
          // 年のみ
          return new Date(parseInt(match[1]), 0, 1)
        } else if (match.length === 3) {
          // 年月
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, 1)
        } else if (match.length === 4) {
          // 年月日
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
        }
      }
    }
    
    return null
  }

  // 身長抽出
  const extractHeight = (text: string): number | null => {
    const heightPatterns = [
      /身長[：:\s]*(\d{2,3})(?:cm|センチ|センチメートル)/i,
      /(\d{2,3})\s*cm/i,
      /(\d{2,3})\s*センチ/i,
      /height[：:\s]*(\d{2,3})/i
    ]
    
    for (const pattern of heightPatterns) {
      const match = text.match(pattern)
      if (match) {
        const height = parseInt(match[1])
        if (height >= 140 && height <= 220) {
          return height
        }
      }
    }
    return null
  }

  // 血液型抽出
  const extractBloodType = (text: string): string | null => {
    const bloodTypePattern = /血液型[：:\s]*([ABO]{1,2}型?)/i
    const match = text.match(bloodTypePattern)
    return match ? match[1].replace('型', '') : null
  }

  // グループ名判定
  const detectGroupName = (_name: string, text: string): string | null => {
    const groupPatterns = [
      // ジャニーズ系
      { pattern: /(嵐|ARASHI)/i, group: '嵐' },
      { pattern: /(King & Prince|キンプリ)/i, group: 'King & Prince' },
      { pattern: /(SixTONES|ストーンズ)/i, group: 'SixTONES' },
      { pattern: /(Snow Man|スノーマン)/i, group: 'Snow Man' },
      { pattern: /(なにわ男子)/i, group: 'なにわ男子' },
      { pattern: /(関ジャニ∞|関ジャニ)/i, group: '関ジャニ∞' },
      { pattern: /(Hey! Say! JUMP|ヘイセイジャンプ)/i, group: 'Hey! Say! JUMP' },
      { pattern: /(Kis-My-Ft2|キスマイ)/i, group: 'Kis-My-Ft2' },
      { pattern: /(Sexy Zone|セクゾ)/i, group: 'Sexy Zone' },
      
      // 坂道系
      { pattern: /(乃木坂46|乃木坂)/i, group: '乃木坂46' },
      { pattern: /(櫻坂46|櫻坂|欅坂46|欅坂)/i, group: '櫻坂46' },
      { pattern: /(日向坂46|日向坂|ひなた坂)/i, group: '日向坂46' },
      
      // AKB系
      { pattern: /(AKB48|AKB)/i, group: 'AKB48' },
      { pattern: /(SKE48|SKE)/i, group: 'SKE48' },
      { pattern: /(NMB48|NMB)/i, group: 'NMB48' },
      { pattern: /(HKT48|HKT)/i, group: 'HKT48' },
      { pattern: /(STU48|STU)/i, group: 'STU48' },
      
      // K-POP
      { pattern: /(TWICE)/i, group: 'TWICE' },
      { pattern: /(BLACKPINK)/i, group: 'BLACKPINK' },
      { pattern: /(NewJeans)/i, group: 'NewJeans' },
      { pattern: /(IVE)/i, group: 'IVE' },
      { pattern: /(aespa)/i, group: 'aespa' },
      { pattern: /(BTS|防弾少年団)/i, group: 'BTS' },
      { pattern: /(SEVENTEEN)/i, group: 'SEVENTEEN' },
      { pattern: /(STRAY KIDS)/i, group: 'STRAY KIDS' }
    ]
    
    for (const { pattern, group } of groupPatterns) {
      if (pattern.test(text) || pattern.test(_name)) {
        return group
      }
    }
    
    return null
  }

  // 性別推定
  const estimateGender = (_name: string, text: string): number | null => {
    const maleIndicators = [
      '俳優', '男優', '歌手（男性）', '男性シンガー', '男性アイドル',
      'ボーイズグループ', '男性グループ', '男子', '男の子'
    ]
    
    const femaleIndicators = [
      '女優', '歌手（女性）', '女性シンガー', '女性アイドル',
      'ガールズグループ', '女性グループ', '女子', '女の子'
    ]
    
    const textLower = text.toLowerCase()
    
    for (const indicator of maleIndicators) {
      if (textLower.includes(indicator)) return 1
    }
    
    for (const indicator of femaleIndicators) {
      if (textLower.includes(indicator)) return 2
    }
    
    return null
  }

  // 事務所抽出
  const extractAgency = (text: string): string | null => {
    const agencyPatterns = [
      /事務所[：:\s]*([^\n\r。、]+)/,
      /所属[：:\s]*([^\n\r。、]+)/,
      /レーベル[：:\s]*([^\n\r。、]+)/,
      /プロダクション[：:\s]*([^\n\r。、]+)/
    ]
    
    for (const pattern of agencyPatterns) {
      const match = text.match(pattern)
      if (match) {
        const agency = match[1].trim()
        if (agency.length > 0 && agency.length < 50) {
          return agency
        }
      }
    }
    
    return null
  }

  // Wikipedia APIから詳細データ取得（強化版）
  const fetchWikipediaData = async (name: string): Promise<CelebrityData> => {
    console.log(`🔍 Wikipedia詳細情報取得開始: ${name}`)
    
    try {
      // Step 1: 基本情報取得
      console.log('Step 1: Summary API呼び出し開始')
      const summaryResponse = await fetch(
        `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
      )
      
      console.log('Summary API レスポンス状態:', summaryResponse.status)
      
      if (!summaryResponse.ok) {
        throw new Error(`Wikipedia Summary API Error: ${summaryResponse.status}`)
      }
      
      const summaryData = await summaryResponse.json()
      console.log('Summary API データ取得完了:', summaryData.title)
      console.log('Extract:', summaryData.extract?.substring(0, 100) + '...')
      
      // Step 2: 詳細なページコンテンツ取得
      let detailedText = ''
      let infoboxData = ''
      
      console.log('Step 2: 詳細API呼び出し開始')
      try {
        // ページの完全なWikitextを取得
        const wikiResponse = await fetch(
          `https://ja.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(name)}&prop=extracts|revisions&exintro=false&explaintext=true&rvprop=content&origin=*`
        )
        
        console.log('詳細API レスポンス状態:', wikiResponse.status)
        
        if (wikiResponse.ok) {
          const wikiData = await wikiResponse.json()
          console.log('詳細API データ構造:', Object.keys(wikiData))
          
          const pages = wikiData.query?.pages
          
          if (pages) {
            const pageId = Object.keys(pages)[0]
            const page = pages[pageId]
            
            if (page.extract) {
              detailedText = page.extract
              console.log('詳細テキスト取得:', detailedText.length, '文字')
            }
            
            if (page.revisions && page.revisions[0]) {
              infoboxData = page.revisions[0]['*'] || ''
              console.log('Infobox取得:', infoboxData.length, '文字')
            }
          }
        }
      } catch (error) {
        console.warn('詳細情報取得でエラー:', error)
        // エラーでも基本情報は取得済みなので続行
      }
      
      // Step 3: データ抽出・統合
      console.log('Step 3: データ抽出開始')
      const fullText = `${summaryData.extract || ''} ${detailedText} ${infoboxData}`
      console.log('統合テキスト長:', fullText.length, '文字')
      console.log('統合テキスト先頭:', fullText.substring(0, 200) + '...')
      
      const slug = summaryData.title.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-ぁ-んァ-ヶー一-龯]/g, '')
        .substring(0, 100)

      // 詳細情報抽出
      console.log('詳細情報抽出開始')
      const birthDate = parseDate(fullText)
      const height = extractHeight(fullText)
      const bloodType = extractBloodType(fullText)
      const groupName = detectGroupName(name, fullText)
      const gender = estimateGender(name, fullText)
      const agency = extractAgency(fullText)
      
      console.log('抽出結果:', {
        birthDate,
        height,
        bloodType,
        groupName,
        gender,
        agency
      })
      
      // 出身地抽出
      const birthPlaceMatch = fullText.match(/出身[：:\s]*([^\n\r。、]+)/)
      const birthPlace = birthPlaceMatch ? birthPlaceMatch[1].trim() : null
      
      // デビュー日抽出
      const debutMatch = fullText.match(/デビュー[：:\s]*([^\n\r。、]+)/)
      const debutDateStr = debutMatch ? debutMatch[1].trim() : null
      const debutDate = debutDateStr ? parseDate(debutDateStr) : null
      
      // 活動期間抽出
      const yearsActiveMatch = fullText.match(/活動期間[：:\s]*([^\n\r。、]+)/)
      const yearsActive = yearsActiveMatch ? yearsActiveMatch[1].trim() : null
      
      // 本名抽出
      const realNameMatch = fullText.match(/本名[：:\s]*([^\n\r。、]+)/)
      const realName = realNameMatch ? realNameMatch[1].trim() : null

      const celebrityData: CelebrityData = {
        name: summaryData.title,
        slug: slug,
        bio: summaryData.extract || '',
        image_url: summaryData.thumbnail?.source || summaryData.originalimage?.source || '',
        birth_date: birthDate,
        place_of_birth: birthPlace,
        nationality: '日本',
        gender: gender,
        height_cm: height,
        blood_type: bloodType,
        debut_date: debutDate,
        years_active: yearsActive,
        agency: agency,
        group_name: groupName,
        also_known_as: realName,
        known_for_department: groupName ? 'アイドル' : 'エンターテインメント',
        wikipedia_url: summaryData.content_urls?.desktop?.page || '',
        wikipedia_page_id: summaryData.pageid,
        wikipedia_last_modified: summaryData.timestamp ? new Date(summaryData.timestamp) : null,
        social_media_urls: {},
        career_highlights: [],
        associated_groups: groupName ? [{ name: groupName, role: 'メンバー', period: yearsActive || undefined }] : [],
        data_sources: ['wikipedia'],
        data_completeness_score: 0,
        last_verified_at: new Date()
      }
      
      // データ完全性スコア計算（詳細版）
      let score = 0
      if (celebrityData.name && celebrityData.name.length > 0) score += 0.15
      if (celebrityData.bio && celebrityData.bio.length > 50) score += 0.20
      if (celebrityData.image_url && celebrityData.image_url.length > 0) score += 0.15
      if (celebrityData.birth_date) score += 0.10
      if (celebrityData.place_of_birth) score += 0.08
      if (celebrityData.height_cm) score += 0.05
      if (celebrityData.blood_type) score += 0.03
      if (celebrityData.debut_date) score += 0.08
      if (celebrityData.agency) score += 0.08
      if (celebrityData.group_name) score += 0.08
      
      celebrityData.data_completeness_score = Math.min(score, 1.0)
      
      console.log(`✅ ${name} 詳細抽出完了 - 品質: ${Math.round(score * 100)}%`)
      console.log('最終データ:', celebrityData)
      
      return celebrityData
      
    } catch (error) {
      console.error(`❌ ${name} Wikipedia取得エラー:`, error)
      throw error
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
      
      // Wikipedia詳細情報取得
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
    
    // 中断用のAbortController
    abortControllerRef.current = new AbortController()
    
    // 初期状態設定
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
    
    addLog(`🚀 バッチ処理開始: ${names.length}名`)
    
    try {
      const batchSize = 3 // 詳細処理のため同時処理数を減らす
      const allResults: CollectionResult[] = []
      
      for (let i = 0; i < names.length; i += batchSize) {
        // 中断チェック
        if (abortControllerRef.current?.signal.aborted) {
          addLog('⏹️ 処理が中断されました')
          break
        }
        
        // 一時停止チェック
        while (isPaused && !abortControllerRef.current?.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        const batch = names.slice(i, i + batchSize)
        addLog(`📦 バッチ処理: ${i + 1}-${Math.min(i + batchSize, names.length)}/${names.length}`)
        
        // バッチ内の処理を並列実行
        const batchPromises = batch.map(name => processSingleCelebrity(name))
        const batchResults = await Promise.all(batchPromises)
        
        allResults.push(...batchResults)
        
        // 統計更新
        const completed = allResults.length
        const success = allResults.filter(r => r.status === 'success').length
        const failed = allResults.filter(r => r.status === 'error').length
        const pending = names.length - completed
        
        // 残り時間計算
        const elapsedTime = Date.now() - processingStartTime.current
        const avgTimePerItem = elapsedTime / completed
        const estimatedRemainingTime = (avgTimePerItem * pending) / 1000 // 秒
        
        setStats({
          total: names.length,
          completed,
          success,
          failed,
          pending,
          estimated_remaining_time: estimatedRemainingTime
        })
        
        // 結果更新
        const updatedResults = [...initialResults]
        allResults.forEach(result => {
          const index = updatedResults.findIndex(r => r.name === result.name)
          if (index !== -1) {
            updatedResults[index] = result
          }
        })
        setResults(updatedResults)
        
        // API制限対策: バッチ間で3秒待機（詳細処理のため長めに）
        if (i + batchSize < names.length) {
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
      }
      
      const successCount = allResults.filter(r => r.status === 'success').length
      const avgQuality = allResults
        .filter(r => r.status === 'success' && r.data_quality_score)
        .reduce((sum, r) => sum + (r.data_quality_score || 0), 0) / successCount
      
      addLog(`🎉 バッチ処理完了! 成功: ${successCount}/${names.length}, 平均品質: ${Math.round(avgQuality * 100)}%`)
      
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
          <h2 className="text-3xl font-bold text-gray-900">詳細データ収集管理</h2>
          <p className="text-gray-600 mt-2">Wikipedia APIから自動でタレント詳細情報を収集・保存</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            処理速度: 約3-5秒/人（詳細版）
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
                placeholder="二宮和也&#10;白石麻衣&#10;指原莉乃&#10;平野紫耀&#10;..."
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
                詳細処理開始
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
          
          {/* 詳細処理の説明 */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">詳細処理で取得される情報</h4>
            <div className="text-xs text-blue-700 grid grid-cols-2 gap-2">
              <div>✅ 生年月日・出身地</div>
              <div>✅ 身長・血液型</div>
              <div>✅ 所属事務所・グループ</div>
              <div>✅ デビュー日・活動期間</div>
              <div>✅ 性別推定・本名</div>
              <div>✅ データ品質スコア</div>
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
            {/* 進捗バー */}
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

            {/* 統計 */}
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
    </div>
  )
}