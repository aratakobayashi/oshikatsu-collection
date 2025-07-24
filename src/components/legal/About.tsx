// src/components/legal/About.tsx  
import React from 'react'

export const About = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">サイト概要</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">サービス概要</h2>
          <p className="text-gray-700 leading-relaxed">
            「エピソードファッション検索」は、テレビ番組や映画で登場するファッションアイテムや
            ロケーション情報を検索できるサービスです。気になったアイテムやお店を
            簡単に見つけることができます。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">主な機能</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">👕 ファッション検索</h3>
              <p className="text-blue-700 text-sm">
                ドラマや映画に登場するファッションアイテムを検索し、
                購入可能な類似商品を紹介します
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">📍 ロケーション情報</h3>
              <p className="text-green-700 text-sm">
                撮影地やレストラン、カフェなどの情報を提供し、
                実際に訪れることができる場所を紹介します
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">運営者情報</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <dl className="space-y-2">
              <div>
                <dt className="font-medium text-gray-800">サイト名：</dt>
                <dd className="text-gray-700">エピソードファッション検索</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-800">運営者：</dt>
                <dd className="text-gray-700">[あなたの名前]</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-800">開設日：</dt>
                <dd className="text-gray-700">2025年7月24日</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-800">お問い合わせ：</dt>
                <dd className="text-gray-700">[your-email@example.com]</dd>
              </div>
            </dl>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">アフィリエイト開示</h2>
          <p className="text-gray-700 leading-relaxed">
            当サイトでは、Amazonアソシエイト・プログラムおよびその他のアフィリエイトプログラムに
            参加しています。商品購入時に当サイトが収益を得る場合がありますが、
            読者の皆様に追加費用が発生することはありません。
          </p>
        </section>
      </div>
    </div>
  )
}