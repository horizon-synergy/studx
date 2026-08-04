// src/components/ListingCard.jsx
import { Link } from 'react-router-dom'
import { getCloudinaryThumbnail } from '../utils/cloudinary'
import { BadgeCheck, Package, Wrench, Star } from 'lucide-react'
import s from '../styles/ListingCard.module.css'

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
            {category === 'product' ? <Package size={10} /> : <Wrench size={10} />} {category}
          </span>
          {featured && <span className={s.featuredBadge}><Star size={10} fill="currentColor" /> Featured</span>}
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
              {Array.from({length: 5}, (_, i) => (
                <Star key={i} size={9} fill={i < Math.round(avgRating) ? '#f59e0b' : 'none'} color="#f59e0b" />
              ))}
            </span>
            <span className={s.ratingCount}>{avgRating} ({reviewCount})</span>
          </div>
        )}

        <div className={s.footer}>
          <span className={s.price}>R{Number(price).toFixed(2)}</span>
          {sellerName && (
            <span className={s.seller}>
              {sellerVerified && <BadgeCheck size={10} color="#16a34a" />}
              <span className={s.sellerName}>{sellerName}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
