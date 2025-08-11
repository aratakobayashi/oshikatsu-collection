import React, { useState } from 'react'
import { Check, X, Users } from 'lucide-react'
import Button from './ui/Button'

interface VerificationButtonProps {
  itemId: string
  itemType: 'location' | 'item'
  itemName: string
  currentVerifications?: number
  userHasVerified?: boolean
  onVerify?: (itemId: string, isCorrect: boolean) => void
}

const VerificationButton: React.FC<VerificationButtonProps> = ({
  itemId,
  itemType,
  itemName,
  currentVerifications = 0,
  userHasVerified = false,
  onVerify
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleVerification = async (isCorrect: boolean) => {
    setIsSubmitting(true)
    try {
      await onVerify?.(itemId, isCorrect)
      setIsExpanded(false)
    } catch (error) {
      console.error('Verification failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getVerificationStatus = () => {
    if (currentVerifications >= 3) {
      return { status: 'verified', label: '確定', color: 'bg-green-100 text-green-800' }
    } else if (currentVerifications >= 1) {
      return { status: 'user_confirmed', label: 'ユーザー確認済み', color: 'bg-orange-100 text-orange-800' }
    }
    return { status: 'estimated', label: '推定', color: 'bg-amber-100 text-amber-700' }
  }

  const { status, label, color } = getVerificationStatus()

  if (userHasVerified) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
          {label}
        </span>
        <span className="text-green-600 text-xs">✓ 確認済み</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
          {label}
        </span>
        {currentVerifications > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Users className="h-3 w-3" />
            <span>{currentVerifications}人が確認</span>
          </div>
        )}
        {!isExpanded && status === 'estimated' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(true)}
            className="text-xs py-1 px-2 h-6"
          >
            確認する
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="bg-gray-50 rounded-lg p-3 border">
          <p className="text-sm text-gray-700 mb-3">
            この{itemType === 'location' ? 'ロケーション' : 'アイテム'}情報は正確ですか？
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleVerification(true)}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-3 h-7"
            >
              <Check className="h-3 w-3 mr-1" />
              正確
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleVerification(false)}
              disabled={isSubmitting}
              className="text-red-600 border-red-200 hover:bg-red-50 text-xs py-1 px-3 h-7"
            >
              <X className="h-3 w-3 mr-1" />
              違う
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(false)}
              className="text-gray-600 text-xs py-1 px-2 h-7"
            >
              キャンセル
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            確認いただいた情報は他のユーザーの参考になります
          </p>
        </div>
      )}
    </div>
  )
}

export default VerificationButton