import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { AuthProvider } from "./context/AuthContext"
import LoginScreen from "./screens/auth/LoginScreen"
import DashboardScreen from "./screens/admin/DashboardScreen"
import { ClientsList } from "./screens/admin/ClientsList"
import { Home, Users, Calendar } from "lucide-react-native"
import { ToastContainer } from "./components/ToastContainer"
import { ToastProvider } from "./context/ToastContext"
const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  )
}

const AdminTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Dashboard") {
            return <Home size={size} color={color} />
          } else if (route.name === "Clients") {
            return <Users size={size} color={color} />
          } else if (route.name === "Schedule") {
            return <Calendar size={size} color={color} />
          }
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Clients" component={ClientsList} />
    </Tab.Navigator>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ClientsList" component={ClientsList} />
            {/* Agregar otras pantallas según sea necesario */}
          </Stack.Navigator>
          <ToastContainer />
        </NavigationContainer>
      </ToastProvider>
    </AuthProvider>
  )
}
