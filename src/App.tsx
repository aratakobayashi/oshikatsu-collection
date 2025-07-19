import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import PublicProtectedRoute from './components/PublicProtectedRoute'
import ProtectedRoute from './components/ProtectedRoute'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminWorks from './pages/admin/Works'
import AdminCelebrities from './pages/admin/Celebrities'
import AdminEpisodes from './pages/admin/Episodes'
import AdminItems from './pages/admin/Items'
import AdminLocations from './pages/admin/Locations'
import AdminUserPosts from './pages/admin/UserPosts'

// Public Pages
import Home from './pages/public/Home'
import Celebrities from './pages/public/Celebrities'
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

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/works" element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminWorks />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/celebrities" element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminCelebrities />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/episodes" element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminEpisodes />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/items" element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminItems />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/locations" element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminLocations />
            </AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/posts" element={
          <ProtectedRoute>
            <AdminLayout>
              <AdminUserPosts />
            </AdminLayout>
          </ProtectedRoute>
        } />
        
        {/* Public Routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/celebrities" element={<Layout><Celebrities /></Layout>} />
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
      </Routes>
    </Router>
  )
}

export default App