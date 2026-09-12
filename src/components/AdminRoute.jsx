import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function AdminRoute({ children }) {
  const { currentUser, isAdmin, loading } = useAuth()
  if (loading) return null
  if (!currentUser || !isAdmin) return <Navigate to="/" replace />
  return children
}
