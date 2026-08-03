// src/pages/Checkout.jsx
import { useState }           from 'react'
import { Link }                   from 'react-router-dom'
import { useAuth }            from '../context/AuthContext'
import { useCart }            from '../context/CartContext'
import { PartyPopper, ArrowLeft, ShoppingCart, X, Tag, Lock } from 'lucide-react'
import {
  createCheckout, createOrder,
  validateCoupon, redeemCoupon, applyCouponToTotal,
} from '../services/firebase'

export default function Checkout() {
  const { currentUser }                          = useAuth()
  const { items, removeFromCart, clearCart, total } = useCart()

  const [placing,       setPlacing]       = useState(false)
  const [done,          setDone]          = useState(false)
  const [error,         setError]         = useState('')
  const [couponCode,    setCouponCode]    = useState('')
  const [couponData,    setCouponData]    = useState(null)
  const [couponError,   setCouponError]   = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponApplied, setCouponApplied] = useState(false)

  const { discountedTotal, savings, label } = applyCouponToTotal(total, couponData)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponError(''); setCouponLoading(true)
    try {
      const coupon = await validateCoupon(couponCode)
      if (!coupon) { setCouponError('Invalid or expired coupon code.'); setCouponData(null); setCouponApplied(false) }
      else         { setCouponData(coupon); setCouponApplied(true); setCouponError('') }
    } catch (_) { setCouponError('Could not validate coupon.') }
    finally { setCouponLoading(false) }
  }

  const handleRemoveCoupon = () => { setCouponData(null); setCouponCode(''); setCouponApplied(false); setCouponError('') }

  const handleCheckout = async () => {
    if (!items.length) return
    setPlacing(true); setError('')
    try {
      await createCheckout({ buyerId: currentUser.uid, items: items.map((i) => ({ listingId: i.id, title: i.title, price: i.price, imageUrl: i.imageUrl, sellerId: i.sellerId })), subtotal: total, discount: savings, total: discountedTotal, couponCode: couponData?.code || null })
      await Promise.all(items.map((i) => createOrder({ buyerId: currentUser.uid, sellerId: i.sellerId, listingId: i.id, listingTitle: i.title, listingPrice: i.price, listingImageUrl: i.imageUrl })))
      if (couponData?.id) await redeemCoupon(couponData.id)
      clearCart(); setDone(true)
    } catch (err) { console.error(err); setError('Checkout failed. Please try again.') }
    finally { setPlacing(false) }
  }

  const c = {
    page: { maxWidth: '52rem', margin: '0 auto', padding: '1.5rem 1rem 4rem' },
    card: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' },
    input: { flex: 1, padding: '0.6rem 0.875rem', fontSize: '0.875rem', fontFamily: 'var(--font-body)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' },
  }

  if (done) return (
    <div style={{ maxWidth: '28rem', margin: '5rem auto', textAlign: 'center', padding: '0 1rem' }}>
      <div style={{ color: 'var(--brand-blue)', marginBottom: '1rem' }}><PartyPopper size={48} /></div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>Order confirmed!</h1>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
        Your order has been placed. Sellers will accept and begin processing shortly. Track progress in your Orders tab.
      </p>
      <Link to="/dashboard" style={{ display: 'inline-block', background: 'var(--brand-blue)', color: '#fff', fontWeight: 600, fontSize: '0.875rem', padding: '0.75rem 2rem', borderRadius: 'var(--radius-lg)', textDecoration: 'none' }}>
        View My Orders
      </Link>
    </div>
  )

  return (
    <main style={c.page}>
      <Link to="/" style={{ display: 'inline-flex', fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1.5rem' }}><ArrowLeft size={14} /> Continue Shopping</Link>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem,4vw,1.5rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: '1.5rem' }}>Checkout</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Cart items */}
        <div style={c.card}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
            Cart ({items.length} item{items.length !== 1 ? 's' : ''})
          </p>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}><ShoppingCart size={40} /></div>
              <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem' }}>Your cart is empty</p>
              <Link to="/" style={{ color: 'var(--brand-blue)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>Browse the marketplace</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  {item.imageUrl && <img src={item.imageUrl} alt={item.title} style={{ width: '4rem', height: '4rem', borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0, background: 'var(--bg-subtle)' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{item.category}</p>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--brand-blue)', flexShrink: 0 }}>R{Number(item.price).toFixed(2)}</span>
                  <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', borderRadius: 4 }}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Coupon */}
          {items.length > 0 && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}><Tag size={14} /> Have a coupon?</p>
              {couponApplied ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#15803d', fontFamily: 'monospace' }}>{couponData.code}</span>
                  <span style={{ fontSize: '0.8rem', color: '#15803d', marginLeft: '0.5rem' }}>— {label} (−R{savings.toFixed(2)})</span>
                  <button onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-body)' }}>Remove</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/\s/g, ''))} onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()} placeholder="Enter code" style={c.input} />
                  <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} style={{ padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'var(--font-body)', background: 'var(--brand-blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', opacity: couponLoading || !couponCode.trim() ? 0.6 : 1 }}>
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && <p style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '0.5rem' }}>{couponError}</p>}
            </div>
          )}
        </div>

        {/* Summary */}
        {items.length > 0 && (
          <div style={{ ...c.card, position: 'sticky', top: '4rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Summary</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.625rem' }}>
              <span>Subtotal</span><span>R{total.toFixed(2)}</span>
            </div>
            {savings > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.625rem' }}>
                <span style={{ color: '#15803d' }}>Discount ({label})</span>
                <span style={{ color: '#15803d', fontWeight: 600 }}>−R{savings.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              <span>Platform fee</span><span style={{ color: '#15803d' }}>Free</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0 0 1rem' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--brand-blue)' }}>R{discountedTotal.toFixed(2)}</span>
            </div>
            {error && <p style={{ fontSize: '0.8rem', color: '#dc2626', marginBottom: '0.75rem' }}>{error}</p>}
            <button onClick={handleCheckout} disabled={placing} style={{ width: '100%', background: 'var(--brand-blue)', color: '#fff', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'var(--font-body)', padding: '0.9rem', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', opacity: placing ? 0.6 : 1 }}>
              {placing ? 'Placing order…' : 'Place Order'}
            </button>
            <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.875rem' }}>
              <Lock size={12} /> Secure checkout via StudX
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
