export default function ResultsScreen({ results, onPlayAgain }) {
  const correct = results.filter(r => r.correct).length
  const total = results.length
  const pct = Math.round((correct / total) * 100)

  const missed = results.filter(r => !r.correct)

  return (
    <div className="results-screen">
      <h2 className="results-title">Results</h2>

      <div className="score-circle">
        <span className="score-num">{correct}</span>
        <span className="score-denom">/ {total}</span>
      </div>
      <div className="score-pct">{pct}%</div>

      {missed.length > 0 && (
        <div className="missed-list">
          <h3>Review these:</h3>
          {missed.map((r, i) => (
            <div key={i} className="missed-item">
              <span className="missed-chord">{r.question.chordName}</span>
              <span className="missed-inv">{r.question.inversion}</span>
              <span className="missed-notes">{r.question.notes.join(' – ')}</span>
            </div>
          ))}
        </div>
      )}

      <button className="start-btn" onClick={onPlayAgain}>
        Play Again
      </button>
    </div>
  )
}
