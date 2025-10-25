"use client"

import { useEffect } from 'react'

export default function MobileKeyboardInsets() {
  useEffect(() => {
    // Enable overlay for browsers that support VirtualKeyboard API (mostly Android Chrome)
    try {
      // @ts-ignore
      if (navigator?.virtualKeyboard) {
        // @ts-ignore
        navigator.virtualKeyboard.overlaysContent = true
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

    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    window.addEventListener('resize', update)

    return () => {
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      document.documentElement.style.setProperty('--kb-offset', '0px')
    }
  }, [])

  return null
}
