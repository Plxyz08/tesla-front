"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import { useAuth } from "./AuthContext"

interface NotificationContextType {
  expoPushToken: string | null
  sendPushNotification: (title: string, body: string, data?: Record<string, unknown>) => Promise<void>
  requestPermissions: () => Promise<boolean>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const { user } = useAuth()

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      })
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!")
      return false
    }

    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data
      setExpoPushToken(token)
      console.log("Push token:", token)
      return true
    } catch (error) {
      console.error("Error getting push token:", error)
      return false
    }
  }

  useEffect(() => {
    if (user) {
      requestPermissions()
    }
  }, [user]) // Removed requestPermissions from dependencies

  const sendPushNotification = async (title: string, body: string, data: Record<string, unknown> = {}) => {
    if (!expoPushToken) {
      console.log("No expo push token available")
      return
    }

    const message = {
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data,
    }

    try {
      // In a real app, you would send this to your push notification service
      console.log("Would send push notification:", message)

      // For demo purposes, we'll show a local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // immediately
      })
    } catch (error) {
      console.error("Error sending push notification:", error)
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        sendPushNotification,
        requestPermissions,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

