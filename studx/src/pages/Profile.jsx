// src/pages/Profile.jsx
import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, Link }                       from 'react-router-dom'
import { useAuth }                               from '../context/AuthContext'
import { uploadImageToCloudinary }               from '../utils/cloudinary'
import { Camera, Loader, BadgeCheck, Package, Wrench, Star, ArrowLeft, Check, Search, Inbox, GraduationCap, X } from 'lucide-react'
import {
  getUserProfile, getProfile, upsertProfile,
  getListingsBySeller, getSellerRatingStats,
} from '../services/firebase'
import ListingCard from '../components/ListingCard'

function VerifiedBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.22rem',
      fontSize: '0.7rem', fontWeight: 700,
      padding: '0.2rem 0.55rem', borderRadius: 999,
      background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0',
    }}>
      <BadgeCheck size={11} />
      Verified Seller
    </span>
  )
}

const LISTING_FILTERS = [
  { label: 'All',         value: 'all',     icon: null },
  { label: 'Products',    value: 'product', icon: Package },
  { label: 'Services',    value: 'service', icon: Wrench },
]

export default function Profile() {
  const { uid }                           = useParams()
  const { currentUser, loading: authLoading } = useAuth()
  const isOwner                           = currentUser?.uid === uid

  const [userDoc,    setUserDoc]    = useState(null)
  const [profile,    setProfile]    = useState(null)
  const [listings,   setListings]   = useState([])
  const [stats,      setStats]      = useState({ avg: 0, total: 0 })
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [editing,    setEditing]    = useState(false)

  const [listingFilter, setListingFilter] = useState('all')
  const [listingSearch, setListingSearch] = useState('')

  const [displayName,     setDisplayName]     = useState('')
  const [bio,             setBio]             = useState('')
  const [university,      setUniversity]      = useState('')
  const [course,          setCourse]          = useState('')
  const [saving,          setSaving]          = useState(false)
  const [namePromptDismissed, setNamePromptDismissed] = useState(false)
  const [saveMsg,         setSaveMsg]         = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [bannerError, setBannerError] = useState('')

  const avatarInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  useEffect(() => {
    if (authLoading) return
    const load = async () => {
      setLoading(true); setFetchError('')
      try {
        const [uDoc, prof, lData, rData] = await Promise.all([
          getUserProfile(uid), getProfile(uid),
          getListingsBySeller(uid), getSellerRatingStats(uid),
        ])
        setUserDoc(uDoc); setProfile(prof)
        setListings(lData); setStats(rData)
        setDisplayName(prof?.displayName || '')
        setBio(prof?.bio || '')
        setUniversity(prof?.university || '')
        setCourse(prof?.course || '')
      } catch (err) {
        if (err.code === 'permission-denied') setFetchError('You do not have permission to view this profile.')
        else setFetchError('Failed to load profile.')
      } finally { setLoading(false) }
    }
    load()
  }, [uid, authLoading])

  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      const matchCat    = listingFilter === 'all' || l.category === listingFilter
      const matchSearch = !listingSearch || l.title.toLowerCase().includes(listingSearch.toLowerCase())
      return matchCat && matchSearch
    })
  }, [listings, listingFilter, listingSearch])

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await upsertProfile(uid, { displayName, bio, university, course })
      setProfile((p) => ({ ...p, displayName, bio, university, course }))
      setEditing(false); setSaveMsg('Saved!'); setTimeout(() => setSaveMsg(''), 3000)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return
    setAvatarUploading(true)
    try {
      const url = await uploadImageToCloudinary(file)
      await upsertProfile(uid, { avatarUrl: url })
      setProfile((p) => ({ ...p, avatarUrl: url }))
    } catch (err) { console.error(err) }
    finally { setAvatarUploading(false); if (avatarInputRef.current) avatarInputRef.current.value = '' }
  }

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setBannerError('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setBannerError('Image must be under 5MB.'); return }
    setBannerError('')
    setBannerUploading(true)
    try {
      const url = await uploadImageToCloudinary(file)
      await upsertProfile(uid, { bannerUrl: url })
      setProfile((p) => ({ ...p, bannerUrl: url }))
    } catch (err) {
      console.error(err)
      setBannerError('Upload failed. Please try again.')
    }
    finally { setBannerUploading(false); if (bannerInputRef.current) bannerInputRef.current.value = '' }
  }

  const starsDisplay = (n) => Array.from({length: 5}, (_, i) => <Star key={i} size={10} fill={i < Math.round(n) ? '#f59e0b' : 'none'} color="#f59e0b" />)

  const inputStyle = {
    width: '100%', padding: '0.6rem 0.875rem', fontSize: '0.875rem',
    fontFamily: 'var(--font-body)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none',
  }

  const page = { maxWidth: '52rem', margin: '0 auto', padding: '1rem 1rem 4rem' }
  const card = { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', marginTop: '1.25rem', boxShadow: 'var(--shadow-sm)' }

  if (authLoading || loading) return (
    <main style={page}>
      <div style={{ width: '1.5rem', height: '1.5rem', border: '2px solid var(--brand-blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '4rem auto' }} />
    </main>
  )

  if (fetchError) return (
    <main style={page}>
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '1rem' }}>{fetchError}</p>
        <Link to="/" style={{ color: 'var(--brand-blue)', fontSize: '0.875rem' }}><ArrowLeft size={12} /> Back to Marketplace</Link>
      </div>
    </main>
  )

  if (!userDoc) return (
    <main style={page}>
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '1rem' }}>User not found.</p>
        <Link to="/" style={{ color: 'var(--brand-blue)', fontSize: '0.875rem' }}><ArrowLeft size={12} /> Back</Link>
      </div>
    </main>
  )

  const name = profile?.displayName || 'Student'

  return (
    <main style={page}>

      {/* ── Header: banner + avatar ── */}
      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>

        {/* Banner */}
        <div
          style={{
            height: '7rem', borderRadius: 'var(--radius-xl)',
            overflow: 'hidden', position: 'relative',
            background: profile?.bannerUrl ? 'var(--bg-subtle)' : 'var(--brand-blue)',
            cursor: isOwner ? 'pointer' : 'default',
          }}
          onClick={() => isOwner && bannerInputRef.current?.click()}
        >
          {profile?.bannerUrl
            ? <img src={profile.bannerUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 75% 50%, rgba(250,204,21,0.18) 0%, transparent 65%)' }} />
          }
          {isOwner && (
            <div
              style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0)', transition: 'background 0.18s', fontSize: '0.78rem', fontWeight: 600, color: '#fff', pointerEvents: 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.38)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
            >
              {bannerUploading ? <><Loader size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Uploading…</> : <><Camera size={14} /> {profile?.bannerUrl ? 'Change banner' : 'Add banner'}</>}
            </div>
          )}
          <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: 'none' }} />
        </div>
        {bannerError && (
          <p style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {bannerError}
          </p>
        )}

        {/* Avatar */}
        <div style={{ position: 'absolute', bottom: '-2.75rem', left: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '5.25rem', height: '5.25rem', borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e40af, var(--brand-blue))',
                border: '3px solid var(--bg-page)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.625rem', fontWeight: 700, color: '#fff',
                textTransform: 'uppercase', overflow: 'hidden',
                cursor: isOwner ? 'pointer' : 'default',
                boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              }}
              onClick={() => isOwner && avatarInputRef.current?.click()}
            >
              {profile?.avatarUrl
                ? <img src={profile.avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : name[0]
              }
              {isOwner && (
                <div
                  style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.42)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                >
                  {avatarUploading ? <Loader size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Camera size={16} />}
                </div>
              )}
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
            {userDoc.verified && (
              <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '1.35rem', height: '1.35rem', background: '#22c55e', borderRadius: '50%', border: '2px solid var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={10} color="#fff" />
              </div>
            )}
          </div>
        </div>

        {/* Edit button */}
        {isOwner && (
          <button
            onClick={() => setEditing((e) => !e)}
            style={{
              position: 'absolute', bottom: '-2.75rem', right: 0,
              padding: '0.45rem 1.1rem', fontSize: '0.78rem', fontWeight: 600,
              fontFamily: 'var(--font-body)',
              border: '1px solid var(--border-color)', background: 'var(--bg-card)',
              color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            }}
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        )}
      </div>

      {/* Name + meta */}
      <div style={{ paddingLeft: '1.25rem', marginTop: '3.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.15rem,4vw,1.5rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', margin: 0 }}>
            {name}
          </h1>
          {userDoc.verified && <VerifiedBadge />}
        </div>
        {profile?.displayName && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>@{profile.displayName.replace(/\s+/g, '').toLowerCase()}</p>
        )}
        {(profile?.university || profile?.course) && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <GraduationCap size={12} /> {[profile.university, profile.course].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)', overflow: 'hidden',
        marginTop: '1.25rem', boxShadow: 'var(--shadow-sm)',
      }}>
        {[
          { value: listings.length,                  label: 'Listings' },
          { value: stats.avg > 0 ? stats.avg : '—',  label: 'Avg Rating', stars: stats.avg > 0 },
          { value: stats.total,                       label: 'Reviews' },
          { value: userDoc.verified ? <Check size={14} /> : '—',     label: 'Verified', green: userDoc.verified },
        ].map((stat, i) => (
          <div key={i} style={{ padding: '1rem 0.5rem', textAlign: 'center', borderRight: i < 3 ? '1px solid var(--border-color)' : 'none' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem,3vw,1.5rem)', fontWeight: 700, color: stat.green ? '#15803d' : 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {stat.value}
            </p>
            {stat.stars && <p style={{ fontSize: '0.6rem', color: '#f59e0b', letterSpacing: '1px', marginTop: '0.1rem' }}>{starsDisplay(stats.avg)}</p>}
            <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.3rem' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Name prompt banner */}
      {isOwner && !profile?.displayName && !namePromptDismissed && (
        <div style={{ ...card, background: '#fef9c3', borderColor: '#fde047', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#854d0e', marginBottom: '0.2rem' }}>Set your display name</p>
            <p style={{ fontSize: '0.78rem', color: '#a16207', lineHeight: 1.5 }}>Please add your name so others can recognise you on StudX. Edit your profile below.</p>
          </div>
          <button
            onClick={() => { setEditing(true); setNamePromptDismissed(true) }}
            style={{ background: '#eab308', color: '#fff', border: 'none', padding: '0.45rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Edit Profile
          </button>
          <button
            onClick={() => setNamePromptDismissed(true)}
            style={{ background: 'transparent', border: 'none', color: '#a16207', cursor: 'pointer', padding: '0.25rem', lineHeight: 1 }}
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Edit form */}
      {editing && isOwner && (
        <div style={card}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Display Name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Bio</label>
              <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell other students about yourself…" style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>University</label>
                <input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g. UCT" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Course</label>
                <input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. BSc CS" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="submit" disabled={saving}
                style={{ background: 'var(--brand-blue)', color: '#fff', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'var(--font-body)', padding: '0.65rem 1.5rem', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
              <button type="button" onClick={() => setEditing(false)}
                style={{ background: 'transparent', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.875rem', fontFamily: 'var(--font-body)', padding: '0.65rem 1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                Cancel
              </button>
              {saveMsg && <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 500 }}><Check size={12} /> {saveMsg}</span>}
            </div>
          </form>
        </div>
      )}

      {/* Bio */}
      {profile?.bio && !editing && (
        <div style={card}>
          <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>About</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{profile.bio}</p>
        </div>
      )}

      {/* Listings with filter */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {isOwner ? 'My Listings' : `${name}'s Listings`}
            <span style={{ fontWeight: 400, marginLeft: '0.375rem' }}>({filteredListings.length}{listingFilter !== 'all' || listingSearch ? ` of ${listings.length}` : ''})</span>
          </p>
        </div>

        {listings.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '10rem' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem', color: 'var(--text-muted)', pointerEvents: 'none' }}><Search size={12} /></span>
              <input
                value={listingSearch} onChange={(e) => setListingSearch(e.target.value)}
                placeholder="Search listings…"
                style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.45rem 0.75rem 0.45rem 2rem' }}
              />
            </div>
            {LISTING_FILTERS.map((f) => (
              <button key={f.value} onClick={() => setListingFilter(f.value)}
                style={{
                  padding: '0.4rem 0.875rem', fontSize: '0.75rem', fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                  border: `1px solid ${listingFilter === f.value ? 'var(--brand-blue)' : 'var(--border-color)'}`,
                  borderRadius: 999,
                  background: listingFilter === f.value ? 'var(--brand-blue)' : 'var(--bg-card)',
                  color: listingFilter === f.value ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms',
                }}>
                {f.icon && <f.icon size={12} />} {f.label}
              </button>
            ))}
          </div>
        )}

        {filteredListings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            {listings.length === 0 ? (
              <><div style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}><Inbox size={32} /></div><p style={{ fontWeight: 500 }}>No listings yet.</p></>
            ) : (
              <><div style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}><Search size={24} /></div><p>No listings match your filter.</p></>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(12.5rem, 1fr))', gap: '1rem' }}>
            {filteredListings.map((l) => (
              <ListingCard key={l.id} listing={{ ...l, sellerName: name, sellerVerified: userDoc.verified }} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
