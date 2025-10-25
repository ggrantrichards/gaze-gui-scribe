import React, { useState } from 'react'

type Props = { onComplete: () => void; onSkip?: () => void }

const POINTS = [
  { x: 0.5, y: 0.5 },
  { x: 0.1, y: 0.1 },
  { x: 0.9, y: 0.1 },
  { x: 0.1, y: 0.9 },
  { x: 0.9, y: 0.9 },
]

export function Calibration({ onComplete, onSkip }: Props) {
  const [idx, setIdx] = useState(0)

  const current = POINTS[idx]
  const handleClick = () => {
    if (idx < POINTS.length - 1) setIdx(idx + 1)
    else onComplete()
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
      display:'grid', placeItems:'center', zIndex: 9997
    }}>
      <div style={{ position:'relative', width:'100%', height:'100%' }}>
        <div
          onClick={handleClick}
          title="Click while looking at the dot"
          style={{
            position:'absolute',
            left: `${current.x * 100}vw`, top: `${current.y * 100}vh`,
            transform:'translate(-50%, -50%)',
            width: 20, height: 20, borderRadius:'50%',
            background:'#ef4444', border:'3px solid #991b1b', cursor:'pointer'
          }}
        />
        <div style={{ position:'absolute', left:20, bottom:20, color:'#cbd5e1' }}>
          <button onClick={onComplete} className="btn secondary" style={{marginRight:8}}>Finish</button>
          {onSkip && <button onClick={onSkip} className="btn secondary">Skip</button>}
        </div>
      </div>
    </div>
  )
}
