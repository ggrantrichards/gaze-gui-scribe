/**
 * GazeErrorPanel Component
 * 
 * Displays user-friendly error messages for gaze tracking issues
 * with actionable recovery options.
 * 
 * Part of AGENT_2: Gaze Tracking & Flow Engineer implementation.
 */

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  Camera, 
  RefreshCw, 
  Settings, 
  Target,
  HelpCircle,
  Eye,
  XCircle
} from 'lucide-react'
import { useGaze } from '@/contexts/GazeContext'
import { useGazeErrorHandling, GazeError } from '@/hooks/useGazeErrorHandling'

interface GazeErrorPanelProps {
  className?: string
  compact?: boolean
  onDismiss?: () => void
}

/**
 * Get icon for error type
 */
function getErrorIcon(type: GazeError['type']) {
  switch (type) {
    case 'camera':
      return <Camera className="w-5 h-5" />
    case 'permission':
      return <Settings className="w-5 h-5" />
    case 'calibration':
      return <Target className="w-5 h-5" />
    case 'stale':
      return <Eye className="w-5 h-5" />
    case 'webgazer':
      return <RefreshCw className="w-5 h-5" />
    default:
      return <AlertTriangle className="w-5 h-5" />
  }
}

/**
 * Get action button icon
 */
function getActionIcon(action?: string) {
  switch (action) {
    case 'retry':
      return <RefreshCw className="w-4 h-4" />
    case 'recalibrate':
      return <Target className="w-4 h-4" />
    case 'settings':
      return <Settings className="w-4 h-4" />
    case 'refresh':
      return <RefreshCw className="w-4 h-4" />
    case 'help':
      return <HelpCircle className="w-4 h-4" />
    default:
      return null
  }
}

/**
 * Troubleshooting tips for common issues
 */
const TROUBLESHOOTING_TIPS: Record<GazeError['type'], string[]> = {
  camera: [
    'Ensure your webcam is properly connected',
    'Close other apps that might be using the camera',
    'Try unplugging and reconnecting your webcam'
  ],
  permission: [
    'Click the camera icon in your browser\'s address bar',
    'Select "Allow" to grant camera access',
    'Refresh the page after enabling permissions'
  ],
  calibration: [
    'Ensure good lighting on your face',
    'Position yourself about arm\'s length from the screen',
    'Keep your head steady during calibration',
    'Look directly at each calibration point'
  ],
  stale: [
    'Check that your face is visible to the camera',
    'Improve lighting in your environment',
    'Clean your webcam lens if needed',
    'Move closer to the camera if you\'re too far'
  ],
  webgazer: [
    'Try using Chrome or Firefox for best compatibility',
    'Disable any ad blockers or privacy extensions temporarily',
    'Clear your browser cache and try again'
  ],
  unknown: [
    'Try refreshing the page',
    'Clear your browser cache',
    'Try a different browser'
  ]
}

export function GazeErrorPanel({ className = '', compact = false, onDismiss }: GazeErrorPanelProps) {
  const { session, clearError } = useGaze()
  const { getErrorDetails, getRecoveryAction } = useGazeErrorHandling()
  
  const errorDetails = getErrorDetails()
  const recoveryAction = session.error ? getRecoveryAction(session.error) : null
  
  // Don't render if no error
  if (!session.error || !errorDetails) {
    return null
  }
  
  const tips = TROUBLESHOOTING_TIPS[errorDetails.type] || TROUBLESHOOTING_TIPS.unknown
  
  // Handle dismiss
  const handleDismiss = () => {
    clearError()
    onDismiss?.()
  }
  
  // Compact version for inline display
  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex-shrink-0 text-red-600">
          {getErrorIcon(errorDetails.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800 truncate">
            {errorDetails.message}
          </p>
        </div>
        <div className="flex-shrink-0 flex gap-2">
          {recoveryAction && (
            <Button 
              size="sm" 
              variant="outline"
              className="text-red-700 border-red-300 hover:bg-red-100"
              onClick={recoveryAction}
            >
              {getActionIcon(errorDetails.action)}
              <span className="ml-1">{errorDetails.actionLabel}</span>
            </Button>
          )}
          <Button 
            size="sm" 
            variant="ghost"
            className="text-red-600 hover:bg-red-100"
            onClick={handleDismiss}
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }
  
  // Full panel version
  return (
    <Card className={`border-red-200 bg-red-50/50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-3 text-red-800">
          <div className="p-2 bg-red-100 rounded-lg text-red-600">
            {getErrorIcon(errorDetails.type)}
          </div>
          Gaze Tracking Issue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Message */}
        <p className="text-sm text-red-700 font-medium">
          {errorDetails.message}
        </p>
        
        {/* Troubleshooting Tips */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Troubleshooting Tips
          </p>
          <ul className="text-sm text-slate-600 space-y-1">
            {tips.slice(0, 3).map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {recoveryAction && (
            <Button 
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={recoveryAction}
            >
              {getActionIcon(errorDetails.action)}
              <span className="ml-2">{errorDetails.actionLabel}</span>
            </Button>
          )}
          <Button 
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
            onClick={handleDismiss}
          >
            Dismiss
          </Button>
        </div>
        
        {/* Help Link */}
        <div className="pt-2 border-t border-red-200">
          <button 
            className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
            onClick={() => window.open('https://webgazer.cs.brown.edu/', '_blank')}
          >
            <HelpCircle className="w-3 h-3" />
            Learn more about gaze tracking requirements
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Inline error banner for minimal UI impact
 */
export function GazeErrorBanner({ className = '' }: { className?: string }) {
  const { session, clearError } = useGaze()
  const { getErrorDetails, getRecoveryAction } = useGazeErrorHandling()
  
  const errorDetails = getErrorDetails()
  const recoveryAction = session.error ? getRecoveryAction(session.error) : null
  
  if (!session.error || !errorDetails) {
    return null
  }
  
  return (
    <div className={`fixed bottom-4 right-4 max-w-md z-50 animate-in slide-in-from-bottom-4 ${className}`}>
      <div className="flex items-center gap-3 p-4 bg-white border border-red-200 rounded-lg shadow-lg">
        <div className="flex-shrink-0 p-2 bg-red-100 rounded-full text-red-600">
          {getErrorIcon(errorDetails.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900">
            Gaze Tracking Issue
          </p>
          <p className="text-xs text-slate-600 mt-0.5 truncate">
            {errorDetails.message}
          </p>
        </div>
        <div className="flex-shrink-0 flex gap-2">
          {recoveryAction && (
            <Button 
              size="sm" 
              onClick={recoveryAction}
            >
              {errorDetails.actionLabel}
            </Button>
          )}
          <Button 
            size="sm" 
            variant="ghost"
            onClick={clearError}
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default GazeErrorPanel

