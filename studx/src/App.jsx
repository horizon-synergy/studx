// src/App.jsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar         from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute     from './components/AdminRoute'

const Home          = lazy(() => import('./pages/Home'))
const ListingDetail = lazy(() => import('./pages/ListingDetail'))
const Login         = lazy(() => import('./pages/Login'))
const Register      = lazy(() => import('./pages/Register'))
const Dashboard     = lazy(() => import('./pages/Dashboard'))
const Admin         = lazy(() => import('./pages/Admin'))
const Checkout      = lazy(() => import('./pages/Checkout'))
const Wishlist      = lazy(() => import('./pages/Wishlist'))
const Profile       = lazy(() => import('./pages/Profile'))
const Messages      = lazy(() => import('./pages/Messages'))
const ChatRoom      = lazy(() => import('./pages/ChatRoom'))

function PageSpinner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 'calc(100vh - 3.5rem)',
    }}>
      <div style={{
        width: '1.5rem', height: '1.5rem',
        border: '2px solid var(--brand-blue)',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Navbar />
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          {/* Public */}
          <Route path="/"              element={<Home />} />
          <Route path="/listing/:id"   element={<ListingDetail />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/register"      element={<Register />} />
          <Route path="/profile/:uid"  element={<Profile />} />

          {/* Protected — logged-in users */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/checkout"  element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/wishlist"  element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/messages"      element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages/:chatId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />

          {/* Admin only */}
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: '6rem 1rem' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '5rem', fontWeight: 800, color: 'var(--border-color)', letterSpacing: '-0.05em' }}>404</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>This page doesn't exist.</p>
            </div>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
