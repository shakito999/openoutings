"use client"

import { useEffect } from 'react'

export default function MobileKeyboardInsets() {
  useEffect(() => {
    // Enable overlay for browsers that support VirtualKeyboard API (mostly Android Chrome)
    try {
      // Prefer browser resizing the viewport via interactive-widget; avoid overlays mode
      // @ts-ignore
      if (navigator?.virtualKeyboard && typeof navigator.virtualKeyboard.overlaysContent === 'boolean') {
        // @ts-ignore
        navigator.virtualKeyboard.overlaysContent = false
      }
    } catch {}

    const vv = (window as any).visualViewport as VisualViewport | undefined

    const update = () => {
      try {
        const height = window.innerHeight
        const vvHeight = vv?.height ?? height
        const vvOffsetTop = vv?.offsetTop ?? 0
        const kb = Math.max(0, Math.round(height - vvHeight - vvOffsetTop))
        document.documentElement.style.setProperty('--kb-offset', `${kb}px`)
      } catch {}
    }

    update()

    if (vv) {
      vv.addEventListener('resize', update)
      vv.addEventListener('scroll', update)
    }
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)

    return () => {
      if (vv) {
        vv.removeEventListener('resize', update)
        vv.removeEventListener('scroll', update)
      }
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      document.documentElement.style.setProperty('--kb-offset', '0px')
    }
  }, [])

  return null
}
