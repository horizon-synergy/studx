import { useEffect, useState } from 'react'
import { createCoupon, getCouponsBySeller, toggleCoupon, deleteCoupon } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { useViewer } from '../context/ViewerContext'
import s from '../styles/CouponsTab.module.css'

export default function CouponsTab() {
  const { currentUser } = useAuth()
  const { guardViewer } = useViewer()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [type, setType] = useState('percent')
  const [discount, setDiscount] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      setCoupons(await getCouponsBySeller(currentUser.uid))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [currentUser?.uid])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (guardViewer()) return
    setError('')
    const disc = Number(discount)
    if (!code.trim() || Number.isNaN(disc) || disc <= 0) {
      setError('Enter a valid code and discount.')
      return
    }
    if (type === 'percent' && disc > 100) {
      setError('Percent discount cannot exceed 100.')
      return
    }
    setBusy(true)
    try {
      await createCoupon({
        code: code.trim(),
        type,
        discount: disc,
        maxUses: maxUses ? Number(maxUses) : null,
        sellerId: currentUser.uid,
      })
      setCode('')
      setDiscount('')
      setMaxUses('')
      await load()
    } catch (err) {
      setError(err.message || 'Failed to create coupon')
    } finally {
      setBusy(false)
    }
  }

  const handleToggle = async (c) => {
    if (guardViewer()) return
    await toggleCoupon(c.id, !c.active)
    await load()
  }

  const handleDelete = async (id) => {
    if (guardViewer()) return
    if (!confirm('Delete this coupon?')) return
    await deleteCoupon(id)
    await load()
  }

  return (
    <div className={s.wrap}>
      <form className={s.form} onSubmit={handleCreate}>
        <h3 className={s.title}>Create coupon</h3>
        <div className={`${s.row} ${s.row3}`}>
          <div className={s.field}>
            <label className={s.label}>Code</label>
            <input className={s.input} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="STUDX10" maxLength={20} required />
          </div>
          <div className={s.field}>
            <label className={s.label}>Type</label>
            <select className={s.select} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="percent">Percent %</option>
              <option value="fixed">Fixed R</option>
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label}>Discount</label>
            <input className={s.input} type="number" min="1" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} required />
          </div>
        </div>
        <div className={s.field}>
          <label className={s.label}>Max uses (optional)</label>
          <input className={s.input} type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Unlimited" />
        </div>
        {error && <div className={s.error}>{error}</div>}
        <button className={s.submit} type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create coupon'}</button>
      </form>

      <div className={s.list}>
        {loading ? <div className={s.empty}>Loading coupons…</div> : coupons.length === 0 ? (
          <div className={s.empty}>No coupons yet. Create one to offer buyers a discount.</div>
        ) : coupons.map((c) => (
          <div key={c.id} className={`${s.card} ${!c.active ? s.inactive : ''}`}>
            <div>
              <div className={s.code}>
                {c.code}
                <span className={`${s.pill} ${!c.active ? s.pillOff : ''}`}>{c.active ? 'Active' : 'Off'}</span>
              </div>
              <div className={s.meta}>
                {c.type === 'percent' ? `${c.discount}% off` : `R${c.discount} off`}
                {' · '}used {c.usageCount || 0}{c.maxUses ? ` / ${c.maxUses}` : ''}
              </div>
            </div>
            <div className={s.actions}>
              <button type="button" className={s.btn} onClick={() => handleToggle(c)}>{c.active ? 'Disable' : 'Enable'}</button>
              <button type="button" className={`${s.btn} ${s.btnDanger}`} onClick={() => handleDelete(c.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
