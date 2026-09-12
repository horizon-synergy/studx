import { useEffect, useRef } from 'react'
import { incrementAdClick, incrementAdImpression } from '../services/firebase'
import s from '../styles/AdBanner.module.css'

export default function AdBanner({ ad }) {
  const seen = useRef(false)

  useEffect(() => {
    if (!ad?.id || seen.current) return
    seen.current = true
    incrementAdImpression(ad.id).catch(() => {})
  }, [ad?.id])

  if (!ad) {
    return (
      <div className={s.banner}>
        <div className={s.fallback}>
          <span className={s.fallbackIcon}>◈</span>
          <span>Sponsored</span>
        </div>
      </div>
    )
  }

  const handleClick = () => {
    if (ad.id) incrementAdClick(ad.id).catch(() => {})
  }

  const content = (
    <>
      <div className={s.media}>
        {ad.imageUrl ? (
          <img src={ad.imageUrl} alt={ad.title || 'Sponsored'} className={s.img} loading="lazy" />
        ) : (
          <div className={s.fallback}>
            <span className={s.fallbackIcon}>◈</span>
          </div>
        )}
      </div>
      <div className={s.body}>
        <span className={s.label}>Sponsored</span>
        <span className={s.title}>{ad.title || 'Partner offer'}</span>
        {ad.ctaLabel && <span className={s.cta}>{ad.ctaLabel} →</span>}
      </div>
    </>
  )

  if (ad.linkUrl) {
    return (
      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={s.banner}
        onClick={handleClick}
      >
        {content}
      </a>
    )
  }

  return (
    <div className={s.banner} onClick={handleClick} role="presentation">
      {content}
    </div>
  )
}
