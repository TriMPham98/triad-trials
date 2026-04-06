const STORAGE_KEY = 'triad-trials-stats'

export function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function saveStats(stats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
}

// Applies all results from a completed quiz to the stored stats and saves.
// Returns the updated stats object.
export function applyResults(results) {
  const stats = loadStats()
  for (const { question, correct } of results) {
    const key = `${question.chordName}|${question.inversion}`
    const entry = stats[key] ?? { attempts: 0, correct: 0, chordName: question.chordName, inversion: question.inversion }
    entry.attempts += 1
    entry.correct += correct ? 1 : 0
    stats[key] = entry
  }
  saveStats(stats)
  return stats
}
