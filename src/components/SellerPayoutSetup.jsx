import { useEffect, useState } from 'react'
import { listPaystackBanks, createPaystackSubaccount, getSellerPayout } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { useViewer } from '../context/ViewerContext'
import s from '../styles/PayoutsTab.module.css'

export default function SellerPayoutSetup() {
  const { currentUser } = useAuth()
  const { guardViewer } = useViewer()
  const [loading, setLoading] = useState(true)
  const [payout, setPayout] = useState(null)
  const [banks, setBanks] = useState([])
  const [businessName, setBusinessName] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    if (!currentUser) return
    setLoading(true)
    setError('')
    try {
      const [existing, bankList] = await Promise.all([
        getSellerPayout(currentUser.uid),
        listPaystackBanks(),
      ])
      setPayout(existing)
      setBanks(bankList)
      if (existing) {
        setBusinessName(existing.businessName || '')
        setBankCode(existing.bankCode || '')
      }
    } catch (err) {
      console.error(err)
      setError('Could not load payout settings. Try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [currentUser?.uid])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (guardViewer()) return
    setError('')
    setSuccess('')

    if (!businessName.trim()) { setError('Enter a business/seller name.'); return }
    if (!bankCode) { setError('Select your bank.'); return }
    const cleanAccountNumber = accountNumber.replace(/\s+/g, '')
    if (!cleanAccountNumber || cleanAccountNumber.length < 6) { setError('Enter a valid account number.'); return }

    setBusy(true)
    try {
      const result = await createPaystackSubaccount({
        businessName: businessName.trim(),
        bankCode,
        accountNumber: cleanAccountNumber,
      })
      setSuccess(`Payouts active — ${result.bankName} confirmed.`)
      setAccountNumber('')
      await load()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Could not set up payouts. Double-check your account number and bank.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className={s.loading}><div className={s.spinner} /></div>
  }

  return (
    <div className={s.wrap}>
      {payout?.status === 'active' && (
        <div className={s.activeBanner}>
          <div className={s.activeIcon}>✓</div>
          <div>
            <div className={s.activeTitle}>Payouts active</div>
            <div className={s.activeMeta}>
              {payout.bankName} · account ending in {payout.accountNumberLast4} · {payout.businessName}
            </div>
          </div>
        </div>
      )}

      {!payout && (
        <p className={s.intro}>
          Set this up once to start receiving payment for your listings. Buyers pay through Paystack,
          and your share is deposited directly to this bank account — StudX never holds your money.
        </p>
      )}

      {error && <div className={s.error}>{error}</div>}
      {success && <div className={s.success}>{success}</div>}

      <form className={s.form} onSubmit={handleSubmit}>
        <div className={s.field}>
          <label className={s.label}>Business / seller name</label>
          <input
            className={s.input}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. your full name or shop name"
            required
          />
        </div>

        <div className={s.field}>
          <label className={s.label}>Bank</label>
          <select className={s.select} value={bankCode} onChange={(e) => setBankCode(e.target.value)} required>
            <option value="">Select your bank</option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className={s.field}>
          <label className={s.label}>Account number</label>
          <input
            className={s.input}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Your bank account number"
            inputMode="numeric"
            required
          />
        </div>

        <button type="submit" className={s.btn} disabled={busy}>
          {busy ? 'Verifying…' : payout ? 'Update payout details' : 'Set up payouts'}
        </button>

        <p className={s.hint}>
          Details are verified directly with Paystack before saving — StudX never stores your full account number.
        </p>
      </form>
    </div>
  )
}