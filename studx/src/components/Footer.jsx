import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Shield, FileText, Users, Scale } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import s from '../styles/Footer.module.css'

const sections = [
  {
    id: 'privacy',
    label: 'Privacy Policy',
    Icon: Shield,
    content: `
      **Privacy Policy**

      Last updated: July 2026

      **1. Information We Collect**

      We collect information you provide when creating an account (name, email address, university details) and when using the platform (listings, messages, orders, reviews). We also collect usage data such as pages visited and features used.

      **2. How We Use Your Information**

      Your information is used to operate the marketplace, facilitate transactions between buyers and sellers, send order-related notifications, and improve our services. We do not sell your personal data to third parties.

      **3. Information Sharing**

      We share information only as necessary to complete transactions (e.g., sharing your university details with a seller you purchase from) or when required by law. Your email address is kept private and is not publicly displayed.

      **4. Data Security**

      We use industry-standard encryption (HTTPS) and Firebase's built-in security features to protect your data. You are responsible for keeping your login credentials secure.

      **5. Data Retention**

      We retain your account data for as long as your account is active. You may request deletion of your account and associated data by contacting us.

      **6. Your Rights**

      You may access, update, or delete your personal information at any time through your profile settings. You may also contact us to request a copy of the data we hold about you.

      **7. Cookies**

      We use essential cookies for authentication and platform functionality. No tracking or advertising cookies are used.

      **8. Contact**

      For privacy-related inquiries, contact the platform administrator through the messaging system.

      By using StudX, you agree to the collection and use of information as described in this policy.
    `,
  },
  {
    id: 'terms',
    label: 'Terms of Service',
    Icon: FileText,
    content: `
      **Terms of Service**

      Last updated: July 2026

      **1. Acceptance of Terms**

      By accessing or using StudX, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.

      **2. Eligibility**

      You must be a currently enrolled student at a recognised institution to use StudX. You must be at least 18 years of age or the age of majority in your jurisdiction.

      **3. Account Registration**

      You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. You must provide accurate and complete information.

      **4. Listings**

      Sellers are responsible for the accuracy of their listings. Prohibited items include: illegal goods, weapons, drugs, stolen property, counterfeit items, and services that violate academic integrity (e.g., contract cheating).

      **5. Transactions**

      All transactions are between buyers and sellers. StudX provides the platform for connecting parties but is not a party to any transaction. Disputes should be resolved between the parties involved.

      **6. Fees**

      StudX is currently free to use. We reserve the right to introduce fees in the future with prior notice to users.

      **7. Prohibited Conduct**

      You agree not to: harass other users, post false or misleading information, attempt to bypass platform features, use the platform for commercial solicitation, or engage in any illegal activity.

      **8. Intellectual Property**

      You retain ownership of content you post. By posting, you grant StudX a license to display your content on the platform. You may not reproduce, distribute, or create derivative works of platform content without permission.

      **9. Termination**

      We reserve the right to suspend or terminate accounts that violate these terms, without prior notice.

      **10. Limitation of Liability**

      StudX is provided "as is" without warranties of any kind. We are not liable for any damages arising from the use of the platform.

      **11. Changes to Terms**

      We may modify these terms at any time. Continued use after changes constitutes acceptance of the new terms.

      **12. Governing Law**

      These terms shall be governed by the laws applicable in the jurisdiction of the platform operator.
    `,
  },
  {
    id: 'community',
    label: 'Community Guidelines',
    Icon: Users,
    content: `
      **Community Guidelines & User Policy**

      Last updated: July 2026

      **1. Be Respectful**

      Treat all community members with respect. Harassment, hate speech, intimidation, or discrimination of any kind will not be tolerated.

      **2. Be Honest**

      Represent yourself, your items, and your services truthfully. Do not mislead buyers or sellers. Accurate descriptions and honest communication build trust.

      **3. Be Reliable**

      Fulfill your commitments. If you agree to sell an item or provide a service, follow through promptly. Communicate clearly if delays occur.

      **4. Academic Integrity**

      Do not use StudX to buy, sell, or solicit completed assignments, exam answers, or any work that would violate your institution's academic integrity policy. Tutoring and study resources are permitted.

      **5. Privacy**

      Respect others' privacy. Do not share personal information of other users outside the platform. Do not screenshot private messages without consent.

      **6. Dispute Resolution**

      If a dispute arises, first attempt to resolve it directly with the other party. If unresolved, you may flag the transaction for review by platform administrators. We encourage honest dialogue and fair outcomes.

      **7. Reporting Violations**

      Report any violations of these guidelines to the platform administrators. Reports are confidential and will be reviewed promptly.

      **8. Consequences**

      Violations may result in warnings, listing removal, temporary suspension, or permanent account termination depending on severity.

      **9. Appeals**

      Users whose accounts have been restricted may appeal by contacting the platform administrators. Appeals are reviewed on a case-by-case basis.

      By using StudX, you agree to uphold these community standards.
    `,
  },
  {
    id: 'dispute',
    label: 'Dispute Resolution & Refunds',
    Icon: Scale,
    content: `
      **Dispute Resolution & Refund Policy**

      Last updated: July 2026

      **1. Overview**

      StudX facilitates peer-to-peer transactions between students. While we encourage direct resolution, we provide a dispute resolution process for unresolved issues.

      **2. Dispute Process**

      Step 1: Both parties communicate directly through the platform's messaging system to attempt resolution.
      Step 2: If unresolved after 7 days, either party may flag the order for review.
      Step 3: A platform administrator reviews the case, including all messages and evidence provided.
      Step 4: A decision is made, which may include: releasing payment, refunding the buyer, or requesting additional action.

      **3. Evidence**

      Both parties should provide relevant evidence including screenshots, photos, messages, and any other documentation supporting their case.

      **4. Refund Conditions**

      Refunds may be issued when: the item was not delivered, the item significantly differs from the listing description, the service was not performed as agreed, or counterfeit or prohibited goods were involved.

      **5. Non-Refundable Situations**

      Refunds are not guaranteed for: change of mind, buyer's remorse, items damaged after delivery, or services already fully rendered as agreed.

      **6. Chargebacks**

      Attempting to reverse payments through external means (chargebacks) without first using the platform's dispute process may result in account suspension.

      **7. Finality**

      All dispute decisions made by the platform administrators are final and binding within the platform.

      We encourage all users to communicate openly and honestly to minimise disputes.
    `,
  },
]

export default function Footer() {
  const { currentUser, isAdmin } = useAuth()
  const [openId, setOpenId] = useState(null)

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id))

  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        {/* Brand */}
        <div className={s.brandCol}>
          <Link to="/" className={s.brandLink}>
            <span className={s.footerBrandName}>StudX</span>
          </Link>
          <p className={s.tagline}>
            Student marketplace — buy, sell, and connect within your campus community.
          </p>
        </div>

        {/* Quick links */}
        <div className={s.col}>
          <h4 className={s.colTitle}>Quick Links</h4>
          <Link to="/" className={s.colLink}>Marketplace</Link>
          {currentUser ? (
            <>
              <Link to="/dashboard" className={s.colLink}>Dashboard</Link>
              <Link to="/messages" className={s.colLink}>Messages</Link>
              <Link to={`/profile/${currentUser.uid}`} className={s.colLink}>Profile</Link>
              {isAdmin && <Link to="/admin" className={s.colLink}>Admin</Link>}
            </>
          ) : (
            <>
              <Link to="/login" className={s.colLink}>Login</Link>
              <Link to="/register" className={s.colLink}>Sign Up</Link>
            </>
          )}
        </div>

        {/* Legal */}
        <div className={s.col}>
          <h4 className={s.colTitle}>Legal</h4>
          {sections.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`${s.colLink} ${s.legalToggle}`}
              onClick={() => toggle(id)}
            >
              <Icon size={14} />
              {label}
              <ChevronDown
                size={14}
                className={`${s.chevron} ${openId === id ? s.chevronOpen : ''}`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Policy panels */}
      {sections.map(({ id, label, content }) => (
        <div
          key={id}
          className={`${s.panel} ${openId === id ? s.panelOpen : ''}`}
        >
          <div className={s.panelInner}>
            <div className={s.panelHeader}>
              <h3 className={s.panelTitle}>{label}</h3>
              <button className={s.panelClose} onClick={() => setOpenId(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className={s.panelContent}>{renderMD(content)}</div>
          </div>
        </div>
      ))}

      {/* Bottom bar */}
      <div className={s.bottom}>
        <div className={s.bottomInner}>
          <span>&copy; {new Date().getFullYear()} StudX. All rights reserved.</span>
          <span className={s.bottomLinks}>
            <button className={s.bottomLink} onClick={() => toggle('privacy')}>Privacy</button>
            <button className={s.bottomLink} onClick={() => toggle('terms')}>Terms</button>
            <button className={s.bottomLink} onClick={() => toggle('community')}>Guidelines</button>
          </span>
        </div>
      </div>
    </footer>
  )
}

function renderMD(text) {
  const lines = text.trim().split('\n')
  return lines.map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      const h = line.replace(/\*\*/g, '').trim()
      if (h.startsWith('**')) return null
      return <h4 key={i} className={s.mdH}>{h}</h4>
    }
    if (line.startsWith('**')) {
      const bold = line.match(/\*\*(.+?)\*\*/)
      const rest = line.replace(/\*\*(.+?)\*\*/, '').trim()
      if (bold) {
        return (
          <p key={i} className={s.mdP}>
            <strong>{bold[1]}</strong>{rest}
          </p>
        )
      }
    }
    if (line.trim() === '') return <div key={i} className={s.mdSpacer} />
    if (line.match(/^\d+\./)) {
      return <p key={i} className={s.mdP}>{line}</p>
    }
    if (line.startsWith('Step ')) {
      return <p key={i} className={s.mdP}>{line}</p>
    }
    return <p key={i} className={s.mdP}>{line}</p>
  })
}
