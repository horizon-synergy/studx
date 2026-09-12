import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import s from '../styles/Auth.module.css'

export default function Register() {
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setBusy(true)
    try {
      await register(email.trim(), password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? 'Email already registered.' : (err.message || 'Registration failed'))
    } finally {
      setBusy(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setBusy(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard')
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
          <h1 className={s.title}>Create account</h1>
          <p className={s.sub}>Join StudX — Trade. Connect. Grow.</p>
        </div>
        <form className={s.form} onSubmit={handleSubmit}>
          {error && <div className={s.error}>{error}</div>}
          <div className={s.field}>
            <label className={s.label}>Email</label>
            <input className={s.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className={s.field}>
            <label className={s.label}>Password</label>
            <input className={s.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className={s.field}>
            <label className={s.label}>Confirm password</label>
            <input className={s.input} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
          </div>
          <button className={s.submit} type="submit" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
        </form>
        <div className={s.divider}>or</div>
        <button type="button" className={s.google} onClick={handleGoogle} disabled={busy}>Continue with Google</button>
        <p className={s.footer}>Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}
