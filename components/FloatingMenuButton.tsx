"use client"

import { Ionicons } from "@expo/vector-icons"
import { useNavigation, DrawerActions } from "@react-navigation/native"
import { TouchableOpacity, StyleSheet } from "react-native"
import { useAuth } from "../context/AuthContext"

// Botón flotante para abrir el menú
const FloatingMenuButton = () => {
  const navigation = useNavigation()
  const { user } = useAuth()

  // Mostrar el botón para todos los usuarios, ya que ahora todos usan Drawer
  return (
    <TouchableOpacity
      style={[
        styles.floatingButton,
        // Colores diferentes según el rol
        user?.role === "admin"
          ? styles.adminButton
          : user?.role === "technician"
            ? styles.technicianButton
            : styles.clientButton,
      ]}
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
    >
      <Ionicons name="menu" size={24} color="white" />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  adminButton: {
    backgroundColor: "#7c3aed", // Violeta para admin (original)
  },
  technicianButton: {
    backgroundColor: "#059669", // Verde para técnicos
  },
  clientButton: {
    backgroundColor: "#f7be0d", // Amarillo para clientes
  },
})

export default FloatingMenuButton

