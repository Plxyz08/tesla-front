"use client"

import type React from "react"
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../context/AuthContext"

interface AppHeaderProps {
  title: string
  showBackButton?: boolean
  showProfileButton?: boolean
  rightComponent?: React.ReactNode
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton = false,
  showProfileButton = true,
  rightComponent,
}) => {
  const navigation = useNavigation<any>()
  const { user } = useAuth()

  // Determinar el color según el rol del usuario
  const headerColor =
    user?.role === "admin"
      ? "#7c3aed" // Morado para admin
      : user?.role === "technician"
        ? "#059669" // Verde para técnicos
        : "#efb810" // Dorado para clientes

  return (
    <>
      <StatusBar backgroundColor={headerColor} barStyle="light-content" />
      <View style={[styles.header, { backgroundColor: headerColor }]}>
        <View style={styles.leftContainer}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>Bienvenido</Text>
            <Text style={styles.subTitle}>Tesla Lift App</Text>
          </View>
        </View>

        <View style={styles.rightContainer}>
          {rightComponent}
          {showProfileButton && (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate("Profile")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.profileIconContainer}>
                <Ionicons name="person" size={18} color={headerColor} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 50,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  subTitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  profileButton: {
    marginLeft: 12,
  },
  profileIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
})

export default AppHeader
