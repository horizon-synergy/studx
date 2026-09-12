import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { subscribeToUserChats } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import s from '../styles/Messages.module.css'

function formatTime(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function Messages() {
  const { currentUser } = useAuth()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) return
    setLoading(true)
    const unsub = subscribeToUserChats(
      currentUser.uid,
      (data) => { setChats(data); setLoading(false) },
      (err) => { console.error(err); setError('Could not load chats. Check your connection.'); setLoading(false) }
    )
    return unsub
  }, [currentUser?.uid])

  return (
    <div className={s.page}>
      <h1 className={s.title}>Messages</h1>
      <p className={s.sub}>Conversations with buyers and sellers</p>
      {error && <div className={s.error}>{error}</div>}
      {loading ? (
        <div className={s.loading}><div className={s.spinner} /></div>
      ) : chats.length === 0 ? (
        <div className={s.empty}>No conversations yet. Message a seller from a listing.</div>
      ) : (
        <div className={s.list}>
          {chats.map((c) => {
            const unread = c.lastMessage && c.lastSenderId && c.lastSenderId !== currentUser.uid
            return (
              <Link key={c.id} to={`/messages/${c.id}`} className={`${s.chat} ${unread ? s.unread : ''}`}>
                <div className={s.avatar}>{c.isAdminChat ? 'A' : '◈'}</div>
                <div className={s.body}>
                  <div className={s.chatTitle}>
                    {c.listingTitle || 'Chat'}
                    {unread && <span className={s.dot} />}
                  </div>
                  <div className={s.preview}>{c.lastMessage || 'No messages yet'}</div>
                </div>
                <div className={s.meta}>{formatTime(c.lastMessageAt)}</div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
