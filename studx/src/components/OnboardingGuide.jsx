// src/components/OnboardingGuide.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, MessageSquare, ShoppingCart, Package, X, ArrowLeft, ArrowRight, PartyPopper } from 'lucide-react'

const STEPS = [
  {
    icon: Search,
    title: 'Browse the marketplace',
    body: 'Explore listings from fellow students — textbooks, services, notes, tutoring and more. Filter by category or search by tag to find exactly what you need.',
    action: { label: 'Browse now', to: '/' },
  },
  {
    icon: MessageSquare,
    title: 'Message the seller',
    body: "Found something you like? Click the listing and tap \"Message Seller\" to chat directly. Ask questions, negotiate, and agree on the details before buying.",
    action: null,
  },
  {
    icon: ShoppingCart,
    title: 'Place your order',
    body: 'Add to cart or buy directly. Once the seller delivers, confirm receipt in your Orders tab. Both sides confirming marks the trade as complete.',
    action: null,
  },
  {
    icon: Package,
    title: 'Sell your own stuff',
    body: 'Have old textbooks, notes, or a skill to offer? Go to Dashboard → Add Listing. Add photos, a price, and tags so buyers can find you easily.',
    action: { label: 'Open Dashboard', to: '/dashboard' },
  },
]

export default function OnboardingGuide() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem('studx_onboarded')) {
      const t = setTimeout(() => setOpen(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem('studx_onboarded', '1')
    setOpen(false)
  }

  if (!open) return null

  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeInFast 0.2s var(--ease)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-2xl)',
        padding: '2rem 1.75rem 1.75rem',
        maxWidth: '22rem', width: '100%',
        boxShadow: 'var(--shadow-lg)',
        animation: 'slideUp 0.25s var(--ease)',
        position: 'relative',
      }}>
        {/* Close */}
        <button
          onClick={dismiss}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            width: '1.75rem', height: '1.75rem',
            background: 'var(--bg-subtle)', border: '1px solid var(--border-color)',
            borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.68rem', transition: 'all var(--transition)',
          }}
          ><X size={12} /></button>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1.75rem' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: '2.5px', flex: 1, borderRadius: 999,
              background: i <= step ? 'var(--brand-blue)' : 'var(--border-color)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ color: 'var(--brand-blue)', marginBottom: '1rem', lineHeight: 1 }}>
            <current.icon size={40} strokeWidth={1.5} />
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.1rem', fontWeight: 700,
            color: 'var(--text-primary)', letterSpacing: '-0.03em',
            marginBottom: '0.625rem',
          }}>
            {current.title}
          </h2>
          <p style={{
            fontSize: '0.875rem', color: 'var(--text-secondary)',
            lineHeight: 1.65,
          }}>
            {current.body}
          </p>
        </div>

        {/* Step label */}
        <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Step {step + 1} of {STEPS.length}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {current.action && (
            <Link
              to={current.action.to}
              onClick={dismiss}
              style={{
                display: 'block', textAlign: 'center',
                padding: '0.65rem', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                color: 'var(--brand-blue)', fontWeight: 600,
                fontSize: '0.875rem', textDecoration: 'none',
                border: '1px solid var(--border-color)',
                transition: 'background var(--transition)',
              }}
            >
              {current.action.label} <ArrowRight size={12} />
            </Link>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                style={{
                  flex: 1, padding: '0.65rem',
                  border: '1px solid var(--border-color)',
                  background: 'transparent', color: 'var(--text-muted)',
                  borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                  transition: 'all var(--transition)',
                }}
              >
                <ArrowLeft size={12} /> Back
              </button>
            )}
            <button
              onClick={() => isLast ? dismiss() : setStep((s) => s + 1)}
              style={{
                flex: 1, padding: '0.65rem',
                background: isLast ? 'var(--brand-blue)' : 'var(--brand-blue)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                fontWeight: 600, transition: 'background var(--transition)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--brand-blue-dark)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--brand-blue)'}
            >
              {isLast ? <>Let's go! <PartyPopper size={14} /></> : <>Next <ArrowRight size={12} /></>}
            </button>
          </div>

          <button
            onClick={dismiss}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.72rem', color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)', padding: '0.25rem',
              textAlign: 'center',
            }}
          >
            Skip guide
          </button>
        </div>
      </div>
    </div>
  )
}
