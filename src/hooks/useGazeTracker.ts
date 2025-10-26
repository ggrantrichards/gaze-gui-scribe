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
    demoMode: false,
  })

  const ema = useRef<Pt | null>(null)
  const paused = useRef(false)
  const flipXRef = useRef(false)
  const flipYRef = useRef(false)
  const lastUpdateTime = useRef(0)
  const demoMouseRef = useRef<Pt | null>(null)

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

  // Demo mode: simulate gaze with mouse movement - SLOW AND SMOOTH
  useEffect(() => {
    if (!state.demoMode) return
    
    const handleMouseMove = (e: MouseEvent) => {
      if (paused.current) return
      
      const now = Date.now()
      // Match the stable update rate for demo mode too
      if (now - lastUpdateTime.current < 25) return
      lastUpdateTime.current = now
      
      // Smooth mouse tracking with EMA - matching main tracker settings
      if (!demoMouseRef.current) {
        demoMouseRef.current = { x: e.clientX, y: e.clientY }
      } else {
        const velocity = Math.hypot(e.clientX - demoMouseRef.current.x, e.clientY - demoMouseRef.current.y)
        const alpha = 0.28  // Match main tracker - balanced smoothness
        demoMouseRef.current.x = alpha * e.clientX + (1 - alpha) * demoMouseRef.current.x
        demoMouseRef.current.y = alpha * e.clientY + (1 - alpha) * demoMouseRef.current.y
      }
      
      setState(s => ({
        ...s,
        currentGaze: {
          x: demoMouseRef.current!.x,
          y: demoMouseRef.current!.y,
          timestamp: now,
          confidence: 0.95,
          trackingQuality: 'excellent',
          velocity: 0
        }
      }))
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [state.demoMode])

  useEffect(() => {
    if (state.demoMode) return // Skip WebGazer in demo mode
    
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
        .applyKalmanFilter(true)  // Enable Kalman filter for smoother prediction
        .setGazeListener((data: any, ts: number) => {
          if (paused.current || !data) return
          
          // Stable throttling for smooth tracking - 25ms (~40fps for balanced smoothness)
          const now = Date.now()
          if (now - lastUpdateTime.current < 25) return
          lastUpdateTime.current = now
          
          let gx = data.x, gy = data.y
          if (flipXRef.current) gx = window.innerWidth - gx
          if (flipYRef.current) gy = window.innerHeight - gy

          const p = applyChainPixel({ x: gx, y: gy }, chainRef.current)

          // Adaptive smoothing based on movement speed for natural flow
          const velocity = ema.current ? Math.hypot(p.x - ema.current.x, p.y - ema.current.y) : 0
          
          // STABLE and ACCURATE tracking - balance between smooth and responsive
          // Higher alpha = more responsive = less lag and flailing
          const baseAlpha = 0.28  // Balanced - smooth but responsive
          const alpha = velocity > 5 ? Math.min(0.4, baseAlpha * 1.3) : baseAlpha
          
          // Calculate tracking quality based on confidence and stability
          const conf = data?.confidence ?? 1
          const getTrackingQuality = (): 'excellent' | 'good' | 'fair' | 'poor' => {
            if (conf > 0.8 && velocity < 20) return 'excellent'
            if (conf > 0.6 && velocity < 35) return 'good'
            if (conf > 0.4) return 'fair'
            return 'poor'
          }
          
          if (!ema.current) ema.current = { x: p.x, y: p.y }
          else {
            ema.current.x = alpha * p.x + (1 - alpha) * ema.current.x
            ema.current.y = alpha * p.y + (1 - alpha) * ema.current.y
          }

          // NO BOUNDARIES - let the dot roam free across the entire screen
          // Removed all constraints for full screen access

          setState(s => ({
            ...s,
            currentGaze: {
              x: ema.current!.x,
              y: ema.current!.y,
              timestamp: ts,
              confidence: conf,
              trackingQuality: getTrackingQuality(),
              velocity: velocity
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
  }, [state.demoMode])

  // API exposed to components
  return {
    isInitialized: state.isInitialized,
    isCalibrated: state.isCalibrated,
    currentGaze: state.currentGaze,
    error: state.error,
    demoMode: state.demoMode,

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
    
    toggleDemoMode: () => {
      setState(s => ({ 
        ...s, 
        demoMode: !s.demoMode,
        isCalibrated: !s.demoMode // Auto-calibrate in demo mode
      }))
      if (!state.demoMode) {
        // Switching TO demo mode - skip WebGazer initialization
        setState(s => ({ ...s, isInitialized: true, isCalibrated: true }))
      }
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
    setFlipY: (v: boolean) => { flipYRef.current = v },
    pauseTracking: () => { paused.current = true },
    resumeTracking: () => { paused.current = false },

    getElementAtGaze: (g: GazePoint | null) => {
      if (!g) return null
      const els = document.elementsFromPoint(g.x, g.y) as HTMLElement[]
      return els.find(el => !['HTML','BODY'].includes(el.tagName) && Number(getComputedStyle(el).zIndex) < 9997) || null
    },
  }
}
