import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getVendor, getFoodItemsByVendor } from '../services/firebase'
import { useFoodCart } from '../context/FoodCartContext'
import { useAuth } from '../context/AuthContext'
import { useViewer } from '../context/ViewerContext'
import s from '../styles/Eats.module.css'

export default function VendorDetail() {
  const { vendorId } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { guardViewer } = useViewer()
  const { addItem, count } = useFoodCart()
  const [vendor, setVendor] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const [v, menu] = await Promise.all([getVendor(vendorId), getFoodItemsByVendor(vendorId)])
        if (!alive) return
        setVendor(v)
        setItems(menu.filter((i) => i.available !== false))
      } catch (err) {
        console.error(err)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [vendorId])

  const handleAdd = (item) => {
    if (!currentUser) { navigate('/login'); return }
    if (guardViewer()) return
    addItem({
      id: item.id,
      name: item.name,
      price: Number(item.price || 0),
      vendorId,
      vendorName: vendor?.name || '',
      imageUrl: item.imageUrl || '',
    })
  }

  if (loading) return <div className={s.page}><div className={s.loading}><div className={s.spinner} /></div></div>
  if (!vendor) return <div className={s.page}><div className={s.empty}>Vendor not found</div></div>

  return (
    <div className={s.page}>
      <button type="button" className={s.back} onClick={() => navigate('/eats')}>← All vendors</button>
      <header className={s.hero}>
        <p className={s.kicker}>{vendor.cuisine || 'StudX Eats'}</p>
        <h1 className={s.title}>{vendor.name}</h1>
        <p className={s.sub}>{vendor.description || 'Campus food & drinks'}</p>
        <p className={s.meta} style={{ marginTop: '0.5rem' }}>
          {vendor.campus || 'Campus'} · {vendor.etaMinutes ? `~${vendor.etaMinutes} min` : 'Pickup'} · {vendor.open === false ? 'Closed' : 'Open for orders'}
        </p>
      </header>

      <div className={s.toolbar}>
        {count > 0 && <Link to="/eats/checkout" className={s.cartBtn}>Food cart ({count})</Link>}
      </div>

      <h2 className={s.sectionTitle}>Menu</h2>
      {items.length === 0 ? (
        <div className={s.empty}>This vendor hasn’t published a menu yet.</div>
      ) : (
        <div className={s.menuGrid}>
          {items.map((item) => (
            <div key={item.id} className={s.item}>
              {item.imageUrl ? <img src={item.imageUrl} alt="" className={s.itemImg} /> : <div className={s.itemImg} />}
              <div>
                <div className={s.itemName}>{item.name}</div>
                {item.description && <div className={s.itemDesc}>{item.description}</div>}
                <div className={s.itemPrice}>R{Number(item.price || 0).toFixed(2)}</div>
              </div>
              <button type="button" className={s.addBtn} onClick={() => handleAdd(item)} disabled={vendor.open === false}>
                Add
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
