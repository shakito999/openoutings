'use client'

import { useEffect, useMemo, useState } from 'react'

interface Props {
  containerId: string
  className?: string
  compact?: boolean
}

function IconEye({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconEyeOff({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2.25 12s3.75-6.75 9.75-6.75c2.08 0 3.92.66 5.5 1.66M21.75 12S18 18.75 12 18.75c-2.08 0-3.92-.66-5.5-1.66"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 3-3c0-.55-.15-1.07-.42-1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function PasswordVisibilityToggle({ containerId, className = '', compact = true }: Props) {
  const [visible, setVisible] = useState(false)

  // Toggle all password inputs inside the container
  const applyVisibility = useMemo(
    () => (show: boolean) => {
      const root = document.getElementById(containerId)
      if (!root) return
      const inputs = root.querySelectorAll<HTMLInputElement>('input[type="password"], input[data-actual-type="password"]')
      inputs.forEach((input) => {
        if (show) {
          if (input.type === 'password') {
            input.setAttribute('data-actual-type', 'password')
            try { input.type = 'text' } catch {}
          }
        } else {
          if (input.getAttribute('data-actual-type') === 'password') {
            try { input.type = 'password' } catch {}
            input.removeAttribute('data-actual-type')
          }
        }
      })
    },
    [containerId]
  )

  // Inject eye buttons into each password input container
  useEffect(() => {
    const root = document.getElementById(containerId)
    if (!root) return

    const ensureButtons = () => {
      const pwInputs = root.querySelectorAll<HTMLInputElement>('input[type="password"], input[data-actual-type="password"]')
      pwInputs.forEach((input) => {
        if (input.querySelector('.oo-pw-toggle') || input.parentElement?.querySelector('.oo-pw-toggle')) return
        
        const wrapper = input.parentElement as HTMLElement | null
        if (!wrapper) return
        
        // Ensure wrapper is a positioning context
        if (window.getComputedStyle(wrapper).position === 'static') {
          wrapper.style.position = 'relative'
        }
        
        // Add padding to input to make room for icon
        input.style.paddingRight = '2.5rem'

        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'oo-pw-toggle'
        btn.style.cssText = `
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          color: rgb(156, 163, 175);
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          flex-shrink: 0;
        `
        btn.setAttribute('aria-label', 'Show password')
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        `

        btn.addEventListener('click', () => {
          const isPassword = input.type === 'password'
          try { input.type = isPassword ? 'text' : 'password' } catch {}
          btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password')
          btn.innerHTML = isPassword
            ? `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3 3l18 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <path d="M2.25 12s3.75-6.75 9.75-6.75c2.08 0 3.92.66 5.5 1.66M21.75 12S18 18.75 12 18.75c-2.08 0-3.92-.66-5.5-1.66" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 3-3c0-.55-.15-1.07-.42-1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            `
            : `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            `
        })

        wrapper.appendChild(btn)
      })
    }

    ensureButtons()

    const mo = new MutationObserver(() => ensureButtons())
    mo.observe(root, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [containerId])

  // Global toggle state (optional; keep to support keyboard users via a single button if rendered)
  useEffect(() => {
    const root = document.getElementById(containerId)
    if (!root) return
    const inputs = root.querySelectorAll<HTMLInputElement>('input[type="password"], input[data-actual-type="password"]')
    inputs.forEach((input) => {
      if (visible && input.type === 'password') {
        try { input.type = 'text' } catch {}
      }
      if (!visible && input.type === 'text') {
        try { input.type = 'password' } catch {}
      }
    })
  }, [containerId, visible])

  // By default, render nothing; we inject per-input buttons
  return null
}
