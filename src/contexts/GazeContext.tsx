/**
 * Gaze Tracking Context (AGENT_2)
 * 
 * Single source of truth for all gaze tracking state.
 * 
 * Features:
 * - Auth-gated: Gaze features only available to authenticated users
 * - State machine: Flexible transitions with proper recalibration support
 * - Route-aware: Stops tracking when navigating away from /app
 * - Centralized: All gaze state flows through this context
 * - Safe: WebGazer UI elements never interfere with page content
 * - Throttled: State updates are batched to prevent React re-render storms
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { GazePoint, GazeSession, GazeStatus } from '@/types'
import { applyChainPixel, TransformChain, Viewport, Pt } from '@/utils/calibrationUtils'
import { 
  safeHideWebGazerUI, 
  safeInitializeWebGazerContainer, 
  safePauseWebGazer, 
  safeResumeWebGazer 
} from '@/utils/webgazerManager'
import { 
  saveCalibrationToFirebase, 
  loadCalibrationFromFirebase,
  generateDeviceFingerprint
} from '@/lib/firestore'

// ============================================================================
// TYPES
// ============================================================================

interface GazeContextType {
  // Session state
  session: GazeSession
  currentGaze: GazePoint | null
  
  // State machine actions
  enableGaze: () => Promise<boolean>
  disableGaze: () => void
  startCalibration: () => void
  completeCalibration: (accuracy: number) => void
  cancelCalibration: () => void
  pauseTracking: () => void
  resumeTracking: () => void
  setError: (message: string) => void
  clearError: () => void
  
  // Calibration transformation setters (used by Calibration component)
  setAffine: (A: [[number, number], [number, number]], b: [number, number]) => void
  setQuadratic: (Q: { ax: number[]; ay: number[] }) => void
  setRBFUnit: (rbfModel: any) => void
  setViewport: (v: Viewport) => void
  setFlipX: (v: boolean) => void
  
  // Utility
  resetCalibration: () => void
  getElementAtGaze: (g: GazePoint | null) => HTMLElement | null
  
  // Loading states
  isWebGazerLoaded: boolean
  isLoadingCalibration: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CALIBRATION_STORAGE_KEY = 'clientsight_calibration_v2'
const GAZE_ENABLED_ROUTES = ['/app']

// ============================================================================
// HELPERS
// ============================================================================

function loadLocalCalibration(): TransformChain | null {
  try {
    const raw = localStorage.getItem(CALIBRATION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed.viewport) return null
    return {
      affine: parsed.affine,
      quad: parsed.quad,
      rbf: parsed.rbf ? { model: parsed.rbf.model, viewport: parsed.viewport } : undefined,
      viewport: parsed.viewport
    }
  } catch {
    return null
  }
}

function saveLocalCalibration(chain: TransformChain): void {
  const payload = {
    affine: chain.affine,
    quad: chain.quad,
    rbf: chain.rbf ? { model: chain.rbf.model } : undefined,
    viewport: chain.viewport,
    timestamp: Date.now()
  }
  localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(payload))
  
  // Also store device fingerprint for cross-device detection
  try {
    const fingerprint = generateDeviceFingerprint()
    localStorage.setItem('clientsight_device_fingerprint', fingerprint)
  } catch (e) {
    console.warn('[GazeContext] Failed to save device fingerprint:', e)
  }
}

function clearLocalCalibration(): void {
  localStorage.removeItem(CALIBRATION_STORAGE_KEY)
}

// ============================================================================
// CONTEXT
// ============================================================================

const GazeContext = createContext<GazeContextType | null>(null)

// Default context value for when provider is not available (e.g., during HMR)
const DEFAULT_GAZE_CONTEXT: GazeContextType = {
  session: {
    userId: '',
    isGazeEnabled: false,
    isCalibrated: false,
    gazeStatus: 'idle' as GazeStatus,
  },
  currentGaze: null,
  enableGaze: async () => false,
  disableGaze: () => {},
  startCalibration: () => {},
  completeCalibration: () => {},
  cancelCalibration: () => {},
  pauseTracking: () => {},
  resumeTracking: () => {},
  setError: () => {},
  clearError: () => {},
  setAffine: () => {},
  setQuadratic: () => {},
  setRBFUnit: () => {},
  setViewport: () => {},
  setFlipX: () => {},
  resetCalibration: () => {},
  getElementAtGaze: () => null,
  isWebGazerLoaded: false,
  isLoadingCalibration: false,
}

export function useGaze(): GazeContextType {
  const context = useContext(GazeContext)
  if (!context) {
    // During HMR or error recovery, return a safe default instead of crashing
    console.warn('[useGaze] Context not available, returning default state')
    return DEFAULT_GAZE_CONTEXT
  }
  return context
}

// ============================================================================
// PROVIDER
// ============================================================================

declare global {
  interface Window {
    webgazer?: any
  }
}

export function GazeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  
  // Session state
  const [session, setSession] = useState<GazeSession>({
    userId: null,
    isGazeEnabled: false,
    isCalibrated: false,
    gazeStatus: 'idle',
    dataPointsCount: 0
  })
  
  const [currentGaze, setCurrentGaze] = useState<GazePoint | null>(null)
  const [isWebGazerLoaded, setIsWebGazerLoaded] = useState(false)
  const [isLoadingCalibration, setIsLoadingCalibration] = useState(true)
  
  // Refs for WebGazer state
  const chainRef = useRef<TransformChain>({ viewport: { W: window.innerWidth, H: window.innerHeight } })
  const emaRef = useRef<Pt | null>(null)
  const flipXRef = useRef(false)
  const pausedRef = useRef(false)
  const webgazerInitialized = useRef(false)
  
  // Throttle refs for gaze updates (prevents React re-render storms)
  const lastGazeUpdateRef = useRef<number>(0)
  const pendingGazeRef = useRef<GazePoint | null>(null)
  const dataPointsRef = useRef<number>(0)
  const GAZE_UPDATE_INTERVAL_MS = 50 // Update React state max 20 times per second
  
  // ============================================================================
  // AUTH SYNC
  // ============================================================================
  
  useEffect(() => {
    setSession(prev => ({
      ...prev,
      userId: user?.uid ?? null,
      ...(user ? {} : {
        isGazeEnabled: false,
        gazeStatus: 'idle' as GazeStatus,
        isCalibrated: false
      })
    }))
  }, [user?.uid])
  
  // ============================================================================
  // ROUTE-AWARE GAZE MANAGEMENT
  // ============================================================================
  
  useEffect(() => {
    const isOnGazeRoute = GAZE_ENABLED_ROUTES.some(route => location.pathname.startsWith(route))
    
    if (!isOnGazeRoute && session.gazeStatus !== 'idle') {
      console.log('[GazeContext] Navigated away from gaze route, stopping tracking')
      
      // Hide all WebGazer UI and pause
      safeHideWebGazerUI()
      safePauseWebGazer()
      
      setSession(prev => ({
        ...prev,
        gazeStatus: 'idle',
        isGazeEnabled: false
      }))
      setCurrentGaze(null)
      pausedRef.current = true
    }
  }, [location.pathname, session.gazeStatus])
  
  // ============================================================================
  // CALIBRATION LOADING (Local + Firebase fallback)
  // ============================================================================
  
  useEffect(() => {
    if (!user) {
      setIsLoadingCalibration(false)
      return
    }
    
    const loadCalibration = async () => {
      try {
        setIsLoadingCalibration(true)
        
        // Step 1: Try to load from local storage (primary - has full WebGazer data)
        const localCalibration = loadLocalCalibration()
        
        if (localCalibration && (localCalibration.affine || localCalibration.quad || localCalibration.rbf)) {
          console.log('[GazeContext] Loaded calibration from localStorage')
          chainRef.current = localCalibration
          
          // Check if local calibration matches current device
          const currentFingerprint = generateDeviceFingerprint()
          const storedFingerprint = localStorage.getItem('clientsight_device_fingerprint')
          
          if (storedFingerprint && storedFingerprint !== currentFingerprint) {
            console.warn('[GazeContext] Device fingerprint mismatch - calibration may be from a different setup')
            // Still use the calibration, but user can recalibrate if needed
          }
          
          setSession(prev => ({
            ...prev,
            isCalibrated: true
          }))
          return
        }
        
        // Step 2: No local calibration - check Firebase for metadata
        // Note: Firebase only stores metadata (accuracy, timestamp) not the actual calibration
        // This helps detect if user has calibrated on another device
        console.log('[GazeContext] No local calibration found, checking Firebase...')
        
        const firebaseCalibration = await loadCalibrationFromFirebase(user.uid)
        
        if (firebaseCalibration) {
          // User has calibrated before (on this or another device)
          console.log('[GazeContext] Found calibration metadata in Firebase:', {
            accuracy: firebaseCalibration.accuracy,
            timestamp: new Date(firebaseCalibration.timestamp).toISOString()
          })
          
          // Check if same device
          const currentFingerprint = generateDeviceFingerprint()
          if (firebaseCalibration.deviceFingerprint === currentFingerprint) {
            // Same device but local storage cleared - still need to recalibrate
            console.log('[GazeContext] Same device but no local data - need to recalibrate')
          } else {
            // Different device - definitely need to recalibrate
            console.log('[GazeContext] Different device - need to calibrate for this device')
          }
          
          // Either way, we can't use Firebase calibration directly
          // (it only has metadata, not the actual WebGazer model)
          setSession(prev => ({
            ...prev,
            isCalibrated: false
          }))
        } else {
          console.log('[GazeContext] No calibration found in Firebase either')
          setSession(prev => ({
            ...prev,
            isCalibrated: false
          }))
        }
      } catch (err) {
        console.error('[GazeContext] Error loading calibration:', err)
        setSession(prev => ({
          ...prev,
          isCalibrated: false
        }))
      } finally {
        setIsLoadingCalibration(false)
      }
    }
    
    loadCalibration()
  }, [user?.uid])
  
  // ============================================================================
  // STATE MACHINE ACTIONS
  // ============================================================================
  
  /**
   * Enable gaze tracking (requires auth)
   */
  const enableGaze = useCallback(async (): Promise<boolean> => {
    console.log('[GazeContext] enableGaze called')
    
    if (!user) {
      console.warn('[GazeContext] Cannot enable gaze: user not authenticated')
      return false
    }
    
    const isOnGazeRoute = GAZE_ENABLED_ROUTES.some(route => location.pathname.startsWith(route))
    if (!isOnGazeRoute) {
      console.warn('[GazeContext] Cannot enable gaze: not on gaze-enabled route')
      return false
    }
    
    // Pre-check camera permissions before loading WebGazer
    try {
      // Check if camera API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setSession(prev => ({
          ...prev,
          gazeStatus: 'error',
          error: 'Camera API not available. Please use a modern browser like Chrome or Firefox.'
        }))
        return false
      }
      
      // Request camera access to check permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      // Immediately stop the stream - WebGazer will request its own
      stream.getTracks().forEach(track => track.stop())
      console.log('[GazeContext] Camera permission granted')
    } catch (err: any) {
      console.error('[GazeContext] Camera permission check failed:', err)
      
      let errorMessage = 'Camera access denied. Please enable camera permissions in your browser settings.'
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera access denied. Please enable camera permissions in your browser settings.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera detected. Please connect a webcam and try again.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is in use by another application. Please close other apps using the camera.'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not meet requirements. Please try a different camera.'
      }
      
      setSession(prev => ({
        ...prev,
        gazeStatus: 'error',
        error: errorMessage
      }))
      return false
    }
    
    // Load WebGazer if needed (face mesh will be shown after initialization)
    if (!window.webgazer) {
      try {
        await loadWebGazer()
      } catch (err) {
        console.error('[GazeContext] Failed to load WebGazer:', err)
        setSession(prev => ({
          ...prev,
          gazeStatus: 'error',
          error: 'Failed to load gaze tracking library. Please refresh the page.'
        }))
        return false
      }
    }
    
    // Initialize WebGazer if not already done
    if (!webgazerInitialized.current) {
      try {
        await initializeWebGazer()
        webgazerInitialized.current = true
      } catch (err) {
        console.error('[GazeContext] Failed to initialize WebGazer:', err)
        setSession(prev => ({
          ...prev,
          gazeStatus: 'error',
          error: err instanceof Error ? err.message : 'Failed to initialize gaze tracking'
        }))
        return false
      }
    } else {
      // Resume WebGazer but keep UI hidden
      safeResumeWebGazer()
    }
    
    pausedRef.current = false
    
    setSession(prev => ({
      ...prev,
      isGazeEnabled: true,
      gazeStatus: prev.isCalibrated ? 'tracking' : 'idle',
      sessionStart: Date.now()
    }))
    
    console.log('[GazeContext] Gaze enabled successfully')
    return true
  }, [user, location.pathname])
  
  /**
   * Disable gaze tracking
   */
  const disableGaze = useCallback(() => {
    console.log('[GazeContext] disableGaze called')
    
    pausedRef.current = true
    safeHideWebGazerUI()
    safePauseWebGazer()
    
    setSession(prev => ({
      ...prev,
      gazeStatus: 'idle',
      isGazeEnabled: false
    }))
    setCurrentGaze(null)
  }, [])
  
  /**
   * Start calibration flow - can be called from any state
   */
  const startCalibration = useCallback(() => {
    console.log('[GazeContext] startCalibration called')
    
    if (!user) {
      console.warn('[GazeContext] Cannot start calibration: user not authenticated')
      return
    }
    
    // Keep WebGazer UI visible during calibration so user can see face mesh
    // (Don't call safeHideWebGazerUI here)
    
    // Can transition to calibrating from any state
    setSession(prev => ({
      ...prev,
      gazeStatus: 'calibrating'
    }))
  }, [user])
  
  /**
   * Complete calibration with accuracy validation
   * If accuracy is too low (>120px median error), warn the user but still allow tracking
   * Saves calibration to both local storage AND Firebase for cross-device sync
   */
  const completeCalibration = useCallback(async (accuracy: number) => {
    console.log('[GazeContext] Calibration completed with accuracy:', accuracy)
    
    const LOW_ACCURACY_THRESHOLD = 120 // pixels
    const isLowAccuracy = accuracy > LOW_ACCURACY_THRESHOLD
    
    if (isLowAccuracy) {
      console.warn('[GazeContext] Calibration accuracy is low:', accuracy, 'px')
    }
    
    // Save to local storage (primary - contains full WebGazer data)
    saveLocalCalibration(chainRef.current)
    
    // Save to Firebase (secondary - metadata only for cross-device awareness)
    if (user?.uid) {
      try {
        await saveCalibrationToFirebase(user.uid, accuracy)
        console.log('[GazeContext] Calibration saved to Firebase')
      } catch (err) {
        console.error('[GazeContext] Failed to save calibration to Firebase:', err)
        // Don't block on Firebase failure - local storage is primary
      }
    }
    
    setSession(prev => ({
      ...prev,
      isCalibrated: true,
      calibrationAccuracy: accuracy,
      gazeStatus: 'tracking',
      // Set a warning error that doesn't block tracking but informs the user
      error: isLowAccuracy 
        ? `Calibration accuracy is low (±${Math.round(accuracy)}px). Consider recalibrating in better lighting.`
        : null
    }))
  }, [user?.uid])
  
  /**
   * Cancel calibration
   */
  const cancelCalibration = useCallback(() => {
    console.log('[GazeContext] cancelCalibration called')
    
    setSession(prev => ({
      ...prev,
      gazeStatus: prev.isCalibrated ? 'tracking' : 'idle'
    }))
  }, [])
  
  /**
   * Pause tracking
   */
  const pauseTracking = useCallback(() => {
    console.log('[GazeContext] pauseTracking called')
    
    pausedRef.current = true
    
    setSession(prev => ({
      ...prev,
      gazeStatus: 'paused'
    }))
  }, [])
  
  /**
   * Resume tracking
   */
  const resumeTracking = useCallback(() => {
    console.log('[GazeContext] resumeTracking called')
    
    pausedRef.current = false
    
    setSession(prev => ({
      ...prev,
      gazeStatus: 'tracking'
    }))
  }, [])
  
  /**
   * Set error state
   */
  const setError = useCallback((message: string) => {
    console.error('[GazeContext] Error:', message)
    
    safeHideWebGazerUI()
    
    setSession(prev => ({
      ...prev,
      gazeStatus: 'error',
      error: message
    }))
  }, [])
  
  /**
   * Clear error and return to idle
   */
  const clearError = useCallback(() => {
    setSession(prev => ({
      ...prev,
      gazeStatus: 'idle',
      error: undefined
    }))
  }, [])
  
  // ============================================================================
  // CALIBRATION TRANSFORMATION SETTERS
  // ============================================================================
  
  const setAffine = useCallback((A: [[number, number], [number, number]], b: [number, number]) => {
    chainRef.current.affine = { A, b }
    saveLocalCalibration(chainRef.current)
  }, [])
  
  const setQuadratic = useCallback((Q: { ax: number[]; ay: number[] }) => {
    chainRef.current.quad = Q
    saveLocalCalibration(chainRef.current)
  }, [])
  
  const setRBFUnit = useCallback((rbfModel: any) => {
    chainRef.current.rbf = { model: rbfModel, viewport: chainRef.current.viewport }
    saveLocalCalibration(chainRef.current)
  }, [])
  
  const setViewport = useCallback((v: Viewport) => {
    chainRef.current.viewport = v
    saveLocalCalibration(chainRef.current)
  }, [])
  
  const setFlipX = useCallback((v: boolean) => {
    flipXRef.current = v
  }, [])
  
  const resetCalibration = useCallback(() => {
    console.log('[GazeContext] resetCalibration called')
    
    emaRef.current = null
    chainRef.current = { viewport: { W: window.innerWidth, H: window.innerHeight } }
    clearLocalCalibration()
    
    setSession(prev => ({
      ...prev,
      isCalibrated: false,
      calibrationAccuracy: undefined
    }))
  }, [])
  
  // ============================================================================
  // WEBGAZER MANAGEMENT
  // ============================================================================
  
  const loadWebGazer = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.webgazer) {
        setIsWebGazerLoaded(true)
        resolve()
        return
      }
      
      console.log('[GazeContext] Loading WebGazer script...')
      
      const script = document.createElement('script')
      script.src = 'https://webgazer.cs.brown.edu/webgazer.js'
      script.async = true
      script.onload = () => {
        console.log('[GazeContext] WebGazer script loaded')
        setIsWebGazerLoaded(true)
        resolve()
      }
      script.onerror = () => {
        reject(new Error('Failed to load WebGazer script'))
      }
      document.head.appendChild(script)
    })
  }, [])
  
  const initializeWebGazer = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      const wg = window.webgazer
      if (!wg) {
        reject(new Error('WebGazer not available'))
        return
      }
      
      console.log('[GazeContext] Initializing WebGazer...')
      
      // Configure WebGazer with ALL visual elements hidden
      // Note: Modern WebGazer only supports 'TFFacemesh' tracker
      wg.setRegression('ridge')
        .setTracker('TFFacemesh')
        .showPredictionPoints(false)
        .showVideoPreview(true)  // Show camera preview
        .showFaceOverlay(true)   // Show blue face mesh for tracking visualization
        .showFaceFeedbackBox(true) // Show feedback box around face
        .applyKalmanFilter(true)  // Enable Kalman filter for smoother tracking
      
      // Set up gaze listener with THROTTLED state updates and ERROR HANDLING
      // This prevents React re-render storms from 60fps gaze data
      // and ensures any errors in the callback don't crash the app
      wg.setGazeListener((data: any, ts: number) => {
        try {
          // Early exit if paused or no data
          if (pausedRef.current || !data) return
          
          // Validate data coordinates
          if (typeof data.x !== 'number' || typeof data.y !== 'number') return
          if (!isFinite(data.x) || !isFinite(data.y)) return
          
          let gx = data.x, gy = data.y
          if (flipXRef.current) gx = window.innerWidth - gx
          
          // Bounds check
          if (gx < 0 || gx > window.innerWidth * 2) return
          if (gy < 0 || gy > window.innerHeight * 2) return
          
          const p = applyChainPixel({ x: gx, y: gy }, chainRef.current)
          
          // Validate transformed point
          if (!isFinite(p.x) || !isFinite(p.y)) return
          
          // Get confidence from WebGazer (if available)
          const confidence = data?.confidence ?? 1
          
          // Skip low-confidence samples (helps improve accuracy)
          if (confidence < 0.4) return
          
          // Adaptive EMA smoothing based on confidence
          // Higher confidence = more responsive (higher alpha)
          // Lower confidence = more smooth (lower alpha)
          // Range: 0.15 (very smooth) to 0.35 (responsive)
          const baseAlpha = 0.20
          const confidenceBonus = confidence * 0.15
          const alpha = Math.min(0.35, baseAlpha + confidenceBonus)
          
          if (!emaRef.current) {
            emaRef.current = { x: p.x, y: p.y }
          } else {
            emaRef.current.x = alpha * p.x + (1 - alpha) * emaRef.current.x
            emaRef.current.y = alpha * p.y + (1 - alpha) * emaRef.current.y
          }
          
          // Increment data points in ref (not state) - avoids re-renders
          dataPointsRef.current++
          
          // Store pending gaze point with confidence
          pendingGazeRef.current = {
            x: emaRef.current.x,
            y: emaRef.current.y,
            timestamp: ts,
            confidence
          }
          
          // THROTTLE: Only update React state at controlled interval
          const now = Date.now()
          if (now - lastGazeUpdateRef.current >= GAZE_UPDATE_INTERVAL_MS) {
            lastGazeUpdateRef.current = now
            
            // Batch update both gaze point and data count
            setCurrentGaze(pendingGazeRef.current)
            setSession(prev => ({
              ...prev,
              dataPointsCount: dataPointsRef.current
            }))
          }
        } catch (err) {
          // Silently ignore errors in gaze listener to prevent crashes
          // Only log once per 10 seconds to avoid console spam
          const now = Date.now()
          if (!lastGazeUpdateRef.current || now - lastGazeUpdateRef.current > 10000) {
            console.warn('[GazeContext] Error in gaze listener:', err)
          }
        }
      })
      
      // Start WebGazer
      wg.begin()
        .then(async () => {
          console.log('[GazeContext] WebGazer started, initializing container...')
          
          // CRITICAL: Re-apply visual settings AFTER begin() as WebGazer may reset them
          wg.showVideoPreview(true)
          wg.showFaceOverlay(true)
          wg.showFaceFeedbackBox(true)
          wg.applyKalmanFilter(true)
          
          // Initialize and style the WebGazer container (shows face mesh overlay)
          safeInitializeWebGazerContainer()
          
          console.log('[GazeContext] Face overlay and feedback box enabled')
          
          // Wait for face tracker to be ready (up to 5 seconds)
          // This ensures gaze predictions are stable before we say we're ready
          let faceReady = false
          for (let i = 0; i < 50; i++) {
            await new Promise(r => setTimeout(r, 100))
            
            // Check if we're getting predictions
            const prediction = wg.getCurrentPrediction?.()
            if (prediction && typeof prediction.x === 'number' && typeof prediction.y === 'number') {
              faceReady = true
              console.log('[GazeContext] Face tracker ready, getting predictions')
              break
            }
          }
          
          if (!faceReady) {
            console.warn('[GazeContext] Face tracker may not be fully initialized, proceeding anyway')
          }
          
          resolve()
        })
        .catch((err: any) => {
          console.error('[GazeContext] Error starting WebGazer:', err)
          reject(new Error('Failed to start WebGazer. Check camera permissions.'))
        })
    })
  }, [])
  
  // ============================================================================
  // UTILITY
  // ============================================================================
  
  const getElementAtGaze = useCallback((g: GazePoint | null): HTMLElement | null => {
    if (!g) return null
    const els = document.elementsFromPoint(g.x, g.y) as HTMLElement[]
    return els.find(el => 
      !['HTML', 'BODY'].includes(el.tagName) && 
      Number(getComputedStyle(el).zIndex) < 9997
    ) || null
  }, [])
  
  // ============================================================================
  // GLOBAL ERROR HANDLING
  // ============================================================================
  
  useEffect(() => {
    // Handle unhandled promise rejections (might come from WebGazer)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || String(event.reason)
      
      // Check if it's related to WebGazer or camera
      if (
        message.toLowerCase().includes('webgazer') ||
        message.toLowerCase().includes('camera') ||
        message.toLowerCase().includes('permission') ||
        message.toLowerCase().includes('mediadevices') ||
        message.toLowerCase().includes('tensorflow')
      ) {
        console.error('[GazeContext] WebGazer-related unhandled rejection:', message)
        
        // Stop WebGazer and hide UI
        safeHideWebGazerUI()
        safePauseWebGazer()
        
        setSession(prev => ({
          ...prev,
          gazeStatus: 'error',
          error: 'Gaze tracking encountered an error. Please try again.',
          isGazeEnabled: false
        }))
        
        // Prevent the error from bubbling up and crashing the page
        event.preventDefault()
      }
    }
    
    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
      const message = event.message || ''
      
      if (
        message.toLowerCase().includes('webgazer') ||
        message.toLowerCase().includes('tensorflow')
      ) {
        console.error('[GazeContext] WebGazer-related error:', message)
        
        safeHideWebGazerUI()
        safePauseWebGazer()
        
        setSession(prev => ({
          ...prev,
          gazeStatus: 'error',
          error: 'Gaze tracking error. Please refresh the page.',
          isGazeEnabled: false
        }))
        
        event.preventDefault()
      }
    }
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])
  
  // ============================================================================
  // CLEANUP
  // ============================================================================
  
  useEffect(() => {
    return () => {
      if (window.webgazer && webgazerInitialized.current) {
        console.log('[GazeContext] Cleaning up WebGazer')
        try {
          safeHideWebGazerUI()
          window.webgazer.end()
        } catch (err) {
          console.error('[GazeContext] Error stopping WebGazer:', err)
        }
      }
    }
  }, [])
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  const value: GazeContextType = {
    session,
    currentGaze,
    enableGaze,
    disableGaze,
    startCalibration,
    completeCalibration,
    cancelCalibration,
    pauseTracking,
    resumeTracking,
    setError,
    clearError,
    setAffine,
    setQuadratic,
    setRBFUnit,
    setViewport,
    setFlipX,
    resetCalibration,
    getElementAtGaze,
    isWebGazerLoaded,
    isLoadingCalibration
  }
  
  return (
    <GazeContext.Provider value={value}>
      {children}
    </GazeContext.Provider>
  )
}
