import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Suspense, useEffect } from 'react'
import { initializePerformanceOptimizations, PerformanceLoadingFallback } from './utils/performanceOptimization'
import { HelmetProvider } from 'react-helmet-async'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import PublicProtectedRoute from './components/PublicProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute' // 追加
import EnvironmentGate from './components/EnvironmentGate'
import ScrollToTop from './components/ScrollToTop'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminWorks from './pages/admin/Works'
import AdminCelebrities from './pages/admin/Celebrities'
import AdminArticles from './pages/admin/Articles'
import AdminArticleImport from './pages/admin/ArticleImport'
import AdminWordPressMigration from './pages/admin/WordPressMigration'
import AdminEpisodes from './pages/admin/Episodes'
import AdminEpisodeDetail from './pages/admin/EpisodeDetail'
import AdminItems from './pages/admin/Items'
import AdminLocations from './pages/admin/Locations'
import AdminUserPosts from './pages/admin/UserPosts'
import AdminDataCollection from './pages/admin/DataCollection' // 追加
import AuthDebug from './pages/debug/AuthDebug' // デバッグ用

// Public Pages
import Home from './pages/public/HomeBalanced'
import Celebrities from './pages/public/CelebritiesSimple'
import Episodes from './pages/public/Episodes'
import Items from './pages/public/Items'
import Locations from './pages/public/Locations'
import Posts from './pages/public/Posts'
import PostDetail from './pages/public/PostDetail'
import ItemDetail from './pages/public/ItemDetail'
import LocationDetail from './pages/public/LocationDetail'
import CelebrityProfile from './pages/public/CelebrityProfile'
import EpisodeDetail from './pages/public/EpisodeDetail'
import Works from './pages/public/Works'
import WorkDetail from './pages/public/WorkDetail'
import ArticlesList from './pages/public/ArticlesList'
import ArticleDetailSimple from './pages/public/ArticleDetailSimple'
import ArticlesDebug from './pages/public/ArticlesDebug'
import ArticleDebugPage from './pages/public/ArticleDebugPage'
import TestYoutube from './pages/TestYoutube'
import DebugBzai from './pages/DebugBzai'
import YouTubeTest from './pages/public/YouTubeTest'
import Submit from './pages/public/Submit'
import Login from './pages/public/Login'
import Register from './pages/public/Register'


// Legal Pages
import { PrivacyPolicy } from './components/legal/PrivacyPolicy'
import { TermsOfService } from './components/legal/TermsOfService'  
import { Contact } from './components/legal/Contact'
import { About } from './components/legal/About'

function App() {
  useEffect(() => {
    // パフォーマンス最適化の初期化を一時的に無効化（無限ローディング対策）
    console.log('App initialized - performance optimization disabled')
    // initializePerformanceOptimizations()
  }, [])

  return (
    <HelmetProvider>
      <EnvironmentGate>
        <Router>
          <ScrollToTop />
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }>
          <Routes>
        {/* Admin Routes - ProtectedRouteをAdminProtectedRouteに変更 */}
        <Route path="/admin" element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/works" element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminWorks />
            </AdminLayout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/celebrities" element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminCelebrities />
            </AdminLayout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/articles" element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminArticles />
            </AdminLayout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/articles/import" element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminArticleImport />
            </AdminLayout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/articles/migrate" element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminWordPressMigration />
            </AdminLayout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/episodes" element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminEpisodes />
            </AdminLayout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/episodes/:id" element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminEpisodeDetail />
            </AdminLayout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/items" element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminItems />
            </AdminLayout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/locations" element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminLocations />
            </AdminLayout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/posts" element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminUserPosts />
            </AdminLayout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/data-collection" element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminDataCollection />
            </AdminLayout>
          </AdminProtectedRoute>
        } />
        
        {/* Public Routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/celebrities" element={<Layout><Celebrities /></Layout>} />
        <Route path="/episodes" element={<Layout><Episodes /></Layout>} />
        <Route path="/items" element={<Layout><Items /></Layout>} />
        <Route path="/locations" element={<Layout><Locations /></Layout>} />
        <Route path="/posts" element={<Layout><Posts /></Layout>} />
        <Route path="/works" element={<Layout><Works /></Layout>} />
        <Route path="/articles" element={<Layout><ArticlesList /></Layout>} />
        <Route path="/articles-debug" element={<Layout><ArticlesDebug /></Layout>} />
        <Route path="/articles-debug/:slug" element={<Layout><ArticleDebugPage /></Layout>} />
        <Route path="/youtube-test" element={<Layout><YouTubeTest /></Layout>} />
        
        {/* Detail Routes */}
        <Route path="/celebrities/:slug" element={<Layout><CelebrityProfile /></Layout>} />
        <Route path="/works/:slug" element={<Layout><WorkDetail /></Layout>} />
        <Route path="/episodes/:id" element={<Layout><EpisodeDetail /></Layout>} />
        <Route path="/items/:id" element={<Layout><ItemDetail /></Layout>} />
        <Route path="/locations/:id" element={<Layout><LocationDetail /></Layout>} />
        <Route path="/posts/:id" element={<Layout><PostDetail /></Layout>} />
        <Route path="/articles/:slug" element={
          <Layout>
            <div>
              {console.log('🔍 Article detail route matched:', window.location.pathname)}
              <ArticleDetailSimple />
            </div>
          </Layout>
        } />
        
        {/* Authentication Routes */}
        <Route path="/login" element={
          <PublicProtectedRoute>
            <Layout>
              <Login />
            </Layout>
          </PublicProtectedRoute>
        } />
        <Route path="/register" element={
          <PublicProtectedRoute>
            <Layout>
              <Register />
            </Layout>
          </PublicProtectedRoute>
        } />
        
        {/* Submission Route */}
        <Route path="/submit" element={<Layout><Submit /></Layout>} />
        
        {/* Legal Pages */}
        <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
        <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />

        {/* デバッグ用ルート */}
        <Route path="/debug/auth" element={<AuthDebug />} />
        <Route path="/test/youtube" element={<TestYoutube />} />
        <Route path="/debug/bzai" element={<DebugBzai />} />
        
        {/* 404 */}
        <Route path="*" element={<Layout><div className="text-center py-12"><h2 className="text-2xl font-bold text-gray-900 mb-4">ページが見つかりません</h2><p className="text-gray-600">お探しのページは存在しないか、移動した可能性があります。</p></div></Layout>} />
          </Routes>
        </Suspense>
        </Router>
      </EnvironmentGate>
    </HelmetProvider>
  )
}

export default App