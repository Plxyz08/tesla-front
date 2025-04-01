import type React from "react"
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Button } from "react-native-paper"

interface FutureFeatureModalProps {
  visible: boolean
  title: string
  message: string
  icon?: keyof typeof Ionicons.glyphMap
  releaseDate?: string
  onClose: () => void
  onContact?: () => void
}

const FutureFeatureModal: React.FC<FutureFeatureModalProps> = ({
  visible,
  title,
  message,
  icon = "time",
  releaseDate,
  onClose,
  onContact,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color="#6b7280" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={48} color="#0284c7" />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {releaseDate && (
            <View style={styles.releaseDateContainer}>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
              <Text style={styles.releaseDate}>Disponible {releaseDate}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Button mode="outlined" onPress={onClose} style={[styles.closeAction, { marginRight: onContact ? 8 : 0 }]} textColor="#6b7280">
              Entendido
            </Button>

            {onContact && (
              <Button
                mode="contained"
                onPress={onContact}
                style={styles.contactAction}
                buttonColor="#0284c7"
                icon="headset"
              >
                Contactar
              </Button>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  releaseDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  releaseDate: {
    fontSize: 14,
    color: "#4b5563",
    marginLeft: 8,
  },
  actions: {
    flexDirection: "row",
    width: "100%",
  },
  closeAction: {
    flex: 1,
  },
  contactAction: {
    flex: 1,
    marginLeft: 8,
  },
})

export default FutureFeatureModal

