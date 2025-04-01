"use client"

import type React from "react"
import { useEffect } from "react"
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Button } from "react-native-paper"
import Animated, { FadeIn } from "react-native-reanimated"

const { width } = Dimensions.get("window")

interface ErrorMessageProps {
  visible: boolean
  title: string
  message: string
  onClose: () => void
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ visible, title, message, onClose }) => {
  // Auto-close after 5 seconds
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [visible, onClose])

  if (!visible) return null

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={32} color="white" />
            </View>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.messageText}>{message}</Text>

            <Button
              mode="contained"
              onPress={onClose}
              style={styles.closeButton}
              contentStyle={styles.closeButtonContent}
              buttonColor="#ef4444"
            >
              Cerrar
            </Button>
          </View>

          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Ionicons name="close-circle" size={28} color="#9ca3af" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#ef4444",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: 20,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  messageText: {
    fontSize: 15,
    color: "#4b5563",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  closeButton: {
    borderRadius: 8,
  },
  closeButtonContent: {
    height: 48,
  },
  closeIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
})

export default ErrorMessage

