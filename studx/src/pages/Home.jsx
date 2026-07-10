// src/pages/Home.jsx
import { useState, useEffect, useMemo } from 'react'
import ListingCard from '../components/ListingCard'
import { getAllListings, getUserProfile, getProfile } from '../services/firebase'
import s from '../styles/Home.module.css'

const FILTERS = [
  { label: 'All',          value: 'all'      },
  { label: '⭐ Featured',  value: 'featured'  },
  { label: '📦 Products',  value: 'product'  },
  { label: '🛠 Services',  value: 'service'  },
]

export default function Home() {
  const [listings,     setListings]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery,  setSearchQuery]  = useState('')
  const [activeTag,    setActiveTag]    = useState('')

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const raw = await getAllListings()
        const uniqueSellerIds = [...new Set(raw.map((l) => l.sellerId))]

        const [authProfiles, extProfiles] = await Promise.all([
          Promise.all(uniqueSellerIds.map((uid) => getUserProfile(uid))),
          Promise.all(uniqueSellerIds.map((uid) => getProfile(uid))),
        ])

        const sellerMap = {}
        uniqueSellerIds.forEach((uid, i) => {
          const displayName = extProfiles[i]?.displayName
          const email       = authProfiles[i]?.email || ''
          sellerMap[uid] = {
            name:     displayName || email.split('@')[0] || 'Student',
            verified: authProfiles[i]?.verified || false,
          }
        })

        const enriched = raw.map((l) => ({
          ...l,
          sellerName:     sellerMap[l.sellerId]?.name     || 'Student',
          sellerVerified: sellerMap[l.sellerId]?.verified || false,
        })).sort((a, b) => {
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return 0
        })

        setListings(enriched)
      } catch (err) {
        console.error(err)
        setError('Could not load listings. Check your connection.')
      } finally {
        setLoading(false)
      }
    }
    fetchListings()
  }, [])

  // Collect all unique tags from listings
  const allTags = useMemo(() => {
    const tags = new Set()
    listings.forEach((l) => l.tags?.forEach((t) => tags.add(t)))
    return [...tags].sort()
  }, [listings])

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchCat = activeFilter === 'all'
        ? true
        : activeFilter === 'featured'
        ? l.featured === true
        : l.category === activeFilter

      const matchTag = !activeTag || l.tags?.includes(activeTag)

      const q = searchQuery.toLowerCase()
      const matchSearch = !q ||
        l.title.toLowerCase().includes(q) ||
        l.sellerName?.toLowerCase().includes(q) ||
        l.tags?.some((t) => t.includes(q)) ||
        l.description?.toLowerCase().includes(q)

      return matchCat && matchTag && matchSearch
    })
  }, [listings, activeFilter, searchQuery, activeTag])

  const clearAll = () => { setSearchQuery(''); setActiveFilter('all'); setActiveTag('') }

  return (
    <main className={s.page}>

      {/* Hero */}
      <div className={s.hero}>
        <div className={s.heroBadge}>
          <span className={s.pulse} />
          Live Marketplace
        </div>
        <h1 className={s.heroTitle}>
          Find what students<br />
          <span className={s.heroAccent}>are selling</span>
        </h1>
        <p className={s.heroSub}>
          Textbooks, services, notes, tutoring and more — all from fellow students.
        </p>
      </div>

      {/* Search */}
      <div className={s.searchRow}>
        <div className={s.searchWrap}>
          <span className={s.searchIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search listings, sellers, or tags…"
            className={s.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={s.searchClear}>✕</button>
          )}
        </div>
      </div>

      {/* Category pills */}
      <div className={s.filterRow}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`${s.pill} ${activeFilter === f.value ? s.pillActive : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tag pills — only shown when tags exist */}
      {allTags.length > 0 && (
        <div className={s.tagRow}>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
              className={`${s.tagPill} ${activeTag === tag ? s.tagPillActive : ''}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && !error && (
        <p className={s.resultsMeta}>
          {filtered.length === 0
            ? 'No listings match your search.'
            : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''}`}
          {(activeTag || activeFilter !== 'all' || searchQuery) && (
            <button onClick={clearAll} className={s.clearBtn}> · Clear filters</button>
          )}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <div className={s.empty}>
          <span className={s.emptyIcon}>⚠️</span>
          <p className={s.emptyTitle}>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={s.empty}>
          <span className={s.emptyIcon}>🔍</span>
          <p className={s.emptyTitle}>Nothing found</p>
          <p className={s.emptyDesc}>Try different keywords or clear your filters.</p>
          <button onClick={clearAll} className={s.emptyAction}>Clear filters</button>
        </div>
      ) : (
        <div className={s.grid}>
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </main>
  )
}

function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(15rem, 1fr))', gap: '1rem' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ width: '100%', aspectRatio: '4/3', background: 'var(--bg-subtle)', animation: 'pulse 1.8s ease-in-out infinite' }} />
          <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[75, 50, 35].map((w, j) => (
              <div key={j} style={{ height: '0.7rem', width: `${w}%`, background: 'var(--bg-subtle)', borderRadius: 999, animation: 'pulse 1.8s ease-in-out infinite' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
