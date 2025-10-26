// import React, { useMemo, useRef, useState } from 'react'
// import { useGazeTracker } from '@/hooks/useGazeTracker'
// import type { GazePoint } from '@/types'

// type NodeKind = 'button' | 'input' | 'card' | 'text'

// type NodeDef = {
//   id: string
//   kind: NodeKind
//   x: number
//   y: number
//   props?: Record<string, any>
// }

// function makeNode(kind: NodeKind, at: GazePoint, prompt: string): NodeDef {
//   const id = `${kind}-${Date.now()}`
//   switch (kind) {
//     case 'button': return { id, kind, x: at.x, y: at.y, props: { text: /text to ['"](.+?)['"]/.test(prompt) ? /text to ['"](.+?)['"]/.exec(prompt)![1] : 'Button' } }
//     case 'input':  return { id, kind, x: at.x, y: at.y, props: { placeholder: /placeholder to ['"](.+?)['"]/.test(prompt) ? /placeholder to ['"](.+?)['"]/.exec(prompt)![1] : 'Type...' } }
//     case 'card':   return { id, kind, x: at.x, y: at.y, props: { title: 'Card', body: 'Lorem ipsum' } }
//     default:       return { id, kind: 'text', x: at.x, y: at.y, props: { value: prompt || 'Text' } }
//   }
// }

// export default function NewPage() {
//   const { currentGaze } = useGazeTracker()
//   const [prompt, setPrompt] = useState("Add a login form here")
//   const [nodes, setNodes] = useState<NodeDef[]>([])
//   const canvasRef = useRef<HTMLDivElement>(null)

//   const handleAdd = (kind: NodeKind) => {
//     if (!currentGaze) return
//     const node = makeNode(kind, currentGaze, prompt)
//     setNodes(prev => [...prev, node])
//   }

//   const canvasBounds = useMemo(() => canvasRef.current?.getBoundingClientRect(), [nodes.length])

//   return (
//     <div className="container">
//       <h2 style={{ marginBottom:8 }}>New Page (Vision-Prompt Generator)</h2>
//       <div className="card" style={{ marginBottom:12 }}>
//         <div style={{ display:'flex', gap:8, alignItems:'center' }}>
//           <input
//             value={prompt}
//             onChange={e=>setPrompt(e.target.value)}
//             placeholder="Describe what to add… e.g., 'Add a form here'"
//             style={{ flex:1, padding:10, borderRadius:8, border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0' }}
//           />
//           <button className="btn" onClick={()=>handleAdd('card')}>Add Card</button>
//           <button className="btn" onClick={()=>handleAdd('input')}>Add Input</button>
//           <button className="btn" onClick={()=>handleAdd('button')}>Add Button</button>
//           <button className="btn" onClick={()=>handleAdd('text')}>Add Text</button>
//         </div>
//         <div className="muted" style={{ marginTop:6 }}>Elements are placed at your current gaze point.</div>
//       </div>

//       <div ref={canvasRef} className="card" style={{ position:'relative', height: '70vh', overflow:'hidden' }}>
//         {nodes.map(n => (
//           <div key={n.id} style={{
//             position:'absolute',
//             left: Math.max(8, Math.min((n.x - (canvasBounds?.left ?? 0)) - 40, (canvasBounds?.width ?? 0) - 80)),
//             top: Math.max(8, Math.min((n.y - (canvasBounds?.top ?? 0)) - 16, (canvasBounds?.height ?? 0) - 32))
//           }}>
//             {n.kind === 'button' && (
//               <button className="btn">{n.props?.text || 'Button'}</button>
//             )}
//             {n.kind === 'input' && (
//               <input
//                 placeholder={n.props?.placeholder || 'Type…'}
//                 style={{ padding:'10px 12px', borderRadius:8, border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0' }}
//               />
//             )}
//             {n.kind === 'card' && (
//               <div className="card" style={{ width: 260 }}>
//                 <div style={{ fontWeight:700 }}>{n.props?.title || 'Card'}</div>
//                 <div className="muted">{n.props?.body || 'Lorem ipsum'}</div>
//               </div>
//             )}
//             {n.kind === 'text' && (
//               <div>{n.props?.value || 'Text'}</div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useGazeTracker } from '@/hooks/useGazeTracker'
import { useAIComponentGeneration } from '@/hooks/useAIComponentGeneration'
import { parseInstructionSmart } from '@/utils/nlpParser'
import { applyIntent, captureStyles } from '@/utils/styleApplier'
import { inferComponentFromPrompt } from '@/utils/smartComponentInferencer'
import type { GazePoint, ElementLock } from '@/types'

type NodeKind =
  | 'button' | 'input' | 'card' | 'text' | 'image' | 'hero' | 'form'
  | 'list' | 'badge' | 'avatar' | 'modal' | 'navbar' | 'footer' | 'table'

type NodeDef = {
  id: string
  kind: NodeKind
  x: number
  y: number
  props?: Record<string, any>
}

function makeNode(kind: NodeKind, at: GazePoint, props: Record<string, any> = {}): NodeDef {
  const id = `${kind}-${Date.now()}`
  return { id, kind, x: at.x, y: at.y, props }
}

export default function NewPage() {
  const { currentGaze, getElementAtGaze, setFlipX, setFlipY } = useGazeTracker()
  
  // Keep Y-axis inverted, but restore X-axis to normal
  useEffect(() => {
    setFlipX(false)
    setFlipY(true)
  }, [setFlipX, setFlipY])
  
  const [prompt, setPrompt] = useState('add a primary button that says "Save"')
  const [editText, setEditText] = useState('make this blue with rounded corners')
  const [nodes, setNodes] = useState<NodeDef[]>([])
  const [highlightEl, setHighlightEl] = useState<HTMLElement | null>(null)
  const [locked, setLocked] = useState<ElementLock | null>(null)
  const [codePreview, setCodePreview] = useState<string>('')
  const canvasRef = useRef<HTMLDivElement>(null)
  const lastHighlightRef = useRef<HTMLElement | null>(null)

  const { generateComponent, isGenerating, lastGenerated } = useAIComponentGeneration({
    gazeData: [], // NewPage adds by itself as needed
    onComponentGenerated: (component) => {
      setCodePreview(component.code || '')
    }
  })

  // Starter template (header + text + button) once
  useEffect(() => {
    if (nodes.length) return
    const center: GazePoint = {
      x: window.innerWidth / 2,
      y: (window.innerHeight / 2) - 60,
      timestamp: Date.now(),
      confidence: 1
    }
    setNodes([
      makeNode('text', { ...center, y: center.y - 60 }, { value: 'Welcome 👋' }),
      makeNode('text', center, { value: 'Describe a change and look at the element to edit it.' }),
      makeNode('button', { ...center, y: center.y + 60 }, { text: 'Get Started' }),
    ])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Track gaze-focused element within the canvas and add a subtle blue glow
  useEffect(() => {
    if (!currentGaze || !canvasRef.current) return
    const els = document.elementsFromPoint(currentGaze.x, currentGaze.y) as HTMLElement[]
    const topInsideCanvas = els.find(el => canvasRef.current!.contains(el))
    if (topInsideCanvas !== lastHighlightRef.current) {
      if (lastHighlightRef.current) lastHighlightRef.current.classList.remove('gaze-focus')
      if (topInsideCanvas) topInsideCanvas.classList.add('gaze-focus')
      lastHighlightRef.current = topInsideCanvas || null
      setHighlightEl(topInsideCanvas || null)
    }
  }, [currentGaze])

  // Keep generated code preview in sync
  useEffect(() => {
    if (lastGenerated?.code) setCodePreview(lastGenerated.code)
  }, [lastGenerated])

  const canvasBounds = useMemo(() => canvasRef.current?.getBoundingClientRect(), [nodes.length])

  async function handleAddViaNLP() {
    if (!currentGaze) return
    const spec = await inferComponentFromPrompt(prompt)
    const node = makeNode(spec.kind as NodeKind, currentGaze, spec.props || {})
    setNodes(prev => [...prev, node])
    // Generate code via AI Component Generator and show
    await generateComponent(prompt)
  }

  async function handleEditHighlighted() {
    const target = highlightEl
    if (!target) return
    // Lock and snapshot styles for potential undo (re-using ElementLock shape)
    const r = target.getBoundingClientRect()
    const props = ['backgroundColor','color','fontSize','padding','margin','borderRadius','border','width','height']
    const lock: ElementLock = {
      id:`${target.tagName.toLowerCase()}-${Date.now()}`,
      role: target.tagName.toLowerCase(),
      bbox: { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height },
      element: target,
      originalStyles: captureStyles(target, props)
    }
    setLocked(lock)
    const intent = await parseInstructionSmart(editText, target)
    if (!intent) return
    applyIntent(lock, intent)
    // Ask AI to produce updated code for this change and show it
    await generateComponent(`Modify the currently selected component: ${editText}`)
  }

  // Render helpers
  const within = (n: NodeDef) => ({
    position:'absolute' as const,
    left: Math.max(8, Math.min((n.x - (canvasBounds?.left ?? 0)) - 40, (canvasBounds?.width ?? 0) - 80)),
    top: Math.max(8, Math.min((n.y - (canvasBounds?.top ?? 0)) - 16, (canvasBounds?.height ?? 0) - 32))
  })

  function renderNode(n: NodeDef) {
    switch (n.kind) {
      case 'button':
        return <button className="btn">{n.props?.text || 'Button'}</button>
      case 'input':
        return <input placeholder={n.props?.placeholder || 'Type…'}
          style={{ padding:'10px 12px', borderRadius:8, border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0' }} />
      case 'card':
        return <div className="card" style={{ width: 260 }}>
          <div style={{ fontWeight:700 }}>{n.props?.title || 'Card'}</div>
          <div className="muted">{n.props?.body || 'Lorem ipsum'}</div>
        </div>
      case 'text':
        return <div>{n.props?.value || 'Text'}</div>
      case 'image':
        return <img src={n.props?.src || 'https://picsum.photos/320/180'} alt={n.props?.alt || 'image'} style={{ width: 320, height: 180, objectFit:'cover', borderRadius:8 }} />
      case 'hero':
        return <div className="card" style={{ width: 560, padding:20, background:'#1e293b' }}>
          <h2 style={{ margin:0 }}>Hero Section</h2>
          <p className="muted">Eye-tracking + AI component generation</p>
          <button className="btn">Get Started</button>
        </div>
      case 'form':
        return <div className="card" style={{ width: 360 }}>
          <div style={{ fontWeight:700, marginBottom:8 }}>{n.props?.title || 'Form'}</div>
          <input placeholder="Email" style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0', marginBottom:8 }} />
          <input placeholder="Password" type="password" style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0', marginBottom:8 }} />
          <button className="btn">Submit</button>
        </div>
      case 'list':
        return <ul className="card" style={{ padding:'12px 16px', minWidth:220 }}>
          {(n.props?.items || ['One','Two','Three']).map((it:string,i:number)=><li key={i} className="muted">• {it}</li>)}
        </ul>
      case 'badge':
        return <span style={{ background:'#1d4ed8', color:'#fff', padding:'4px 10px', borderRadius:999 }}>{n.props?.text || 'Badge'}</span>
      case 'avatar':
        return <img src={n.props?.src || 'https://i.pravatar.cc/64'} alt="avatar" style={{ width:48, height:48, borderRadius:'50%' }} />
      case 'modal':
        return <div className="card" style={{ width: 420 }}>
          <div style={{ fontWeight:700, marginBottom:8 }}>{n.props?.title || 'Modal Title'}</div>
          <p className="muted">{n.props?.body || 'This is a modal body.'}</p>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn">OK</button>
            <button className="btn secondary">Cancel</button>
          </div>
        </div>
      case 'navbar':
        return <div className="card" style={{ width: 560, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <strong>Brand</strong>
          <div className="muted">Home · Docs · About</div>
          <button className="btn">Sign In</button>
        </div>
      case 'footer':
        return <div className="muted" style={{ width: 560, textAlign:'center' }}>© 2025 Clientsight</div>
      case 'table':
        return <table className="card" style={{ borderCollapse:'collapse', minWidth:360 }}>
          <thead><tr><th style={{ padding:8 }}>Name</th><th style={{ padding:8 }}>Role</th></tr></thead>
          <tbody>
            <tr><td style={{ padding:8 }}>Ada</td><td style={{ padding:8 }}>Engineer</td></tr>
            <tr><td style={{ padding:8 }}>Alan</td><td style={{ padding:8 }}>Research</td></tr>
          </tbody>
        </table>
      default:
        return <div className="card">Component</div>
    }
  }

  return (
    <div className="container">
      <style>{`
        .gaze-pointer {
          position: absolute; width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(59,130,246,.9); box-shadow: 0 0 0 2px rgba(59,130,246,.25);
          transform: translate(-50%, -50%); pointer-events: none; z-index: 9998;
        }
        .gaze-focus {
          outline: 2px solid rgba(59,130,246,.4);
          box-shadow: 0 0 0 3px rgba(59,130,246,.18);
          transition: box-shadow .12s ease, outline-color .12s ease;
        }
        .code-pane {
          background:#0f0f1e;border:1px solid #1f2937;border-radius:8px;padding:10px;max-height:240px;overflow:auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; font-size:12px;
        }
      `}</style>

      <h2 style={{ marginBottom:8 }}>New Page (Gaze-Driven Editor)</h2>

      <div className="row" style={{ gap:12, marginBottom:12 }}>
        <div className="card" style={{ flex:1 }}>
          <div style={{ fontWeight:700, marginBottom:8 }}>Add by prompt</div>
          <div style={{ display:'flex', gap:8 }}>
            <input
              value={prompt}
              onChange={e=>setPrompt(e.target.value)}
              placeholder='e.g., "Add a login form here" or "place a hero section"'
              style={{ flex:1, padding:10, borderRadius:8, border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0' }}
            />
            <button className="btn" onClick={handleAddViaNLP} disabled={isGenerating}>
              {isGenerating ? 'Generating…' : 'Add via NLP'}
            </button>
          </div>
          <div className="muted" style={{ marginTop:6 }}>New components appear at your current gaze point.</div>
        </div>
        <div className="card" style={{ flex:1 }}>
          <div style={{ fontWeight:700, marginBottom:8 }}>Edit highlighted</div>
          <div style={{ display:'flex', gap:8 }}>
            <input
              value={editText}
              onChange={e=>setEditText(e.target.value)}
              placeholder='e.g., "change text to \"Save\"", "make this blue", "increase padding to 12px"'
              style={{ flex:1, padding:10, borderRadius:8, border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0' }}
            />
            <button className="btn secondary" onClick={handleEditHighlighted} disabled={!highlightEl || isGenerating}>
              Apply Edit
            </button>
          </div>
          <div className="muted" style={{ marginTop:6 }}>
            Look at an element on the canvas to highlight it, then run an edit.
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:12 }}>
        <div ref={canvasRef} className="card" style={{ position:'relative', height:'70vh', overflow:'hidden' }}>
          {/* Live nodes */}
          {nodes.map(n => (
            <div key={n.id} style={within(n)}>
              {renderNode(n)}
            </div>
          ))}

          {/* Visible gaze pointer */}
          {currentGaze && (
            <div
              className="gaze-pointer"
              style={{
                left: (currentGaze.x - (canvasBounds?.left ?? 0)),
                top: (currentGaze.y - (canvasBounds?.top ?? 0))
              }}
            />
          )}
        </div>

        {/* Real-time code from AI Component Generator */}
        <div className="card" style={{ height:'70vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <strong>AI Code (live)</strong>
            <span className="muted" style={{ fontSize:12 }}>{isGenerating ? 'Generating…' : 'Idle'}</span>
          </div>
          <div className="code-pane">
            <pre><code>{codePreview || '// Generate or edit to view code here.'}</code></pre>
          </div>
          <div className="muted" style={{ fontSize:12, marginTop:8 }}>
            Powered by AI Component Generator — every add/edit updates the code.
          </div>
        </div>
      </div>
    </div>
  )
}
