'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const STEPS = [
  {
    group: 'Face',
    layers: [
      { id: 'eyes',  label: 'Eyes',  count: 3, required: true },
      { id: 'nose',  label: 'Nose',  count: 3, required: true },
      { id: 'mouth', label: 'Mouth', count: 3, required: true },
    ]
  },
  {
    group: 'Body',
    layers: [
      { id: 'hair', label: 'Hair', count: 3, required: true },
    ]
  },
  {
    group: 'Outfit',
    layers: [
      { id: 'top',   label: 'Top',   count: 3, required: true },
      { id: 'pants', label: 'Pants', count: 3, required: true },
      { id: 'shoes', label: 'Shoes', count: 3, required: true },
    ]
  },
  {
    group: 'Accessories',
    label: 'optional',
    layers: [
      { id: 'glasses', label: 'Glasses', count: 3, required: false },
      { id: 'hat',     label: 'Hat',     count: 3, required: false },
      { id: 'item',    label: 'Item',    count: 3, required: false },
    ]
  },
]

const RENDER_ORDER = ['eyes','nose','mouth','hair','top','pants','shoes','glasses','hat','item']

const PLACEHOLDER_COLORS: Record<string, string> = {
  eyes: '#6B9FFF', nose: '#FFB347', mouth: '#FF6B6B',
  hair: '#8B5E3C', top: '#C9F0DD', pants: '#A0C4FF',
  shoes: '#FFD93D', glasses: '#B39DDB', hat: '#FF6B6B', item: '#FFF176'
}

type Config = Record<string, number | null>

export default function CustomizePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [config, setConfig] = useState<Config>({})
  const [activeLayer, setActiveLayer] = useState(STEPS[0].layers[0].id)
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
    setActiveLayer(STEPS[0].layers[0].id)
  }, [])

  useEffect(() => {
    setActiveLayer(STEPS[step].layers[0].id)
  }, [step])

  const currentStep = STEPS[step]
  const isLastStep = step === STEPS.length - 1

  function isStepComplete(): boolean {
    if (isLastStep) return true // accessories optional
    return currentStep.layers
      .filter(l => l.required)
      .every(l => config[l.id] !== undefined && config[l.id] !== null)
  }

  function handleSelect(layerId: string, index: number) {
    setConfig(prev => ({ ...prev, [layerId]: index }))
  }

  function handleNext() {
    if (!isStepComplete()) return
    setStep(s => s + 1)
  }

  function handleBack() {
    setStep(s => s - 1)
  }

  async function handleConfirm() {
    setSaving(true)
    const finalConfig: Record<string, number> = {}
    Object.entries(config).forEach(([k, v]) => {
      if (v !== null && v !== undefined) finalConfig[k] = v
    })

    await supabase
      .from('guests')
      .update({ character_config: finalConfig })
      .eq('name', name)

    router.push('/scene')
  }

  const s = {
    page: { minHeight: '100vh', background: 'var(--cream)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties,
    card: { background: '#fff', border: 'var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow)' } as React.CSSProperties,
    btn: (bg: string, color = 'var(--black)', disabled = false) => ({
      background: bg, border: 'var(--border)', borderRadius: '10px',
      padding: '12px 20px', fontFamily: "'Titan One', cursive",
      fontSize: '16px', cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : 'var(--shadow-sm)',
      color, opacity: disabled ? 0.4 : 1,
      transition: 'all 0.1s'
    } as React.CSSProperties),
  }

  return (
    <main style={s.page}>
      <div style={{ width: '100%', maxWidth: '680px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontFamily: "'Titan One', cursive", fontSize: '30px' }}>Make Your Character</h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#aaa', marginTop: '4px' }}>
            Hey {name}! You got {score}/{total} 🎉
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', justifyContent: 'center' }}>
          {STEPS.map((st, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: 32, height: 32,
                borderRadius: '50%',
                background: i < step ? 'var(--mint)' : i === step ? 'var(--yellow)' : 'var(--cream)',
                border: 'var(--border)',
                boxShadow: i === step ? 'var(--shadow-sm)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Titan One', cursive", fontSize: '14px',
                transition: 'all 0.3s'
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 24, height: 3, background: i < step ? 'var(--mint)' : '#ddd', border: '1px solid #1a1a1a', borderRadius: '2px', transition: 'all 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

          {/* Preview */}
          <div style={{ ...s.card, flex: '0 0 180px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#aaa' }}>Preview</p>
            <div style={{ position: 'relative', width: '140px', height: '210px', background: 'var(--cream)', border: 'var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', width: '72px', height: '140px', background: '#E0D6C8', borderRadius: '36px 36px 18px 18px', border: '2px solid #1a1a1a' }} />
              <div style={{ position: 'absolute', top: '18px', left: '50%', transform: 'translateX(-50%)', width: '62px', height: '62px', background: '#F5CBA7', borderRadius: '50%', border: '2px solid #1a1a1a' }} />
              {RENDER_ORDER.map(layerId => {
                const val = config[layerId]
                if (val === null || val === undefined) return null
                return (
                  <img key={layerId}
                    src={`/assets/${layerId}/${layerId}_${val + 1}.png`}
                    alt={layerId}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )
              })}
            </div>

            <div style={{ background: 'var(--yellow)', border: 'var(--border)', borderRadius: '10px', padding: '8px 14px', boxShadow: 'var(--shadow-sm)', textAlign: 'center', width: '100%' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Score</p>
              <p style={{ fontFamily: "'Titan One', cursive", fontSize: '22px' }}>{score}/{total}</p>
            </div>
          </div>

          {/* Customizer panel */}
          <div style={{ ...s.card, flex: 1, minWidth: '280px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Step header */}
            <div style={{ background: 'var(--red)', borderBottom: 'var(--border)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontFamily: "'Titan One', cursive", fontSize: '18px', color: '#fff', textShadow: '2px 2px 0 #1a1a1a' }}>
                {currentStep.group}
              </p>
              {isLastStep && (
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#FFE8E8', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '3px 10px' }}>
                  Optional
                </span>
              )}
            </div>

            {/* Layer tabs */}
            <div style={{ display: 'flex', borderBottom: 'var(--border)', background: 'var(--cream)' }}>
              {currentStep.layers.map(l => {
                const isSelected = activeLayer === l.id
                const isDone = config[l.id] !== undefined && config[l.id] !== null
                return (
                  <button key={l.id} onClick={() => setActiveLayer(l.id)}
                    style={{
                      flex: 1, padding: '10px 4px',
                      fontSize: '12px', fontWeight: 800,
                      background: isSelected ? '#fff' : 'transparent',
                      border: 'none', borderRight: 'var(--border)',
                      cursor: 'pointer',
                      color: isSelected ? 'var(--black)' : '#aaa',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px'
                    }}>
                    {l.label}
                    {isDone && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mint)', border: '1.5px solid #1a1a1a', display: 'block' }} />}
                    {!isDone && l.required && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ddd', border: '1.5px solid #ccc', display: 'block' }} />}
                  </button>
                )
              })}
            </div>

            {/* Options grid */}
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', flex: 1 }}>
              {Array.from({ length: currentStep.layers.find(l => l.id === activeLayer)?.count ?? 3 }).map((_, i) => {
                const isSelected = config[activeLayer] === i
                return (
                  <button key={i} onClick={() => handleSelect(activeLayer, i)}
                    style={{
                      aspectRatio: '1',
                      border: isSelected ? '2.5px solid #1a1a1a' : '2px solid #ccc',
                      borderRadius: '10px',
                      background: isSelected ? 'var(--yellow)' : 'var(--cream)',
                      cursor: 'pointer',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                      overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0, position: 'relative',
                      transform: isSelected ? 'translate(-1px,-1px)' : 'none',
                      transition: 'all 0.1s'
                    }}>
                    <img src={`/assets/${activeLayer}/${activeLayer}_${i + 1}.png`}
                      alt={`${activeLayer} ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    <div style={{ position: 'absolute', width: '60%', height: '60%', background: PLACEHOLDER_COLORS[activeLayer], border: '2px solid #1a1a1a', borderRadius: '6px', opacity: 0.7 }} />
                    <span style={{ position: 'absolute', bottom: '4px', right: '6px', fontSize: '10px', fontWeight: 800, color: '#1a1a1a', opacity: 0.5 }}>{i + 1}</span>
                  </button>
                )
              })}
            </div>

            {/* Nav buttons */}
            <div style={{ padding: '12px 16px', borderTop: 'var(--border)', display: 'flex', gap: '10px' }}>
              {step > 0 && (
                <button onClick={handleBack} style={s.btn('var(--cream)')}>← Back</button>
              )}
              <div style={{ flex: 1 }} />
              {!isLastStep ? (
                <button
                  onClick={handleNext}
                  disabled={!isStepComplete()}
                  style={s.btn('var(--red)', '#fff', !isStepComplete())}>
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  style={s.btn('var(--red)', '#fff', saving)}>
                  {saving ? 'Saving...' : 'Done! Place Me 🗺️'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Required hint */}
        {!isLastStep && !isStepComplete() && (
          <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', fontWeight: 700, color: 'var(--red)' }}>
            Select all required options to continue
          </p>
        )}
      </div>
    </main>
  )
}