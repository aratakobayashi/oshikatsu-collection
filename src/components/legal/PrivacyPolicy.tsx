// src/components/legal/PrivacyPolicy.tsx
import React from 'react'

export const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">プライバシーポリシー</h1>
      
      <div className="space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">1. 個人情報の取得について</h2>
          <p>
            当サイト「エピソードファッション検索」（以下「当サイト」）では、
            ユーザーの皆様に最適なサービスを提供するため、以下の個人情報を取得する場合があります。
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2">
            <li>お名前</li>
            <li>メールアドレス</li>
            <li>サイトの利用状況に関する情報</li>
            <li>Cookie等の技術を用いて取得する情報</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">2. 個人情報の利用目的</h2>
          <p>取得した個人情報は、以下の目的で利用いたします。</p>
          <ul className="list-disc list-inside mt-4 space-y-2">
            <li>当サイトのサービス提供・運営</li>
            <li>ユーザーサポート・お問い合わせ対応</li>
            <li>サービス改善・新機能開発</li>
            <li>法令に基づく対応</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">3. 第三者への提供</h2>
          <p>
            当サイトでは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">4. アフィリエイトプログラムについて</h2>
          <p>当サイトでは、以下のアフィリエイトプログラムを利用しています。</p>
          <ul className="list-disc list-inside mt-4 space-y-2">
            <li>Amazonアソシエイト・プログラム</li>
            <li>バリューコマース</li>
            <li>その他のアフィリエイトサービス</li>
          </ul>
          <p className="mt-4">
            これらのプログラムでは、商品購入時にアフィリエイト収益が発生する場合があります。
            ユーザーに追加費用が発生することはありません。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">5. Cookieについて</h2>
          <p>
            当サイトでは、サービス向上のためCookieを使用する場合があります。
            Cookieの使用を望まない場合は、ブラウザ設定で無効にできます。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">6. お問い合わせ</h2>
          <p>
            個人情報の取扱いに関するお問い合わせは、以下までご連絡ください。
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p>サイト運営者：[あなたの名前]</p>
            <p>メール：[your-email@example.com]</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">7. プライバシーポリシーの変更</h2>
          <p>
            当プライバシーポリシーは、必要に応じて変更する場合があります。
            重要な変更については、サイト上で通知いたします。
          </p>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-300">
          <p className="text-sm text-gray-500">
            制定日：2025年7月24日<br />
            最終更新日：2025年7月24日
          </p>
        </div>
      </div>
    </div>
  )
}