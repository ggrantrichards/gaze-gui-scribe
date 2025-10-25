import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { median, ransacAffine, fitQuadraticWeighted, Pt } from '@/utils/calibrationUtils'
import { useGazeTracker } from '@/hooks/useGazeTracker'

type Props = { onComplete: () => void; onSkip?: () => void }

// 12-point layout (3×4) — ensures coverage; bottom-right last
const GRID: Pt[] = [
  { x: 0.1, y: 0.1 }, { x: 0.5, y: 0.1 }, { x: 0.9, y: 0.1 },
  { x: 0.1, y: 0.35 }, { x: 0.5, y: 0.35 }, { x: 0.9, y: 0.35 },
  { x: 0.1, y: 0.65 }, { x: 0.5, y: 0.65 }, { x: 0.9, y: 0.65 },
  { x: 0.1, y: 0.9 }, { x: 0.5, y: 0.9 }, { x: 0.9, y: 0.9 },
]

// Click-based: require 5 bursts per point
const BURSTS_PER_POINT = 5
const SAMPLES_PER_BURST = 16
const SAMPLE_SPACING_MS = 8

// 4 quick validation dots
const VALIDATION_DOTS: Pt[] = [
  { x: 0.5, y: 0.5 }, { x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 }, { x: 0.9, y: 0.9 }
]

const ACCEPTABLE_OVERALL_MEDIAN = 50 // px

function shuffleKeepLast<T>(arr: T[], predicate: (v: T) => boolean): T[] {
  const a = arr.slice()
  const idx = a.findIndex(predicate)
  let last: T | undefined
  if (idx >= 0) last = a.splice(idx, 1)[0]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  if (last) a.push(last)
  return a
}

export function Calibration({ onComplete, onSkip }: Props) {
  const { currentGaze, completeCalibration, setAffine, setQuadratic, setFlipX } = useGazeTracker()

  // randomize sequence but keep bottom-right last (helps laptop corner accuracy)
  const seq = useMemo(() => shuffleKeepLast(GRID, p => p.x === 0.9 && p.y === 0.9), [])

  const [idx, setIdx] = useState(0)
  const [burst, setBurst] = useState(0)
  const [showCrosshair, setShowCrosshair] = useState(false)

  // validation state
  const [validating, setValidating] = useState(false)
  const [validationIdx, setValidationIdx] = useState(0)
  const [validationErrors, setValidationErrors] = useState<number[]>([])
  const [overallMedian, setOverallMedian] = useState<number | null>(null)

  // store all samples
  const rawAll = useRef<Pt[]>([])
  const tgtAll = useRef<Pt[]>([])
  const wAll = useRef<number[]>([])

  const current = validating ? VALIDATION_DOTS[validationIdx] : seq[idx]
  const targetPx = useMemo(() => ({
    x: current.x * window.innerWidth,
    y: current.y * window.innerHeight,
  }), [current.x, current.y])

  // overweight bottom-right samples
  const weightFor = useCallback((p: Pt) => (p.x > 0.75 && p.y > 0.75 ? 3.5 : 1.0), [])

  const captureBurst = useCallback(async () => {
    let samples = 0
    for (let i = 0; i < SAMPLES_PER_BURST; i++) {
      if (currentGaze) {
        rawAll.current.push({ x: currentGaze.x, y: currentGaze.y })
        tgtAll.current.push({ x: targetPx.x, y: targetPx.y })
        wAll.current.push(weightFor(current))
        samples++
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, SAMPLE_SPACING_MS))
    }
    return samples
  }, [currentGaze, targetPx.x, targetPx.y, weightFor, current])

  // manual “record burst” (click or Enter/Space)
  const manualAccept = useCallback(async () => {
    await captureBurst()
    const nb = burst + 1
    setBurst(nb)

    if (nb >= BURSTS_PER_POINT) {
      // next point or fit
      if (idx < seq.length - 1) {
        setIdx(idx + 1)
        setBurst(0)
      } else {
        fitAndValidate()
      }
    }
  }, [burst, idx, seq.length, captureBurst])

  const fitAndValidate = useCallback(() => {
    // robust affine fit
    const { T } = ransacAffine(rawAll.current, tgtAll.current, wAll.current, 60, 120)
    setAffine(T.A, T.b)

    // begin validation phase
    setValidating(true)
    setValidationIdx(0)
    setValidationErrors([])
  }, [setAffine])

  // validation advance (click or Enter/Space)
  const validationAdvance = useCallback(() => {
    if (validationIdx < VALIDATION_DOTS.length - 1) {
      setValidationIdx(validationIdx + 1)
    } else {
      const med = median(validationErrors)
      setOverallMedian(med)

      // add mild quadratic warp only if still high and we have enough points
      if (med > ACCEPTABLE_OVERALL_MEDIAN && rawAll.current.length >= 60) {
        const Q = fitQuadraticWeighted(rawAll.current, tgtAll.current, wAll.current)
        if (Q) setQuadratic(Q)
      }

      completeCalibration()
      onComplete()
    }
  }, [validationIdx, validationErrors, completeCalibration, onComplete, setQuadratic])

  // collect validation error live
  useEffect(() => {
    if (!validating) return
    const id = window.setInterval(() => {
      if (!currentGaze) return
      const dx = currentGaze.x - targetPx.x
      const dy = currentGaze.y - targetPx.y
      setValidationErrors(prev => prev.concat(Math.hypot(dx, dy)))
    }, 33)
    return () => clearInterval(id)
  }, [validating, currentGaze?.x, currentGaze?.y, targetPx.x, targetPx.y])

  // keys: Enter/Space to accept; F flips X; Esc skips
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') setFlipX(prev => !prev as any)
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (validating) validationAdvance()
        else manualAccept()
      }
      if (e.key === 'Escape' && onSkip) { e.preventDefault(); onSkip() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [manualAccept, validationAdvance, onSkip, setFlipX, validating])

  // fixed HUD placement (top-right)
  const hudPos = { top: 24, right: 24 } as const
  const statusColor = '#10b981'

  return (
    <>
      {/* Pass-through backdrop so user can scroll with mouse/trackpad */}
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)',
          zIndex: 99950, pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* Target (captures clicks) */}
      <button
        onClick={validating ? validationAdvance : manualAccept}
        title={validating ? 'Look at the dot, press Enter/Space or click to advance' : 'Click 5 times while looking at the dot to record this point'}
        style={{
          position: 'fixed',
          left: `${current.x * 100}vw`,
          top: `${current.y * 100}vh`,
          transform: 'translate(-50%, -50%)',
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: validating ? '#0b1220' : '#111827',
          border: `4px solid ${statusColor}`,
          boxShadow: '0 0 0 8px rgba(255,255,255,0.12)',
          cursor: 'pointer',
          zIndex: 99998,
          pointerEvents: 'auto',
        }}
      />
      {/* Small burst counter under the dot */}
      {!validating && (
        <div
          style={{
            position: 'fixed',
            left: `${current.x * 100}vw`,
            top: `calc(${current.y * 100}vh + 34px)`,
            transform: 'translate(-50%, 0)',
            fontSize: 12,
            color: '#cbd5e1',
            zIndex: 99998,
            pointerEvents: 'none',
          }}
        >
          {burst} / {BURSTS_PER_POINT}
        </div>
      )}

      {/* Optional live crosshair (OFF by default) */}
      {showCrosshair && currentGaze && (
        <div
          style={{
            position: 'fixed',
            left: currentGaze.x,
            top: currentGaze.y,
            transform: 'translate(-50%, -50%)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '2px solid #22d3ee',
            boxShadow: '0 0 0 4px rgba(34,211,238,0.2), 0 0 12px rgba(34,211,238,0.6)',
            pointerEvents: 'none',
            zIndex: 99999,
          }}
        />
      )}

      {/* HUD (top-right, never overlaps facecam centered at top) */}
      <div
        style={{
          position: 'fixed',
          ...hudPos,
          color: '#e2e8f0',
          background: 'rgba(15,23,42,0.94)',
          border: '1px solid #475569',
          borderRadius: 12,
          padding: '14px 16px',
          width: 360,
          zIndex: 99960,
          pointerEvents: 'auto',
        }}
      >
        {!validating ? (
          <>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Calibration</div>
            <p style={{ color: '#cbd5e1', fontSize: 14, margin: '4px 0 8px 0' }}>
              <b>Click the red dot 5 times</b> while looking directly at it. Keep your head steady during each click.  
              Do this for each point; calibration completes automatically.
            </p>

            {/* Burst progress bars */}
            <div style={{ display: 'flex', gap: 4, margin: '6px 0 10px 0' }}>
              {Array.from({ length: BURSTS_PER_POINT }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    background: i < burst ? '#10b981' : '#334155',
                    transition: 'background 0.25s',
                  }}
                />
              ))}
            </div>

            <div style={{ color: '#94a3b8', fontSize: 13 }}>
              Point <b>{idx + 1}</b> of {seq.length}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button className="btn" onClick={manualAccept}>Record (click)</button>
              {onSkip && <button className="btn secondary" onClick={onSkip}>Skip</button>}
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={showCrosshair} onChange={e => setShowCrosshair(e.target.checked)} /> Show crosshair
              </label>
            </div>

            <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>
              Tip: Press <b>F</b> if the movement looks mirrored.
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Validate mapping</div>
            <p style={{ fontSize: 14, color: '#cbd5e1', margin: '4px 0 8px 0' }}>
              Look at each dot and click once (or press Enter/Space) to advance.
            </p>
            <div style={{ marginTop: 4, color: '#94a3b8' }}>
              Validation point {validationIdx + 1} / {VALIDATION_DOTS.length}
            </div>
            {overallMedian != null && (
              <div style={{ marginTop: 6, fontSize: 12, color: overallMedian <= ACCEPTABLE_OVERALL_MEDIAN ? '#22c55e' : '#f97316' }}>
                Overall median error: <b>{Math.round(overallMedian)} px</b>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn" onClick={validationAdvance}>Next</button>
              <button className="btn secondary" onClick={() => setFlipX(prev => !prev as any)}>Toggle Flip X (F)</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
