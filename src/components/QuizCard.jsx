import TimerBar from './TimerBar'

const TIMER_DURATION = 10 // seconds

export default function QuizCard({ question, questionIndex, total, onAnswer }) {
  const { key, roman, chordName, inversion, notes, quality } = question

  function handleAnswer(correct) {
    onAnswer(correct)
  }

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
            <span key={i} className="note-pill">{note}</span>
          ))}
        </div>
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
