"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

interface Notification {
  id: string
  title: string
  message: string
  timestamp: Date
  read: boolean
  type: "emergency" | "task" | "info"
}

interface Maintenance {
  duration: React.JSX.Element
  completionDate: React.JSX.Element
  type: string
  technicianName: React.JSX.Element
  notes: ReactNode
  id: string
  clientId: string
  clientName: string
  address: string
  status: "scheduled" | "in-progress" | "completed"
  assignedTechId?: string
  scheduledDate: Date
  coordinates: {
    latitude: number
    longitude: number
  }
}

interface Invoice {
  date: string | number | Date
  id: string
  clientId: string
  amount: number
  status: "paid" | "pending" | "overdue"
  dueDate: Date
  description: string
}

interface AppContextType {
  notifications: Notification[]
  maintenances: Maintenance[]
  invoices: Invoice[]
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markNotificationAsRead: (id: string) => void
  clearNotifications: () => void
  updateMaintenanceStatus: (id: string, status: Maintenance["status"]) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useApp = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Emergency Maintenance",
      message: "Client reported elevator malfunction at Torre Tesla building",
      timestamp: new Date(),
      read: false,
      type: "emergency",
    },
    {
      id: "2",
      title: "Scheduled Maintenance",
      message: "You have been assigned to a new maintenance task tomorrow",
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      read: true,
      type: "task",
    },
  ])

  const [maintenances, setMaintenances] = useState<Maintenance[]>([
    {
      id: "1",
      clientId: "1001",
      clientName: "Torre Empresarial",
      address: "Av. La Encalada 1234, Lima",
      status: "scheduled",
      assignedTechId: "2",
      scheduledDate: new Date(Date.now() + 86400000), // tomorrow
      coordinates: {
        latitude: -12.0929,
        longitude: -76.9876,
      },
    },
    {
      id: "2",
      clientId: "1002",
      clientName: "Centro Comercial Plaza",
      address: "Av. Javier Prado 567, Lima",
      status: "in-progress",
      assignedTechId: "2",
      scheduledDate: new Date(),
      coordinates: {
        latitude: -12.0865,
        longitude: -77.0364,
      },
    },
  ])

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: "1001",
      clientId: "1001",
      amount: 2500.0,
      status: "paid",
      dueDate: new Date(Date.now() - 15 * 86400000), // 15 days ago
      description: "Monthly maintenance service - March 2024",
    },
    {
      id: "1002",
      clientId: "1001",
      amount: 2500.0,
      status: "pending",
      dueDate: new Date(Date.now() + 10 * 86400000), // 10 days from now
      description: "Monthly maintenance service - April 2024",
    },
    {
      id: "1003",
      clientId: "1002",
      amount: 1200.0,
      status: "overdue",
      dueDate: new Date(Date.now() - 5 * 86400000), // 5 days ago
      description: "Emergency repair service - Broken cable",
    },
  ])

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      read: false,
    }
    setNotifications((prevNotifications) => [newNotification, ...prevNotifications])
  }

  const markNotificationAsRead = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    )
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const updateMaintenanceStatus = (id: string, status: Maintenance["status"]) => {
    setMaintenances((prevMaintenances) =>
      prevMaintenances.map((maintenance) => (maintenance.id === id ? { ...maintenance, status } : maintenance)),
    )
  }

  return (
    <AppContext.Provider
      value={{
        notifications,
        maintenances,
        invoices,
        addNotification,
        markNotificationAsRead,
        clearNotifications,
        updateMaintenanceStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

