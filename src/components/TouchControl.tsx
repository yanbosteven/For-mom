import { useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCw, ChevronDown } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { Point, Direction } from '../types'

interface TouchControlProps {
  onRotate: () => void
  onMove: (dir: Direction) => void
  className?: string
  hint?: string
  icon?: 'rotate' | 'down'
}

export function TouchControl({ 
  onRotate, 
  onMove, 
  className,
  hint,
  icon = 'rotate'
}: TouchControlProps) {
  const [touchStart, setTouchStart] = useState<Point | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }

    const dx = touchEnd.x - touchStart.x
    const dy = touchEnd.y - touchStart.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx < 10 && absDy < 10) {
      onRotate()
    } else if (absDx > absDy) {
      onMove(dx > 0 ? 'right' : 'left')
    } else if (dy > 0) {
      onMove('down')
    }

    setTouchStart(null)
  }

  return (
    <motion.div
      className={twMerge('touch-control', className)}
      whileTap={{ scale: 0.95 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {icon === 'rotate' ? (
        <RotateCw className="touch-control-icon" />
      ) : (
        <ChevronDown className="touch-control-icon" />
      )}
      {hint && <div className="touch-hint">{hint}</div>}
    </motion.div>
  )
}