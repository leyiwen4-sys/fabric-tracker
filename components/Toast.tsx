'use client'

import { useEffect, useState, useCallback } from 'react'
import styles from './Toast.module.css'

interface ToastMessage {
  id: number
  text: string
  type: 'success' | 'error'
}

let toastId = 0
let globalAddToast: ((text: string, type: 'success' | 'error') => void) | null = null

export function showToast(text: string, type: 'success' | 'error' = 'success') {
  globalAddToast?.(text, type)
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((text: string, type: 'success' | 'error') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, text, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  useEffect(() => {
    globalAddToast = addToast
    return () => {
      globalAddToast = null
    }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className={styles.overlay}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${t.type === 'error' ? styles.error : styles.success}`}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}
