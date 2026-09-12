import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatPrice } from '../config/listing-config'
import { getCloudinaryThumbnail } from '../utils/cloudinary'
import { useAuth } from '../context/AuthContext'
import { useViewer } from '../context/ViewerContext'
import { addToWishlist, removeFromWishlist } from '../services/firebase'
import s from '../styles/ListingCard.module.css'

export default function ListingCard({ listing, wishlisted = false, onWishlistChange }) {
  const { currentUser } = useAuth()
  const { guardViewer } = useViewer()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [isWish, setIsWish] = useState(wishlisted)

  const img = listing.images?.[0] || listing.imageUrl || ''
  const thumb = img ? getCloudinaryThumbnail(img, 480, 360) : ''
  const unavailable = listing.availability && listing.availability !== 'available'

  const toggleWish = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!currentUser) { navigate('/login'); return }
    if (guardViewer()) return
    if (busy) return
    setBusy(true)
    try {
      if (isWish) {
        await removeFromWishlist(currentUser.uid, listing.id)
        setIsWish(false)
        onWishlistChange?.(listing.id, false)
      } else {
        await addToWishlist(currentUser.uid, listing.id)
        setIsWish(true)
        onWishlistChange?.(listing.id, true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Link to={`/listing/${listing.id}`} className={s.card}>
      <div className={s.media}>
        {thumb ? <img src={thumb} alt={listing.title} className={s.img} loading="lazy" /> : <div className={s.placeholder}>◈</div>}
        <div className={s.badges}>
          {listing.featured && <span className={`${s.badge} ${s.badgeFeatured}`}>Featured</span>}
          {listing.availability === 'sold' && <span className={`${s.badge} ${s.badgeSold}`}>Sold</span>}
          {listing.availability === 'reserved' && <span className={`${s.badge} ${s.badgeReserved}`}>Reserved</span>}
          {listing.type && <span className={s.badge}>{listing.type}</span>}
        </div>
        <button
          type="button"
          className={`${s.wishBtn} ${isWish ? s.wishActive : ''}`}
          onClick={toggleWish}
          aria-label={isWish ? 'Remove from wishlist' : 'Add to wishlist'}
          disabled={busy || unavailable}
        >
          {isWish ? '♥' : '♡'}
        </button>
      </div>
      <div className={s.body}>
        <span className={s.category}>{listing.subcategory || listing.category || 'Listing'}</span>
        <h3 className={s.title}>{listing.title}</h3>
        <div className={s.meta}>
          <span className={s.price}>{formatPrice(listing.price, listing.pricingModel)}</span>
          {listing.avgRating > 0 && (
            <span className={s.rating}>
              <span className={s.star}>★</span> {listing.avgRating}
              {listing.reviewCount ? ` (${listing.reviewCount})` : ''}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
