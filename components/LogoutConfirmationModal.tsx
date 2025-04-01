import type React from "react"
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Button } from "react-native-paper"
import Animated, { FadeIn } from "react-native-reanimated"

const { width } = Dimensions.get("window")

interface LogoutConfirmationModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: () => void
  userName: string
}

const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({ visible, onClose, onConfirm, userName }) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Ionicons name="log-out" size={32} color="#ef4444" />
            <Text style={styles.headerText}>Cerrar Sesión</Text>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.messageText}>
              <Text style={styles.userNameText}>{userName}</Text>, ¿estás seguro de que deseas cerrar sesión?
            </Text>

            <Text style={styles.infoText}>
              Al cerrar sesión, tendrás que volver a introducir tus credenciales para acceder a tu cuenta.
            </Text>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={onClose}
                style={styles.cancelButton}
                contentStyle={styles.buttonContent}
                textColor="#6b7280"
              >
                Cancelar
              </Button>

              <Button
                mode="contained"
                onPress={onConfirm}
                style={styles.confirmButton}
                contentStyle={styles.buttonContent}
                buttonColor="#ef4444"
              >
                Cerrar Sesión
              </Button>
            </View>
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
    flexDirection: "row",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginLeft: 12,
  },
  modalContent: {
    padding: 20,
  },
  messageText: {
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  userNameText: {
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    borderColor: "#d1d5db",
  },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
  },
  buttonContent: {
    height: 48,
  },
  closeIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
})

export default LogoutConfirmationModal

