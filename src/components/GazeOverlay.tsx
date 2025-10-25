import React from 'react'
import type { GazePoint, ElementLock } from '@/types'

export function GazeOverlay({ gazePoint, lockedElement }: { gazePoint: GazePoint | null, lockedElement: ElementLock | null }) {
  return (
    <>
      {gazePoint && (
        <div style={{
          position:'fixed',
          left: gazePoint.x - 10,
          top: gazePoint.y - 10,
          width:20, height:20,
          borderRadius:'50%',
          border:'2px solid #22d3ee',
          background:'rgba(34,211,238,0.25)',
          pointerEvents:'none',
          zIndex: 9999
        }}/>
      )}
      {lockedElement && (
        <div style={{
          position:'absolute',
          left: lockedElement.bbox.x,
          top: lockedElement.bbox.y,
          width: lockedElement.bbox.w,
          height: lockedElement.bbox.h,
          border:'2px dashed #a78bfa',
          borderRadius: 8,
          pointerEvents:'none',
          zIndex: 9998
        }}/>
      )}
    </>
  )
}
