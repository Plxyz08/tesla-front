"use client"

import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { useAuth } from "../context/AuthContext"
import { Ionicons } from "@expo/vector-icons"
import { View, Text, StyleSheet, Platform } from "react-native"
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer"
import FloatingMenuButton from "../components/FloatingMenuButton"
import { DrawerActions } from "@react-navigation/native"

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
import EditReportScreen from "../screens/admin/EditReport"
import MeetingRequestsList from "../screens/admin/MeetingRequestsList" // Importamos la nueva pantalla

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
  color: "#f7be0d", // Cambiado de #0284c7 a #f7be0d
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

// Custom Drawer Content
function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  )
}

// Drawer para opciones adicionales del Cliente
const ClientDrawerNavigator = () => (
  <Drawer.Navigator
    screenOptions={{
      drawerStyle: {
        backgroundColor: "#f9fafb",
        width: 240,
      },
      drawerActiveTintColor: "#efb810",
      drawerInactiveTintColor: "#64748b",
      headerShown: false,
    }}
    drawerContent={(props) => <CustomDrawerContent {...props} />}
  >
    <Drawer.Screen
      name="ClientTabsScreen"
      component={ClientTabNavigator}
      options={{
        title: "Tesla Lift",
        drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Request"
      component={ClientRequestScreen}
      options={{
        title: "Servicios",
        drawerIcon: ({ color, size }) => <Ionicons name="construct-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Emergency"
      component={ClientEmergencyScreen}
      options={{
        title: "Emergencia",
        drawerIcon: ({ color, size }) => <Ionicons name="alert-circle-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="ScheduleMeeting"
      component={ScheduleMeetingScreen}
      options={{
        title: "Programar Reunión",
        drawerIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="MaintenanceHistory"
      component={MaintenanceHistoryScreen}
      options={{
        title: "Historial de Mantenimientos",
        drawerIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{
        title: "Notificaciones",
        drawerIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: "Perfil",
        drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
      }}
    />
  </Drawer.Navigator>
)

// Drawer para opciones adicionales del Técnico
const TechnicianDrawerNavigator = () => (
  <Drawer.Navigator
    screenOptions={{
      drawerStyle: {
        backgroundColor: "#f9fafb",
        width: 240,
      },
      drawerActiveTintColor: "#059669",
      drawerInactiveTintColor: "#64748b",
      headerShown: false,
    }}
    drawerContent={(props) => <CustomDrawerContent {...props} />}
  >
    <Drawer.Screen
      name="TechnicianTabsScreen"
      component={TechnicianTabNavigator}
      options={{
        title: "Tesla Lift",
        drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Tiempo"
      component={TimeHistoryScreen}
      options={{
        title: "Historial de Tiempo",
        drawerIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Lista"
      component={ReportsListScreen}
      options={{
        title: "Lista de Reportes",
        drawerIcon: ({ color, size }) => <Ionicons name="clipboard-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{
        title: "Notificaciones",
        drawerIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: "Perfil",
        drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
      }}
    />
  </Drawer.Navigator>
)

// Drawer para opciones adicionales del Admin
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
    drawerContent={(props) => <CustomDrawerContent {...props} />}
  >
    <Drawer.Screen
      name="AdminTabsScreen"
      component={AdminTabNavigator}
      options={{
        title: "Tesla Lift",
        drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
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
      name="MeetingRequests"
      component={MeetingRequestsList}
      options={{
        title: "Solicitudes de Reuniones",
        drawerIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{
        title: "Notificaciones",
        drawerIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
      }}
    />
    <Drawer.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: "Perfil",
        drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
      }}
    />
  </Drawer.Navigator>
)

// Cliente Tab Navigator (Nuevo diseño con 5 tabs)
const ClientTabNavigator = () => {
  const { user } = useAuth()
  const activeColor = "#efb810" // Color dorado para clientes

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: "#9ca3af",
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={ClientDashboardScreen}
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused, color }) => <TabBarIcon focused={focused} color={color} name="home" />,
          tabBarLabel: ({ focused, color }) => <TabBarLabel focused={focused} color={color} label="Inicio" />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={ClientAccountScreen}
        options={{
          title: "Estado",
          tabBarIcon: ({ focused, color }) => <TabBarIcon focused={focused} color={color} name="document-text" />,
          tabBarLabel: ({ focused, color }) => <TabBarLabel focused={focused} color={color} label="Estado" />,
        }}
      />
      <Tab.Screen
        name="MenuButton"
        component={View}
        options={{
          tabBarButton: () => <FloatingMenuButton />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault()
            navigation.dispatch(DrawerActions.openDrawer())
          },
        })}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: "Mapa",
          tabBarIcon: ({ focused, color }) => <TabBarIcon focused={focused} color={color} name="map" />,
          tabBarLabel: ({ focused, color }) => <TabBarLabel focused={focused} color={color} label="Mapa" />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused, color }) => <TabBarIcon focused={focused} color={color} name="person" />,
          tabBarLabel: ({ focused, color }) => <TabBarLabel focused={focused} color={color} label="Perfil" />,
        }}
      />
    </Tab.Navigator>
  )
}

// Técnico Tab Navigator (Nuevo diseño con 5 tabs)
const TechnicianTabNavigator = () => {
  const { user } = useAuth()
  const activeColor = "#059669" // Color verde para técnicos

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: "#9ca3af",
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={TechnicianDashboardScreen}
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused, color }) => <TabBarIcon focused={focused} color={color} name="home" />,
          tabBarLabel: ({ focused, color }) => <TabBarLabel focused={focused} color={color} label="Inicio" />,
        }}
      />
      <Tab.Screen
        name="Reportes"
        component={CreateReportScreen}
        options={{
          title: "Crear",
          tabBarIcon: ({ focused, color }) => <TabBarIcon focused={focused} color={color} name="document" />,
          tabBarLabel: ({ focused, color }) => <TabBarLabel focused={focused} color={color} label="Crear" />,
        }}
      />
      <Tab.Screen
        name="MenuButton"
        component={View}
        options={{
          tabBarButton: () => <FloatingMenuButton />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault()
            navigation.dispatch(DrawerActions.openDrawer())
          },
        })}
      />
      <Tab.Screen
        name="Detalles"
        component={ReportDetailScreen}
        options={{
          title: "Detalles",
          tabBarIcon: ({ focused, color }) => <TabBarIcon focused={focused} color={color} name="document-text" />,
          tabBarLabel: ({ focused, color }) => <TabBarLabel focused={focused} color={color} label="Detalles" />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused, color }) => <TabBarIcon focused={focused} color={color} name="person" />,
          tabBarLabel: ({ focused, color }) => <TabBarLabel focused={focused} color={color} label="Perfil" />,
        }}
      />
    </Tab.Navigator>
  )
}

// Admin Tab Navigator (Nuevo diseño con 5 tabs)
const AdminTabNavigator = () => {
  const { user } = useAuth()
  const activeColor = "#7c3aed" // Color morado para admin

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: "#9ca3af",
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused, color }) => <TabBarIcon focused={focused} color={color} name="home" />,
          tabBarLabel: ({ focused, color }) => <TabBarLabel focused={focused} color={color} label="Inicio" />,
        }}
      />
      <Tab.Screen
        name="ClientsList"
        component={ClientsList}
        options={{
          title: "Clientes",
          tabBarIcon: ({ focused, color }) => <TabBarIcon focused={focused} color={color} name="people" />,
          tabBarLabel: ({ focused, color }) => <TabBarLabel focused={focused} color={color} label="Clientes" />,
        }}
      />
      <Tab.Screen
        name="MenuButton"
        component={View}
        options={{
          tabBarButton: () => <FloatingMenuButton />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault()
            navigation.dispatch(DrawerActions.openDrawer())
          },
        })}
      />
      <Tab.Screen
        name="TechniciansList"
        component={TechniciansList}
        options={{
          title: "Técnicos",
          tabBarIcon: ({ focused, color }) => <TabBarIcon focused={focused} color={color} name="construct" />,
          tabBarLabel: ({ focused, color }) => <TabBarLabel focused={focused} color={color} label="Técnicos" />,
        }}
      />
      <Tab.Screen
        name="MeetingRequests"
        component={MeetingRequestsList}
        options={{
          title: "Reuniones",
          tabBarIcon: ({ focused, color }) => <TabBarIcon focused={focused} color={color} name="calendar" />,
          tabBarLabel: ({ focused, color }) => <TabBarLabel focused={focused} color={color} label="Reuniones" />,
        }}
      />
    </Tab.Navigator>
  )
}

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
          {user.role === "client" && <Stack.Screen name="ClientDrawer" component={ClientDrawerNavigator} />}
          {user.role === "technician" && <Stack.Screen name="TechnicianDrawer" component={TechnicianDrawerNavigator} />}
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
            <Stack.Screen
              name="MeetingRequests"
              component={MeetingRequestsList}
              options={{
                title: "Solicitudes de Reuniones",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                title: "Perfil",
                headerShown: false,
              }}
            />
          </Stack.Group>

          {/* Pantallas específicas de administrador */}
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="EditReport" component={EditReportScreen} />
          </Stack.Group>
        </>
      )}
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingTop: 5,
    paddingBottom: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
