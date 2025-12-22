import { useState, useCallback, useEffect } from 'react'

interface ResizablePanesProps {
  left: React.ReactNode
  right: React.ReactNode
  initialLeftWidth?: number
  minLeftWidth?: number
  maxLeftWidth?: number
}

export default function ResizablePanes({
  left,
  right,
  initialLeftWidth = 400,
  minLeftWidth = 300,
  maxLeftWidth = 600,
}: ResizablePanesProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      
      // Account for sidebar width (48px when collapsed)
      const sidebarWidth = 48
      const newWidth = e.clientX - sidebarWidth
      
      if (newWidth >= minLeftWidth && newWidth <= maxLeftWidth) {
        setLeftWidth(newWidth)
      }
    },
    [isDragging, minLeftWidth, maxLeftWidth]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel */}
      <div 
        className="flex flex-col border-r border-jett-border"
        style={{ width: leftWidth }}
      >
        {left}
      </div>

      {/* Resize Handle */}
      <div
        className={`w-1 cursor-col-resize hover:bg-jett-accent/50 transition-colors ${
          isDragging ? 'bg-jett-accent' : 'bg-transparent'
        }`}
        onMouseDown={handleMouseDown}
      />

      {/* Right Panel */}
      <div className="flex-1 flex flex-col">
        {right}
      </div>

      {/* Overlay to capture mouse events while dragging */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  )
}
