import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getListingById, getProfile, getSellerRatingStats, getOrCreateChat,
  getReviewsByListing, createReview, getCommentsByListing, createComment,
  getWishlist, addToWishlist, removeFromWishlist,
  createOrder, createCheckout, startPaystackCheckout,
  getUserProfile, buildWhatsAppLink,
  updateDoc, doc, db,
} from '../services/firebase'
import { formatPrice } from '../config/listing-config'
import { getCloudinaryThumbnail } from '../utils/cloudinary'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useViewer } from '../context/ViewerContext'
import StudentBadge from '../components/StudentBadge'
import s from '../styles/ListingDetail.module.css'

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { addToCart, isInCart } = useCart()
  const { guardViewer } = useViewer()

  const [listing, setListing] = useState(null)
  const [seller, setSeller] = useState(null)
  const [sellerAccount, setSellerAccount] = useState(null)
  const [sellerStats, setSellerStats] = useState({ avg: 0, total: 0 })
  const [reviews, setReviews] = useState([])
  const [comments, setComments] = useState([])
  const [wishlisted, setWishlisted] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [commentText, setCommentText] = useState('')
  const [busy, setBusy] = useState(false)
  const [buyingNow, setBuyingNow] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const data = await getListingById(id)
        if (!alive) return
        if (!data) { setError('Listing not found'); return }
        setListing(data)
        const [profile, stats, revs, coms, account] = await Promise.all([
          getProfile(data.sellerId),
          getSellerRatingStats(data.sellerId),
          getReviewsByListing(id),
          getCommentsByListing(id),
          getUserProfile(data.sellerId),
        ])
        if (!alive) return
        setSeller(profile)
        setSellerStats(stats)
        setReviews(revs)
        setComments(coms)
        setSellerAccount(account)
      } catch (err) {
        console.error(err)
        if (alive) setError('Failed to load listing')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [id])

  useEffect(() => {
    if (!currentUser || !id) return
    getWishlist(currentUser.uid).then((items) => setWishlisted(items.includes(id))).catch(() => {})
  }, [currentUser?.uid, id])

  if (loading) return <div className={s.loading}><div className={s.spinner} /></div>
  if (error || !listing) return <div className={s.errorBox}>{error || 'Not found'}</div>

  const images = (listing.images?.length ? listing.images : listing.imageUrl ? [listing.imageUrl] : [])
  const activeImg = images[imgIdx] || ''
  const unavailable = listing.availability && listing.availability !== 'available'
  const isOwner = currentUser?.uid === listing.sellerId
  const inCart = isInCart(listing.id)
  const waLink = !isOwner && seller?.whatsappNumber
    ? buildWhatsAppLink(seller.whatsappNumber, `Hi! I'm interested in your "${listing.title}" listing on StudX.`)
    : null

  const requireAuth = () => {
    if (!currentUser) { navigate('/login'); return false }
    if (guardViewer()) return false
    return true
  }

  const handleCart = () => {
    if (!requireAuth()) return
    addToCart(listing)
  }

  const handleBuyNow = async () => {
    if (!requireAuth()) return
    setBuyingNow(true)
    setError('')
    try {
      const orderRef = await createOrder({
        listingId: listing.id,
        listingTitle: listing.title,
        price: Number(listing.price || 0),
        originalPrice: Number(listing.price || 0),
        buyerId: currentUser.uid,
        buyerEmail: currentUser.email || '',
        sellerId: listing.sellerId,
        status: 'awaiting_payment',
        paymentStatus: 'pending',
      })
      const checkoutRef = await createCheckout({
        buyerId: currentUser.uid,
        orderIds: [orderRef.id],
        subtotal: listing.price,
        discount: 0,
        total: listing.price,
        lineItems: [{ name: listing.title, price: listing.price, quantity: 1 }],
        status: 'pending',
        paymentStatus: 'pending',
      })
      await updateDoc(doc(db, 'orders', orderRef.id), { checkoutId: checkoutRef.id })

      const { authorizationUrl } = await startPaystackCheckout(checkoutRef.id)
      if (!authorizationUrl) throw new Error('No payment redirect returned')
      window.location.href = authorizationUrl
    } catch (err) {
      console.error(err)
      setError(err.message || 'Could not start checkout')
      setBuyingNow(false)
    }
  }

  const handleWish = async () => {
    if (!requireAuth()) return
    setBusy(true)
    try {
      if (wishlisted) {
        await removeFromWishlist(currentUser.uid, listing.id)
        setWishlisted(false)
      } else {
        await addToWishlist(currentUser.uid, listing.id)
        setWishlisted(true)
      }
    } finally {
      setBusy(false)
    }
  }

  const handleMessage = async () => {
    if (!requireAuth()) return
    if (isOwner) return
    setBusy(true)
    try {
      const chat = await getOrCreateChat(currentUser.uid, listing.sellerId, listing.id, listing.title)
      navigate(`/messages/${chat.id}`)
    } catch (err) {
      console.error(err)
      alert('Could not start chat')
    } finally {
      setBusy(false)
    }
  }

  const handleReview = async (e) => {
    e.preventDefault()
    if (!requireAuth() || isOwner) return
    if (!reviewText.trim()) return
    setBusy(true)
    try {
      await createReview({
        listingId: listing.id,
        sellerId: listing.sellerId,
        buyerId: currentUser.uid,
        buyerEmail: currentUser.email || '',
        rating,
        text: reviewText.trim(),
      })
      setReviewText('')
      setReviews(await getReviewsByListing(listing.id))
    } finally {
      setBusy(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!requireAuth()) return
    if (!commentText.trim()) return
    setBusy(true)
    try {
      await createComment({
        listingId: listing.id,
        uid: currentUser.uid,
        email: currentUser.email || '',
        text: commentText.trim(),
      })
      setCommentText('')
      setComments(await getCommentsByListing(listing.id))
    } finally {
      setBusy(false)
    }
  }

  const specEntries = Object.entries(listing.specs || {}).filter(([, v]) => v)

  return (
  <>
    <div className={s.page}>
      <button type="button" className={s.back} onClick={() => navigate(-1)}>← Back</button>

      <div className={s.layout}>
        <div className={s.gallery}>
          <div className={s.mainImgWrap}>
            {activeImg ? (
              <img src={getCloudinaryThumbnail(activeImg, 1000, 750)} alt={listing.title} className={s.mainImg} />
            ) : (
              <div className={s.placeholder}>◈</div>
            )}
          </div>
          {images.length > 1 && (
            <div className={s.thumbs}>
              {images.map((url, i) => (
                <button key={url} type="button" className={`${s.thumb} ${i === imgIdx ? s.thumbActive : ''}`} onClick={() => setImgIdx(i)}>
                  <img src={getCloudinaryThumbnail(url, 120, 120)} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={s.info}>
          <span className={s.kicker}>{listing.subcategory || listing.type || 'Listing'}</span>
          <h1 className={s.title}>{listing.title}</h1>
          <p className={s.price}>{formatPrice(listing.price, listing.pricingModel)}</p>
          <div className={s.badges}>
            {listing.featured && <span className={s.badge}>Featured</span>}
            {listing.availability === 'sold' && <span className={`${s.badge} ${s.badgeDanger}`}>Sold</span>}
            {listing.availability === 'reserved' && <span className={`${s.badge} ${s.badgeWarn}`}>Reserved</span>}
            {listing.avgRating > 0 && <span className={s.badge}>★ {listing.avgRating} ({listing.reviewCount || 0})</span>}
          </div>
          <p className={s.desc}>{listing.description}</p>

          {specEntries.length > 0 && (
            <div className={s.specs}>
              {specEntries.map(([key, val]) => (
                <div key={key}>
                  <div className={s.specLabel}>{key}</div>
                  <div className={s.specValue}>{String(val).replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          )}

          {error && <p className={s.desc} style={{ color: 'var(--danger-text)' }}>{error}</p>}

          {!isOwner && (
            <div className={s.actions}>
              <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={handleBuyNow} disabled={unavailable || buyingNow}>
                {buyingNow ? 'Starting checkout…' : unavailable ? 'Unavailable' : 'Buy now'}
              </button>
              <button type="button" className={s.btn} onClick={handleCart} disabled={unavailable || inCart}>
                {inCart ? 'In cart' : 'Add to cart'}
              </button>
              <button type="button" className={s.btn} onClick={handleMessage} disabled={busy}>Message seller</button>
              {waLink && (
                
                 <a href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.btn}
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                  WhatsApp seller
                </a>
              )}
              <button type="button" className={s.btn} onClick={handleWish} disabled={busy}>
                {wishlisted ? '♥ Saved' : '♡ Wishlist'}
              </button>
            </div>
          )}

          <Link to={`/profile/${listing.sellerId}`} className={s.seller}>
            <div className={s.avatar}>
              {seller?.avatarUrl ? <img src={seller.avatarUrl} alt="" /> : (seller?.displayName || listing.sellerEmail || 'S')[0].toUpperCase()}
            </div>
            <div>
              <div className={s.sellerName}>
                {seller?.displayName || listing.sellerEmail || 'Seller'}{' '}
                <StudentBadge status={sellerAccount?.studentVerificationStatus} />
              </div>
              <div className={s.sellerMeta}>
                {sellerStats.total > 0 ? `★ ${sellerStats.avg} · ${sellerStats.total} reviews` : 'New seller'}
              </div>
            </div>
          </Link>
        </div>
      </div>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Reviews</h2>
        {!isOwner && currentUser && (
          <form className={s.formRow} onSubmit={handleReview}>
            <div className={s.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" className={`${s.starBtn} ${n <= rating ? s.starOn : ''}`} onClick={() => setRating(n)}>★</button>
              ))}
            </div>
            <textarea className={s.textarea} value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share your experience…" />
            <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={busy} style={{ alignSelf: 'flex-start' }}>Post review</button>
          </form>
        )}
        <div className={s.list}>
          {reviews.length === 0 ? <p className={s.empty}>No reviews yet.</p> : reviews.map((r) => (
            <div key={r.id} className={s.item}>
              <div className={s.itemHead}>
                <span>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} · {r.buyerEmail || 'Buyer'}</span>
              </div>
              <p className={s.itemBody}>{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Comments</h2>
        {currentUser && (
          <form className={s.formRow} onSubmit={handleComment}>
            <textarea className={s.textarea} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Ask a question…" />
            <button type="submit" className={s.btn} disabled={busy} style={{ alignSelf: 'flex-start' }}>Comment</button>
          </form>
        )}
        <div className={s.list}>
          {comments.length === 0 ? <p className={s.empty}>No comments yet.</p> : comments.map((c) => (
            <div key={c.id} className={s.item}>
              <div className={s.itemHead}><span>{c.email || 'User'}</span></div>
              <p className={s.itemBody}>{c.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
    </>
  )
}