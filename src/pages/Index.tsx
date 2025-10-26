import React, { useEffect, useState, useCallback } from 'react'
import { useGazeTracker } from '@/hooks/useGazeTracker'
import { Calibration } from '@/components/Calibration'
import { GazeOverlay } from '@/components/GazeOverlay'
import { InstructionPanel } from '@/components/InstructionPanel'
import { AutoSuggestionPanel } from '@/components/AutoSuggestionPanel'
import { ComponentGenerationPanel } from '@/components/ComponentGenerationPanel'
import { LiveComponentPreview } from '@/components/LiveComponentPreview'
import { FullPageBuilderWithProjects } from '@/components/FullPageBuilderWithProjects'
import NewPage from '@/pages/NewPage'
import { parseInstruction } from '@/utils/nlpParser'
import { parseInstructionSmart } from '../utils/nlpParser'
import { applyIntent, captureStyles, revertStyles } from '@/utils/styleApplier'
import type { ElementLock, ComponentNode, GazePoint } from '@/types'

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
  
  // NEW: AI Component Generation (Cal Hacks 12.0 - Fetch.ai integration)
  const [showComponentPanel, setShowComponentPanel] = useState(false)
  const [generatedComponents, setGeneratedComponents] = useState<ComponentNode[]>([])
  const [recentGazeData, setRecentGazeData] = useState<GazePoint[]>([])
  const [previewComponent, setPreviewComponent] = useState<ComponentNode | null>(null)
  const [showPageBuilder, setShowPageBuilder] = useState(false)
  
  // Collect gaze data for AI optimization (keep last 200 points)
  useEffect(() => {
    if (currentGaze) {
      setRecentGazeData(prev => {
        const newData = [...prev, currentGaze]
        return newData.slice(-200) // Keep last 200 points
      })
    }
  }, [currentGaze])

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

  // Hotkeys: Cmd/Ctrl+Alt+G to lock; Cmd/Ctrl+Alt+C to create; Cmd/Ctrl+Alt+P for Page Builder; Esc to close panel; Cmd/Ctrl+Alt+N new page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const meta = (e.metaKey || e.ctrlKey) && e.altKey
      if (meta && key === 'g') {
        e.preventDefault()
        lockGazedElement()
      }
      if (meta && key === 'c') {
        e.preventDefault()
        setShowComponentPanel(prev => !prev)
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
        if (showComponentPanel) {
          setShowComponentPanel(false)
        }
        if (showPageBuilder) {
          setShowPageBuilder(false)
        }
        if (previewComponent) {
          setPreviewComponent(null)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lockGazedElement, showInstructionPanel, showComponentPanel, showPageBuilder, previewComponent])
  
  const handleComponentGenerated = useCallback((component: ComponentNode) => {
    setGeneratedComponents(prev => [...prev, component])
    console.log('Component generated:', component)
    
    // Auto-open live preview for newly generated component
    setTimeout(() => {
      setPreviewComponent(component)
    }, 500) // Small delay for smooth transition
  }, [])

  const handleInstructionSubmit = async (text: string) => {
    if (!lockedElement) return
    const intent = await parseInstructionSmart(text, lockedElement.element)
    if (!intent) { setLastResult('❌ Could not understand instruction. Try: “Make this blue”.'); return }
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
      <h1 style={{ fontSize:32, marginBottom:8 }}>
        Clientsight <span style={{ fontSize:14, color:'#8b5cf6', fontWeight:500 }}>Cal Hacks 12.0</span>
      </h1>
      <p className="muted" style={{ marginBottom:16 }}>AI-powered UI generation with gaze tracking (Powered by Fetch.ai)</p>

      <div className="row" style={{ marginBottom:16 }}>
        <div className="card">
          <h2 style={{ marginTop:0 }}>🚀 AI Generation (NEW)</h2>
          <p className="muted">Build full pages like v0/Bolt.new with gaze-driven optimization</p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button 
              className="btn" 
              style={{ background: '#3b82f6', borderColor: '#3b82f6' }}
              onClick={() => setShowPageBuilder(true)}
            >
              🏗️ Page Builder
            </button>
            <button 
              className="btn" 
              style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}
              onClick={() => setShowComponentPanel(true)}
            >
              ✨ Generate Component
            </button>
            <button className="btn secondary" onClick={lockGazedElement}>Lock Element (Gaze)</button>
            <button className="btn secondary" onClick={()=>setShowNewPage(true)}>New Page</button>
          </div>
          {generatedComponents.length > 0 && (
            <p className="muted" style={{ marginTop:8, fontSize:12 }}>
              Generated {generatedComponents.length} component(s) | {recentGazeData.length} gaze points tracked
            </p>
          )}
        </div>
        <div className="card">
          <h2 style={{ marginTop:0 }}>Controls</h2>
          <ul className="muted">
            <li>• <kbd>⌘/Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>P</kbd> → Page Builder</li>
            <li>• <kbd>⌘/Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>C</kbd> → AI Generate</li>
            <li>• <kbd>⌘/Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>G</kbd> → Lock Element</li>
            <li>• <kbd>⌘/Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>N</kbd> → New Page</li>
            <li>• <kbd>Esc</kbd> → Close panels</li>
          </ul>
          <div style={{ marginTop:8 }}>
            <button className="btn secondary" onClick={togglePause}>{isPaused ? 'Resume' : 'Pause'} Tracking</button>
            <button className="btn secondary" onClick={handleUndo} style={{ marginLeft:8 }}>Undo ({history.length})</button>
            <button className="btn secondary" onClick={handleRecalibrate} style={{ marginLeft:8 }}>Recalibrate</button>
            <span className="muted" style={{ marginLeft:12 }}>Status: {isCalibrated ? '🟢 Calibrated' : '🟡 Not calibrated'}</span>
            <label style={{ marginLeft:12, fontSize:12 }}>
              <input type="checkbox" checked={showSuggestions} onChange={e=>setShowSuggestions(e.target.checked)} /> Show suggestions
            </label>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <h3 style={{ marginTop:0 }}>How it works</h3>
        <p className="muted">Clientsight combines AI component generation (Fetch.ai agents) with webcam-based gaze tracking. Generate components from text, then optimize them based on where users actually look.</p>
        <div style={{ marginTop:8, padding:8, background:'#8b5cf6', borderRadius:8, color:'white' }}>
          <strong>Cal Hacks 12.0 Demo:</strong> Generate a component → Track your gaze → Get AI optimization suggestions
        </div>
      </div>
      
      {/* Display Generated Components */}
      {generatedComponents.length > 0 && (
        <div className="card" style={{ marginBottom:16 }}>
          <h3 style={{ marginTop:0 }}>Generated Components ({generatedComponents.length})</h3>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            {generatedComponents.map((comp) => (
              <div key={comp.id} className="card" style={{ flex:'1', minWidth:250, background:'#1a1a2e' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <strong style={{ color:'#8b5cf6' }}>{comp.name}</strong>
                  <span className="muted" style={{ fontSize:10 }}>
                    {comp.agentType === 'component-generator' && '🤖 Fetch.ai Agent'}
                  </span>
                </div>
                <pre style={{ fontSize:10, overflow:'auto', maxHeight:100, background:'#0f0f1e', padding:8, borderRadius:4 }}>
                  <code>{comp.code.slice(0, 150)}...</code>
                </pre>
                <div style={{ marginTop:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:10, color:'#6b7280' }}>
                    {new Date(comp.createdAt).toLocaleTimeString()}
                  </div>
                  <button
                    onClick={() => setPreviewComponent(comp)}
                    className="btn"
                    style={{ 
                      fontSize:11, 
                      padding:'4px 12px',
                      background:'#8b5cf6',
                      borderColor:'#8b5cf6'
                    }}
                  >
                    👁️ View Live
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
      
      {/* NEW: AI Component Generation Panel (Cal Hacks 12.0) */}
      <ComponentGenerationPanel
        visible={showComponentPanel}
        onClose={() => setShowComponentPanel(false)}
        onComponentGenerated={handleComponentGenerated}
        recentGazeData={recentGazeData}
      />
      
      {/* Live Component Preview Modal */}
      {previewComponent && (
        <LiveComponentPreview
          component={previewComponent}
          onClose={() => setPreviewComponent(null)}
        />
      )}
      
      {/* Full Page Builder (v0/Bolt.new style) with Project Management */}
      {showPageBuilder && (
        <FullPageBuilderWithProjects
          currentGaze={currentGaze}
          recentGazeData={recentGazeData}
          onClose={() => setShowPageBuilder(false)}
        />
      )}
    </div>
  )
}
