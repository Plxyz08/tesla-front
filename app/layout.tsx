import type { Metadata } from 'next'
import './globals.css'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../context/AuthContext'
import { NotificationProvider } from '../context/NotificationContext'
import { AppProvider } from '../context/AppContext'

export const metadata: Metadata = {
  title: 'Tesla Lift',
  description: 'App for managing elevator maintenance',
  generator: 'Sebastian Muñoz',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <SafeAreaProvider>
          <AuthProvider>
            <AppProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </AppProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </body>
    </html>
  )
}