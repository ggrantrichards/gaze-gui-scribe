import React from 'react'
import type { GazePoint } from '@/types'

type Props = {
  visible: boolean
  gaze: GazePoint | null
  focusedEl: HTMLElement | null
  onPick: (suggestion: string) => void
}

function suggestionsFor(el: HTMLElement | null): string[] {
  if (!el) return []
  const tag = el.tagName.toLowerCase()
  if (tag === 'button') {
    return ['Change text to "Save"', 'Make this blue', 'Add rounded corners', 'Increase padding by 8']
  }
  if (tag === 'input' || tag === 'textarea') {
    return ['Change placeholder to "Search..."', 'Increase padding by 6', 'Make this yellow']
  }
  // default container/text
  return ['Make this blue', 'Add rounded corners', 'Change font size to 20px', 'Duplicate card']
}

export function AutoSuggestionPanel({ visible, gaze, focusedEl, onPick }: Props) {
  if (!visible || !gaze) return null
  const items = suggestionsFor(focusedEl).slice(0, 4)
  if (!items.length) return null

  return (
    <div style={{
      position:'fixed', left: Math.min(gaze.x + 14, window.innerWidth - 260), top: Math.min(gaze.y + 14, window.innerHeight - 10),
      width: 240, zIndex: 9998,
      background:'rgba(15,23,42,0.96)', border:'1px solid #334155', borderRadius:12, padding:8
    }}>
      <div style={{ fontWeight:700, color:'#e2e8f0', marginBottom:6 }}>Suggestions</div>
      {items.map((s, i) => (
        <button
          key={i}
          onClick={() => onPick(s)}
          className="btn secondary"
          style={{ width:'100%', textAlign:'left', marginBottom:6 }}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
