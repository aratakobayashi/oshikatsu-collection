import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Suspense, useEffect } from 'react'
import { initializePerformanceOptimizations, PerformanceLoadingFallback } from './utils/performanceOptimization'
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
import AdminEpisodes from './pages/admin/Episodes'
import AdminEpisodeDetail from './pages/admin/EpisodeDetail'
import AdminItems from './pages/admin/Items'
import AdminLocations from './pages/admin/Locations'
import AdminUserPosts from './pages/admin/UserPosts'
import AdminDataCollection from './pages/admin/DataCollection' // 追加
import AuthDebug from './pages/debug/AuthDebug' // デバッグ用

// Public Pages
import Home from './pages/public/Home'
import Celebrities from './pages/public/Celebrities'
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
    // パフォーマンス最適化の初期化
    initializePerformanceOptimizations()
  }, [])

  return (
    <EnvironmentGate>
      <Router future={{ v7_startTransition: true }}>
        <ScrollToTop />
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
        
        {/* Detail Routes */}
        <Route path="/celebrities/:slug" element={<Layout><CelebrityProfile /></Layout>} />
        <Route path="/episodes/:id" element={<Layout><EpisodeDetail /></Layout>} />
        <Route path="/posts/:id" element={<Layout><PostDetail /></Layout>} />
        <Route path="/items/:id" element={<Layout><ItemDetail /></Layout>} />
        <Route path="/locations/:id" element={<Layout><LocationDetail /></Layout>} />
        <Route path="/works/:slug" element={<Layout><WorkDetail /></Layout>} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/submit" element={
          <Layout>
            <PublicProtectedRoute>
              <Submit />
            </PublicProtectedRoute>
          </Layout>
        } />
        
        {/* Debug Routes */}
        <Route path="/debug/auth" element={<Layout><AuthDebug /></Layout>} />
        
        {/* Legal Routes */}
        <Route path="/privacy-policy" element={<Layout><PrivacyPolicy /></Layout>} />
        <Route path="/terms-of-service" element={<Layout><TermsOfService /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        
        </Routes>
      </Router>
    </EnvironmentGate>
  )
}

export default App