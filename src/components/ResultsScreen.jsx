export default function ResultsScreen({ results, stats, onPlayAgain }) {
  const correct = results.filter(r => r.correct).length
  const total = results.length
  const pct = Math.round((correct / total) * 100)

  // All triads practiced this session, with their lifetime stats
  const sessionKeys = results.map(r => `${r.question.chordName}|${r.question.inversion}`)
  const uniqueKeys = [...new Set(sessionKeys)]
  const sessionStats = uniqueKeys.map(key => stats?.[key]).filter(Boolean)

  return (
    <div className="results-screen">
      <h2 className="results-title">Results</h2>

      <div className="score-circle">
        <span className="score-num">{correct}</span>
        <span className="score-denom">/ {total}</span>
      </div>
      <div className="score-pct">{pct}%</div>

      {sessionStats.length > 0 && (
        <div className="missed-list">
          <h3>Lifetime accuracy</h3>
          {sessionStats.map((entry, i) => {
            const lifetimePct = Math.round((entry.correct / entry.attempts) * 100)
            return (
              <div key={i} className="missed-item">
                <span className="missed-chord">{entry.chordName}</span>
                <span className="missed-inv">{entry.inversion}</span>
                <span className={`stat-pct ${lifetimePct < 50 ? 'stat-low' : lifetimePct < 80 ? 'stat-mid' : 'stat-high'}`}>
                  {lifetimePct}%
                </span>
                <span className="missed-notes">{entry.correct}/{entry.attempts}</span>
              </div>
            )
          })}
        </div>
      )}

      <button className="start-btn" onClick={onPlayAgain}>
        Play Again
      </button>
    </div>
  )
}
