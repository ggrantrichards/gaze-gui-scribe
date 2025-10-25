import React, { useState } from 'react'

export function InstructionPanel({ onSubmit, onClose, elementRole, lastResult }:
  { onSubmit: (instruction:string)=>void, onClose:()=>void, elementRole:string, lastResult:string }) {
  const [value, setValue] = useState('Make this blue')

  return (
    <div style={{
      position:'fixed', right:24, bottom:24, zIndex:9998
    }}>
      <div className="card" style={{ width: 360 }}>
        <div style={{ fontWeight:700, marginBottom:8 }}>Modify {elementRole}</div>
        <input
          value={value}
          onChange={e=>setValue(e.target.value)}
          placeholder="e.g., Make this red / Add rounded corners / Change text to 'Save'"
          style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid #334155', background:'#0f172a', color:'#e2e8f0', marginBottom:8 }}
        />
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={()=>onSubmit(value)}>Apply</button>
          <button className="btn secondary" onClick={onClose}>Close</button>
        </div>
        {lastResult && <div className="muted" style={{ marginTop:8 }}>{lastResult}</div>}
      </div>
    </div>
  )
}
