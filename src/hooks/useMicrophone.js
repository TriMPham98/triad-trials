import { useEffect, useRef, useState } from 'react'
import { autoCorrelate, freqToNoteName, noteToSemitone } from '../utils/pitchDetection'

// Detects notes played into the mic and matches them in order against expectedNotes.
// Resets detection state whenever cardKey changes (new question).
// Calls onAllDetected() once all expected notes are matched in sequence.
export function useMicrophone({ expectedNotes, cardKey, onAllDetected }) {
  const [detectedCount, setDetectedCount] = useState(0)
  const [currentNote, setCurrentNote] = useState(null)
  const [micStatus, setMicStatus] = useState('requesting') // 'requesting' | 'active' | 'error'

  // Mutable refs for the detection loop (avoids stale closures)
  const expectedRef = useRef(expectedNotes)
  const onAllDetectedRef = useRef(onAllDetected)
  const nextIndexRef = useRef(0)
  const inDebounceRef = useRef(true)
  const lastTickRef = useRef(0)
  const debounceTimerRef = useRef(null)

  // Keep callback ref current
  useEffect(() => { onAllDetectedRef.current = onAllDetected }, [onAllDetected])

  // Reset detection state on new card, with a cooldown so sustained notes don't bleed over
  const COOLDOWN_MS = 800
  useEffect(() => {
    expectedRef.current = expectedNotes
    nextIndexRef.current = 0
    setDetectedCount(0)
    setCurrentNote(null)

    // Block detection during cooldown
    clearTimeout(debounceTimerRef.current)
    inDebounceRef.current = true
    debounceTimerRef.current = setTimeout(() => {
      inDebounceRef.current = false
    }, COOLDOWN_MS)
  }, [cardKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Set up audio pipeline once on mount
  useEffect(() => {
    let cancelled = false
    let stream = null
    let audioCtx = null
    let rafId = null

    async function setup() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

        audioCtx = new AudioContext()
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0

        const source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)

        const buffer = new Float32Array(analyser.fftSize)
        setMicStatus('active')

        function detect() {
          if (cancelled) return
          rafId = requestAnimationFrame(detect)

          // Throttle heavy autocorrelation to ~20 fps
          const now = performance.now()
          if (now - lastTickRef.current < 50) return
          lastTickRef.current = now

          if (inDebounceRef.current) return

          analyser.getFloatTimeDomainData(buffer)
          const freq = autoCorrelate(buffer, audioCtx.sampleRate)
          if (freq <= 0) return

          // Note onset detected — debounce immediately so we don't re-fire
          inDebounceRef.current = true
          const noteName = freqToNoteName(freq)
          setCurrentNote(noteName)

          const idx = nextIndexRef.current
          const expected = expectedRef.current
          if (idx < expected.length) {
            const expectedSemi = noteToSemitone(expected[idx])
            const detectedSemi = noteToSemitone(noteName)

            if (detectedSemi !== -1 && detectedSemi === expectedSemi) {
              const newIdx = idx + 1
              nextIndexRef.current = newIdx
              setDetectedCount(newIdx)

              if (newIdx >= expected.length) {
                // All notes matched — signal success, stay in debounce forever
                onAllDetectedRef.current()
                return
              }
            }
          }

          // Release debounce after 500 ms so user can play the next note
          setTimeout(() => { inDebounceRef.current = false }, 500)
        }

        rafId = requestAnimationFrame(detect)
      } catch {
        if (!cancelled) setMicStatus('error')
      }
    }

    setup()

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
      if (audioCtx) audioCtx.close()
      if (stream) stream.getTracks().forEach(t => t.stop())
      clearTimeout(debounceTimerRef.current)
    }
  }, []) // run once on mount

  return { detectedCount, currentNote, micStatus }
}
