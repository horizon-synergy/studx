import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
const STEPS = [
  { icon: '🔍', title: 'Browse the marketplace', body: 'Explore listings from fellow students — textbooks, services, notes, tutoring and more.', action: { label: 'Browse now', to: '/' } },
  { icon: '💬', title: 'Message the seller', body: 'Found something you like? Tap "Message Seller" to chat directly before buying.', action: null },
  { icon: '🛒', title: 'Place your order', body: 'Add to cart or buy directly. Confirm receipt once delivered — both sides confirming completes the trade.', action: null },
  { icon: '📦', title: 'Sell your own stuff', body: 'Go to Dashboard → Add Listing. Add photos, a price, and tags so buyers can find you.', action: { label: 'Open Dashboard', to: '/dashboard' } },
]
export default function OnboardingGuide() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  useEffect(() => { if (!localStorage.getItem('studx_onboarded')) { const t = setTimeout(() => setOpen(true), 1200); return () => clearTimeout(t) } }, [])
  const dismiss = () => { localStorage.setItem('studx_onboarded', '1'); setOpen(false) }
  if (!open) return null
  const current = STEPS[step]; const isLast = step === STEPS.length - 1
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-2xl)', padding: '2rem 1.75rem 1.75rem', maxWidth: '22rem', width: '100%', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
        <button onClick={dismiss} style={{ position: 'absolute', top: '1rem', right: '1rem', width: '1.75rem', height: '1.75rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1.75rem' }}>{STEPS.map((_, i) => <div key={i} style={{ height: '2.5px', flex: 1, borderRadius: 999, background: i <= step ? 'var(--brand-blue)' : 'var(--border-color)' }} />)}</div>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{current.icon}</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.625rem' }}>{current.title}</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{current.body}</p>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Step {step + 1} of {STEPS.length}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {current.action && <Link to={current.action.to} onClick={dismiss} style={{ display: 'block', textAlign: 'center', padding: '0.65rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', color: 'var(--brand-blue)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none', border: '1px solid var(--border-color)' }}>{current.action.label} →</Link>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {step > 0 && <button onClick={() => setStep((s) => s - 1)} style={{ flex: 1, padding: '0.65rem', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.875rem' }}>← Back</button>}
            <button onClick={() => isLast ? dismiss() : setStep((s) => s + 1)} style={{ flex: 1, padding: '0.65rem', background: 'var(--brand-blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>{isLast ? "Let's go! 🎉" : 'Next →'}</button>
          </div>
          <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.25rem', textAlign: 'center' }}>Skip guide</button>
        </div>
      </div>
    </div>
  )
}
