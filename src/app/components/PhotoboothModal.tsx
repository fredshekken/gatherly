'use client'

type PhotoboothModalProps = {
  onClose: () => void
}

export default function PhotoboothModal({ onClose }: PhotoboothModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#fff',
          border: 'var(--border)',
          borderRadius: '20px',
          boxShadow: '6px 6px 0 #1a1a1a',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontFamily: "'Titan One', cursive", fontSize: '22px', marginBottom: '8px' }}>
          Photobooth
        </p>
        <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>
          The photobooth is ready to be connected here.
        </p>
        <button
          onClick={onClose}
          style={{
            background: 'var(--yellow)',
            border: 'var(--border)',
            borderRadius: '10px',
            padding: '10px 16px',
            fontFamily: "'Titan One', cursive",
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}