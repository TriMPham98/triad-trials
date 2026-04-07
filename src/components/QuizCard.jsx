import { useEffect, useRef, useState } from 'react'
import TimerBar from './TimerBar'
import { useMicrophone } from '../hooks/useMicrophone'

const TIMER_DURATION = 10
const FALLBACK_DELAY_MS = 5000

export default function QuizCard({ question, questionIndex, total, onAnswer }) {
  const { key, roman, chordName, inversion, notes, rootIndex } = question

  const answeredRef = useRef(false)
  useEffect(() => { answeredRef.current = false }, [questionIndex])

  function handleAnswer(correct) {
    if (answeredRef.current) return
    answeredRef.current = true
    onAnswer(correct)
  }

  const { detectedCount, currentNote, micStatus, micLevel } = useMicrophone({
    expectedNotes: notes,
    cardKey: questionIndex,
    onAllDetected: () => handleAnswer(true),
  })

  // Show fallback buttons if mic is unavailable or goes silent for 5s
  const [showFallback, setShowFallback] = useState(false)
  useEffect(() => {
    if (micStatus === 'error') { setShowFallback(true); return }
    if (micStatus !== 'active') return
    setShowFallback(false)
    const t = setTimeout(() => setShowFallback(true), FALLBACK_DELAY_MS)
    return () => clearTimeout(t)
  }, [currentNote, questionIndex, micStatus])

  return (
    <div className="quiz-card">
      <div className="quiz-meta">
        <span className="key-badge">Key of {key} Major</span>
        <span className="progress">{questionIndex + 1} / {total}</span>
      </div>

      <TimerBar
        duration={TIMER_DURATION}
        onExpire={() => handleAnswer(false)}
        cardKey={questionIndex}
      />

      <div className="chord-display">
        <div className="roman">{roman}</div>
        <div className="chord-name">{chordName}</div>
        <div className="inversion-label">{inversion}</div>
        <div className="notes-row">
          {notes.map((note, i) => (
            <span
              key={i}
              className={`note-pill ${i === rootIndex ? 'root' : ''} ${i < detectedCount ? 'detected' : ''}`}
            >
              {note}
              {i < detectedCount && <span className="check"> ✓</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="mic-status">
        {micStatus === 'requesting' && (
          <span className="mic-text">Requesting microphone…</span>
        )}
        {micStatus === 'error' && (
          <span className="mic-text mic-error">Mic unavailable</span>
        )}
        {micStatus === 'active' && (
          <div className="mic-active-row">
            <span className="mic-text">
              🎤 {currentNote ? `Heard: ${currentNote}` : 'Listening…'}
            </span>
            <div className="vu-track">
              <div className="vu-fill" style={{ width: `${micLevel * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {showFallback && (
        <div className="fallback-buttons">
          <button className="btn-missed" onClick={() => handleAnswer(false)}>
            Missed it
          </button>
          <button className="btn-got" onClick={() => handleAnswer(true)}>
            Got it
          </button>
        </div>
      )}
    </div>
  )
}
