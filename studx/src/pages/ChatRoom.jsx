// src/pages/ChatRoom.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link }   from 'react-router-dom'
import { useAuth }           from '../context/AuthContext'
import {
  subscribeToMessages, sendMessage,
  getDoc, doc, db,
  getUserProfile, getProfile,
} from '../services/firebase'
import s from '../styles/Chat.module.css'

function fmtTime(ts) {
  if (!ts?.toDate) return ''
  return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function fmtDay(ts) {
  if (!ts?.toDate) return ''
  const d = ts.toDate(), now = new Date()
  const diff = Math.floor((now - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })
}

function expiryLabel(expiresAt) {
  if (!expiresAt?.toMillis) return null
  const ms = expiresAt.toMillis() - Date.now()
  const days = Math.ceil(ms / 86400000)
  if (days <= 0) return 'This chat has expired'
  if (days === 1) return 'Expires tomorrow'
  if (days <= 7)  return `Expires in ${days} days`
  return null
}

export default function ChatRoom() {
  const { chatId }      = useParams()
  const { currentUser } = useAuth()

  const [chat,      setChat]      = useState(null)
  const [messages,  setMessages]  = useState([])
  const [otherName, setOtherName] = useState('…')
  const [loading,   setLoading]   = useState(true)
  const [text,      setText]      = useState('')
  const [sending,   setSending]   = useState(false)

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    if (!chatId || !currentUser) return
    const load = async () => {
      const snap = await getDoc(doc(db, 'chats', chatId))
      if (!snap.exists()) return
      const data = { id: snap.id, ...snap.data() }
      setChat(data)
      const otherUid = data.participants.find((u) => u !== currentUser.uid)
      if (otherUid) {
        const [auth, ext] = await Promise.all([getUserProfile(otherUid), getProfile(otherUid)])
        setOtherName(ext?.displayName || auth?.email?.split('@')[0] || 'User')
      }
      setLoading(false)
    }
    load()
  }, [chatId, currentUser?.uid])

  useEffect(() => {
    if (!chatId) return
    return subscribeToMessages(chatId, setMessages)
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!text.trim() || sending) return
    const payload = text
    setText('')
    setSending(true)
    try {
      await sendMessage(chatId, currentUser.uid, payload)
    } catch (err) {
      console.error(err)
      setText(payload)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }, [text, sending, chatId, currentUser?.uid])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // Group messages by day
  const grouped = []
  let lastDay = null
  messages.forEach((msg) => {
    const day = fmtDay(msg.createdAt)
    if (day !== lastDay) {
      grouped.push({ type: 'divider', label: day, key: `d-${msg.id}` })
      lastDay = day
    }
    grouped.push({ type: 'message', ...msg })
  })

  const isExpired = chat?.expiresAt?.toMillis?.() < Date.now()
  const expLabel  = chat ? expiryLabel(chat.expiresAt) : null

  if (loading) return (
    <div className={s.chatPage}>
      <div className={s.chatLoading}><div className={s.spinner} /></div>
    </div>
  )

  if (!chat) return (
    <div className={s.chatPage}>
      <div className={s.chatLoading}>
        <p style={{ color: 'var(--text-muted)' }}>Chat not found.</p>
      </div>
    </div>
  )

  return (
    <div className={s.chatPage}>
      <div className={s.chatHeader}>
        <Link to="/messages" className={s.chatHeaderBack}>←</Link>
        <div className={s.chatHeaderAvatar}>{otherName[0]?.toUpperCase()}</div>
        <div className={s.chatHeaderInfo}>
          <p className={s.chatHeaderName}>{otherName}</p>
          <p className={s.chatHeaderSub}>
            {chat.listingId ? (
              <>
                Re: {chat.listingTitle || 'Listing'} ·{' '}
                <Link to={`/listing/${chat.listingId}`} style={{ color: 'var(--brand-blue)', textDecoration: 'none', fontSize: '0.65rem' }}>
                  View →
                </Link>
              </>
            ) : chat.listingTitle || 'Direct message'}
          </p>
        </div>
        {expLabel && <span className={s.chatHeaderExpiry}>{expLabel}</span>}
      </div>

      <div className={s.messageList}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👋</p>
            <p style={{ fontSize: '0.875rem' }}>Say hello to {otherName}!</p>
          </div>
        )}

        {grouped.map((item) => {
          if (item.type === 'divider') return (
            <div key={item.key} className={s.dateDivider}>
              <div className={s.dateDividerLine} />
              <span className={s.dateDividerText}>{item.label}</span>
              <div className={s.dateDividerLine} />
            </div>
          )
          const isOwn = item.senderId === currentUser.uid
          return (
            <div
              key={item.id}
              className={`${s.messageBubble} ${isOwn ? s.messageBubbleOwn : s.messageBubbleOther}`}
            >
              {item.text}
              <span className={s.messageTime}>{fmtTime(item.createdAt)}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {isExpired ? (
        <div className={s.expiredBanner}>🕐 This chat has expired.</div>
      ) : (
        <div className={s.inputArea}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${otherName}…`}
            className={s.messageInput}
            rows={1}
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className={s.sendBtn}
            aria-label="Send"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
