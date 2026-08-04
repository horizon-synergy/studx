// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import {
  subscribeToAuthChanges,
  getUserProfile, getProfile,
  loginUser,
  registerUser,
  logoutUser,
  signInWithGoogle,
} from '../services/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser,  setCurrentUser]  = useState(null)
  const [userProfile,  setUserProfile]  = useState(null)
  const [extProfile,   setExtProfile]   = useState(null)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setCurrentUser(user)
      if (user) {
        try {
          const [profile, ext] = await Promise.all([
            getUserProfile(user.uid),
            getProfile(user.uid),
          ])
          setUserProfile(profile)
          setExtProfile(ext)
        } catch (err) {
          console.error('Failed to fetch user profile:', err)
          setUserProfile(null)
          setExtProfile(null)
        }
      } else {
        setUserProfile(null)
        setExtProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userProfile,
    extProfile,
    isAdmin:         userProfile?.role === 'admin',
    loading,
    login:           (email, password) => loginUser(email, password),
    register:        (email, password) => registerUser(email, password),
    logout:          ()                => logoutUser(),
    loginWithGoogle: ()                => signInWithGoogle(),
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
