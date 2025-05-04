"use client"

import type React from "react"
import { createContext, useState, useCallback, type ReactNode } from "react"

export interface ToastProps {
  type: "success" | "error" | "info" | "warning"
  title: string
  message: string
  duration?: number
}

export interface ToastContextType {
  toast: ToastProps | null
  showToast: (toast: ToastProps) => void
  hideToast: () => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastProps | null>(null)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const hideToast = useCallback(() => {
    setToast(null)
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
  }, [timeoutId])

  const showToast = useCallback(
    (newToast: ToastProps) => {
      // Ocultar cualquier toast existente
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // Mostrar el nuevo toast
      setToast(newToast)

      // Configurar el temporizador para ocultar automáticamente
      const duration = newToast.duration || 3000
      const id = setTimeout(() => {
        setToast(null)
        setTimeoutId(null)
      }, duration)

      setTimeoutId(id)
    },
    [timeoutId],
  )

  return <ToastContext.Provider value={{ toast, showToast, hideToast }}>{children}</ToastContext.Provider>
}
