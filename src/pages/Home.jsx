import { useEffect, useMemo, useState } from 'react'
import { getAllListingsForFeed, getActiveAds, getWishlist } from '../services/firebase'
import { injectAds } from '../config/ads-config'
import { isAdSenseEnabled } from '../components/GoogleAdSense'
import { PRODUCT_SUBCATEGORIES, SERVICE_SUBCATEGORIES } from '../config/listing-config'
import { useAuth } from '../context/AuthContext'
import ListingCard from '../components/ListingCard'
import FeedAdSlot from '../components/FeedAdSlot'
import PromotedListing from '../components/PromotedListing'
import s from '../styles/Home.module.css'

const TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'product', label: 'Products' },
  { value: 'service', label: 'Services' },
]

export default function Home() {
  const { currentUser } = useAuth()
  const [listings, setListings] = useState([])
  const [ads, setAds] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [subcategory, setSubcategory] = useState('all')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [feed, activeAds] = await Promise.all([getAllListingsForFeed(), getActiveAds()])
        if (!alive) return
        setListings(feed)
        setAds(activeAds)
      } catch (err) {
        console.error(err)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!currentUser) { setWishlist([]); return }
    getWishlist(currentUser.uid).then(setWishlist).catch(() => setWishlist([]))
  }, [currentUser?.uid])

  const subOptions = useMemo(() => {
    if (type === 'product') return PRODUCT_SUBCATEGORIES
    if (type === 'service') return SERVICE_SUBCATEGORIES
    return [...PRODUCT_SUBCATEGORIES, ...SERVICE_SUBCATEGORIES]
  }, [type])

  const filtered = useMemo(() => {
    let list = [...listings]
    if (type !== 'all') list = list.filter((l) => (l.type || l.category) === type)
    if (subcategory !== 'all') list = list.filter((l) => l.subcategory === subcategory)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((l) =>
        [l.title, l.description, l.subcategory, l.sellerEmail]
          .filter(Boolean)
          .some((t) => String(t).toLowerCase().includes(q))
      )
    }
    if (sort === 'price_asc') list.sort((a, b) => Number(a.price) - Number(b.price))
    else if (sort === 'price_desc') list.sort((a, b) => Number(b.price) - Number(a.price))
    else list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    return list
  }, [listings, type, subcategory, query, sort])

  const feed = useMemo(
    () => injectAds(filtered, ads, { useAdSense: isAdSenseEnabled() }),
    [filtered, ads]
  )

  const onWishlistChange = (id, active) => {
    setWishlist((prev) => active ? [...prev, id] : prev.filter((x) => x !== id))
  }

  return (
    <div className={s.page}>
      <header className={s.hero}>
        <h1 className={s.heroTitle}>Marketplace</h1>
        <p className={s.heroSub}>Browse student products and services — textbooks, tutoring, design, and more.</p>
      </header>

      <PromotedListing />

      <div className={s.toolbar}>
        <div className={s.search}>
          <span aria-hidden>⌕</span>
          <input
            className={s.searchInput}
            placeholder="Search listings…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className={s.filters}>
          <select className={s.select} value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
            <option value="all">All categories</option>
            {subOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className={s.select} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
        </div>
      </div>

      <div className={s.chips}>
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`${s.chip} ${type === f.value ? s.chipActive : ''}`}
            onClick={() => { setType(f.value); setSubcategory('all') }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={s.loading}><div className={s.spinner} /></div>
      ) : (
        <>
          <p className={s.count}>{filtered.length} listing{filtered.length === 1 ? '' : 's'}</p>
          <div className={s.grid}>
            {feed.length === 0 ? (
              <div className={s.empty}>
                <p className={s.emptyTitle}>Nothing here yet</p>
                <p>Try another filter or check back soon.</p>
              </div>
            ) : feed.map((item, i) =>
              item.type === 'listing' ? (
                <ListingCard
                  key={item.data.id}
                  listing={item.data}
                  wishlisted={wishlist.includes(item.data.id)}
                  onWishlistChange={onWishlistChange}
                />
              ) : (
                <FeedAdSlot key={`ad-${item.adIndex ?? i}`} item={item} />
              )
            )}
          </div>
        </>
      )}
    </div>
  )
}
