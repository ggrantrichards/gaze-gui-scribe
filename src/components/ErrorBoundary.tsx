/**
 * Error Boundary Component
 * 
 * Catches React errors and displays a fallback UI instead of crashing the entire app.
 * This is critical for preventing blank screens when WebGazer or other components fail.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    
    this.setState({ errorInfo })
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo)
    
    // Try to clean up WebGazer if it might be the cause
    try {
      if (window.webgazer) {
        window.webgazer.pause()
        window.webgazer.showVideoPreview(false)
        window.webgazer.showFaceOverlay(false)
        window.webgazer.showFaceFeedbackBox(false)
      }
    } catch (e) {
      console.warn('[ErrorBoundary] Failed to clean up WebGazer:', e)
    }
  }

  handleReset = () => {
    // Clear any problematic local storage
    try {
      localStorage.removeItem('clientsight_calibration_v2')
    } catch {}
    
    // Reset state
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleRefresh = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
          <Card className="max-w-lg w-full shadow-xl border-red-200">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred. This might be related to gaze tracking or camera access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="p-3 bg-slate-100 rounded-lg">
                  <p className="text-sm font-mono text-slate-700 break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={this.handleReset}
                  className="w-full gap-2"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleRefresh}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  className="w-full gap-2"
                  variant="ghost"
                >
                  <Home className="w-4 h-4" />
                  Go to Home
                </Button>
              </div>

              <p className="text-xs text-slate-500 text-center">
                If this problem persists, try clearing your browser cache or using a different browser.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Gaze-specific error boundary with targeted recovery
 */
export class GazeErrorBoundary extends ErrorBoundary {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GazeErrorBoundary] Caught gaze-related error:', error)
    
    // Stop WebGazer completely on error
    try {
      if (window.webgazer) {
        window.webgazer.end()
      }
      
      // Remove WebGazer elements from DOM
      const container = document.getElementById('webgazerVideoContainer')
      if (container) {
        container.remove()
      }
    } catch (e) {
      console.warn('[GazeErrorBoundary] Failed to clean up WebGazer:', e)
    }
    
    super.componentDidCatch(error, errorInfo)
  }
}

// Declare global Window interface for WebGazer
declare global {
  interface Window {
    webgazer?: any
  }
}

