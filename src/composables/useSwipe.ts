import { ref, onMounted, onUnmounted } from 'vue'

export function useSwipe(
  element: HTMLElement | null,
  options: {
    onSwipeUp?: () => void
    onSwipeDown?: () => void
    threshold?: number
    zoneHeight?: number
  } = {}
) {
  const { onSwipeUp, onSwipeDown, threshold = 50, zoneHeight = 0.3 } = options

  const startY = ref(0)
  const startX = ref(0)
  const startTime = ref(0)
  const isDragging = ref(false)
  const translateY = ref(0)

  function isSwipeZone(clientY: number): boolean {
    if (!element) return true
    const rect = element.getBoundingClientRect()
    const relativeY = (clientY - rect.top) / rect.height
    return relativeY > (1 - zoneHeight)
  }

  function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0]
    
    // Only handle touches in the swipe zone (bottom of screen)
    if (!isSwipeZone(touch.clientY)) return
    
    startY.value = touch.clientY
    startX.value = touch.clientX
    startTime.value = Date.now()
    isDragging.value = true
    translateY.value = 0
  }

  function onTouchMove(e: TouchEvent) {
    if (!isDragging.value) return
    
    const touch = e.touches[0]
    const deltaY = touch.clientY - startY.value
    const deltaX = touch.clientX - startX.value
    
    // If horizontal movement is greater, cancel swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      isDragging.value = false
      return
    }

    translateY.value = deltaY
    
    // Prevent default scrolling
    e.preventDefault()
  }

  function onTouchEnd() {
    if (!isDragging.value) return
    
    const elapsed = Date.now() - startTime.value
    const velocity = Math.abs(translateY.value) / elapsed
    
    if (Math.abs(translateY.value) > threshold || velocity > 0.3) {
      if (translateY.value < 0) {
        onSwipeUp?.()
      } else {
        onSwipeDown?.()
      }
    }
    
    isDragging.value = false
    translateY.value = 0
  }

  onMounted(() => {
    if (!element) return
    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: false })
    element.addEventListener('touchend', onTouchEnd, { passive: true })
  })

  onUnmounted(() => {
    if (!element) return
    element.removeEventListener('touchstart', onTouchStart)
    element.removeEventListener('touchmove', onTouchMove)
    element.removeEventListener('touchend', onTouchEnd)
  })

  return {
    isDragging,
    translateY,
  }
}
