import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PublicProtectedRoute from './components/PublicProtectedRoute'

// Admin Pages
import AdminWorks from './pages/admin/Works'

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
      <Layout>
        <Routes>
          {/* メイン画面 */}
          <Route path="/" element={<Home />} />
          <Route path="/celebrities" element={<Celebrities />} />
          <Route path="/items" element={<Items />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/works" element={<Works />} />
          
          {/* 詳細画面 */}
          <Route path="/celebrities/:slug" element={<CelebrityProfile />} />
          <Route path="/episodes/:id" element={<EpisodeDetail />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/locations/:id" element={<LocationDetail />} />
          <Route path="/works/:slug" element={<WorkDetail />} />
          
          {/* Admin Routes */}
          <Route path="/admin/works" element={<AdminWorks />} />
          
          {/* 認証・投稿 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/submit" element={<PublicProtectedRoute><Submit /></PublicProtectedRoute>} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App