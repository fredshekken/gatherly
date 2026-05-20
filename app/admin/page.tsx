'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const SUGGESTION_BANK = [
  { question: "How did we meet?", type: "multiple_choice" },
  { question: "What's my favorite food?", type: "multiple_choice" },
  { question: "What's my course in college?", type: "multiple_choice" },
  { question: "Am I a morning person?", type: "true_false" },
  { question: "What's my favorite color?", type: "multiple_choice" },
  { question: "Have I ever been out of the country?", type: "true_false" },
  { question: "What's my go-to comfort food?", type: "multiple_choice" },
  { question: "Do I prefer cats or dogs?", type: "multiple_choice" },
  { question: "What's my favorite season?", type: "multiple_choice" },
  { question: "Have I watched more than 10 K-dramas?", type: "true_false" },
]

type Question = {
  id?: string
  question: string
  type: 'multiple_choice' | 'true_false'
  choices: string[]
  answer: string
  order_index: number
}

type Guest = {
  id: string
  name: string
  score: number
  character_config: Record<string, number> | null
  created_at: string
}

const emptyQuestion = (): Question => ({
  question: '',
  type: 'multiple_choice',
  choices: ['', '', '', ''],
  answer: '',
  order_index: 0
})

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState<'quiz' | 'guests'>('quiz')

  // Quiz state
  const [questions, setQuestions] = useState<Question[]>([])
  const [draft, setDraft] = useState<Question>(emptyQuestion())
  const [saving, setSaving] = useState(false)

  // Guest state
  const [guests, setGuests] = useState<Guest[]>([])
  const [sortBy, setSortBy] = useState<'score' | 'created_at'>('score')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmClearAll, setConfirmClearAll] = useState(false)

  const [toast, setToast] = useState('')

  useEffect(() => {
    if (authed) {
      fetchQuestions()
      fetchGuests()
    }
  }, [authed])

  useEffect(() => {
    if (authed) fetchGuests()
  }, [sortBy, sortDir])

  async function fetchQuestions() {
    const { data } = await supabase.from('questions').select('*').order('order_index')
    if (data) setQuestions(data)
  }

  async function fetchGuests() {
    const { data } = await supabase
      .from('guests')
      .select('*')
      .order(sortBy, { ascending: sortDir === 'asc' })
    if (data) setGuests(data)
  }

  function handleAuth() {
    if (password === process.env.NEXT_PUBLIC_ADMIN_SECRET) {
      setAuthed(true)
    } else {
      setAuthError('Wrong password!')
    }
  }

  function applyDraftSuggestion(s: { question: string; type: string }) {
    setDraft({
      ...emptyQuestion(),
      question: s.question,
      type: s.type as 'multiple_choice' | 'true_false',
      choices: s.type === 'true_false' ? ['True', 'False'] : ['', '', '', '']
    })
  }

  async function saveQuestion() {
    if (!draft.question.trim()) return showToast('Add a question first!')
    if (!draft.answer.trim()) return showToast('Set the correct answer!')
    if (draft.type === 'multiple_choice' && draft.choices.some(c => !c.trim()))
      return showToast('Fill in all choices!')

    setSaving(true)
    const payload = {
      question: draft.question.trim(),
      type: draft.type,
      choices: draft.type === 'true_false' ? ['True', 'False'] : draft.choices.map(c => c.trim()),
      answer: draft.answer.trim(),
      order_index: draft.id ? draft.order_index : questions.length
    }

    if (draft.id) {
      await supabase.from('questions').update(payload).eq('id', draft.id)
    } else {
      await supabase.from('questions').insert(payload)
    }

    await fetchQuestions()
    setDraft(emptyQuestion())
    setSaving(false)
    showToast('Question saved!')
  }

  async function deleteQuestion(id: string) {
    await supabase.from('questions').delete().eq('id', id)
    await fetchQuestions()
    showToast('Deleted!')
  }

  function editQuestion(q: Question) {
    setDraft(q)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteGuest(id: string) {
    await supabase.from('guests').delete().eq('id', id)
    setConfirmDelete(null)
    await fetchGuests()
    showToast('Guest removed!')
  }

  async function clearAllGuests() {
    await supabase.from('guests').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setConfirmClearAll(false)
    await fetchGuests()
    showToast('All guests cleared!')
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const s = {
    page: { minHeight: '100vh', background: 'var(--cream)', padding: '24px' } as React.CSSProperties,
    card: { background: '#fff', border: 'var(--border)', borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow)', marginBottom: '16px' } as React.CSSProperties,
    label: { fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: '8px', display: 'block' },
    input: { width: '100%', border: 'var(--border)', borderRadius: '10px', padding: '10px 14px', fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 700, background: 'var(--cream)', outline: 'none', marginBottom: '12px', boxShadow: 'var(--shadow-sm)' } as React.CSSProperties,
    btn: (bg: string, color = 'var(--black)') => ({ background: bg, border: 'var(--border)', borderRadius: '10px', padding: '10px 18px', fontFamily: "'Titan One', cursive", fontSize: '15px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', color } as React.CSSProperties),
    tab: (active: boolean) => ({ flex: 1, padding: '14px', fontFamily: "'Titan One', cursive", fontSize: '16px', background: active ? 'var(--yellow)' : 'var(--cream)', border: 'none', borderBottom: 'var(--border)', cursor: 'pointer', color: 'var(--black)' } as React.CSSProperties),
  }

  if (!authed) return (
    <main style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...s.card, maxWidth: '360px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Titan One', cursive", fontSize: '28px', marginBottom: '4px' }}>Admin</h1>
        <p style={{ fontSize: '13px', color: '#aaa', fontWeight: 600, marginBottom: '20px' }}>Gatherly host access only</p>
        <input type="password" placeholder="Enter password..." value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAuth()}
          style={s.input} />
        {authError && <p style={{ color: 'var(--red)', fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>{authError}</p>}
        <button onClick={handleAuth} style={s.btn('var(--yellow)')}>Enter</button>
      </div>
    </main>
  )

  return (
    <main style={s.page}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'var(--mint)', border: 'var(--border)', borderRadius: '10px', padding: '10px 18px', fontWeight: 800, fontSize: '14px', boxShadow: 'var(--shadow)', zIndex: 100 }}>
          {toast}
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ ...s.card, maxWidth: '320px', width: '90%', textAlign: 'center', marginBottom: 0 }}>
            <p style={{ fontFamily: "'Titan One', cursive", fontSize: '20px', marginBottom: '8px' }}>Remove guest?</p>
            <p style={{ fontSize: '13px', color: '#aaa', fontWeight: 600, marginBottom: '20px' }}>This can't be undone.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ ...s.btn('var(--cream)'), flex: 1 }}>Cancel</button>
              <button onClick={() => deleteGuest(confirmDelete)} style={{ ...s.btn('var(--red)', '#fff'), flex: 1 }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm clear all modal */}
      {confirmClearAll && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ ...s.card, maxWidth: '320px', width: '90%', textAlign: 'center', marginBottom: 0 }}>
            <p style={{ fontFamily: "'Titan One', cursive", fontSize: '20px', marginBottom: '8px' }}>Clear all guests?</p>
            <p style={{ fontSize: '13px', color: '#aaa', fontWeight: 600, marginBottom: '20px' }}>Everyone gets removed. This can't be undone.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmClearAll(false)} style={{ ...s.btn('var(--cream)'), flex: 1 }}>Cancel</button>
              <button onClick={clearAllGuests} style={{ ...s.btn('var(--red)', '#fff'), flex: 1 }}>Clear All</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Titan One', cursive", fontSize: '32px', marginBottom: '20px' }}>Gatherly Admin</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', border: 'var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <button onClick={() => setActiveTab('quiz')} style={s.tab(activeTab === 'quiz')}>Quiz Builder</button>
          <button onClick={() => setActiveTab('guests')} style={{ ...s.tab(activeTab === 'guests'), borderBottom: 'none' }}>
            Guests {guests.length > 0 && `(${guests.length})`}
          </button>
        </div>

        {/* Quiz Builder Tab */}
        {activeTab === 'quiz' && (
          <>
            <div style={s.card}>
              <h2 style={{ fontFamily: "'Titan One', cursive", fontSize: '18px', marginBottom: '16px' }}>
                {draft.id ? 'Edit Question' : 'Add Question'}
              </h2>

              <span style={s.label}>Question type</span>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                {(['multiple_choice', 'true_false'] as const).map(t => (
                  <button key={t} onClick={() => setDraft({ ...draft, type: t, choices: t === 'true_false' ? ['True', 'False'] : ['', '', '', ''], answer: '' })}
                    style={{ ...s.btn(draft.type === t ? 'var(--yellow)' : 'var(--cream)'), fontSize: '13px', padding: '8px 14px' }}>
                    {t === 'multiple_choice' ? 'Multiple Choice' : 'True / False'}
                  </button>
                ))}
              </div>

              <span style={s.label}>Question</span>
              <input style={s.input} placeholder="Type your question..." value={draft.question}
                onChange={e => setDraft({ ...draft, question: e.target.value })} />

              {draft.type === 'multiple_choice' ? (
                <>
                  <span style={s.label}>Choices</span>
                  {draft.choices.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <input style={{ ...s.input, marginBottom: 0, flex: 1 }} placeholder={`Choice ${i + 1}`}
                        value={c} onChange={e => { const ch = [...draft.choices]; ch[i] = e.target.value; setDraft({ ...draft, choices: ch }) }} />
                      <input type="radio" name="answer" checked={draft.answer === c}
                        onChange={() => setDraft({ ...draft, answer: c })}
                        title="Mark as correct" style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }} />
                    </div>
                  ))}
                  <p style={{ fontSize: '11px', color: '#aaa', fontWeight: 700, marginBottom: '14px' }}>Select the radio button next to the correct answer</p>
                </>
              ) : (
                <>
                  <span style={s.label}>Correct answer</span>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                    {['True', 'False'].map(opt => (
                      <button key={opt} onClick={() => setDraft({ ...draft, answer: opt })}
                        style={{ ...s.btn(draft.answer === opt ? 'var(--mint)' : 'var(--cream)'), fontSize: '14px' }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <button onClick={saveQuestion} disabled={saving}
                style={{ ...s.btn('var(--red)', '#fff'), width: '100%', fontSize: '16px', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : draft.id ? 'Update Question' : 'Add Question'}
              </button>
            </div>

            <div style={s.card}>
              <h2 style={{ fontFamily: "'Titan One', cursive", fontSize: '18px', marginBottom: '12px' }}>Suggestion Bank</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SUGGESTION_BANK.map((s, i) => (
                  <button key={i} onClick={() => applyDraftSuggestion(s)}
                    style={{ background: 'var(--cream)', border: 'var(--border)', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
                    {s.question}
                  </button>
                ))}
              </div>
            </div>

            {questions.length > 0 && (
              <div style={s.card}>
                <h2 style={{ fontFamily: "'Titan One', cursive", fontSize: '18px', marginBottom: '12px' }}>Quiz Questions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {questions.map((q, i) => (
                    <div key={q.id} style={{ background: 'var(--cream)', border: 'var(--border)', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: 800 }}>{i + 1}. {q.question}</p>
                        <p style={{ fontSize: '11px', color: '#aaa', fontWeight: 700, marginTop: '2px' }}>
                          {q.type === 'true_false' ? 'True/False' : 'Multiple Choice'} · Answer: <span style={{ color: 'var(--red)' }}>{q.answer}</span>
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button onClick={() => editQuestion(q)} style={{ ...s.btn('var(--yellow)'), fontSize: '12px', padding: '6px 12px' }}>Edit</button>
                        <button onClick={() => deleteQuestion(q.id!)} style={{ ...s.btn('var(--red)', '#fff'), fontSize: '12px', padding: '6px 12px' }}>Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Guests Tab */}
        {activeTab === 'guests' && (
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ fontFamily: "'Titan One', cursive", fontSize: '18px' }}>
                Guest Tracker
              </h2>
              <button onClick={() => setConfirmClearAll(true)}
                style={{ ...s.btn('var(--red)', '#fff'), fontSize: '13px', padding: '8px 14px' }}>
                Clear All
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{ ...s.label, marginBottom: 0, alignSelf: 'center' }}>Sort by</span>
              {(['score', 'created_at'] as const).map(opt => (
                <button key={opt} onClick={() => setSortBy(opt)}
                  style={{ ...s.btn(sortBy === opt ? 'var(--yellow)' : 'var(--cream)'), fontSize: '12px', padding: '6px 14px' }}>
                  {opt === 'score' ? 'Score' : 'Join Time'}
                </button>
              ))}
              <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                style={{ ...s.btn('var(--mint)'), fontSize: '12px', padding: '6px 14px' }}>
                {sortDir === 'desc' ? 'Highest first' : 'Lowest first'}
              </button>
            </div>

            {guests.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#aaa', fontWeight: 600, textAlign: 'center', padding: '20px 0' }}>No guests yet!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {guests.map((g, i) => (
                  <div key={g.id} style={{ background: 'var(--cream)', border: 'var(--border)', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <div style={{ background: i === 0 && sortBy === 'score' && sortDir === 'desc' ? 'var(--yellow)' : 'var(--mint)', border: 'var(--border)', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Titan One', cursive", fontSize: '13px', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 800 }}>{g.name}</p>
                        <p style={{ fontSize: '11px', color: '#aaa', fontWeight: 700, marginTop: '2px' }}>
                          Score: <span style={{ color: 'var(--red)' }}>{g.score}</span> · {g.character_config ? 'Character set' : 'No character yet'} · {new Date(g.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setConfirmDelete(g.id)}
                      style={{ ...s.btn('var(--red)', '#fff'), fontSize: '12px', padding: '6px 12px', flexShrink: 0 }}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}