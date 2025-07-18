import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, X, Upload, Send, AlertCircle, Check } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import TextArea from '../../components/ui/TextArea'
import Select from '../../components/ui/Select'
import Card, { CardHeader, CardContent } from '../../components/ui/Card'
import { db, Celebrity, Episode } from '../../lib/supabase'
import { useAuth } from '../../components/AuthProvider'

interface ImageFile {
  file: File
  preview: string
  id: string
}

export default function Submit() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [filteredEpisodes, setFilteredEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  
  // Form state
  const [images, setImages] = useState<ImageFile[]>([])
  const [formData, setFormData] = useState({
    title: '',
    celebrity_id: '',
    episode_id: '',
    content: '',
    agreed_to_terms: false
  })
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  useEffect(() => {
    fetchData()
  }, [])
  
  useEffect(() => {
    // Filter episodes based on selected celebrity
    if (formData.celebrity_id) {
      const filtered = episodes.filter(ep => ep.celebrity_id === formData.celebrity_id)
      setFilteredEpisodes(filtered)
    } else {
      setFilteredEpisodes([])
    }
    // Reset episode selection when celebrity changes
    if (formData.episode_id && !filteredEpisodes.find(ep => ep.id === formData.episode_id)) {
      setFormData(prev => ({ ...prev, episode_id: '' }))
    }
  }, [formData.celebrity_id, episodes])
  
  async function fetchData() {
    setLoading(true)
    try {
      const [celebritiesData, episodesData] = await Promise.all([
        db.celebrities.getAll(),
        db.episodes.getAll()
      ])
      setCelebrities(celebritiesData)
      setEpisodes(episodesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    
    if (images.length + files.length > 3) {
      setErrors(prev => ({ ...prev, images: '画像は最大3枚まで選択できます' }))
      return
    }
    
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, images: 'jpg、png、webp形式の画像のみ対応しています' }))
        return false
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, images: '画像サイズは5MB以下にしてください' }))
        return false
      }
      return true
    })
    
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newImage: ImageFile = {
          file,
          preview: e.target?.result as string,
          id: Math.random().toString(36).substr(2, 9)
        }
        setImages(prev => [...prev, newImage])
      }
      reader.readAsDataURL(file)
    })
    
    // Clear image errors if upload is successful
    if (validFiles.length > 0) {
      setErrors(prev => ({ ...prev, images: '' }))
    }
  }
  
  function removeImage(id: string) {
    setImages(prev => prev.filter(img => img.id !== id))
  }
  
  function validateForm() {
    const newErrors: Record<string, string> = {}
    
    if (images.length === 0) {
      newErrors.images = '少なくとも1枚の画像をアップロードしてください'
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'タイトルを入力してください'
    } else if (formData.title.length > 100) {
      newErrors.title = 'タイトルは100文字以内で入力してください'
    }
    
    if (formData.content.length > 500) {
      newErrors.content = '補足説明は500文字以内で入力してください'
    }
    
    if (!formData.agreed_to_terms) {
      newErrors.agreed_to_terms = '利用規約に同意してください'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setSubmitLoading(true)
    
    try {
      // Upload images to Supabase Storage
      const imageUrls: string[] = []
      for (const image of images) {
        try {
          const url = await db.storage.uploadImage(image.file, 'user-uploads')
          imageUrls.push(url)
        } catch (error) {
          console.error('Error uploading image:', error)
          const errorMessage = error instanceof Error ? error.message : '画像のアップロードに失敗しました'
          throw new Error(errorMessage)
        }
      }
      
      const postData = {
        user_id: user!.id,
        title: formData.title,
        content: formData.content,
        image_urls: imageUrls,
        celebrity_id: formData.celebrity_id || null,
        episode_id: formData.episode_id || null,
        status: 'open' as const,
        tags: [] as string[]
      }
      
      // Create the post
      await db.userPosts.create(postData)
      
      // Redirect to success page or post detail
      navigate('/', { state: { message: '投稿が完了しました！' } })
      
    } catch (error) {
      console.error('Error creating post:', error)
      setErrors({ submit: '投稿に失敗しました。もう一度お試しください。' })
    } finally {
      setSubmitLoading(false)
    }
  }
  
  const isFormValid = images.length > 0 && formData.title.trim() && formData.agreed_to_terms
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              質問を投稿する
            </h1>
            <p className="text-lg opacity-90">
              「この服のブランドは？」「この場所はどこ？」など、気になることを投稿してみましょう
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900">新しい質問を投稿</h2>
            <p className="text-gray-600 mt-2">
              画像と質問内容を入力して、コミュニティに質問を投稿できます
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  📷 画像をアップロード <span className="text-red-500">*</span>
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.preview}
                        alt="Upload preview"
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  {images.length < 3 && (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Camera className="h-10 w-10 text-gray-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">クリックして画像を選択</span>
                        </p>
                        <p className="text-xs text-gray-500">JPG, PNG, WEBP (最大5MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
                
                <p className="text-sm text-gray-500">
                  最大3枚まで選択できます ({images.length}/3)
                </p>
                
                {errors.images && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.images}
                  </p>
                )}
              </div>
              
              {/* Title Input */}
              <Input
                label="📝 質問タイトル"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="例：このジャケットのブランドをご存知ですか？"
                required
                error={errors.title}
                helpText={`${formData.title.length}/100文字`}
              />
              
              {/* Celebrity Selection */}
              <Select
                label="🧑‍🎤 関連する推し（任意）"
                value={formData.celebrity_id}
                onChange={(e) => setFormData(prev => ({ ...prev, celebrity_id: e.target.value }))}
                options={[
                  { value: '', label: '推しを選択（任意）' },
                  ...celebrities.map(c => ({ value: c.id, label: c.name }))
                ]}
                helpText="この画像に関連する推しがいる場合は選択してください"
              />
              
              {/* Episode Selection */}
              {formData.celebrity_id && (
                <Select
                  label="🎥 関連するエピソード（任意）"
                  value={formData.episode_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, episode_id: e.target.value }))}
                  options={[
                    { value: '', label: 'エピソードを選択（任意）' },
                    ...filteredEpisodes.map(e => ({ value: e.id, label: e.title }))
                  ]}
                  helpText="この画像が特定のエピソードに関連している場合は選択してください"
                />
              )}
              
              {/* Content TextArea */}
              <TextArea
                label="🗒 補足説明（任意）"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="例：たぶん渋谷あたりのロケです。服のブランドか、店舗名知ってる方いますか？"
                rows={4}
                error={errors.content}
                helpText={`${formData.content.length}/500文字`}
              />
              
              {/* Terms Agreement */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.agreed_to_terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, agreed_to_terms: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  <span className="text-red-500">*</span> 
                  画像の著作権に問題がないことを確認し、
                  <a href="/terms" className="text-blue-600 hover:text-blue-800 underline ml-1">
                    利用規約
                  </a>
                  に同意します
                </label>
              </div>
              
              {errors.agreed_to_terms && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.agreed_to_terms}
                </p>
              )}
              
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {errors.submit}
                </div>
              )}
              
              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  キャンセル
                </Button>
                
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  icon={submitLoading ? undefined : Send}
                  loading={submitLoading}
                  disabled={!isFormValid || submitLoading}
                >
                  {submitLoading ? '投稿中...' : '投稿する'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Help Section */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">投稿のコツ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">📷 良い画像の撮り方</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 明るい場所で撮影する</li>
                  <li>• 対象物がはっきり見えるようにする</li>
                  <li>• 複数の角度から撮影する</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">📝 質問のコツ</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 具体的に何を知りたいか書く</li>
                  <li>• 分かっている情報も一緒に書く</li>
                  <li>• 丁寧な言葉遣いを心がける</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}