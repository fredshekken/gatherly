'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import html2canvas from 'html2canvas'

const OVERLAYS = [
  { id: 'none',      label: 'Clean',     render: () => null },
  {
    id: 'confetti',
    label: '🎉 Confetti',
    render: () => (
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {[...Array(24)].map((_, i) => (
          <rect key={i}
            x={`${(i * 37 + 11) % 95}%`} y={`${(i * 53 + 7) % 90}%`}
            width={8} height={8}
            fill={['#FF6B6B','#FFD93D','#C9F0DD','#6B9FFF','#FFB347'][i % 5]}
            transform={`rotate(${i * 37}, ${(i * 37 + 11) % 95 + 4}, ${(i * 53 + 7) % 90 + 4})`}
            opacity={0.85}
            rx={i % 3 === 0 ? 4 : 0}
          />
        ))}
      </svg>
    )
  },
  {
    id: 'stars',
    label: '⭐ Stars',
    render: () => (
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {[...Array(12)].map((_, i) => (
          <text key={i}
            x={`${(i * 41 + 5) % 90}%`} y={`${(i * 67 + 10) % 88}%`}
            fontSize={i % 3 === 0 ? 22 : 14}
            opacity={0.8}
          >{['⭐','✨','💫'][i % 3]}</text>
        ))}
      </svg>
    )
  },
  {
    id: 'birthday',
    label: '🎂 Birthday',
    render: () => (
      <>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'var(--red)', borderBottom: '2.5px solid #1a1a1a', padding: '6px', textAlign: 'center', fontFamily: "'Titan One', cursive", fontSize: '14px', color: '#fff', textShadow: '1px 1px 0 #1a1a1a', pointerEvents: 'none' }}>
          🎂 Happy Birthday Ida! 🎂
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--yellow)', borderTop: '2.5px solid #1a1a1a', padding: '6px', textAlign: 'center', fontFamily: "'Titan One', cursive", fontSize: '13px', color: '#1a1a1a', pointerEvents: 'none' }}>
          🎉 Gatherly · 2026 🎉
        </div>
      </>
    )
  },
  {
    id: 'polaroid',
    label: '📷 Polaroid',
    render: () => (
      <div style={{ position: 'absolute', inset: 0, border: '12px solid #fff', borderBottom: '40px solid #fff', boxShadow: 'inset 0 0 0 2px #ddd', pointerEvents: 'none', boxSizing: 'border-box' }} />
    )
  },
  {
    id: 'corners',
    label: '🌈 Corners',
    render: () => (
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {/* TL */}
        <rect x={0} y={0} width={40} height={8} fill="#FF6B6B" />
        <rect x={0} y={0} width={8} height={40} fill="#FF6B6B" />
        {/* TR */}
        <rect x="calc(100% - 40px)" y={0} width={40} height={8} fill="#FFD93D" />
        <rect x="calc(100% - 8px)" y={0} width={8} height={40} fill="#FFD93D" />
        {/* BL */}
        <rect x={0} y="calc(100% - 8px)" width={40} height={8} fill="#C9F0DD" />
        <rect x={0} y="calc(100% - 40px)" width={8} height={40} fill="#C9F0DD" />
        {/* BR */}
        <rect x="calc(100% - 40px)" y="calc(100% - 8px)" width={40} height={8} fill="#6B9FFF" />
        <rect x="calc(100% - 8px)" y="calc(100% - 40px)" width={8} height={40} fill="#6B9FFF" />
      </svg>
    )
  },
]

type Frame = string // base64 dataURL

export default function Photobooth({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [frames, setFrames] = useState<Frame[]>([])
  const [activeOverlay, setActiveOverlay] = useState('none')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [camError, setCamError] = useState(false)

  useEffect(() => {
    startCamera()
    return () => { stream?.getTracks().forEach(t => t.stop()) }
  }, [])

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
        videoRef.current.play()
      }
    } catch {
      setCamError(true)
    }
  }

  function captureFrame() {
    if (frames.length >= 4) return
    setCountdown(3)
    let c = 3
    const interval = setInterval(() => {
      c -= 1
      if (c === 0) {
        clearInterval(interval)
        setCountdown(null)
        takeShot()
      } else {
        setCountdown(c)
      }
    }, 1000)
  }

  function takeShot() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.save()
    ctx.scale(-1, 1)
    ctx.drawImage(video, -canvas.width, 0)
    ctx.restore()

    const dataUrl = canvas.toDataURL('image/png')
    setFrames(prev => [...prev, dataUrl])
  }

  function removeFrame(index: number) {
    setFrames(prev => prev.filter((_, i) => i !== index))
  }

  async function downloadStrip() {
    if (!stripRef.current || frames.length === 0) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(stripRef.current, { useCORS: true, scale: 2, backgroundColor: '#fff' })
      const link = document.createElement('a')
      link.download = `gatherly-photobooth-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setDownloading(false)
    }
  }

  const overlay = OVERLAYS.find(o => o.id === activeOverlay)!

  const s = {
    btn: (bg: string, color = 'var(--black)', disabled = false) => ({
      background: bg, border: 'var(--border)', borderRadius: '10px',
      padding: '10px 16px', fontFamily: "'Titan One', cursive",
      fontSize: '14px', cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : 'var(--shadow-sm)',
      color, opacity: disabled ? 0.4 : 1
    } as React.CSSProperties)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '16px' }}>
      <div style={{ background: '#fff', border: 'var(--border)', borderRadius: '20px', boxShadow: '6px 6px 0 #1a1a1a', width: '100%', maxWidth: '860px', overflow: 'hidden', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ background: 'var(--red)', borderBottom: 'var(--border)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <p style={{ fontFamily: "'Titan One', cursive", fontSize: '20px', color: '#fff', textShadow: '2px 2px 0 #1a1a1a' }}>
            📸 Party Photobooth
          </p>
          <button onClick={onClose} style={{ background: '#fff', border: 'var(--border)', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 800, fontSize: '16px' }}>×</button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexWrap: 'wrap' }}>

          {/* Left — Camera */}
          <div style={{ flex: '1 1 320px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', borderRight: 'var(--border)' }}>

            {/* Camera feed */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#1a1a1a', borderRadius: '12px', border: 'var(--border)', overflow: 'hidden' }}>
              {camError ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ color: '#fff', fontWeight: 800, fontSize: '14px' }}>Camera not available</p>
                  <p style={{ color: '#aaa', fontSize: '12px', fontWeight: 600 }}>Check your browser permissions</p>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                  {overlay.render()}
                  {countdown !== null && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                      <p style={{ fontFamily: "'Titan One', cursive", fontSize: '80px', color: '#fff', textShadow: '4px 4px 0 #1a1a1a' }}>{countdown}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Capture button */}
            <button
              onClick={captureFrame}
              disabled={frames.length >= 4 || countdown !== null || camError}
              style={{ ...s.btn('var(--red)', '#fff', frames.length >= 4 || countdown !== null || camError), width: '100%', fontSize: '18px', padding: '14px' }}>
              {countdown !== null ? `Taking shot in ${countdown}...` : frames.length >= 4 ? 'Strip Full!' : `📸 Capture (${frames.length}/4)`}
            </button>

            {/* Overlay picker */}
            <div>
              <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#aaa', marginBottom: '8px' }}>Overlay</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {OVERLAYS.map(o => (
                  <button key={o.id} onClick={() => setActiveOverlay(o.id)}
                    style={{ background: activeOverlay === o.id ? 'var(--yellow)' : 'var(--cream)', border: 'var(--border)', borderRadius: '20px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", boxShadow: activeOverlay === o.id ? 'var(--shadow-sm)' : 'none' }}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Strip */}
          <div style={{ flex: '0 0 220px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#aaa' }}>Your Strip</p>

            {/* Printable strip */}
            <div ref={stripRef} style={{ background: '#fff', border: 'var(--border)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: 'var(--cream)', borderBottom: i < 3 ? '2px solid #1a1a1a' : 'none' }}>
                  {frames[i] ? (
                    <>
                      <img src={frames[i]} alt={`frame ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      {/* Bake overlay into strip */}
                      {overlay.render()}
                      {/* Remove button */}
                      <button onClick={() => removeFrame(i)}
                        style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', background: '#fff', border: '2px solid #1a1a1a', borderRadius: '50%', fontSize: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        ×
                      </button>
                    </>
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ fontSize: '11px', color: '#ccc', fontWeight: 700 }}>Frame {i + 1}</p>
                    </div>
                  )}
                </div>
              ))}

              {/* Branding bar */}
              <div style={{ background: 'var(--red)', padding: '8px', textAlign: 'center' }}>
                <p style={{ fontFamily: "'Titan One', cursive", fontSize: '13px', color: '#fff', textShadow: '1px 1px 0 #1a1a1a' }}>
                  Gatherly 🎂 · {new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Download */}
            <button
              onClick={downloadStrip}
              disabled={frames.length === 0 || downloading}
              style={{ ...s.btn('var(--yellow)', 'var(--black)', frames.length === 0 || downloading), width: '100%' }}>
              {downloading ? 'Saving...' : '⬇️ Download Strip'}
            </button>

            {frames.length === 0 && (
              <p style={{ fontSize: '12px', color: '#aaa', fontWeight: 600, textAlign: 'center' }}>
                Take some shots to fill your strip!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}