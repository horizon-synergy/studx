// src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate }           from 'react-router-dom'
import { useAuth }                     from '../context/AuthContext'
import { uploadImageToCloudinary }     from '../utils/cloudinary'
import { Check, Package, Wrench, X, Image, Inbox, Star, ShoppingCart, AlertTriangle, Loader } from 'lucide-react'
import CouponsTab                      from '../components/CouponsTab'
import {
  createListing, getListingsBySeller, getListingById,
  deleteListing, updateListing,
  getOrdersByBuyer, getOrdersBySeller,
  acceptOrder, declineOrder, fulfillOrder, confirmReceipt, raiseDispute,
} from '../services/firebase'
import s from '../styles/Dashboard.module.css'

const TABS = ['Add Listing', 'My Listings', 'Orders', 'Coupons']

export default function Dashboard() {
  const { currentUser, extProfile } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Add Listing')
  const [namePromptDismissed, setNamePromptDismissed] = useState(false)

  return (
    <main className={s.page}>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>Dashboard</h1>
        {currentUser?.email && (
          <p className={s.pageEmail}>Welcome back</p>
        )}
      </div>

      {!extProfile?.displayName && !namePromptDismissed && (
        <div className={s.card} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#fef9c3', borderColor: '#fde047' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#854d0e', marginBottom: '0.2rem' }}>Set your display name</p>
            <p style={{ fontSize: '0.78rem', color: '#a16207', lineHeight: 1.5 }}>Please add your name so others can recognise you on StudX.</p>
          </div>
          <button
            onClick={() => navigate(`/profile/${currentUser?.uid}`)}
            style={{ background: '#eab308', color: '#fff', border: 'none', padding: '0.45rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Go to Profile
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

      <div className={s.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${s.tab} ${activeTab === tab ? s.tabActive : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Add Listing'  && <AddListingTab uid={currentUser?.uid} />}
      {activeTab === 'My Listings'  && <MyListingsTab uid={currentUser?.uid} />}
      {activeTab === 'Orders'       && <OrdersTab     uid={currentUser?.uid} />}
      {activeTab === 'Coupons'      && <CouponsTab    uid={currentUser?.uid} />}
    </main>
  )
}

// ═══════════════════════════════════════════════════════
// ADD LISTING
// ═══════════════════════════════════════════════════════

const MAX_IMAGES = 5

function AddListingTab({ uid }) {
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [price,       setPrice]       = useState('')
  const [category,    setCategory]    = useState('product')
  const [tags,        setTags]        = useState([])
  const [tagInput,    setTagInput]    = useState('')
  const [imageFile,   setImageFile]   = useState(null)
  const [imagePreview,setImagePreview]= useState(null)
  const [progress,    setProgress]    = useState(0)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please select an image file.')
    if (file.size > 5 * 1024 * 1024)    return setError('Image must be under 5MB.')
    setError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setProgress(0)
    if (fileRef.current) fileRef.current.value = ''
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').slice(0, 24)
    if (t && !tags.includes(t) && tags.length < 5) { setTags((p) => [...p, t]) }
    setTagInput('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!imageFile) return setError('Please add an image.')
    setSubmitting(true)
    try {
      const imageUrl = await uploadImageToCloudinary(imageFile, setProgress)
      await createListing({
        title: title.trim(), description: description.trim(),
        price: parseFloat(price), category, imageUrl,
        images: [imageUrl], tags, sellerId: uid,
        avgRating: 0, reviewCount: 0, featured: false,
      })
      setTitle(''); setDescription(''); setPrice('')
      setCategory('product'); setTags([]); setTagInput('')
      removeImage()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setError(err.message || 'Failed to create listing.')
    } finally {
      setSubmitting(false); setProgress(0)
    }
  }

  return (
    <div className={s.card}>
      <h2 className={s.cardTitle}>New Listing</h2>
      {success && <div className={s.successBanner}><Check size={14} /> Listing published!</div>}
      {error   && <div className={s.errorBanner}>{error}</div>}

      <form onSubmit={handleSubmit} className={s.form}>
        <div className={s.field}>
          <label className={s.label}>Title <span className={s.req}>*</span></label>
          <input required maxLength={80} value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you selling?" className={s.input} />
          <span className={s.charCount}>{title.length}/80</span>
        </div>

        <div className={s.field}>
          <label className={s.label}>Category</label>
          <div className={s.catRow}>
            {['product', 'service'].map((c) => (
              <button key={c} type="button"
                onClick={() => setCategory(c)}
                className={`${s.catBtn} ${category === c ? s.catBtnActive : ''}`}>
                {c === 'product' ? <><Package size={14} /> Product</> : <><Wrench size={14} /> Service</>}
              </button>
            ))}
          </div>
        </div>

        <div className={s.field}>
          <label className={s.label}>Price (R) <span className={s.req}>*</span></label>
          <div className={s.prefixWrap}>
            <span className={s.prefix}>R</span>
            <input required type="number" min="0" step="0.01"
              value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00" className={`${s.input} ${s.inputPrefixed}`} />
          </div>
        </div>

        <div className={s.field}>
          <label className={s.label}>Description <span className={s.req}>*</span></label>
          <textarea required rows={4} maxLength={500}
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your item — condition, details, availability…"
            className={s.textarea} />
          <span className={s.charCount}>{description.length}/500</span>
        </div>

        {/* Tags */}
        <div className={s.field}>
          <label className={s.label}>Tags <span className={s.labelNote}>(optional, max 5 — helps buyers find you)</span></label>
          <div className={s.tagPills}>
            {tags.map((t) => (
              <span key={t} className={s.tagPill}>
                {t}
                <button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))} className={s.tagRemove}>×</button>
              </span>
            ))}
          </div>
          <div className={s.tagRow}>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
              placeholder="e.g. textbook, maths, second-hand…"
              className={s.input}
              disabled={tags.length >= 5}
            />
            <button type="button" onClick={addTag}
              disabled={!tagInput.trim() || tags.length >= 5}
              className={s.tagAddBtn}>Add</button>
          </div>
          <span className={s.charCount}>{tags.length}/5</span>
        </div>

        {/* Image */}
        <div className={s.field}>
          <label className={s.label}>Image <span className={s.req}>*</span></label>
          {imagePreview ? (
            <div className={s.previewWrap}>
              <img src={imagePreview} alt="Preview" className={s.previewImg} />
              <button type="button" onClick={removeImage} className={s.removeImg}><X size={12} /></button>
              {submitting && (
                <div className={s.uploadOverlay}>
                  <div className={s.progressBar}><div className={s.progressFill} style={{ width: `${progress}%` }} /></div>
                  <span className={s.uploadText}>{progress}%</span>
                </div>
              )}
            </div>
          ) : (
            <label htmlFor="listing-img" className={s.dropZone}>
              <span className={s.dropIcon}><Image size={24} /></span>
              <span className={s.dropLabel}>Click to upload</span>
              <span className={s.dropHint}>JPG, PNG, WEBP — max 5MB</span>
            </label>
          )}
          <input id="listing-img" ref={fileRef} type="file" accept="image/*"
            onChange={handleFile} style={{ display: 'none' }} />
        </div>

        <button type="submit" disabled={submitting} className={s.submitBtn}>
          {submitting ? `Uploading… ${progress}%` : 'Publish Listing'}
        </button>
      </form>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// MY LISTINGS — with edit modal
// ═══════════════════════════════════════════════════════

function MyListingsTab({ uid }) {
  const [listings,   setListings]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [deleting,   setDeleting]   = useState(null)
  const [editListing, setEditListing] = useState(null)
  const [editTitle,  setEditTitle]  = useState('')
  const [editDesc,   setEditDesc]   = useState('')
  const [editPrice,  setEditPrice]  = useState('')
  const [editImages, setEditImages] = useState([])
  const [saving,     setSaving]     = useState(false)
  const [saveError,  setSaveError]  = useState('')
  const [uploadStatus, setUploadStatus] = useState('')
  const addImgRef = useRef(null)

  useEffect(() => {
    getListingsBySeller(uid)
      .then(setListings).catch(console.error)
      .finally(() => setLoading(false))
  }, [uid])

  const openEdit = (l) => {
    setEditListing(l)
    setEditTitle(l.title)
    setEditDesc(l.description || '')
    setEditPrice(String(l.price))
    setSaveError('')
    const imgs = l.images?.length
      ? l.images.map((src) => ({ src, isNew: false }))
      : l.imageUrl ? [{ src: l.imageUrl, isNew: false }] : []
    setEditImages(imgs)
  }

  const closeEdit = () => {
    editImages.forEach((img) => { if (img.isNew && img.src.startsWith('blob:')) URL.revokeObjectURL(img.src) })
    setEditListing(null)
    setEditImages([])
  }

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files || [])
    const remaining = MAX_IMAGES - editImages.length
    const toAdd = files.slice(0, remaining).filter((f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024)
    setEditImages((prev) => [...prev, ...toAdd.map((f) => ({ src: URL.createObjectURL(f), file: f, isNew: true }))])
    if (addImgRef.current) addImgRef.current.value = ''
  }

  const removeImg = (idx) => {
    setEditImages((prev) => {
      const img = prev[idx]
      if (img.isNew && img.src.startsWith('blob:')) URL.revokeObjectURL(img.src)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleSave = async () => {
    setSaveError('')
    if (!editTitle.trim())                          return setSaveError('Title is required.')
    if (!editPrice || isNaN(parseFloat(editPrice))) return setSaveError('Price is required.')
    if (editImages.length === 0)                    return setSaveError('At least one image is required.')
    setSaving(true)
    try {
      const finalUrls = []
      const newImgs   = editImages.filter((x) => x.isNew)
      let   uploaded  = 0
      for (const img of editImages) {
        if (img.isNew && img.file) {
          uploaded++
          setUploadStatus(`Uploading image ${uploaded} of ${newImgs.length}…`)
          finalUrls.push(await uploadImageToCloudinary(img.file))
        } else {
          finalUrls.push(img.src)
        }
      }
      setUploadStatus('Saving…')
      const updates = {
        title: editTitle.trim(), description: editDesc.trim(),
        price: parseFloat(editPrice),
        images: finalUrls, imageUrl: finalUrls[0],
      }
      await updateListing(editListing.id, updates)
      setListings((prev) => prev.map((l) => l.id === editListing.id ? { ...l, ...updates } : l))
      closeEdit()
    } catch (_) {
      setSaveError('Failed to save. Please try again.')
    } finally {
      setSaving(false); setUploadStatus('')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return
    setDeleting(id)
    try {
      await deleteListing(id)
      setListings((prev) => prev.filter((l) => l.id !== id))
    } catch (err) { console.error(err) }
    finally { setDeleting(null) }
  }

  if (loading) return <Spinner />
  if (!listings.length) return <Empty icon={Inbox} title="No listings yet" msg="Add your first listing above." />

  return (
    <>
      <div className={s.listingsList}>
        {listings.map((l) => {
          const thumb = l.images?.[0] || l.imageUrl
          return (
            <div key={l.id} className={s.listingRow}>
              <div className={s.listingThumb}>
                {thumb && <img src={thumb} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div className={s.listingInfo}>
                <p className={s.listingTitle}>{l.title}</p>
                <p className={s.listingPrice}>R{Number(l.price).toFixed(2)}</p>
                <span className={`${s.catTag} ${l.category === 'product' ? s.tagProduct : s.tagService}`}>
                  {l.category}
                </span>
                {l.avgRating > 0 && (
                  <span className={s.ratingPill}><Star size={10} fill="currentColor" /> {l.avgRating} ({l.reviewCount})</span>
                )}
              </div>
              <div className={s.listingActions}>
                <button onClick={() => openEdit(l)} className={s.btnEdit}>Edit</button>
                <button onClick={() => handleDelete(l.id)} disabled={deleting === l.id} className={s.btnDelete}>
                  {deleting === l.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit modal */}
      {editListing && (
        <div className={s.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) closeEdit() }}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>Edit Listing</h2>
              <button onClick={closeEdit} className={s.modalClose}><X size={12} /></button>
            </div>
            <div className={s.modalBody}>
              {saveError && <div className={s.errorBanner}>{saveError}</div>}
              <div className={s.field}>
                <label className={s.label}>Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={80} className={s.input} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Description</label>
                <textarea rows={4} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} maxLength={500} className={s.textarea} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Price (R)</label>
                <div className={s.prefixWrap}>
                  <span className={s.prefix}>R</span>
                  <input type="number" min="0" step="0.01" value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className={`${s.input} ${s.inputPrefixed}`} />
                </div>
              </div>
              <div className={s.field}>
                <label className={s.label}>Images ({editImages.length}/{MAX_IMAGES})</label>
                <div className={s.imgGrid}>
                  {editImages.map((img, idx) => (
                    <div key={idx} className={s.imgThumb}>
                      <img src={img.src} alt={`img ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {idx === 0 && <span className={s.imgMain}>Main</span>}
                      <button type="button" onClick={() => removeImg(idx)} className={s.imgRemove}><X size={12} /></button>
                    </div>
                  ))}
                  {editImages.length < MAX_IMAGES && (
                    <label className={s.imgAdd}>
                      <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>+</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Add photo</span>
                      <input ref={addImgRef} type="file" accept="image/*" multiple onChange={handleAddImages} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>
              </div>
            </div>
            <div className={s.modalFooter}>
              {uploadStatus && <span className={s.uploadStatus}>{uploadStatus}</span>}
              <button onClick={closeEdit} disabled={saving} className={s.btnCancel}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className={s.btnSave}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════
// ORDERS — Buying + Selling tabs with full lifecycle
// ═══════════════════════════════════════════════════════

const ORDER_STATUS_LABELS = {
  pending_seller: { label: 'Awaiting seller',  color: '#d97706', bg: '#fefce8', border: '#fde68a' },
  accepted:       { label: 'Accepted',          color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  fulfilled:      { label: 'Delivered',         color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  confirmed:      { label: 'Receipt confirmed', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  completed:      { label: 'Completed',         color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  declined:       { label: 'Declined',          color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  disputed:       { label: 'Disputed',          color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

function StatusPill({ status }) {
  const s_ = ORDER_STATUS_LABELS[status] || { label: status, color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' }
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 600,
      padding: '0.2rem 0.6rem', borderRadius: 999,
      color: s_.color, background: s_.bg, border: `1px solid ${s_.border}`,
      whiteSpace: 'nowrap',
    }}>
      {s_.label}
    </span>
  )
}

function OrdersTab({ uid }) {
  const [tab,        setTab]        = useState('buying')
  const [buyOrders,  setBuyOrders]  = useState([])
  const [sellOrders, setSellOrders] = useState([])
  const [listings,   setListings]   = useState({})
  const [loading,    setLoading]    = useState(true)
  const [acting,     setActing]     = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [bought, sold] = await Promise.all([
          getOrdersByBuyer(uid),
          getOrdersBySeller(uid),
        ])
        setBuyOrders(bought)
        setSellOrders(sold)
        const allIds = [...new Set([...bought, ...sold].map((o) => o.listingId).filter(Boolean))]
        const results = await Promise.all(allIds.map((id) => getListingById(id).catch(() => null)))
        const cache = {}
        allIds.forEach((id, i) => { if (results[i]) cache[id] = results[i] })
        setListings(cache)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [uid])

  const act = async (fn, orderId, updateFn) => {
    setActing(orderId)
    try {
      await fn(orderId, uid)
      setBuyOrders((p) => p.map((o) => o.id === orderId ? updateFn(o) : o))
      setSellOrders((p) => p.map((o) => o.id === orderId ? updateFn(o) : o))
    } catch (err) { console.error(err) }
    finally { setActing(null) }
  }

  if (loading) return <Spinner />

  const orders = tab === 'buying' ? buyOrders : sellOrders

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'buying',  label: `Buying (${buyOrders.length})`  },
          { key: 'selling', label: `Selling (${sellOrders.length})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`${s.tab} ${tab === t.key ? s.tabActive : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <Empty
          icon={tab === 'buying' ? ShoppingCart : Package}
          title="No orders here"
          msg={tab === 'buying' ? 'Orders you place will appear here.' : 'Orders from buyers will appear here.'}
        />
      ) : (
        <div className={s.ordersList}>
          {orders.map((order) => {
            const listing = listings[order.listingId]
            const thumb   = listing?.images?.[0] || listing?.imageUrl
            const isBuyer  = tab === 'buying'
            const isSeller = tab === 'selling'

            return (
              <div key={order.id} className={s.orderCard}>
                {/* Thumbnail + title */}
                <div className={s.orderTop}>
                  {thumb && (
                    <img src={thumb} alt={listing?.title}
                      style={{ width: '3.5rem', height: '3.5rem', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className={s.orderTitle}>
                      {listing ? (
                        <Link to={`/listing/${order.listingId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {listing.title}
                        </Link>
                      ) : order.listingTitle || `Order #${order.id.slice(0, 8)}`}
                    </p>
                    <p className={s.orderMeta}>
                      {listing && <>R{Number(listing.price).toFixed(2)} · </>}
                      #{order.id.slice(0, 8)}
                      {order.createdAt && (
                        <> · {order.createdAt.toDate?.().toLocaleDateString('en-ZA', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}</>
                      )}
                    </p>
                  </div>
                  <StatusPill status={order.status} />
                </div>

                {/* Progress pips */}
                <div className={s.orderPips}>
                  {[
                    { label: 'Ordered',   done: true },
                    { label: 'Accepted',  done: order.sellerAccepted },
                    { label: 'Delivered', done: order.sellerConfirmed },
                    { label: 'Received',  done: order.buyerConfirmed },
                    { label: 'Complete',  done: order.status === 'completed' || order.paymentReleased },
                  ].map((pip, i) => (
                    <div key={i} className={s.pip}>
                      <div className={`${s.pipDot} ${pip.done ? s.pipDone : ''}`} />
                      <span className={s.pipLabel}>{pip.label}</span>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className={s.orderActions}>
                  {/* Seller actions */}
                  {isSeller && order.status === 'pending_seller' && (
                    <>
                      <button className={s.btnAccept}
                        disabled={acting === order.id}
                        onClick={() => act(acceptOrder, order.id, (o) => ({ ...o, status: 'accepted', sellerAccepted: true }))}>
                          {acting === order.id ? <Loader size={14} /> : <><Check size={14} /> Accept Order</>}
                      </button>
                      <button className={s.btnDecline}
                        disabled={acting === order.id}
                        onClick={() => act(declineOrder, order.id, (o) => ({ ...o, status: 'declined' }))}>
                        Decline
                      </button>
                    </>
                  )}
                  {isSeller && order.status === 'accepted' && (
                    <button className={s.btnFulfill}
                      disabled={acting === order.id}
                      onClick={() => act(fulfillOrder, order.id, (o) => ({ ...o, status: 'fulfilled', sellerConfirmed: true }))}>
                      {acting === order.id ? <Loader size={14} /> : <><Package size={14} /> Mark as Delivered</>}
                    </button>
                  )}

                  {/* Buyer actions */}
                  {isBuyer && order.status === 'fulfilled' && (
                    <button className={s.btnConfirm}
                      disabled={acting === order.id}
                      onClick={() => act(confirmReceipt, order.id, (o) => ({ ...o, status: 'confirmed', buyerConfirmed: true }))}>
                      {acting === order.id ? <Loader size={14} /> : <><Check size={14} /> Confirm I Received It</>}
                    </button>
                  )}

                  {/* Dispute — available to either party on active orders */}
                  {['pending_seller', 'accepted', 'fulfilled'].includes(order.status) && (
                    <button className={s.btnDispute}
                      disabled={acting === order.id}
                      onClick={() => {
                        if (!window.confirm('Raise a dispute? Admin will review this order.')) return
                        act(raiseDispute, order.id, (o) => ({ ...o, status: 'disputed', disputedBy: uid }))
                      }}>
                      <AlertTriangle size={14} /> Dispute
                    </button>
                  )}

                  {/* Status messages */}
                  {isSeller && order.status === 'confirmed' && !order.paymentReleased && (
                    <p className={s.orderNote}><Check size={12} /> Buyer confirmed receipt. Payment pending admin release.</p>
                  )}
                  {order.status === 'completed' && (
                    <p className={s.orderNote} style={{ color: 'var(--success-text)' }}><Check size={12} /> Order complete. Payment released.</p>
                  )}
                  {order.status === 'declined' && (
                    <p className={s.orderNote} style={{ color: 'var(--danger-text)' }}>This order was declined.</p>
                  )}
                  {order.status === 'disputed' && (
                    <p className={s.orderNote} style={{ color: 'var(--danger-text)' }}><AlertTriangle size={12} /> Dispute raised — admin reviewing.</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Shared UI ─────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <div style={{ width: '1.5rem', height: '1.5rem', border: '2px solid var(--brand-blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
}

function Empty({ icon: Icon, title, msg }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 1rem', textAlign: 'center', gap: '0.5rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>{Icon && <Icon size={40} />}</span>
      <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '20rem' }}>{msg}</p>
    </div>
  )
}
