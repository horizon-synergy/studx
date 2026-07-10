// src/components/ListingCard.jsx
import { Link } from 'react-router-dom'
import { getCloudinaryThumbnail } from '../utils/cloudinary'
import s from '../styles/ListingCard.module.css'

function VerifiedIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
      style={{ display: 'block', flexShrink: 0 }}>
      <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.497 3.51 3.745 3.745 0 01-3.318 1.319 3.745 3.745 0 01-3.592 0 3.745 3.745 0 01-3.318-1.319 3.745 3.745 0 01-.497-3.51A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.497-3.51 3.745 3.745 0 013.318-1.319 3.745 3.745 0 013.592 0 3.745 3.745 0 013.318 1.319c.865.283 1.515.9 1.88 1.677A3.745 3.745 0 0121 12z"
        stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ListingCard({ listing }) {
  const {
    id, title, price, category, imageUrl, images,
    sellerName, sellerVerified,
    avgRating, reviewCount,
    tags, featured,
  } = listing

  const primaryImage = images?.[0] || imageUrl
  const thumb        = getCloudinaryThumbnail(primaryImage, 600, 450)

  return (
    <Link to={`/listing/${id}`} className={`${s.card} ${featured ? s.cardFeatured : ''}`}>

      {/* Image */}
      <div className={s.imageWrap}>
        <img src={thumb} alt={title} loading="lazy" className={s.image} />

        {/* Overlay badges */}
        <div className={s.badges}>
          <span className={`${s.catBadge} ${category === 'product' ? s.catProduct : s.catService}`}>
            {category === 'product' ? '📦' : '🛠'} {category}
          </span>
          {featured && <span className={s.featuredBadge}>⭐ Featured</span>}
        </div>

        {/* Multi-image count */}
        {images?.length > 1 && (
          <span className={s.imgCount}>1/{images.length}</span>
        )}
      </div>

      {/* Body */}
      <div className={s.body}>
        <h3 className={s.title}>{title}</h3>

        {/* Tags */}
        {tags?.length > 0 && (
          <div className={s.tagRow}>
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className={s.tag}>#{tag}</span>
            ))}
          </div>
        )}

        {/* Stars */}
        {avgRating > 0 && (
          <div className={s.ratingRow}>
            <span className={s.stars}>
              {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
            </span>
            <span className={s.ratingCount}>{avgRating} ({reviewCount})</span>
          </div>
        )}

        <div className={s.footer}>
          <span className={s.price}>R{Number(price).toFixed(2)}</span>
          {sellerName && (
            <span className={s.seller}>
              {sellerVerified && <VerifiedIcon />}
              <span className={s.sellerName}>{sellerName}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
