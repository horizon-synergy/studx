// src/context/NotificationContext.jsx
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from './AuthContext'
import {
  subscribeToNotifications,
  subscribeToUnreadChats,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/firebase'

const NotificationContext = createContext(null)

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const g = ctx.createGain()
    g.connect(ctx.destination)
    g.gain.setValueAtTime(0.12, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(880, ctx.currentTime)
    o.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
    o.connect(g)
    o.start(ctx.currentTime)
    o.stop(ctx.currentTime + 0.5)
  } catch (_) {}
}

export function NotificationProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth()
  const [notifications, setNotifications]     = useState([])
  const [unreadChats,   setUnreadChats]        = useState(0)
  const prevNotifCount  = useRef(0)
  const unsubNotifRef   = useRef(null)
  const unsubChatRef    = useRef(null)
  const retryRef        = useRef(null)

  useEffect(() => {
    if (authLoading) return
    if (!currentUser) {
      setNotifications([])
      setUnreadChats(0)
      return
    }

    const start = () => {
      if (unsubNotifRef.current) unsubNotifRef.current()
      if (unsubChatRef.current)  unsubChatRef.current()

      unsubNotifRef.current = subscribeToNotifications(
        currentUser.uid,
        (incoming) => {
          setNotifications(incoming)
        },
      )
      unsubChatRef.current = subscribeToUnreadChats(
        currentUser.uid,
        setUnreadChats,
      )
    }

    retryRef.current = setTimeout(start, 400)

    return () => {
      clearTimeout(retryRef.current)
      if (unsubNotifRef.current) unsubNotifRef.current()
      if (unsubChatRef.current)  unsubChatRef.current()
    }
  }, [currentUser?.uid, authLoading])

  useEffect(() => {
    const unread = notifications.length
    if (unread > prevNotifCount.current && prevNotifCount.current > 0) {
      playChime()
    }
    prevNotifCount.current = unread
  }, [notifications])

  const markRead = useCallback((id) => {
    markNotificationRead(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const markAllRead = useCallback(() => {
    if (currentUser) markAllNotificationsRead(currentUser.uid)
    setNotifications([])
  }, [currentUser])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadNotifs: notifications.length,
      unreadChats,
      totalUnread:  notifications.length + unreadChats,
      markRead,
      markAllRead,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within <NotificationProvider>')
  return ctx
}
