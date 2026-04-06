const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const NOTE_TO_SEMITONE = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
}

export function noteToSemitone(name) {
  return NOTE_TO_SEMITONE[name] ?? -1
}

export function freqToNoteName(freq) {
  if (freq <= 0) return null
  const midi = Math.round(12 * Math.log2(freq / 440) + 69)
  return NOTE_NAMES[((midi % 12) + 12) % 12]
}

// Autocorrelation pitch detection (monophonic). Returns fundamental frequency
// in Hz, or -1 if the signal is too quiet or no clear pitch is found.
export function autoCorrelate(buf, sampleRate) {
  const SIZE = buf.length
  let rms = 0
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i]
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.012) return -1

  // Trim leading/trailing low-amplitude samples for a cleaner window
  let r1 = 0, r2 = SIZE - 1
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < 0.2) { r1 = i; break }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < 0.2) { r2 = SIZE - i; break }
  }

  const slice = buf.slice(r1, r2 + 1)
  const n = slice.length
  if (n < 4) return -1

  // Unnormalized autocorrelation
  const c = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i; j++) {
      c[i] += slice[j] * slice[j + i]
    }
  }

  // Find first dip (move past the zero-lag peak)
  let d = 0
  while (d < n - 1 && c[d] > c[d + 1]) d++

  // Find the highest peak after the dip
  let maxVal = -1, maxPos = -1
  for (let i = d; i < n; i++) {
    if (c[i] > maxVal) { maxVal = c[i]; maxPos = i }
  }
  if (maxPos < 1 || maxPos >= n - 1) return -1

  // Parabolic interpolation for sub-sample accuracy
  const x1 = c[maxPos - 1], x2 = c[maxPos], x3 = c[maxPos + 1]
  const a = (x1 + x3 - 2 * x2) / 2
  const b = (x3 - x1) / 2
  const T0 = a !== 0 ? maxPos - b / (2 * a) : maxPos

  return sampleRate / T0
}
