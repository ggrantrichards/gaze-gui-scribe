import React, { useMemo, useRef, useState } from 'react'
import { useGazeTracker } from '@/hooks/useGazeTracker'
import type { GazePoint } from '@/types'

type NodeKind = 'button' | 'input' | 'card' | 'text'

type NodeDef = {
  id: string
  kind: NodeKind
  x: number
  y: number
  props?: Record<string, any>
}

function makeNode(kind: NodeKind, at: GazePoint, prompt: string): NodeDef {
  const id = `${kind}-${Date.now()}`
  switch (kind) {
    case 'button': return { id, kind, x: at.x, y: at.y, props: { text: /text to ['"](.+?)['"]/.test(prompt) ? /text to ['"](.+?)['"]/.exec(prompt)![1] : 'Button' } }
    case 'input':  return { id, kind, x: at.x, y: at.y, props: { placeholder: /placeholder to ['"](.+?)['"]/.test(prompt) ? /placeholder to ['"](.+?)['"]/.exec(prompt)![1] : 'Type...' } }
    case 'card':   return { id, kind, x: at.x, y: at.y, props: { title: 'Card', body: 'Lorem ipsum' } }
    default:       return { id, kind: 'text', x: at.x, y: at.y, props: { value: prompt || 'Text' } }
  }
}

export default function NewPage() {
  const { currentGaze } = useGazeTracker()
  const [prompt, setPrompt] = useState("Add a login form here")
  const [nodes, setNodes] = useState<NodeDef[]>([])
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleAdd = (kind: NodeKind) => {
    if (!currentGaze) return
    const node = makeNode(kind, currentGaze, prompt)
    setNodes(prev => [...prev, node])
  }

  const canvasBounds = useMemo(() => canvasRef.current?.getBoundingClientRect(), [nodes.length])

  return (
    <div className="container">
      <h2 style={{ marginBottom:8 }}>New Page (Vision-Prompt Generator)</h2>
      <div className="card" style={{ marginBottom:12 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input
            value={prompt}
            onChange={e=>setPrompt(e.target.value)}
            placeholder="Describe what to add… e.g., 'Add a form here'"
            style={{ flex:1, padding:10, borderRadius:8, border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0' }}
          />
          <button className="btn" onClick={()=>handleAdd('card')}>Add Card</button>
          <button className="btn" onClick={()=>handleAdd('input')}>Add Input</button>
          <button className="btn" onClick={()=>handleAdd('button')}>Add Button</button>
          <button className="btn" onClick={()=>handleAdd('text')}>Add Text</button>
        </div>
        <div className="muted" style={{ marginTop:6 }}>Elements are placed at your current gaze point.</div>
      </div>

      <div ref={canvasRef} className="card" style={{ position:'relative', height: '70vh', overflow:'hidden' }}>
        {nodes.map(n => (
          <div key={n.id} style={{
            position:'absolute',
            left: Math.max(8, Math.min((n.x - (canvasBounds?.left ?? 0)) - 40, (canvasBounds?.width ?? 0) - 80)),
            top: Math.max(8, Math.min((n.y - (canvasBounds?.top ?? 0)) - 16, (canvasBounds?.height ?? 0) - 32))
          }}>
            {n.kind === 'button' && (
              <button className="btn">{n.props?.text || 'Button'}</button>
            )}
            {n.kind === 'input' && (
              <input
                placeholder={n.props?.placeholder || 'Type…'}
                style={{ padding:'10px 12px', borderRadius:8, border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0' }}
              />
            )}
            {n.kind === 'card' && (
              <div className="card" style={{ width: 260 }}>
                <div style={{ fontWeight:700 }}>{n.props?.title || 'Card'}</div>
                <div className="muted">{n.props?.body || 'Lorem ipsum'}</div>
              </div>
            )}
            {n.kind === 'text' && (
              <div>{n.props?.value || 'Text'}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
