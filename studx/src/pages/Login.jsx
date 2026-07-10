// src/pages/Login.jsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import s from '../styles/Auth.module.css'

function GoogleIcon() {
  return (
    <svg className={s.googleIcon} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [gLoading, setGLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.')
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with that email.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.')
      } else {
        setError('Login failed. Please try again.')
      }
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setError(''); setGLoading(true)
    try {
      await loginWithGoogle()
      navigate(from, { replace: true })
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.')
      }
    } finally { setGLoading(false) }
  }

  return (
    <main className={s.page}>
      <div className={s.wrapper}>
        <div className={s.card}>
          <div className={s.logoMark}><span className={s.logoText}>SX</span></div>
          <h1 className={s.heading}>Welcome back</h1>
          <p className={s.subheading}>Sign in to your StudX account</p>

          {error && <div className={s.errorBanner}>{error}</div>}

          <button onClick={handleGoogle} disabled={gLoading || loading} className={s.googleBtn}>
            <GoogleIcon />
            {gLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div className={s.divider}>
            <span className={s.dividerLine} />
            <span className={s.dividerText}>or sign in with email</span>
            <span className={s.dividerLine} />
          </div>

          <form onSubmit={handleSubmit} className={s.form}>
            <div className={s.field}>
              <label htmlFor="email" className={s.label}>Email address</label>
              <input id="email" type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.ac.za" className={s.input} />
            </div>
            <div className={s.field}>
              <label htmlFor="password" className={s.label}>Password</label>
              <input id="password" type="password" required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className={s.input} />
            </div>
            <button type="submit" disabled={loading || gLoading} className={s.submitBtn}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className={s.footer}>
            Don't have an account?{' '}
            <Link to="/register" className={s.footerLink}>Sign up free</Link>
          </p>
        </div>
        <p className={s.tagline}>StudX — Trade. Connect. Grow.</p>
      </div>
    </main>
  )
}
