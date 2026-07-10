// src/components/CouponsTab.jsx
import { useState, useEffect } from 'react'
import {
  createCoupon, getCouponsBySeller,
  toggleCoupon, deleteCoupon,
} from '../services/firebase'
import s from '../styles/Dashboard.module.css'

export default function CouponsTab({ uid }) {
  const [coupons,  setCoupons]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [acting,   setActing]   = useState(null)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  // Form state
  const [code,     setCode]     = useState('')
  const [discount, setDiscount] = useState('')
  const [type,     setType]     = useState('percent')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    getCouponsBySeller(uid)
      .then(setCoupons).catch(console.error)
      .finally(() => setLoading(false))
  }, [uid])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    const cleanCode = code.trim().toUpperCase().replace(/\s/g, '')
    if (!cleanCode)          return setError('Coupon code is required.')
    if (cleanCode.length < 3) return setError('Code must be at least 3 characters.')
    if (coupons.some((c) => c.code === cleanCode)) return setError('That code already exists.')
    const discVal = parseFloat(discount)
    if (isNaN(discVal) || discVal <= 0) return setError('Discount must be a positive number.')
    if (type === 'percent' && discVal > 100) return setError('Percentage cannot exceed 100.')

    setCreating(true)
    try {
      const ref = await createCoupon({ sellerId: uid, code: cleanCode, discount: discVal, type })
      const newCoupon = { id: ref.id, sellerId: uid, code: cleanCode, discount: discVal, type, active: true, usageCount: 0 }
      setCoupons((prev) => [newCoupon, ...prev])
      setCode(''); setDiscount('')
      setSuccess(`Coupon "${cleanCode}" created!`)
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) { setError('Failed to create coupon.') }
    finally { setCreating(false) }
  }

  const handleToggle = async (id, active) => {
    setActing(id)
    try {
      await toggleCoupon(id, !active)
      setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, active: !active } : c))
    } catch (err) { console.error(err) }
    finally { setActing(null) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return
    setActing(id)
    try {
      await deleteCoupon(id)
      setCoupons((prev) => prev.filter((c) => c.id !== id))
    } catch (err) { console.error(err) }
    finally { setActing(null) }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <div style={{ width: '1.5rem', height: '1.5rem', border: '2px solid var(--brand-blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Create coupon form */}
      <div className={s.card}>
        <h2 className={s.cardTitle}>Create Coupon</h2>
        {error   && <div className={s.errorBanner}>{error}</div>}
        {success && <div className={s.successBanner}>{success}</div>}
        <form onSubmit={handleCreate} className={s.form}>
          <div className={s.field}>
            <label className={s.label}>Coupon Code <span className={s.req}>*</span></label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
              placeholder="e.g. SAVE20"
              maxLength={20}
              className={s.input}
              style={{ fontFamily: 'monospace', letterSpacing: '0.08em' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={s.field}>
              <label className={s.label}>Discount Type</label>
              <div className={s.catRow}>
                {[{ value: 'percent', label: '% Percent' }, { value: 'fixed', label: 'R Fixed' }].map((t) => (
                  <button key={t.value} type="button"
                    onClick={() => setType(t.value)}
                    className={`${s.catBtn} ${type === t.value ? s.catBtnActive : ''}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={s.field}>
              <label className={s.label}>Amount <span className={s.req}>*</span></label>
              <div className={s.prefixWrap}>
                <span className={s.prefix}>{type === 'percent' ? '%' : 'R'}</span>
                <input
                  type="number" min="0.01" step="0.01"
                  value={discount} onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className={`${s.input} ${s.inputPrefixed}`}
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={creating} className={s.submitBtn}>
            {creating ? 'Creating…' : 'Create Coupon'}
          </button>
        </form>
      </div>

      {/* Coupons list */}
      <div className={s.card}>
        <h2 className={s.cardTitle}>My Coupons ({coupons.length})</h2>
        {coupons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏷</div>
            <p>No coupons yet. Create one above.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {coupons.map((coupon) => (
              <div key={coupon.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '0.875rem 1rem',
                background: 'var(--bg-subtle)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)', flexWrap: 'wrap',
                opacity: coupon.active ? 1 : 0.6,
              }}>
                <span style={{
                  fontFamily: 'monospace', fontWeight: 700, fontSize: '0.925rem',
                  color: coupon.active ? 'var(--brand-blue)' : 'var(--text-muted)',
                  letterSpacing: '0.06em', flex: '0 0 auto',
                }}>
                  {coupon.code}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>
                  {coupon.type === 'percent' ? `${coupon.discount}% off` : `R${coupon.discount} off`}
                  {' · '}{coupon.usageCount || 0} use{coupon.usageCount !== 1 ? 's' : ''}
                </span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem',
                  borderRadius: 999,
                  background: coupon.active ? 'var(--success-bg)' : 'var(--bg-subtle)',
                  color: coupon.active ? 'var(--success-text)' : 'var(--text-muted)',
                  border: `1px solid ${coupon.active ? 'var(--success-border)' : 'var(--border-color)'}`,
                }}>
                  {coupon.active ? 'Active' : 'Inactive'}
                </span>
                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                  <button
                    onClick={() => handleToggle(coupon.id, coupon.active)}
                    disabled={acting === coupon.id}
                    style={{
                      padding: '0.3rem 0.75rem', fontSize: '0.7rem', fontWeight: 600,
                      fontFamily: 'var(--font-body)',
                      background: 'var(--bg-card)', color: 'var(--text-secondary)',
                      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', transition: 'all var(--transition)',
                    }}
                  >
                    {acting === coupon.id ? '…' : coupon.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    disabled={acting === coupon.id}
                    style={{
                      padding: '0.3rem 0.75rem', fontSize: '0.7rem', fontWeight: 600,
                      fontFamily: 'var(--font-body)',
                      background: 'var(--danger-bg)', color: 'var(--danger-text)',
                      border: 'none', borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', transition: 'all var(--transition)',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
