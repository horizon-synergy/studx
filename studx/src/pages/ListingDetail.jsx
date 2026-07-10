// src/pages/ListingDetail.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { getCloudinaryThumbnail } from '../utils/cloudinary'
import {
  getListingById, getUserProfile, getProfile,
  createOrder,
  getReviewsByListing, createReview, deleteReview,
  getCommentsByListing, createComment, deleteComment,
  getWishlist, addToWishlist, removeFromWishlist,
  getOrCreateChat,
} from '../services/firebase'
import s from '../styles/ListingDetail.module.css'

// ── Star picker ───────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']
  return (
    <div>
      <span className={s.starPrompt}>
        Your rating <span className={s.required}>*</span>
      </span>
      <div className={s.starRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={s.starBtn}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            <span className={(hover || value) >= n ? s.starFilled : s.starEmpty}>★</span>
          </button>
        ))}
        {(hover || value) > 0 && (
          <span className={s.ratingLabel}>{labels[hover || value]}</span>
        )}
      </div>
    </div>
  )
}

export default function ListingDetail() {
  const { id }          = useParams()
  const { currentUser } = useAuth()
  const { addToCart, isInCart } = useCart()
  const navigate        = useNavigate()

  const [listing,    setListing]    = useState(null)
  const [seller,     setSeller]     = useState(null)
  const [sellerExt,  setSellerExt]  = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  // Orders
  const [ordering,   setOrdering]   = useState(false)
  const [orderDone,  setOrderDone]  = useState(false)
  const [orderError, setOrderError] = useState('')

  // Wishlist
  const [wishlisted,   setWishlisted]   = useState(false)
  const [wishLoading,  setWishLoading]  = useState(false)

  // Image gallery
  const [activeImg, setActiveImg] = useState(0)

  // Reviews
  const [reviews,        setReviews]        = useState([])
  const [reviewRating,   setReviewRating]   = useState(0)
  const [reviewBody,     setReviewBody]     = useState('')
  const [reviewError,    setReviewError]    = useState('')
  const [reviewLoading,  setReviewLoading]  = useState(false)

  // Comments
  const [comments,       setComments]       = useState([])
  const [commentBody,    setCommentBody]    = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  // Tab
  const [tab, setTab] = useState('reviews')

  useEffect(() => {
    const load = async () => {
      try {
        const l = await getListingById(id)
        if (!l) { setError('Listing not found.'); setLoading(false); return }
        setListing(l)
        const [s_, se, r, c] = await Promise.all([
          getUserProfile(l.sellerId),
          getProfile(l.sellerId),
          getReviewsByListing(id),
          getCommentsByListing(id),
        ])
        setSeller(s_); setSellerExt(se)
        setReviews(r); setComments(c)
        if (currentUser) {
          const ids = await getWishlist(currentUser.uid)
          setWishlisted(ids.includes(id))
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load listing.')
      } finally { setLoading(false) }
    }
    load()
  }, [id, currentUser?.uid])

  const isOwner        = listing ? currentUser?.uid === listing.sellerId : false
  const alreadyReviewed = reviews.some((r) => r.authorId === currentUser?.uid)
  const inCart          = isInCart(id)

  const handleAddToCart = () => {
    if (!listing) return
    addToCart(listing)
  }

  const handlePlaceOrder = async () => {
    if (!currentUser) { navigate('/login', { state: { from: { pathname: `/listing/${id}` } } }); return }
    setOrdering(true); setOrderError('')
    try {
      await createOrder({
        buyerId:         currentUser.uid,
        sellerId:        listing.sellerId,
        listingId:       listing.id,
        listingTitle:    listing.title,
        listingPrice:    listing.price,
        listingImageUrl: listing.images?.[0] || listing.imageUrl,
      })
      setOrderDone(true)
    } catch (err) {
      console.error(err)
      setOrderError('Order failed. Please try again.')
    } finally { setOrdering(false) }
  }

  const handleWishlist = async () => {
    if (!currentUser) { navigate('/login', { state: { from: { pathname: `/listing/${id}` } } }); return }
    setWishLoading(true)
    try {
      if (wishlisted) { await removeFromWishlist(currentUser.uid, id); setWishlisted(false) }
      else            { await addToWishlist(currentUser.uid, id);    setWishlisted(true) }
    } catch (err) { console.error(err) }
    finally { setWishLoading(false) }
  }

  const handleStartChat = async () => {
    if (!currentUser) { navigate('/login', { state: { from: { pathname: `/listing/${id}` } } }); return }
    try {
      const chat = await getOrCreateChat(currentUser.uid, listing.sellerId, listing.id, listing.title)
      navigate(`/messages/${chat.id}`)
    } catch (err) { console.error('Failed to start chat:', err) }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!reviewRating) { setReviewError('Please select a star rating.'); return }
    if (!reviewBody.trim()) { setReviewError('Please write a review.'); return }
    setReviewLoading(true); setReviewError('')
    try {
      await createReview({
        listingId: id,
        authorId:  currentUser.uid,
        authorEmail: currentUser.email,
        rating: reviewRating,
        body:   reviewBody.trim(),
      })
      const updated = await getReviewsByListing(id)
      setReviews(updated)
      setReviewRating(0); setReviewBody('')
    } catch (err) {
      console.error(err)
      setReviewError('Failed to submit review.')
    } finally { setReviewLoading(false) }
  }

  const handleDeleteReview = async (reviewId) => {
    await deleteReview(reviewId)
    setReviews((prev) => prev.filter((r) => r.id !== reviewId))
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!commentBody.trim()) return
    setCommentLoading(true)
    try {
      await createComment({ listingId: id, authorId: currentUser.uid, authorEmail: currentUser.email, body: commentBody.trim() })
      const updated = await getCommentsByListing(id)
      setComments(updated); setCommentBody('')
    } catch (err) { console.error(err) }
    finally { setCommentLoading(false) }
  }

  const handleDeleteComment = async (commentId) => {
    await deleteComment(commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  const fmtDate = (ts) => ts?.toDate?.().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) || ''

  // ── Loading / error states ────────────────────────────
  if (loading) return (
    <main className={s.page}>
      <div className={s.skeleton}>
        <div className={s.skeletonImg} />
        <div className={s.skeletonBody}>
          {[90, 70, 50, 40].map((w, i) => (
            <div key={i} className={s.skeletonLine} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </main>
  )

  if (error || !listing) return (
    <main className={s.page}>
      <div className={s.notFound}>
        <span className={s.notFoundIcon}>😕</span>
        <p className={s.notFoundTitle}>{error || 'Listing not found.'}</p>
        <Link to="/" className={s.notFoundLink}>← Back to Marketplace</Link>
      </div>
    </main>
  )

  const images   = listing.images?.length ? listing.images : [listing.imageUrl].filter(Boolean)
  const sellerName = sellerExt?.displayName || seller?.email?.split('@')[0] || 'Unknown'
  const avgRating  = listing.avgRating || 0
  const reviewCount = listing.reviewCount || 0

  return (
    <main className={s.page}>
      <Link to="/" className={s.breadcrumb}>← Marketplace</Link>

      <div className={s.grid}>
        {/* ── Images ── */}
        <div>
          <div className={s.imageWrap}>
            <img
              src={getCloudinaryThumbnail(images[activeImg], 800, 800)}
              alt={listing.title}
              className={s.image}
            />
            {listing.featured && <span className={s.featuredBadge}>⭐ Featured</span>}
          </div>
          {images.length > 1 && (
            <div className={s.imageThumbs}>
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`${s.thumbBtn} ${activeImg === i ? s.thumbBtnActive : ''}`}
                >
                  <img src={getCloudinaryThumbnail(img, 120, 120)} alt={`View ${i + 1}`} className={s.thumbImg} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Details ── */}
        <div className={s.details}>
          <span className={`${s.categoryBadge} ${listing.category === 'product' ? s.categoryProduct : s.categoryService}`}>
            {listing.category === 'product' ? '📦 Product' : '🛠 Service'}
          </span>

          <h1 className={s.title}>{listing.title}</h1>

          {/* Tags */}
          {listing.tags?.length > 0 && (
            <div className={s.tagRow}>
              {listing.tags.map((t) => <span key={t} className={s.tag}>#{t}</span>)}
            </div>
          )}

          {/* Rating */}
          {avgRating > 0 && (
            <div className={s.avgRating}>
              <span className={s.avgRatingScore}>{avgRating}</span>
              <span className={s.avgRatingStars}>{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
              <span className={s.avgRatingCount}>({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
            </div>
          )}

          <div className={s.priceRow}>
            <span className={s.price}>R{Number(listing.price).toFixed(2)}</span>
          </div>

          <hr className={s.divider} />

          {listing.description && (
            <div>
              <p className={s.descLabel}>Description</p>
              <p className={s.description}>{listing.description}</p>
            </div>
          )}

          <hr className={s.divider} />

          {/* Seller */}
          <div className={s.seller}>
            <div className={s.sellerAvatar}>
              {sellerExt?.avatarUrl
                ? <img src={sellerExt.avatarUrl} alt={sellerName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : <span className={s.sellerAvatarText}>{sellerName[0]?.toUpperCase()}</span>
              }
            </div>
            <div>
              <span className={s.sellerLabel}>Sold by</span>
              <Link to={`/profile/${listing.sellerId}`} className={s.sellerEmail}>{sellerName}</Link>
              {listing.createdAt && <p className={s.listedDate}>Listed {fmtDate(listing.createdAt)}</p>}
            </div>
          </div>

          {/* CTA */}
          <div className={s.ctaSection}>
            {isOwner ? (
              <div className={s.bannerOwner}>
                <span className={s.bannerIcon}>✏️</span>
                <div>
                  <span className={s.bannerTitle}>This is your listing</span>
                  <Link to="/dashboard" className={s.bannerLink}>Manage in Dashboard →</Link>
                </div>
              </div>
            ) : orderDone ? (
              <div className={s.bannerSuccess}>
                <span className={s.bannerIcon}>✓</span>
                <div>
                  <span className={s.bannerTitle}>Order placed!</span>
                  <Link to="/dashboard" className={s.bannerLink}>Track in Dashboard →</Link>
                </div>
              </div>
            ) : (
              <>
                {orderError && <p className={s.orderError}>{orderError}</p>}
                <button onClick={handleAddToCart} disabled={inCart} className={s.buyBtn}>
                  {inCart ? '✓ Added to Cart' : 'Add to Cart'}
                </button>
                <button onClick={handlePlaceOrder} disabled={ordering} className={s.secondaryBtn}>
                  {ordering ? 'Placing order…' : 'Buy Directly'}
                </button>
                {currentUser && (
                  <button onClick={handleStartChat} className={s.msgSellerBtn}>
                    💬 Message Seller
                  </button>
                )}
                {!currentUser && <p className={s.loginHint}>Sign in to purchase or message the seller.</p>}
              </>
            )}

            {!isOwner && (
              <button
                onClick={handleWishlist}
                disabled={wishLoading}
                className={`${s.wishlistBtn} ${wishlisted ? s.wishlistBtnActive : ''}`}
              >
                {wishlisted ? '♥ Saved to Wishlist' : '♡ Save to Wishlist'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Reviews + Comments ── */}
      <div className={s.socialSection}>
        <div className={s.tabBar}>
          <button className={`${s.tab} ${tab === 'reviews' ? s.tabActive : ''}`} onClick={() => setTab('reviews')}>
            Reviews {reviews.length > 0 && `(${reviews.length})`}
          </button>
          <button className={`${s.tab} ${tab === 'comments' ? s.tabActive : ''}`} onClick={() => setTab('comments')}>
            Questions {comments.length > 0 && `(${comments.length})`}
          </button>
        </div>

        {tab === 'reviews' && (
          <div>
            <h2 className={s.sectionHeading}>Reviews</h2>

            {/* Review form */}
            {currentUser && !isOwner && !alreadyReviewed ? (
              <form onSubmit={handleReviewSubmit} className={s.commentForm}>
                <StarPicker value={reviewRating} onChange={setReviewRating} />
                {reviewError && <p className={s.reviewError}>{reviewError}</p>}
                <textarea
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="Share your experience with this listing…"
                  rows={3}
                  className={s.commentInput}
                />
                <button type="submit" disabled={reviewLoading} className={s.commentSubmitBtn}>
                  {reviewLoading ? 'Submitting…' : 'Post Review'}
                </button>
              </form>
            ) : currentUser && alreadyReviewed ? (
              <div className={s.alreadyReviewed}>✓ You've already reviewed this listing.</div>
            ) : !currentUser ? (
              <div className={s.signInPrompt}>
                <Link to="/login" className={s.signInPromptLink}>Sign in</Link> to leave a review.
              </div>
            ) : null}

            {/* Review list */}
            {reviews.length === 0 ? (
              <div className={s.emptyReviews}>No reviews yet. Be the first!</div>
            ) : (
              <div className={s.reviewList}>
                {reviews.map((r) => (
                  <div key={r.id} className={s.reviewCard}>
                    <div className={s.reviewHeader}>
                      <span className={s.reviewAuthor}>{r.authorEmail?.split('@')[0]}</span>
                      <span className={s.reviewDate}>{fmtDate(r.createdAt)}</span>
                    </div>
                    <div className={s.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                    <p className={s.reviewBody}>{r.body}</p>
                    {(currentUser?.uid === r.authorId) && (
                      <button onClick={() => handleDeleteReview(r.id)} className={s.deleteBtn}>Delete</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'comments' && (
          <div>
            <h2 className={s.sectionHeading}>Questions & Comments</h2>

            {currentUser ? (
              <form onSubmit={handleCommentSubmit} className={s.commentForm}>
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Ask the seller a question…"
                  rows={3}
                  className={s.commentInput}
                />
                <button type="submit" disabled={commentLoading || !commentBody.trim()} className={s.commentSubmitBtn}>
                  {commentLoading ? 'Posting…' : 'Post Comment'}
                </button>
              </form>
            ) : (
              <div className={s.signInPrompt}>
                <Link to="/login" className={s.signInPromptLink}>Sign in</Link> to ask a question.
              </div>
            )}

            {comments.length === 0 ? (
              <div className={s.emptyReviews}>No comments yet. Ask the seller a question!</div>
            ) : (
              <div className={s.reviewList}>
                {comments.map((c) => (
                  <div key={c.id} className={s.reviewCard}>
                    <div className={s.reviewHeader}>
                      <span className={s.reviewAuthor}>{c.authorEmail?.split('@')[0]}</span>
                      <span className={s.reviewDate}>{fmtDate(c.createdAt)}</span>
                    </div>
                    <p className={s.reviewBody}>{c.body}</p>
                    {(currentUser?.uid === c.authorId || currentUser?.uid === listing.sellerId) && (
                      <button onClick={() => handleDeleteComment(c.id)} className={s.deleteBtn}>Delete</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
