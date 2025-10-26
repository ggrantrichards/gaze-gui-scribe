import React from 'react'
import type { GazePoint, ElementLock } from '@/types'

export function GazeOverlay({ gazePoint, lockedElement }: { gazePoint: GazePoint | null, lockedElement: ElementLock | null }) {
  // Get color based on tracking quality
  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case 'excellent': return '#10b981'  // green
      case 'good': return '#3b82f6'       // blue
      case 'fair': return '#f59e0b'       // amber
      case 'poor': return '#ef4444'       // red
      default: return '#22d3ee'          // cyan (default)
    }
  }
  
  return (
    <>
      {gazePoint && (
        <>
          {/* Outer pulse ring - BIGGER */}
          <div style={{
            position:'fixed',
            left: gazePoint.x,
            top: gazePoint.y,
            width: 50, height: 50,
            borderRadius: '50%',
            border: `3px solid ${getQualityColor(gazePoint.trackingQuality)}`,
            pointerEvents: 'none',
            zIndex: 9998,
            animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            transform: 'translate(-50%, -50%)',
          }}/>
          
          {/* Main gaze dot - MUCH BIGGER for better visibility */}
          <div style={{
            position:'fixed',
            left: gazePoint.x,
            top: gazePoint.y,
            width:32, height:32,
            borderRadius:'50%',
            border:`4px solid ${getQualityColor(gazePoint.trackingQuality)}`,
            background:`rgba(${gazePoint.trackingQuality === 'excellent' ? '16, 185, 129' : gazePoint.trackingQuality === 'poor' ? '239, 68, 68' : '34, 211, 238'}, 0.4)`,
            pointerEvents:'none',
            zIndex: 9999,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: gazePoint.trackingQuality === 'excellent' ? '0 0 30px rgba(16, 185, 129, 0.7)' : 
                      gazePoint.trackingQuality === 'good' ? '0 0 25px rgba(59, 130, 246, 0.6)' :
                      '0 0 15px rgba(34, 211, 238, 0.4)',
            transform: 'translate(-50%, -50%)',
          }}/>
          
          {/* Inner highlight dot for extra visibility */}
          <div style={{
            position:'fixed',
            left: gazePoint.x,
            top: gazePoint.y,
            width:12, height:12,
            borderRadius:'50%',
            background: getQualityColor(gazePoint.trackingQuality),
            pointerEvents:'none',
            zIndex: 10000,
            animation: 'quality-pulse 1.5s ease-in-out infinite',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
          }}/>
        </>
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
