import { useMemo, useState } from 'react'
import {
  PRICING_MODELS, PRODUCT_SUBCATEGORIES, SERVICE_SUBCATEGORIES,
  SPEC_FIELDS, ALLOWED_PRICING_MODELS,
} from '../config/listing-config'
import { createListing } from '../services/firebase'
import { uploadImageToCloudinary } from '../utils/cloudinary'
import { useAuth } from '../context/AuthContext'
import { useViewer } from '../context/ViewerContext'
import s from '../styles/AddListingTab.module.css'

const MAX_IMAGES = 5

export default function AddListingTab({ onCreated }) {
  const { currentUser } = useAuth()
  const { guardViewer } = useViewer()
  const [type, setType] = useState('product')
  const [subcategory, setSubcategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [pricingModel, setPricingModel] = useState('once_off')
  const [specs, setSpecs] = useState({})
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const subcats = type === 'product' ? PRODUCT_SUBCATEGORIES : SERVICE_SUBCATEGORIES
  const allowedPricing = ALLOWED_PRICING_MODELS[type] || ['once_off']
  const pricingOptions = PRICING_MODELS.filter((p) => allowedPricing.includes(p.value))
  const fields = useMemo(() => SPEC_FIELDS[subcategory] || [], [subcategory])

  const switchType = (next) => {
    setType(next)
    setSubcategory('')
    setSpecs({})
    const allowed = ALLOWED_PRICING_MODELS[next] || ['once_off']
    setPricingModel(allowed[0])
  }

  const onSubChange = (val) => {
    setSubcategory(val)
    setSpecs({})
  }

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    if (images.length + files.length > MAX_IMAGES) {
      setError(`Max ${MAX_IMAGES} images`)
      return
    }
    setError('')
    setUploading(true)
    try {
      const uploaded = []
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue
        const url = await uploadImageToCloudinary(file, setProgress)
        uploaded.push(url)
      }
      setImages((prev) => [...prev, ...uploaded])
    } catch (err) {
      setError(err.message || 'Image upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (guardViewer()) return
    if (!currentUser) return
    setError('')
    setSuccess('')
    if (!title.trim() || !description.trim() || !subcategory || !price) {
      setError('Please fill in all required fields.')
      return
    }
    const numPrice = Number(price)
    if (Number.isNaN(numPrice) || numPrice < 0) {
      setError('Enter a valid price.')
      return
    }
    setBusy(true)
    try {
      await createListing({
        title: title.trim(),
        description: description.trim(),
        price: numPrice,
        pricingModel,
        type,
        category: type,
        subcategory,
        specs,
        images,
        imageUrl: images[0] || '',
        sellerId: currentUser.uid,
        sellerEmail: currentUser.email || '',
        moderationStatus: 'pending',
        archived: false,
        availability: 'available',
        featured: false,
        avgRating: 0,
        reviewCount: 0,
      })
      setSuccess('Listing submitted for review. It will go live once approved.')
      setTitle('')
      setDescription('')
      setPrice('')
      setSubcategory('')
      setSpecs({})
      setImages([])
      onCreated?.()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to create listing')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={s.form} onSubmit={handleSubmit}>
      <div className={s.section}>
        <h3 className={s.sectionTitle}>Listing type</h3>
        <div className={s.typeRow}>
          <button type="button" className={`${s.typeBtn} ${type === 'product' ? s.typeActive : ''}`} onClick={() => switchType('product')}>Product</button>
          <button type="button" className={`${s.typeBtn} ${type === 'service' ? s.typeActive : ''}`} onClick={() => switchType('service')}>Service</button>
        </div>
      </div>

      <div className={s.section}>
        <h3 className={s.sectionTitle}>Basics</h3>
        <div className={s.field}>
          <label className={s.label}>Category *</label>
          <select className={s.select} value={subcategory} onChange={(e) => onSubChange(e.target.value)} required>
            <option value="">Select category</option>
            {subcats.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className={s.field}>
          <label className={s.label}>Title *</label>
          <input className={s.input} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Clear, specific title" required />
        </div>
        <div className={s.field}>
          <label className={s.label}>Description *</label>
          <textarea className={s.textarea} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} placeholder="Condition, what’s included, pickup details…" required />
        </div>
        <div className={`${s.row} ${s.row2}`}>
          <div className={s.field}>
            <label className={s.label}>Price (ZAR) *</label>
            <input className={s.input} type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div className={s.field}>
            <label className={s.label}>Pricing model</label>
            <select className={s.select} value={pricingModel} onChange={(e) => setPricingModel(e.target.value)}>
              {pricingOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {fields.length > 0 && (
        <div className={s.section}>
          <h3 className={s.sectionTitle}>Details</h3>
          <div className={`${s.row} ${s.row2}`}>
            {fields.map((f) => (
              <div className={s.field} key={f.key}>
                <label className={s.label}>{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    className={s.select}
                    value={specs[f.key] || ''}
                    onChange={(e) => setSpecs((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  >
                    <option value="">Select</option>
                    {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input
                    className={s.input}
                    type={f.type === 'number' ? 'number' : 'text'}
                    placeholder={f.placeholder || ''}
                    value={specs[f.key] || ''}
                    onChange={(e) => setSpecs((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={s.section}>
        <h3 className={s.sectionTitle}>Photos</h3>
        <p className={s.hint}>Up to {MAX_IMAGES} images. First image is the cover.</p>
        <div className={s.previews}>
          {images.map((url, i) => (
            <div className={s.preview} key={url}>
              <img src={url} alt={`Upload ${i + 1}`} />
              <button type="button" className={s.removeImg} onClick={() => removeImage(i)} aria-label="Remove">✕</button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <label className={s.uploadBtn}>
              + Add
              <input className={s.fileInput} type="file" accept="image/*" multiple onChange={handleFiles} disabled={uploading} />
            </label>
          )}
        </div>
        {uploading && (
          <div className={s.progress}><div className={s.progressBar} style={{ width: `${progress}%` }} /></div>
        )}
      </div>

      {error && <div className={s.error}>{error}</div>}
      {success && <div className={s.success}>{success}</div>}

      <button className={s.submit} type="submit" disabled={busy || uploading}>
        {busy ? 'Submitting…' : 'Submit for review'}
      </button>
    </form>
  )
}
