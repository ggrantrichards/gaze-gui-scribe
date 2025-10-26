import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Pt, median, mad, isDwelled,
  ransacAffine, fitQuadraticWeighted,
  toUnit, affineUnitToPx, quadUnitToPx, fitRBFWeightedNormalized,
  Viewport
} from '../utils/calibrationUtils'
import { useGazeTracker } from '../hooks/useGazeTracker'

type Props = { onComplete: () => void; onSkip?: () => void }

const GRID: Pt[] = [
  { x: 0.1, y: 0.1 }, { x: 0.5, y: 0.1 }, { x: 0.9, y: 0.1 },
  { x: 0.1, y: 0.35 }, { x: 0.5, y: 0.35 }, { x: 0.9, y: 0.35 },
  { x: 0.1, y: 0.65 }, { x: 0.5, y: 0.65 }, { x: 0.9, y: 0.65 },
  { x: 0.1, y: 0.9 }, { x: 0.5, y: 0.9 }, { x: 0.9, y: 0.9 },
]
const BURSTS_PER_POINT = 5
const SAMPLES_PER_BURST = 20 // slightly increased for robustness
const SAMPLE_SPACING_MS = 10  // 8–12 ms
const VALIDATION_DOTS: Pt[] = [
  { x: 0.5, y: 0.5 }, { x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 }, { x: 0.9, y: 0.9 },
]

// Acceptance
const TARGET_MEDIAN_PX = 35
const TARGET_P95_PX = 75

// Speed-up (without hurting quality)
const MIN_SAMPLES_PER_BURST = 12
const EARLY_STOP_MAD_PX = 8

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
  const { currentGaze, completeCalibration, setAffine, setQuadratic, setRBFUnit, setFlipX, setViewport } = useGazeTracker()

  const seq = useMemo(() => shuffleKeepLast(GRID, p => p.x === 0.9 && p.y === 0.9), [])
  const [idx, setIdx] = useState(0)
  const [burst, setBurst] = useState(0)
  const [pressedCount, setPressedCount] = useState(0) // show immediate feedback under the dot
  const [showCrosshair, setShowCrosshair] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationIdx, setValidationIdx] = useState(0)
  const [valSamples, setValSamples] = useState<number[]>([]) // store pixel errors for current dot
  const [overallErrors, setOverallErrors] = useState<number[]>([]) // all validation errors

  const recent = useRef<Pt[]>([]) // rolling px buffer
  const vref = useRef<Viewport>({ W: window.innerWidth, H: window.innerHeight })
  const burstsRawPx = useRef<Pt[]>([])     // burst medians (px)
  const burstsTgtPx = useRef<Pt[]>([])     // corresponding targets (px)
  const burstWeights = useRef<number[]>([])// quality weights = 1/(1+MAD)

  // --- NEW: prevent rapid-click race conditions ---
  const isCapturing = useRef(false)
  const pendingClicks = useRef(0)

  // --- NEW: prevent infinite re-validation loops ---
  const triedQuadratic = useRef(false)
  const triedRBF = useRef(false)

  useEffect(() => {
    const onResize = () => {
      vref.current = { W: window.innerWidth, H: window.innerHeight }
      setViewport(vref.current)
    }
    window.addEventListener('resize', onResize)
    setViewport(vref.current)
    return () => window.removeEventListener('resize', onResize)
  }, [setViewport])

  const current = validating ? VALIDATION_DOTS[validationIdx] : seq[idx]
  const targetPx = useMemo(() => ({
    x: current.x * vref.current.W,
    y: current.y * vref.current.H,
  }), [current.x, current.y])

  // Rolling buffer of recent gaze points (px) for dwell gating (used only in validation)
  useEffect(() => {
    if (!currentGaze) return
    const p = { x: currentGaze.x, y: currentGaze.y }
    recent.current.push(p)
    if (recent.current.length > 64) recent.current.shift()
  }, [currentGaze?.x, currentGaze?.y])

  /**
   * Capture one burst:
   * - During calibration (validating===false): CLICK-TRIGGERED, no dwell wait (we don't trust alignment yet).
   * - During validation (validating===true): DWELL-GATED (alignment exists).
   * Both phases compute median & MAD to derive a burst-quality weight.
   */
  const captureBurst = useCallback(async () => {
    if (validating) {
      // --- Validation: wait for dwell + confidence ---
      let attempts = 0
      while (attempts < 1000) {
        attempts++
        await new Promise(r => setTimeout(r, SAMPLE_SPACING_MS))
        const ready = isDwelled(recent.current, 15, 24)
        const confOk = (currentGaze?.confidence ?? 0) >= 0.6
        if (ready && confOk) break
      }
    } else {
      // --- Calibration: small settle delay to avoid click motion jitter (no dwell gate yet) ---
      await new Promise(r => setTimeout(r, 80))
    }

    // Collect samples (filtering low-confidence on the fly) with adaptive early-stop
    const samples: Pt[] = []
    for (let i = 0; i < SAMPLES_PER_BURST; i++) {
      if (currentGaze && (currentGaze.confidence ?? 1) >= 0.6) {
        samples.push({ x: currentGaze.x, y: currentGaze.y })
      }

      if (
        samples.length >= MIN_SAMPLES_PER_BURST &&
        (samples.length % 4 === 0) &&
        mad(samples) <= EARLY_STOP_MAD_PX
      ) {
        break
      }

      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, SAMPLE_SPACING_MS))
    }

    // Require a minimum to avoid empty/too-small bursts
    if (samples.length < Math.max(6, Math.floor(0.4 * SAMPLES_PER_BURST))) {
      // If collection failed (e.g., low confidence), fall back to using whatever we have in recent buffer
      const fallback = recent.current.slice(-SAMPLES_PER_BURST)
      if (fallback.length) samples.push(...fallback)
    }

    // Burst median, MAD → quality weight
    const mx = median(samples.map(s => s.x))
    const my = median(samples.map(s => s.y))
    const burstMedian: Pt = { x: mx, y: my }
    const q = mad(samples)
    const w = 1 / (1 + q)

    burstsRawPx.current.push(burstMedian)
    burstsTgtPx.current.push({ x: targetPx.x, y: targetPx.y })
    burstWeights.current.push(w)
  }, [currentGaze, targetPx.x, targetPx.y, validating])

  const fitAndValidate = useCallback(() => {
    const v = vref.current
    // normalize to [0,1]
    const rawU = burstsRawPx.current.map(p => toUnit(p, v))
    const tgtU = burstsTgtPx.current.map(p => toUnit(p, v))
    const w = burstWeights.current.slice()

    // RANSAC affine (unit)
    const { T: Aunit } = ransacAffine(rawU, tgtU, w, 0.02, 120)
    // convert to px params for runtime
    const Apix = affineUnitToPx(Aunit, v)
    setAffine(Apix.A, Apix.b)

    // reset escalation flags for this validation pass
    triedQuadratic.current = false
    triedRBF.current = false

    // start validation flow (this stage will use dwell gating)
    setValidating(true)
    setValidationIdx(0)
    setValSamples([])
    setOverallErrors([])
  }, [setAffine])

  // --- REWRITTEN: robust click handling to avoid counter going down ---
  const advanceOrFit = useCallback(async () => {
    // If a capture is already running, queue this click and return immediately
    if (isCapturing.current) {
      pendingClicks.current++
      // optimistic visual feedback that never decrements
      setPressedCount(c => Math.min(BURSTS_PER_POINT, c + 1))
      return
    }

    const process = async () => {
      isCapturing.current = true
      // optimistic feedback
      setPressedCount(c => Math.min(BURSTS_PER_POINT, c + 1))

      await captureBurst()

      setBurst(prevBurst => {
        const nextBurst = prevBurst + 1

        if (nextBurst >= BURSTS_PER_POINT) {
          // Move to next point or finish
          setIdx(prevIdx => {
            const isLastPoint = prevIdx >= seq.length - 1
            if (isLastPoint) {
              // finish calibration: start validation
              fitAndValidate()
            } else {
              // next calibration target
              setPressedCount(0)
              setBurst(0)
              return prevIdx + 1
            }
            return prevIdx
          })
          // clear queued clicks at boundaries
          pendingClicks.current = 0
          isCapturing.current = false
          return 0
        } else {
          // stay on same target
          isCapturing.current = false
          // drain any queued clicks quickly
          if (pendingClicks.current > 0) {
            pendingClicks.current--
            // schedule next processing tick
            setTimeout(process, 0)
          }
          return nextBurst
        }
      })
    }

    await process()
  }, [captureBurst, fitAndValidate, seq.length])

  // ---- Validation sampling (dwell-gated), compute per-dot errors ----
  useEffect(() => {
    if (!validating) return
    let stop = false

    const run = async () => {
      // dwell-gate before sampling for this dot
      let guard = 0
      while (!stop && guard < 1000) {
        guard++
        await new Promise(r => setTimeout(r, SAMPLE_SPACING_MS))
        const ready = isDwelled(recent.current, 15, 24)
        const confOk = (currentGaze?.confidence ?? 0) >= 0.6
        if (ready && confOk) break
      }
      // collect ~20 samples and compute pixel errors
      const errs: number[] = []
      for (let i = 0; i < 20; i++) {
        if (currentGaze) {
          const dx = currentGaze.x - targetPx.x
          const dy = currentGaze.y - targetPx.y
          errs.push(Math.hypot(dx, dy))
        }
        await new Promise(r => setTimeout(r, 16))
      }
      setValSamples(errs)
    }
    run()
    return () => { stop = true }
  }, [validating, validationIdx, currentGaze?.x, currentGaze?.y, targetPx.x, targetPx.y])

  const nextValidation = useCallback(() => {
    // finalize current dot stats
    const med = Math.round(median(valSamples))
    const sorted = valSamples.slice().sort((a,b)=>a-b)
    const p95 = sorted.length ? sorted[Math.min(sorted.length-1, Math.floor(0.95*(sorted.length-1)))] : med
    setOverallErrors(prev => prev.concat(valSamples))

    if (validationIdx < VALIDATION_DOTS.length - 1) {
      setValidationIdx(validationIdx + 1)
      setValSamples([])
    } else {
      // compute overall metrics
      const all = [...overallErrors, ...valSamples]
      const medAll = median(all)
      const p95All = all.slice().sort((a,b)=>a-b)[Math.floor(0.95*(all.length-1))] || medAll

      // If not meeting targets, escalate fit at most once per method to avoid infinite loop
      const v = vref.current
      const rawU = burstsRawPx.current.map(p => toUnit(p, v))
      const tgtU = burstsTgtPx.current.map(p => toUnit(p, v))
      const w = burstWeights.current.slice()

      if ((medAll > TARGET_MEDIAN_PX || p95All > TARGET_P95_PX) && !triedQuadratic.current) {
        const Qunit = fitQuadraticWeighted(rawU, tgtU, w)
        if (Qunit) {
          const Qpx = quadUnitToPx(Qunit, v)
          setQuadratic(Qpx)
          triedQuadratic.current = true
          // Re-run quick validation pass (single loop)
          setValidating(true); setValidationIdx(0); setValSamples([]); setOverallErrors([])
          return
        } else {
          triedQuadratic.current = true
        }
      }

      if ((medAll > TARGET_MEDIAN_PX || p95All > TARGET_P95_PX) && !triedRBF.current) {
        const RBF = fitRBFWeightedNormalized(rawU, tgtU, w, 0.12)
        if (RBF) {
          setRBFUnit(RBF)
          triedRBF.current = true
          setValidating(true); setValidationIdx(0); setValSamples([]); setOverallErrors([])
          return
        } else {
          triedRBF.current = true
        }
      }

      // Either targets met OR we've already tried both refinements -> finish
      completeCalibration()
      onComplete()
    }
  }, [valSamples, validationIdx, overallErrors, completeCalibration, onComplete, setQuadratic, setRBFUnit])

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') setFlipX((prev: boolean) => !prev as any)
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (validating) nextValidation()
        else advanceOrFit() // click-OR-keyboard triggers a calibration burst
      }
      if (e.key === 'Escape' && onSkip) { e.preventDefault(); onSkip() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advanceOrFit, nextValidation, onSkip, setFlipX, validating])

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)',
          zIndex: 99950, pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* Calibration/Validation dot */}
      <button
        onClick={validating ? nextValidation : advanceOrFit}
        title={validating
          ? 'Look at the dot, dwell, then press Enter/Space or click to advance'
          : 'Look at the dot and click (or press Enter/Space) to record a burst'}
        style={{
          position: 'fixed',
          left: `${current.x * 100}vw`,
          top: `${current.y * 100}vh`,
          transform: 'translate(-50%, -50%)',
          width: 30, height: 30, borderRadius: '50%',
          background: validating ? '#0b1220' : '#111827',
          border: '4px solid #10b981',
          boxShadow: '0 0 0 8px rgba(255,255,255,0.12)',
          cursor: 'pointer', zIndex: 99998, pointerEvents: 'auto',
        }}
      />

      {/* Under-dot press/burst counter (calibration only) */}
      {!validating && (
        <div
          style={{
            position: 'fixed',
            left: `${current.x * 100}vw`,
            top: `calc(${current.y * 100}vh + 36px)`,
            transform: 'translate(-50%, 0)',
            fontSize: 12,
            color: '#cbd5e1',
            zIndex: 99998,
            pointerEvents: 'none',
          }}
        >
          {pressedCount} / {BURSTS_PER_POINT}
        </div>
      )}

      {/* HUD */}
      <div
        style={{
          position: 'fixed', top: 24, right: 24, color: '#e2e8f0',
          background: 'rgba(15,23,42,0.94)', border: '1px solid #475569',
          borderRadius: 12, padding: '14px 16px', width: 380,
          zIndex: 99960, pointerEvents: 'auto',
        }}
      >
        {!validating ? (
          <>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Calibration</div>
            <p style={{ color: '#cbd5e1', fontSize: 14, margin: '4px 0 8px' }}>
              Look directly at each dot and <b>click</b> it {BURSTS_PER_POINT} times
              (or press Enter/Space). Keep your head steady during each click.
            </p>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>
              Point <b>{idx + 1}</b> of {seq.length} • Burst {burst} / {BURSTS_PER_POINT}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={showCrosshair} onChange={e => setShowCrosshair(e.target.checked)} /> Show crosshair
              </label>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Press <b>F</b> if movement looks mirrored</div>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Validate mapping</div>
            <p style={{ fontSize: 14, color: '#cbd5e1', margin: '4px 0 8px' }}>
              Dwell on each dot, then press Enter/Space (or click) to confirm.
            </p>
            <div style={{ marginTop: 4, color: '#94a3b8' }}>
              Validation point {validationIdx + 1} / {VALIDATION_DOTS.length}
            </div>
            {valSamples.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 12 }}>
                Median: <b>{Math.round(median(valSamples))} px</b> •
                P95: <b>{(() => {
                  const s = valSamples.slice().sort((a,b)=>a-b)
                  const i = Math.floor(0.95*(s.length-1))
                  return Math.round(s[i] ?? 0)
                })()} px</b> • Targets: {TARGET_MEDIAN_PX}/{TARGET_P95_PX} px
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn" onClick={nextValidation}>Next</button>
              <button className="btn secondary" onClick={() => setFlipX((prev: boolean) => !prev as any)}>Toggle Flip X (F)</button>
            </div>
          </>
        )}
      </div>

      {/* Optional crosshair */}
      {showCrosshair && currentGaze && (
        <div
          style={{
            position: 'fixed',
            left: currentGaze.x, top: currentGaze.y,
            transform: 'translate(-50%, -50%)',
            width: 16, height: 16, borderRadius: '50%',
            border: '2px solid #22d3ee',
            boxShadow: '0 0 0 4px rgba(34,211,238,0.2), 0 0 12px rgba(34,211,238,0.6)',
            pointerEvents: 'none', zIndex: 99999,
          }}
        />
      )}
    </>
  )
}
