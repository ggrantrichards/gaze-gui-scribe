import React, { useEffect, useState, useCallback } from 'react'
import { useGazeTracker } from '@/hooks/useGazeTracker'
import { Calibration } from '@/components/Calibration'
import { GazeOverlay } from '@/components/GazeOverlay'
import { InstructionPanel } from '@/components/InstructionPanel'
import { parseInstruction } from '@/utils/nlpParser'
import { applyIntent, captureStyles, revertStyles } from '@/utils/styleApplier'
import type { ElementLock } from '@/types'

export default function Index() {
  const { isInitialized, isCalibrated, currentGaze, error, completeCalibration, pauseTracking, resumeTracking } = useGazeTracker()
  const [showCalibration, setShowCalibration] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [lockedElement, setLockedElement] = useState<ElementLock | null>(null)
  const [showInstructionPanel, setShowInstructionPanel] = useState(false)
  const [lastResult, setLastResult] = useState('')
  const [history, setHistory] = useState<ElementLock[]>([])

  useEffect(() => {
    if (isInitialized && !isCalibrated) setShowCalibration(true)
  }, [isInitialized, isCalibrated])

  const handleCalibrationComplete = () => {
    setShowCalibration(false)
    completeCalibration()
  }
  const handleSkipCalibration = handleCalibrationComplete

  const getElementAtGaze = useCallback((): HTMLElement | null => {
    if (!currentGaze) return null
    const els = document.elementsFromPoint(currentGaze.x, currentGaze.y) as HTMLElement[]
    return els.find(el => {
      const zi = getComputedStyle(el).zIndex
      return !['9999','9998','9997'].includes(zi) && el.tagName !== 'HTML' && el.tagName !== 'BODY'
    }) || null
  }, [currentGaze])

  // Hotkeys: Cmd/Ctrl+Alt+G to lock; Esc to close panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        const element = getElementAtGaze()
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
      }
      if (e.key === 'Escape' && showInstructionPanel) {
        setShowInstructionPanel(false)
        setLockedElement(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [getElementAtGaze, showInstructionPanel])

  const handleInstructionSubmit = (text: string) => {
    if (!lockedElement) return
    const intent = parseInstruction(text)
    if (!intent) { setLastResult('❌ Could not understand instruction. Try: “Make this blue”'); return }
    const result = applyIntent(lockedElement, intent)
    setLastResult(result.success ? `✅ ${result.message}` : `❌ ${result.message}`)
    if (result.success) setHistory([...history, lockedElement])
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
    return <Calibration onComplete={handleCalibrationComplete} onSkip={handleSkipCalibration} />
  }

  return (
    <div className="container">
      <h1 style={{ fontSize:32, marginBottom:8 }}>Clientsight</h1>
      <p className="muted" style={{ marginBottom:16 }}>AI-powered UI automation through gaze tracking</p>

      <div className="row" style={{ marginBottom:16 }}>
        <div className="card">
          <h2 style={{ marginTop:0 }}>Get Started</h2>
          <p className="muted">Look at any element and press <kbd>⌘/Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>G</kbd> to lock it.</p>
          <button className="btn" onClick={()=>{}}>Try changing this button</button>
        </div>
        <div className="card">
          <h2 style={{ marginTop:0 }}>Example Commands</h2>
          <ul className="muted">
            <li>• Make this blue</li>
            <li>• Add rounded corners</li>
            <li>• Change font size to 20px</li>
            <li>• Increase padding by 8</li>
            <li>• Change text to 'Hello'</li>
          </ul>
          <div style={{ marginTop:8 }}>
            <button className="btn secondary" onClick={togglePause}>{isPaused ? 'Resume' : 'Pause'} Tracking</button>
            <button className="btn secondary" onClick={handleUndo} style={{ marginLeft:8 }}>Undo ({history.length})</button>
            <span className="muted" style={{ marginLeft:12 }}>Status: {isCalibrated ? '🟢 Calibrated' : '🟡 Not calibrated'}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <h3 style={{ marginTop:0 }}>How it works</h3>
        <p className="muted">Clientsight uses your webcam to track where you're looking. Lock an element and describe a change; the system applies it instantly with undo.</p>
      </div>

      <GazeOverlay gazePoint={currentGaze} lockedElement={lockedElement} />

      {showInstructionPanel && lockedElement && (
        <InstructionPanel
          onSubmit={handleInstructionSubmit}
          onClose={()=>{ setShowInstructionPanel(false); setLockedElement(null) }}
          elementRole={lockedElement.role}
          lastResult={lastResult}
        />
      )}
    </div>
  )
}
