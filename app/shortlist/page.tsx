import { ShortlistView } from '@/components/ShortlistView'

export default function ShortlistPage() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px 60px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
          My Shortlist
        </h1>
        <p style={{ marginTop: 6, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
          Saved in your browser — no account needed. Up to 20 festivals.
        </p>
      </div>
      <ShortlistView />
    </div>
  )
}
