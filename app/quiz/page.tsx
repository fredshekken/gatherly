'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Question = {
  id: string
  question: string
  type: 'multiple_choice' | 'true_false'
  choices: string[]
  answer: string
  order_index: number
}

export default function QuizPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answers, setAnswers] = useState<{ question_id: string; selected: string; correct: boolean }[]>([])
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    const storedName = sessionStorage.getItem('gatherly_name')
    if (!storedName) { router.push('/'); return }
    setName(storedName)
    fetchQuestions()
  }, [])

  async function fetchQuestions() {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .order('order_index')
    if (data) setQuestions(data)
    setLoading(false)
  }

  function handleSelect(choice: string) {
    if (submitted) return
    setSelected(choice)
  }

  function handleNext() {
    if (!selected) return

    const q = questions[current]
    const isCorrect = selected === q.answer
    const newAnswers = [...answers, { question_id: q.id, selected, correct: isCorrect }]
    setAnswers(newAnswers)
    setSelected(null)

    if (current + 1 < questions.length) {
      setCurrent(current + 1)
    } else {
      finishQuiz(newAnswers)
    }
  }

  async function finishQuiz(finalAnswers: typeof answers) {
    setSubmitted(true)
    const score = finalAnswers.filter(a => a.correct).length

    await supabase.from('guests').insert({
      name,
      score,
      character_config: null
    })

    sessionStorage.setItem('gatherly_score', String(score))
    sessionStorage.setItem('gatherly_total', String(questions.length))
    router.push('/customize')
  }

  const s = {
    page: { minHeight: '100vh', background: 'var(--cream)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties,
    card: { width: '100%', maxWidth: '480px', background: '#fff', border: 'var(--border)', borderRadius: '20px', overflow: 'hidden', boxShadow: '6px 6px 0 #1a1a1a' } as React.CSSProperties,
    header: { background: 'var(--red)', borderBottom: 'var(--border)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as React.CSSProperties,
    body: { padding: '24px' } as React.CSSProperties,
    choiceBtn: (isSelected: boolean) => ({
      width: '100%',
      background: isSelected ? 'var(--yellow)' : 'var(--cream)',
      border: 'var(--border)',
      borderRadius: '10px',
      padding: '12px 16px',
      fontFamily: "'Nunito', sans-serif",
      fontSize: '14px',
      fontWeight: 700,
      cursor: 'pointer',
      textAlign: 'left' as const,
      boxShadow: isSelected ? 'var(--shadow)' : 'var(--shadow-sm)',
      transform: isSelected ? 'translate(-1px, -1px)' : 'none',
      transition: 'all 0.1s',
      marginBottom: '10px',
      display: 'block',
      color: 'var(--black)'
    } as React.CSSProperties),
    nextBtn: { width: '100%', background: 'var(--red)', border: 'var(--border)', borderRadius: '10px', padding: '14px', fontFamily: "'Titan One', cursive", fontSize: '18px', color: '#fff', cursor: 'pointer', boxShadow: 'var(--shadow)', marginTop: '8px' } as React.CSSProperties,
  }

  if (loading) return (
    <main style={s.page}>
      <p style={{ fontFamily: "'Titan One', cursive", fontSize: '24px' }}>Loading quiz...</p>
    </main>
  )

  if (questions.length === 0) return (
    <main style={s.page}>
      <div style={{ ...s.card, padding: '32px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Titan One', cursive", fontSize: '24px', marginBottom: '8px' }}>No questions yet!</p>
        <p style={{ fontSize: '14px', color: '#aaa', fontWeight: 600 }}>The host hasn't added any questions. Check back soon!</p>
      </div>
    </main>
  )

  if (submitted) return (
    <main style={s.page}>
      <p style={{ fontFamily: "'Titan One', cursive", fontSize: '24px' }}>Saving your score...</p>
    </main>
  )

  const q = questions[current]
  const progress = ((current) / questions.length) * 100

  return (
    <main style={s.page}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <p style={{ fontFamily: "'Titan One', cursive", fontSize: '18px', color: '#fff', textShadow: '2px 2px 0 #1a1a1a' }}>
            Gatherly
          </p>
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#FFE8E8' }}>
            {current + 1} / {questions.length}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ height: '6px', background: 'var(--cream)', borderBottom: 'var(--border)' }}>
          <div style={{ height: '100%', background: 'var(--mint)', width: `${progress}%`, transition: 'width 0.3s', borderRight: progress > 0 ? '2px solid #1a1a1a' : 'none' }} />
        </div>

        <div style={s.body}>
          {/* Question */}
          <div style={{ background: 'var(--cream)', border: 'var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
              {q.type === 'true_false' ? 'True or False' : 'Multiple Choice'}
            </p>
            <p style={{ fontSize: '16px', fontWeight: 800, lineHeight: 1.4 }}>{q.question}</p>
          </div>

          {/* Choices */}
          <div>
            {(q.type === 'true_false' ? ['True', 'False'] : q.choices).map((choice, i) => (
              <button key={i} onClick={() => handleSelect(choice)} style={s.choiceBtn(selected === choice)}>
                <span style={{ marginRight: '10px', opacity: 0.4 }}>{String.fromCharCode(65 + i)}.</span>
                {choice}
              </button>
            ))}
          </div>

          <button onClick={handleNext} disabled={!selected} style={{ ...s.nextBtn, opacity: selected ? 1 : 0.4, cursor: selected ? 'pointer' : 'not-allowed' }}>
            {current + 1 === questions.length ? 'Finish! 🎉' : 'Next →'}
          </button>
        </div>
      </div>
    </main>
  )
}