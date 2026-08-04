// src/pages/Admin.jsx
import { useState, useEffect, useMemo } from 'react'
import { useNavigate }                  from 'react-router-dom'
import { useAuth }                      from '../context/AuthContext'
import { AlertTriangle, ArrowRight, CreditCard, Check, Circle, Star, MessageSquare, ChevronDown, Search, X } from 'lucide-react'
import {
  getAllListings, getAllUsers, getAllOrders, getAllChats,
  deleteListing, setListingFeatured,
  setSellerVerified, setUserRole,
  releasePayment, adminUpdateOrderStatus,
  deleteChat, getChatSettings, updateChatSettings,
  getOrCreateDirectChat,
} from '../services/firebase'
import s from '../styles/Admin.module.css'

const ORDER_STATUSES = [
  'pending_seller','accepted','fulfilled','confirmed',
  'completed','declined','disputed',
]

export default function Admin() {
  const { currentUser } = useAuth()
  const navigate        = useNavigate()

  const [listings,    setListings]    = useState([])
  const [users,       setUsers]       = useState([])
  const [orders,      setOrders]      = useState([])
  const [chats,       setChats]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [openSection, setOpenSection] = useState('orders')

  // Search/filter state
  const [listingSearch, setListingSearch] = useState('')
  const [userSearch,    setUserSearch]    = useState('')
  const [orderSearch,   setOrderSearch]   = useState('')
  const [orderFilter,   setOrderFilter]   = useState('all')
  const [chatSearch,    setChatSearch]    = useState('')

  // Chat settings
  const [chatTtlDays, setChatTtlDays] = useState(30)
  const [ttlSaving,   setTtlSaving]   = useState(false)
  const [ttlSaved,    setTtlSaved]    = useState(false)

  // Action loading state
  const [acting, setActing] = useState(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [l, u, o, c, settings] = await Promise.all([
          getAllListings(), getAllUsers(), getAllOrders(),
          getAllChats(), getChatSettings(),
        ])
        setListings(l); setUsers(u); setOrders(o); setChats(c)
        setChatTtlDays(settings.ttlDays ?? 30)
      } catch (err) {
        console.error('Admin fetch error:', err)
        setError('Failed to load data. Make sure your account has admin role in Firestore.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const toggle = (section) =>
    setOpenSection((s) => s === section ? '' : section)

  const act = async (id, fn) => {
    setActing(id)
    try { await fn() }
    catch (err) { console.error(err) }
    finally { setActing(null) }
  }

  // Handlers
  const handleDeleteListing = async (id) => {
    if (!window.confirm('Delete this listing?')) return
    await act(id, () => deleteListing(id))
    setListings((p) => p.filter((l) => l.id !== id))
  }

  const handleToggleFeatured = async (id, featured) => {
    await act(id, () => setListingFeatured(id, featured))
    setListings((p) => p.map((l) => l.id === id ? { ...l, featured } : l))
  }

  const handleToggleVerified = async (uid, verified) => {
    await act(uid, () => setSellerVerified(uid, verified))
    setUsers((p) => p.map((u) => u.uid === uid ? { ...u, verified } : u))
  }

  const handleToggleRole = async (uid, role) => {
    await act(uid, () => setUserRole(uid, role))
    setUsers((p) => p.map((u) => u.uid === uid ? { ...u, role } : u))
  }

  const handleReleasePayment = async (orderId) => {
    if (!window.confirm('Release payment to seller?')) return
    await act(orderId, () => releasePayment(orderId, currentUser.uid))
    setOrders((p) => p.map((o) => o.id === orderId ? { ...o, status: 'completed', paymentReleased: true } : o))
  }

  const handleOverrideStatus = async (orderId, status) => {
    await act(orderId, () => adminUpdateOrderStatus(orderId, status, currentUser.uid))
    setOrders((p) => p.map((o) => o.id === orderId ? { ...o, status } : o))
  }

  const handleDeleteChat = async (chatId) => {
    if (!window.confirm('Delete this chat and all messages?')) return
    await act(chatId, () => deleteChat(chatId))
    setChats((p) => p.filter((c) => c.id !== chatId))
  }

  const handleMessageUser = async (user) => {
    try {
      const chat = await getOrCreateDirectChat(currentUser.uid, user.uid, user.uid)
      navigate(`/messages/${chat.id}`)
    } catch (err) { console.error(err) }
  }

  const handleSaveTTL = async () => {
    setTtlSaving(true)
    try {
      await updateChatSettings({ ttlDays: Number(chatTtlDays) })
      setTtlSaved(true)
      setTimeout(() => setTtlSaved(false), 3000)
    } catch (err) { console.error(err) }
    finally { setTtlSaving(false) }
  }

  // Filtered data
  const filteredListings = useMemo(() => {
    if (!listingSearch.trim()) return listings
    const q = listingSearch.toLowerCase()
    return listings.filter((l) => l.title?.toLowerCase().includes(q) || l.sellerId?.includes(q))
  }, [listings, listingSearch])

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users
    const q = userSearch.toLowerCase()
    return users.filter((u) => u.email?.toLowerCase().includes(q) || u.uid?.includes(q))
  }, [users, userSearch])

  const filteredOrders = useMemo(() => {
    let filtered = orders
    if (orderFilter !== 'all') filtered = filtered.filter((o) => o.status === orderFilter)
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase()
      filtered = filtered.filter((o) =>
        o.id?.includes(q) || o.listingTitle?.toLowerCase().includes(q) ||
        o.buyerId?.includes(q) || o.sellerId?.includes(q)
      )
    }
    return filtered
  }, [orders, orderFilter, orderSearch])

  const filteredChats = useMemo(() => {
    if (!chatSearch.trim()) return chats
    const q = chatSearch.toLowerCase()
    return chats.filter((c) => c.listingTitle?.toLowerCase().includes(q) || c.id?.includes(q))
  }, [chats, chatSearch])

  const disputedOrders = orders.filter((o) => o.status === 'disputed')
  const pendingPayment = orders.filter((o) => o.status === 'confirmed' && !o.paymentReleased)

  if (loading) return (
    <main className={s.page}>
      <div className={s.spinner} />
    </main>
  )

  return (
    <main className={s.page}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Admin Panel <span className={s.adminBadge}>Admin</span></h1>
          <p className={s.pageSubtitle}>
            {listings.length} listings · {users.length} users · {orders.length} orders
          </p>
        </div>
      </div>

      {error && <div className={s.errorBanner}>{error}</div>}

      {/* ── Alert: disputes + pending payment ── */}
      {(disputedOrders.length > 0 || pendingPayment.length > 0) && (
        <div className={s.alertRow}>
          {disputedOrders.length > 0 && (
            <div className={s.alertCard} style={{ borderColor: '#fecaca' }}>
              <AlertTriangle size={20} color="#dc2626" />
              <div>
                <p style={{ fontWeight: 600, color: '#dc2626', fontSize: '0.875rem' }}>
                  {disputedOrders.length} Disputed Order{disputedOrders.length > 1 ? 's' : ''}
                </p>
                <p style={{ fontSize: '0.72rem', color: '#dc2626' }}>Require your attention</p>
              </div>
              <button className={s.alertBtn} onClick={() => { setOpenSection('orders'); setOrderFilter('disputed') }}>
                View <ArrowRight size={12} />
              </button>
            </div>
          )}
          {pendingPayment.length > 0 && (
            <div className={s.alertCard} style={{ borderColor: '#bbf7d0' }}>
              <CreditCard size={20} color="#15803d" />
              <div>
                <p style={{ fontWeight: 600, color: '#15803d', fontSize: '0.875rem' }}>
                  {pendingPayment.length} Payment{pendingPayment.length > 1 ? 's' : ''} to Release
                </p>
                <p style={{ fontSize: '0.72rem', color: '#15803d' }}>Buyer confirmed receipt</p>
              </div>
              <button className={s.alertBtn} onClick={() => { setOpenSection('orders'); setOrderFilter('confirmed') }}>
                View <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════ ORDERS ════ */}
      <Section
        id="orders" open={openSection} toggle={toggle}
        title="Orders" count={filteredOrders.length} total={orders.length}
      >
        {/* Filter row */}
        <div className={s.filterRow}>
          <SearchBar value={orderSearch} onChange={setOrderSearch} placeholder="Search orders…" />
          <div className={s.filterPills}>
            {['all', ...ORDER_STATUSES].map((st) => (
              <button key={st}
                onClick={() => setOrderFilter(st)}
                className={`${s.pill} ${orderFilter === st ? s.pillActive : ''}`}>
                {st === 'all' ? 'All' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr>
              <th>Order</th><th>Listing</th><th>Buyer → Seller</th>
              <th>Status</th><th>Progress</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filteredOrders.length === 0
                ? <tr className={s.emptyRow}><td colSpan={6}>No orders match.</td></tr>
                : filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className={s.mono}>#{order.id.slice(0, 8)}</span>
                    {order.createdAt && (
                      <span className={s.cellDate}>
                        <br />{order.createdAt.toDate?.().toLocaleDateString('en-ZA', { day:'numeric',month:'short',year:'numeric' })}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={s.cellTitle}>{order.listingTitle || order.listingId?.slice(0, 12)}</span>
                    <br />
                    <span className={s.cellPrice}>R{Number(order.listingPrice || 0).toFixed(2)}</span>
                  </td>
                  <td>
                    <span className={s.mono}>{order.buyerId?.slice(0, 8)}…</span>
                    <br />
                    <span className={s.mono}><ArrowRight size={10} /> {order.sellerId?.slice(0, 8)}…</span>
                  </td>
                  <td>
                    <StatusPill status={order.status} />
                    {order.paymentReleased && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.6rem', color: '#15803d', fontWeight: 600 }}><CreditCard size={10} /> Paid</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                      <div>{order.sellerAccepted  ? <Check size={10} /> : <Circle size={10} />} Seller accepted</div>
                      <div>{order.sellerConfirmed ? <Check size={10} /> : <Circle size={10} />} Seller fulfilled</div>
                      <div>{order.buyerConfirmed  ? <Check size={10} /> : <Circle size={10} />} Buyer confirmed</div>
                      <div>{order.paymentReleased ? <Check size={10} /> : <Circle size={10} />} Payment released</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {/* Release payment — only when buyer confirmed and not yet released */}
                      {order.status === 'confirmed' && !order.paymentReleased && (
                        <button
                          className={s.btnRelease}
                          disabled={acting === order.id}
                          onClick={() => handleReleasePayment(order.id)}
                        >
                          {acting === order.id ? '…' : <><CreditCard size={12} /> Release Payment</>}
                        </button>
                      )}
                      {/* Status override */}
                      <select
                        className={s.statusSelect}
                        value={order.status}
                        onChange={(e) => handleOverrideStatus(order.id, e.target.value)}
                        disabled={acting === order.id}
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>{st.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ════ LISTINGS ════ */}
      <Section
        id="listings" open={openSection} toggle={toggle}
        title="Listings" count={filteredListings.length} total={listings.length}
      >
        <SearchBar value={listingSearch} onChange={setListingSearch} placeholder="Search listings…" />
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr>
              <th>Listing</th><th>Category</th><th>Price</th>
              <th>Rating</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filteredListings.length === 0
                ? <tr className={s.emptyRow}><td colSpan={6}>No listings found.</td></tr>
                : filteredListings.map((l) => (
                <tr key={l.id}>
                  <td>
                    <a href={`/listing/${l.id}`} className={s.cellLink}>
                      <span className={s.cellTitle}>{l.title}</span>
                    </a>
                    <br /><span className={s.mono}>{l.sellerId?.slice(0, 10)}…</span>
                  </td>
                  <td>
                    <span className={l.category === 'product' ? s.tagProduct : s.tagService}>
                      {l.category}
                    </span>
                  </td>
                  <td><span className={s.cellPrice}>R{Number(l.price).toFixed(2)}</span></td>
                  <td>
                    {l.avgRating > 0
                      ? <span style={{ fontSize: '0.75rem' }}><Star size={10} fill="currentColor" /> {l.avgRating} ({l.reviewCount})</span>
                      : <span className={s.cellMuted}>—</span>}
                  </td>
                  <td>
                    {l.featured
                      ? <span className={s.verifiedBadge}><Star size={10} fill="currentColor" /> Featured</span>
                      : <span className={s.unverifiedBadge}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleToggleFeatured(l.id, !l.featured)}
                        disabled={acting === l.id}
                        className={l.featured ? s.btnUnverify : s.btnVerify}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {acting === l.id ? '…' : l.featured ? <><Star size={10} /> Unfeature</> : <><Star size={10} fill="currentColor" /> Feature</>}
                      </button>
                      <button
                        onClick={() => handleDeleteListing(l.id)}
                        disabled={acting === l.id}
                        className={s.btnDelete}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ════ USERS ════ */}
      <Section
        id="users" open={openSection} toggle={toggle}
        title="Users" count={filteredUsers.length} total={users.length}
      >
        <SearchBar value={userSearch} onChange={setUserSearch} placeholder="Search users…" />
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr>
              <th>User</th><th>Role</th><th>Verified</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filteredUsers.length === 0
                ? <tr className={s.emptyRow}><td colSpan={4}>No users found.</td></tr>
                : filteredUsers.map((user) => (
                <tr key={user.uid}>
                  <td>
                    <span className={s.cellTitle}>{user.uid?.slice(0, 12)}…</span>
                  </td>
                  <td>
                    {user.role === 'admin'
                      ? <span className={s.roleAdmin}>Admin</span>
                      : <span className={s.roleUser}>User</span>}
                  </td>
                  <td>
                    {user.verified
                      ? <span className={s.verifiedBadge}><Check size={10} /> Verified</span>
                      : <span className={s.unverifiedBadge}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleToggleVerified(user.uid, !user.verified)}
                        disabled={acting === user.uid}
                        className={user.verified ? s.btnUnverify : s.btnVerify}
                      >
                        {acting === user.uid ? '…' : user.verified ? 'Unverify' : 'Verify'}
                      </button>
                      {user.uid !== currentUser?.uid && (
                        <button
                          onClick={() => handleToggleRole(user.uid, user.role === 'admin' ? 'user' : 'admin')}
                          disabled={acting === user.uid}
                          className={user.role === 'admin' ? s.btnDemote : s.btnPromote}
                        >
                          {user.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>
                      )}
                      <button
                        onClick={() => handleMessageUser(user)}
                        className={s.btnEdit}
                      >
                        <MessageSquare size={12} /> Message
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ════ CHATS ════ */}
      <Section
        id="chats" open={openSection} toggle={toggle}
        title="Chats" count={filteredChats.length} total={chats.length}
      >
        <SearchBar value={chatSearch} onChange={setChatSearch} placeholder="Search chats…" />
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr>
              <th>Chat</th><th>Listing</th><th>Last Message</th><th>Expires</th><th>Action</th>
            </tr></thead>
            <tbody>
              {filteredChats.length === 0
                ? <tr className={s.emptyRow}><td colSpan={5}>No chats.</td></tr>
                : filteredChats.map((chat) => {
                  const exp      = chat.expiresAt?.toDate?.()
                  const expired  = exp && exp < new Date()
                  const daysLeft = exp ? Math.ceil((exp - new Date()) / 86400000) : null
                  return (
                    <tr key={chat.id}>
                      <td><span className={s.mono}>{chat.id.slice(0, 16)}…</span></td>
                      <td>
                        {chat.listingId
                          ? <a href={`/listing/${chat.listingId}`} className={s.cellLink} style={{ fontSize: '0.78rem' }}>{chat.listingTitle || chat.listingId.slice(0, 10)}</a>
                          : <span className={s.cellMuted}>{chat.listingTitle || '—'}</span>}
                      </td>
                      <td style={{ maxWidth: '12rem' }}>
                        <span className={s.cellMuted}>{chat.lastMessage || '—'}</span>
                      </td>
                      <td>
                        {exp ? (
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: expired ? '#dc2626' : daysLeft <= 3 ? '#d97706' : 'var(--text-muted)' }}>
                            {expired ? <><AlertTriangle size={10} /> Expired</> : `${daysLeft}d`}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <button onClick={() => handleDeleteChat(chat.id)} disabled={acting === chat.id} className={s.btnDelete}>
                          {acting === chat.id ? '…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ════ SETTINGS ════ */}
      <Section id="settings" open={openSection} toggle={toggle} title="Chat Settings">
        <div style={{ maxWidth: '26rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            New chats will expire after this many days. Existing chats keep their original expiry.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Lifetime (days):
            </label>
            <input
              type="number" min="1" max="365" value={chatTtlDays}
              onChange={(e) => setChatTtlDays(e.target.value)}
              style={{ width: '5.5rem', padding: '0.45rem 0.75rem', fontSize: '0.875rem', fontFamily: 'var(--font-body)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
            />
            <button onClick={handleSaveTTL} disabled={ttlSaving}
              style={{ background: 'var(--brand-blue)', color: '#fff', fontWeight: 600, fontSize: '0.825rem', fontFamily: 'var(--font-body)', padding: '0.45rem 1.25rem', border: 'none', borderRadius: 'var(--radius-md)', cursor: ttlSaving ? 'not-allowed' : 'pointer', opacity: ttlSaving ? 0.6 : 1 }}>
              {ttlSaving ? 'Saving…' : 'Save'}
            </button>
            {ttlSaved && <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 500 }}><Check size={12} /> Saved</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[7, 14, 30, 90].map((d) => (
              <button key={d} onClick={() => setChatTtlDays(d)}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem', fontWeight: 500, fontFamily: 'var(--font-body)', border: `1px solid ${Number(chatTtlDays) === d ? 'var(--brand-blue)' : 'var(--border-color)'}`, borderRadius: 999, background: Number(chatTtlDays) === d ? 'var(--brand-blue-light)' : 'var(--bg-subtle)', color: Number(chatTtlDays) === d ? 'var(--brand-blue)' : 'var(--text-muted)', cursor: 'pointer' }}>
                {d === 7 ? '1 week' : d === 14 ? '2 weeks' : d === 30 ? '1 month' : '3 months'}
              </button>
            ))}
          </div>
        </div>
      </Section>
    </main>
  )
}

// ── Shared components ─────────────────────────────────

function Section({ id, open, toggle, title, count, total, children }) {
  const isOpen = open === id
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', marginBottom: '1rem', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <button
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '1.1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', borderBottom: isOpen ? '1px solid var(--border-color)' : 'none', transition: 'background 150ms' }}
        onClick={() => toggle(id)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
          {count != null && (
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '0.1rem 0.5rem', borderRadius: 999, border: '1px solid var(--border-color)' }}>
              {count}{total != null && count !== total ? ` / ${total}` : ''}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', transition: 'transform 150ms', transform: isOpen ? 'rotate(180deg)' : 'none' }}><ChevronDown size={12} /></span>
      </button>
      {isOpen && <div style={{ padding: '1.1rem 1.25rem' }}>{children}</div>}
    </div>
  )
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative', marginBottom: '1rem' }}>
      <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.75rem', pointerEvents: 'none' }}><Search size={12} /></span>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '0.55rem 2rem 0.55rem 2.25rem', fontSize: '0.8rem', fontFamily: 'var(--font-body)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', outline: 'none' }}
      />
      {value && (
        <button onClick={() => onChange('')}
          style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          <X size={12} />
        </button>
      )}
    </div>
  )
}

const STATUS_STYLES = {
  pending_seller: { color: '#d97706', bg: '#fefce8', border: '#fde68a' },
  accepted:       { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  fulfilled:      { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  confirmed:      { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  completed:      { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  declined:       { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  disputed:       { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

function StatusPill({ status }) {
  const st = STATUS_STYLES[status] || { color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' }
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: 999, color: st.color, background: st.bg, border: `1px solid ${st.border}`, whiteSpace: 'nowrap' }}>
      {status?.replace('_', ' ')}
    </span>
  )
}
