import { createContext, useContext, useEffect, useState } from 'react'
import { subscribeToAuthChanges, getUserProfile, loginUser, registerUser, logoutUser, signInWithGoogle } from '../services/firebase'
const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setCurrentUser(user)
      if (user) { try { setUserProfile(await getUserProfile(user.uid)) } catch (err) { console.error(err); setUserProfile(null) } }
      else { setUserProfile(null) }
      setLoading(false)
    })
    return unsubscribe
  }, [])
  const value = {
    currentUser,
    userProfile,
    isAdmin: userProfile?.role === 'admin',
    isVendor: userProfile?.role === 'vendor',
    loading,
    login: (email, password) => loginUser(email, password),
    register: (email, password) => registerUser(email, password),
    logout: () => logoutUser(),
    loginWithGoogle: () => signInWithGoogle(),
  }
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error('useAuth must be used within <AuthProvider>'); return ctx }
