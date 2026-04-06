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

export function generateQuiz(key, qualities = ['maj', 'min', 'dim']) {
  const chroma = getChroma(key)
  const rootIdx = SHARPS.indexOf(key) !== -1 ? SHARPS.indexOf(key) : FLATS.indexOf(key)
  const questions = []

  for (let degree = 0; degree < 7; degree++) {
    const degreeRoot = (rootIdx + MAJOR_INTERVALS[degree]) % 12
    const { quality, roman } = DEGREE_INFO[degree]
    if (!qualities.includes(quality)) continue

    const offsets = TRIAD_OFFSETS[quality]

    // The three absolute note pitches for this triad
    const triadNotes = offsets.map(o => noteName(degreeRoot + o, chroma))
    const chordName = `${noteName(degreeRoot, chroma)} ${quality === 'maj' ? 'Major' : quality === 'min' ? 'Minor' : 'Diminished'}`

    for (const inv of INVERSIONS) {
      questions.push({
        key,
        roman,
        chordName,
        quality,
        inversion: inv.label,
        notes: inv.noteOrder.map(i => triadNotes[i]),
      })
    }
  }

  // Fisher-Yates shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[questions[i], questions[j]] = [questions[j], questions[i]]
  }

  return questions.slice(0, 10)
}
