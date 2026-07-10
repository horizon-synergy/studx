// src/pages/Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

export default function Register() {
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [gLoading, setGLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6)       return setError('Password must be at least 6 characters.')
    if (password !== confirm)       return setError('Passwords do not match.')
    setLoading(true)
    try {
      await register(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('An account with this email already exists.')
      else if (err.code === 'auth/invalid-email')   setError('Please enter a valid email address.')
      else if (err.code === 'auth/weak-password')   setError('Password is too weak.')
      else                                          setError('Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setError(''); setGLoading(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') setError('Google sign-in failed.')
    } finally { setGLoading(false) }
  }

  return (
    <main className={s.page}>
      <div className={s.wrapper}>
        <div className={s.card}>
          <div className={s.logoMark}><span className={s.logoText}>SX</span></div>
          <h1 className={s.heading}>Create account</h1>
          <p className={s.subheading}>Join thousands of students on StudX</p>

          {error && <div className={s.errorBanner}>{error}</div>}

          <button onClick={handleGoogle} disabled={gLoading || loading} className={s.googleBtn}>
            <GoogleIcon />
            {gLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div className={s.divider}>
            <span className={s.dividerLine} />
            <span className={s.dividerText}>or sign up with email</span>
            <span className={s.dividerLine} />
          </div>

          <form onSubmit={handleSubmit} className={s.form}>
            <div className={s.field}>
              <label htmlFor="reg-email" className={s.label}>Email address</label>
              <input id="reg-email" type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.ac.za" className={s.input} />
            </div>
            <div className={s.field}>
              <label htmlFor="reg-pw" className={s.label}>Password</label>
              <input id="reg-pw" type="password" required autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters" className={s.input} />
            </div>
            <div className={s.field}>
              <label htmlFor="reg-confirm" className={s.label}>Confirm password</label>
              <input id="reg-confirm" type="password" required autoComplete="new-password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••" className={s.input} />
            </div>
            <button type="submit" disabled={loading || gLoading} className={s.submitBtn}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className={s.terms}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>

          <p className={s.footer}>
            Already have an account?{' '}
            <Link to="/login" className={s.footerLink}>Sign in</Link>
          </p>
        </div>
        <p className={s.tagline}>StudX — Trade. Connect. Grow.</p>
      </div>
    </main>
  )
}
