'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LandingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    const trimmed = name.trim().slice(0, 30)
    if (!trimmed) return setError('Enter your name first!')

    const sanitized = trimmed.replace(/<[^>]*>/g, '')
    setLoading(true)
    setError('')

    const { data: existing } = await supabase
      .from('guests')
      .select('id')
      .eq('name', sanitized)
      .single()

    if (existing) {
      setLoading(false)
      return setError('That name is already taken, try another!')
    }

    sessionStorage.setItem('gatherly_name', sanitized)
    router.push('/quiz')
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--cream)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        border: 'var(--border)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '6px 6px 0 #1a1a1a'
      }}>

        {/* Header */}
        <div style={{
          background: 'var(--red)',
          borderBottom: 'var(--border)',
          padding: '28px 24px 20px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', gap: '6px', position: 'absolute', top: '10px', left: '14px' }}>
            {['var(--yellow)', 'var(--mint)', '#fff'].map((c, i) => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: c, border: '2px solid #1a1a1a'
              }} />
            ))}
          </div>
          <h1 style={{
            fontFamily: "'Titan One', cursive",
            fontSize: '42px',
            color: '#fff',
            textShadow: '3px 3px 0 #1a1a1a',
            lineHeight: 1
          }}>Gatherly</h1>
          <p style={{
            fontSize: '12px',
            fontWeight: 800,
            color: '#FFE8E8',
            marginTop: '6px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>Everyone's invited ✦</p>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', background: 'var(--cream)' }}>

          {/* Invite card */}
          <div style={{
            background: '#fff',
            border: 'var(--border)',
            borderRadius: '14px',
            padding: '16px 18px',
            marginBottom: '20px',
            boxShadow: 'var(--shadow)',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
              You're invited!
            </p>
            <p style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.4 }}>
              Join <span style={{ color: 'var(--red)' }}>Ida's Birthday Gathering</span> and see where you land 🎂
            </p>
          </div>

          {/* Name input */}
          <p style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
            What's your name?
          </p>
          <input
            type="text"
            placeholder="Enter your name..."
            maxLength={30}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{
              width: '100%',
              border: 'var(--border)',
              borderRadius: '10px',
              padding: '12px 14px',
              fontFamily: "'Nunito', sans-serif",
              fontSize: '15px',
              fontWeight: 700,
              background: '#fff',
              color: 'var(--black)',
              marginBottom: '8px',
              boxShadow: 'var(--shadow-sm)',
              outline: 'none'
            }}
          />

          {error && (
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--red)', marginBottom: '10px' }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              background: 'var(--yellow)',
              border: 'var(--border)',
              borderRadius: '10px',
              padding: '14px',
              fontFamily: "'Titan One', cursive",
              fontSize: '20px',
              color: 'var(--black)',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow)',
              opacity: loading ? 0.7 : 1,
              transition: 'transform 0.1s, box-shadow 0.1s'
            }}
          >
            {loading ? 'Checking...' : "Let's Go! 🎉"}
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '0 24px 20px',
          fontSize: '12px',
          color: '#aaa',
          fontWeight: 600
        }}>
          No account needed · Just show up
        </div>
      </div>
    </main>
  )
}