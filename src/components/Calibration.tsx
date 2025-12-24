import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Pt, median, mad, isDwelled,
  ransacAffine, fitQuadraticWeighted,
  toUnit, affineUnitToPx, quadUnitToPx, fitRBFWeightedNormalized,
  Viewport
} from '../utils/calibrationUtils'
import { useGaze } from '../contexts/GazeContext'
import { safeShowWebGazerCamera, safeHideWebGazerUI } from '@/utils/webgazerManager'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Target, Camera } from 'lucide-react'

type Props = { 
  onComplete: (accuracy?: number) => void
  onSkip?: () => void 
}

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
  const { currentGaze, setAffine, setQuadratic, setRBFUnit, setFlipX, setViewport } = useGaze()

  // Show WebGazer camera preview with face overlay during calibration
  // This allows users to see how their face is being tracked
  useEffect(() => {
    // Position camera preview in top-right corner (below the HUD card)
    // The HUD is at top: 8, so we position the camera preview below it
    const showCameraWithOverlay = () => {
      safeShowWebGazerCamera({ x: window.innerWidth - 260, y: 340 })
    }
    
    // Show immediately
    showCameraWithOverlay()
    
    // Re-apply position periodically in case of window resize or WebGazer resetting elements
    const interval = setInterval(showCameraWithOverlay, 500)
    
    return () => {
      clearInterval(interval)
      // Hide on unmount - CameraPreview will take over after calibration
      safeHideWebGazerUI()
    }
  }, [])

  const seq = useMemo(() => shuffleKeepLast(GRID, p => p.x === 0.9 && p.y === 0.9), [])
  const [idx, setIdx] = useState(0)
  const [burst, setBurst] = useState(0)
  const [pressedCount, setPressedCount] = useState(0) // show immediate feedback under the dot
  const [showCrosshair, setShowCrosshair] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationIdx, setValidationIdx] = useState(0)
  const [valSamples, setValSamples] = useState<number[]>([]) // store pixel errors for current dot
  const [overallErrors, setOverallErrors] = useState<number[]>([]) // all validation errors
  const [faceDetected, setFaceDetected] = useState(false) // Track if we're receiving valid gaze data

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
  // Also track face detection status based on gaze data quality
  useEffect(() => {
    if (!currentGaze) {
      // No gaze data - face not detected
      setFaceDetected(false)
      return
    }
    
    // Check if we're getting good quality data
    const confidence = currentGaze.confidence ?? 0
    setFaceDetected(confidence >= 0.5)
    
    const p = { x: currentGaze.x, y: currentGaze.y }
    recent.current.push(p)
    if (recent.current.length > 64) recent.current.shift()
  }, [currentGaze?.x, currentGaze?.y, currentGaze?.confidence])

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
    // Higher confidence threshold for calibration (0.7) than regular tracking (0.4)
    const CALIBRATION_CONFIDENCE_THRESHOLD = 0.7
    const samples: Pt[] = []
    let lowConfidenceCount = 0
    
    for (let i = 0; i < SAMPLES_PER_BURST; i++) {
      if (currentGaze) {
        const confidence = currentGaze.confidence ?? 1
        if (confidence >= CALIBRATION_CONFIDENCE_THRESHOLD) {
          samples.push({ x: currentGaze.x, y: currentGaze.y })
        } else {
          lowConfidenceCount++
        }
      }

      // Early stop if we have enough high-quality samples
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
    
    // Log calibration quality for debugging
    if (lowConfidenceCount > samples.length) {
      console.warn(`[Calibration] Low confidence samples: ${lowConfidenceCount}/${SAMPLES_PER_BURST}`)
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
      // dwell-gate before sampling for this dot with TIMEOUT
      let guard = 0
      const maxAttempts = 200 // 200 * 10ms = 2 seconds max wait
      while (!stop && guard < maxAttempts) {
        guard++
        await new Promise(r => setTimeout(r, SAMPLE_SPACING_MS))
        const ready = isDwelled(recent.current, 15, 24)
        const confOk = (currentGaze?.confidence ?? 0) >= 0.6
        if (ready && confOk) break
      }
      
      // If we timed out, collect whatever we have anyway (graceful degradation)
      const errs: number[] = []
      for (let i = 0; i < 20; i++) {
        if (currentGaze) {
          const dx = currentGaze.x - targetPx.x
          const dy = currentGaze.y - targetPx.y
          errs.push(Math.hypot(dx, dy))
        }
        await new Promise(r => setTimeout(r, 16))
      }
      
      // Ensure we have at least some data, use fallback if needed
      if (errs.length < 5 && recent.current.length > 0) {
        // Use recent buffer as fallback
        const fallbackCount = Math.min(20, recent.current.length)
        for (let i = recent.current.length - fallbackCount; i < recent.current.length; i++) {
          const p = recent.current[i]
          const dx = p.x - targetPx.x
          const dy = p.y - targetPx.y
          errs.push(Math.hypot(dx, dy))
        }
      }
      
      setValSamples(errs.length > 0 ? errs : [100]) // fallback to moderate error if no data
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
      // Pass the final median accuracy to the parent
      const finalAccuracy = Math.round(medAll)
      onComplete(finalAccuracy)
    }
  }, [valSamples, validationIdx, overallErrors, onComplete, setQuadratic, setRBFUnit])

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') setFlipX((prev: boolean) => !prev as any)
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (validating) {
          // Only advance if we have data collected
          if (valSamples.length > 0) {
            nextValidation()
          }
        } else {
          advanceOrFit() // click-OR-keyboard triggers a calibration burst
        }
      }
      if (e.key === 'Escape' && onSkip) { e.preventDefault(); onSkip() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advanceOrFit, nextValidation, onSkip, setFlipX, validating, valSamples.length])

  return (
    <>
      {/* Calibration/Validation dot */}
      <button
        onClick={validating ? nextValidation : advanceOrFit}
        disabled={validating && valSamples.length === 0}
        title={validating
          ? (valSamples.length > 0 ? 'Click to advance' : 'Collecting data...')
          : 'Click to record burst'}
        style={{
          position: 'fixed',
          left: `${current.x * 100}vw`,
          top: `${current.y * 100}vh`,
          transform: 'translate(-50%, -50%)',
          width: 32, height: 32, borderRadius: '50%',
          background: validating 
            ? (valSamples.length > 0 ? '#10b981' : '#0f172a')
            : '#0f172a',
          border: validating && valSamples.length > 0 
            ? '4px solid #34d399' 
            : '4px solid #334155',
          boxShadow: validating && valSamples.length > 0
            ? '0 0 0 8px rgba(16,185,129,0.2), 0 0 20px rgba(16,185,129,0.4)'
            : '0 0 0 8px rgba(255,255,255,0.1)',
          cursor: validating && valSamples.length === 0 ? 'wait' : 'pointer', 
          zIndex: 99998, 
          pointerEvents: 'auto',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Under-dot counter */}
      {!validating && (
        <div
          className="fixed text-[11px] font-bold text-slate-500 z-[99998] pointer-events-none text-center w-20"
          style={{
            left: `${current.x * 100}vw`,
            top: `calc(${current.y * 100}vh + 32px)`,
            transform: 'translateX(-50%)',
          }}
        >
          {pressedCount} / {BURSTS_PER_POINT}
        </div>
      )}

      {/* HUD */}
      <div className="fixed top-8 right-8 w-[400px] z-[99960] pointer-events-auto animate-in slide-in-from-right-8 duration-500">
        <Card className="shadow-2xl border-slate-200/60 bg-white/95 backdrop-blur-md">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              {validating ? 'Validate Accuracy' : 'Calibration'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {!validating ? (
              <>
                {/* Face Detection Status */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  faceDetected 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                  {faceDetected 
                    ? 'Face detected - Ready to calibrate' 
                    : 'Looking for face... Center your face in camera'}
                </div>
                
                <p className="text-sm text-slate-600 leading-relaxed">
                  Look directly at the dot and <b>click it</b> {BURSTS_PER_POINT} times. 
                  Keep your head as steady as possible.
                </p>
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Target {idx + 1} of {seq.length}</span>
                  <Badge variant="secondary" className="font-mono">{burst} / {BURSTS_PER_POINT}</Badge>
                </div>
                <div className="pt-2 flex flex-col gap-3">
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" 
                      checked={showCrosshair} 
                      onChange={e => setShowCrosshair(e.target.checked)} 
                    /> 
                    Show real-time crosshair
                  </label>
                  <p className="text-[10px] text-slate-400 italic">
                    Press <b>F</b> if horizontal movement appears mirrored.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Focus on the dot. Once it turns <b>green</b>, click it to proceed.
                </p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-bold">{validationIdx + 1} / {VALIDATION_DOTS.length}</span>
                  </div>
                  {valSamples.length > 0 && (
                    <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
                      <span className="text-slate-500">Accuracy (Median)</span>
                      <span className={`font-bold ${median(valSamples) <= TARGET_MEDIAN_PX ? 'text-green-600' : 'text-amber-600'}`}>
                        {Math.round(median(valSamples))}px
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button 
                    className="flex-1 bg-primary-600 hover:bg-primary-700" 
                    onClick={nextValidation}
                    disabled={valSamples.length === 0}
                  >
                    {valSamples.length === 0 ? 'Collecting data...' : 'Next Point'}
                  </Button>
                  <Button variant="outline" onClick={() => setFlipX((prev: boolean) => !prev as any)}>
                    Flip X (F)
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Camera Preview Label - positioned above WebGazer container */}
      <div 
        className="fixed z-[99991] pointer-events-none animate-in fade-in duration-300"
        style={{
          right: 16,
          top: 318,
          width: 240,
        }}
      >
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white text-xs font-medium rounded-t-lg border border-b-0 border-blue-400/40">
          <Camera className="w-3.5 h-3.5 text-blue-400" />
          <span>Face Tracking Preview</span>
          <div className={`ml-auto w-2 h-2 rounded-full ${faceDetected ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
        </div>
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
