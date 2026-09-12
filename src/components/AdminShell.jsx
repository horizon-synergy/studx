import s from "../styles/AdminShell.module.css";

/**
 * Neumorphic dashboard shell for /admin.
 * Desktop (>=860px): fixed left sidebar, icon + label per tab.
 * Mobile: fixed bottom tab bar, icon-only, horizontally scrollable if it
 * overflows. Both are driven by the same `tabs` array so Admin.jsx keeps
 * one source of truth for its tab state.
 *
 * tabs: [{ id, label, icon, count? }]
 */
export default function AdminShell({ tabs, activeTab, onTabChange, children }) {
  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <div className={s.sidebarHead}>
          <div className={s.brandMark}>SX</div>
          <span className={s.brandLabel}>Admin</span>
        </div>
        <nav className={s.sidebarNav}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${s.navItem} brut-interactive ${
                activeTab === t.id ? `${s.navItemActive} brut-active` : ""
              }`}
              onClick={() => onTabChange(t.id)}
            >
              <span className={s.navIcon} aria-hidden="true">
                {t.icon}
              </span>
              <span className={s.navLabel}>{t.label}</span>
              {t.count > 0 && <span className={s.navCount}>{t.count}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className={s.content}>{children}</main>

      <nav className={s.bottomNav} aria-label="Admin sections">
        <div className={s.bottomNavScroll}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${s.bottomItem} brut-interactive ${
                activeTab === t.id ? `${s.bottomItemActive} brut-active` : ""
              }`}
              onClick={() => onTabChange(t.id)}
              aria-current={activeTab === t.id ? "page" : undefined}
            >
              <span className={s.navIcon} aria-hidden="true">
                {t.icon}
              </span>
              <span className={s.bottomLabel}>{t.label}</span>
              {t.count > 0 && <span className={s.navCount}>{t.count}</span>}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
