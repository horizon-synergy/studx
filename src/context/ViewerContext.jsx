import { createContext, useContext, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
const ViewerContext = createContext(null)
export function ViewerProvider({ children }) {
  const { userProfile } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const isViewer = userProfile?.role === 'viewer'
  const guardViewer = useCallback(() => { if (isViewer) { setModalOpen(true); return true } return false }, [isViewer])
  const closeModal = () => setModalOpen(false)
  return <ViewerContext.Provider value={{ isViewer, guardViewer, modalOpen, closeModal }}>{children}{modalOpen && <ViewerModal onClose={closeModal} />}</ViewerContext.Provider>
}
export function useViewer() { const ctx = useContext(ViewerContext); if (!ctx) throw new Error('useViewer must be used inside <ViewerProvider>'); return ctx }
function ViewerModal({ onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-2xl)', padding: '2rem 1.75rem', maxWidth: '22rem', width: '100%', boxShadow: 'var(--shadow-lg)', textAlign: 'center', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', width: '1.75rem', height: '1.75rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        <div style={{ width: '3.5rem', height: '3.5rem', background: 'var(--brand-blue-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.5rem' }}>🔒</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.625rem' }}>You're in Viewer Mode</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.5rem' }}>This is a read-only demo of StudX. You can browse listings and explore the platform, but buying, selling, and messaging require a full account.</p>
        <button onClick={onClose} style={{ width: '100%', background: 'var(--brand-blue)', color: '#fff', fontWeight: 600, fontSize: '0.875rem', padding: '0.75rem', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Got it</button>
      </div>
    </div>
  )
}
