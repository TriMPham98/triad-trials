import { useState } from 'react'
import { ALL_KEYS } from '../utils/musicTheory'

const QUALITY_OPTIONS = [
  { value: 'maj', label: 'Major' },
  { value: 'min', label: 'Minor' },
  { value: 'dim', label: 'Diminished' },
]

export default function KeySelector({ onStart, onStats }) {
  const [selectedKey, setSelectedKey] = useState('C')
  const [qualities, setQualities] = useState(['maj'])

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
        {ALL_KEYS.map(key => (
          <button
            key={key}
            className={`key-btn ${selectedKey === key ? 'selected' : ''}`}
            onClick={() => setSelectedKey(key)}
          >
            {key}
          </button>
        ))}
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
