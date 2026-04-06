import { useState, useMemo } from 'react'
import { ALL_KEYS, getDiatonicChordNames } from '../utils/musicTheory'
import { loadStats } from '../utils/stats'

const QUALITY_OPTIONS = [
  { value: 'maj', label: 'Major' },
  { value: 'min', label: 'Minor' },
  { value: 'dim', label: 'Diminished' },
]

// Returns null (no data), or a 0–1 accuracy value for a key
// given the current quality filter and stored stats.
function keyAccuracy(key, qualities, stats) {
  const chordNames = getDiatonicChordNames(key)
    .filter(c => qualities.includes(c.quality))
    .map(c => c.chordName)

  const relevant = Object.values(stats).filter(e => chordNames.includes(e.chordName))
  if (relevant.length === 0) return null

  const attempts = relevant.reduce((s, e) => s + e.attempts, 0)
  const correct  = relevant.reduce((s, e) => s + e.correct, 0)
  return attempts > 0 ? correct / attempts : null
}

function heatClass(acc) {
  if (acc === null) return ''
  if (acc < 0.5)  return 'heat-low'
  if (acc < 0.85) return 'heat-mid'
  return 'heat-high'
}

export default function KeySelector({ onStart, onStats }) {
  const [selectedKey, setSelectedKey] = useState('C')
  const [qualities, setQualities] = useState(['maj'])
  const stats = useMemo(() => loadStats(), [])

  function toggleQuality(q) {
    setQualities(prev =>
      prev.includes(q)
        ? prev.filter(x => x !== q)
        : [...prev, q]
    )
  }

  const canStart = selectedKey && qualities.length > 0

  return (
    <div className="key-selector">
      <h1 className="app-title">Triad Trials</h1>
      <p className="subtitle">Pick a key to drill diatonic triads</p>

      <div className="key-grid">
        {ALL_KEYS.map(key => {
          const acc = keyAccuracy(key, qualities, stats)
          const heat = heatClass(acc)
          return (
            <button
              key={key}
              className={`key-btn ${selectedKey === key ? 'selected' : ''} ${heat}`}
              onClick={() => setSelectedKey(key)}
            >
              {key}
            </button>
          )
        })}
      </div>

      <div className="quality-filter">
        <span className="filter-label">Chord types</span>
        <div className="quality-checks">
          {QUALITY_OPTIONS.map(({ value, label }) => (
            <label key={value} className={`quality-chip ${qualities.includes(value) ? 'checked' : ''}`}>
              <input
                type="checkbox"
                checked={qualities.includes(value)}
                onChange={() => toggleQuality(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <button
        className="start-btn"
        disabled={!canStart}
        onClick={() => canStart && onStart(selectedKey, qualities)}
      >
        Start Quiz
      </button>

      <button className="stats-link" onClick={onStats}>
        View lifetime stats
      </button>
    </div>
  )
}
