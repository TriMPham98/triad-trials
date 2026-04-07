// Chromatic notes — we'll pick the right spelling per key
const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLATS  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

// Keys that prefer flat spelling
const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'])

// Major scale intervals (semitones from root)
const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11]

// Triad quality and roman numeral per scale degree (0-indexed)
const DEGREE_INFO = [
  { quality: 'maj', roman: 'I' },
  { quality: 'min', roman: 'ii' },
  { quality: 'min', roman: 'iii' },
  { quality: 'maj', roman: 'IV' },
  { quality: 'maj', roman: 'V' },
  { quality: 'min', roman: 'vi' },
  { quality: 'dim', roman: 'vii°' },
]

// Semitone offsets for each triad quality: [root, third, fifth]
const TRIAD_OFFSETS = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
}

const INVERSIONS = [
  { label: 'Root Position', noteOrder: [0, 1, 2] },
  { label: '1st Inversion', noteOrder: [1, 2, 0] },
  { label: '2nd Inversion', noteOrder: [2, 0, 1] },
]

export const ALL_KEYS = [
  'C', 'G', 'D', 'A', 'E', 'B',
  'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db',
]

function getChroma(key) {
  return FLAT_KEYS.has(key) ? FLATS : SHARPS
}

function noteName(semitone, chroma) {
  return chroma[(semitone % 12 + 12) % 12]
}

// Returns the chord names for all 7 diatonic degrees in a key,
// used to compute per-key accuracy from stored stats.
export function getDiatonicChordNames(key) {
  const chroma = getChroma(key)
  const rootIdx = SHARPS.indexOf(key) !== -1 ? SHARPS.indexOf(key) : FLATS.indexOf(key)
  return DEGREE_INFO.map(({ quality }, degree) => {
    const degreeRoot = (rootIdx + MAJOR_INTERVALS[degree]) % 12
    const name = `${noteName(degreeRoot, chroma)} ${quality === 'maj' ? 'Major' : quality === 'min' ? 'Minor' : 'Diminished'}`
    return { chordName: name, quality }
  })
}

// Weighted sampling without replacement.
// Items with higher weights are more likely to be picked.
function weightedSample(pool, weights, n) {
  const remaining = pool.map((item, i) => ({ item, w: weights[i] }))
  const result = []
  for (let i = 0; i < Math.min(n, remaining.length); i++) {
    const total = remaining.reduce((s, x) => s + x.w, 0)
    let r = Math.random() * total
    let idx = 0
    while (idx < remaining.length - 1 && r > remaining[idx].w) {
      r -= remaining[idx].w
      idx++
    }
    result.push(remaining[idx].item)
    remaining.splice(idx, 1)
  }
  return result
}

export function generateQuiz(key, qualities = ['maj', 'min', 'dim'], stats = {}) {
  const chroma = getChroma(key)
  const rootIdx = SHARPS.indexOf(key) !== -1 ? SHARPS.indexOf(key) : FLATS.indexOf(key)
  const pool = []

  for (let degree = 0; degree < 7; degree++) {
    const degreeRoot = (rootIdx + MAJOR_INTERVALS[degree]) % 12
    const { quality, roman } = DEGREE_INFO[degree]
    if (!qualities.includes(quality)) continue

    const offsets = TRIAD_OFFSETS[quality]
    const triadNotes = offsets.map(o => noteName(degreeRoot + o, chroma))
    const chordName = `${noteName(degreeRoot, chroma)} ${quality === 'maj' ? 'Major' : quality === 'min' ? 'Minor' : 'Diminished'}`

    for (const inv of INVERSIONS) {
      const rootIndex = inv.noteOrder.indexOf(0)
      pool.push({
        key, roman, chordName, quality,
        inversion: inv.label,
        notes: inv.noteOrder.map(i => triadNotes[i]),
        rootIndex,
      })
    }
  }

  // Weight each question by weakness: low accuracy → high weight
  const MIN_WEIGHT = 0.2
  const UNKNOWN_WEIGHT = 0.7
  const weights = pool.map(q => {
    const entry = stats[`${q.chordName}|${q.inversion}`]
    if (!entry || entry.attempts === 0) return UNKNOWN_WEIGHT
    return Math.max(MIN_WEIGHT, 1 - entry.correct / entry.attempts)
  })

  return weightedSample(pool, weights, 9)
}
