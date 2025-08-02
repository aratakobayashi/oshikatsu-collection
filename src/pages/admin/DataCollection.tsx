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

  // Wikipedia APIからデータ取得
  const fetchWikipediaData = async (name: string): Promise<CelebrityData> => {
    console.log(`🔍 Wikipedia情報取得開始: ${name}`)
    
    // Step 1: 基本情報取得
    const summaryResponse = await fetch(
      `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
    )
    
    if (!summaryResponse.ok) {
      throw new Error(`Wikipedia API Error: ${summaryResponse.status}`)
    }
    
    const summaryData = await summaryResponse.json()
    
    // Step 2: 詳細情報取得（簡略版）
    const detailedInfo: Record<string, unknown> = {}
    try {
      const detailResponse = await fetch(
        `https://ja.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(name)}`
      )
      const detailData = await detailResponse.json()
      if (detailData.query?.pages) {
        const page = Object.values(detailData.query.pages)[0] as Record<string, unknown>
        detailedInfo.full_extract = page?.extract
      }
    } catch (error) {
      console.warn('詳細情報取得失敗:', error)
    }
    
    // Step 3: データ統合・変換
    const slug = name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-ぁ-んァ-ヶー一-龯]/g, '')
      .substring(0, 100)

    const celebrityData: CelebrityData = {
      name: summaryData.title,
      slug: slug,
      bio: summaryData.extract || '',
      image_url: summaryData.thumbnail?.source || summaryData.originalimage?.source || '',
      birth_date: null, // 簡略版では省略
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
      social_media_urls: {},
      career_highlights: [],
      associated_groups: [],
      data_sources: ['wikipedia'],
      data_completeness_score: 0,
      last_verified_at: new Date()
    }
    
    // データ完全性スコア計算
    let score = 0
    if (celebrityData.name && celebrityData.name.length > 0) score += 0.25
    if (celebrityData.bio && celebrityData.bio.length > 50) score += 0.35
    if (celebrityData.image_url && celebrityData.image_url.length > 0) score += 0.25
    if (celebrityData.wikipedia_url && celebrityData.wikipedia_url.length > 0) score += 0.15
    
    celebrityData.data_completeness_score = score
    
    return celebrityData
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
      
      // Wikipedia情報取得
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
      const batchSize = 5 // 同時処理数
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
        
        // API制限対策: バッチ間で2秒待機
        if (i + batchSize < names.length) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
      
      addLog(`🎉 バッチ処理完了! 成功: ${allResults.filter(r => r.status === 'success').length}/${names.length}`)
      
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
          <h2 className="text-3xl font-bold text-gray-900">データ収集管理</h2>
          <p className="text-gray-600 mt-2">Wikipedia APIから自動でタレント情報を収集・保存</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            API制限: 適度な利用を推奨
          </div>
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
                処理開始
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
            </div>

            {/* 統計 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">総数</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                <div className="text-sm text-green-600">成功</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-sm text-red-600">失敗</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-yellow-600">待機</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
                <div className="text-sm text-blue-600">完了</div>
              </div>
            </div>

            {/* 現在処理中 */}
            {currentProcessing && (
              <div className="flex items-center p-3 bg-blue-50 rounded-lg mb-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800">処理中: {currentProcessing}</span>
              </div>
            )}

            {/* 一時停止中 */}
            {isPaused && (
              <div className="flex items-center p-3 bg-yellow-50 rounded-lg mb-4">
                <Pause className="h-4 w-4 text-yellow-600 mr-3" />
                <span className="text-yellow-800">処理が一時停止中です</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 結果セクション */}
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
                    {result.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {result.status === 'error' && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    {result.status === 'pending' && (
                      <Clock className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="font-medium">{result.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    {result.status === 'success' && (
                      <>
                        <span className="text-green-600">
                          品質: {Math.round((result.data_quality_score || 0) * 100)}%
                        </span>
                        <span className="text-gray-500">
                          {result.processing_time}ms
                        </span>
                      </>
                    )}
                    {result.status === 'error' && (
                      <span className="text-red-600 text-xs max-w-xs truncate">
                        {result.error_message}
                      </span>
                    )}
                    {result.status === 'pending' && (
                      <span className="text-gray-400">待機中</span>
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
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
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
              <h4 className="font-semibold text-blue-900 mb-2">利用上の注意</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Wikipedia APIに負荷をかけないよう、5名ずつバッチ処理を行います</li>
                <li>• 1名あたり2-3秒程度の処理時間がかかります</li>
                <li>• 既に存在するタレントの場合は情報が更新されます</li>
                <li>• Wikipediaに存在しないタレントは失敗となります</li>
                <li>• 処理中にページを閉じると中断されます</li>
                <li>• 大量データの場合は時間がかかるため、適度に分割して実行することを推奨します</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 将来機能のプレビュー */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-600">🚧 今後追加予定の機能</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200 opacity-60">
              <h4 className="font-medium text-gray-600 mb-2">📺 YouTube連携</h4>
              <p className="text-sm text-gray-500">
                公式チャンネルから動画エピソードを自動収集
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200 opacity-60">
              <h4 className="font-medium text-gray-600 mb-2">🎬 TMDb連携</h4>
              <p className="text-sm text-gray-500">
                映画・ドラマの出演作品情報を自動取得
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200 opacity-60">
              <h4 className="font-medium text-gray-600 mb-2">🤖 AI解析</h4>
              <p className="text-sm text-gray-500">
                画像からアイテム・ロケーションを自動特定
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}