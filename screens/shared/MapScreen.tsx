"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native"
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Callout,
  Circle,
  Polyline,
  type MapStyleElement,
  type Region,
} from "react-native-maps"
import { Chip, Divider, Badge } from "react-native-paper"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { useAuth } from "../../context/AuthContext"
import { useApp } from "../../context/AppContext"
import * as Location from "expo-location"
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"

// Custom map style - dark mode inspired
const customMapStyle: MapStyleElement[] = [
  {
    elementType: "geometry",
    stylers: [
      {
        color: "#f5f5f5",
      },
    ],
  },
  {
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#f5f5f5",
      },
    ],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#bdbdbd",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [
      {
        color: "#eeeeee",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [
      {
        color: "#e5e5e5",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [
      {
        color: "#ffffff",
      },
    ],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      {
        color: "#dadada",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [
      {
        color: "#e5e5e5",
      },
    ],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [
      {
        color: "#eeeeee",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#c9c9c9",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
]

// Tesla office location
const TESLA_OFFICE = {
  latitude: -0.17617591857564552,
  longitude: -78.4877296074854,
  title: "Tesla Lift",
  description: "Edificio Metropolitan, Quito, Pichincha",
}

// Marker animation duration
const ANIMATION_DURATION = 300

export default function MapScreen() {
  const { user } = useAuth()
  const { maintenances } = useApp()
  const mapRef = useRef<MapView>(null)
  const insets = useSafeAreaInsets()

  // State variables
  const [filter, setFilter] = useState<string | null>(null)
  const [menuVisible, setMenuVisible] = useState(false)
  const [selectedMarker, setSelectedMarker] = useState<any>(null)
  const [initialRegion, setInitialRegion] = useState<Region | null>(null)
  const [userLocation, setUserLocation] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [routeToMarker, setRouteToMarker] = useState<any[]>([])
  const [distance, setDistance] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid">("standard")
  const [isMapReady, setIsMapReady] = useState(false)
  const [showInfoBubble, setShowInfoBubble] = useState(true)
  const [isProcessingAction, setIsProcessingAction] = useState(false)

  // Animated values
  const filterBarOpacity = useSharedValue(1)
  const infoCardHeight = useSharedValue(0)

  // Get user location on component mount
  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          setLocationError("Permiso para acceder a la ubicación fue denegado.")
          setIsLoading(false)
          return
        }

        // Show loading indicator for at least 1 second for better UX
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })

        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1000))

        // Wait for both promises to resolve
        await Promise.all([locationPromise, timeoutPromise])

        const location = await locationPromise

        setInitialRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        })
        setUserLocation(location.coords)
      } catch (error) {
        console.error("Error getting location:", error)
        setLocationError("No se pudo obtener tu ubicación. Por favor verifica los permisos de ubicación.")
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  // Filter markers based on selected filter
  const filteredMaintenances = useMemo(() => {
    return maintenances.filter((maintenance) => filter === null || filter === "all" || maintenance.status === filter)
  }, [maintenances, filter])

  // Handle filter change
  const handleFilterChange = useCallback(
    (newFilter: string | null) => {
      setFilter(newFilter)

      // Animate filter bar
      filterBarOpacity.value = withTiming(0.5, { duration: 200 })
      setTimeout(() => {
        filterBarOpacity.value = withTiming(1, { duration: 200 })
      }, 200)

      // If we clear filter, reset to show all maintenances
      if (!newFilter) {
        mapRef.current?.animateToRegion(initialRegion!, 1000)
        return
      }

      // Filter maintenances and fit map to show them
      const filteredMaintenances = maintenances.filter(
        (maintenance) => newFilter === "all" || maintenance.status === newFilter,
      )

      if (filteredMaintenances.length > 0) {
        // Fit map to show all filtered markers
        const coordinates = filteredMaintenances.map((m) => m.coordinates)
        coordinates.push(TESLA_OFFICE) // Always include office

        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
          animated: true,
        })
      }
    },
    [filterBarOpacity, initialRegion, maintenances],
  )

  // Get marker color based on status
  const getMarkerColor = useCallback((status: string) => {
    switch (status) {
      case "scheduled":
        return "#0ea5e9"
      case "in-progress":
        return "#f59e0b"
      case "completed":
        return "#10b981"
      default:
        return "#6b7280"
    }
  }, [])

  // Get status text based on status
  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case "scheduled":
        return "Programado"
      case "in-progress":
        return "En progreso"
      case "completed":
        return "Completado"
      default:
        return status
    }
  }, [])

  // Handle marker press
  const handleMarkerPress = useCallback(
    (marker: any) => {
      // Clear any existing route
      setRouteToMarker([])
      setDistance(null)
      setDuration(null)

      // Set selected marker with animation
      setSelectedMarker(null)

      // Small delay for animation
      setTimeout(() => {
        setSelectedMarker(marker)

        // Animate info card height
        infoCardHeight.value = withTiming(1, { duration: ANIMATION_DURATION })

        // Animate map to show marker
        if (marker.coordinates) {
          mapRef.current?.animateToRegion(
            {
              latitude: marker.coordinates.latitude,
              longitude: marker.coordinates.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            500,
          )
        } else if (marker.latitude) {
          mapRef.current?.animateToRegion(
            {
              latitude: marker.latitude,
              longitude: marker.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            500,
          )
        }
      }, 100)
    },
    [infoCardHeight],
  )

  // Go to user location
  const goToUserLocation = useCallback(() => {
    if (initialRegion) {
      mapRef.current?.animateToRegion(initialRegion, 1000)
    }
  }, [initialRegion])

  // Zoom to Tesla office
  const zoomToTeslaOffice = useCallback(() => {
    mapRef.current?.animateToRegion(
      {
        ...TESLA_OFFICE,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000,
    )
  }, [])

  // Handle call press
  const handleCallPress = useCallback(() => {
    if (isProcessingAction) return
    setIsProcessingAction(true)

    try {
      Linking.openURL(`tel:+593968100793`)
    } catch (error) {
      console.error("Error opening phone app:", error)
    } finally {
      // Reset processing state after a short delay
      setTimeout(() => {
        setIsProcessingAction(false)
      }, 300)
    }
  }, [isProcessingAction])

  // Calculate route between user and selected marker
  const calculateRoute = useCallback(() => {
    if (!userLocation || !selectedMarker || isProcessingAction) return

    setIsProcessingAction(true)

    try {
      // In a real app, this would use a routing API like Google Directions
      // For this demo, we'll create a simple straight line
      const startCoords = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      }

      const endCoords = selectedMarker.coordinates || {
        latitude: selectedMarker.latitude,
        longitude: selectedMarker.longitude,
      }

      // Create a simple route with start and end points
      setRouteToMarker([startCoords, endCoords])

      // Calculate approximate distance (in km) using Haversine formula
      const R = 6371 // Earth's radius in km
      const dLat = ((endCoords.latitude - startCoords.latitude) * Math.PI) / 180
      const dLon = ((endCoords.longitude - startCoords.longitude) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((startCoords.latitude * Math.PI) / 180) *
          Math.cos((endCoords.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = R * c

      setDistance(distance)

      // Estimate duration (assuming average speed of 30 km/h in city)
      const durationHours = distance / 30
      const durationMinutes = Math.round(durationHours * 60)

      setDuration(durationMinutes)

      // Fit map to show the entire route
      mapRef.current?.fitToCoordinates([startCoords, endCoords], {
        edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
        animated: true,
      })
    } catch (error) {
      console.error("Error calculating route:", error)
    } finally {
      // Reset processing state after a short delay
      setTimeout(() => {
        setIsProcessingAction(false)
      }, 300)
    }
  }, [userLocation, selectedMarker, isProcessingAction])

  // Toggle map type
  const toggleMapType = useCallback(() => {
    setMapType((current) => {
      switch (current) {
        case "standard":
          return "satellite"
        case "satellite":
          return "hybrid"
        default:
          return "standard"
      }
    })
  }, [])

  // Handle close info bubble
  const handleCloseInfoBubble = useCallback(() => {
    if (isProcessingAction) return
    setIsProcessingAction(true)

    setShowInfoBubble(false)

    // Reset processing state after a short delay
    setTimeout(() => {
      setIsProcessingAction(false)
    }, 300)
  }, [isProcessingAction])

  // Handle close marker info
  const handleCloseMarkerInfo = useCallback(() => {
    if (isProcessingAction) return
    setIsProcessingAction(true)

    setSelectedMarker(null)

    // Reset processing state after a short delay
    setTimeout(() => {
      setIsProcessingAction(false)
    }, 300)
  }, [isProcessingAction])

  // Animated styles
  const filterBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: filterBarOpacity.value,
      transform: [{ scale: filterBarOpacity.value }],
    }
  })

  const infoCardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(selectedMarker ? 0 : 100, { duration: ANIMATION_DURATION }),
        },
      ],
      opacity: withTiming(selectedMarker ? 1 : 0, { duration: ANIMATION_DURATION }),
    }
  })

  // Loading screen
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
        <Text style={styles.loadingSubtext}>Obteniendo tu ubicación</Text>
      </View>
    )
  }

  // Error screen
  if (locationError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="location" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Error de ubicación</Text>
        <Text style={styles.errorText}>{locationError}</Text>
        <TouchableOpacity
          style={styles.errorButtonContainer}
          onPress={() => Linking.openSettings()}
          activeOpacity={0.7}
        >
          <Text style={styles.errorButtonText}>Abrir Configuración</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Main map screen
  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion!}
        showsUserLocation={true}
        showsCompass={true}
        showsMyLocationButton={false}
        showsScale={true}
        showsTraffic={false}
        showsIndoors={true}
        showsBuildings={true}
        mapType={mapType}
        customMapStyle={customMapStyle}
        onMapReady={() => setIsMapReady(true)}
        onRegionChangeComplete={() => {
          // Hide info bubble after user interacts with map
          if (showInfoBubble) {
            setTimeout(() => setShowInfoBubble(false), 5000)
          }
        }}
      >
        {/* Tesla Lift Office Marker */}
        <Marker coordinate={TESLA_OFFICE} onPress={() => handleMarkerPress({ ...TESLA_OFFICE, type: "office" })}>
          <View style={styles.officeMarkerContainer}>
            <BlurView intensity={80} style={styles.officeMarkerBlur}>
              <MaterialIcons name="business" size={24} color="#0284c7" />
            </BlurView>
          </View>
          <Callout>
            <View style={styles.calloutContainer}>
              <Text style={styles.calloutTitle}>{TESLA_OFFICE.title}</Text>
              <Text style={styles.calloutDescription}>{TESLA_OFFICE.description}</Text>
            </View>
          </Callout>
        </Marker>

        {/* Maintenance Markers */}
        {isMapReady &&
          user?.role === "admin" &&
          filteredMaintenances.map((maintenance) => (
            <Marker
              key={maintenance.id}
              coordinate={maintenance.coordinates}
              onPress={() => handleMarkerPress({ ...maintenance, type: "maintenance" })}
            >
              <Animated.View style={styles.maintenanceMarkerContainer} entering={FadeIn.duration(300).delay(200)}>
                <View style={[styles.maintenanceMarker, { backgroundColor: getMarkerColor(maintenance.status) }]}>
                  <Ionicons name="construct" size={18} color="white" />
                </View>
                <View style={[styles.markerShadow, { backgroundColor: getMarkerColor(maintenance.status) }]} />
              </Animated.View>
              <Callout>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{maintenance.clientName}</Text>
                  <Text style={styles.calloutDescription}>{maintenance.address}</Text>
                </View>
              </Callout>
            </Marker>
          ))}

        {/* Tech location (for Admin) */}
        {isMapReady && user?.role === "admin" && (
          <Marker
            coordinate={{
              latitude: -12.0584,
              longitude: -77.0348,
            }}
          >
            <Animated.View style={styles.techMarkerContainer} entering={FadeIn.duration(300).delay(300)}>
              <View style={styles.techMarker}>
                <Ionicons name="person" size={18} color="white" />
              </View>
              <View style={styles.techMarkerShadow} />
            </Animated.View>
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>Técnico: Juan Pérez</Text>
              </View>
            </Callout>
          </Marker>
        )}

        {/* User location marker with accuracy circle */}
        {isMapReady && userLocation && (
          <>
            <Circle
              center={userLocation}
              radius={100}
              fillColor="rgba(2, 132, 199, 0.1)"
              strokeColor="rgba(2, 132, 199, 0.3)"
              strokeWidth={1}
            />
            <Marker coordinate={userLocation} onPress={() => handleMarkerPress({ type: "user" })}>
              <View style={styles.userMarkerContainer}>
                <View style={styles.userMarkerBackground}>
                  <Ionicons name="person" size={20} color="white" />
                </View>
                <View style={styles.userMarkerRing} />
              </View>
              <Callout>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>Mi Ubicación</Text>
                </View>
              </Callout>
            </Marker>
          </>
        )}

        {/* Route line between user and selected marker */}
        {routeToMarker.length > 0 && (
          <Polyline coordinates={routeToMarker} strokeWidth={4} strokeColor="#0284c7" lineDashPattern={[1, 3]} />
        )}
      </MapView>

      {/* Overlay to prevent map interactions when info card is open */}
      {selectedMarker && (
        <TouchableWithoutFeedback onPress={handleCloseMarkerInfo}>
          <View style={styles.mapOverlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Info Bubble - Only shown initially */}
      {showInfoBubble && (
        <Animated.View
          style={[styles.infoBubble, { top: insets.top + 10 }]}
          entering={FadeIn.duration(500).delay(500)}
          exiting={FadeOut.duration(300)}
        >
          <BlurView intensity={80} style={styles.infoBubbleBlur}>
            <Ionicons name="information-circle" size={24} color="#0284c7" style={styles.infoBubbleIcon} />
            <Text style={styles.infoText}>
              Aquí puedes ver la ubicación de nuestra oficina.{"\n"}
              Si necesitas asistencia, no dudes en llamarnos.
            </Text>
            <TouchableOpacity
              style={styles.infoBubbleCloseButton}
              onPress={handleCloseInfoBubble}
              activeOpacity={0.6}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      )}

      {/* Top filter bar - Only for admin */}
      {user?.role === "admin" && (
        <Animated.View
          style={[styles.filterBar, { top: insets.top + (showInfoBubble ? 90 : 10) }, filterBarAnimatedStyle]}
          entering={FadeIn.duration(500).delay(300)}
        >
          <BlurView intensity={80} style={styles.filterBarBlur}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Chip
                selected={filter === null}
                onPress={() => handleFilterChange(null)}
                style={styles.filterChip}
                selectedColor={filter === null ? "white" : undefined}
                avatar={<Ionicons name="layers" size={16} color={filter === null ? "white" : "#6b7280"} />}
              >
                <Text style={{ color: filter === null ? "white" : "#6b7280" }}>Todos</Text>
              </Chip>

              <Chip
                selected={filter === "scheduled"}
                onPress={() => handleFilterChange("scheduled")}
                style={[styles.filterChip, filter === "scheduled" && { backgroundColor: "#0ea5e9" }]}
                selectedColor={filter === "scheduled" ? "white" : undefined}
                avatar={<Ionicons name="calendar" size={16} color={filter === "scheduled" ? "white" : "#0ea5e9"} />}
              >
                <Text style={{ color: filter === "scheduled" ? "white" : "#374151" }}>Programados</Text>
              </Chip>

              <Chip
                selected={filter === "in-progress"}
                onPress={() => handleFilterChange("in-progress")}
                style={[styles.filterChip, filter === "in-progress" && { backgroundColor: "#f59e0b" }]}
                selectedColor={filter === "in-progress" ? "white" : undefined}
                avatar={<Ionicons name="time" size={16} color={filter === "in-progress" ? "white" : "#f59e0b"} />}
              >
                <Text style={{ color: filter === "in-progress" ? "white" : "#374151" }}>En Progreso</Text>
              </Chip>

              <Chip
                selected={filter === "completed"}
                onPress={() => handleFilterChange("completed")}
                style={[styles.filterChip, filter === "completed" && { backgroundColor: "#10b981" }]}
                selectedColor={filter === "completed" ? "white" : undefined}
                avatar={<Ionicons name="checkmark" size={16} color={filter === "completed" ? "white" : "#10b981"} />}
              >
                <Text style={{ color: filter === "completed" ? "white" : "#374151" }}>Completados</Text>
              </Chip>
            </ScrollView>
          </BlurView>
        </Animated.View>
      )}

      {/* Map controls */}
      <View style={[styles.mapControls, { bottom: selectedMarker ? 220 : 40 }]}>
        <TouchableOpacity style={styles.mapControlButton} onPress={goToUserLocation} activeOpacity={0.7}>
          <BlurView intensity={80} style={styles.mapControlBlur}>
            <Ionicons name="locate" size={22} color="#0284c7" />
          </BlurView>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mapControlButton} onPress={zoomToTeslaOffice} activeOpacity={0.7}>
          <BlurView intensity={80} style={styles.mapControlBlur}>
            <Ionicons name="business" size={22} color="#0284c7" />
          </BlurView>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mapControlButton} onPress={toggleMapType} activeOpacity={0.7}>
          <BlurView intensity={80} style={styles.mapControlBlur}>
            <Ionicons
              name={mapType === "standard" ? "map" : mapType === "satellite" ? "globe" : "layers"}
              size={22}
              color="#0284c7"
            />
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* Selected marker info card */}
      {selectedMarker && (
        <Animated.View
          style={[styles.selectedMarkerInfo, infoCardAnimatedStyle]}
          entering={SlideInDown.duration(ANIMATION_DURATION)}
          exiting={SlideOutDown.duration(ANIMATION_DURATION)}
        >
          <View style={styles.selectedMarkerHandle} />

          <View style={styles.selectedMarkerHeader}>
            <View style={styles.selectedMarkerTitleContainer}>
              {selectedMarker.type === "office" && (
                <MaterialIcons name="business" size={24} color="#0284c7" style={styles.selectedMarkerIcon} />
              )}
              {selectedMarker.type === "maintenance" && (
                <Ionicons
                  name="construct"
                  size={24}
                  color={getMarkerColor(selectedMarker.status)}
                  style={styles.selectedMarkerIcon}
                />
              )}
              {selectedMarker.type === "user" && (
                <Ionicons name="person" size={24} color="#0284c7" style={styles.selectedMarkerIcon} />
              )}

              <Text style={styles.selectedMarkerTitle}>
                {selectedMarker.type === "office"
                  ? selectedMarker.title
                  : selectedMarker.type === "maintenance"
                    ? selectedMarker.clientName
                    : "Mi Ubicación"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseMarkerInfo}
              activeOpacity={0.6}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.selectedMarkerContent} nestedScrollEnabled={true}>
            <Text style={styles.selectedMarkerAddress}>
              {selectedMarker.type === "office"
                ? selectedMarker.description
                : selectedMarker.type === "maintenance"
                  ? selectedMarker.address
                  : "Esta es tu ubicación actual"}
            </Text>

            {selectedMarker.type === "maintenance" && (
              <>
                <View style={styles.selectedMarkerStatusRow}>
                  <View style={[styles.statusIndicator, { backgroundColor: getMarkerColor(selectedMarker.status) }]} />
                  <Text style={styles.selectedMarkerStatus}>{getStatusText(selectedMarker.status)}</Text>

                  {selectedMarker.status === "in-progress" && <Badge style={styles.progressBadge}>En curso</Badge>}
                </View>

                <View style={styles.selectedMarkerRow}>
                  <Ionicons name="calendar" size={16} color="#6b7280" />
                  <Text style={styles.selectedMarkerDetail}>
                    {new Date(selectedMarker.scheduledDate).toLocaleDateString()} -{" "}
                    {new Date(selectedMarker.scheduledDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>

                <Divider style={styles.divider} />

                <Text style={styles.sectionTitle}>Detalles del Servicio</Text>

                <View style={styles.detailsCard}>
                  <View style={styles.detailRow}>
                    <Ionicons name="build-outline" size={16} color="#6b7280" />
                    <Text style={styles.detailLabel}>Tipo:</Text>
                    <Text style={styles.detailValue}>Mantenimiento Preventivo</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#6b7280" />
                    <Text style={styles.detailLabel}>Duración:</Text>
                    <Text style={styles.detailValue}>2 horas aprox.</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color="#6b7280" />
                    <Text style={styles.detailLabel}>Técnico:</Text>
                    <Text style={styles.detailValue}>
                      {selectedMarker.assignedTechId ? "Técnico " + selectedMarker.assignedTechId : "Sin asignar"}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {selectedMarker.type === "office" && (
              <>
                <View style={styles.officeInfoCard}>
                  <View style={styles.officeInfoRow}>
                    <Ionicons name="call-outline" size={16} color="#6b7280" />
                    <Text style={styles.officeInfoLabel}>Teléfono:</Text>
                    <Text style={styles.officeInfoValue}>+593 968 100 793</Text>
                  </View>

                  <View style={styles.officeInfoRow}>
                    <Ionicons name="time-outline" size={16} color="#6b7280" />
                    <Text style={styles.officeInfoLabel}>Horario:</Text>
                    <Text style={styles.officeInfoValue}>Lun-Vie: 8:00 - 18:00</Text>
                  </View>

                  <View style={styles.officeInfoRow}>
                    <Ionicons name="mail-outline" size={16} color="#6b7280" />
                    <Text style={styles.officeInfoLabel}>Email:</Text>
                    <Text style={styles.officeInfoValue}>info@teslalift.com</Text>
                  </View>
                </View>
              </>
            )}

            {routeToMarker.length > 0 && (
              <View style={styles.routeInfoCard}>
                <View style={styles.routeHeader}>
                  <Ionicons name="navigate" size={20} color="#0284c7" />
                  <Text style={styles.routeTitle}>Información de Ruta</Text>
                </View>

                <View style={styles.routeDetails}>
                  <View style={styles.routeDetail}>
                    <Text style={styles.routeLabel}>Distancia:</Text>
                    <Text style={styles.routeValue}>{distance ? distance.toFixed(1) + " km" : "Calculando..."}</Text>
                  </View>

                  <View style={styles.routeDetail}>
                    <Text style={styles.routeLabel}>Tiempo estimado:</Text>
                    <Text style={styles.routeValue}>{duration ? duration + " min" : "Calculando..."}</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.selectedMarkerActions}>
            {selectedMarker.type === "maintenance" && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.detailsButtonStyle]}
                  onPress={() => {
                    /* Would navigate to details */
                    console.log("Navegando a detalles")
                  }}
                  activeOpacity={0.6}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <Ionicons name="information" size={20} color="white" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Ver detalles</Text>
                </TouchableOpacity>

                {user?.role === "technician" && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      routeToMarker.length > 0 ? styles.navigationActiveButtonStyle : styles.navigationButtonStyle,
                    ]}
                    onPress={calculateRoute}
                    activeOpacity={0.6}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    disabled={isProcessingAction}
                  >
                    <Ionicons
                      name="navigate"
                      size={20}
                      color={routeToMarker.length > 0 ? "white" : "#0284c7"}
                      style={styles.buttonIcon}
                    />
                    <Text style={[styles.buttonText, { color: routeToMarker.length > 0 ? "white" : "#0284c7" }]}>
                      {routeToMarker.length > 0 ? "Ver otra ruta" : "Navegar"}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {selectedMarker.type === "office" && (
              <TouchableOpacity
                style={[styles.actionButton, styles.callButtonStyle]}
                onPress={handleCallPress}
                activeOpacity={0.6}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                disabled={isProcessingAction}
              >
                <Ionicons name="call" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Llamar</Text>
              </TouchableOpacity>
            )}

            {selectedMarker.type === "user" && (
              <TouchableOpacity
                style={[styles.actionButton, styles.callButtonStyle]}
                onPress={handleCloseMarkerInfo}
                activeOpacity={0.6}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                disabled={isProcessingAction}
              >
                <Ionicons name="checkmark" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Entendido</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0284c7",
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9fafb",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ef4444",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  errorButtonContainer: {
    backgroundColor: "#0284c7",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  errorButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  infoBubble: {
    position: "absolute",
    left: 10,
    right: 10,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  infoBubbleBlur: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "white",
  },
  infoBubbleIcon: {
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
  infoBubbleCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(243, 244, 246, 0.8)",
    zIndex: 20,
  },
  filterBar: {
    position: "absolute",
    left: 10,
    right: 10,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 5,
  },
  filterBarBlur: {
    padding: 8,
    borderRadius: 12,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  officeMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  officeMarkerBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  maintenanceMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  maintenanceMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  markerShadow: {
    position: "absolute",
    bottom: -4,
    width: 16,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
    transform: [{ scaleX: 1.5 }],
  },
  techMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  techMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  techMarkerShadow: {
    position: "absolute",
    bottom: -4,
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#059669",
    opacity: 0.3,
    transform: [{ scaleX: 1.5 }],
  },
  userMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  userMarkerBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0284c7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  userMarkerRing: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "rgba(2, 132, 199, 0.3)",
  },
  calloutContainer: {
    width: 200,
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
    color: "#1f2937",
  },
  calloutDescription: {
    fontSize: 12,
    color: "#4b5563",
    marginBottom: 4,
  },
  calloutStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  calloutStatusText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  calloutTime: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  mapControls: {
    position: "absolute",
    right: 16,
    flexDirection: "column",
    zIndex: 5,
  },
  mapControlButton: {
    marginBottom: 12,
    borderRadius: 22,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapControlBlur: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedMarkerInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    maxHeight: "50%",
    zIndex: 10,
  },
  selectedMarkerHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  selectedMarkerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedMarkerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedMarkerIcon: {
    marginRight: 8,
  },
  selectedMarkerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
  },
  selectedMarkerContent: {
    maxHeight: 200,
  },
  selectedMarkerAddress: {
    color: "#4b5563",
    marginBottom: 12,
  },
  selectedMarkerStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  selectedMarkerStatus: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginRight: 8,
  },
  progressBadge: {
    backgroundColor: "#f59e0b",
    color: "white",
  },
  selectedMarkerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedMarkerDetail: {
    marginLeft: 8,
    color: "#4b5563",
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 8,
  },
  detailsCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    marginLeft: 8,
    color: "#6b7280",
    width: 70,
  },
  detailValue: {
    color: "#1f2937",
    fontWeight: "500",
    flex: 1,
  },
  officeInfoCard: {
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  officeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  officeInfoLabel: {
    marginLeft: 8,
    color: "#0284c7",
    width: 70,
  },
  officeInfoValue: {
    color: "#1f2937",
    fontWeight: "500",
    flex: 1,
  },
  routeInfoCard: {
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#0284c7",
  },
  routeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0284c7",
    marginLeft: 8,
  },
  routeDetails: {
    marginLeft: 28,
  },
  routeDetail: {
    flexDirection: "row",
    marginBottom: 4,
  },
  routeLabel: {
    color: "#6b7280",
    width: 110,
  },
  routeValue: {
    color: "#1f2937",
    fontWeight: "500",
  },
  selectedMarkerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(243, 244, 246, 0.8)",
    zIndex: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 14,
    color: "white",
  },
  detailsButtonStyle: {
    backgroundColor: "#0284c7",
    flex: 1,
    marginRight: 8,
  },
  callButtonStyle: {
    backgroundColor: "#0284c7",
    flex: 1,
  },
  navigationButtonStyle: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#0284c7",
    flex: 1,
    marginLeft: 8,
  },
  navigationActiveButtonStyle: {
    backgroundColor: "#f59e0b",
    flex: 1,
    marginLeft: 8,
  },
})

