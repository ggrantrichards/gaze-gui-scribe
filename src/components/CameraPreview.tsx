import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Minimize2, Move, Camera, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { safeShowWebGazerCamera, safeHideWebGazerUI, safeUpdateWebGazerPosition } from '@/utils/webgazerManager'

interface CameraPreviewProps {
  visible: boolean
  onClose?: () => void
}

/**
 * CameraPreview - A draggable, minimizable floating camera window
 * 
 * Uses WebGazerManager to control WebGazer video visibility and position.
 */
export function CameraPreview({ visible, onClose }: CameraPreviewProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState({ x: window.innerWidth - 260, y: window.innerHeight - 240 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null)

  // Control WebGazer visibility based on our state
  useEffect(() => {
    if (visible && !isMinimized) {
      // Show camera at our position (add 36px for header height)
      safeShowWebGazerCamera({ x: position.x, y: position.y + 36 })
    } else {
      safeHideWebGazerUI()
    }
    
    return () => {
      // Always hide when unmounting
      safeHideWebGazerUI()
    }
  }, [visible, isMinimized, position.x, position.y])

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    }
  }, [position.x, position.y])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      
      const deltaX = e.clientX - dragRef.current.startX
      const deltaY = e.clientY - dragRef.current.startY
      
      // Constrain to viewport
      const newX = Math.max(0, Math.min(window.innerWidth - 220, dragRef.current.startPosX + deltaX))
      const newY = Math.max(0, Math.min(window.innerHeight - 200, dragRef.current.startPosY + deltaY))
      
      setPosition({ x: newX, y: newY })
      
      // Update WebGazer position in real-time during drag
      safeUpdateWebGazerPosition(newX, newY + 36)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      dragRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  if (!visible) return null

  // When minimized, show a small floating button
  if (isMinimized) {
    return (
      <div
        className="fixed z-[99991]"
        style={{ left: position.x, top: position.y }}
      >
        <button 
          onClick={() => setIsMinimized(false)}
          onMouseDown={handleMouseDown}
          className={cn(
            "w-12 h-12 bg-primary-600 rounded-full shadow-xl flex items-center justify-center text-white hover:bg-primary-500 transition-colors border-2 border-white/20",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          title="Expand camera preview"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>
    )
  }

  // Full camera preview with controls
  return (
    <div
      className="fixed z-[99991]"
      style={{
        left: position.x,
        top: position.y,
        width: 240,
      }}
    >
      {/* Control bar */}
      <div 
        className={cn(
          "flex items-center justify-between px-3 py-2 bg-slate-800 rounded-t-xl border border-slate-600 border-b-0",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-white/90">
          <Move className="w-3 h-3 text-white/50" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Camera</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMinimized(true) }}
            className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button 
              onClick={(e) => { e.stopPropagation(); onClose() }}
              className="p-1 hover:bg-red-500/30 rounded text-white/70 hover:text-red-400 transition-colors"
              title="Hide camera"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {/* The WebGazer video container is positioned below via WebGazerManager */}
    </div>
  )
}
