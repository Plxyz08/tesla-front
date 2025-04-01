"use client"

import { useEffect, useRef } from "react"
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, StatusBar } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated"
import { Ionicons } from "@expo/vector-icons"
import LottieView from "lottie-react-native"

const { width, height } = Dimensions.get("window")

interface LoadingScreenProps {
  message?: string
  progress?: number
  isInitialLoading?: boolean
}

export default function LoadingScreen({
  message = "Cargando...",
  progress,
  isInitialLoading = false,
}: LoadingScreenProps) {
  const rotation = useSharedValue(0)
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const lottieRef = useRef<LottieView>(null)

  // Animation for the logo
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1, // Infinite repetitions
      false, // Don't reverse the animation
    )

    scale.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true,
    )

    if (isInitialLoading) {
      opacity.value = withRepeat(
        withSequence(withTiming(0.7, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
        true,
      )
    }

    // Start Lottie animation if available
    if (lottieRef.current) {
      lottieRef.current.play()
    }
  }, [isInitialLoading, rotation, opacity, scale]) // Added scale to dependencies

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
      opacity: opacity.value,
    }
  })

  const renderProgressBar = () => {
    if (progress === undefined) return null

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
    )
  }

  // For initial app loading screen
  if (isInitialLoading) {
    return (
      <View style={styles.fullScreenContainer}>
        <StatusBar backgroundColor="#0ea5e9" barStyle="light-content" />
        <View style={styles.logoContainer}>
          <Animated.Image
            source={require("../../public/placeholder.svg")}
            style={[styles.logo, animatedStyle]}
            resizeMode="contain"
          />

          <Animated.Text entering={FadeIn.duration(1000)} style={styles.appName}>
            Tesla Lift
          </Animated.Text>

          <Animated.Text entering={FadeIn.delay(500).duration(1000)} style={styles.appTagline}>
            Mantenimiento de ascensores simplificado
          </Animated.Text>
        </View>

        <View style={styles.loadingIndicatorContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      </View>
    )
  }

  // For in-app loading screen
  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)}>
      <View style={styles.content}>
        {/* Use Lottie animation if available, otherwise use a simple spinner */}
        {false ? (
          <LottieView
            ref={lottieRef}
            // source={require("../../assets/loading-animation.json")}
            style={styles.lottieAnimation}
            autoPlay
            loop
          />
        ) : (
          <View style={styles.spinnerContainer}>
            <Animated.View style={[styles.spinner, animatedStyle]}>
              <Ionicons name="sync" size={32} color="#0ea5e9" />
            </Animated.View>
          </View>
        )}

        <Text style={styles.message}>{message}</Text>

        {renderProgressBar()}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  content: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 200,
  },
  spinnerContainer: {
    height: 60,
    width: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  spinner: {
    height: 60,
    width: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#e0f2fe",
    borderTopColor: "#0ea5e9",
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    fontSize: 16,
    color: "#4b5563",
    marginBottom: 16,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
  },
  progressBarContainer: {
    height: 8,
    width: "100%",
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#0ea5e9",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#6b7280",
  },
  lottieAnimation: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  // Full screen loading styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#0ea5e9",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  loadingIndicatorContainer: {
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "white",
  },
})

