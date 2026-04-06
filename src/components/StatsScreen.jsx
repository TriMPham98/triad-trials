import { useState } from 'react'
import { loadStats } from '../utils/stats'

const INVERSION_ORDER = ['Root Position', '1st Inversion', '2nd Inversion']

export default function StatsScreen({ onBack }) {
  const [stats, setStats] = useState(() => loadStats())

  const entries = Object.values(stats)

  // Group by chord name
  const groups = {}
  for (const entry of entries) {
    if (!groups[entry.chordName]) groups[entry.chordName] = []
    groups[entry.chordName].push(entry)
  }

  // Sort inversions within each group
  for (const key of Object.keys(groups)) {
    groups[key].sort(
      (a, b) => INVERSION_ORDER.indexOf(a.inversion) - INVERSION_ORDER.indexOf(b.inversion)
    )
  }

  const chordNames = Object.keys(groups).sort()

  function handleClear() {
    localStorage.removeItem('triad-trials-stats')
    setStats({})
  }

  return (
    <div className="stats-screen">
      <div className="stats-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2 className="results-title">Lifetime Stats</h2>
        {entries.length > 0 && (
          <button className="clear-btn" onClick={handleClear}>Clear</button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="stats-empty">No data yet — complete a quiz to start tracking.</p>
      ) : (
        <div className="stats-list">
          {chordNames.map(chordName => (
            <div key={chordName} className="stats-group">
              <div className="stats-group-name">{chordName}</div>
              {groups[chordName].map((entry, i) => {
                const pct = Math.round((entry.correct / entry.attempts) * 100)
                return (
                  <div key={i} className="stats-row">
                    <span className="stats-inv">{entry.inversion}</span>
                    <div className="stats-bar-wrap">
                      <div
                        className={`stats-bar ${pct < 50 ? 'bar-low' : pct < 80 ? 'bar-mid' : 'bar-high'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`stat-pct ${pct < 50 ? 'stat-low' : pct < 80 ? 'stat-mid' : 'stat-high'}`}>
                      {pct}%
                    </span>
                    <span className="stats-attempts">{entry.correct}/{entry.attempts}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
