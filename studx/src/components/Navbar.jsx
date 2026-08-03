// src/components/Navbar.jsx
import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth }          from '../context/AuthContext'
import { useCart }          from '../context/CartContext'
import { useTheme }         from '../context/ThemeContext'
import { useNotifications } from '../context/NotificationContext'
import { Sun, Moon, ShoppingCart, Bell, LogOut } from 'lucide-react'
import s from '../styles/Navbar.module.css'

export default function Navbar() {
  const { currentUser, isAdmin, extProfile, logout } = useAuth()
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

  useEffect(() => {
    if (open) {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [open])

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
          <span className={s.brandText}>StudX</span>
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

          {/* Theme toggle — desktop only */}
          <button className={`${s.iconBtn} ${s.desktopOnly}`} onClick={toggle} title="Toggle theme">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {currentUser ? (
            <>
              {/* Cart — desktop only */}
              <Link to="/checkout" className={`${s.iconBtn} ${s.desktopOnly}`} title="Cart">
                <ShoppingCart size={18} />
                {count > 0 && <span className={s.badge}>{count}</span>}
              </Link>

              {/* Notification bell — desktop only */}
              <div className={`${s.notifWrap} ${s.desktopOnly}`} ref={notifRef}>
                <button
                  className={s.iconBtn}
                  onClick={() => setNotifOpen((o) => !o)}
                  title="Notifications"
                >
                  <Bell size={18} />
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

              {/* Profile avatar — desktop only */}
              <NavLink to={`/profile/${currentUser.uid}`} className={`${s.avatar} ${s.desktopOnly}`}>
                {extProfile?.avatarUrl
                  ? <img src={extProfile.avatarUrl} alt="" className={s.avatarImg} />
                  : currentUser.email?.[0]?.toUpperCase()}
              </NavLink>

              {/* Logout — desktop only */}
              <button className={`${s.iconBtn} ${s.logoutBtn} ${s.desktopOnly}`} onClick={handleLogout} title="Logout">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login"    className={`${s.link} ${s.desktopOnly}`}>Login</NavLink>
              <NavLink to="/register" className={`${s.ctaBtn} ${s.desktopOnly}`}>Sign Up</NavLink>
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

      {/* Mobile drawer — full-screen overlay (only in DOM when open) */}
      {open && (
        <>
          <div className={s.drawerOverlay} onClick={() => setOpen(false)} />
          <nav className={`${s.mobileDrawer} ${s.mobileDrawerOpen}`}>
            <div className={s.drawerHeader}>
              <span className={s.drawerTitle}>Menu</span>
              <button className={s.drawerClose} onClick={() => setOpen(false)} aria-label="Close menu">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={s.drawerBody}>
              <NavLink to="/" className={cls} end onClick={() => setOpen(false)}>Marketplace</NavLink>
              {currentUser ? (
                <>
                  <NavLink to="/messages"  className={cls} onClick={() => setOpen(false)}>
                    Messages {unreadChats > 0 && <span className={s.badge}>{unreadChats}</span>}
                  </NavLink>
                  <NavLink to="/wishlist"  className={cls} onClick={() => setOpen(false)}>Wishlist</NavLink>
                  <NavLink to="/dashboard" className={cls} onClick={() => setOpen(false)}>Dashboard</NavLink>
                  <NavLink to="/checkout"  className={cls} onClick={() => setOpen(false)}>
                    Cart {count > 0 && <span className={s.badge}>{count}</span>}
                  </NavLink>
                  {isAdmin && (
                    <NavLink to="/admin" className={cls} onClick={() => setOpen(false)}>Admin</NavLink>
                  )}
                </>
              ) : (
                <>
                  <NavLink to="/login"    className={cls} onClick={() => setOpen(false)}>Login</NavLink>
                  <NavLink to="/register" className={cls} onClick={() => setOpen(false)}>Sign Up</NavLink>
                </>
              )}
            </div>

            <div className={s.drawerFooter}>
              {currentUser ? (
                <>
                  <NavLink to={`/profile/${currentUser.uid}`} className={s.drawerProfile} onClick={() => setOpen(false)}>
                    <div className={s.drawerAvatar}>
                      {extProfile?.avatarUrl
                        ? <img src={extProfile.avatarUrl} alt="" className={s.drawerAvatarImg} />
                        : currentUser.email?.[0]?.toUpperCase()}
                    </div>
                    <div className={s.drawerUserInfo}>
                      <span className={s.drawerName}>{extProfile?.displayName || 'User'}</span>
                    </div>
                  </NavLink>
                  <button className={s.drawerLogoutBtn} onClick={() => { setOpen(false); handleLogout() }}>
                    <LogOut size={16} /> Logout
                  </button>
                </>
              ) : (
                <div className={s.drawerAuth}>
                  <NavLink to="/login" className={s.drawerLoginBtn} onClick={() => setOpen(false)}>Login</NavLink>
                  <NavLink to="/register" className={s.drawerSignupBtn} onClick={() => setOpen(false)}>Sign Up</NavLink>
                </div>
              )}
              <button className={s.drawerThemeBtn} onClick={toggle}>
                {isDark ? <Sun size={16} /> : <Moon size={16} />} {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </nav>
        </>
      )}
    </header>
  )
}
