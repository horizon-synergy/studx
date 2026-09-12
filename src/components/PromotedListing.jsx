import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPromotedListingSetting,
  getListingById,
  getPromotedPool,
} from "../services/firebase";
import { formatPrice } from "../config/listing-config";
import { getCloudinaryThumbnail } from "../utils/cloudinary";
import s from "../styles/PromotedListing.module.css";

const ROTATE_MS = 6000;

export default function PromotedListing() {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [adminSetting, pool] = await Promise.all([
          getPromotedListingSetting(),
          getPromotedPool(8),
        ]);
        let adminPinned = null;
        if (adminSetting?.listingId) {
          const data = await getListingById(adminSetting.listingId);
          if (
            data &&
            data.archived !== true &&
            data.moderationStatus !== "rejected"
          )
            adminPinned = data;
        }
        // Admin pin always shows first, Pro promo-week listings fill the rest.
        // Dedupe in case the admin pinned the same listing a Pro seller already has in the pool.
        const rest = pool.filter((l) => l.id !== adminPinned?.id);
        const combined = [adminPinned, ...rest].filter(Boolean);
        if (alive) setSlides(combined);
      } catch (err) {
        console.error(err);
        if (alive) setSlides([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      ROTATE_MS,
    );
    return () => clearInterval(timer);
  }, [slides.length]);

  if (loading) return <div className={s.skeleton} aria-hidden />;
  if (!slides.length) return null;

  const listing = slides[index];
  const img = listing.images?.[0] || listing.imageUrl || "";
  const thumb = img ? getCloudinaryThumbnail(img, 900, 700) : "";

  return (
    <div className={s.wrapOuter}>
      <Link to={`/listing/${listing.id}`} className={s.wrap}>
        <div className={s.media}>
          {thumb ? (
            <img src={thumb} alt={listing.title} className={s.img} />
          ) : (
            <div className={s.placeholder}>◈</div>
          )}
        </div>
        <div className={s.body}>
          <span className={s.kicker}>Promoted</span>
          <h2 className={s.title}>{listing.title}</h2>
          {listing.description && (
            <p className={s.desc}>{listing.description}</p>
          )}
          <div className={s.row}>
            <span className={s.price}>
              {formatPrice(listing.price, listing.pricingModel)}
            </span>
            <span className={s.cta}>View listing →</span>
          </div>
        </div>
      </Link>
      {slides.length > 1 && (
        <div className={s.dots}>
          {slides.map((sl, i) => (
            <button
              key={sl.id}
              type="button"
              className={`${s.dot} ${i === index ? s.dotActive : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`Show promoted listing ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
