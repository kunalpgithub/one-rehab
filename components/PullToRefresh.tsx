import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: React.ReactNode
  threshold?: number
  disabled?: boolean
}

export function PullToRefresh({ onRefresh, children, threshold = 80, disabled = false }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return

    const container = containerRef.current
    if (!container) return

    let touchStartY = 0
    let isDragging = false

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at the top of the page
      if (window.scrollY === 0) {
        touchStartY = e.touches[0].clientY
        isDragging = true
        startY.current = touchStartY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || window.scrollY > 0) return

      currentY.current = e.touches[0].clientY
      const distance = currentY.current - touchStartY

      if (distance > 0) {
        e.preventDefault()
        setIsPulling(true)
        setPullDistance(Math.min(distance, threshold * 1.5))
      }
    }

    const handleTouchEnd = async () => {
      if (!isDragging) return

      isDragging = false

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        setPullDistance(threshold)
        
        try {
          await onRefresh()
        } catch (error) {
          console.error('Refresh error:', error)
        } finally {
          setIsRefreshing(false)
          setIsPulling(false)
          setPullDistance(0)
        }
      } else {
        setIsPulling(false)
        setPullDistance(0)
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onRefresh, threshold, pullDistance, isRefreshing, disabled])

  const pullProgress = Math.min(pullDistance / threshold, 1)
  const shouldShowIndicator = isPulling || isRefreshing

  return (
    <div ref={containerRef} className="relative">
      <AnimatePresence>
        {shouldShowIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ 
              opacity: 1, 
              y: pullDistance / 2 - 25,
            }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute left-1/2 transform -translate-x-1/2 z-50"
            style={{ top: 0 }}
          >
            <div className="flex flex-col items-center justify-center">
              {isRefreshing ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              ) : (
                <motion.div
                  animate={{ rotate: pullProgress * 180 }}
                  className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                />
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {isRefreshing ? 'Refreshing...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        style={{
          transform: `translateY(${isRefreshing ? threshold : pullDistance}px)`,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  )
}

