// src/components/Navbar.jsx
import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth }          from '../context/AuthContext'
import { useCart }          from '../context/CartContext'
import { useTheme }         from '../context/ThemeContext'
import { useNotifications } from '../context/NotificationContext'
import s from '../styles/Navbar.module.css'

export default function Navbar() {
  const { currentUser, isAdmin, logout } = useAuth()
  const { count }                        = useCart()
  const { isDark, toggle }               = useTheme()
  const { notifications, unreadChats, unreadNotifs, markRead, markAllRead } = useNotifications()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open,    setOpen]    = useState(false)   // mobile menu
  const [notifOpen, setNotifOpen] = useState(false) // notification panel
  const navRef    = useRef(null)
  const notifRef  = useRef(null)

  useEffect(() => { setOpen(false) }, [location.pathname])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target))   setOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => { await logout(); navigate('/') }

  const cls = ({ isActive }) =>
    isActive ? `${s.link} ${s.linkActive}` : s.link

  const totalUnread = unreadNotifs + unreadChats

  return (
    <header className={s.header} ref={navRef}>
      <div className={s.inner}>

        {/* Brand */}
        <NavLink to="/" className={s.brand}>
          <div className={s.logoMark}><span className={s.logoText}>SX</span></div>
          <div className={s.brandName}>
            <span className={s.brandTitle}>StudX</span>
            <span className={s.brandSlogan}>Trade. Connect. Grow.</span>
          </div>
        </NavLink>

        {/* Desktop nav */}
        <nav className={s.nav}>
          <NavLink to="/" className={cls} end>Marketplace</NavLink>
          {currentUser && (
            <>
              <NavLink to="/messages"  className={cls}>
                Messages
                {unreadChats > 0 && <span className={s.badge}>{unreadChats}</span>}
              </NavLink>
              <NavLink to="/wishlist"  className={cls}>Wishlist</NavLink>
              <NavLink to="/dashboard" className={cls}>Dashboard</NavLink>
              {isAdmin && <NavLink to="/admin" className={cls}>Admin</NavLink>}
            </>
          )}
        </nav>

        {/* Right controls */}
        <div className={s.controls}>

          {/* Theme toggle */}
          <button className={s.iconBtn} onClick={toggle} title="Toggle theme">
            {isDark ? '☀' : '◐'}
          </button>

          {currentUser ? (
            <>
              {/* Cart */}
              <Link to="/checkout" className={s.iconBtn} title="Cart">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                {count > 0 && <span className={s.badge}>{count}</span>}
              </Link>

              {/* Notification bell */}
              <div className={s.notifWrap} ref={notifRef}>
                <button
                  className={s.iconBtn}
                  onClick={() => setNotifOpen((o) => !o)}
                  title="Notifications"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                  </svg>
                  {totalUnread > 0 && (
                    <span className={`${s.badge} ${s.badgePulse}`}>{totalUnread}</span>
                  )}
                </button>

                {/* Notification dropdown */}
                {notifOpen && (
                  <div className={s.notifPanel}>
                    <div className={s.notifHeader}>
                      <span className={s.notifTitle}>Notifications</span>
                      {notifications.length > 0 && (
                        <button className={s.markAllBtn} onClick={markAllRead}>
                          Mark all read
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className={s.notifEmpty}>
                        <p>You're all caught up</p>
                      </div>
                    ) : (
                      <div className={s.notifList}>
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            className={s.notifItem}
                            onClick={() => {
                              markRead(n.id)
                              setNotifOpen(false)
                              if (n.orderId)  navigate(`/dashboard`)
                              if (n.chatId)   navigate(`/messages/${n.chatId}`)
                            }}
                          >
                            <div className={s.notifDot} />
                            <div>
                              <p className={s.notifItemTitle}>{n.title}</p>
                              <p className={s.notifItemBody}>{n.body}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile avatar */}
              <NavLink to={`/profile/${currentUser.uid}`} className={s.avatar}>
                {currentUser.email?.[0]?.toUpperCase()}
              </NavLink>

              {/* Logout — desktop only */}
              <button className={`${s.iconBtn} ${s.logoutBtn}`} onClick={handleLogout}>
                ↪
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login"    className={s.link}>Login</NavLink>
              <NavLink to="/register" className={s.ctaBtn}>Sign Up</NavLink>
            </>
          )}

          {/* Hamburger */}
          <button
            className={`${s.hamburger} ${open ? s.hamburgerOpen : ''}`}
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {open && (
        <nav className={s.mobileNav}>
          <NavLink to="/" className={cls} end onClick={() => setOpen(false)}>Marketplace</NavLink>
          {currentUser ? (
            <>
              <NavLink to="/messages"  className={cls} onClick={() => setOpen(false)}>
                Messages {unreadChats > 0 && `(${unreadChats})`}
              </NavLink>
              <NavLink to="/wishlist"  className={cls} onClick={() => setOpen(false)}>Wishlist</NavLink>
              <NavLink to="/dashboard" className={cls} onClick={() => setOpen(false)}>Dashboard</NavLink>
              <NavLink to="/checkout"  className={cls} onClick={() => setOpen(false)}>
                Cart {count > 0 && `(${count})`}
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={cls} onClick={() => setOpen(false)}>Admin</NavLink>
              )}
              <NavLink to={`/profile/${currentUser.uid}`} className={cls} onClick={() => setOpen(false)}>
                Profile
              </NavLink>
              <button className={s.mobileLogout} onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login"    className={cls} onClick={() => setOpen(false)}>Login</NavLink>
              <NavLink to="/register" className={cls} onClick={() => setOpen(false)}>Sign Up</NavLink>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
