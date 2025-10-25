import React, { useEffect, useMemo, useState } from 'react'
import { median, pixelError } from '@/utils/calibrationUtils'
import { useGazeTracker } from '@/hooks/useGazeTracker'

type Props = { onComplete: () => void; onSkip?: () => void }

const POINTS = [
  { x: 0.5, y: 0.5 },
  { x: 0.1, y: 0.1 },
  { x: 0.9, y: 0.1 },
  { x: 0.1, y: 0.9 },
  { x: 0.9, y: 0.9 },
]

const SAMPLES_PER_POINT = 18
const ACCEPTABLE_MEDIAN_ERROR = 50 // px

export function Calibration({ onComplete, onSkip }: Props) {
  const { currentGaze } = useGazeTracker()
  const [idx, setIdx] = useState(0)
  const [collected, setCollected] = useState<number[][]>(POINTS.map(() => [])) // per point: list of errors
  const [collecting, setCollecting] = useState(false)
  const current = POINTS[idx]

  useEffect(() => {
    // Start data collection on each point; we sample continuously until SAMPLES_PER_POINT
    if (!collecting) {
      setCollecting(true)
    }
  }, [idx, collecting])

  useEffect(() => {
    if (!collecting || !currentGaze) return
    const id = window.setInterval(() => {
      const gx = currentGaze.x
      const gy = currentGaze.y
      const tx = current.x * window.innerWidth
      const ty = current.y * window.innerHeight
      const e = pixelError({ x: tx, y: ty }, { x: gx, y: gy })
      setCollected(prev => {
        const copy = prev.map(a => a.slice())
        copy[idx].push(e)
        return copy
      })
    }, 33) // ~30 FPS
    return () => window.clearInterval(id)
  }, [collecting, current.x, current.y, currentGaze, idx])

  const pointMedian = useMemo(() => {
    const arr = collected[idx]
    return arr.length ? median(arr) : null
  }, [collected, idx])

  const overallMedian = useMemo(() => {
    const flat = collected.flat()
    return flat.length ? median(flat) : null
  }, [collected])

  const handleClickAdvance = () => {
    // Require enough samples before moving on
    if (collected[idx].length < SAMPLES_PER_POINT) return
    if (idx < POINTS.length - 1) {
      setIdx(idx + 1)
      setCollecting(false)
    } else {
      onComplete()
    }
  }

  const statusColor = overallMedian == null
    ? '#f59e0b'
    : overallMedian <= ACCEPTABLE_MEDIAN_ERROR
      ? '#10b981'
      : '#ef4444'

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
      display:'grid', placeItems:'center', zIndex: 9997
    }}>
      <div style={{ position:'relative', width:'100%', height:'100%' }}>
        {/* calibration target */}
        <div
          onClick={handleClickAdvance}
          title="While looking at the dot, click to proceed when green."
          style={{
            position:'absolute',
            left: `${current.x * 100}vw`, top: `${current.y * 100}vh`,
            transform:'translate(-50%, -50%)',
            width: 22, height: 22, borderRadius:'50%',
            background:'#111827', border:`4px solid ${statusColor}`, cursor:'pointer',
            boxShadow:'0 0 0 6px rgba(255,255,255,0.15)'
          }}
        />

        {/* status HUD */}
        <div style={{
          position:'absolute', left:20, bottom:20, color:'#e2e8f0',
          background:'rgba(15,23,42,0.85)', border:'1px solid #475569',
          borderRadius:12, padding:'10px 12px', minWidth:260
        }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>Calibration</div>
          <div>Point {idx+1}/{POINTS.length}</div>
          <div>Samples at point: {collected[idx].length}/{SAMPLES_PER_POINT}</div>
          <div>Median error (point): {pointMedian ? `${Math.round(pointMedian)} px` : '—'}</div>
          <div>Median error (overall): {overallMedian ? `${Math.round(overallMedian)} px` : '—'}</div>
          <div style={{ marginTop:8, display:'flex', gap:8 }}>
            <button
              className="btn secondary"
              disabled={collected[idx].length < SAMPLES_PER_POINT}
              onClick={handleClickAdvance}
            >
              {idx < POINTS.length - 1 ? 'Next point' : 'Finish'}
            </button>
            {onSkip && <button className="btn secondary" onClick={onSkip}>Skip</button>}
          </div>
          <div style={{ fontSize:12, color:'#94a3b8', marginTop:6 }}>
            Finish becomes available when the overall median error ≤ {ACCEPTABLE_MEDIAN_ERROR}px (green border).
          </div>
        </div>
      </div>
    </div>
  )
}
