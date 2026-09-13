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
      <div style={{ background: 'var(--neu-bg, #f5f4f0)', borderRadius: 'var(--neu-radius, 16px)', padding: '2rem 1.75rem 1.75rem', maxWidth: '22rem', width: '100%', boxShadow: '5px 5px 10px var(--neu-dark, #d6d2c8), -5px -5px 10px var(--neu-light, #fff)', position: 'relative' }}>
        <button onClick={dismiss} style={{ position: 'absolute', top: '1rem', right: '1rem', width: '1.75rem', height: '1.75rem', background: 'var(--neu-bg, #f5f4f0)', border: 'none', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)', boxShadow: '2px 2px 5px var(--neu-dark, #d6d2c8), -2px -2px 5px var(--neu-light, #fff)' }}>✕</button>
        <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1.75rem' }}>{STEPS.map((_, i) => <div key={i} style={{ height: '3px', flex: 1, borderRadius: 999, background: i <= step ? 'var(--brand-blue)' : 'var(--border-color)' }} />)}</div>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{current.icon}</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.625rem' }}>{current.title}</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{current.body}</p>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Step {step + 1} of {STEPS.length}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {current.action && <Link to={current.action.to} onClick={dismiss} style={{ display: 'block', textAlign: 'center', padding: '0.65rem', borderRadius: 'var(--brut-radius-sm, 6px)', background: '#fff', color: 'var(--brand-blue)', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', border: '2px solid var(--brut-border-color, #141310)', boxShadow: '2px 2px 0 var(--brut-border-color, #141310)' }}>{current.action.label} →</Link>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {step > 0 && <button onClick={() => setStep((s) => s - 1)} style={{ flex: 1, padding: '0.65rem', border: '2px solid var(--brut-border-color, #141310)', background: '#fff', color: 'var(--text-muted)', borderRadius: 'var(--brut-radius-sm, 6px)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 }}>← Back</button>}
            <button onClick={() => isLast ? dismiss() : setStep((s) => s + 1)} style={{ flex: 1, padding: '0.65rem', background: 'var(--brand-blue)', color: '#fff', border: '2px solid var(--brut-border-color, #141310)', borderRadius: 'var(--brut-radius-sm, 6px)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 800, boxShadow: '3px 3px 0 var(--brut-border-color, #141310)' }}>{isLast ? "Let's go! 🎉" : 'Next →'}</button>
          </div>
          <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.25rem', textAlign: 'center' }}>Skip guide</button>
        </div>
      </div>
    </div>
  )
}
