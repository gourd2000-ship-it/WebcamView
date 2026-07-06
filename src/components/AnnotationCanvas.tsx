import React, { useEffect, useState, useCallback } from 'react'
import { cn } from '../utils/cn'

export interface Point {
  x: number
  y: number
}

export interface DrawingPath {
  id: string
  type: 'pen' | 'highlighter' | 'eraser' | 'line' | 'rect' | 'circle' | 'arrow'
  points: Point[]
  color: string
  thickness: number
}

interface AnnotationCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  width: number
  height: number
  tool: 'pen' | 'highlighter' | 'eraser' | 'line' | 'rect' | 'circle' | 'arrow'
  color: string
  thickness: number
  isDrawingModeActive: boolean
  paths: DrawingPath[]
  setPaths: React.Dispatch<React.SetStateAction<DrawingPath[]>>
  isCameraActive: boolean
  className?: string
  style?: React.CSSProperties
  
  // Props for coordinate transformation
  zoom: number
  rotation: number
  isFlipped: boolean
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  canvasRef,
  width,
  height,
  tool,
  color,
  thickness,
  isDrawingModeActive,
  paths,
  setPaths,
  isCameraActive,
  className,
  style,
  zoom,
  rotation,
  isFlipped,
}) => {
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null)

  // Map mouse event client coordinates to internal canvas coordinates with inverse CSS transform
  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas || canvas.clientWidth === 0 || canvas.clientHeight === 0) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    
    // 1. Get coordinates relative to the center of the bounding box
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const screenX = e.clientX - centerX
    const screenY = e.clientY - centerY

    // 2. Apply inverse rotation (convert rotation degrees to radians and invert it)
    const rad = (-rotation * Math.PI) / 180
    const cosVal = Math.cos(rad)
    const sinVal = Math.sin(rad)
    
    let rx = screenX * cosVal - screenY * sinVal
    let ry = screenX * sinVal + screenY * cosVal

    // 3. Apply inverse horizontal flip
    if (isFlipped) {
      rx = -rx
    }

    // 4. Apply inverse zoom
    const unzoomedX = rx / zoom
    const unzoomedY = ry / zoom

    // 5. Map to layout coordinates (relative to layout top-left)
    const layoutX = unzoomedX + canvas.clientWidth / 2
    const layoutY = unzoomedY + canvas.clientHeight / 2

    // 6. Scale to internal canvas resolution
    const x = (layoutX / canvas.clientWidth) * canvas.width
    const y = (layoutY / canvas.clientHeight) * canvas.height

    return { x, y }
  }, [canvasRef, zoom, rotation, isFlipped, width, height])

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingModeActive || !isCameraActive) return
    if (e.button !== 0) return // Left click only
    
    const startPoint = getCanvasCoords(e)
    const newPath: DrawingPath = {
      id: Math.random().toString(36).substr(2, 9),
      type: tool,
      points: [startPoint],
      color,
      thickness: tool === 'highlighter' ? thickness * 2.5 : thickness,
    }
    
    setIsDrawing(true)
    setCurrentPath(newPath)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentPath) return
    
    // Safety check: if left mouse button is released outside
    if (e.buttons !== 1) {
      handleMouseUp()
      return
    }

    const currentPoint = getCanvasCoords(e)

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      setCurrentPath({
        ...currentPath,
        points: [...currentPath.points, currentPoint],
      })
    } else {
      // Shapes only require start and current (end) points
      setCurrentPath({
        ...currentPath,
        points: [currentPath.points[0], currentPoint],
      })
    }
  }

  const handleMouseUp = () => {
    if (!isDrawing || !currentPath) return
    
    // Add path if it has enough points
    if (currentPath.points.length > 0) {
      setPaths((prev) => [...prev, currentPath])
    }
    
    setIsDrawing(false)
    setCurrentPath(null)
  }

  // Draw Effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const drawPath = (path: DrawingPath) => {
      if (path.points.length === 0) return

      ctx.beginPath()
      ctx.lineWidth = path.thickness
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (path.type === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.strokeStyle = 'rgba(0,0,0,1)'
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = path.color
        ctx.fillStyle = path.color

        if (path.type === 'highlighter') {
          ctx.globalAlpha = 0.4
        } else {
          ctx.globalAlpha = 1.0
        }
      }

      const start = path.points[0]

      if (path.type === 'pen' || path.type === 'highlighter' || path.type === 'eraser') {
        ctx.moveTo(start.x, start.y)
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y)
        }
        ctx.stroke()
      } else if (path.type === 'line') {
        if (path.points.length >= 2) {
          const end = path.points[1]
          ctx.moveTo(start.x, start.y)
          ctx.lineTo(end.x, end.y)
          ctx.stroke()
        }
      } else if (path.type === 'rect') {
        if (path.points.length >= 2) {
          const end = path.points[1]
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y)
        }
      } else if (path.type === 'circle') {
        if (path.points.length >= 2) {
          const end = path.points[1]
          const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
          ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI)
          ctx.stroke()
        }
      } else if (path.type === 'arrow') {
        if (path.points.length >= 2) {
          const end = path.points[1]
          
          // Draw shaft
          ctx.moveTo(start.x, start.y)
          ctx.lineTo(end.x, end.y)
          ctx.stroke()
          
          // Draw arrowhead
          const angle = Math.atan2(end.y - start.y, end.x - start.x)
          const arrowLength = Math.max(15, path.thickness * 2.5)
          
          ctx.beginPath()
          ctx.moveTo(end.x, end.y)
          ctx.lineTo(
            end.x - arrowLength * Math.cos(angle - Math.PI / 6),
            end.y - arrowLength * Math.sin(angle - Math.PI / 6)
          )
          ctx.lineTo(
            end.x - arrowLength * Math.cos(angle + Math.PI / 6),
            end.y - arrowLength * Math.sin(angle + Math.PI / 6)
          )
          ctx.closePath()
          ctx.fill()
        }
      }

      // Restore drawing states
      ctx.globalAlpha = 1.0
      ctx.globalCompositeOperation = 'source-over'
    }

    // Redraw all completed paths
    paths.forEach(drawPath)

    // Redraw current preview path
    if (currentPath) {
      drawPath(currentPath)
    }
  }, [paths, currentPath, width, height, canvasRef])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={style}
      className={cn(
        "absolute z-10",
        isDrawingModeActive && isCameraActive ? "pointer-events-auto cursor-crosshair" : "pointer-events-none",
        className
      )}
    />
  )
}
export default AnnotationCanvas
