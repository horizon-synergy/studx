import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActiveVendors, getAllVendors } from '../services/firebase'
import { useFoodCart } from '../context/FoodCartContext'
import { useAuth } from '../context/AuthContext'
import s from '../styles/Eats.module.css'

export default function Eats() {
  const { isVendor, isAdmin } = useAuth()
  const { count } = useFoodCart()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        let list = []
        try {
          list = await getActiveVendors()
        } catch {
          // Fallback if composite index missing — client filter
          list = (await getAllVendors()).filter((v) => v.active !== false)
        }
        if (alive) setVendors(list)
      } catch (err) {
        console.error(err)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return vendors
    return vendors.filter((v) =>
      [v.name, v.cuisine, v.campus, v.description]
        .filter(Boolean)
        .some((t) => String(t).toLowerCase().includes(term))
    )
  }, [vendors, q])

  return (
    <div className={s.page}>
      <header className={s.hero}>
        <p className={s.kicker}>StudX Eats</p>
        <h1 className={s.title}>Campus bites, nearby</h1>
        <p className={s.sub}>Order food and drinks from student vendors and campus kitchens around you.</p>
      </header>

      <div className={s.toolbar}>
        <input className={s.search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vendors, cuisine, campus…" />
        {count > 0 && <Link to="/eats/checkout" className={s.cartBtn}>Food cart ({count})</Link>}
        {(isVendor || isAdmin) && <Link to="/eats/vendor" className={s.cartBtn} style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Vendor dashboard</Link>}
      </div>

      {loading ? (
        <div className={s.loading}><div className={s.spinner} /></div>
      ) : (
        <div className={s.grid}>
          {filtered.length === 0 ? (
            <div className={s.empty}>No vendors yet. Vendors can open the Vendor dashboard to set up a kitchen.</div>
          ) : filtered.map((v) => (
            <Link key={v.id} to={`/eats/vendor/${v.id}`} className={s.card}>
              {v.coverUrl ? <img src={v.coverUrl} alt="" className={s.cover} /> : <div className={s.coverPh}>◎</div>}
              <div className={s.body}>
                <h2 className={s.name}>{v.name}</h2>
                <p className={s.meta}>{v.cuisine || 'Food'} · {v.campus || 'Campus'} · {v.etaMinutes ? `${v.etaMinutes} min` : 'Pickup'}</p>
                <div className={s.tags}>
                  {(v.tags || []).slice(0, 3).map((t) => <span key={t} className={s.tag}>{t}</span>)}
                  {v.open === false && <span className={s.tag}>Closed</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
