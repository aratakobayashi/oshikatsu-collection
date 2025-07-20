import { AlertTriangle, Info } from 'lucide-react'
import Card, { CardContent } from './ui/Card'

interface DisclaimerProps {
  type?: 'items' | 'locations' | 'general'
  className?: string
}

export default function Disclaimer({ type = 'items', className = '' }: DisclaimerProps) {
  const getDisclaimerContent = () => {
    switch (type) {
      case 'items':
        return {
          title: '⚠️ 推定着用アイテムについて',
          items: [
            '📝 映像・画像から推定した参考商品です',
            '🔍 実際の着用商品とは異なる場合があります',
            '💡 類似デザインの市販品をご紹介しています',
            '🏷️ 推しが公式に着用を発表したものではありません'
          ]
        }
      case 'locations':
        return {
          title: '⚠️ 推定ロケーションについて', 
          items: [
            '📝 映像・画像から推定した参考施設です',
            '🔍 実際の撮影場所とは異なる場合があります',
            '💡 類似の店舗・施設をご紹介している場合があります',
            '📞 訪問前に営業状況をご確認ください'
          ]
        }
      case 'general':
        return {
          title: '⚠️ 情報の取り扱いについて',
          items: [
            '📝 当サイトの情報は推定・参考情報です',
            '🔍 公式発表ではない情報が含まれます',
            '💡 最新情報は公式サイトでご確認ください',
            '📞 ご利用前に必ず最新状況をご確認ください'
          ]
        }
      default:
        return {
          title: '⚠️ ご利用上の注意',
          items: ['📝 当サイトの情報は参考情報です']
        }
    }
  }

  const content = getDisclaimerContent()

  return (
    <Card className={`border-l-4 border-yellow-500 bg-yellow-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-yellow-800 mb-2">{content.title}</p>
            <ul className="space-y-1">
              {content.items.map((item: string, index: number) => (
                <li key={index} className="text-xs text-yellow-700 flex items-start">
                  <span className="mr-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// アフィリエイト表記用コンポーネント
export function AffiliateDisclaimer({ className = '' }: { className?: string }) {
  return (
    <Card className={`bg-gray-50 border border-gray-200 ${className}`}>
      <CardContent className="p-3 text-center">
        <div className="flex items-center justify-center space-x-2">
          <Info className="h-4 w-4 text-gray-500" />
          <p className="text-xs text-gray-600">
            当サイトはAmazon・楽天等のアフィリエイトプログラムに参加しています
          </p>
        </div>
      </CardContent>
    </Card>
  )
}