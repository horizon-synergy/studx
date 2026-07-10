// src/pages/Wishlist.jsx
import { useState, useEffect } from 'react'
import { Link }                from 'react-router-dom'
import { useAuth }             from '../context/AuthContext'
import { getWishlist, getListingById } from '../services/firebase'
import ListingCard from '../components/ListingCard'

export default function Wishlist() {
  const { currentUser }         = useAuth()
  const [listings, setListings] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const ids     = await getWishlist(currentUser.uid)
        if (!ids.length) { setLoading(false); return }
        const results = await Promise.all(ids.map((id) => getListingById(id)))
        setListings(results.filter(Boolean))
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [currentUser])

  const page = { maxWidth: '72rem', margin: '0 auto', padding: '1.5rem 1rem 4rem' }

  if (loading) return (
    <main style={page}>
      <div style={{ width: '1.5rem', height: '1.5rem', border: '2px solid var(--brand-blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '4rem auto' }} />
    </main>
  )

  return (
    <main style={page}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem,4vw,1.5rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
          My Wishlist
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          {listings.length
            ? `${listings.length} saved item${listings.length !== 1 ? 's' : ''}`
            : 'Items you save will appear here'}
        </p>
      </div>

      {listings.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem 1rem', textAlign: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '3rem' }}>♡</span>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Your wishlist is empty</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Browse the marketplace and save items you're interested in.</p>
          <Link to="/" style={{ marginTop: '0.5rem', background: 'var(--brand-blue)', color: '#fff', fontWeight: 600, fontSize: '0.875rem', padding: '0.65rem 1.5rem', borderRadius: 'var(--radius-lg)', textDecoration: 'none' }}>
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(15rem, 1fr))', gap: '1.1rem' }}>
          {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </main>
  )
}
