import { useEffect, useRef, useState } from 'react'
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

const EMA_ALPHA = 0.35

export function useGazeTracker() {
  const [state, setState] = useState<TrackerState>({
    isInitialized: false,
    isCalibrated: false,
    currentGaze: null,
    error: null
  })
  const ema = useRef<{ x: number; y: number } | null>(null)
  const paused = useRef(false)

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
            // Normalize → pixels
            const px = Math.max(0, Math.min(window.innerWidth, data.x))
            const py = Math.max(0, Math.min(window.innerHeight, data.y))

            // EMA smoothing
            if (!ema.current) ema.current = { x: px, y: py }
            else {
              ema.current.x = EMA_ALPHA * px + (1 - EMA_ALPHA) * ema.current.x
              ema.current.y = EMA_ALPHA * py + (1 - EMA_ALPHA) * ema.current.y
            }

            setState(s => ({
              ...s,
              currentGaze: { x: ema.current!.x, y: ema.current!.y, timestamp: ts, confidence: data?.confidence ?? 1 }
            }))
          })
          ?.begin()
          ?.then(() => setState(s => ({ ...s, isInitialized: true })))
      } catch (e:any) {
        setState(s => ({ ...s, error: String(e?.message || e) }))
      }
    }

    return () => {
      try { window.webgazer?.end() } catch {}
    }
  }, [])

  const completeCalibration = () => setState(s => ({ ...s, isCalibrated: true }))
  const pauseTracking = () => { paused.current = true }
  const resumeTracking = () => { paused.current = false }

  return {
    isInitialized: state.isInitialized,
    isCalibrated: state.isCalibrated,
    currentGaze: state.currentGaze,
    error: state.error,
    completeCalibration,
    pauseTracking,
    resumeTracking
  }
}
