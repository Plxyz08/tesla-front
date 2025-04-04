import { MD3LightTheme as DefaultTheme } from "react-native-paper"

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#7c3aed", // Morado principal
    primaryContainer: "#f5f3ff",
    secondary: "#0ea5e9", // Azul secundario
    secondaryContainer: "#e0f2fe",
    tertiary: "#10b981", // Verde para éxito
    tertiaryContainer: "#dcfce7",
    error: "#ef4444", // Rojo para errores
    errorContainer: "#fee2e2",
    background: "#f9fafb",
    surface: "#ffffff",
    surfaceVariant: "#f3f4f6",
    onSurface: "#1f2937",
    onSurfaceVariant: "#6b7280",
    outline: "#e5e7eb",
    // Añadimos el color amarillo para clientes
    clientPrimary: "#f7be0d", // Color amarillo para clientes
  },
}

