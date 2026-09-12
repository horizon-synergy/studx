import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db, doc, getDoc, subscribeToMessages, sendMessage, deleteChat } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { useViewer } from '../context/ViewerContext'
import s from '../styles/ChatRoom.module.css'

function formatTime(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatRoom() {
  const { chatId } = useParams()
  const { currentUser } = useAuth()
  const { guardViewer } = useViewer()
  const navigate = useNavigate()
  const bottomRef = useRef(null)

  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let unsub = () => {}
    let alive = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const snap = await getDoc(doc(db, 'chats', chatId))
        if (!alive) return
        if (!snap.exists()) {
          setError('Chat not found or expired')
          setLoading(false)
          return
        }
        const data = { id: snap.id, ...snap.data() }
        if (!data.participants?.includes(currentUser.uid)) {
          setError('You are not a participant in this chat')
          setLoading(false)
          return
        }
        setChat(data)
        unsub = subscribeToMessages(chatId, (msgs) => {
          setMessages(msgs)
          setLoading(false)
        })
      } catch (err) {
        console.error(err)
        if (alive) {
          setError('Failed to load chat')
          setLoading(false)
        }
      }
    })()
    return () => { alive = false; unsub() }
  }, [chatId, currentUser?.uid])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (guardViewer()) return
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText('')
    try {
      await sendMessage(chatId, currentUser.uid, trimmed)
    } catch (err) {
      console.error(err)
      setText(trimmed)
      alert('Message failed to send')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async () => {
    if (guardViewer()) return
    if (!confirm('Delete this conversation?')) return
    await deleteChat(chatId)
    navigate('/messages')
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <Link to="/messages" className={s.back}>←</Link>
        <div className={s.headerInfo}>
          <div className={s.headerTitle}>{chat?.listingTitle || 'Chat'}</div>
          <div className={s.headerMeta}>{chat?.isAdminChat ? 'Admin chat' : 'Listing chat'}</div>
        </div>
        <button type="button" className={s.deleteBtn} onClick={handleDelete}>Delete</button>
      </header>

      {error && <div className={s.error}>{error}</div>}

      {loading ? (
        <div className={s.loading}><div className={s.spinner} /></div>
      ) : (
        <div className={s.messages}>
          {messages.length === 0 && !error && <div className={s.empty}>Say hello — start the conversation.</div>}
          {messages.map((m) => (
            <div key={m.id} className={`${s.bubble} ${m.senderId === currentUser.uid ? s.mine : s.theirs}`}>
              {m.text}
              <span className={s.time}>{formatTime(m.createdAt)}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {!error && (
        <form className={s.composer} onSubmit={handleSend}>
          <input
            className={s.input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            maxLength={2000}
            disabled={loading}
          />
          <button className={s.send} type="submit" disabled={sending || !text.trim()} aria-label="Send">→</button>
        </form>
      )}
    </div>
  )
}
