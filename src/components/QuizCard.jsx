import { useEffect, useRef } from 'react'
import TimerBar from './TimerBar'
import { useMicrophone } from '../hooks/useMicrophone'

const TIMER_DURATION = 10 // seconds

export default function QuizCard({ question, questionIndex, total, onAnswer }) {
  const { key, roman, chordName, inversion, notes } = question

  // Guard against double-calling onAnswer (mic + timer race)
  const answeredRef = useRef(false)
  useEffect(() => { answeredRef.current = false }, [questionIndex])

  function handleAnswer(correct) {
    if (answeredRef.current) return
    answeredRef.current = true
    onAnswer(correct)
  }

  const { detectedCount, currentNote, micStatus } = useMicrophone({
    expectedNotes: notes,
    cardKey: questionIndex,
    onAllDetected: () => handleAnswer(true),
  })

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
              className={`note-pill ${i < detectedCount ? 'detected' : ''}`}
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
          <span className="mic-text mic-error">Mic unavailable — use buttons below</span>
        )}
        {micStatus === 'active' && (
          <span className="mic-text">
            🎤 {currentNote ? `Heard: ${currentNote}` : 'Listening — arpeggio the chord'}
          </span>
        )}
      </div>

      <div className="answer-buttons">
        <button className="btn-missed" onClick={() => handleAnswer(false)}>
          Missed it
        </button>
        <button className="btn-got" onClick={() => handleAnswer(true)}>
          Got it
        </button>
      </div>
    </div>
  )
}
