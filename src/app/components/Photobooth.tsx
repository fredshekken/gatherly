'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Photobooth from './PhotoboothModal'

const LAYERS = [
  { id: 'eyes',    label: 'Eyes',    group: 'Face' },
  { id: 'nose',    label: 'Nose',    group: 'Face' },
  { id: 'mouth',   label: 'Mouth',   group: 'Face' },
  { id: 'hair',    label: 'Hair',    group: 'Body' },
  { id: 'top',     label: 'Top',     group: 'Outfit' },
  { id: 'pants',   label: 'Pants',   group: 'Outfit' },
  { id: 'shoes',   label: 'Shoes',   group: 'Outfit' },
  { id: 'glasses', label: 'Glasses', group: 'Accessory' },
  { id: 'hat',     label: 'Hat',     group: 'Accessory' },
  { id: 'item',    label: 'Item',    group: 'Accessory' },
]

const RENDER_ORDER = ['eyes','nose','mouth','hair','top','pants','shoes','glasses','hat','item']

const PLACEHOLDER_COLORS: Record<string, string> = {
  eyes: '#6B9FFF', nose: '#FFB347', mouth: '#FF6B6B',
  hair: '#8B5E3C', top: '#C9F0DD', pants: '#A0C4FF',
  shoes: '#FFD93D', glasses: '#B39DDB', hat: '#FF6B6B', item: '#FFF176'
}

type Guest = {
  id: string
  name: string
  score: number
  character_config: Record<string, number> | null
  created_at: string
}

type Config = Record<string, number>

function CharacterFigure({ config, label, size = 80 }: { config: Config | null, label: string, size?: number }) {
  const headSize = size * 0.42
  const bodyW = size * 0.5
  const bodyH = size * 0.55

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: bodyW, height: bodyH,
          background: '#E0D6C8', borderRadius: '30px 30px 16px 16px',
          border: '2px solid #1a1a1a'
        }} />
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: headSize, height: headSize,
          background: '#F5CBA7', borderRadius: '50%',
          border: '2px solid #1a1a1a'
        }} />
        {config && RENDER_ORDER.map(layerId => (
          <img key={layerId}
            src={`/assets/${layerId}/${layerId}_${(config[layerId] ?? 0) + 1}.png`}
            alt={layerId}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ))}
      </div>
      <p style={{
        fontSize: Math.max(size * 0.13, 10) + 'px',
        fontWeight: 800,
        color: 'var(--black)',
        background: '#fff',
        border: 'var(--border)',
        borderRadius: '20px',
        padding: '2px 8px',
        boxShadow: '2px 2px 0 #1a1a1a',
        whiteSpace: 'nowrap',
        maxWidth: size * 1.4,
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>{label}</p>
    </div>
  )
}

function sortGuests(guests: Guest[]): Guest[] {
  return [...guests].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const tDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (tDiff !== 0) return tDiff
    return a.name.localeCompare(b.name)
  })
}

export default function ScenePage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [hostConfig, setHostConfig] = useState<Config>({})
  const [showHostEditor, setShowHostEditor] = useState(false)
  const [editorConfig, setEditorConfig] = useState<Config>({})
  const [activeGroup, setActiveGroup] = useState('Face')
  const [activeLayer, setActiveLayer] = useState('eyes')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [showPhotobooth, setShowPhotobooth] = useState(false)
  const [guestName, setGuestName] = useState<string | null>(null)

  const fetchGuests = useCallback(async () => {
    const { data } = await supabase.from('guests').select('*')
    if (data) setGuests(data)
  }, [])

  const fetchHost = useCallback(async () => {
    const { data } = await supabase.from('host').select('*').eq('id', 1).single()
    if (data?.character_config) setHostConfig(data.character_config)
  }, [])

  useEffect(() => {
    const n = sessionStorage.getItem('gatherly_name')
    setGuestName(n)
    fetchGuests()
    fetchHost()
    const interval = setInterval(fetchGuests, 5000)
    return () => clearInterval(interval)
  }, [fetchGuests, fetchHost])

  function openHostEditor() {
    setEditorConfig({ ...hostConfig })
    setShowHostEditor(true)
  }

  async function saveHostConfig() {
    setSaving(true)
    await supabase.from('host').update({ character_config: editorConfig }).eq('id', 1)
    setHostConfig({ ...editorConfig })
    setSaving(false)
    setShowHostEditor(false)
    showToast('Host character updated!')
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const sorted = sortGuests(guests)
  const total = sorted.length

  function getGuestPosition(index: number, total: number): { x: number, y: number } {
    if (total === 0) return { x: 50, y: 50 }
    const ratio = total === 1 ? 0 : index / (total - 1)
    const minRadius = 18
    const maxRadius = 42
    const radius = minRadius + ratio * (maxRadius - minRadius)
    const minAngle = 200
    const maxAngle = 340
    const angle = total === 1 ? 270 : minAngle + (index / (total - 1)) * (maxAngle - minAngle)
    const rad = (angle * Math.PI) / 180
    return {
      x: 50 + radius * Math.cos(rad),
      y: 52 + radius * Math.sin(rad)
    }
  }

  const groups = [...new Set(LAYERS.map(l => l.group))]
  const activeLayers = LAYERS.filter(l => l.group === activeGroup)
  const currentLayer = LAYERS.find(l => l.id === activeLayer)!

  const s = {
    btn: (bg: string, color = 'var(--black)') => ({
      background: bg, border: 'var(--border)', borderRadius: '10px',
      padding: '8px 16px', fontFamily: "'Titan One', cursive",
      fontSize: '14px', cursor: 'pointer',
      boxShadow: 'var(--shadow-sm)', color
    } as React.CSSProperties),
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--cream)', overflow: 'hidden', position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'var(--mint)', border: 'var(--border)', borderRadius: '10px', padding: '10px 18px', fontWeight: 800, fontSize: '14px', boxShadow: 'var(--shadow)', zIndex: 300 }}>
          {toast}
        </div>
      )}

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: 'var(--border)', background: 'var(--red)' }}>
        <h1 style={{ fontFamily: "'Titan One', cursive", fontSize: '24px', color: '#fff', textShadow: '2px 2px 0 #1a1a1a' }}>
          Gatherly 🎂
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFE8E8' }}>
            {total} guest{total !== 1 ? 's' : ''} joined
          </span>
          <button onClick={openHostEditor} style={s.btn('var(--yellow)')}>
            Edit My Character
          </button>
        </div>
      </div>

      {/* Scene wrapper */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '60%', background: 'var(--cream)', overflow: 'hidden' }}>

        {/* Fixed photobooth button */}
        {guestName && (
          <div style={{
            position: 'fixed',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 200,
          }}>
            <button
              onClick={() => setShowPhotobooth(true)}
              style={{
                background: 'var(--yellow)',
                border: 'var(--border)',
                borderRadius: '14px',
                padding: '14px 10px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 800,
                fontSize: '11px',
                color: 'var(--black)',
              }}>
              <span style={{ fontSize: '20px' }}>📸</span>
              <span style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>Photobooth</span>
            </button>
          </div>
        )}

        {/* Back wall */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', background: '#B5D5F5', borderBottom: '3px solid #1a1a1a' }} />

        {/* Floor */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '48%', background: '#F5DEB3', borderTop: '3px solid #1a1a1a' }} />

        {/* Bunting */}
        {['15%', '35%', '55%', '75%'].map((left, i) => (
          <div key={i} style={{ position: 'absolute', top: '4%', left, display: 'flex', gap: '6px' }}>
            {['var(--red)', 'var(--yellow)', 'var(--mint)'].map((c, j) => (
              <div key={j} style={{ width: 16, height: 20, background: c, border: '2px solid #1a1a1a', clipPath: 'polygon(0 0, 100% 0, 50% 100%)', transform: `rotate(${(j - 1) * 10}deg)` }} />
            ))}
          </div>
        ))}

        {/* Balloons */}
        {[{ left: '5%', color: 'var(--red)', top: '8%' }, { left: '88%', color: 'var(--mint)', top: '6%' }, { left: '92%', color: 'var(--yellow)', top: '14%' }].map((b, i) => (
          <div key={i} style={{ position: 'absolute', top: b.top, left: b.left }}>
            <div style={{ width: 28, height: 34, background: b.color, border: '2px solid #1a1a1a', borderRadius: '50% 50% 45% 45%' }} />
            <div style={{ width: 1, height: 20, background: '#1a1a1a', margin: '0 auto' }} />
          </div>
        ))}

        {/* Table */}
        <div style={{ position: 'absolute', top: '44%', left: '50%', transform: 'translateX(-50%)', width: '22%', zIndex: 10 }}>
          <div style={{ width: '100%', height: 14, background: '#fff', border: '2px solid #1a1a1a', borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#aaa' }}>· · · · ·</span>
          </div>
          <div style={{ width: '100%', height: 18, background: '#8B5E3C', border: '2px solid #1a1a1a', borderTop: 'none', borderRadius: '0 0 4px 4px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8%' }}>
            <div style={{ width: 8, height: 28, background: '#6B4226', border: '2px solid #1a1a1a' }} />
            <div style={{ width: 8, height: 28, background: '#6B4226', border: '2px solid #1a1a1a' }} />
          </div>
        </div>

        {/* Cake */}
        <div style={{ position: 'absolute', top: '34%', left: '50%', transform: 'translateX(-50%)', zIndex: 11, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '2px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 4, height: 4, background: 'var(--yellow)', borderRadius: '50%', border: '1px solid #1a1a1a' }} />
                <div style={{ width: 5, height: 12, background: '#fff', border: '1px solid #1a1a1a', borderRadius: '2px' }} />
              </div>
            ))}
          </div>
          <div style={{ width: 52, height: 18, background: '#FF6B6B', border: '2px solid #1a1a1a', borderRadius: '4px 4px 0 0' }} />
          <div style={{ width: 60, height: 20, background: '#FFD93D', border: '2px solid #1a1a1a', borderTop: 'none' }} />
          <div style={{ width: 68, height: 16, background: '#C9F0DD', border: '2px solid #1a1a1a', borderTop: 'none', borderRadius: '0 0 4px 4px' }} />
        </div>

        {/* Food items */}
        <div style={{ position: 'absolute', top: '42%', left: '57%', zIndex: 11 }}>
          <div style={{ width: 22, height: 14, background: '#FF6B6B', border: '2px solid #1a1a1a', borderRadius: '50% 50% 4px 4px' }} />
          <div style={{ width: 24, height: 5, background: '#8B5E3C', border: '2px solid #1a1a1a', borderRadius: '0 0 4px 4px' }} />
        </div>
        <div style={{ position: 'absolute', top: '43%', left: '40%', zIndex: 11 }}>
          <div style={{ width: 18, height: 18, background: 'var(--yellow)', border: '2px solid #1a1a1a', borderRadius: '50%' }} />
        </div>

        {/* Host */}
        <div style={{ position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
          <CharacterFigure config={hostConfig} label="Ida 🎂" size={72} />
        </div>

        {/* Guests */}
        {sorted.map((guest, index) => {
          const pos = getGuestPosition(index, total)
          return (
            <div key={guest.id} style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 15,
              transition: 'all 0.8s ease'
            }}>
              <CharacterFigure
                config={guest.character_config}
                label={guest.name}
                size={Math.max(72 - (index * 3), 44)}
              />
            </div>
          )
        })}

        {total === 0 && (
          <div style={{ position: 'absolute', bottom: '12%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Titan One', cursive", fontSize: '18px', color: '#aaa' }}>Waiting for guests...</p>
          </div>
        )}
      </div>

      {/* Leaderboard strip */}
      <div style={{ padding: '16px 24px', borderTop: 'var(--border)', background: '#fff', overflowX: 'auto' }}>
        <p style={{ fontFamily: "'Titan One', cursive", fontSize: '16px', marginBottom: '10px' }}>Leaderboard</p>
        <div style={{ display: 'flex', gap: '10px', minWidth: 'max-content' }}>
          {sorted.map((g, i) => (
            <div key={g.id} style={{ background: i === 0 ? 'var(--yellow)' : 'var(--cream)', border: 'var(--border)', borderRadius: '10px', padding: '8px 14px', boxShadow: 'var(--shadow-sm)', minWidth: '100px', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#aaa' }}>#{i + 1}</p>
              <p style={{ fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap' }}>{g.name}</p>
              <p style={{ fontFamily: "'Titan One', cursive", fontSize: '18px', color: 'var(--red)' }}>{g.score}</p>
            </div>
          ))}
          {total === 0 && <p style={{ fontSize: '13px', color: '#aaa', fontWeight: 600 }}>No guests yet!</p>}
        </div>
      </div>

      {/* Host editor modal */}
      {showHostEditor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: '24px' }}>
          <div style={{ background: '#fff', border: 'var(--border)', borderRadius: '20px', boxShadow: '6px 6px 0 #1a1a1a', width: '100%', maxWidth: '480px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--red)', borderBottom: 'var(--border)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontFamily: "'Titan One', cursive", fontSize: '20px', color: '#fff', textShadow: '2px 2px 0 #1a1a1a' }}>Edit My Character</p>
              <button onClick={() => setShowHostEditor(false)} style={{ background: '#fff', border: 'var(--border)', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 800, fontSize: '16px' }}>×</button>
            </div>

            <div style={{ padding: '16px', display: 'flex', gap: '16px' }}>
              <div style={{ flexShrink: 0 }}>
                <CharacterFigure config={editorConfig} label="Ida" size={80} />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: 'var(--border)', marginBottom: '8px' }}>
                  {groups.map(g => (
                    <button key={g} onClick={() => { setActiveGroup(g); setActiveLayer(LAYERS.find(l => l.group === g)!.id) }}
                      style={{ flex: 1, padding: '8px 4px', fontFamily: "'Titan One', cursive", fontSize: '12px', background: activeGroup === g ? 'var(--yellow)' : 'var(--cream)', border: 'none', borderRight: 'var(--border)', cursor: 'pointer', color: 'var(--black)' }}>
                      {g}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', borderBottom: 'var(--border)', marginBottom: '10px' }}>
                  {activeLayers.map(l => (
                    <button key={l.id} onClick={() => setActiveLayer(l.id)}
                      style={{ flex: 1, padding: '6px 2px', fontSize: '11px', fontWeight: 800, background: activeLayer === l.id ? '#fff' : 'transparent', border: 'none', cursor: 'pointer', color: activeLayer === l.id ? 'var(--black)' : '#aaa' }}>
                      {l.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {Array.from({ length: 3 }).map((_, i) => {
                    const isSelected = editorConfig[activeLayer] === i
                    return (
                      <button key={i} onClick={() => setEditorConfig({ ...editorConfig, [activeLayer]: i })}
                        style={{ aspectRatio: '1', border: isSelected ? '2.5px solid #1a1a1a' : '2px solid #ccc', borderRadius: '8px', background: isSelected ? 'var(--yellow)' : 'var(--cream)', cursor: 'pointer', boxShadow: isSelected ? 'var(--shadow-sm)' : 'none', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={`/assets/${activeLayer}/${activeLayer}_${i + 1}.png`} alt={`${activeLayer} ${i + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        <div style={{ position: 'absolute', width: '55%', height: '55%', background: PLACEHOLDER_COLORS[activeLayer], border: '2px solid #1a1a1a', borderRadius: '4px', opacity: 0.7 }} />
                        <span style={{ position: 'absolute', bottom: '3px', right: '5px', fontSize: '9px', fontWeight: 800, opacity: 0.5 }}>{i + 1}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{ padding: '0 16px 16px', display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowHostEditor(false)} style={{ ...s.btn('var(--cream)'), flex: 1 }}>Cancel</button>
              <button onClick={saveHostConfig} disabled={saving} style={{ ...s.btn('var(--red)', '#fff'), flex: 1, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Character'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photobooth */}
      {showPhotobooth && <Photobooth onClose={() => setShowPhotobooth(false)} />}
    </main>
  )
}