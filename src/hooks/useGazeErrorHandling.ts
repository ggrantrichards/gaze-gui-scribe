/**
 * useGazeErrorHandling Hook
 * 
 * Provides comprehensive error handling for gaze tracking scenarios.
 * Handles camera errors, WebGazer errors, calibration issues, and stale data detection.
 * 
 * Part of AGENT_2: Gaze Tracking & Flow Engineer implementation.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useGaze } from '@/contexts/GazeContext'

export interface GazeError {
  type: 'camera' | 'webgazer' | 'calibration' | 'stale' | 'permission' | 'unknown'
  message: string
  recoverable: boolean
  action?: 'retry' | 'recalibrate' | 'settings' | 'refresh' | 'help'
  actionLabel?: string
}

/**
 * Error message mappings for different error scenarios
 */
const ERROR_MESSAGES: Record<string, GazeError> = {
  // Camera permission errors
  NotAllowedError: {
    type: 'permission',
    message: 'Camera access denied. Please enable camera permissions in your browser settings.',
    recoverable: true,
    action: 'settings',
    actionLabel: 'Open Settings'
  },
  PermissionDeniedError: {
    type: 'permission',
    message: 'Camera access denied. Please enable camera permissions in your browser settings.',
    recoverable: true,
    action: 'settings',
    actionLabel: 'Open Settings'
  },
  
  // Camera not found
  NotFoundError: {
    type: 'camera',
    message: 'No camera detected. Please connect a webcam and try again.',
    recoverable: true,
    action: 'retry',
    actionLabel: 'Try Again'
  },
  DevicesNotFoundError: {
    type: 'camera',
    message: 'No camera detected. Please connect a webcam and try again.',
    recoverable: true,
    action: 'retry',
    actionLabel: 'Try Again'
  },
  
  // Camera in use
  NotReadableError: {
    type: 'camera',
    message: 'Camera is in use by another application. Please close other apps using the camera.',
    recoverable: true,
    action: 'retry',
    actionLabel: 'Try Again'
  },
  TrackStartError: {
    type: 'camera',
    message: 'Could not start camera. Please ensure no other app is using it.',
    recoverable: true,
    action: 'retry',
    actionLabel: 'Try Again'
  },
  
  // WebGazer specific
  WebGazerNotAvailable: {
    type: 'webgazer',
    message: 'Gaze tracking library failed to load. Please refresh the page.',
    recoverable: true,
    action: 'refresh',
    actionLabel: 'Refresh Page'
  },
  WebGazerInitFailed: {
    type: 'webgazer',
    message: 'Gaze tracking failed to initialize. Try using Chrome or Firefox.',
    recoverable: true,
    action: 'refresh',
    actionLabel: 'Refresh Page'
  },
  
  // Calibration errors
  CalibrationAborted: {
    type: 'calibration',
    message: 'Calibration was cancelled. You can restart calibration anytime.',
    recoverable: true,
    action: 'recalibrate',
    actionLabel: 'Start Calibration'
  },
  CalibrationLowAccuracy: {
    type: 'calibration',
    message: 'Calibration accuracy is low. Please try again in better lighting.',
    recoverable: true,
    action: 'recalibrate',
    actionLabel: 'Recalibrate'
  },
  
  // Stale data
  StaleData: {
    type: 'stale',
    message: 'Gaze tracking lost. Please check your camera and lighting.',
    recoverable: true,
    action: 'retry',
    actionLabel: 'Resume Tracking'
  },
  
  // Generic fallback
  Unknown: {
    type: 'unknown',
    message: 'An unexpected error occurred with gaze tracking.',
    recoverable: true,
    action: 'refresh',
    actionLabel: 'Refresh Page'
  }
}

// Stale data threshold in milliseconds
// Disabled by default (set to 5 minutes) to prevent false positives during normal use
// The user can look away, move their head, etc. without triggering disconnection
// Only truly lost connections (camera unplugged, browser tab hidden) should trigger this
const STALE_THRESHOLD_MS = 300000 // 5 minutes - effectively disabled

/**
 * Hook for handling gaze tracking errors
 */
export function useGazeErrorHandling() {
  const { session, setError, clearError, disableGaze, pauseTracking, enableGaze, startCalibration } = useGaze()
  
  // Track last gaze update time for stale detection
  const lastGazeUpdateRef = useRef<number>(Date.now())
  const staleCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  /**
   * Parse an error and return structured error info
   */
  const parseError = useCallback((error: any): GazeError => {
    if (!error) return ERROR_MESSAGES.Unknown
    
    // Check for known error names
    const errorName = error.name || error.code || ''
    if (ERROR_MESSAGES[errorName]) {
      return ERROR_MESSAGES[errorName]
    }
    
    // Check error message for clues
    const message = error.message?.toLowerCase() || ''
    
    if (message.includes('permission') || message.includes('denied')) {
      return ERROR_MESSAGES.NotAllowedError
    }
    if (message.includes('not found') || message.includes('no camera')) {
      return ERROR_MESSAGES.NotFoundError
    }
    if (message.includes('in use') || message.includes('not readable')) {
      return ERROR_MESSAGES.NotReadableError
    }
    if (message.includes('webgazer')) {
      return ERROR_MESSAGES.WebGazerInitFailed
    }
    if (message.includes('calibration')) {
      return ERROR_MESSAGES.CalibrationAborted
    }
    
    return {
      ...ERROR_MESSAGES.Unknown,
      message: error.message || ERROR_MESSAGES.Unknown.message
    }
  }, [])
  
  /**
   * Handle camera-related errors
   */
  const handleCameraError = useCallback((error: any) => {
    console.error('[useGazeErrorHandling] Camera error:', error)
    const gazeError = parseError(error)
    setError(gazeError.message)
  }, [parseError, setError])
  
  /**
   * Handle WebGazer initialization errors
   */
  const handleWebGazerError = useCallback((error: any) => {
    console.error('[useGazeErrorHandling] WebGazer error:', error)
    const gazeError = parseError(error)
    setError(gazeError.message)
  }, [parseError, setError])
  
  /**
   * Handle calibration errors
   */
  const handleCalibrationError = useCallback((error: any) => {
    console.error('[useGazeErrorHandling] Calibration error:', error)
    
    if (error?.type === 'low_accuracy') {
      setError(ERROR_MESSAGES.CalibrationLowAccuracy.message)
    } else if (error?.type === 'aborted') {
      setError(ERROR_MESSAGES.CalibrationAborted.message)
    } else {
      const gazeError = parseError(error)
      setError(gazeError.message)
    }
  }, [parseError, setError])
  
  /**
   * Handle stale data (no updates for threshold duration)
   */
  const handleStaleData = useCallback(() => {
    console.warn('[useGazeErrorHandling] Gaze data is stale')
    pauseTracking()
    setError(ERROR_MESSAGES.StaleData.message)
  }, [pauseTracking, setError])
  
  /**
   * Update last gaze timestamp (call this from gaze listener)
   */
  const recordGazeUpdate = useCallback(() => {
    lastGazeUpdateRef.current = Date.now()
  }, [])
  
  /**
   * Get recovery action for current error
   */
  const getRecoveryAction = useCallback((errorMessage: string): (() => void) | null => {
    // Find matching error
    const matchingError = Object.values(ERROR_MESSAGES).find(
      e => e.message === errorMessage
    )
    
    if (!matchingError) return null
    
    switch (matchingError.action) {
      case 'retry':
        return () => {
          clearError()
          enableGaze()
        }
      case 'recalibrate':
        return () => {
          clearError()
          startCalibration()
        }
      case 'settings':
        return () => {
          // Open browser settings - this is browser-specific
          if (navigator.userAgent.includes('Chrome')) {
            window.open('chrome://settings/content/camera', '_blank')
          } else {
            // Generic fallback - show instructions
            alert('Please enable camera access in your browser settings:\n\n' +
              '1. Click the camera icon in the address bar\n' +
              '2. Select "Allow" for camera access\n' +
              '3. Refresh this page')
          }
        }
      case 'refresh':
        return () => {
          window.location.reload()
        }
      case 'help':
        return () => {
          // Could open a help modal or documentation
          window.open('https://support.google.com/chrome/answer/2693767', '_blank')
        }
      default:
        return null
    }
  }, [clearError, enableGaze, startCalibration])
  
  /**
   * Get error details for current session error
   */
  const getErrorDetails = useCallback((): GazeError | null => {
    if (!session.error) return null
    
    // Find matching error by message
    const matchingError = Object.values(ERROR_MESSAGES).find(
      e => e.message === session.error
    )
    
    return matchingError || {
      type: 'unknown',
      message: session.error,
      recoverable: true,
      action: 'retry',
      actionLabel: 'Try Again'
    }
  }, [session.error])
  
  // Start stale data detection when tracking
  useEffect(() => {
    if (session.gazeStatus === 'tracking') {
      // Clear any existing interval
      if (staleCheckIntervalRef.current) {
        clearInterval(staleCheckIntervalRef.current)
      }
      
      // Reset last update time
      lastGazeUpdateRef.current = Date.now()
      
      // Start checking for stale data
      staleCheckIntervalRef.current = setInterval(() => {
        const timeSinceLastUpdate = Date.now() - lastGazeUpdateRef.current
        if (timeSinceLastUpdate > STALE_THRESHOLD_MS) {
          handleStaleData()
        }
      }, 1000) // Check every second
    } else {
      // Stop checking when not tracking
      if (staleCheckIntervalRef.current) {
        clearInterval(staleCheckIntervalRef.current)
        staleCheckIntervalRef.current = null
      }
    }
    
    return () => {
      if (staleCheckIntervalRef.current) {
        clearInterval(staleCheckIntervalRef.current)
      }
    }
  }, [session.gazeStatus, handleStaleData])
  
  return {
    // Error handlers
    handleCameraError,
    handleWebGazerError,
    handleCalibrationError,
    handleStaleData,
    
    // Utilities
    parseError,
    recordGazeUpdate,
    getRecoveryAction,
    getErrorDetails,
    
    // Constants
    ERROR_MESSAGES,
    STALE_THRESHOLD_MS
  }
}

export default useGazeErrorHandling

