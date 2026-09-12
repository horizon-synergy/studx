import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  getProfile, upsertProfile, getListingsBySeller, getSellerRatingStats, getUserProfile,
  buildWhatsAppLink,
} from '../services/firebase'
import { uploadImageToCloudinary } from '../utils/cloudinary'
import { useAuth } from '../context/AuthContext'
import ListingCard from '../components/ListingCard'
import StudentBadge from '../components/StudentBadge'
import s from '../styles/Profile.module.css'

export default function Profile() {
  const { uid } = useParams()
  const { currentUser } = useAuth()
  const isOwn = currentUser?.uid === uid

  const [profile, setProfile] = useState(null)
  const [userDoc, setUserDoc] = useState(null)
  const [listings, setListings] = useState([])
  const [stats, setStats] = useState({ avg: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const [p, listingsData, rating, u] = await Promise.all([
          getProfile(uid),
          getListingsBySeller(uid),
          getSellerRatingStats(uid),
          getUserProfile(uid),
        ])
        if (!alive) return
        setProfile(p)
        setUserDoc(u)
        setDisplayName(p?.displayName || '')
        setBio(p?.bio || '')
        setAvatarUrl(p?.avatarUrl || '')
        setWhatsappNumber(p?.whatsappNumber || '')
        setStats(rating)
        setListings(listingsData.filter((l) => l.archived !== true && (l.moderationStatus === undefined || l.moderationStatus === 'approved')))
      } catch (err) {
        console.error(err)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [uid])

  const save = async () => {
    setBusy(true)
    try {
      await upsertProfile(uid, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl,
        whatsappNumber: whatsappNumber.trim(),
      })
      setProfile((prev) => ({
        ...(prev || {}),
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl,
        whatsappNumber: whatsappNumber.trim(),
      }))
      setEditing(false)
    } catch (err) {
      console.error(err)
      alert('Could not save profile')
    } finally {
      setBusy(false)
    }
  }

  const onAvatar = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const url = await uploadImageToCloudinary(file)
      setAvatarUrl(url)
    } catch (err) {
      alert(err.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className={s.loading}><div className={s.spinner} /></div>

  const name = profile?.displayName || currentUser?.email?.split('@')[0] || 'Student'
  const initial = (name || 'S')[0].toUpperCase()
  const waLink = !isOwn && profile?.whatsappNumber
    ? buildWhatsAppLink(profile.whatsappNumber, `Hi ${name}, I saw your listings on StudX and wanted to chat.`)
    : null

  return (
  <>
    <div className={s.page}>
      <div className={s.hero}>
        <div className={s.avatar}>
          {avatarUrl || profile?.avatarUrl ? <img src={avatarUrl || profile.avatarUrl} alt="" /> : initial}
        </div>
        <div className={s.info}>
          <h1 className={s.name}>
            {editing ? 'Edit profile' : name}
            {userDoc?.verified && <span className={s.verified}>✓ Verified</span>}
            {!editing && <StudentBadge status={userDoc?.studentVerificationStatus} />}
          </h1>
          {!editing && (
            <>
              {profile?.bio && <p className={s.bio}>{profile.bio}</p>}
              <div className={s.stats}>
                <span className={s.stat}><strong>{listings.length}</strong> listings</span>
                <span className={s.stat}>
                  <strong>{stats.total > 0 ? `★ ${stats.avg}` : '—'}</strong>
                  {stats.total > 0 ? ` (${stats.total} reviews)` : ' no reviews yet'}
                </span>
              </div>
            </>
          )}
          {isOwn && !editing && (
            <div className={s.actions}>
              <button type="button" className={s.btn} onClick={() => setEditing(true)}>Edit profile</button>
            </div>
          )}
          {!isOwn && waLink && (
            <div className={s.actions}>
              
                <a href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className={s.btn}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
              >
                Message on WhatsApp
              </a>
            </div>
          )}
          {isOwn && editing && (
            <div className={s.editForm}>
              <input className={s.input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" maxLength={40} />
              <textarea className={s.textarea} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio" maxLength={280} />
              <input
                className={s.input}
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="WhatsApp number, e.g. +27821234567"
              />
              <label className={s.btn} style={{ display: 'inline-flex', width: 'fit-content', cursor: 'pointer' }}>
                Change avatar
                <input type="file" accept="image/*" hidden onChange={onAvatar} />
              </label>
              <div className={s.actions}>
                <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
                <button type="button" className={s.btn} onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <h2 className={s.sectionTitle}>Listings</h2>
      {listings.length === 0 ? (
        <div className={s.empty}>No public listings yet.</div>
      ) : (
        <div className={s.grid}>
          {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  </>
  )
}