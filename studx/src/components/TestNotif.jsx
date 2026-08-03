// Test notification trigger — DELETE THIS FILE after testing
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createNotification } from '../services/firebase'

export default function TestNotif() {
  const { currentUser } = useAuth()
  const [sent, setSent] = useState('')

  if (!currentUser) return null

  const fire = async (type) => {
    setSent('')
    try {
      if (type === 'message') {
        await createNotification(currentUser.uid, {
          type: 'new_message', title: 'New message from Test', body: 'Hey! This is a test message notification 👋', chatId: 'test', read: false,
        })
      } else if (type === 'review') {
        await createNotification(currentUser.uid, {
          type: 'new_review', title: 'New review received', body: 'Someone left a 5-star review on your listing', read: false,
        })
      } else if (type === 'comment') {
        await createNotification(currentUser.uid, {
          type: 'new_comment', title: 'New question', body: 'Someone asked: "Is this still available?"', read: false,
        })
      } else if (type === 'order') {
        await createNotification(currentUser.uid, {
          type: 'new_order', title: 'New order', body: 'Someone ordered your item "Textbook"', orderId: 'test', read: false,
        })
      }
      setSent(type)
    } catch (err) {
      console.error(err)
      setSent('error')
    }
  }

  return (
    <div style={{
      marginTop: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)',
      border: '2px dashed var(--warn-border)', background: 'var(--warn-bg)',
    }}>
      <p style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.5rem', color: 'var(--warn-text)' }}>
        🔔 Test Notifications — <span style={{ fontWeight: 400 }}>Delete TestNotif.jsx when done</span>
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {[
          { label: 'New Message', type: 'message' },
          { label: 'New Review',  type: 'review' },
          { label: 'New Comment', type: 'comment' },
          { label: 'New Order',   type: 'order' },
        ].map((b) => (
          <button
            key={b.type}
            onClick={() => fire(b.type)}
            style={{
              padding: '0.4rem 0.9rem', fontSize: '0.75rem', fontWeight: 600,
              fontFamily: 'var(--font-body)',
              background: sent === b.type ? 'var(--success-bg)' : 'var(--bg-card)',
              color: sent === b.type ? 'var(--success-text)' : 'var(--text-primary)',
              border: `1px solid ${sent === b.type ? 'var(--success-border)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
            }}
          >
            {sent === b.type ? '✓ Sent' : b.label}
          </button>
        ))}
      </div>
      {sent === 'error' && (
        <p style={{ fontSize: '0.72rem', color: 'var(--danger-text)', marginTop: '0.4rem' }}>Failed — check console</p>
      )}
    </div>
  )
}
