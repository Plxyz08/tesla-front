import { Ionicons } from "@expo/vector-icons"
import { useNavigation, DrawerActions } from "@react-navigation/native"
import { TouchableOpacity, StyleSheet } from "react-native"
import { useAuth } from "../context/AuthContext" // Importa el contexto de autenticación

// Botón flotante para abrir el menú
const FloatingMenuButton = () => {
  const navigation = useNavigation()
  const { user } = useAuth() // Obtén el usuario desde el contexto de autenticación

  // Solo mostrar el botón si el usuario es administrador
  if (user?.role !== "admin") {
    return null
  }

  return (
    <TouchableOpacity
      style={styles.floatingButton}
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
    backgroundColor: "#7c3aed",
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
})

export default FloatingMenuButton