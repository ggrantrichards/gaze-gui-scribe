import { useEffect, useRef, useState, useMemo } from 'react'
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

  // Load calibration BEFORE initializing the ref
  const loadedCalibration = useMemo(() => {
    const loaded = loadCalibration()
    if (loaded) {
      console.log('[GazeTracker] Loaded persisted calibration:', {
        hasAffine: !!loaded.affine,
        hasQuad: !!loaded.quad,
        hasRBF: !!loaded.rbf,
        viewport: loaded.viewport
      })
      return loaded
    } else {
      console.log('[GazeTracker] No persisted calibration found')
      return { viewport: { W: window.innerWidth, H: window.innerHeight } }
    }
  }, [])

  const chainRef = useRef<TransformChain>(loadedCalibration)

  useEffect(() => {
    // Update calibration state if we loaded calibration
    if (loadedCalibration.affine || loadedCalibration.quad || loadedCalibration.rbf) {
      setState(s => ({ ...s, isCalibrated: true }))
    }
  }, [loadedCalibration.affine, loadedCalibration.quad, loadedCalibration.rbf])

  useEffect(() => {
    const setupGazeListener = (wg: any) => {
      wg.setGazeListener((data: any, ts: number) => {
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
    }

    const start = () => {
      const wg = window.webgazer
      if (!wg) {
        setState(s => ({ ...s, error: 'WebGazer unavailable' }))
        return
      }

      // Check if WebGazer is already running (from previous mount/calibration)
      const isAlreadyRunning = wg.params && wg.params.videoElementCanvas

      if (isAlreadyRunning) {
        // WebGazer is already running, just set up our listener
        console.log('[GazeTracker] WebGazer already running, attaching listener')
        setupGazeListener(wg)
        setState(s => ({ ...s, isInitialized: true }))
        
        // Ensure video container is styled correctly
        setTimeout(() => {
          try {
            const container = document.querySelector('#webgazerVideoContainer')
            if (container) {
              container.setAttribute('style', 'position:fixed;left:50%;top:10%;transform:translate(-50%,0);width:220px;z-index:99990;border-radius:8px;overflow:hidden;')
            }
          } catch {}
        }, 100)
      } else {
        // First time initialization
        console.log('[GazeTracker] Starting WebGazer for first time')
        wg.setRegression('ridge')
          .setTracker('clmtrackr')
          .showPredictionPoints(false)
          .showVideoPreview(true)
          .showFaceOverlay(true)
          .showFaceFeedbackBox(true)
          .applyKalmanFilter(false)

        setupGazeListener(wg)

        wg.begin().then(() => {
          setTimeout(() => {
            try {
              document.querySelector('#webgazerVideoContainer')?.setAttribute('style', 'position:fixed;left:50%;top:10%;transform:translate(-50%,0);width:220px;z-index:99990;border-radius:8px;overflow:hidden;')
            } catch {}
          }, 500)
          setState(s => ({ ...s, isInitialized: true }))
        }).catch((err: any) => {
          console.error('[GazeTracker] Error starting WebGazer:', err)
          setState(s => ({ ...s, error: 'Failed to start WebGazer' }))
        })
      }
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

    // Don't clear the gaze listener on unmount - WebGazer should persist
    // This allows calibration to carry over when navigating between pages
    return () => {
      // Intentionally empty - WebGazer persists across route changes
      console.log('[GazeTracker] Component unmounting, keeping WebGazer running')
    }
  }, [])

  // API exposed to components
  return {
    isInitialized: state.isInitialized,
    isCalibrated: state.isCalibrated,
    currentGaze: state.currentGaze,
    error: state.error,

    completeCalibration: () => {
      console.log('[GazeTracker] Calibration completed:', {
        hasAffine: !!chainRef.current.affine,
        hasQuad: !!chainRef.current.quad,
        hasRBF: !!chainRef.current.rbf,
        viewport: chainRef.current.viewport
      })
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
      console.log('[GazeTracker] Setting affine transformation')
      chainRef.current.affine = { A, b }
      saveCalibration(chainRef.current)
    },
    setQuadratic: (Q: { ax: number[], ay: number[] }) => {
      console.log('[GazeTracker] Setting quadratic transformation')
      chainRef.current.quad = Q
      saveCalibration(chainRef.current)
    },
    setRBFUnit: (rbfModel: any) => {
      console.log('[GazeTracker] Setting RBF transformation')
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
