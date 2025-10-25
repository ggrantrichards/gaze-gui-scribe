import { useEffect, useRef, useState, useCallback } from 'react'
import type { GazePoint } from '@/types'
import { applyAffine, applyQuadratic, Pt } from '@/utils/calibrationUtils'

declare global { interface Window { webgazer?: any } }

type TrackerState = {
  isInitialized: boolean
  isCalibrated: boolean
  currentGaze: GazePoint | null
  error: string | null
}

type Affine = { A: [[number, number], [number, number]]; b: [number, number] }
type Quad = { ax: number[]; ay: number[] } | null

function pinViewer() {
  const existing = document.querySelectorAll('#webgazerVideoContainer, #webgazerVideoFeed')
  if (!existing.length) return
  // Remove duplicates
  existing.forEach((el, i) => { if (i > 0 && el.parentElement) el.parentElement.removeChild(el) })
  const el = existing[0] as HTMLElement
  el.style.position = 'fixed'
  el.style.left = '50%'
  el.style.top = '10%'                // near top center
  el.style.transform = 'translate(-50%, 0)' // perfectly centered horizontally
  el.style.width = '220px'
  el.style.height = 'auto'
  el.style.zIndex = '99990'
  el.style.pointerEvents = 'auto'
  el.style.opacity = '1'
  el.style.borderRadius = '8px'
  el.style.overflow = 'hidden'
}

export function useGazeTracker() {
  const [state, setState] = useState<TrackerState>({
    isInitialized: false,
    isCalibrated: false,
    currentGaze: null,
    error: null,
  })

  const ema = useRef<Pt | null>(null)
  const paused = useRef(false)
  const flipXRef = useRef(false)
  const affineRef = useRef<Affine | null>(null)
  const quadRef = useRef<Quad>(null)

  useEffect(() => {
    const boot = () => {
      const wg = window.webgazer
      if (!wg) { setState(s => ({ ...s, error: 'WebGazer unavailable' })); return }
      wg.setRegression('ridge')
        .setTracker('clmtrackr')
        .showPredictionPoints(false)
        .showVideoPreview(true)
        .applyKalmanFilter(false)
        .setGazeListener((data: any, ts: number) => {
          if (paused.current || !data) return
          let gx = data.x, gy = data.y
          if (flipXRef.current) gx = window.innerWidth - gx

          // apply transforms
          if (affineRef.current) {
            const p = applyAffine({ x: gx, y: gy }, affineRef.current)
            gx = p.x; gy = p.y
          }
          if (quadRef.current) {
            const p = applyQuadratic({ x: gx, y: gy }, quadRef.current)
            gx = p.x; gy = p.y
          }

          gx = Math.max(0, Math.min(window.innerWidth, gx))
          gy = Math.max(0, Math.min(window.innerHeight, gy))

          const alpha = 0.35
          if (!ema.current) ema.current = { x: gx, y: gy }
          else {
            ema.current.x = alpha * gx + (1 - alpha) * ema.current.x
            ema.current.y = alpha * gy + (1 - alpha) * ema.current.y
          }

          pinViewer()

          setState(s => ({
            ...s,
            currentGaze: { x: ema.current!.x, y: ema.current!.y, timestamp: ts, confidence: data?.confidence ?? 1 },
          }))
        })

      wg.begin().then(() => {
        setTimeout(pinViewer, 300)
        setTimeout(pinViewer, 1200)
        setState(s => ({ ...s, isInitialized: true }))
      })
    }

    if (!window.webgazer) {
      const s = document.createElement('script')
      s.src = 'https://webgazer.cs.brown.edu/webgazer.js'
      s.async = true
      s.onload = boot
      s.onerror = () => setState(s => ({ ...s, error: 'Failed to load WebGazer' }))
      document.head.appendChild(s)
    } else {
      boot()
    }

    return () => {
      try {
        window.webgazer?.showVideoPreview(true)
        window.webgazer?.clearGazeListener?.()
      } catch {}
    }
  }, [])

  const completeCalibration = () => setState(s => ({ ...s, isCalibrated: true }))
  const resetCalibration = () => {
    ema.current = null
    affineRef.current = null
    quadRef.current = null
    setState(s => ({ ...s, isCalibrated: false }))
  }

  const setAffine = (A: [[number, number], [number, number]], b: [number, number]) => { affineRef.current = { A, b } }
  const setQuadratic = (Q: Quad) => { quadRef.current = Q }
  const setFlipX = (v: boolean) => { flipXRef.current = v }

  const pauseTracking = () => { paused.current = true }
  const resumeTracking = () => { paused.current = false }

  const getElementAtGaze = useCallback((g: GazePoint | null) => {
    if (!g) return null
    const els = document.elementsFromPoint(g.x, g.y) as HTMLElement[]
    return els.find(el => {
      const zi = getComputedStyle(el).zIndex
      return !['9999', '9998', '9997', '99990'].includes(zi) && el.tagName !== 'HTML' && el.tagName !== 'BODY'
    }) || null
  }, [])

  return {
    isInitialized: state.isInitialized,
    isCalibrated: state.isCalibrated,
    currentGaze: state.currentGaze,
    error: state.error,

    // calibration controls
    completeCalibration,
    resetCalibration,
    setAffine,
    setQuadratic,
    setFlipX,

    // tracking controls
    pauseTracking,
    resumeTracking,
    getElementAtGaze,
  }
}
