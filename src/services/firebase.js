import { initializeApp } from 'firebase/app'
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  onAuthStateChanged, GoogleAuthProvider, signInWithRedirect, getRedirectResult,
} from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, collection, query, where, orderBy, serverTimestamp, increment, onSnapshot, limit, Timestamp, writeBatch } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'

const firebaseConfig = {
  apiKey: "AIzaSyD0dy7wsAOTPd7mg9BSq3XTYnzqAeGM_-8",
  authDomain: "stud-x.firebaseapp.com",
  projectId: "stud-x",
  storageBucket: "stud-x.firebasestorage.app",
  messagingSenderId: "436457947225",
  appId: "1:436457947225:web:a8fbc27056f52d7976b148",
  measurementId: "G-QPDENV094M"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)
export { doc, updateDoc, getDoc }

// ── Payments ──────────────────────────────────────────────
export const startYocoCheckout = async (checkoutId, kind = 'marketplace') => {
  const callable = httpsCallable(functions, 'createYocoCheckout')
  const { data } = await callable({ checkoutId, kind })
  return data
}
export const startPaystackCheckout = async (checkoutId) => {
  const callable = httpsCallable(functions, 'createPaystackCheckout')
  const { data } = await callable({ checkoutId })
  return data
}
export const listPaystackBanks = async () => {
  const callable = httpsCallable(functions, 'listPaystackBanks')
  const { data } = await callable()
  return data.banks
}
export const createPaystackSubaccount = async ({ businessName, bankCode, accountNumber }) => {
  const callable = httpsCallable(functions, 'createPaystackSubaccount')
  const { data } = await callable({ businessName, bankCode, accountNumber })
  return data
}
export const getSellerPayout = async (uid) => {
  const snap = await getDoc(doc(db, 'sellerPayouts', uid))
  return snap.exists() ? snap.data() : null
}
export const startProSubscriptionCheckout = async () => {
  const callable = httpsCallable(functions, 'createProSubscriptionCheckout')
  const { data } = await callable()
  return data
}
export const startFeaturedListingCheckout = async (listingId) => {
  const callable = httpsCallable(functions, 'createFeaturedListingCheckout')
  const { data } = await callable({ listingId })
  return data
}
export const getProSubscriptionStatus = async (uid) => {
  const snap = await getDoc(doc(db, 'proSubscriptions', uid))
  return snap.exists() ? snap.data() : null
}
export const getPromotedPool = async (max = 8) => {
  const now = Timestamp.now()
  const snap = await getDocs(query(
    collection(db, 'promotedPool'),
    where('promoWeekEnd', '>', now),
    orderBy('promoWeekEnd', 'desc'),
    limit(max)
  ))
  const entries = snap.docs.map((d) => d.data())
  const listings = []
  for (const entry of entries) {
    const lSnap = await getDoc(doc(db, 'listings', entry.listingId))
    if (lSnap.exists() && lSnap.data().archived !== true) listings.push({ id: lSnap.id, ...lSnap.data() })
  }
  return listings
}
export const getAllProSubscriptions = async () => {
  const snap = await getDocs(collection(db, 'proSubscriptions'))
  return snap.docs.map((d) => d.data())
}
export const getCommissionSettings = async () => {
  const snap = await getDoc(doc(db, 'settings', 'commission'))
  const defaults = { enabled: false, baseRate: 10, proRate: 7 }
  return snap.exists() ? { ...defaults, ...snap.data() } : defaults
}
export const updateCommissionSettings = (data) => setDoc(doc(db, 'settings', 'commission'), data, { merge: true })

// ── Vendors ───────────────────────────────────────────────
export const becomeVendor = async (uid, vendorData) => {
  await updateDoc(doc(db, 'users', uid), { role: 'vendor' })
  await upsertVendor(uid, {
    name: vendorData.name,
    description: vendorData.description || '',
    cuisineType: vendorData.cuisineType || '',
    location: vendorData.location || '',
    contactNumber: vendorData.contactNumber || '',
    active: true,
  })
}

// ── Student verification ─────────────────────────────────
export const isStudentEmail = (email) => /\.ac\.za$/i.test(String(email || '').trim())

export const submitStudentVerification = (uid, cardImageUrl) =>
  setDoc(doc(db, 'studentVerifications', uid), {
    uid,
    cardImageUrl,
    status: 'pending',
    submittedAt: serverTimestamp(),
  })

export const getMyStudentVerification = async (uid) => {
  const snap = await getDoc(doc(db, 'studentVerifications', uid))
  return snap.exists() ? snap.data() : null
}

export const getAllStudentVerifications = async () => {
  const snap = await getDocs(query(collection(db, 'studentVerifications'), where('status', '==', 'pending')))
  return snap.docs.map((d) => d.data())
}

export const reviewStudentVerification = async (uid, approve) => {
  await updateDoc(doc(db, 'studentVerifications', uid), {
    status: approve ? 'approved' : 'rejected',
    reviewedAt: serverTimestamp(),
  })
  if (approve) {
    await updateDoc(doc(db, 'users', uid), { studentVerificationStatus: 'verified' })
  }
}

export const backfillStudentVerification = async () => {
  const snap = await getDocs(collection(db, 'users'))
  const toFix = snap.docs.filter((d) => {
    const data = d.data()
    return data.isStudentEmail === undefined && isStudentEmail(data.email)
  })
  await Promise.all(toFix.map((d) => updateDoc(d.ref, {
    isStudentEmail: true,
    studentVerificationStatus: 'verified',
  })))
  return toFix.length
}

export const buildWhatsAppLink = (phoneNumber, message) => {
  const clean = String(phoneNumber || '').replace(/[^\d+]/g, '')
  if (!clean) return null
  const digits = clean.startsWith('+') ? clean.slice(1) : clean
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

// ── Auth ──────────────────────────────────────────────────
export const registerUser = async (email, password) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const { user } = credential
  const studentEmail = isStudentEmail(email)
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    role: 'user',
    isStudentEmail: studentEmail,
    studentVerificationStatus: studentEmail ? 'verified' : 'unverified',
    createdAt: serverTimestamp(),
  })
  await setDoc(doc(db, 'profiles', user.uid), { uid: user.uid, displayName: email.split('@')[0] || '', avatarUrl: '' }, { merge: true })
  return credential
}

export const loginUser = (email, password) => signInWithEmailAndPassword(auth, email, password)
export const logoutUser = () => signOut(auth)
export const subscribeToAuthChanges = (cb) => onAuthStateChanged(auth, cb)
export const googleProvider = new GoogleAuthProvider()

/**
 * signInWithRedirect + handleGoogleRedirectResult(), together.
 *
 * FIXED 2026-09-11: this pair was already written correctly, but
 * handleGoogleRedirectResult() was never actually called anywhere in the
 * app — signInWithGoogle() would kick off the redirect to Google fine,
 * but nothing on app load ever resolved the result when the browser came
 * back, so the Firestore user/profile docs never got created and the
 * sign-in never "finished" from the app's point of view. The fix is in
 * AuthContext.jsx, not here: handleGoogleRedirectResult() now runs once
 * in the initial useEffect, before/alongside subscribeToAuthChanges.
 *
 * signInWithRedirect avoids the popup+cross-window-storage dance that
 * signInWithPopup depends on, which silently breaks in browsers/extensions
 * that block third-party cookies — see git history on this function for
 * the original writeup.
 *
 * signInWithGoogle() only kicks off the redirect — there's no return
 * value here because the browser navigates away. The actual result is
 * handled by handleGoogleRedirectResult() below.
 */
export const signInWithGoogle = () => signInWithRedirect(auth, googleProvider)

/**
 * Call this ONCE, on app load — see AuthContext.jsx's initial useEffect.
 * After signInWithGoogle() redirects the browser to Google and back, this
 * is what actually completes the sign-in and creates the Firestore user/
 * profile docs for a brand-new account.
 *
 * Returns the UserCredential if a redirect sign-in just completed, or
 * null if the page just loaded normally (no pending redirect result).
 * Safe to call on every page load — it's a no-op when there's nothing to
 * resolve.
 */
export const handleGoogleRedirectResult = async () => {
  const result = await getRedirectResult(auth)
  if (!result) return null

  const { user } = result
  const existing = await getDoc(doc(db, 'users', user.uid))
  if (!existing.exists()) {
    const studentEmail = isStudentEmail(user.email)
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      role: 'user',
      isStudentEmail: studentEmail,
      studentVerificationStatus: studentEmail ? 'verified' : 'unverified',
      createdAt: serverTimestamp(),
    })
  }

  const profileSnap = await getDoc(doc(db, 'profiles', user.uid))
  const existingProfile = profileSnap.exists() ? profileSnap.data() : {}
  await setDoc(doc(db, 'profiles', user.uid), {
    uid: user.uid,
    displayName: existingProfile.displayName || user.displayName || user.email?.split('@')[0] || '',
    avatarUrl: existingProfile.avatarUrl || user.photoURL || '',
  }, { merge: true })

  return result
}

export const getUserProfile = async (uid) => { const snap = await getDoc(doc(db, 'users', uid)); return snap.exists() ? snap.data() : null }
export const getAllUsers = async () => { const snap = await getDocs(collection(db, 'users')); return snap.docs.map((d) => d.data()) }
export const setSellerVerified = (uid, verified) => updateDoc(doc(db, 'users', uid), { verified })
export const setUserRole = (uid, role) => updateDoc(doc(db, 'users', uid), { role })

export const getProfile = async (uid) => { const snap = await getDoc(doc(db, 'profiles', uid)); return snap.exists() ? snap.data() : null }
export const upsertProfile = (uid, data) => setDoc(doc(db, 'profiles', uid), { ...data, uid }, { merge: true })
export const getSellerRatingStats = async (sellerId) => {
  const listingSnap = await getDocs(query(collection(db, 'listings'), where('sellerId', '==', sellerId)))
  const ids = listingSnap.docs.map((d) => d.id)
  if (!ids.length) return { avg: 0, total: 0 }
  let allReviews = []
  for (let i = 0; i < ids.length; i += 30) {
    const chunk = ids.slice(i, i + 30)
    const rSnap = await getDocs(query(collection(db, 'reviews'), where('listingId', 'in', chunk)))
    allReviews = allReviews.concat(rSnap.docs.map((d) => d.data()))
  }
  if (!allReviews.length) return { avg: 0, total: 0 }
  const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
  return { avg: parseFloat(avg.toFixed(1)), total: allReviews.length }
}

// ── Listings ──────────────────────────────────────────────
export const createListing = (data) => addDoc(collection(db, 'listings'), { ...data, createdAt: serverTimestamp() })
export const getAllListings = async () => { const snap = await getDocs(query(collection(db, 'listings'), orderBy('createdAt', 'desc'))); return snap.docs.map((d) => ({ id: d.id, ...d.data() })) }
export const getApprovedListings = async () => {
  const snap = await getDocs(query(collection(db, 'listings'), where('moderationStatus', '==', 'approved'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((l) => l.archived !== true)
}
export const getAllListingsForFeed = async () => {
  const snap = await getDocs(query(collection(db, 'listings'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((l) => {
    if (l.archived === true) return false
    if (l.moderationStatus === undefined) return true
    return l.moderationStatus === 'approved'
  })
}
export const getPendingListings = async () => {
  const snap = await getDocs(query(collection(db, 'listings'), where('moderationStatus', '==', 'pending'), orderBy('createdAt', 'asc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
export const approveListing = async (listingId, adminUid) => {
  await updateDoc(doc(db, 'listings', listingId), { moderationStatus: 'approved', moderatedBy: adminUid, moderatedAt: serverTimestamp(), moderationNote: null })
  const snap = await getDoc(doc(db, 'listings', listingId)); const listing = snap.data()
  if (listing) await addDoc(collection(db, 'notifications'), { uid: listing.sellerId, type: 'listing_approved', title: 'Listing approved! ✓', body: `Your listing "${listing.title}" is now live on the marketplace.`, read: false, createdAt: serverTimestamp() })
}
export const rejectListing = async (listingId, adminUid, reason) => {
  await updateDoc(doc(db, 'listings', listingId), { moderationStatus: 'rejected', moderatedBy: adminUid, moderatedAt: serverTimestamp(), moderationNote: reason || 'Did not meet listing guidelines.' })
  const snap = await getDoc(doc(db, 'listings', listingId)); const listing = snap.data()
  if (listing) await addDoc(collection(db, 'notifications'), { uid: listing.sellerId, type: 'listing_rejected', title: 'Listing needs changes', body: `Your listing "${listing.title}" was not approved. Reason: ${reason || 'Did not meet guidelines.'}`, read: false, createdAt: serverTimestamp() })
}
export const backfillLegacyListings = async () => {
  const snap = await getDocs(collection(db, 'listings'))
  const toFix = snap.docs.filter((d) => d.data().moderationStatus === undefined)
  if (!toFix.length) return 0
  const chunks = []
  for (let i = 0; i < toFix.length; i += 450) chunks.push(toFix.slice(i, i + 450))
  for (const chunk of chunks) {
    const batch = writeBatch(db)
    chunk.forEach((d) => batch.update(d.ref, { moderationStatus: 'approved', moderatedBy: 'system_backfill', moderatedAt: serverTimestamp(), archived: d.data().archived ?? false, availability: d.data().availability ?? 'available' }))
    await batch.commit()
  }
  return toFix.length
}
export const getListingsBySeller = async (sellerId) => {
  const snap = await getDocs(query(collection(db, 'listings'), where('sellerId', '==', sellerId)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
}
export const getListingById = async (id) => { const snap = await getDoc(doc(db, 'listings', id)); return snap.exists() ? { id: snap.id, ...snap.data() } : null }
export const updateListing = (id, updates) => updateDoc(doc(db, 'listings', id), updates)
export const deleteListing = (id) => deleteDoc(doc(db, 'listings', id))
export const setListingFeatured = (id, featured) => updateDoc(doc(db, 'listings', id), { featured })
export const setListingAvailability = (id, availability) => updateDoc(doc(db, 'listings', id), { availability })

// ── Orders ────────────────────────────────────────────────
export const createOrder = async (data) => {
  const status = data.status || 'pending_seller'
  const paymentStatus = data.paymentStatus || (status === 'awaiting_payment' ? 'pending' : 'unpaid')
  const ref = await addDoc(collection(db, 'orders'), {
    ...data, status, paymentStatus,
    sellerAccepted: false, sellerConfirmed: false, buyerConfirmed: false, paymentReleased: false,
    statusHistory: [{ status, timestamp: Date.now(), by: data.buyerId }],
    createdAt: serverTimestamp(),
  })
  if (status !== 'awaiting_payment') {
    await addDoc(collection(db, 'notifications'), { uid: data.sellerId, type: 'new_order', title: 'New order received', body: `Someone ordered "${data.listingTitle || 'your listing'}"`, orderId: ref.id, read: false, createdAt: serverTimestamp() })
  }
  return ref
}
export const getOrdersByBuyer = async (buyerId) => { const snap = await getDocs(query(collection(db, 'orders'), where('buyerId', '==', buyerId))); return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)) }
export const getOrdersBySeller = async (sellerId) => { const snap = await getDocs(query(collection(db, 'orders'), where('sellerId', '==', sellerId))); return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)) }
export const getAllOrders = async () => { const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))); return snap.docs.map((d) => ({ id: d.id, ...d.data() })) }
const _appendHistory = (status, by) => ({ status, timestamp: Date.now(), by })
export const acceptOrder = async (orderId, sellerId) => {
  await updateDoc(doc(db, 'orders', orderId), { status: 'accepted', sellerAccepted: true, statusHistory: _appendHistory('accepted', sellerId) })
  const order = (await getDoc(doc(db, 'orders', orderId))).data()
  await addDoc(collection(db, 'notifications'), { uid: order.buyerId, type: 'order_accepted', title: 'Order accepted!', body: `Your order for "${order.listingTitle}" was accepted by the seller.`, orderId, read: false, createdAt: serverTimestamp() })
}
export const declineOrder = async (orderId, sellerId) => {
  await updateDoc(doc(db, 'orders', orderId), { status: 'declined', statusHistory: _appendHistory('declined', sellerId) })
  const order = (await getDoc(doc(db, 'orders', orderId))).data()
  await addDoc(collection(db, 'notifications'), { uid: order.buyerId, type: 'order_declined', title: 'Order declined', body: `The seller declined your order for "${order.listingTitle}".`, orderId, read: false, createdAt: serverTimestamp() })
}
export const fulfillOrder = async (orderId, sellerId) => {
  await updateDoc(doc(db, 'orders', orderId), { status: 'fulfilled', sellerConfirmed: true, statusHistory: _appendHistory('fulfilled', sellerId) })
  const order = (await getDoc(doc(db, 'orders', orderId))).data()
  await addDoc(collection(db, 'notifications'), { uid: order.buyerId, type: 'order_fulfilled', title: 'Order marked as delivered', body: `The seller says your order for "${order.listingTitle}" is delivered. Please confirm receipt.`, orderId, read: false, createdAt: serverTimestamp() })
}
export const confirmReceipt = async (orderId, buyerId) => {
  await updateDoc(doc(db, 'orders', orderId), { status: 'confirmed', buyerConfirmed: true, statusHistory: _appendHistory('confirmed', buyerId) })
  const order = (await getDoc(doc(db, 'orders', orderId))).data()
  await addDoc(collection(db, 'notifications'), { uid: order.sellerId, type: 'order_confirmed', title: 'Buyer confirmed receipt', body: `The buyer confirmed receipt for "${order.listingTitle}". Payment is pending release.`, orderId, read: false, createdAt: serverTimestamp() })
}
export const raiseDispute = async (orderId, raisedBy) => { await updateDoc(doc(db, 'orders', orderId), { status: 'disputed', disputedBy: raisedBy, statusHistory: _appendHistory('disputed', raisedBy) }) }
export const releasePayment = async (orderId, adminId) => {
  await updateDoc(doc(db, 'orders', orderId), { status: 'completed', paymentReleased: true, statusHistory: _appendHistory('payment_released', adminId) })
  const order = (await getDoc(doc(db, 'orders', orderId))).data()
  await addDoc(collection(db, 'notifications'), { uid: order.sellerId, type: 'payment_released', title: 'Payment released! 🎉', body: `Payment for "${order.listingTitle}" has been released by admin.`, orderId, read: false, createdAt: serverTimestamp() })
}
export const adminUpdateOrderStatus = async (orderId, status, adminId) => { await updateDoc(doc(db, 'orders', orderId), { status, statusHistory: _appendHistory(status, adminId) }) }
export const cancelUnpaidOrder = async (orderId, buyerId) => {
  await updateDoc(doc(db, 'orders', orderId), { status: 'cancelled', statusHistory: _appendHistory('cancelled_unpaid', buyerId) })
}
export const cancelPaidOrder = async (orderId) => {
  const callable = httpsCallable(functions, 'cancelPaidOrder')
  const { data } = await callable({ orderId })
  return data
}
export const canCancelOrder = (order) =>
  order.status === 'awaiting_payment' || order.status === 'pending_seller'

// ── Notifications ─────────────────────────────────────────
export const getNotifications = async (uid) => { const snap = await getDocs(query(collection(db, 'notifications'), where('uid', '==', uid), orderBy('createdAt', 'desc'), limit(50))); return snap.docs.map((d) => ({ id: d.id, ...d.data() })) }
export const subscribeToNotifications = (uid, onData) => {
  const q = query(collection(db, 'notifications'), where('uid', '==', uid), where('read', '==', false), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => onData([]))
}
export const markNotificationRead = (id) => updateDoc(doc(db, 'notifications', id), { read: true })
export const markAllNotificationsRead = async (uid) => {
  const snap = await getDocs(query(collection(db, 'notifications'), where('uid', '==', uid), where('read', '==', false)))
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { read: true })))
}

// ── Coupons ───────────────────────────────────────────────
export const createCoupon = (data) => addDoc(collection(db, 'coupons'), { ...data, code: data.code.toUpperCase().trim(), usageCount: 0, active: true, createdAt: serverTimestamp() })
export const getCouponsBySeller = async (sellerId) => { const snap = await getDocs(query(collection(db, 'coupons'), where('sellerId', '==', sellerId))); return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)) }
export const validateCoupon = async (code) => {
  const snap = await getDocs(query(collection(db, 'coupons'), where('code', '==', code.toUpperCase().trim()), where('active', '==', true)))
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}
export const redeemCoupon = (id) => updateDoc(doc(db, 'coupons', id), { usageCount: increment(1) })
export const toggleCoupon = (id, active) => updateDoc(doc(db, 'coupons', id), { active })
export const deleteCoupon = (id) => deleteDoc(doc(db, 'coupons', id))
export const applyCouponToTotal = (total, coupon) => {
  if (!coupon) return { discountedTotal: total, savings: 0, label: '' }
  let savings = coupon.type === 'percent' ? (total * coupon.discount) / 100 : Math.min(coupon.discount, total)
  savings = parseFloat(savings.toFixed(2))
  return { discountedTotal: parseFloat((total - savings).toFixed(2)), savings, label: coupon.type === 'percent' ? `${coupon.discount}% off` : `R${coupon.discount} off` }
}

// ── Reviews & comments ────────────────────────────────────
const _refreshListingRating = async (listingId) => {
  const snap = await getDocs(query(collection(db, 'reviews'), where('listingId', '==', listingId)))
  const ratings = snap.docs.map((d) => d.data().rating).filter(Boolean)
  const avg = ratings.length ? parseFloat((ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)) : 0
  await updateDoc(doc(db, 'listings', listingId), { avgRating: avg, reviewCount: ratings.length })
}
export const createReview = async (data) => {
  const payload = { ...data, authorId: data.authorId || data.buyerId, createdAt: serverTimestamp() }
  const ref = await addDoc(collection(db, 'reviews'), payload)
  _refreshListingRating(data.listingId).catch(console.error)
  return ref
}
export const getReviewsByListing = async (listingId) => { const snap = await getDocs(query(collection(db, 'reviews'), where('listingId', '==', listingId))); return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)) }
export const deleteReview = async (id) => { const snap = await getDoc(doc(db, 'reviews', id)); const listingId = snap.data()?.listingId; await deleteDoc(doc(db, 'reviews', id)); if (listingId) _refreshListingRating(listingId).catch(console.error) }
export const createComment = (data) => addDoc(collection(db, 'comments'), { ...data, authorId: data.authorId || data.uid, createdAt: serverTimestamp() })
export const getCommentsByListing = async (listingId) => { const snap = await getDocs(query(collection(db, 'comments'), where('listingId', '==', listingId))); return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)) }
export const deleteComment = (id) => deleteDoc(doc(db, 'comments', id))

// ── Wishlist ──────────────────────────────────────────────
export const getWishlist = async (uid) => { const snap = await getDoc(doc(db, 'wishlists', uid)); return snap.exists() ? (snap.data().items || []) : [] }
export const addToWishlist = async (uid, listingId) => { const existing = await getWishlist(uid); if (existing.includes(listingId)) return; await setDoc(doc(db, 'wishlists', uid), { items: [...existing, listingId] }) }
export const removeFromWishlist = async (uid, listingId) => { const existing = await getWishlist(uid); await setDoc(doc(db, 'wishlists', uid), { items: existing.filter((id) => id !== listingId) }) }

// ── Checkout (marketplace) ────────────────────────────────
export const createCheckout = (data) => addDoc(collection(db, 'checkouts'), { ...data, status: data.status || 'pending', paymentStatus: data.paymentStatus || 'pending', createdAt: serverTimestamp() })
export const getCheckoutById = async (id) => { const snap = await getDoc(doc(db, 'checkouts', id)); return snap.exists() ? { id: snap.id, ...snap.data() } : null }
export const getCheckoutsByBuyer = async (buyerId) => { const snap = await getDocs(query(collection(db, 'checkouts'), where('buyerId', '==', buyerId))); return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)) }

// ── StudX Eats ────────────────────────────────────────────
export const upsertVendor = (vendorId, data) => setDoc(doc(db, 'vendors', vendorId), { ...data, ownerId: vendorId, updatedAt: serverTimestamp() }, { merge: true })
export const getVendor = async (vendorId) => { const snap = await getDoc(doc(db, 'vendors', vendorId)); return snap.exists() ? { id: snap.id, ...snap.data() } : null }
export const getActiveVendors = async () => {
  const snap = await getDocs(query(collection(db, 'vendors'), where('active', '==', true), orderBy('name', 'asc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
export const getAllVendors = async () => {
  const snap = await getDocs(collection(db, 'vendors'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
}
export const createFoodItem = (data) => addDoc(collection(db, 'foodItems'), { ...data, available: data.available ?? true, createdAt: serverTimestamp() })
export const updateFoodItem = (id, updates) => updateDoc(doc(db, 'foodItems', id), updates)
export const deleteFoodItem = (id) => deleteDoc(doc(db, 'foodItems', id))
export const getFoodItemsByVendor = async (vendorId) => {
  const snap = await getDocs(query(collection(db, 'foodItems'), where('vendorId', '==', vendorId)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
}
export const createFoodOrder = (data) => addDoc(collection(db, 'foodOrders'), { ...data, status: data.status || 'awaiting_payment', paymentStatus: data.paymentStatus || 'pending', createdAt: serverTimestamp() })
export const updateFoodOrder = (id, updates) => updateDoc(doc(db, 'foodOrders', id), updates)
export const getFoodOrdersByBuyer = async (buyerId) => {
  const snap = await getDocs(query(collection(db, 'foodOrders'), where('buyerId', '==', buyerId)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
}
export const getFoodOrdersByVendor = async (vendorId) => {
  const snap = await getDocs(query(collection(db, 'foodOrders'), where('vendorId', '==', vendorId)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
}
export const getAllFoodOrders = async () => {
  const snap = await getDocs(query(collection(db, 'foodOrders'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
export const createFoodCheckout = (data) => addDoc(collection(db, 'foodCheckouts'), { ...data, status: data.status || 'pending', paymentStatus: data.paymentStatus || 'pending', createdAt: serverTimestamp() })
export const getFoodCheckoutById = async (id) => {
  const snap = await getDoc(doc(db, 'foodCheckouts', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ── Chat ──────────────────────────────────────────────────
export const buildChatId = (uid1, uid2, listingId) => `${[uid1, uid2].sort().join('_')}_${listingId}`
export const getOrCreateChat = async (buyerId, sellerId, listingId, listingTitle) => {
  const chatId = buildChatId(buyerId, sellerId, listingId)
  const chatRef = doc(db, 'chats', chatId)
  try { const snap = await getDoc(chatRef); if (snap.exists()) return { id: snap.id, ...snap.data() } } catch (_) {}
  let ttlDays = 30
  try { const s = await getDoc(doc(db, 'settings', 'chat')); if (s.exists()) ttlDays = s.data().ttlDays ?? 30 } catch (_) {}
  const chatData = { participants: [buyerId, sellerId], listingId, listingTitle: listingTitle || '', isAdminChat: false, createdAt: serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + ttlDays * 86400000), lastMessage: '', lastMessageAt: serverTimestamp(), lastSenderId: null }
  await setDoc(chatRef, chatData)
  return { id: chatId, ...chatData }
}
export const getOrCreateDirectChat = async (adminId, targetUid, targetEmail) => {
  const chatId = `admin_${[adminId, targetUid].sort().join('_')}`
  const chatRef = doc(db, 'chats', chatId)
  try { const snap = await getDoc(chatRef); if (snap.exists()) return { id: snap.id, ...snap.data() } } catch (_) {}
  let ttlDays = 30
  try { const s = await getDoc(doc(db, 'settings', 'chat')); if (s.exists()) ttlDays = s.data().ttlDays ?? 30 } catch (_) {}
  const chatData = { participants: [adminId, targetUid], listingId: null, listingTitle: `Admin → ${targetEmail || targetUid.slice(0, 8)}`, isAdminChat: true, createdAt: serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + ttlDays * 86400000), lastMessage: '', lastMessageAt: serverTimestamp(), lastSenderId: null }
  await setDoc(chatRef, chatData)
  return { id: chatId, ...chatData }
}
export const sendMessage = async (chatId, senderId, text) => {
  const trimmed = text.trim(); if (!trimmed) return
  await addDoc(collection(db, 'chats', chatId, 'messages'), { senderId, text: trimmed, createdAt: serverTimestamp() })
  await updateDoc(doc(db, 'chats', chatId), { lastMessage: trimmed.length > 60 ? trimmed.slice(0, 60) + '…' : trimmed, lastMessageAt: serverTimestamp(), lastSenderId: senderId })
}
export const subscribeToMessages = (chatId, onMessages, msgLimit = 100) => {
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'), limit(msgLimit))
  return onSnapshot(q, (snap) => onMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}
export const subscribeToUserChats = (uid, onChats, onError) => {
  const q = query(collection(db, 'chats'), where('participants', 'array-contains', uid), orderBy('lastMessageAt', 'desc'))
  const now = Date.now()
  return onSnapshot(q, (snap) => { const chats = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((c) => { const e = c.expiresAt?.toMillis?.(); return !e || e > now }); onChats(chats) }, (err) => { if (onError) onError(err); else console.error(err) })
}
export const subscribeToUnreadChats = (uid, onCount) => {
  const q = query(collection(db, 'chats'), where('participants', 'array-contains', uid), orderBy('lastMessageAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const now = Date.now()
    const count = snap.docs.filter((d) => { const data = d.data(); const exp = data.expiresAt?.toMillis?.(); if (exp && exp < now) return false; return data.lastMessage && data.lastSenderId !== uid }).length
    onCount(count)
  }, () => onCount(0))
}
export const deleteChat = async (chatId) => {
  const msgSnap = await getDocs(collection(db, 'chats', chatId, 'messages'))
  await Promise.all(msgSnap.docs.map((d) => deleteDoc(d.ref)))
  await deleteDoc(doc(db, 'chats', chatId))
}
export const getAllChats = async () => { const snap = await getDocs(query(collection(db, 'chats'), orderBy('lastMessageAt', 'desc'))); return snap.docs.map((d) => ({ id: d.id, ...d.data() })) }

// ── Ads ───────────────────────────────────────────────────
export const getActiveAds = async () => { const snap = await getDocs(query(collection(db, 'ads'), where('active', '==', true), orderBy('createdAt', 'desc'))); return snap.docs.map((d) => ({ id: d.id, ...d.data() })) }
export const getAllAds = async () => { const snap = await getDocs(query(collection(db, 'ads'), orderBy('createdAt', 'desc'))); return snap.docs.map((d) => ({ id: d.id, ...d.data() })) }
export const createAd = (data) => addDoc(collection(db, 'ads'), { ...data, active: data.active ?? true, clickCount: 0, impressionCount: 0, createdAt: serverTimestamp() })
export const updateAd = (adId, updates) => updateDoc(doc(db, 'ads', adId), updates)
export const deleteAd = (adId) => deleteDoc(doc(db, 'ads', adId))
export const toggleAd = (adId, active) => updateDoc(doc(db, 'ads', adId), { active })
export const incrementAdClick = (adId) => updateDoc(doc(db, 'ads', adId), { clickCount: increment(1) })
export const incrementAdImpression = (adId) => updateDoc(doc(db, 'ads', adId), { impressionCount: increment(1) })

// ── Settings ──────────────────────────────────────────────
export const getPromotedListingSetting = async () => { const snap = await getDoc(doc(db, 'settings', 'promotedListing')); return snap.exists() ? snap.data() : null }
export const setPromotedListing = (listingId, adminUid) => setDoc(doc(db, 'settings', 'promotedListing'), { listingId, setBy: adminUid, setAt: serverTimestamp() }, { merge: true })
export const clearPromotedListing = () => setDoc(doc(db, 'settings', 'promotedListing'), { listingId: null, setBy: null, setAt: serverTimestamp() }, { merge: true })
export const getChatSettings = async () => { const snap = await getDoc(doc(db, 'settings', 'chat')); return snap.exists() ? snap.data() : { ttlDays: 30 } }
export const updateChatSettings = (data) => setDoc(doc(db, 'settings', 'chat'), data, { merge: true })