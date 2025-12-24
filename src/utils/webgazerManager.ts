/**
 * WebGazer Manager - Centralized control of WebGazer DOM elements
 * 
 * This utility ensures WebGazer's video container and overlays never
 * interfere with the main page content by:
 * 1. Keeping all elements hidden by default
 * 2. Providing explicit show/hide methods
 * 3. Forcing proper positioning and sizing
 * 4. Using safe DOM manipulation with error boundaries
 */

declare global {
  interface Window {
    webgazer?: any
  }
}

// Track initialization state
let isWebGazerInitialized = false
let initializationAttempts = 0
const MAX_INIT_ATTEMPTS = 3

/**
 * Safe wrapper that catches and logs errors without crashing
 */
function safeExecute<T>(fn: () => T, fallback: T, context: string): T {
  try {
    return fn()
  } catch (err) {
    console.warn(`[WebGazerManager] ${context}:`, err)
    return fallback
  }
}

/**
 * Check if WebGazer is available and initialized
 */
export function isWebGazerReady(): boolean {
  return !!(window.webgazer && isWebGazerInitialized)
}

/**
 * Hide all WebGazer visual elements (safe version)
 */
export function safeHideWebGazerUI(): void {
  safeExecute(() => {
    const wg = window.webgazer
    if (wg) {
      // Use try-catch for each method in case one fails
      try { wg.showVideoPreview(false) } catch {}
      try { wg.showFaceOverlay(false) } catch {}
      try { wg.showFaceFeedbackBox(false) } catch {}
      try { wg.showPredictionPoints(false) } catch {}
    }
    
    // Force-hide the container via DOM (schedule for next frame to avoid conflicts)
    requestAnimationFrame(() => {
      const container = document.getElementById('webgazerVideoContainer')
      if (container) {
        container.style.cssText = `
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          position: fixed !important;
          z-index: -1 !important;
        `
      }
      
      // Hide other WebGazer elements
      const selectors = [
        '#webgazerFaceOverlay',
        '#webgazerFaceFeedbackBox',
        '#webgazerGazeDot',
        '#webgazerVideoFeed'
      ]
      
      selectors.forEach(selector => {
        const el = document.querySelector(selector) as HTMLElement
        if (el) {
          el.style.display = 'none'
          el.style.visibility = 'hidden'
        }
      })
    })
  }, undefined, 'Error hiding UI')
}

/**
 * Original function name for backward compatibility
 */
export const hideWebGazerUI = safeHideWebGazerUI

/**
 * Show the WebGazer camera preview in a small, non-intrusive position (safe version)
 * Also enables face overlay and feedback box for visual tracking feedback
 */
export function safeShowWebGazerCamera(position?: { x: number, y: number }): void {
  safeExecute(() => {
    // First, ensure WebGazer settings are applied
    const wg = window.webgazer
    if (wg) {
      try { wg.showVideoPreview(true) } catch {}
      try { wg.showFaceOverlay(true) } catch {}
      try { wg.showFaceFeedbackBox(true) } catch {}
    }
    
    requestAnimationFrame(() => {
      const container = document.getElementById('webgazerVideoContainer')
      if (!container) return
      
      const x = position?.x ?? (window.innerWidth - 260)
      const y = position?.y ?? (window.innerHeight - 220)
      
      container.style.cssText = `
        position: fixed !important;
        display: block !important;
        left: ${x}px !important;
        top: ${y}px !important;
        right: auto !important;
        bottom: auto !important;
        width: 240px !important;
        height: auto !important;
        z-index: 99990 !important;
        background: #0f172a !important;
        border-radius: 0 0 12px 12px !important;
        overflow: visible !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
        border: 2px solid rgba(59, 130, 246, 0.4) !important;
        border-top: none !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      `
      
      // Style internal elements - video and canvas
      const video = container.querySelector('video') as HTMLVideoElement
      if (video) {
        video.style.cssText = `
          width: 100% !important; 
          height: auto !important; 
          display: block !important;
          border-radius: 0 0 10px 10px !important;
        `
      }
      
      // Style ALL canvases in the container (video canvas and face overlay)
      const canvases = container.querySelectorAll('canvas')
      canvases.forEach((canvas) => {
        canvas.style.cssText = `
          width: 100% !important; 
          height: auto !important; 
          position: absolute !important; 
          top: 0 !important; 
          left: 0 !important;
          display: block !important;
          pointer-events: none !important;
        `
      })
      
      // Specifically style the face overlay canvas
      const faceOverlay = document.getElementById('webgazerFaceOverlay') as HTMLCanvasElement
      if (faceOverlay) {
        faceOverlay.style.display = 'block'
        faceOverlay.style.visibility = 'visible'
      }
      
      // Style the face feedback box (bounding box around face)
      const faceFeedbackBox = document.getElementById('webgazerFaceFeedbackBox') as HTMLElement
      if (faceFeedbackBox) {
        faceFeedbackBox.style.cssText = `
          display: block !important;
          position: absolute !important;
          border: 2px solid #3b82f6 !important;
          border-radius: 4px !important;
          pointer-events: none !important;
          background: rgba(59, 130, 246, 0.1) !important;
        `
      }
    })
  }, undefined, 'Error showing camera')
}

/**
 * Original function name for backward compatibility
 */
export const showWebGazerCamera = safeShowWebGazerCamera

/**
 * Update WebGazer camera position (safe version)
 */
export function safeUpdateWebGazerPosition(x: number, y: number): void {
  safeExecute(() => {
    requestAnimationFrame(() => {
      const container = document.getElementById('webgazerVideoContainer')
      if (!container) return
      
      container.style.left = `${x}px`
      container.style.top = `${y}px`
    })
  }, undefined, 'Error updating position')
}

/**
 * Original function name for backward compatibility
 */
export const updateWebGazerPosition = safeUpdateWebGazerPosition

/**
 * Force initialize WebGazer container styling (safe version)
 * Call this right after webgazer.begin() resolves
 * Now shows the face overlay by default for better user feedback
 */
export function safeInitializeWebGazerContainer(): void {
  isWebGazerInitialized = true
  
  const styleContainer = (): boolean => {
    return safeExecute(() => {
      const container = document.getElementById('webgazerVideoContainer')
      if (!container) return false
      
      // Position the container in the bottom-right corner, visible with face overlay
      container.style.cssText = `
        position: fixed !important;
        display: block !important;
        width: 240px !important;
        height: auto !important;
        right: 16px !important;
        bottom: 16px !important;
        left: auto !important;
        top: auto !important;
        z-index: 99990 !important;
        background: #0f172a !important;
        border-radius: 12px !important;
        overflow: hidden !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.3) !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        border: 2px solid rgba(59,130,246,0.4) !important;
      `
      
      // Style internal elements
      const video = container.querySelector('video') as HTMLVideoElement
      const canvas = container.querySelector('canvas') as HTMLCanvasElement
      if (video) {
        video.style.cssText = `
          width: 100% !important; 
          height: auto !important; 
          display: block !important;
          border-radius: 10px !important;
        `
      }
      if (canvas) {
        canvas.style.cssText = `
          width: 100% !important; 
          height: auto !important; 
          position: absolute !important; 
          top: 0 !important; 
          left: 0 !important;
          pointer-events: none !important;
        `
      }
      
      // Style the face overlay canvas (blue mesh)
      const faceOverlay = document.getElementById('webgazerFaceOverlay') as HTMLCanvasElement
      if (faceOverlay) {
        faceOverlay.style.cssText = `
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          pointer-events: none !important;
        `
      }
      
      // Style the face feedback box
      const faceFeedbackBox = document.getElementById('webgazerFaceFeedbackBox') as HTMLElement
      if (faceFeedbackBox) {
        faceFeedbackBox.style.cssText = `
          display: block !important;
          position: absolute !important;
          border: 2px solid #3b82f6 !important;
          border-radius: 4px !important;
          pointer-events: none !important;
        `
      }
      
      return true
    }, false, 'Error styling container')
  }
  
  // Use requestAnimationFrame for DOM operations
  const tryStyle = () => {
    if (styleContainer()) return
    
    // Retry with increasing delays
    let attempts = 0
    const maxAttempts = 10
    const retry = () => {
      if (styleContainer() || attempts >= maxAttempts) return
      attempts++
      requestAnimationFrame(retry)
    }
    requestAnimationFrame(retry)
  }
  
  // Schedule for next frame to avoid conflicts with WebGazer's internal operations
  requestAnimationFrame(tryStyle)
  
  // Re-style after delays to catch any late-loading elements
  setTimeout(() => styleContainer(), 100)
  setTimeout(() => styleContainer(), 300)
  setTimeout(() => styleContainer(), 500)
}

/**
 * Original function name for backward compatibility
 */
export const initializeWebGazerContainer = safeInitializeWebGazerContainer

/**
 * Pause WebGazer tracking (safe version)
 */
export function safePauseWebGazer(): void {
  safeExecute(() => {
    const wg = window.webgazer
    if (wg && typeof wg.pause === 'function') {
      wg.pause()
    }
  }, undefined, 'Error pausing')
}

/**
 * Original function name for backward compatibility
 */
export const pauseWebGazer = safePauseWebGazer

/**
 * Resume WebGazer tracking (safe version)
 */
export function safeResumeWebGazer(): void {
  safeExecute(() => {
    const wg = window.webgazer
    if (wg && typeof wg.resume === 'function') {
      wg.resume()
    }
  }, undefined, 'Error resuming')
}

/**
 * Original function name for backward compatibility
 */
export const resumeWebGazer = safeResumeWebGazer

/**
 * Clean shutdown of WebGazer (safe version)
 */
export function safeShutdownWebGazer(): void {
  safeExecute(() => {
    safeHideWebGazerUI()
    const wg = window.webgazer
    if (wg && typeof wg.end === 'function') {
      wg.end()
    }
    isWebGazerInitialized = false
  }, undefined, 'Error shutting down')
}

/**
 * Original function name for backward compatibility
 */
export const shutdownWebGazer = safeShutdownWebGazer

/**
 * Reset initialization state (for retry scenarios)
 */
export function resetWebGazerState(): void {
  isWebGazerInitialized = false
  initializationAttempts = 0
}
