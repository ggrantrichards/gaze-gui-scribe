import React, { useEffect, useState, useCallback } from 'react'
import { useGazeTracker } from '@/hooks/useGazeTracker'
import { Calibration } from '@/components/Calibration'
import { GazeOverlay } from '@/components/GazeOverlay'
import { InstructionPanel } from '@/components/InstructionPanel'
import { AutoSuggestionPanel } from '@/components/AutoSuggestionPanel'
import NewPage from '@/pages/NewPage'
import { parseInstruction } from '@/utils/nlpParser'
import { applyIntent, captureStyles, revertStyles } from '@/utils/styleApplier'
import type { ElementLock } from '@/types'

export default function Index() {
  const {
    isInitialized, isCalibrated, currentGaze, error,
    completeCalibration, resetCalibration, pauseTracking, resumeTracking, getElementAtGaze
  } = useGazeTracker()

  const [showCalibration, setShowCalibration] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [lockedElement, setLockedElement] = useState<ElementLock | null>(null)
  const [showInstructionPanel, setShowInstructionPanel] = useState(false)
  const [lastResult, setLastResult] = useState('')
  const [history, setHistory] = useState<ElementLock[]>([])
  const [showNewPage, setShowNewPage] = useState(false)
  const [focusedEl, setFocusedEl] = useState<HTMLElement | null>(null)
  const [seedSuggestion, setSeedSuggestion] = useState<string | undefined>(undefined)
  const [showSuggestions, setShowSuggestions] = useState(true)

  useEffect(() => {
    if (isInitialized && !isCalibrated) setShowCalibration(true)
  }, [isInitialized, isCalibrated])

  // Observe focused element by gaze
  useEffect(() => {
    if (!currentGaze) return
    const el = getElementAtGaze(currentGaze)
    setFocusedEl(el)
  }, [currentGaze, getElementAtGaze])

  const handleCalibrationComplete = () => {
    setShowCalibration(false)
    completeCalibration()
  }

  const handleRecalibrate = () => {
    resetCalibration()
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

  // Hotkeys: Cmd/Ctrl+Alt+G to lock; Esc to close panel; Cmd/Ctrl+Alt+N new page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const meta = (e.metaKey || e.ctrlKey) && e.altKey
      if (meta && key === 'g') {
        e.preventDefault()
        lockGazedElement()
      }
      if (meta && key === 'n') {
        e.preventDefault()
        setShowNewPage(true)
      }
      if (key === 'escape' && showInstructionPanel) {
        setShowInstructionPanel(false)
        setLockedElement(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lockGazedElement, showInstructionPanel])

  const handleInstructionSubmit = (text: string) => {
    if (!lockedElement) return
    const intent = parseInstruction(text)
    if (!intent) { setLastResult('❌ Could not understand instruction. Try: “Make this blue”'); return }
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
    if (isPaused) resumeTracking(); else pauseTracking()
    setIsPaused(!isPaused)
  }

  if (error) {
    return <div className="container"><div className="card">Error: {error}. Grant camera permissions.</div></div>
  }
  if (!isInitialized) {
    return <div className="container"><div className="card">Initializing Clientsight…</div></div>
  }
  if (showCalibration) {
    return <Calibration onComplete={handleCalibrationComplete} onSkip={handleCalibrationComplete} />
  }
  if (showNewPage) {
    return (
      <div className="container">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <h1 style={{ fontSize:28 }}>Clientsight — New Page</h1>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn secondary" onClick={()=>setShowNewPage(false)}>Back</button>
            <button className="btn secondary" onClick={handleRecalibrate}>Recalibrate</button>
          </div>
        </div>
        <NewPage />
      </div>
    )
  }

  return (
    <div className="container">
      <h1 style={{ fontSize:32, marginBottom:8 }}>Clientsight</h1>
      <p className="muted" style={{ marginBottom:16 }}>AI-powered UI automation through gaze tracking</p>

      <div className="row" style={{ marginBottom:16 }}>
        <div className="card">
          <h2 style={{ marginTop:0 }}>Get Started</h2>
          <p className="muted">Look at any element and press <kbd>⌘/Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>G</kbd> to lock it.</p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button className="btn" onClick={lockGazedElement}>Lock gazed element</button>
            <button className="btn secondary" onClick={()=>setShowNewPage(true)}>New Page</button>
            <button className="btn secondary" onClick={handleRecalibrate}>Recalibrate</button>
          </div>
        </div>
        <div className="card">
          <h2 style={{ marginTop:0 }}>Controls</h2>
          <ul className="muted">
            <li>• <kbd>⌘/Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>G</kbd> → Lock</li>
            <li>• <kbd>⌘/Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>N</kbd> → New Page</li>
            <li>• <kbd>Esc</kbd> → Close instruction panel</li>
          </ul>
          <div style={{ marginTop:8 }}>
            <button className="btn secondary" onClick={togglePause}>{isPaused ? 'Resume' : 'Pause'} Tracking</button>
            <button className="btn secondary" onClick={handleUndo} style={{ marginLeft:8 }}>Undo ({history.length})</button>
            <span className="muted" style={{ marginLeft:12 }}>Status: {isCalibrated ? '🟢 Calibrated' : '🟡 Not calibrated'}</span>
            <label style={{ marginLeft:12, fontSize:12 }}>
              <input type="checkbox" checked={showSuggestions} onChange={e=>setShowSuggestions(e.target.checked)} /> Show suggestions
            </label>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <h3 style={{ marginTop:0 }}>How it works</h3>
        <p className="muted">Clientsight uses your webcam to track where you're looking. Lock an element and describe a change; the system applies it instantly with undo.</p>
      </div>

      <GazeOverlay gazePoint={currentGaze} lockedElement={lockedElement} />

      {showSuggestions && (
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
    </div>
  )
}
