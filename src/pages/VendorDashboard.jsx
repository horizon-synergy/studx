import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  getVendor, upsertVendor, getFoodItemsByVendor, createFoodItem, updateFoodItem, deleteFoodItem,
  getFoodOrdersByVendor, updateFoodOrder,
} from '../services/firebase'
import { uploadImageToCloudinary } from '../utils/cloudinary'
import { useAuth } from '../context/AuthContext'
import s from '../styles/Eats.module.css'

export default function VendorDashboard() {
  const { currentUser, isVendor, isAdmin } = useAuth()
  const [tab, setTab] = useState('profile')
  const [vendor, setVendor] = useState(null)
  const [items, setItems] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', cuisine: '', campus: '', etaMinutes: '20', tags: '', open: true, active: true, coverUrl: '',
  })
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', category: 'food', imageUrl: '' })

  const uid = currentUser?.uid

  const load = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      const [v, menu, ords] = await Promise.all([
        getVendor(uid),
        getFoodItemsByVendor(uid),
        getFoodOrdersByVendor(uid),
      ])
      setVendor(v)
      if (v) {
        setForm({
          name: v.name || '',
          description: v.description || '',
          cuisine: v.cuisine || '',
          campus: v.campus || '',
          etaMinutes: String(v.etaMinutes || 20),
          tags: (v.tags || []).join(', '),
          open: v.open !== false,
          active: v.active !== false,
          coverUrl: v.coverUrl || '',
        })
      }
      setItems(menu)
      setOrders(ords.filter((o) => o.status !== 'awaiting_payment'))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { load() }, [load])

  if (!isVendor && !isAdmin) return <Navigate to="/eats" replace />

  const saveProfile = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await upsertVendor(uid, {
        name: form.name.trim(),
        description: form.description.trim(),
        cuisine: form.cuisine.trim(),
        campus: form.campus.trim(),
        etaMinutes: Number(form.etaMinutes) || 20,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        open: form.open,
        active: form.active,
        coverUrl: form.coverUrl,
        ownerId: uid,
      })
      await load()
      alert('Kitchen profile saved')
    } catch (err) {
      alert(err.message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const uploadCover = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const url = await uploadImageToCloudinary(file)
      setForm((f) => ({ ...f, coverUrl: url }))
    } catch (err) {
      alert(err.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const addMenuItem = async (e) => {
    e.preventDefault()
    if (!itemForm.name || !itemForm.price) return
    setBusy(true)
    try {
      await createFoodItem({
        vendorId: uid,
        name: itemForm.name.trim(),
        description: itemForm.description.trim(),
        price: Number(itemForm.price),
        category: itemForm.category,
        imageUrl: itemForm.imageUrl,
        available: true,
      })
      setItemForm({ name: '', description: '', price: '', category: 'food', imageUrl: '' })
      await load()
    } catch (err) {
      alert(err.message || 'Could not add item')
    } finally {
      setBusy(false)
    }
  }

  const uploadItemImg = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const url = await uploadImageToCloudinary(file)
      setItemForm((f) => ({ ...f, imageUrl: url }))
    } catch (err) {
      alert(err.message || 'Upload failed')
    }
  }

  const setOrderStatus = async (id, status) => {
    await updateFoodOrder(id, { status })
    await load()
  }

  return (
    <div className={s.page}>
      <header className={s.hero}>
        <p className={s.kicker}>Vendor</p>
        <h1 className={s.title}>Kitchen dashboard</h1>
        <p className={s.sub}>Manage your StudX Eats profile, menu, and incoming orders.</p>
      </header>

      <div className={s.tabs}>
        {['profile', 'menu', 'orders'].map((t) => (
          <button key={t} type="button" className={`${s.tab} ${tab === t ? s.tabActive : ''}`} onClick={() => setTab(t)}>
            {t === 'profile' ? 'Profile' : t === 'menu' ? 'Menu' : 'Orders'}
          </button>
        ))}
      </div>

      {loading ? <div className={s.loading}><div className={s.spinner} /></div> : (
        <>
          {tab === 'profile' && (
            <form className={s.form} onSubmit={saveProfile}>
              <div className={s.field}>
                <label className={s.label}>Kitchen / stall name</label>
                <input className={s.input} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Description</label>
                <textarea className={s.textarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className={s.row2}>
                <div className={s.field}>
                  <label className={s.label}>Cuisine</label>
                  <input className={s.input} value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} placeholder="Burgers, Smoothies…" />
                </div>
                <div className={s.field}>
                  <label className={s.label}>Campus / area</label>
                  <input className={s.input} value={form.campus} onChange={(e) => setForm({ ...form, campus: e.target.value })} />
                </div>
              </div>
              <div className={s.row2}>
                <div className={s.field}>
                  <label className={s.label}>ETA (minutes)</label>
                  <input className={s.input} type="number" min="5" value={form.etaMinutes} onChange={(e) => setForm({ ...form, etaMinutes: e.target.value })} />
                </div>
                <div className={s.field}>
                  <label className={s.label}>Tags (comma-separated)</label>
                  <input className={s.input} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>
              <label className={s.label}>
                <input type="checkbox" checked={form.open} onChange={(e) => setForm({ ...form, open: e.target.checked })} /> Open for orders
              </label>
              <label className={s.label}>
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Listed on StudX Eats
              </label>
              <label className={s.btn} style={{ width: 'fit-content', cursor: 'pointer' }}>
                Upload cover
                <input type="file" accept="image/*" hidden onChange={uploadCover} />
              </label>
              {form.coverUrl && <img src={form.coverUrl} alt="" style={{ maxWidth: '16rem', borderRadius: 8 }} />}
              <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
              {!vendor && <p className={s.meta}>Tip: ask an admin to set your role to <strong>vendor</strong> if you can’t access this page.</p>}
            </form>
          )}

          {tab === 'menu' && (
            <>
              <form className={s.form} onSubmit={addMenuItem}>
                <h3 className={s.sectionTitle} style={{ margin: 0 }}>Add menu item</h3>
                <div className={s.field}>
                  <label className={s.label}>Name</label>
                  <input className={s.input} required value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
                </div>
                <div className={s.field}>
                  <label className={s.label}>Description</label>
                  <input className={s.input} value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
                </div>
                <div className={s.row2}>
                  <div className={s.field}>
                    <label className={s.label}>Price (R)</label>
                    <input className={s.input} type="number" min="0" step="0.01" required value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} />
                  </div>
                  <div className={s.field}>
                    <label className={s.label}>Category</label>
                    <select className={s.select} value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}>
                      <option value="food">Food</option>
                      <option value="drink">Drink</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>
                </div>
                <label className={s.btn} style={{ width: 'fit-content', cursor: 'pointer' }}>
                  Photo
                  <input type="file" accept="image/*" hidden onChange={uploadItemImg} />
                </label>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={busy}>Add item</button>
              </form>

              <div className={s.menuGrid}>
                {items.map((item) => (
                  <div key={item.id} className={s.item}>
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className={s.itemImg} /> : <div className={s.itemImg} />}
                    <div>
                      <div className={s.itemName}>{item.name}</div>
                      <div className={s.itemPrice}>R{Number(item.price).toFixed(2)} · {item.available === false ? 'Hidden' : 'Available'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <button type="button" className={s.btn} onClick={() => updateFoodItem(item.id, { available: item.available === false }).then(load)}>
                        {item.available === false ? 'Show' : 'Hide'}
                      </button>
                      <button type="button" className={`${s.btn} ${s.btnDanger}`} onClick={() => { if (confirm('Delete item?')) deleteFoodItem(item.id).then(load) }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'orders' && (
            <div>
              {orders.length === 0 ? <div className={s.empty}>No paid orders yet.</div> : orders.map((o) => (
                <div key={o.id} className={s.orderCard}>
                  <div className={s.orderTitle}>{o.buyerEmail || o.buyerId?.slice(0, 8)} · R{Number(o.total || 0).toFixed(2)}</div>
                  <div className={s.orderMeta}>
                    Status: {o.status} · Pickup: {o.pickupSpot || '—'}
                    {o.note ? ` · Note: ${o.note}` : ''}
                  </div>
                  <div className={s.orderMeta}>
                    {(o.items || []).map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                  </div>
                  <div className={s.actions}>
                    {o.status === 'paid' && <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={() => setOrderStatus(o.id, 'preparing')}>Start preparing</button>}
                    {o.status === 'preparing' && <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={() => setOrderStatus(o.id, 'ready')}>Mark ready</button>}
                    {o.status === 'ready' && <button type="button" className={s.btn} onClick={() => setOrderStatus(o.id, 'completed')}>Completed</button>}
                    {['paid', 'preparing'].includes(o.status) && <button type="button" className={`${s.btn} ${s.btnDanger}`} onClick={() => setOrderStatus(o.id, 'cancelled')}>Cancel</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
