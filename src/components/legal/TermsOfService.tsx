// src/components/legal/TermsOfService.tsx

export const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">利用規約</h1>
      
      <div className="space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">第1条（適用）</h2>
          <p>
            本規約は、当サイト「エピソードファッション検索」（以下「当サイト」）の
            利用に関して適用されます。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">第2条（サービス内容）</h2>
          <p>当サイトでは、以下のサービスを提供します。</p>
          <ul className="list-disc list-inside mt-4 space-y-2">
            <li>テレビ番組・映画のファッション情報検索</li>
            <li>ロケーション情報の提供</li>
            <li>関連商品・サービスの紹介</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">第3条（利用上の注意）</h2>
          <p>ユーザーは、以下の行為を行ってはなりません。</p>
          <ul className="list-disc list-inside mt-4 space-y-2">
            <li>法令に違反する行為</li>
            <li>当サイトの運営を妨害する行為</li>
            <li>他のユーザーに迷惑をかける行為</li>
            <li>商用利用（事前承諾なく）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">第4条（免責事項）</h2>
          <p>
            当サイトの情報は、正確性を保証するものではありません。
            当サイトの利用によって生じた損害について、当サイトは責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">第5条（アフィリエイトについて）</h2>
          <p>
            当サイトでは、アフィリエイトプログラムを利用して商品・サービスを紹介しています。
            購入時に当サイトに収益が発生する場合がありますが、ユーザーに追加費用は発生しません。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">第6条（規約の変更）</h2>
          <p>
            本規約は、必要に応じて変更する場合があります。
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