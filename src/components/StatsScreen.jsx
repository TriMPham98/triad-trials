import { useState } from 'react'
import { loadStats } from '../utils/stats'

const INVERSION_ORDER = ['Root Position', '1st Inversion', '2nd Inversion']

export default function StatsScreen({ onBack }) {
  const [stats, setStats] = useState(() => loadStats())

  const entries = Object.values(stats)

  // Group by chord name, sort inversions canonically
  const groups = {}
  for (const entry of entries) {
    if (!groups[entry.chordName]) groups[entry.chordName] = []
    groups[entry.chordName].push(entry)
  }
  for (const key of Object.keys(groups)) {
    groups[key].sort(
      (a, b) => INVERSION_ORDER.indexOf(a.inversion) - INVERSION_ORDER.indexOf(b.inversion)
    )
  }

  // Sort groups: worst average accuracy first
  const sortedChords = Object.keys(groups).sort((a, b) => {
    const avg = (entries) => entries.reduce((s, e) => s + e.correct / e.attempts, 0) / entries.length
    return avg(groups[a]) - avg(groups[b])
  })

  function handleClear() {
    localStorage.removeItem('triad-trials-stats')
    setStats({})
  }

  const totalAttempts = entries.reduce((s, e) => s + e.attempts, 0)
  const totalCorrect  = entries.reduce((s, e) => s + e.correct, 0)
  const overallPct    = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null

  return (
    <div className="stats-screen">
      <div className="stats-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2 className="results-title">Lifetime Stats</h2>
        {entries.length > 0
          ? <button className="clear-btn" onClick={handleClear}>Clear</button>
          : <span />
        }
      </div>

      {entries.length === 0 ? (
        <p className="stats-empty">No data yet — complete a quiz to start tracking.</p>
      ) : (
        <>
          <div className="stats-overall">
            <span className="overall-label">Overall</span>
            <span className={`overall-pct ${overallPct < 50 ? 'stat-low' : overallPct < 80 ? 'stat-mid' : 'stat-high'}`}>
              {overallPct}%
            </span>
            <span className="overall-count">{totalCorrect}/{totalAttempts}</span>
          </div>

          <div className="stats-list">
            {sortedChords.map(chordName => (
              <div key={chordName} className="stats-group">
                <div className="stats-group-name">{chordName}</div>
                {groups[chordName].map((entry, i) => {
                  const pct = Math.round((entry.correct / entry.attempts) * 100)
                  const cls = pct < 50 ? 'stat-low' : pct < 80 ? 'stat-mid' : 'stat-high'
                  const barCls = pct < 50 ? 'bar-low' : pct < 80 ? 'bar-mid' : 'bar-high'
                  return (
                    <div key={i} className="stats-entry">
                      <div className="stats-entry-header">
                        <span className="stats-inv">{entry.inversion}</span>
                        <span className={`stat-pct ${cls}`}>{pct}%</span>
                      </div>
                      <div className="stats-bar-wrap">
                        <div className={`stats-bar ${barCls}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="stats-count">{entry.correct} correct out of {entry.attempts}</div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
