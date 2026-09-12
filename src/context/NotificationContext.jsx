import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useAuth } from './AuthContext'
import { subscribeToNotifications, subscribeToUnreadChats, markNotificationRead, markAllNotificationsRead } from '../services/firebase'
const NotificationContext = createContext(null)
export function NotificationProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadChats, setUnreadChats] = useState(0)
  const unsubNotifRef = useRef(null); const unsubChatRef = useRef(null); const retryRef = useRef(null)
  useEffect(() => {
    if (authLoading) return
    if (!currentUser) { setNotifications([]); setUnreadChats(0); return }
    const start = () => {
      if (unsubNotifRef.current) unsubNotifRef.current()
      if (unsubChatRef.current) unsubChatRef.current()
      unsubNotifRef.current = subscribeToNotifications(currentUser.uid, setNotifications)
      unsubChatRef.current = subscribeToUnreadChats(currentUser.uid, setUnreadChats)
    }
    retryRef.current = setTimeout(start, 400)
    return () => { clearTimeout(retryRef.current); if (unsubNotifRef.current) unsubNotifRef.current(); if (unsubChatRef.current) unsubChatRef.current() }
  }, [currentUser?.uid, authLoading])
  const markRead = (id) => { markNotificationRead(id); setNotifications((prev) => prev.filter((n) => n.id !== id)) }
  const markAllRead = () => { if (currentUser) markAllNotificationsRead(currentUser.uid); setNotifications([]) }
  return <NotificationContext.Provider value={{ notifications, unreadNotifs: notifications.length, unreadChats, totalUnread: notifications.length + unreadChats, markRead, markAllRead }}>{children}</NotificationContext.Provider>
}
export function useNotifications() { const ctx = useContext(NotificationContext); if (!ctx) throw new Error('useNotifications must be used within <NotificationProvider>'); return ctx }
