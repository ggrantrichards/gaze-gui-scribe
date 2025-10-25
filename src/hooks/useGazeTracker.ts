import { useEffect, useRef, useState, useCallback } from 'react'
import type { GazePoint } from '@/types'

declare global {
  interface Window { webgazer?: any }
}

type TrackerState = {
  isInitialized: boolean
  isCalibrated: boolean
  currentGaze: GazePoint | null
  error: string | null
}

/**
 * Adaptive EMA smoothing:
 * - Base alpha adapts with recent variance (more noise => lower alpha for stability)
 * - Drift offset is learned slowly to reduce long-term bias
 */
export function useGazeTracker() {
  const [state, setState] = useState<TrackerState>({
    isInitialized: false,
    isCalibrated: false,
    currentGaze: null,
    error: null
  })

  const ema = useRef<{ x: number; y: number } | null>(null)
  const paused = useRef(false)
  const drift = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const varianceWin = useRef<{ xs: number[]; ys: number[] }>({ xs: [], ys: [] })
  const calibrationResetFlag = useRef(false)

  const getAdaptiveAlpha = useCallback(() => {
    const xs = varianceWin.current.xs
    const ys = varianceWin.current.ys
    const maxWindow = 20
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

    if (xs.length < maxWindow) return 0.35 // warmup

    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
    const mx = mean(xs), my = mean(ys)
    const vx = mean(xs.map(v => (v - mx) ** 2))
    const vy = mean(ys.map(v => (v - my) ** 2))
    const v = Math.sqrt(vx + vy)

    // Map noise -> alpha (more noise -> smaller alpha)
    // v≈0..30px -> 0.6..0.2
    const alpha = clamp(0.6 - (v / 30) * 0.4, 0.2, 0.6)
    return alpha
  }, [])

  const pushVariance = (x: number, y: number) => {
    const xs = varianceWin.current.xs
    const ys = varianceWin.current.ys
    const maxWindow = 20
    xs.push(x); ys.push(y)
    if (xs.length > maxWindow) xs.shift()
    if (ys.length > maxWindow) ys.shift()
  }

  useEffect(() => {
    // Inject WebGazer if not present
    if (!window.webgazer) {
      const s = document.createElement('script')
      s.src = 'https://webgazer.cs.brown.edu/webgazer.js'
      s.async = true
      s.onload = () => start()
      s.onerror = () => setState(s => ({ ...s, error: 'Failed to load WebGazer script' }))
      document.head.appendChild(s)
    } else {
      start()
    }

    function start() {
      try {
        window.webgazer
          ?.setRegression('ridge')
          ?.setTracker('clmtrackr')
          ?.showPredictionPoints(false)
          ?.setGazeListener((data: any, ts: number) => {
            if (paused.current || !data) return

            // Raw pixel coords (clamped to viewport)
            const rx = Math.max(0, Math.min(window.innerWidth, data.x))
            const ry = Math.max(0, Math.min(window.innerHeight, data.y))

            // Optional: apply current drift offset (learned slowly)
            const dx = rx - drift.current.x
            const dy = ry - drift.current.y

            pushVariance(dx, dy)
            const alpha = getAdaptiveAlpha()

            // EMA smoothing
            if (!ema.current) {
              ema.current = { x: dx, y: dy }
            } else {
              ema.current.x = alpha * dx + (1 - alpha) * ema.current.x
              ema.current.y = alpha * dy + (1 - alpha) * ema.current.y
            }

            // Slowly update drift when not calibrated (or during explicit recalc)
            if (!state.isCalibrated || calibrationResetFlag.current) {
              drift.current.x = 0.98 * drift.current.x + 0.02 * (ema.current.x - rx)
              drift.current.y = 0.98 * drift.current.y + 0.02 * (ema.current.y - ry)
            }

            setState(s => ({
              ...s,
              currentGaze: { x: ema.current!.x, y: ema.current!.y, timestamp: ts, confidence: data?.confidence ?? 1 }
            }))
          })
          ?.begin()
          ?.then(() => setState(s => ({ ...s, isInitialized: true })))
      } catch (e: any) {
        setState(s => ({ ...s, error: String(e?.message || e) }))
      }
    }

    return () => {
      try { window.webgazer?.end() } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const completeCalibration = () => {
    calibrationResetFlag.current = false
    setState(s => ({ ...s, isCalibrated: true }))
  }

  const resetCalibration = () => {
    calibrationResetFlag.current = true
    ema.current = null
    drift.current = { x: 0, y: 0 }
    varianceWin.current = { xs: [], ys: [] }
    setState(s => ({ ...s, isCalibrated: false }))
  }

  const pauseTracking = () => { paused.current = true }
  const resumeTracking = () => { paused.current = false }

  const getElementAtGaze = useCallback((g: GazePoint | null) => {
    if (!g) return null
    const els = document.elementsFromPoint(g.x, g.y) as HTMLElement[]
    return els.find(el => {
      const zi = getComputedStyle(el).zIndex
      return !['9999','9998','9997'].includes(zi) && el.tagName !== 'HTML' && el.tagName !== 'BODY'
    }) || null
  }, [])

  return {
    isInitialized: state.isInitialized,
    isCalibrated: state.isCalibrated,
    currentGaze: state.currentGaze,
    error: state.error,
    completeCalibration,
    resetCalibration,
    pauseTracking,
    resumeTracking,
    getElementAtGaze,
  }
}
