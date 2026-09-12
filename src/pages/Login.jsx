import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import s from '../styles/Auth.module.css'

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.code === 'auth/invalid-credential' ? 'Invalid email or password.' : (err.message || 'Login failed'))
    } finally {
      setBusy(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setBusy(true)
    try {
      await loginWithGoogle()
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Google sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.brand}>
          <div className={s.logo}>SX</div>
          <h1 className={s.title}>Welcome back</h1>
          <p className={s.sub}>Sign in to trade on StudX</p>
        </div>
        <form className={s.form} onSubmit={handleSubmit}>
          {error && <div className={s.error}>{error}</div>}
          <div className={s.field}>
            <label className={s.label}>Email</label>
            <input className={s.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className={s.field}>
            <label className={s.label}>Password</label>
            <input className={s.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <button className={s.submit} type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <div className={s.divider}>or</div>
        <button type="button" className={s.google} onClick={handleGoogle} disabled={busy}>Continue with Google</button>
        <p className={s.footer}>No account? <Link to="/register">Sign up</Link></p>
      </div>
    </div>
  )
}
