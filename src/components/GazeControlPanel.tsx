import React from 'react'
import { 
  Play, 
  Pause, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Activity,
  Target,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { GazeStatus } from '@/types'

interface GazeControlPanelProps {
  isCalibrated: boolean
  isPaused: boolean
  gazeStatus?: GazeStatus
  onTogglePause: () => void
  onRecalibrate: () => void
  onUndo: () => void
  historyCount: number
  showCamera: boolean
  onToggleCamera: () => void
  sessionDuration?: string
  dataPointsCount?: number
  calibrationAccuracy?: number
}

/**
 * Get status badge styling based on gaze status
 */
function getStatusBadge(gazeStatus: GazeStatus | undefined, isCalibrated: boolean) {
  if (!gazeStatus || gazeStatus === 'idle') {
    return {
      variant: 'secondary' as const,
      className: '',
      text: isCalibrated ? 'Idle' : 'Not Calibrated'
    }
  }
  
  switch (gazeStatus) {
    case 'calibrating':
      return { variant: 'default' as const, className: 'bg-yellow-500 hover:bg-yellow-500/90', text: 'Calibrating' }
    case 'tracking':
      return { variant: 'default' as const, className: 'bg-success hover:bg-success/90', text: 'Tracking' }
    case 'paused':
      return { variant: 'default' as const, className: 'bg-orange-500 hover:bg-orange-500/90', text: 'Paused' }
    case 'error':
      return { variant: 'destructive' as const, className: '', text: 'Error' }
    default:
      return { variant: 'secondary' as const, className: '', text: 'Unknown' }
  }
}

export function GazeControlPanel({
  isCalibrated,
  isPaused,
  gazeStatus,
  onTogglePause,
  onRecalibrate,
  onUndo,
  historyCount,
  showCamera,
  onToggleCamera,
  sessionDuration = "0m 0s",
  dataPointsCount = 0,
  calibrationAccuracy
}: GazeControlPanelProps) {
  const statusBadge = getStatusBadge(gazeStatus, isCalibrated)
  const canTogglePause = gazeStatus === 'tracking' || gazeStatus === 'paused'
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            Gaze Status
            <Badge variant={statusBadge.variant} className={statusBadge.className}>
              {statusBadge.text}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Duration</p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {sessionDuration}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Data Points</p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                {dataPointsCount.toLocaleString()}
              </div>
            </div>
          </div>
          
          {/* Calibration accuracy info */}
          {calibrationAccuracy !== undefined && (
            <div className="p-2 bg-slate-50 rounded-md">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Accuracy</p>
              <p className="text-xs font-medium text-slate-700">±{calibrationAccuracy}px</p>
            </div>
          )}
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-2">
            {gazeStatus === 'idle' ? (
              <Button 
                variant="default" 
                size="sm" 
                className="col-span-2 bg-primary-600 hover:bg-primary-700 gap-2"
                onClick={onTogglePause} // In Index.tsx, togglePause handles enable if needed? No, wait.
              >
                <Play className="w-3.5 h-3.5" />
                Enable Gaze Tracking
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start gap-2"
                onClick={onTogglePause}
                disabled={!canTogglePause}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start gap-2"
              onClick={onRecalibrate}
            >
              <Target className="w-3.5 h-3.5" />
              Recalibrate
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start gap-2"
              onClick={onToggleCamera}
            >
              {showCamera ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showCamera ? "Hide Cam" : "Show Cam"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start gap-2"
              onClick={onUndo}
              disabled={historyCount === 0}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Undo ({historyCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Lock Element</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-[10px] font-mono">Alt+G</kbd>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Page Builder</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-[10px] font-mono">Alt+P</kbd>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">New Canvas</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-[10px] font-mono">Alt+N</kbd>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

