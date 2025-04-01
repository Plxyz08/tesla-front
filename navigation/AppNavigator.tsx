"use client"

import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { useAuth } from "../context/AuthContext"
import { Ionicons } from "@expo/vector-icons"
import { View, Text, StyleSheet, Platform } from "react-native"
import { createDrawerNavigator } from "@react-navigation/drawer"


// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen"
import RegisterScreen from "../screens/auth/RegisterScreen"

// Client Screens
import ClientDashboardScreen from "../screens/client/DashboardScreen"
import ClientAccountScreen from "../screens/client/AccountScreen"
import ClientRequestScreen from "../screens/client/RequestScreen"
import ClientEmergencyScreen from "../screens/client/EmergencyScreen"
import ScheduleMeetingScreen from "../screens/client/ScheduleMeetingScreen"
import MaintenanceHistoryScreen from "../screens/client/MaintenanceHistoryScreen"

// Technician Screens
import TechnicianDashboardScreen from "../screens/technician/DashboardScreen"
import TimeHistoryScreen from "../screens/technician/TimeHistoryScreen"
import CreateReportScreen from "../screens/technician/CreateReportScreen"
import ReportDetailScreen from "../screens/technician/ReportDetailScreen"
import ReportsListScreen from "../screens/technician/ReportsListScreen"

// Admin Screens
import AdminDashboardScreen from "../screens/admin/DashboardScreen"
import TechniciansList from "../screens/admin/TechniciansList"
import ClientsList from "../screens/admin/ClientsList"
import AdminReportsListScreen from "../screens/admin/ReportsList"
import AdminReportDetailScreen from "../screens/admin/ReportDetail"
import EditReportScreen from "../screens/admin/EditReport"
import ReportsModule from "../screens/admin/ReportsModule"
import CreateReport from "../screens/admin/CreateReportScreen"

// Shared Screens
import MapScreen from "../screens/shared/MapScreen"
import NotificationsScreen from "../screens/shared/NotificationsScreen"
import ProfileScreen from "../screens/shared/ProfileScreen"
import LoadingScreen from "../screens/shared/LoadingScreen"

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const headerTitleStyle = {
  fontSize: 20,
  fontWeight: "700" as const,
  color: "#0284c7",
}

const Drawer = createDrawerNavigator()

// Auth Navigator
const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
)

// Custom Tab Bar Icon
type IoniconsName = keyof typeof Ionicons.glyphMap

const TabBarIcon = ({ focused, color, name }: { focused: boolean; color: string; name: IoniconsName }) => {
  return (
    <View style={styles.tabIconContainer}>
      <Ionicons name={focused ? name : (`${name}-outline` as IoniconsName)} size={24} color={color} />
    </View>
  )
}

// Custom Tab Bar Label
const TabBarLabel = ({ focused, color, label }: { focused: boolean; color: string; label: string }) => {
  return <Text style={[styles.tabLabel, { color, opacity: focused ? 1 : 0.8 }]}>{label}</Text>
}

// Client Tab Navigator
const ClientTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color }) => {
        let iconName: IoniconsName = "home"

        if (route.name === "Dashboard") {
          iconName = "home"
        } else if (route.name === "Account") {
          iconName = "document-text"
        } else if (route.name === "Request") {
          iconName = "construct"
        } else if (route.name === "Map") {
          iconName = "map"
        } else if (route.name === "Profile") {
          iconName = "person"
        }

        return <TabBarIcon focused={focused} color={color} name={iconName} />
      },
      tabBarLabel: ({ focused, color }) => {
        let label

        if (route.name === "Dashboard") {
          label = "Inicio"
        } else if (route.name === "Account") {
          label = "Cuenta"
        } else if (route.name === "Request") {
          label = "Servicios"
        } else if (route.name === "Map") {
          label = "Ubicación"
        } else if (route.name === "Profile") {
          label = "Perfil"
        }

        return <TabBarLabel focused={focused} color={color} label={label || ""} />
      },
      tabBarActiveTintColor: "#0284c7",
      tabBarInactiveTintColor: "#64748b",
      tabBarStyle: styles.tabBar,
      headerTitleStyle,
      tabBarShowLabel: true,
      tabBarHideOnKeyboard: true,
      headerShadowVisible: false,
    })}
  >
    <Tab.Screen name="Dashboard" component={ClientDashboardScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Account" component={ClientAccountScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Request" component={ClientRequestScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Map" component={MapScreen} options={{ title: "Ubicación" }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
  </Tab.Navigator>
)

// Technician Tab Navigator
const TechnicianTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color }) => {
        let iconName: IoniconsName = "home"

        if (route.name === "Inicio") {
          iconName = "home"
        } else if (route.name === "Maintenance") {
          iconName = "build"
        } else if (route.name === "TimeTracking") {
          iconName = "time"
        } else if (route.name === "Detalles") {
          iconName = "document-text"
        } else if (route.name === "Profile") {
          iconName = "person"
        } else if (route.name === "Lista") {
          iconName = "clipboard"
        } else if (route.name === "Tiempo") {
          iconName = "time"
        } else if (route.name === "Reportes") {
          iconName = "document"
        }

        return <TabBarIcon focused={focused} color={color} name={iconName} />
      },
      tabBarActiveTintColor: "#059669",
      tabBarInactiveTintColor: "#64748b",
      tabBarStyle: styles.tabBar,
      headerTitleStyle,
    })}
  >
    <Tab.Screen name="Inicio" component={TechnicianDashboardScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Tiempo" component={TimeHistoryScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Reportes" component={CreateReportScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Lista" component={ReportsListScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Detalles" component={ReportDetailScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
  </Tab.Navigator>
)

// Admin Tab Navigator
const AdminDrawerNavigator = () => (
  <Drawer.Navigator
    screenOptions={{
      drawerStyle: {
        backgroundColor: "#f9fafb",
        width: 240,
      },
      drawerActiveTintColor: "#7c3aed",
      drawerInactiveTintColor: "#64748b",
      headerShown: false,
    }}
  >
    <Drawer.Screen
      name="Dashboard"
      component={AdminDashboardScreen}
      options={{
        title: "Inicio",
        drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="TechniciansList"
      component={TechniciansList}
      options={{
        title: "Técnicos",
        drawerIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="ClientsList"
      component={ClientsList}
      options={{
        title: "Clientes",
        drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="ReportsList"
      component={AdminReportsListScreen}
      options={{
        title: "Lista de Reportes",
        drawerIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Reportes"
      component={CreateReport}
      options={{
        title: "Crear Reporte",
        drawerIcon: ({ color, size }) => <Ionicons name="create-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="ReportsModule"
      component={ReportsModule}
      options={{
        title: "Módulo de Informes",
        drawerIcon: ({ color, size }) => <Ionicons name="analytics-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Detalles"
      component={AdminReportDetailScreen}
      options={{
        title: "Detalles del Reporte",
        drawerIcon: ({ color, size }) => <Ionicons name="information-circle-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: "Perfil",
        drawerIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
      }}
    />
  </Drawer.Navigator>
)

// Main Navigator
const AppNavigator = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          {user.role === "client" && <Stack.Screen name="ClientTabs" component={ClientTabNavigator} />}
          {user.role === "technician" && <Stack.Screen name="TechnicianTabs" component={TechnicianTabNavigator} />}
          {user.role === "admin" && <Stack.Screen name="AdminDrawer" component={AdminDrawerNavigator} />}

          {/* Pantallas comunes */}
          <Stack.Group
            screenOptions={{
              presentation: "modal",
              headerShown: true,
              headerTitleStyle,
              headerStyle: styles.modalHeader,
              headerTitleAlign: "center",
            }}
          >
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notificaciones" }} />
            <Stack.Screen
              name="Emergency"
              component={ClientEmergencyScreen}
              options={{
                title: "Emergencia",
                headerStyle: { backgroundColor: "#fecdd3" },
              }}
            />
            <Stack.Screen
              name="ScheduleMeeting"
              component={ScheduleMeetingScreen}
              options={{
                title: "Programar Reunión",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="MaintenanceHistory"
              component={MaintenanceHistoryScreen}
              options={{
                title: "Historial de Mantenimientos",
                headerShown: false,
              }}
            />
          </Stack.Group>

          {/* Pantallas específicas de administrador */}
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ReportDetail" component={AdminReportDetailScreen} />
            <Stack.Screen name="EditReport" component={EditReportScreen} />
            <Stack.Screen name="CreateReport" component={CreateReportScreen} />
          </Stack.Group>
        </>
      )}
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    paddingTop: 5,
    paddingBottom: 8,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: -2,
  },
  modalHeader: {
    backgroundColor: "white",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
})

export default AppNavigator