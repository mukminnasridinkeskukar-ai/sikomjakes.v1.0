import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Layout
import Layout from './components/Layout'

// Pages
import Dashboard from './pages/Dashboard'
import FormasiJabfung from './pages/FormasiJabfung'
import BazzettingFormasi from './pages/BazzettingFormasi'
import FormulirPendaftaran from './pages/FormulirPendaftaran'
import DaftarPeserta from './pages/DaftarPeserta'
import AdminPanel from './pages/AdminPanel'
import Login from './pages/Login'

// Context
import { AuthProvider, useAuth } from './context/AuthContext'

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  
  return children
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="formasi-jabfung" element={<FormasiJabfung />} />
          <Route path="bazzetting" element={<BazzettingFormasi />} />
          <Route path="pendaftaran" element={<FormulirPendaftaran />} />
          <Route path="daftar-peserta" element={<DaftarPeserta />} />
          <Route path="admin" element={
            <ProtectedRoute adminOnly>
              <AdminPanel />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AuthProvider>
  )
}

export default App
