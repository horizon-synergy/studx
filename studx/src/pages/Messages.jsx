// src/pages/Messages.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate }                  from 'react-router-dom'
import { useAuth }                      from '../context/AuthContext'
import { subscribeToUserChats, getUserProfile, getProfile } from '../services/firebase'
import s from '../styles/Chat.module.css'

function fmtTime(ts) {
  if (!ts?.toDate) return ''
  const d = ts.toDate(), now = new Date()
  const diff = Math.floor((now - d) / 86400000)
  if (diff === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff === 1) return 'Yesterday'
  if (diff < 7)   return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

function expiryLabel(expiresAt) {
  if (!expiresAt?.toMillis) return null
  const ms = expiresAt.toMillis() - Date.now()
  const days = Math.ceil(ms / 86400000)
  if (days <= 0) return { text: 'Expired',           soon: true  }
  if (days <= 3) return { text: `Expires in ${days}d`, soon: true  }
  if (days <= 7) return { text: `Expires in ${days}d`, soon: false }
  return null
}

export default function Messages() {
  const { currentUser, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [chats,   setChats]   = useState([])
  const [loading, setLoading] = useState(true)
  const [names,   setNames]   = useState({})
  const unsubRef  = useRef(null)
  const retryRef  = useRef(null)

  useEffect(() => {
    if (authLoading || !currentUser) { if (!authLoading) setLoading(false); return }

    const start = () => {
      if (unsubRef.current) unsubRef.current()
      unsubRef.current = subscribeToUserChats(
        currentUser.uid,
        (incoming) => {
          setChats(incoming)
          setLoading(false)
          // Fetch display names for other participants
          const otherUids = [...new Set(
            incoming.flatMap((c) => c.participants.filter((u) => u !== currentUser.uid))
          )]
          otherUids.forEach(async (uid) => {
            if (names[uid]) return
            try {
              const [_, ext] = await Promise.all([getUserProfile(uid), getProfile(uid)])
              const name = ext?.displayName || 'User'
              setNames((p) => ({ ...p, [uid]: name }))
            } catch (_) {}
          })
        },
        (err) => {
          if (err?.code === 'permission-denied') {
            retryRef.current = setTimeout(start, 1500)
          } else {
            setLoading(false)
          }
        }
      )
    }

    retryRef.current = setTimeout(start, 300)
    return () => {
      clearTimeout(retryRef.current)
      if (unsubRef.current) unsubRef.current()
    }
  }, [currentUser?.uid, authLoading])

  const getOtherUid = (chat) => chat.participants.find((u) => u !== currentUser?.uid)

  if (authLoading || loading) return (
    <main className={s.inboxPage}>
      <div className={s.spinner} style={{ margin: '4rem auto' }} />
    </main>
  )

  return (
    <main className={s.inboxPage}>
      <h1 className={s.pageTitle}>Messages</h1>

      {chats.length === 0 ? (
        <div className={s.emptyInbox}>
          <span className={s.emptyIcon}>💬</span>
          <p className={s.emptyTitle}>No conversations yet</p>
          <p className={s.emptyDesc}>
            When you contact a seller (or a buyer messages you), it appears here.
          </p>
        </div>
      ) : (
        <div className={s.chatList}>
          {chats.map((chat) => {
            const otherUid  = getOtherUid(chat)
            const otherName = names[otherUid] || '…'
            const exp       = expiryLabel(chat.expiresAt)
            return (
              <div
                key={chat.id}
                className={s.chatItem}
                onClick={() => navigate(`/messages/${chat.id}`)}
                role="button" tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/messages/${chat.id}`)}
              >
                <div className={s.chatAvatar}>{otherName[0]?.toUpperCase()}</div>
                <div className={s.chatInfo}>
                  <p className={s.chatListingTitle}>{chat.listingTitle}</p>
                  <p className={s.chatName}>{otherName}</p>
                  <p className={s.chatPreview}>{chat.lastMessage || 'No messages yet'}</p>
                </div>
                <div className={s.chatMeta}>
                  <span className={s.chatTime}>{fmtTime(chat.lastMessageAt)}</span>
                  {exp && (
                    <span className={`${s.expiryPill} ${exp.soon ? s.expiryPillSoon : ''}`}>
                      {exp.text}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
