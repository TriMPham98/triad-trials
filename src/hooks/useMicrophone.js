import { useEffect, useRef, useState } from 'react'
import { autoCorrelate, freqToNoteName, noteToSemitone } from '../utils/pitchDetection'

const COOLDOWN_MS = 800
const NOTE_DEBOUNCE_MS = 350

function computeRMS(buf) {
  let sum = 0
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
  return Math.sqrt(sum / buf.length)
}

export function useMicrophone({ expectedNotes, cardKey, onAllDetected }) {
  const [detectedCount, setDetectedCount] = useState(0)
  const [currentNote, setCurrentNote] = useState(null)
  const [micStatus, setMicStatus] = useState('requesting')
  const [micLevel, setMicLevel] = useState(0) // 0–1 signal strength for VU meter

  const expectedRef = useRef(expectedNotes)
  const onAllDetectedRef = useRef(onAllDetected)
  const nextIndexRef = useRef(0)
  const inDebounceRef = useRef(true)
  const lastPitchTickRef = useRef(0)
  const lastLevelTickRef = useRef(0)
  const debounceTimerRef = useRef(null)

  useEffect(() => { onAllDetectedRef.current = onAllDetected }, [onAllDetected])

  // Reset detection state on new card
  useEffect(() => {
    expectedRef.current = expectedNotes
    nextIndexRef.current = 0
    setDetectedCount(0)
    setCurrentNote(null)

    clearTimeout(debounceTimerRef.current)
    inDebounceRef.current = true
    debounceTimerRef.current = setTimeout(() => {
      inDebounceRef.current = false
    }, COOLDOWN_MS)
  }, [cardKey]) // eslint-disable-line react-hooks/exhaustive-deps

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

          analyser.getFloatTimeDomainData(buffer)
          const now = performance.now()

          // VU meter at ~15 fps — cheap RMS, no autocorrelation needed
          if (now - lastLevelTickRef.current >= 67) {
            lastLevelTickRef.current = now
            const rms = computeRMS(buffer)
            setMicLevel(Math.min(1, rms / 0.08))
          }

          // Pitch detection throttled to ~20 fps
          if (now - lastPitchTickRef.current < 50) return
          lastPitchTickRef.current = now

          if (inDebounceRef.current) return

          const freq = autoCorrelate(buffer, audioCtx.sampleRate)
          if (freq <= 0) return

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
                onAllDetectedRef.current()
                return
              }
            }
          }

          setTimeout(() => { inDebounceRef.current = false }, NOTE_DEBOUNCE_MS)
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
  }, [])

  return { detectedCount, currentNote, micStatus, micLevel }
}
