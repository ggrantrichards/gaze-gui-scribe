import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useGaze } from '@/contexts/GazeContext'
import { useGazeErrorHandling } from '@/hooks/useGazeErrorHandling'
import { Calibration } from '@/components/Calibration'
import { GazeOverlay } from '@/components/GazeOverlay'
import { GazeErrorBanner } from '@/components/GazeErrorPanel'
import { InstructionPanel } from '@/components/InstructionPanel'
import { AutoSuggestionPanel } from '@/components/AutoSuggestionPanel'
import { FullPageBuilderWithProjects } from '@/components/FullPageBuilderWithProjects'
import NewPage from '@/pages/NewPage'
import { parseInstructionSmart } from '../utils/nlpParser'
import { applyIntent, captureStyles, revertStyles } from '@/utils/styleApplier'
import type { ElementLock, GazePoint } from '@/types'
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout'
import { GazeControlPanel } from '@/components/GazeControlPanel'
import { CameraPreview } from '@/components/CameraPreview'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sparkles, 
  Layout, 
  MousePointer2, 
  Plus, 
  History as HistoryIcon,
  Lightbulb,
  Target,
  Eye
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function Index() {
  // Use the centralized GazeContext instead of direct hook
  const {
    session,
    currentGaze,
    enableGaze,
    disableGaze,
    startCalibration,
    completeCalibration,
    cancelCalibration,
    pauseTracking,
    resumeTracking,
    resetCalibration,
    getElementAtGaze,
    isWebGazerLoaded,
    isLoadingCalibration
  } = useGaze()
  
  // Error handling integration
  const { recordGazeUpdate } = useGazeErrorHandling()

  const [showCalibration, setShowCalibration] = useState(false)
  const [lockedElement, setLockedElement] = useState<ElementLock | null>(null)
  const [showInstructionPanel, setShowInstructionPanel] = useState(false)
  const [lastResult, setLastResult] = useState('')
  const [history, setHistory] = useState<ElementLock[]>([])
  const [showNewPage, setShowNewPage] = useState(false)
  const [focusedEl, setFocusedEl] = useState<HTMLElement | null>(null)
  const [seedSuggestion, setSeedSuggestion] = useState<string | undefined>(undefined)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [showCameraPreview, setShowCameraPreview] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('clientsight_camera_visible')
      return raw ? JSON.parse(raw) : true
    } catch { return true }
  })
  
  // Gaze data collection for AI page builder
  const [recentGazeData, setRecentGazeData] = useState<GazePoint[]>([])
  const [showPageBuilder, setShowPageBuilder] = useState(false)
  
  const [startTime] = useState(Date.now())
  const [sessionDuration, setSessionDuration] = useState("0m 0s")

  // Update session duration
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Date.now() - startTime
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setSessionDuration(`${mins}m ${secs}s`)
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime])

  // Collect gaze data for AI optimization (keep last 100 points, throttled)
  // Use a ref to track last collection time to prevent excessive updates
  const lastGazeCollectionRef = useRef<number>(0)
  
  useEffect(() => {
    if (!currentGaze) return
    
    // Record gaze update for stale detection
    recordGazeUpdate()
    
    // Throttle collection to max 5 times per second to prevent memory issues
    const now = Date.now()
    if (now - lastGazeCollectionRef.current < 200) return
    lastGazeCollectionRef.current = now
    
    setRecentGazeData(prev => {
      // Keep last 100 points instead of 200 to reduce memory usage
      if (prev.length >= 100) {
        return [...prev.slice(-99), currentGaze]
      }
      return [...prev, currentGaze]
    })
  }, [currentGaze, recordGazeUpdate])

  // Show calibration if gaze is enabled but not calibrated
  useEffect(() => {
    if (session.isGazeEnabled && !session.isCalibrated && session.gazeStatus === 'idle') {
      setShowCalibration(true)
    }
  }, [session.isGazeEnabled, session.isCalibrated, session.gazeStatus])

  // Persist camera visibility preference
  useEffect(() => {
    try { localStorage.setItem('clientsight_camera_visible', JSON.stringify(showCameraPreview)) } catch {}
  }, [showCameraPreview])

  // Observe focused element by gaze
  useEffect(() => {
    if (!currentGaze) return
    const el = getElementAtGaze(currentGaze)
    setFocusedEl(el)
  }, [currentGaze, getElementAtGaze])

  const handleCalibrationComplete = (accuracy?: number) => {
    setShowCalibration(false)
    completeCalibration(accuracy ?? 78) // Default accuracy if not provided
  }

  const handleCalibrationSkip = () => {
    setShowCalibration(false)
    cancelCalibration()
  }

  const handleRecalibrate = () => {
    resetCalibration()
    startCalibration()
    setShowCalibration(true)
  }

  const lockGazedElement = useCallback(() => {
    if (!currentGaze) return
    const element = getElementAtGaze(currentGaze)
    if (element) {
      const r = element.getBoundingClientRect()
      const props = ['backgroundColor','color','fontSize','padding','margin','borderRadius','border','width','height']
      const lock: ElementLock = {
        id:`${element.tagName.toLowerCase()}-${Date.now()}`,
        role: element.tagName.toLowerCase(),
        bbox: { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height },
        element,
        originalStyles: captureStyles(element, props)
      }
      setLockedElement(lock)
      setShowInstructionPanel(true)
      setLastResult('')
    }
  }, [currentGaze, getElementAtGaze])

  // Hotkeys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const meta = (e.metaKey || e.ctrlKey) && e.altKey
      if (meta && key === 'g') {
        e.preventDefault()
        lockGazedElement()
      }
      if (meta && key === 'p') {
        e.preventDefault()
        setShowPageBuilder(prev => !prev)
      }
      if (meta && key === 'n') {
        e.preventDefault()
        setShowNewPage(true)
      }
      if (key === 'escape') {
        if (showInstructionPanel) {
          setShowInstructionPanel(false)
          setLockedElement(null)
        }
        if (showPageBuilder) {
          setShowPageBuilder(false)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lockGazedElement, showInstructionPanel, showPageBuilder])

  const handleInstructionSubmit = async (text: string) => {
    if (!lockedElement) return
    const intent = await parseInstructionSmart(text, lockedElement.element)
    if (!intent) { setLastResult('❌ Could not understand instruction. Try: "Make this blue".'); return }
    const result = applyIntent(lockedElement, intent)
    setLastResult(result.success ? `✅ ${result.message}` : `❌ ${result.message}`)
    if (result.success) setHistory([...history, lockedElement])
    setSeedSuggestion(undefined)
  }  

  const handleUndo = () => {
    if (!history.length) return
    const last = history[history.length - 1]
    revertStyles(last)
    setHistory(history.slice(0, -1))
  }

  const togglePause = () => {
    if (session.gazeStatus === 'idle') {
      enableGaze()
    } else if (session.gazeStatus === 'paused') {
      resumeTracking()
    } else if (session.gazeStatus === 'tracking') {
      pauseTracking()
    }
  }

  const toggleCamera = () => {
    setShowCameraPreview(v => !v)
  }

  // Error state - render with GazeErrorPanel, don't replace the whole page
  // Instead, show the error inline and allow user to continue
  // The GazeErrorBanner will also show in the bottom right corner

  // Loading calibration state - render inline
  if (isLoadingCalibration) {
    return (
      <WorkspaceLayout>
        <div className="flex flex-1 items-center justify-center bg-slate-50">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-medium text-slate-500">Loading calibration data...</p>
          </div>
        </div>
      </WorkspaceLayout>
    )
  }

  return (
    <WorkspaceLayout>
      <div className="flex flex-1 overflow-hidden relative">
        {/* Calibration flow overlay - appears on top but doesn't hide the page */}
        {(showCalibration || session.gazeStatus === 'calibrating') && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
            <Calibration onComplete={handleCalibrationComplete} onSkip={handleCalibrationSkip} />
          </div>
        )}

        {showNewPage ? (
          <div className="p-6 h-full flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6 text-slate-900">
              <h1 className="text-2xl font-bold">New Page</h1>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowNewPage(false)}>Back</Button>
                <Button onClick={handleRecalibrate}>Recalibrate</Button>
              </div>
            </div>
            <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden">
              <NewPage />
            </div>
          </div>
        ) : (
          <>
            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Workspace</h1>
                  <p className="text-sm text-slate-500">Design informed by attention data</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-100 px-3 py-1">
                    <Sparkles className="w-3 h-3 mr-1.5" />
                    Cal Hacks 12.0
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* AI Page Builder Card - Main feature like v0/bolt/lovable */}
                <Card className="border-primary-100 bg-primary-50/30 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-20 h-20 text-primary-600" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary-600" />
                      AI Page Builder
                    </CardTitle>
                    <CardDescription>Build full pages with natural language and gaze-driven optimization — like v0, Bolt, or Lovable</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="bg-primary-600 hover:bg-primary-700 shadow-sm w-full"
                      onClick={() => setShowPageBuilder(true)}
                    >
                      <Layout className="w-4 h-4 mr-2" />
                      Open Page Builder
                    </Button>
                  </CardContent>
                </Card>

                {/* Gaze Tracking Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="w-5 h-5 text-slate-600" />
                      Gaze Tracking
                    </CardTitle>
                    <CardDescription>Enable eye tracking for attention-based design insights</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {session.gazeStatus === 'idle' && !session.isGazeEnabled ? (
                      <Button 
                        className="w-full bg-primary-600 hover:bg-primary-700"
                        onClick={() => enableGaze()}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Enable Gaze Tracking
                      </Button>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={lockGazedElement} disabled={!session.isCalibrated}>
                          <Target className="w-4 h-4 mr-2" />
                          Lock Element
                        </Button>
                        <Button variant="outline" onClick={() => setShowNewPage(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          New Canvas
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* How it works info */}
              <Card className="mb-6 border-slate-200">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600">
                      <span className="font-bold">How it works:</span> Open the <span className="font-semibold text-primary-700">Page Builder</span> to create complete web pages using natural language. With gaze tracking enabled, the AI will suggest improvements based on where you look.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Keyboard shortcuts info */}
              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Keyboard Shortcuts</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <kbd className="px-2 py-1 bg-slate-100 border rounded text-xs font-mono">Alt+P</kbd>
                      <span className="text-slate-600">Page Builder</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <kbd className="px-2 py-1 bg-slate-100 border rounded text-xs font-mono">Alt+G</kbd>
                      <span className="text-slate-600">Lock Element</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <kbd className="px-2 py-1 bg-slate-100 border rounded text-xs font-mono">Alt+N</kbd>
                      <span className="text-slate-600">New Canvas</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <kbd className="px-2 py-1 bg-slate-100 border rounded text-xs font-mono">Esc</kbd>
                      <span className="text-slate-600">Close Panel</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar - Control & Suggestions */}
            <aside className="w-80 border-l bg-white flex flex-col overflow-hidden">
              <Tabs defaultValue="status" className="flex flex-col h-full">
                <div className="px-4 pt-4 border-b">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="status" className="flex-1">Status</TabsTrigger>
                    <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <TabsContent value="status" className="h-full p-4 m-0 overflow-y-auto">
                    <GazeControlPanel 
                      isCalibrated={session.isCalibrated}
                      isPaused={session.gazeStatus === 'paused'}
                      gazeStatus={session.gazeStatus}
                      onTogglePause={togglePause}
                      onRecalibrate={handleRecalibrate}
                      onUndo={handleUndo}
                      historyCount={history.length}
                      showCamera={showCameraPreview}
                      onToggleCamera={toggleCamera}
                      sessionDuration={sessionDuration}
                      dataPointsCount={session.dataPointsCount}
                      calibrationAccuracy={session.calibrationAccuracy}
                    />
                  </TabsContent>
                  
                  <TabsContent value="history" className="h-full m-0">
                    <ScrollArea className="h-full p-4">
                      {history.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center text-center text-slate-400">
                          <HistoryIcon className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-xs">No change history yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {history.map((item, idx) => (
                            <div key={idx} className="flex gap-3 relative pb-4 border-l-2 border-slate-100 ml-2 pl-4 last:border-0">
                              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-primary-500" />
                              <div className="space-y-1">
                                <p className="text-xs font-bold">{item.role}</p>
                                <p className="text-[10px] text-slate-500">Applied changes to element</p>
                              </div>
                            </div>
                          )).reverse()}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </div>
              </Tabs>
            </aside>
          </>
        )}
      </div>

      {/* Overlay & Panels */}
      <GazeOverlay gazePoint={currentGaze} lockedElement={lockedElement} />
      
      {/* Camera Preview - Only show when gaze is enabled AND not calibrating */}
      <CameraPreview 
        visible={showCameraPreview && session.isGazeEnabled && !showCalibration && session.gazeStatus !== 'calibrating'} 
        onClose={() => setShowCameraPreview(false)} 
      />

      {showSuggestions && session.isCalibrated && (
        <AutoSuggestionPanel
          visible={!!currentGaze}
          gaze={currentGaze}
          focusedEl={focusedEl}
          onPick={(s) => {
            setSeedSuggestion(s)
            lockGazedElement()
            setShowInstructionPanel(true)
          }}
        />
      )}

      {showInstructionPanel && lockedElement && (
        <InstructionPanel
          onSubmit={handleInstructionSubmit}
          onClose={()=>{ setShowInstructionPanel(false); setLockedElement(null); setSeedSuggestion(undefined) }}
          elementRole={lockedElement.role}
          lastResult={lastResult}
          seedText={seedSuggestion}
        />
      )}
      
      {/* Full Page Builder - Main feature like v0/bolt/lovable */}
      {showPageBuilder && (
        <FullPageBuilderWithProjects
          currentGaze={currentGaze}
          recentGazeData={recentGazeData}
          onClose={() => setShowPageBuilder(false)}
        />
      )}
      
      {/* Gaze Error Banner - shows at bottom right when errors occur */}
      <GazeErrorBanner />
    </WorkspaceLayout>
  )
}
