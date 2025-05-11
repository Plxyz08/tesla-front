import "./polyfills" // Importa el polyfill al inicio y asegúrate de que se ejecute primero
import { NavigationContainer } from "@react-navigation/native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider } from "./context/AuthContext"
import { NotificationProvider } from "./context/NotificationContext"
import AppNavigator from "./navigation/AppNavigator"
import { StatusBar } from "expo-status-bar"
import { AppProvider } from "./context/AppContext"
import { Provider as PaperProvider } from "react-native-paper"
import { theme } from "./theme"

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <AppProvider>
            <NotificationProvider>
              <NavigationContainer>
                <StatusBar style="auto" />
                <AppNavigator />
              </NavigationContainer>
            </NotificationProvider>
          </AppProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  )
}

