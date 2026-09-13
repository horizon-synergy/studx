import { useViewer } from '../context/ViewerContext'
export default function ViewerBanner() {
  const { isViewer } = useViewer()
  if (!isViewer) return null
  return (
    <div style={{ width: '100%', background: '#1a56db', color: '#fff', padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', fontSize: '0.78rem', fontWeight: 500, position: 'sticky', top: '3.5rem', zIndex: 99, borderBottom: '2.5px solid #141310', flexWrap: 'wrap', textAlign: 'center' }}>
      <span style={{ width: '0.45rem', height: '0.45rem', borderRadius: '50%', background: '#fff', flexShrink: 0, animation: 'pulse 1.8s ease-in-out infinite' }} />
      <span><strong>Viewer Mode</strong> — You're browsing a live demo of StudX. All data is real but actions are restricted.</span>
      <span style={{ background: '#fff', color: '#141310', border: '1.5px solid #141310', borderRadius: 4, padding: '0.15rem 0.625rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', flexShrink: 0 }}>Read Only</span>
    </div>
  )
}
