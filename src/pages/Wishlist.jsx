import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getWishlist, getListingById } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import ListingCard from '../components/ListingCard'
import s from '../styles/Wishlist.module.css'

export default function Wishlist() {
  const { currentUser } = useAuth()
  const [listings, setListings] = useState([])
  const [ids, setIds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!currentUser) return
      setLoading(true)
      try {
        const wishIds = await getWishlist(currentUser.uid)
        if (!alive) return
        setIds(wishIds)
        const items = await Promise.all(wishIds.map((id) => getListingById(id)))
        if (!alive) return
        setListings(items.filter(Boolean).filter((l) => l.archived !== true))
      } catch (err) {
        console.error(err)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [currentUser?.uid])

  const onWishlistChange = (id, active) => {
    if (active) return
    setIds((prev) => prev.filter((x) => x !== id))
    setListings((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div className={s.page}>
      <h1 className={s.title}>Wishlist</h1>
      <p className={s.sub}>Saved listings you’ll come back to</p>
      {loading ? (
        <div className={s.loading}><div className={s.spinner} /></div>
      ) : listings.length === 0 ? (
        <div className={s.empty}>Nothing saved yet. <Link to="/">Browse marketplace</Link></div>
      ) : (
        <div className={s.grid}>
          {listings.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              wishlisted={ids.includes(l.id)}
              onWishlistChange={onWishlistChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
