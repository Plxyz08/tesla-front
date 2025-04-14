"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Linking, Alert } from "react-native"
import { Button } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNotification } from "../../context/NotificationContext"
import type { Audio } from "expo-av"

// Emergency phone numbers
const EMERGENCY_NUMBERS = {
  main: "+51999888777",
  alternate: "+51999888666",
}

export default function ClientEmergencyScreen() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [sound, setSound] = useState<Audio.Sound | null>(null)

  const { sendPushNotification } = useNotification()

  // Simulate getting location
  useEffect(() => {
    const getLocation = async () => {
      // In a real app, this would use Expo Location
      setLocation({
        latitude: -12.0464,
        longitude: -77.0428,
      })
    }

    getLocation()
  }, [])

  const handleEmergencyCall = async () => {
    // Notificar a los técnicos y administradores
    sendPushNotification("EMERGENCIA: Atrapamiento en ascensor", "Se requiere asistencia inmediata", {
      type: "emergency",
      location: location,
      timestamp: new Date().toISOString(),
    })

    // Redirigir al usuario a la aplicación de teléfono marcando el 911
    Linking.openURL(`tel:911`).catch((err) => {
      Alert.alert("Error", "No se pudo iniciar la llamada", [{ text: "OK" }])
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.warningContainer}>
          <Ionicons name="alert-circle" size={80} color="#f43f5e" />
          <Text style={styles.warningTitle}>Llamada de Emergencia</Text>
          <Text style={styles.warningText}>
            Use esta función SOLO en caso de atrapamiento en ascensor u otra emergencia grave.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            buttonColor="#f43f5e"
            onPress={handleEmergencyCall}
            style={styles.emergencyButton}
            icon="alarm-light"
          >
            Hacer Llamada de Emergencia
          </Button>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Mantenga la calma mientras la ayuda va en camino</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff1f2",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  warningContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f43f5e",
    marginVertical: 16,
  },
  warningText: {
    textAlign: "center",
    color: "#9f1239",
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  emergencyButton: {
    width: "100%",
    paddingVertical: 8,
    borderRadius: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: "#ffe4e6",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#fecdd3",
  },
  footerText: {
    color: "#9f1239",
    textAlign: "center",
    fontSize: 12,
  },
})

