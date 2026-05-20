'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const LAYERS = [
  { id: 'eyes',     label: 'Eyes',     group: 'Face',      count: 3 },
  { id: 'nose',     label: 'Nose',     group: 'Face',      count: 3 },
  { id: 'mouth',    label: 'Mouth',    group: 'Face',      count: 3 },
  { id: 'hair',     label: 'Hair',     group: 'Body',      count: 3 },
  { id: 'top',      label: 'Top',      group: 'Outfit',    count: 3 },
  { id: 'pants',    label: 'Pants',    group: 'Outfit',    count: 3 },
  { id: 'shoes',    label: 'Shoes',    group: 'Outfit',    count: 3 },
  { id: 'glasses',  label: 'Glasses',  group: 'Accessory', count: 3 },
  { id: 'hat',      label: 'Hat',      group: 'Accessory', count: 3 },
  { id: 'item',     label: 'Item',     group: 'Accessory', count: 3 },
]

const RENDER_ORDER = ['eyes', 'nose', 'mouth', 'hair', 'top', 'pants', 'shoes', 'glasses', 'hat', 'item']

const PLACEHOLDER_COLORS: Record<string, string> = {
  eyes: '#6B9FFF', nose: '#FFB347', mouth: '#FF6B6B',
  hair: '#8B5E3C', top: '#C9F0DD', pants: '#A0C4FF',
  shoes: '#FFD93D', glasses: '#B39DDB', hat: '#FF6B6B', item: '#FFF176'
}

type Config = Record<string, number>

export default function CustomizePage() {
  const router = useRouter()
  const [config, setConfig] = useState<Config>(() =>
    Object.fromEntries(LAYERS.map(l => [l.id, 0]))
  )
  const [activeGroup, setActiveGroup] = useState('Face')
  const [activeLayer, setActiveLayer] = useState('eyes')
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const n = sessionStorage.getItem('gatherly_name')
    const s = sessionStorage.getItem('gatherly_score')
    const t = sessionStorage.getItem('gatherly_total')
    if (!n) { router.push('/'); return }
    setName(n)
    setScore(Number(s))
    setTotal(Number(t))
  }, [])

  function assetPath(layerId: string, index: number) {
    return `/assets/${layerId}/${layerId}_${index + 1}.png`
  }

  function imageExists(src: string): boolean {
    return false // placeholder mode — swap to true check when assets are ready
  }

  async function handleConfirm() {
    setSaving(true)
    await supabase
      .from('guests')
      .update({ character_config: config })
      .eq('name', name)

    router.push('/scene')
  }

  const groups = [...new Set(LAYERS.map(l => l.group))]
  const activeLayers = LAYERS.filter(l => l.group === activeGroup)
  const currentLayer = LAYERS.find(l => l.id === activeLayer)!

  const s = {
    page: { minHeight: '100vh', background: 'var(--cream)', padding: '24px' } as React.CSSProperties,
    card: { background: '#fff', border: 'var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow)' } as React.CSSProperties,
  }

  return (
    <main style={s.page}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontFamily: "'Titan One', cursive", fontSize: '32px' }}>Make Your Character</h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#aaa', marginTop: '4px' }}>
            Hey {name}! You got {score}/{total} 🎉 Now build your character.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

          {/* Preview */}
          <div style={{ ...s.card, flex: '0 0 200px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#aaa' }}>Preview</p>

            {/* Character canvas */}
            <div style={{ position: 'relative', width: '160px', height: '240px', background: 'var(--cream)', border: 'var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Base body shape placeholder */}
              <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '80px', height: '160px', background: '#E0D6C8', borderRadius: '40px 40px 20px 20px', border: '2px solid #1a1a1a' }} />
              <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', width: '70px', height: '70px', background: '#F5CBA7', borderRadius: '50%', border: '2px solid #1a1a1a' }} />

              {/* Render selected layers */}
              {RENDER_ORDER.map(layerId => {
                const idx = config[layerId]
                const src = assetPath(layerId, idx)
                return (
                  <img
                    key={layerId}
                    src={src}
                    alt={layerId}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )
              })}
            </div>

            {/* Score badge */}
            <div style={{ background: 'var(--yellow)', border: 'var(--border)', borderRadius: '10px', padding: '8px 14px', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Score</p>
              <p style={{ fontFamily: "'Titan One', cursive", fontSize: '22px' }}>{score}/{total}</p>
            </div>
          </div>

          {/* Customizer */}
          <div style={{ ...s.card, flex: 1, minWidth: '280px', overflow: 'hidden' }}>

            {/* Group tabs */}
            <div style={{ display: 'flex', borderBottom: 'var(--border)' }}>
              {groups.map(g => (
                <button key={g} onClick={() => { setActiveGroup(g); setActiveLayer(LAYERS.find(l => l.group === g)!.id) }}
                  style={{ flex: 1, padding: '12px', fontFamily: "'Titan One', cursive", fontSize: '14px', background: activeGroup === g ? 'var(--yellow)' : 'var(--cream)', border: 'none', borderRight: 'var(--border)', cursor: 'pointer', color: 'var(--black)' }}>
                  {g}
                </button>
              ))}
            </div>

            {/* Layer tabs */}
            <div style={{ display: 'flex', borderBottom: 'var(--border)', background: 'var(--cream)' }}>
              {activeLayers.map(l => (
                <button key={l.id} onClick={() => setActiveLayer(l.id)}
                  style={{ flex: 1, padding: '8px 4px', fontSize: '12px', fontWeight: 800, background: activeLayer === l.id ? '#fff' : 'transparent', border: 'none', borderRight: 'var(--border)', cursor: 'pointer', color: activeLayer === l.id ? 'var(--black)' : '#aaa' }}>
                  {l.label}
                </button>
              ))}
            </div>

            {/* Options grid */}
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {Array.from({ length: currentLayer.count }).map((_, i) => {
                const src = assetPath(activeLayer, i)
                const isSelected = config[activeLayer] === i
                return (
                  <button key={i} onClick={() => setConfig({ ...config, [activeLayer]: i })}
                    style={{ aspectRatio: '1', border: isSelected ? '2.5px solid #1a1a1a' : '2px solid #ccc', borderRadius: '10px', background: isSelected ? 'var(--yellow)' : 'var(--cream)', cursor: 'pointer', boxShadow: isSelected ? 'var(--shadow-sm)' : 'none', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, position: 'relative' }}>
                    {/* Try real asset first, fall back to placeholder */}
                    <img src={src} alt={`${activeLayer} ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    {/* Placeholder block */}
                    <div style={{ position: 'absolute', width: '60%', height: '60%', background: PLACEHOLDER_COLORS[activeLayer], border: '2px solid #1a1a1a', borderRadius: '6px', opacity: 0.7 }} />
                    <span style={{ position: 'absolute', bottom: '4px', right: '6px', fontSize: '10px', fontWeight: 800, color: '#1a1a1a', opacity: 0.5 }}>{i + 1}</span>
                  </button>
                )
              })}
            </div>

            {/* Confirm button */}
            <div style={{ padding: '0 16px 16px' }}>
              <button onClick={handleConfirm} disabled={saving}
                style={{ width: '100%', background: 'var(--red)', border: 'var(--border)', borderRadius: '10px', padding: '14px', fontFamily: "'Titan One', cursive", fontSize: '16px', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Confirm Character'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}