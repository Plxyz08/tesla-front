"use client"

import { Ionicons } from "@expo/vector-icons"
import { useNavigation, DrawerActions } from "@react-navigation/native"
import { TouchableOpacity, StyleSheet, View } from "react-native"
import { useAuth } from "../context/AuthContext"

// Botón flotante para abrir el menú
const FloatingMenuButton = () => {
  const navigation = useNavigation()
  const { user } = useAuth()

  // Determinar el color según el rol del usuario
  const buttonColor =
    user?.role === "admin"
      ? "#7c3aed" // Morado para admin
      : user?.role === "technician"
        ? "#059669" // Verde para técnicos
        : "#efb810" // Dorado para clientes

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: buttonColor }]}
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 15, // Elevarlo un poco sobre la barra de navegación
  },
})

export default FloatingMenuButton

