"use client"

import type React from "react"
import { View, StyleSheet } from "react-native"
import { useContext } from "react"
import { ToastContext } from "../context/ToastContext"
import { Toast } from "./Toast"

export const ToastContainer: React.FC = () => {
  const context = useContext(ToastContext)

  if (!context || !context.toast) {
    return null
  }

  return (
    <View style={styles.container}>
      <Toast
        type={context.toast.type}
        title={context.toast.title}
        message={context.toast.message}
        onHide={context.hideToast}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
})
