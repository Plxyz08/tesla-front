"use client"

import { useContext } from "react"
import { ToastContext, type ToastContextType, type ToastProps } from "../context/ToastContext"

export const useToast = (): { showToast: (toast: ToastProps) => void } => {
  const context = useContext<ToastContextType | undefined>(ToastContext)

  if (context === undefined) {
    throw new Error("useToast debe ser usado dentro de un ToastProvider")
  }

  return { showToast: context.showToast }
}
