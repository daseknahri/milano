import { useEffect, useRef } from 'react'

let openOverlayCount = 0

export function useOverlayDialog(open, onClose) {
  const overlayRef = useRef(null)
  const triggerRef = useRef(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    const previouslyFocused = document.activeElement
    const triggerElement = triggerRef.current
    openOverlayCount += 1
    document.body.classList.add('drawer-open')

    const focusFirstControl = window.requestAnimationFrame(() => {
      const preferred = overlayRef.current?.querySelector('[data-overlay-autofocus]')
      const fallback = overlayRef.current?.querySelector(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )
      ;(preferred || fallback)?.focus()
    })

    const handleKeys = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = [...(overlayRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) || [])].filter((element) => element.getClientRects().length)
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeys)
    return () => {
      window.cancelAnimationFrame(focusFirstControl)
      document.removeEventListener('keydown', handleKeys)
      openOverlayCount = Math.max(0, openOverlayCount - 1)
      if (!openOverlayCount) document.body.classList.remove('drawer-open')
      ;(triggerElement || previouslyFocused)?.focus?.()
    }
  }, [open])

  return { overlayRef, triggerRef }
}
