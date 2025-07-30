import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Award, TrendingUp, Star, ChevronRight } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
              あなたの
              <span className="text-yellow-300">スキル</span>を
              <br />
              次のレベルへ
            </h1>
            <p className="text-xl sm:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              最新の学習プラットフォームで、実践的なスキルを身につけ、
              キャリアを加速させましょう
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/courses"
                className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                コースを探す
                <ArrowRight className="inline-block ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/about"
                className="border-2 border-white hover:bg-white hover:text-blue-700 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300"
              >
                詳細を見る
              </Link>
            </div>
          </div>
        </div>
        {/* 装飾的な要素 */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" fill="none" className="w-full h-12 sm:h-20">
            <path
              d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"
              fill="currentColor"
              className="text-blue-50"
            />
          </svg>
        </div>
      </section>

      {/* 統計セクション */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">50,000+</h3>
              <p className="text-gray-600">アクティブな学習者</p>
            </div>
            <div className="p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">1,200+</h3>
              <p className="text-gray-600">専門コース</p>
            </div>
            <div className="p-6">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">95%</h3>
              <p className="text-gray-600">完了率</p>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              なぜ私たちが選ばれるのか
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              業界をリードする学習体験で、あなたの目標達成をサポートします
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    実践的なプロジェクト
                  </h3>
                  <p className="text-gray-600">
                    実際の業界で使われているツールとテクニックを使って、
                    リアルなプロジェクトに取り組みます。
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    専門家による指導
                  </h3>
                  <p className="text-gray-600">
                    業界のエキスパートから直接学び、
                    最新のベストプラクティスを身につけます。
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    キャリアサポート
                  </h3>
                  <p className="text-gray-600">
                    学習完了後も継続的なキャリアサポートで、
                    あなたの成長を支援します。
                  </p>
                </div>
              </div>
            </div>
            
            <div className="lg:pl-8">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-6 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-0 h-0 border-l-6 border-r-0 border-t-4 border-b-4 border-l-white border-t-transparent border-b-transparent ml-1"></div>
                    </div>
                    <p className="text-sm opacity-90">動画プレビュー</p>
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  学習の流れを見る
                </h4>
                <p className="text-gray-600 text-sm">
                  実際の学習プロセスをビデオで確認して、
                  どのように スキルを習得できるかを体験してください。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 人気コースセクション */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              人気のコース
            </h2>
            <p className="text-xl text-gray-600">
              多くの学習者に選ばれているコースをチェック
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500"></div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      プログラミング
                    </span>
                    <div className="ml-auto flex items-center text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">4.8</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    React開発マスターコース
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    モダンなReactアプリケーション開発のすべてを学習
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">¥12,800</span>
                    <Link
                      to="/courses"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
                    >
                      詳細を見る
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link
              to="/courses"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 inline-flex items-center"
            >
              すべてのコースを見る
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* 成功事例セクション */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              成功事例
            </h2>
            <p className="text-xl text-gray-600">
              実際の学習者の声をお聞きください
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "田中 太郎",
                role: "フロントエンド開発者",
                company: "Tech Company A",
                content: "このプラットフォームのおかげで、未経験からわずか6ヶ月でエンジニアとして転職できました。実践的なプロジェクトが特に役立ちました。"
              },
              {
                name: "佐藤 花子",
                role: "UIデザイナー",
                company: "Design Studio B",
                content: "デザインの基礎から応用まで体系的に学べました。現在は憧れのデザイナーとして活躍しています。"
              },
              {
                name: "山田 次郎",
                role: "プロダクトマネージャー",
                company: "Startup C",
                content: "ビジネススキルとテクニカルスキルの両方を学べるのが魅力。キャリアアップに直結する内容でした。"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
                <div className="flex text-yellow-400 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            今すぐ学習を始めましょう
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            あなたの可能性を解き放つ旅はここから始まります。
            数千人の成功者に続いて、新しいスキルを身につけませんか？
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              無料で始める
              <ArrowRight className="inline-block ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/courses"
              className="border-2 border-white hover:bg-white hover:text-blue-700 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300"
            >
              コースを見る
            </Link>
          </div>
          <p className="text-sm text-blue-200 mt-6">
            クレジットカード不要 • いつでもキャンセル可能
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;