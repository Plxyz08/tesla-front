import { Text, StyleSheet, ActivityIndicator, Image } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

export default function LoadingScreen() {
  return (
    <LinearGradient colors={["#0284c7", "#0369a1"]} style={styles.container}>
      <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
      <ActivityIndicator size="large" color="white" style={styles.loader} />
      <Text style={styles.text}>Cargando...</Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 40,
    tintColor: "white",
  },
  loader: {
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },
})

