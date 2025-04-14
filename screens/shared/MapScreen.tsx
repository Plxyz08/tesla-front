"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native"
import MapView, { Marker, PROVIDER_GOOGLE, Callout, Circle, type MapStyleElement, type Region } from "react-native-maps"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
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
  const mapRef = useRef<MapView>(null)
  const insets = useSafeAreaInsets()

  // State variables
  const [selectedMarker, setSelectedMarker] = useState<any>(null)
  const [initialRegion, setInitialRegion] = useState<Region | null>(null)
  const [userLocation, setUserLocation] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid">("standard")
  const [isMapReady, setIsMapReady] = useState(false)
  const [showInfoBubble, setShowInfoBubble] = useState(true)
  const [isProcessingAction, setIsProcessingAction] = useState(false)

  // Animated values
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

  // Handle marker press
  const handleMarkerPress = useCallback(
    (marker: any) => {
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
        <ActivityIndicator size="large" color="#f7be0d" />
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
              <MaterialIcons name="business" size={24} color="#f7be0d" />
            </BlurView>
          </View>
          <Callout>
            <View style={styles.calloutContainer}>
              <Text style={styles.calloutTitle}>{TESLA_OFFICE.title}</Text>
              <Text style={styles.calloutDescription}>{TESLA_OFFICE.description}</Text>
            </View>
          </Callout>
        </Marker>

        {/* User location marker with accuracy circle */}
        {isMapReady && userLocation && (
          <>
            <Circle
              center={userLocation}
              radius={100}
              fillColor="rgba(247, 190, 13, 0.1)"
              strokeColor="rgba(247, 190, 13, 0.3)"
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
            <Ionicons name="information-circle" size={24} color="#f7be0d" style={styles.infoBubbleIcon} />
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

      {/* Map controls */}
      <View style={[styles.mapControls, { bottom: selectedMarker ? 220 : 40 }]}>
        <TouchableOpacity style={styles.mapControlButton} onPress={goToUserLocation} activeOpacity={0.7}>
          <BlurView intensity={80} style={styles.mapControlBlur}>
            <Ionicons name="locate" size={22} color="#f7be0d" />
          </BlurView>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mapControlButton} onPress={zoomToTeslaOffice} activeOpacity={0.7}>
          <BlurView intensity={80} style={styles.mapControlBlur}>
            <Ionicons name="business" size={22} color="#f7be0d" />
          </BlurView>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mapControlButton} onPress={toggleMapType} activeOpacity={0.7}>
          <BlurView intensity={80} style={styles.mapControlBlur}>
            <Ionicons
              name={mapType === "standard" ? "map" : mapType === "satellite" ? "globe" : "layers"}
              size={22}
              color="#f7be0d"
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
                <MaterialIcons name="business" size={24} color="#f7be0d" style={styles.selectedMarkerIcon} />
              )}
              {selectedMarker.type === "user" && (
                <Ionicons name="person" size={24} color="#f7be0d" style={styles.selectedMarkerIcon} />
              )}

              <Text style={styles.selectedMarkerTitle}>
                {selectedMarker.type === "office" ? selectedMarker.title : "Mi Ubicación"}
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

          <View style={styles.selectedMarkerContent}>
            <Text style={styles.selectedMarkerAddress}>
              {selectedMarker.type === "office" ? selectedMarker.description : "Esta es tu ubicación actual"}
            </Text>

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
          </View>

          <View style={styles.selectedMarkerActions}>
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
    color: "#f7be0d",
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
    backgroundColor: "#f7be0d",
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
  userMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  userMarkerBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f7be0d",
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
    borderColor: "rgba(247, 190, 13, 0.3)",
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
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  mapControls: {
    position: "absolute",
    top: 300,
    right: 16,
    flexDirection: "column",
    zIndex: 5,
  },
  mapControlButton: {
    backgroundColor: "white",
    marginBottom: 12,
    borderRadius: 22,
    overflow: "hidden",
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
    maxHeight: "40%",
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
    flex: 1,
  },
  selectedMarkerAddress: {
    color: "#4b5563",
    marginBottom: 12,
  },
  officeInfoCard: {
    backgroundColor: "#fffbeb",
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
    color: "#f7be0d",
    width: 70,
  },
  officeInfoValue: {
    color: "#1f2937",
    fontWeight: "500",
    flex: 1,
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
  callButtonStyle: {
    backgroundColor: "#f7be0d",
    flex: 1,
  },
})

