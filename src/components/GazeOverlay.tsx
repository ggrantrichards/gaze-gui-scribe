import React from 'react'
import type { GazePoint, ElementLock } from '@/types'

export function GazeOverlay({ gazePoint, lockedElement }: { gazePoint: GazePoint | null, lockedElement: ElementLock | null }) {
  return (
    <>
      {gazePoint && (
        <div 
          className="fixed pointer-events-none z-[9999] transition-all duration-75 ease-out"
          style={{
            left: gazePoint.x,
            top: gazePoint.y,
          }}
        >
          {/* Outer circle */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-primary-500/50 bg-primary-500/10 backdrop-blur-[1px]" />
          {/* Inner dot */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary-600 shadow-sm" />
          {/* Crosshair lines */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-[1px] bg-primary-500/20" />
          <div className="absolute -translate-x-1/2 -translate-y-1/2 w-[1px] h-10 bg-primary-500/20" />
        </div>
      )}
      {lockedElement && (
        <div 
          className="absolute pointer-events-none z-[9998] border-2 border-primary-500 border-dashed rounded-lg animate-pulse"
          style={{
            left: lockedElement.bbox.x - 4,
            top: lockedElement.bbox.y - 4,
            width: lockedElement.bbox.w + 8,
            height: lockedElement.bbox.h + 8,
          }}
        >
          <div className="absolute -top-6 left-0 bg-primary-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
            Locked: {lockedElement.role}
          </div>
        </div>
      )}
    </>
  )
}
