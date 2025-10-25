import { useEffect, useRef, useState } from 'react'
import type { GazePoint } from '../types'
import {
  applyAffine, applyQuadratic, Pt,
  TransformChain, applyChainPixel, Viewport
} from '../utils/calibrationUtils'

declare global { interface Window { webgazer?: any } }

type PersistedCal = {
  affine?: { A: [[number,number],[number,number]], b: [number,number] }
  quad?: { ax: number[]; ay: number[] }
  rbf?: { model: any } // stored as unit-space; we also store viewport at save time
  viewport: { W: number; H: number }
}

function loadCalibration(): TransformChain | null {
  try {
    const raw = localStorage.getItem('clientsight_calibration_v2')
    if (!raw) return null
    const parsed: PersistedCal = JSON.parse(raw)
    if (!parsed.viewport) return null
    return {
      affine: parsed.affine,
      quad: parsed.quad,
      rbf: parsed.rbf ? { model: parsed.rbf.model, viewport: parsed.viewport } : undefined,
      viewport: parsed.viewport
    }
  } catch { return null }
}

function saveCalibration(T: TransformChain) {
  const payload: PersistedCal = {
    affine: T.affine,
    quad: T.quad,
    rbf: T.rbf ? { model: T.rbf.model } : undefined,
    viewport: T.viewport
  }
  localStorage.setItem('clientsight_calibration_v2', JSON.stringify(payload))
}

export function useGazeTracker() {
  const [state, setState] = useState({
    isInitialized: false,
    isCalibrated: false,
    currentGaze: null as GazePoint | null,
    error: null as string | null,
  })

  const ema = useRef<Pt | null>(null)
  const paused = useRef(false)
  const flipXRef = useRef(false)

  const chainRef = useRef<TransformChain>({
    viewport: { W: window.innerWidth, H: window.innerHeight }
  })

  useEffect(() => {
    // load persisted calibration if available
    const loaded = loadCalibration()
    if (loaded) {
      chainRef.current = loaded
      setState(s => ({ ...s, isCalibrated: true }))
    }
  }, [])

  useEffect(() => {
    const start = () => {
      const wg = window.webgazer
      if (!wg) {
        setState(s => ({ ...s, error: 'WebGazer unavailable' }))
        return
      }
      wg.setRegression('ridge')
        .setTracker('clmtrackr')
        .showPredictionPoints(false)
        .showVideoPreview(true)
        .showFaceOverlay(true)
        .showFaceFeedbackBox(true)
        .applyKalmanFilter(false)
        .setGazeListener((data: any, ts: number) => {
          if (paused.current || !data) return
          let gx = data.x, gy = data.y
          if (flipXRef.current) gx = window.innerWidth - gx

          const p = applyChainPixel({ x: gx, y: gy }, chainRef.current)

          // EMA smoothing
          const alpha = 0.35
          if (!ema.current) ema.current = { x: p.x, y: p.y }
          else {
            ema.current.x = alpha * p.x + (1 - alpha) * ema.current.x
            ema.current.y = alpha * p.y + (1 - alpha) * ema.current.y
          }

          setState(s => ({
            ...s,
            currentGaze: {
              x: ema.current!.x,
              y: ema.current!.y,
              timestamp: ts,
              confidence: data?.confidence ?? 1
            }
          }))
        })
      wg.begin().then(() => {
        setTimeout(() => {
          try {
            document.querySelector('#webgazerVideoContainer')?.setAttribute('style', 'position:fixed;left:50%;top:10%;transform:translate(-50%,0);width:220px;z-index:99990;border-radius:8px;overflow:hidden;')
          } catch {}
        }, 500)
        setState(s => ({ ...s, isInitialized: true }))
      })
    }

    if (!window.webgazer) {
      const s = document.createElement('script')
      s.src = 'https://webgazer.cs.brown.edu/webgazer.js'
      s.async = true
      s.onload = start
      s.onerror = () => setState(s => ({ ...s, error: 'Failed to load WebGazer' }))
      document.head.appendChild(s)
    } else {
      start()
    }

    return () => {
      try {
        window.webgazer?.clearGazeListener?.()
      } catch {}
    }
  }, [])

  // API exposed to components
  return {
    isInitialized: state.isInitialized,
    isCalibrated: state.isCalibrated,
    currentGaze: state.currentGaze,
    error: state.error,

    completeCalibration: () => {
      setState(s => ({ ...s, isCalibrated: true }))
      saveCalibration(chainRef.current)
    },
    resetCalibration: () => {
      ema.current = null
      chainRef.current = { viewport: { W: window.innerWidth, H: window.innerHeight } }
      setState(s => ({ ...s, isCalibrated: false }))
      localStorage.removeItem('clientsight_calibration_v2')
    },

    setAffine: (A: [[number,number],[number,number]], b: [number,number]) => {
      chainRef.current.affine = { A, b }
      saveCalibration(chainRef.current)
    },
    setQuadratic: (Q: { ax: number[], ay: number[] }) => {
      chainRef.current.quad = Q
      saveCalibration(chainRef.current)
    },
    setRBFUnit: (rbfModel: any) => {
      chainRef.current.rbf = { model: rbfModel, viewport: chainRef.current.viewport }
      saveCalibration(chainRef.current)
    },
    setViewport: (v: Viewport) => {
      chainRef.current.viewport = v
      saveCalibration(chainRef.current)
    },

    setFlipX: (v: boolean) => { flipXRef.current = v },
    pauseTracking: () => { paused.current = true },
    resumeTracking: () => { paused.current = false },

    getElementAtGaze: (g: GazePoint | null) => {
      if (!g) return null
      const els = document.elementsFromPoint(g.x, g.y) as HTMLElement[]
      return els.find(el => !['HTML','BODY'].includes(el.tagName) && Number(getComputedStyle(el).zIndex) < 9997) || null
    },
  }
}
