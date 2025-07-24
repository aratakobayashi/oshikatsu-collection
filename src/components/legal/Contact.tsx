// src/components/legal/Contact.tsx
import React, { useState } from 'react'

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: フォーム送信処理を実装
    console.log('お問い合わせ送信:', formData)
    alert('お問い合わせを受け付けました。回答まで2-3営業日お待ちください。')
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">お問い合わせ</h1>
      
      <div className="mb-8">
        <p className="text-gray-700 leading-relaxed">
          サービスに関するご質問、ご要望、技術的な問題などがございましたら、
          以下のフォームからお気軽にお問い合わせください。
        </p>
        <p className="text-gray-700 mt-4">
          通常2-3営業日以内にご回答いたします。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            お名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email" 
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            お問い合わせ種別 <span className="text-red-500">*</span>
          </label>
          <select
            id="subject"
            name="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            <option value="service">サービスについて</option>
            <option value="technical">技術的な問題</option>
            <option value="content">コンテンツについて</option>
            <option value="other">その他</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            お問い合わせ内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={6}
            value={formData.message}
            onChange={handleChange}
            placeholder="詳細をお聞かせください"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          送信する
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-300">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">その他の連絡方法</h3>
        <div className="space-y-2 text-gray-600">
          <p>メール：[your-email@example.com]</p>
          <p>営業時間：平日 9:00-18:00</p>
          <p>※土日祝日は休業日となります</p>
        </div>
      </div>
    </div>
  )
}